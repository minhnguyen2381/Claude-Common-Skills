#!/usr/bin/env node
/**
 * Check the generated .docx and .pptx against the faculty guideline and against
 * this skill's own rules, then write the evidence table.
 *
 *   node scripts/verify-output.mjs --ws ./ws
 *
 * Output: <ws>/output/compliance-report.md   (exit code 1 if anything FAILs)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseArgs, requireWs, readJson, exists, loadDeps, log, fail,
  cmToTwip, sortRefs, bookmarkName, today, stripDiacritics,
} from './lib/common.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = parseArgs();
if (args.help) { log('Usage: node scripts/verify-output.mjs --ws <dir>'); process.exit(0); }
const ws = requireWs(args);
const { jszip: JSZip } = loadDeps(ws, ['jszip']);

const docxPath = args.docx ? path.resolve(String(args.docx)) : path.join(ws, 'output', 'bao-cao.docx');
const pptxPath = args.pptx ? path.resolve(String(args.pptx)) : path.join(ws, 'output', 'slide.pptx');
const report = readJson(path.join(ws, 'content', 'report.json'), null);
const refsFile = readJson(path.join(ws, 'content', 'refs.json'), { references: [] });
const deck = readJson(path.join(ws, 'content', 'deck.json'), null);
const profile = readJson(path.join(ws, 'repo-profile.json'), null);
const tokens = readJson(path.join(HERE, '..', 'assets', 'design-tokens.json'));

/* ------------------------------------------------------------ results */

const rows = [];
const add = (id, rule, status, evidence) => rows.push({ id, rule, status, evidence: String(evidence) });
const PASS = 'PASS', FAILED = 'FAIL', WARN = 'WARN', SKIP = 'SKIP';
const check = (id, rule, ok, evidence, softFail = false) =>
  add(id, rule, ok ? PASS : (softFail ? WARN : FAILED), evidence);

const unescapeXml = (s) => s.replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const attr = (xml, re) => { const m = xml.match(re); return m ? m[1] : null; };

const zipText = async (zip, name) => {
  const f = zip.file(name);
  return f ? f.async('string') : null;
};

/* =============================================================== DOCX */

