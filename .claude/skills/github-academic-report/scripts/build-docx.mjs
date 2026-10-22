#!/usr/bin/env node
/**
 * Build the Word report from content JSON.
 *
 *   node scripts/build-docx.mjs --ws ./ws [--out ./ws/output/bao-cao.docx]
 *
 * Inputs : <ws>/content/report.json, <ws>/content/refs.json,
 *          <ws>/figures/manifest.json (optional)
 * Output : <ws>/output/bao-cao.docx
 *
 * The builder owns every formatting rule from the faculty guideline, so the
 * content files never carry page setup, fonts, or - crucially - numbers.
 * Figure / table / appendix / reference numbers and every cross-reference are
 * emitted as Word fields (SEQ / STYLEREF / REF / TOC / PAGE).
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  parseArgs, requireWs, readJson, exists, ensureDir, loadDeps, log, warn, fail,
  cmToTwip, cmToPx, sortRefs, bookmarkName, imageType, viCompare, fixBookmarkIds,
} from './lib/common.mjs';

const args = parseArgs();
if (args.help) { log('Usage: node scripts/build-docx.mjs --ws <dir> [--out file.docx]'); process.exit(0); }
const ws = requireWs(args);
const { docx: d, jszip: JSZip } = loadDeps(ws, ['docx', 'jszip']);

const {
  Document, Packer, Paragraph, TextRun, SimpleField, Bookmark, TableOfContents, ImageRun,
  Table, TableRow, TableCell, HeadingLevel, AlignmentType, LevelFormat, LevelSuffix,
  NumberFormat, Header, PageNumber, SectionType, WidthType, BorderStyle, VerticalAlign,
  ShadingType, TableLayoutType,
} = d;

/* =========================================================== guideline ==
 * Every number below is fixed by "HD viet bao cao Bai tap lon cao hoc.docx".
 * references/quy-dinh-trinh-bay.md names the clause behind each one.
 */
const G = {
  font: 'Times New Roman',
  size: 26,                                                     // 13pt   [QD-02]
  line: 312,                                                    // 1,3 lines [QD-03]
  page: { width: 11906, height: 16838 },                        // A4     [QD-01]
  margin: {
    top: cmToTwip(2.5), bottom: cmToTwip(2),
    left: cmToTwip(3.5), right: cmToTwip(2),
    header: cmToTwip(1.4), footer: cmToTwip(1),
  },                                                            //        [QD-04]
  firstLine: cmToTwip(1),
  hanging: cmToTwip(1),                                         //        [QD-14]
  maxImageCm: 15.5,                                             // 21 - 3,5 - 2
};
const SEQ = { figure: 'Hinh', table: 'Bang', appendix: 'PhuLuc', reference: 'TLTK' };
const LABEL = { figure: 'Hình', table: 'Bảng', appendix: 'Phụ lục' };

/* ================================================================ input */

const report = readJson(path.join(ws, 'content', 'report.json'));
const refsFile = readJson(path.join(ws, 'content', 'refs.json'), { references: [] });
const figManifest = readJson(path.join(ws, 'figures', 'manifest.json'), { figures: [] });
const figSizes = new Map((figManifest.figures || []).map((f) => [f.id, f]));

const cfg = { phuLucNumbering: 'sequential', captionChapterSource: 'styleref', ...(report.config || {}) };
const SEQ_MODE = cfg.captionChapterSource === 'seq';
const meta = report.meta || {};
for (const k of ['tenDeTai', 'hocPhan', 'nguoiHuongDan'])
  if (!meta[k]) fail(`report.json thieu meta.${k}`);

const arr = (x) => (Array.isArray(x) ? x : []);
report.chuongs = arr(report.chuongs);
if (!report.chuongs.length) fail('report.json phai co it nhat mot chuong trong "chuongs".');

/* ======================================================= index pre-pass */

const figures = new Map();
const tables = new Map();
const usedRefKeys = new Set();