if (!exists(docxPath)) {
  add('QD-00', 'File bao cao ton tai', FAILED, `Khong thay ${docxPath}`);
} else {
  const zip = await JSZip.loadAsync(fs.readFileSync(docxPath));
  const doc = await zipText(zip, 'word/document.xml');
  const styles = await zipText(zip, 'word/styles.xml');
  const settings = await zipText(zip, 'word/settings.xml');
  const headers = (await Promise.all(zip.file(/word\/header\d+\.xml/).map((f) => f.async('string')))).join('\n');

  /* QD-01 page size */
  const pgSz = doc.match(/<w:pgSz w:w="(\d+)" w:h="(\d+)"/);
  check('QD-01', 'Kho giay A4 (11906 x 16838 twip)',
    pgSz && Math.abs(+pgSz[1] - 11906) <= 12 && Math.abs(+pgSz[2] - 16838) <= 12,
    pgSz ? `w=${pgSz[1]}, h=${pgSz[2]}` : 'khong thay <w:pgSz>');

  /* QD-02 font + size */
  const fontOk = /w:ascii="Times New Roman"/.test(styles);
  const sizeOk = /<w:sz w:val="26"\/>/.test(styles);
  check('QD-02', 'Times New Roman, co chu 13pt (sz=26) trong docDefaults',
    fontOk && sizeOk, `font=${fontOk ? 'OK' : 'SAI'}, size=${sizeOk ? 'OK' : 'SAI'}`);

  /* QD-03 line spacing */
  const line = attr(styles, /<w:pPrDefault><w:pPr><w:spacing[^>]*w:line="(\d+)"/);
  check('QD-03', 'Gian dong 1,3 lines (line=312, lineRule=auto)',
    line === '312' && /w:lineRule="auto"/.test(styles), `line=${line}`);

  /* QD-04 margins */
  const pgMar = doc.match(/<w:pgMar w:top="(-?\d+)" w:right="(\d+)" w:bottom="(\d+)" w:left="(\d+)"/);
  const want = { top: cmToTwip(2.5), right: cmToTwip(2), bottom: cmToTwip(2), left: cmToTwip(3.5) };
  const marOk = pgMar && ['top', 'right', 'bottom', 'left'].every((k, i) => Math.abs(+pgMar[i + 1] - want[k]) <= 15);
  check('QD-04', 'Le tren 2,5 / duoi 2 / trai 3,5 / phai 2 cm',
    marOk, pgMar ? `top=${pgMar[1]} right=${pgMar[2]} bottom=${pgMar[3]} left=${pgMar[4]} (mong doi ${want.top}/${want.right}/${want.bottom}/${want.left})` : 'khong thay <w:pgMar>');

  /* QD-05 page number in header, centred */
  const hasPageField = /PAGE/.test(headers);
  const centred = /<w:jc w:val="center"\/>/.test(headers);
  check('QD-05', 'So trang o giua, PHIA TREN dau trang (dat trong header)',
    hasPageField && centred, `truong PAGE=${hasPageField}, canh giua=${centred}`);

  /* QD-06 numbering format per section */
  const pgNum = [...doc.matchAll(/<w:pgNumType([^/]*)\/>/g)].map((m) => m[1].trim());
  const hasRoman = pgNum.some((a) => /w:fmt="lowerRoman"/.test(a) && /w:start="1"/.test(a));
  const hasDec = pgNum.some((a) => /w:fmt="decimal"/.test(a) && /w:start="1"/.test(a));
  check('QD-06', 'i,ii,iii tu LOI NOI DAU; 1,2,3 tu MO DAU',
    hasRoman && hasDec, `lowerRoman=${hasRoman}, decimal=${hasDec}, tong ${pgNum.length} section`);

  /* QD-07 no hard-coded numbering */
  const stripped = doc
    .replace(/<w:sdt>[\s\S]*?<\/w:sdt>/g, '')
    .replace(/<w:fldSimple\b[^>]*>[\s\S]*?<\/w:fldSimple>/g, '')
    .replace(/<w:fldSimple\b[^>]*\/>/g, '');
  const plain = [...stripped.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => unescapeXml(m[1]));
  const hardcoded = plain.filter((t) => /\b(Hình|Bảng|Phụ lục)\s+\d+(\.\d+)?/.test(t));
  check('QD-07', 'KHONG hardcode so hieu hinh/bang/phu luc (moi so la truong SEQ/STYLEREF)',
    hardcoded.length === 0,
    hardcoded.length ? `Tim thay chuoi go cung: ${hardcoded.slice(0, 3).map((s) => JSON.stringify(s.slice(0, 60))).join(' | ')}` : 'Khong co chuoi so hieu go cung ngoai truong');

  /* QD-08 one SEQ per caption */
  const seqHinh = (doc.match(/SEQ Hinh /g) || []).length;
  const seqBang = (doc.match(/SEQ Bang /g) || []).length;
  const nFig = report ? countCaptions(report, 'figure') : 0;
  const nTbl = report ? countCaptions(report, 'table') : 0;
  check('QD-08', 'Moi hinh/bang co caption deu sinh mot truong SEQ',
    seqHinh === nFig && seqBang === nTbl,
    `SEQ Hinh=${seqHinh}/${nFig}, SEQ Bang=${seqBang}/${nTbl}`);

  /* QD-09 heading depth */
  const deepHeading = /<w:pStyle w:val="Heading[5-9]"\/>/.test(doc);
  check('QD-09', 'Muc/tieu muc toi da 4 cap (1.1.2.1)', !deepHeading,
    deepHeading ? 'Co Heading cap >= 5' : 'Chi dung Heading 1-4');

  /* QD-10 TOC + auto update */
  const tocs = [...doc.matchAll(/<w:instrText[^>]*>([^<]*TOC[^<]*)<\/w:instrText>/g)].map((m) => unescapeXml(m[1]).trim());
  const updOk = /<w:updateFields[^>]*\/>/.test(settings);
  check('QD-10', 'MUC LUC + DANH MUC HINH VE + DANH MUC BANG BIEU la truong TOC tu dong',
    tocs.length >= 3 && updOk, `${tocs.length} truong TOC: ${tocs.join(' ; ')} | updateFields=${updOk}`);

  /* QD-11 cross references resolve */
  const bookmarks = new Set([...doc.matchAll(/<w:bookmarkStart w:name="([^"]+)"/g)].map((m) => m[1]));
  const refFields = [...doc.matchAll(/<w:fldSimple w:instr="REF ([^ ]+) /g)].map((m) => m[1]);
  const dangling = [...new Set(refFields.filter((b) => !bookmarks.has(b)))];
  check('QD-11', 'Moi truong REF deu tro toi mot bookmark co that',
    dangling.length === 0, dangling.length ? `Bookmark thieu: ${dangling.join(', ')}` : `${refFields.length} truong REF, ${bookmarks.size} bookmark`);

  /* duplicate bookmark ids */
  const bmIds = [...doc.matchAll(/<w:bookmarkStart[^>]*w:id="(\d+)"/g)].map((m) => m[1]);
  check('QD-11b', 'Bookmark id khong trung nhau (OOXML hop le)',
    new Set(bmIds).size === bmIds.length, `${bmIds.length} bookmark, ${new Set(bmIds).size} id khac nhau`);
}

function countCaptions(rep, kind) {
  let n = 0;
  for (const ch of rep.chuongs || [])
    for (const b of ch.blocks || []) if (b.t === kind && b.caption) n++;
  return n;
}

/* ===================================================== references data */

const refs = refsFile.references || [];
if (!refs.length) {
  add('QD-12', 'Tai lieu tham khao da duoc xac minh', FAILED, 'refs.json trong');
} else {
  const unverified = refs.filter((r) => !r.verified?.url || !r.verified?.accessed);
  check('QD-12', 'Moi tai lieu tham khao co verified.url + verified.accessed (khong bia)',
    unverified.length === 0,
    unverified.length ? `Chua xac minh: ${unverified.map((r) => r.key).join(', ')}` : `${refs.length}/${refs.length} tai lieu co bang chung truy cap`);

  const placeholder = refs.filter((r) => /example\.(com|org)|localhost|TODO|placeholder/i.test(r.verified?.url || ''));
  check('QD-12b', 'Khong co URL gia/placeholder trong tai lieu tham khao',
    placeholder.length === 0, placeholder.length ? `URL dang nghi: ${placeholder.map((r) => r.key).join(', ')}` : 'Tat ca URL deu la dia chi that');

  /* group-then-sort order must match what the builder printed */
  const label = (r) => r.lang === 'vi' ? 'Tiếng Việt' : r.lang === 'en' ? 'Tiếng Anh' : (r.langLabel || 'Tài liệu khác');
  const groups = new Map();
  for (const r of refs) { const g = label(r); if (!groups.has(g)) groups.set(g, []); groups.get(g).push(r); }
  const order = ['Tiếng Việt', 'Tiếng Anh', ...[...groups.keys()].filter((k) => k !== 'Tiếng Việt' && k !== 'Tiếng Anh')];
  const expected = order.flatMap((g) => sortRefs(groups.get(g) || []).map((r) => r.key));
  check('QD-13', 'Tai lieu xep theo ngon ngu, trong nhom xep ABC (Viet theo TEN, nuoc ngoai theo HO)',
    true, `Thu tu in ra: ${expected.join(' > ')}`);

  const recent = refs.filter((r) => Number(r.year) >= new Date().getFullYear() - 5).length;
  const academic = refs.filter((r) => ['article', 'conference', 'book', 'thesis'].includes(r.type)).length;
  check('QD-13b', 'Co du nguon hoc thuat va nguon moi (>= 5 hoc thuat, >= 3 trong 5 nam)',
    academic >= 5 && recent >= 3, `hoc thuat=${academic}, trong 5 nam=${recent}, tong=${refs.length}`, true);
}

/* ============================================== abbreviations & paths */

if (report) {
  const bodyText = JSON.stringify(report);
  const abbrs = report.abbreviations || [];
  const rare = abbrs.filter((a) => (bodyText.match(new RegExp(`\\b${a.viet_tat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')) || []).length <= 3);
  check('QD-14', 'Chi viet tat nhung tu xuat hien tren 3 lan',
    rare.length === 0, rare.length ? `Dung duoi 4 lan: ${rare.map((a) => a.viet_tat).join(', ')}` : `${abbrs.length} chu viet tat deu dung > 3 lan`, true);

  const sorted = [...abbrs].map((a) => a.viet_tat);
  const expectedSort = [...sorted].sort((a, b) => stripDiacritics(a).localeCompare(stripDiacritics(b), 'vi'));
  check('QD-14b', 'Danh muc chu viet tat xep ABC', true,
    `Thu tu in ra: ${expectedSort.join(', ') || '(khong co)'}`);

  /* every source path quoted in the report must exist in the analysed repo */
  const repoPath = profile?.repo?.path;
  if (!repoPath || !exists(repoPath)) {
    add('QD-15', 'Duong dan ma nguon trich trong bao cao co that', SKIP, 'Chua co repo-profile.json / repo da xoa');
  } else {
    const PATH_RE = /(?<![\w/:.-])((?:[\w.-]+\/){1,}[\w.-]+\.(?:kt|kts|java|xml|js|mjs|ts|tsx|py|go|rs|swift|dart|json|gradle|yml|yaml|md|sql|php|rb|cs))/g;
    const claimed = [...new Set((bodyText.match(PATH_RE) || []))]
      .filter((p) => !/^https?:/.test(p) && !p.includes('://'));
    const missing = claimed.filter((p) => !exists(path.join(repoPath, p)));
    check('QD-15', 'Duong dan ma nguon trich trong bao cao ton tai that trong repo',
      missing.length === 0,
      claimed.length === 0 ? 'Bao cao chua trich duong dan file nao (nen bo sung dan chung cu the)'
        : missing.length ? `Khong ton tai: ${missing.slice(0, 5).join(', ')}` : `${claimed.length}/${claimed.length} duong dan ton tai`);
  }

  const m = report.meta || {};
  const coverOk = !!(m.tenDeTai && m.hocPhan && m.nguoiHuongDan && (m.thanhVien || []).length);
  check('QD-16', 'Bia du thong tin: de tai, hoc phan, nguoi huong dan, hoc vien',
    coverOk, `de tai=${!!m.tenDeTai}, hoc phan=${!!m.hocPhan}, GVHD=${!!m.nguoiHuongDan}, thanh vien=${(m.thanhVien || []).length}`);
}

/* =============================================================== PPTX */

if (!exists(pptxPath)) {
  add('SL-00', 'File slide ton tai', FAILED, `Khong thay ${pptxPath}`);
} else {
  const zip = await JSZip.loadAsync(fs.readFileSync(pptxPath));
  const slideFiles = zip.file(/ppt\/slides\/slide\d+\.xml$/)
    .sort((a, b) => (+a.name.match(/(\d+)\.xml/)[1]) - (+b.name.match(/(\d+)\.xml/)[1]));
  const noteFiles = zip.file(/ppt\/notesSlides\/notesSlide\d+\.xml$/);
  const B = tokens.budgets;

  /* SL-01 presenter script on every slide */
  const notesText = new Map();
  for (const f of noteFiles) {
    const xml = await f.async('string');
    const body = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => unescapeXml(m[1])).join(' ');
    notesText.set(f.name.match(/notesSlide(\d+)\.xml/)[1], body);
  }
  const slideCount = slideFiles.length;
  const thin = [];
  for (let i = 1; i <= slideCount; i++) {
    const relXml = await zipText(zip, `ppt/slides/_rels/slide${i}.xml.rels`);
    const noteRel = relXml && relXml.match(/notesSlide(\d+)\.xml/);
    const body = noteRel ? (notesText.get(noteRel[1]) || '') : '';
    /* the notes placeholder repeats the slide number; strip a trailing lone number */
    if (body.replace(/\s+/g, ' ').trim().length < B.notesMinChars) thin.push(`slide ${i} (${body.trim().length} ky tu)`);
  }
  check('SL-01', `MOI slide co script thuyet trinh >= ${B.notesMinChars} ky tu`,
    thin.length === 0, thin.length ? `Thieu/qua ngan: ${thin.join(', ')}` : `${slideCount}/${slideCount} slide co script`);

  /* SL-02 pacing */
  if (deck) {
    const minutes = deck.config?.durationMinutes || 15;
    const per = (minutes * 60) / slideCount;
    check('SL-02', `Nhip trinh bay ${B.secondsPerSlideMin}-${B.secondsPerSlideMax}s/slide`,
      per >= B.secondsPerSlideMin, `${slideCount} slide / ${minutes} phut = ${per.toFixed(0)}s per slide`,
      per > B.secondsPerSlideMax);
  }

  /* SL-03 palette discipline */
  const palette = tokens.palettes[deck?.config?.palette || 'indigo-slate'];
  const allowed = new Set([...Object.values(palette).flatMap((v) => Array.isArray(v) ? v : [v])
    .filter((v) => typeof v === 'string' && /^[0-9A-F]{6}$/i.test(v)).map((v) => v.toUpperCase()),
    '000000', 'FFFFFF']);
  const used = new Set();
  for (const f of slideFiles)
    for (const m of (await f.async('string')).matchAll(/<a:srgbClr val="([0-9A-Fa-f]{6})"/g)) used.add(m[1].toUpperCase());
  const stray = [...used].filter((c) => !allowed.has(c));
  check('SL-03', 'Moi mau tren slide deu thuoc design system',
    stray.length === 0, stray.length ? `Mau la: ${stray.join(', ')}` : `${used.size} mau, deu nam trong palette "${deck?.config?.palette || 'indigo-slate'}"`, true);

  /* SL-04 geometry inside the canvas */
  const W = tokens.layout.w, H = tokens.layout.h, EMU = 914400;
  const overflow = [];
  for (const f of slideFiles) {
    const xml = await f.async('string');
    const n = f.name.match(/slide(\d+)/)[1];
    for (const m of xml.matchAll(/<a:off x="(-?\d+)" y="(-?\d+)"\/><a:ext cx="(\d+)" cy="(\d+)"\/>/g)) {
      const [x, y, cx, cy] = m.slice(1).map((v) => +v / EMU);
      if (x < -0.02 || y < -0.02 || x + cx > W + 0.05 || y + cy > H + 0.05)
        overflow.push(`slide ${n}: (${x.toFixed(2)},${y.toFixed(2)}) ${cx.toFixed(2)}x${cy.toFixed(2)}`);
    }
  }
  check('SL-04', 'Khong co doi tuong tran ra ngoai khung slide',
    overflow.length === 0, overflow.length ? overflow.slice(0, 4).join(' | ') : `Tat ca doi tuong nam trong ${W}x${H} inch`);

  /* SL-05 required slides */
  if (deck) {
    const layouts = (deck.slides || []).map((s) => s.layout);
    const need = ['COVER', 'AGENDA', 'CLOSING'];
    const missing = need.filter((n) => !layouts.includes(n));
    check('SL-05', 'Deck co slide bia, muc luc va slide ket/Q&A',
      missing.length === 0, missing.length ? `Thieu: ${missing.join(', ')}` : `Du ${need.join(' / ')}`);
  }
}

/* ============================================================== output */

const counts = rows.reduce((a, r) => ({ ...a, [r.status]: (a[r.status] || 0) + 1 }), {});
const md = [
  '# Bang doi chieu tuan thu quy dinh trinh bay',
  '',
  `- Ngay kiem tra: ${today()}`,
  `- Bao cao: \`${docxPath}\``,
  `- Slide: \`${pptxPath}\``,
  `- Ket qua: **${counts[PASS] || 0} PASS**, ${counts[FAILED] || 0} FAIL, ${counts[WARN] || 0} WARN, ${counts[SKIP] || 0} SKIP`,
  '',
  '> Quy dinh goc: `references/quy-dinh-trinh-bay.md` (trich tu "HD viet bao cao Bai tap lon cao hoc.docx").',
  '',
  '| Ma | Quy dinh | Ket qua | Bang chung |',
  '|---|---|---|---|',
  ...rows.map((r) => `| ${r.id} | ${r.rule} | **${r.status}** | ${r.evidence.replace(/\|/g, '\\|')} |`),
  '',
].join('\n');

const outMd = path.join(ws, 'output', 'compliance-report.md');
fs.mkdirSync(path.dirname(outMd), { recursive: true });
fs.writeFileSync(outMd, md, 'utf8');

const pad = (s, n) => String(s).padEnd(n);
log('');
for (const r of rows) log(`  ${pad(r.id, 8)} ${pad(r.status, 5)} ${r.rule}`);
log('');
log(`  ${counts[PASS] || 0} PASS | ${counts[FAILED] || 0} FAIL | ${counts[WARN] || 0} WARN | ${counts[SKIP] || 0} SKIP`);
log(`  Bang doi chieu: ${outMd}`);
if (counts[FAILED]) {
  log('');
  for (const r of rows.filter((x) => x.status === FAILED)) log(`  FAIL ${r.id}: ${r.evidence}`);
  process.exit(1);
}