report.chuongs.forEach((ch, ci) => {
  let nf = 0, nt = 0;
  for (const b of arr(ch.blocks)) {
    if (b.t === 'figure' && b.caption) {
      if (!b.id) fail(`Chuong ${ci + 1}: block figure thieu "id"`);
      if (figures.has(b.id)) fail(`Trung id hinh: ${b.id}`);
      figures.set(b.id, { chapter: ci + 1, index: ++nf, cached: `${LABEL.figure} ${ci + 1}.${nf}` });
    }
    if (b.t === 'table' && b.caption) {
      if (!b.id) fail(`Chuong ${ci + 1}: block table thieu "id"`);
      if (tables.has(b.id)) fail(`Trung id bang: ${b.id}`);
      tables.set(b.id, { chapter: ci + 1, index: ++nt, cached: `${LABEL.table} ${ci + 1}.${nt}` });
    }
  }
});

/* Chapter-scoped numbering only works inside a chapter. Fail loudly elsewhere. */
for (const [name, list] of [['loiNoiDau', report.loiNoiDau], ['moDau', report.moDau],
  ['ketLuan', report.ketLuan], ...arr(report.phuLucs).map((p, i) => [`phuLucs[${i}]`, p.blocks])])
  for (const b of arr(list))
    if ((b.t === 'figure' || b.t === 'table') && b.caption)
      fail(`${name}: hinh/bang co caption phai nam trong CHUONG (quy dinh danh so theo chuong).`,
        'Chuyen block vao mot chuong, hoac bo "caption" va dung "note" de mo ta.');

/* ------------------------------------------------------------ references */

/* Group by language FIRST (the list is printed group by group), sort inside each
 * group, then number in printed order so [n] always matches the list. */
const groupLabel = (r) => r.lang === 'vi' ? 'Tiếng Việt' : r.lang === 'en' ? 'Tiếng Anh' : (r.langLabel || 'Tài liệu khác');
const refGroups = new Map();
for (const r of arr(refsFile.references)) {
  const g = groupLabel(r);
  if (!refGroups.has(g)) refGroups.set(g, []);
  refGroups.get(g).push(r);
}
const groupOrder = ['Tiếng Việt', 'Tiếng Anh',
  ...[...refGroups.keys()].filter((k) => k !== 'Tiếng Việt' && k !== 'Tiếng Anh').sort(viCompare)];
const refs = [];
for (const g of groupOrder) {
  if (!refGroups.has(g)) continue;
  const sorted = sortRefs(refGroups.get(g));
  refGroups.set(g, sorted);
  refs.push(...sorted);
}
const refIndex = new Map();
refs.forEach((r, i) => {
  if (!r.key) fail('Moi tai lieu tham khao phai co "key"');
  if (refIndex.has(r.key)) fail(`Trung key tai lieu tham khao: ${r.key}`);
  refIndex.set(r.key, { n: i + 1, ref: r });
});

/* ====================================================== inline markup ==
 * [[cite:key]]  [[cite:k1,k2]]  [[xref:fig-id]]  **dam**  *nghieng*  `ma`
 */
const INLINE = /\[\[(cite|xref):([^\]]+)\]\]|\*\*([^*]+)\*\*|\*([^*\n]+)\*|`([^`]+)`/g;
const runBase = { font: G.font, size: G.size };

function refField(key) {
  const hit = refIndex.get(key);
  if (!hit) fail(`Trich dan toi tai lieu khong ton tai: [[cite:${key}]]`,
    'Them tai lieu vao content/refs.json hoac sua lai key.');
  usedRefKeys.add(key);
  return [
    new TextRun({ ...runBase, text: '[' }),
    new SimpleField(`REF ${bookmarkName('ref_', key)} \\h`, String(hit.n)),
    new TextRun({ ...runBase, text: ']' }),
  ];
}

function xrefField(id) {
  const hit = figures.get(id) || tables.get(id);
  if (!hit) fail(`Tham chieu cheo toi doi tuong khong ton tai: [[xref:${id}]]`,
    'Kiem tra lai "id" cua block figure/table (chi hinh/bang co caption moi tham chieu duoc).');
  return [new SimpleField(`REF ${bookmarkName('_Ref_', id)} \\h`, hit.cached)];
}

function inline(text, base = runBase) {
  const out = [];
  let last = 0;
  const src = String(text ?? '');
  src.replace(INLINE, (m, kind, argv, bold, ital, code, offset) => {
    if (offset > last) out.push(new TextRun({ ...base, text: src.slice(last, offset) }));
    if (kind === 'cite') {
      argv.split(',').map((s) => s.trim()).filter(Boolean)
        .forEach((k, i) => { if (i) out.push(new TextRun({ ...base, text: ', ' })); out.push(...refField(k)); });
    } else if (kind === 'xref') out.push(...xrefField(argv.trim()));
    else if (bold !== undefined) out.push(new TextRun({ ...base, text: bold, bold: true }));
    else if (ital !== undefined) out.push(new TextRun({ ...base, text: ital, italics: true }));
    else if (code !== undefined) out.push(new TextRun({ ...base, text: code, font: 'Consolas', size: 22 }));
    last = offset + m.length;
    return m;
  });
  if (last < src.length) out.push(new TextRun({ ...base, text: src.slice(last) }));
  return out.length ? out : [new TextRun({ ...base, text: '' })];
}

/* =============================================================== styles */

const paraBase = { spacing: { line: G.line, lineRule: 'auto', after: 0 }, alignment: AlignmentType.JUSTIFIED };
const headingStyle = (pt) => ({
  run: { font: G.font, size: pt * 2, bold: true, color: '000000' },
  paragraph: {
    spacing: { before: 240, after: 160, line: G.line, lineRule: 'auto' },
    alignment: AlignmentType.LEFT, keepNext: true, indent: { left: 0, firstLine: 0 },
  },
});

const styles = {
  default: {
    document: { run: runBase, paragraph: paraBase },
    heading1: headingStyle(14), heading2: headingStyle(13),
    heading3: headingStyle(13), heading4: headingStyle(13),
  },
  paragraphStyles: [
    { id: 'BodyText', name: 'Body Text', basedOn: 'Normal', next: 'BodyText', quickFormat: true,
      run: runBase,
      paragraph: { ...paraBase, indent: { firstLine: G.firstLine }, spacing: { line: G.line, lineRule: 'auto', after: 60 } } },
    { id: 'Caption', name: 'Caption', basedOn: 'Normal', next: 'BodyText', quickFormat: true,
      run: runBase,
      paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 100, after: 140, line: G.line, lineRule: 'auto' }, indent: { firstLine: 0 } } },
    { id: 'FigureImage', name: 'Figure Image', basedOn: 'Normal', next: 'Caption',
      paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 140, after: 40, line: 240, lineRule: 'auto' }, indent: { firstLine: 0 }, keepNext: true } },
    { id: 'FrontHeading', name: 'Front Heading', basedOn: 'Normal', next: 'BodyText',
      run: { font: G.font, size: 28, bold: true },
      paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 0, after: 240, line: G.line, lineRule: 'auto' }, indent: { firstLine: 0 }, keepNext: true } },
    { id: 'TableText', name: 'Table Text', basedOn: 'Normal', next: 'TableText',
      run: runBase,
      paragraph: { alignment: AlignmentType.LEFT, spacing: { before: 40, after: 40, line: 240, lineRule: 'auto' }, indent: { firstLine: 0 } } },
    { id: 'CodeBlock', name: 'Code Block', basedOn: 'Normal', next: 'BodyText',
      run: { font: 'Consolas', size: 20 },
      paragraph: {
        alignment: AlignmentType.LEFT, spacing: { before: 0, after: 0, line: 240, lineRule: 'auto' },
        indent: { left: cmToTwip(0.5), firstLine: 0 },
        shading: { type: ShadingType.CLEAR, fill: 'F4F4F4' },
      } },
    { id: 'RefItem', name: 'Reference Item', basedOn: 'Normal', next: 'RefItem',
      run: runBase,
      paragraph: { alignment: AlignmentType.JUSTIFIED, spacing: { before: 60, after: 60, line: G.line, lineRule: 'auto' },
        indent: { left: G.hanging, hanging: G.hanging } } },
    { id: 'RefGroup', name: 'Reference Group', basedOn: 'Normal', next: 'RefItem',
      run: { font: G.font, size: G.size, bold: true, italics: true },
      paragraph: { alignment: AlignmentType.LEFT, spacing: { before: 200, after: 100, line: G.line, lineRule: 'auto' }, indent: { firstLine: 0 } } },
    { id: 'CoverLine', name: 'Cover Line', basedOn: 'Normal', next: 'CoverLine',
      run: runBase,
      paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0, line: G.line, lineRule: 'auto' }, indent: { firstLine: 0 } } },
    { id: 'NoteText', name: 'Note Text', basedOn: 'Normal', next: 'BodyText',
      run: { font: G.font, size: 24, italics: true },
      paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 40, after: 140, line: 240, lineRule: 'auto' }, indent: { firstLine: 0 } } },
  ],
};

/* ============================================================ numbering */

const lvl = (level, text) => ({
  level, format: LevelFormat.DECIMAL, text, alignment: AlignmentType.START,
  suffix: LevelSuffix.SPACE, style: { paragraph: { indent: { left: 0, firstLine: 0 } } },
});
const numbering = {
  config: [
    { reference: 'chuong', levels: [lvl(0, 'CHƯƠNG %1:'), lvl(1, '%1.%2'), lvl(2, '%1.%2.%3'), lvl(3, '%1.%2.%3.%4')] },
    { reference: 'bullets', levels: [
      { level: 0, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.START,
        style: { paragraph: { indent: { left: cmToTwip(1), hanging: cmToTwip(0.5) } } } },
      { level: 1, format: LevelFormat.BULLET, text: '+', alignment: AlignmentType.START,
        style: { paragraph: { indent: { left: cmToTwip(1.75), hanging: cmToTwip(0.5) } } } },
    ] },
    { reference: 'ordered', levels: [
      { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.START,
        style: { paragraph: { indent: { left: cmToTwip(1), hanging: cmToTwip(0.5) } } } },
      { level: 1, format: LevelFormat.LOWER_LETTER, text: '%2)', alignment: AlignmentType.START,
        style: { paragraph: { indent: { left: cmToTwip(1.75), hanging: cmToTwip(0.5) } } } },
    ] },
  ],
};

/* ========================================================= field helpers */

/** Chapter number for a caption - read from the document, never typed. */
const chapterNumberField = () =>
  SEQ_MODE ? new SimpleField('SEQ Chuong \\c') : new SimpleField('STYLEREF 1 \\s');

/** In SEQ mode the heading number itself is a chain of SEQ fields. */
function headingNumberRuns(level) {
  if (!SEQ_MODE) return null;
  const t = (s) => new TextRun({ font: G.font, size: level === 1 ? 28 : G.size, bold: true, text: s });
  if (level === 1) return [t('CHƯƠNG '), new SimpleField('SEQ Chuong \\* ARABIC'), t(': ')];
  const out = [new SimpleField('SEQ Chuong \\c')];
  for (let l = 2; l < level; l++) { out.push(t('.'), new SimpleField(`SEQ Muc${l} \\c`)); }
  out.push(t('.'), new SimpleField(`SEQ Muc${level} \\* ARABIC \\s ${level - 1}`), t(' '));
  return out;
}

function headingParagraph(level, text, { pageBreak = false, numbered = true } = {}) {
  const size = level === 1 ? 28 : G.size;
  const runs = inline(text, { font: G.font, size, bold: true });
  const prefix = numbered ? headingNumberRuns(level) : null;
  return new Paragraph({
    heading: HeadingLevel[`HEADING_${level}`],
    numbering: numbered && !SEQ_MODE ? { reference: 'chuong', level: level - 1 } : undefined,
    pageBreakBefore: pageBreak,
    alignment: level === 1 && !numbered ? AlignmentType.CENTER : AlignmentType.LEFT,
    children: prefix ? [...prefix, ...runs] : runs,
  });
}

/** "Hinh {chuong}.{n}." - both numbers live, wrapped in the xref bookmark. */
function captionParagraph(kind, id, captionText, info) {
  return new Paragraph({
    style: 'Caption',
    keepNext: kind === 'table',
    children: [
      new Bookmark({
        id: bookmarkName('_Ref_', id),
        children: [
          new TextRun({ ...runBase, text: `${LABEL[kind]} ` }),
          chapterNumberField(),
          new TextRun({ ...runBase, text: '.' }),
          new SimpleField(`SEQ ${SEQ[kind]} \\* ARABIC \\s 1`, String(info.index)),
        ],
      }),
      new TextRun({ ...runBase, text: '. ' }),
      ...inline(captionText),
    ],
  });
}

/* ============================================================== blocks */

function imageParagraph(b) {
  const rel = b.src || (b.id ? `figures/${b.id}.png` : null);
  if (!rel) fail(`Block figure "${b.id || '?'}" thieu "src".`);
  if (/\.svg$/i.test(rel)) fail(`Word khong nhung truc tiep SVG: ${rel}`, 'Render sang PNG bang scripts/render-figures.mjs.');
  const abs = path.isAbsolute(rel) ? rel : path.join(ws, rel);
  if (!exists(abs)) fail(`Khong tim thay file hinh: ${abs}`,
    `Chay: node scripts/render-figures.mjs --ws "${ws}"`);
  const dim = figSizes.get(b.id);
  const natural = dim && dim.width ? { w: dim.width, h: dim.height } : { w: 1200, h: 800 };
  const widthCm = Math.min(b.widthCm || 14, G.maxImageCm);
  const w = cmToPx(widthCm);
  const label = b.caption || b.id || 'figure';
  return new Paragraph({
    style: 'FigureImage',
    children: [new ImageRun({
      type: imageType(abs),
      data: fs.readFileSync(abs),
      transformation: { width: w, height: Math.round(w * natural.h / natural.w) },
      altText: { name: String(b.id || 'figure'), title: label, description: label },
    })],
  });
}

function tableBlock(b, { numbered = true } = {}) {
  const header = b.header || [];
  const rows = b.rows || [];
  const cols = Math.max(header.length, ...rows.map((r) => r.length), 1);
  const widths = b.widths && b.widths.length === cols ? b.widths : Array(cols).fill(Math.round(100 / cols));
  const border = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
  const align = (i) => b.align?.[i] === 'center' ? AlignmentType.CENTER
    : b.align?.[i] === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT;
  const cell = (text, i, head) => new TableCell({
    width: { size: widths[i], type: WidthType.PERCENTAGE },
    verticalAlign: VerticalAlign.CENTER,
    shading: head ? { type: ShadingType.CLEAR, fill: 'EDEDED' } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({
      style: 'TableText',
      alignment: head ? AlignmentType.CENTER : align(i),
      children: inline(text, { ...runBase, bold: !!head }),
    })],
  });

  const trs = [];
  if (header.length) trs.push(new TableRow({ tableHeader: true, children: header.map((t, i) => cell(t, i, true)) }));
  for (const r of rows) trs.push(new TableRow({ children: Array.from({ length: cols }, (_, i) => cell(r[i] ?? '', i, false)) }));

  const out = [];
  if (numbered && b.caption) out.push(captionParagraph('table', b.id, b.caption, tables.get(b.id)));
  out.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
    rows: trs,
  }));
  out.push(b.source
    ? new Paragraph({ style: 'NoteText', children: inline(b.source) })
    : new Paragraph({ spacing: { after: 140, line: 240, lineRule: 'auto' }, children: [new TextRun('')] }));
  return out;
}

function renderBlock(b, ctx = {}) {
  switch (b.t) {
    case 'h2': case 'h3': case 'h4':
      return [headingParagraph(Number(b.t[1]), b.text, { numbered: ctx.numbered !== false })];
    case 'p':
      return [new Paragraph({ style: 'BodyText', children: inline(b.text) })];
    case 'bullets': case 'numbered':
      return arr(b.items).map((it) => {
        const text = typeof it === 'string' ? it : it.text;
        const level = typeof it === 'string' ? 0 : (it.level || 0);
        return new Paragraph({
          numbering: { reference: b.t === 'bullets' ? 'bullets' : 'ordered', level: Math.min(level, 1) },
          spacing: { line: G.line, lineRule: 'auto', before: 20, after: 20 },
          alignment: AlignmentType.JUSTIFIED,
          children: inline(text),
        });
      });
    case 'figure': {
      const out = [imageParagraph(b)];
      if (b.caption) {
        const info = figures.get(b.id);
        if (!info) fail(`Hinh "${b.id}" co caption nhung khong nam trong chuong nao.`);
        out.push(captionParagraph('figure', b.id, b.caption, info));
      } else if (b.note) out.push(new Paragraph({ style: 'NoteText', children: inline(b.note) }));
      return out;
    }
    case 'table': {
      if (b.caption && !tables.get(b.id)) fail(`Bang "${b.id}" co caption nhung khong nam trong chuong nao.`);
      return tableBlock(b, { numbered: !!b.caption });
    }
    case 'code': {
      const lines = b.lines || String(b.text || '').split(/\r?\n/);
      const out = lines.map((l) => new Paragraph({
        style: 'CodeBlock',
        children: [new TextRun({ text: String(l).replace(/^ +/, (m) => ' '.repeat(m.length)) || ' ' })],
      }));
      if (b.caption) out.push(new Paragraph({ style: 'NoteText', children: inline(b.caption) }));
      return out;
    }
    case 'quote':
      return [new Paragraph({ style: 'BodyText', indent: { left: cmToTwip(1), firstLine: 0 }, children: inline(b.text, { ...runBase, italics: true }) })];
    case 'note':
      return [new Paragraph({ style: 'NoteText', children: inline(b.text) })];
    case 'pagebreak':
      return [new Paragraph({ pageBreakBefore: true, children: [new TextRun('')] })];
    default:
      return fail(`Block type khong ho tro: "${b.t}"`);
  }
}
const renderBlocks = (list, ctx) => arr(list).flatMap((b) => renderBlock(b, ctx));

/* ============================================================== cover */

function coverSection() {
  const line = (text, o = {}) => new Paragraph({
    style: 'CoverLine',
    spacing: { before: o.before || 0, after: o.after || 0, line: G.line, lineRule: 'auto' },
    children: [new TextRun({ font: G.font, size: (o.pt || 13) * 2, bold: o.bold !== false, text })],
  });
  const blank = (n = 1) => Array.from({ length: n }, () => line(''));
  const members = arr(meta.thanhVien);
  const isGroup = (meta.hinhThuc || (members.length > 1 ? 'nhom' : 'ca-nhan')) === 'nhom';

  const who = [];
  if (isGroup) {
    who.push(line('Nhóm thực hiện:', { pt: 13 }));
    members.forEach((m, i) => who.push(line(`${i + 1}. ${m.hoTen} — ${m.maHocVien}`, { pt: 13, bold: false })));
  } else {
    const m = members[0] || {};
    who.push(line(`Học viên: ${m.hoTen || '.....................'}${m.maHocVien ? ` — ${m.maHocVien}` : ''}`, { pt: 13, bold: false }));
  }

  return [
    line(meta.daiHoc || 'ĐẠI HỌC CÔNG NGHIỆP HÀ NỘI', { pt: 14 }),
    line(meta.truong || 'TRƯỜNG CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG', { pt: 14 }),
    line('---------------------------------------', { bold: false }),
    ...blank(3),
    line(meta.loaiBaoCao || 'BÁO CÁO BÀI TẬP LỚN', { pt: 18, after: 140 }),
    line(`HỌC PHẦN: ${String(meta.hocPhan).toUpperCase()}`, { pt: 14 }),
    ...blank(3),
    line(String(meta.tenDeTai).toUpperCase(), { pt: 16, after: 140 }),
    ...blank(4),
    line(`Người hướng dẫn: ${meta.nguoiHuongDan}`, { pt: 13, bold: false }),
    line(''),
    ...who,
    line(`Lớp: ${meta.lop || '……………'}      Khóa: ${meta.khoaHoc || meta.khoa || '……………'}`, { pt: 13, bold: false }),
    ...blank(4),
    line(`${meta.diaDiem || 'Hà Nội'} – Năm ${meta.nam || new Date().getFullYear()}`, { pt: 13 }),
  ];
}

/* =============================================== front matter helpers */

/** Top-level, un-numbered heading that still shows up in the TOC. */
const topHeading = (text, pageBreak = true) => headingParagraph(1, text, { pageBreak, numbered: false });

function abbreviationTable() {
  const rows = [...arr(report.abbreviations)].sort((a, b) => viCompare(a.viet_tat || '', b.viet_tat || ''));
  const hasMeaning = rows.some((r) => r.nghia);
  return tableBlock({
    header: hasMeaning ? ['Chữ viết tắt', 'Thuật ngữ đầy đủ', 'Nghĩa tiếng Việt'] : ['Chữ viết tắt', 'Thuật ngữ đầy đủ'],
    rows: rows.map((r) => hasMeaning ? [r.viet_tat, r.day_du, r.nghia || ''] : [r.viet_tat, r.day_du]),
    widths: hasMeaning ? [18, 42, 40] : [25, 75],
  }, { numbered: false });
}

/* ---------------------------------------------------------- references */

const pageWord = (r) => (r.lang === 'vi' ? 'Tr.' : 'pp.');

function refRuns(r) {
  const out = [];
  const push = (t, o) => out.push(new TextRun({ ...runBase, text: t, ...o }));
  push(`${arr(r.authors).join(', ') || r.organization || ''} (${r.year}), `);
  switch (r.type) {
    case 'article': case 'conference':
      push(`“${r.title}”, `);
      push(r.journal || r.proceedings || '', { italics: true });
      push(', ');
      if (r.volume) push(String(r.volume));
      if (r.issue) push(`(${r.issue})`);
      if (r.volume || r.issue) push(', ');
      if (r.pages) push(`${pageWord(r)} ${r.pages}`);
      push('.');
      break;
    case 'thesis':
      push(r.title, { italics: true });
      push(`, ${r.degree || 'Luận văn'}, ${r.institution || ''}${r.place ? `, ${r.place}` : ''}.`);
      break;
    case 'web': case 'docs': case 'standard': case 'repo':
      push(`“${r.title}”, `);
      push(r.site || r.publisher || '', { italics: true });
      push(`, ${r.url}`);
      push(r.verified?.accessed ? ` (truy cập ngày ${r.verified.accessed}).` : '.');
      break;
    default:
      push(r.title, { italics: true });
      push(`, ${r.publisher || ''}${r.place ? `, ${r.place}` : ''}.`);
  }
  return out;
}

function referenceParagraphs() {
  const out = [];
  for (const g of groupOrder) {
    const items = refGroups.get(g);
    if (!items?.length) continue;
    out.push(new Paragraph({ style: 'RefGroup', children: [new TextRun({ font: G.font, size: G.size, bold: true, italics: true, text: g })] }));
    for (const r of items)
      out.push(new Paragraph({
        style: 'RefItem',
        children: [
          new TextRun({ ...runBase, text: '[' }),
          new Bookmark({ id: bookmarkName('ref_', r.key), children: [new SimpleField(`SEQ ${SEQ.reference} \\* ARABIC`, String(refIndex.get(r.key).n))] }),
          new TextRun({ ...runBase, text: ']\t' }),
          ...refRuns(r),
        ],
      }));
  }
  return out;
}

/* ----------------------------------------------------------- appendices */

function appendixParagraphs() {
  const out = [];
  arr(report.phuLucs).forEach((ap, i) => {
    const t = (s) => new TextRun({ font: G.font, size: G.size, bold: true, text: s });
    const num = cfg.phuLucNumbering === 'theo-chuong'
      ? [chapterNumberField(), t('.'), new SimpleField(`SEQ ${SEQ.appendix} \\* ARABIC \\s 1`, String(i + 1))]
      : [new SimpleField(`SEQ ${SEQ.appendix} \\* ARABIC`, String(i + 1))];
    out.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      pageBreakBefore: i > 0,
      children: [t(`${LABEL.appendix} `), ...num, t(`. ${ap.title}`)],
    }));
    out.push(...renderBlocks(ap.blocks, { numbered: false }));
  });
  return out;
}

/* ============================================================ assembly */

const pageProps = (extra = {}) => ({ size: G.page, margin: G.margin, ...extra });
const emptyHeader = () => new Header({ children: [new Paragraph({ children: [new TextRun('')] })] });
const numberHeader = () => new Header({
  children: [new Paragraph({
    alignment: AlignmentType.CENTER, indent: { firstLine: 0 },
    children: [new TextRun({ font: G.font, size: G.size, children: [PageNumber.CURRENT] })],
  })],
});

const frontChildren = [topHeading('LỜI NÓI ĐẦU', false), ...renderBlocks(report.loiNoiDau)];
if (arr(report.abbreviations).length) {
  frontChildren.push(topHeading('DANH MỤC CÁC THUẬT NGỮ, KÝ HIỆU VÀ CÁC CHỮ VIẾT TẮT'));
  frontChildren.push(...abbreviationTable());
}
frontChildren.push(topHeading('DANH MỤC HÌNH VẼ'));
frontChildren.push(new TableOfContents('DANH MUC HINH VE', { hyperlink: true, captionLabelIncludingNumbers: SEQ.figure }));
frontChildren.push(topHeading('DANH MỤC BẢNG BIỂU'));
frontChildren.push(new TableOfContents('DANH MUC BANG BIEU', { hyperlink: true, captionLabelIncludingNumbers: SEQ.table }));

const bodyChildren = [topHeading('MỞ ĐẦU', false), ...renderBlocks(report.moDau)];
for (const ch of report.chuongs) {
  bodyChildren.push(headingParagraph(1, String(ch.title).toUpperCase(), { pageBreak: true, numbered: true }));
  bodyChildren.push(...renderBlocks(ch.blocks));
}
bodyChildren.push(topHeading('KẾT LUẬN VÀ KIẾN NGHỊ'), ...renderBlocks(report.ketLuan));
bodyChildren.push(topHeading('TÀI LIỆU THAM KHẢO'), ...referenceParagraphs());
if (arr(report.phuLucs).length) bodyChildren.push(topHeading('PHỤ LỤC'), ...appendixParagraphs());

const doc = new Document({
  creator: arr(meta.thanhVien).map((m) => m.hoTen).join(', ') || 'Hoc vien',
  title: meta.tenDeTai,
  description: `Bao cao ${meta.hocPhan} - ${meta.tenDeTai}`,
  features: { updateFields: true },
  styles, numbering,
  sections: [
    { properties: { page: pageProps() }, headers: { default: emptyHeader() }, children: coverSection() },
    { properties: { type: SectionType.NEXT_PAGE, page: pageProps() }, headers: { default: emptyHeader() },
      children: [
        new Paragraph({ style: 'FrontHeading', children: [new TextRun({ font: G.font, size: 28, bold: true, text: 'MỤC LỤC' })] }),
        new TableOfContents('MUC LUC', { hyperlink: true, headingStyleRange: '1-4' }),
      ] },
    { properties: { type: SectionType.NEXT_PAGE, page: pageProps({ pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN } }) },
      headers: { default: numberHeader() }, children: frontChildren },
    { properties: { type: SectionType.NEXT_PAGE, page: pageProps({ pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } }) },
      headers: { default: numberHeader() }, children: bodyChildren },
  ],
});

/* =============================================================== write */

const outPath = args.out ? path.resolve(String(args.out)) : path.join(ws, 'output', 'bao-cao.docx');
ensureDir(path.dirname(outPath));

let buf = await Packer.toBuffer(doc);
buf = await fixBookmarkIds(JSZip, buf);
fs.writeFileSync(outPath, buf);

const unused = refs.filter((r) => !usedRefKeys.has(r.key));
log('');
log(`  Da tao ${outPath}  (${(buf.length / 1024).toFixed(0)} KB)`);
log(`  Chuong: ${report.chuongs.length} | Hinh: ${figures.size} | Bang: ${tables.size} | Tai lieu: ${refs.length}`);
log(`  Che do so chuong trong caption: ${cfg.captionChapterSource}`);
if (unused.length) warn(`${unused.length} tai lieu chua duoc trich dan: ${unused.map((r) => r.key).join(', ')}`);
log('');
log('  MO BANG WORD -> chon "Yes" khi duoc hoi cap nhat truong -> Ctrl+A roi F9 (2 lan)');
log('  de dien so trang cho MUC LUC va danh muc hinh/bang.');
