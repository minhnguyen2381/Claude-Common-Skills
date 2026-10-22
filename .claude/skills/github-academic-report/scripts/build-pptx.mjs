#!/usr/bin/env node
/**
 * Build the presentation deck from deck.json using pptxgenjs.
 *
 *   node scripts/build-pptx.mjs --ws ./ws [--out ./ws/output/slide.pptx]
 *
 * Two rules are enforced by construction, not by review:
 *   1. Every colour, size and position comes from assets/design-tokens.json.
 *   2. Every slide MUST carry a presenter script - the build FAILS otherwise.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseArgs, requireWs, readJson, exists, ensureDir, loadDeps, log, warn, fail,
} from './lib/common.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const args = parseArgs();
if (args.help) { log('Usage: node scripts/build-pptx.mjs --ws <dir> [--out file.pptx]'); process.exit(0); }
const ws = requireWs(args);
const { pptxgenjs: PptxGenJS } = loadDeps(ws, ['pptxgenjs']);

const T = readJson(args.tokens ? path.resolve(String(args.tokens)) : path.join(HERE, '..', 'assets', 'design-tokens.json'));
const deck = readJson(path.join(ws, 'content', 'deck.json'));
const report = readJson(path.join(ws, 'content', 'report.json'), { meta: {} });

const cfg = { palette: 'indigo-slate', durationMinutes: 15, ...(deck.config || {}) };
const meta = { ...(report.meta || {}), ...(deck.meta || {}) };
const C = T.palettes[cfg.palette];
if (!C) fail(`Palette khong ton tai: ${cfg.palette}`, `Chon mot trong: ${Object.keys(T.palettes).join(', ')}`);
const L = T.layout, F = T.type, B = T.budgets;
const slides = Array.isArray(deck.slides) ? deck.slides : [];
if (!slides.length) fail('deck.json khong co slide nao.');

/* ============================================================ validate */

const errors = [];
const arr = (x) => (Array.isArray(x) ? x : []);
const len = (s) => String(s ?? '').trim().length;

slides.forEach((s, i) => {
  const at = `slide ${i + 1} (${s.layout || 'KHONG CO layout'})`;
  if (!s.layout) errors.push(`${at}: thieu "layout"`);
  if (len(s.notes) < B.notesMinChars)
    errors.push(`${at}: script thuyet trinh chi ${len(s.notes)} ky tu, toi thieu ${B.notesMinChars}. ` +
      'Moi slide BAT BUOC co "notes" - xem references/slide-design-system.md.');
  if (s.title && len(s.title) > B.titleMaxChars)
    errors.push(`${at}: tieu de ${len(s.title)} ky tu (toi da ${B.titleMaxChars}) - "${s.title}"`);
  const bulletGroups = [arr(s.bullets), arr(s.items), arr(s.left?.bullets), arr(s.right?.bullets)];
  for (const g of bulletGroups) {
    if (g.length > B.maxBullets) errors.push(`${at}: ${g.length} gach dau dong (toi da ${B.maxBullets})`);
    for (const b of g) {
      const txt = typeof b === 'string' ? b : b?.text;
      if (len(txt) > B.bulletMaxChars) errors.push(`${at}: gach dau dong ${len(txt)} ky tu (toi da ${B.bulletMaxChars}) - "${String(txt).slice(0, 50)}..."`);
    }
  }
  if (arr(s.metrics).length > B.metricsMax) errors.push(`${at}: ${s.metrics.length} chi so (toi da ${B.metricsMax})`);
  if (arr(s.rows).length > B.tableMaxRows) errors.push(`${at}: bang ${s.rows.length} dong (toi da ${B.tableMaxRows}) - tach slide`);
});

const seconds = cfg.durationMinutes * 60;
const perSlide = seconds / slides.length;
if (perSlide < B.secondsPerSlideMin)
  errors.push(`Deck ${slides.length} slide cho ${cfg.durationMinutes} phut => ${perSlide.toFixed(0)}s/slide (toi thieu ${B.secondsPerSlideMin}s). Bot slide.`);
if (perSlide > B.secondsPerSlideMax)
  warn(`${perSlide.toFixed(0)}s/slide - deck hoi thua thoi gian, co the them slide minh hoa.`);

if (errors.length) {
  console.error('\nDECK CHUA DAT CHUAN:\n');
  for (const e of errors) console.error('  - ' + e);
  console.error('');
  process.exit(1);
}

/* ============================================================== masters */

const pptx = new PptxGenJS();
pptx.defineLayout({ name: L.name, width: L.w, height: L.h });
pptx.layout = L.name;
pptx.author = arr(meta.thanhVien).map((m) => m.hoTen).join(', ') || 'Hoc vien';
pptx.company = meta.truong || '';
pptx.title = meta.tenDeTai || 'Bao cao';
pptx.subject = meta.hocPhan || '';

const slideNumberStyle = { x: L.w - L.marginX - 0.6, y: L.footerY, w: 0.6, h: 0.3, align: 'right',
  fontFace: F.fontBody, fontSize: F.caption, color: C.muted };

pptx.defineSlideMaster({
  title: 'DARK',
  background: { color: C.primaryDark },
  objects: [
    { rect: { x: 0, y: 0, w: 0.22, h: L.h, fill: { color: C.accent } } },
    { rect: { x: L.marginX, y: L.h - 0.9, w: 2.2, h: 0.045, fill: { color: C.accent } } },
  ],
});

pptx.defineSlideMaster({
  title: 'LIGHT',
  background: { color: C.bg },
  objects: [
    { rect: { x: 0, y: 0, w: L.w, h: 0.16, fill: { color: C.primary } } },
    { rect: { x: L.marginX, y: L.footerRuleY, w: L.w - 2 * L.marginX, h: 0.012, fill: { color: C.line } } },
    { text: { text: meta.tenDeTai || '', options: {
      x: L.marginX, y: L.footerY, w: L.w - 2 * L.marginX - 0.8, h: 0.3, align: 'left',
      fontFace: F.fontBody, fontSize: F.caption, color: C.muted } } },
  ],
  slideNumber: slideNumberStyle,
});

/* ======================================================= layout helpers */

const contentW = L.w - 2 * L.marginX;

function chrome(slide, s) {
  if (s.section)
    slide.addText(String(s.section).toUpperCase(), {
      x: L.marginX, y: 0.34, w: contentW, h: 0.28, align: 'left',
      fontFace: F.fontHead, fontSize: F.kicker, bold: true, color: C.accent, charSpacing: 1.6,
    });
  if (s.title) {
    slide.addText(s.title, {
      x: L.marginX, y: L.titleY, w: contentW, h: 0.62, align: 'left', valign: 'top',
      fontFace: F.fontHead, fontSize: F.title, bold: true, color: C.ink,
    });
    slide.addShape(pptx.ShapeType.rect, { x: L.marginX, y: L.ruleY, w: 1.5, h: 0.05, fill: { color: C.accent } });
  }
}

const bulletOpts = (fontSize = F.body) => ({
  fontFace: F.fontBody, fontSize, color: C.ink, lineSpacingMultiple: 1.25,
  bullet: { characterCode: '2013', indent: 18 }, paraSpaceAfter: 8,
});

const toRuns = (items, fontSize) => arr(items).map((b) => {
  const text = typeof b === 'string' ? b : b.text;
  const sub = typeof b === 'object' && b.level > 0;
  return { text, options: { ...bulletOpts(sub ? fontSize - 2 : fontSize), indentLevel: sub ? 1 : 0, color: sub ? C.muted : C.ink } };
});

function panel(slide, x, y, w, h, fillColor = C.surface) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, fill: { color: fillColor }, line: { color: C.line, width: 0.75 }, rectRadius: 0.06 });
}

function imagePath(rel) {
  const abs = path.isAbsolute(rel) ? rel : path.join(ws, rel);
  if (!exists(abs)) fail(`Khong tim thay anh cho slide: ${abs}`, 'Chay scripts/render-figures.mjs truoc.');
  return abs;
}

/** Fit an image inside a box, centred, preserving aspect ratio. */
function fitImage(slide, rel, box) {
  const abs = imagePath(rel);
  slide.addImage({ path: abs, x: box.x, y: box.y, w: box.w, h: box.h, sizing: { type: 'contain', w: box.w, h: box.h } });
}

/* =============================================================== render */

const RENDER = {
  COVER(slide, s) {
    slide.addText(meta.daiHoc || '', { x: 0.9, y: 0.6, w: L.w - 1.8, h: 0.3, fontFace: F.fontHead, fontSize: F.small, color: C.onDark, charSpacing: 1.2 });
    slide.addText(meta.truong || '', { x: 0.9, y: 0.92, w: L.w - 1.8, h: 0.3, fontFace: F.fontHead, fontSize: F.small, color: C.onDark, charSpacing: 1.2 });
    slide.addText(s.title || meta.tenDeTai || '', {
      x: 0.9, y: 1.9, w: L.w - 2.4, h: 1.9, valign: 'top',
      fontFace: F.fontHead, fontSize: F.display, bold: true, color: C.onPrimary, lineSpacingMultiple: 1.1,
    });
    if (s.subtitle)
      slide.addText(s.subtitle, { x: 0.9, y: 3.95, w: L.w - 2.4, h: 0.5, fontFace: F.fontBody, fontSize: F.h2, color: C.accent });
    const members = arr(meta.thanhVien).map((m) => `${m.hoTen} — ${m.maHocVien}`);
    const info = [
      { text: `Học phần: ${meta.hocPhan || ''}`, options: { breakLine: true } },
      { text: `Người hướng dẫn: ${meta.nguoiHuongDan || ''}`, options: { breakLine: true } },
      { text: members.length > 1 ? `Nhóm thực hiện: ${members.join('  •  ')}` : `Học viên: ${members[0] || ''}`, options: { breakLine: true } },
      { text: `${meta.diaDiem || 'Hà Nội'} – ${meta.nam || new Date().getFullYear()}`, options: {} },
    ];
    slide.addText(info, { x: 0.9, y: 5.0, w: L.w - 2.4, h: 1.6, fontFace: F.fontBody, fontSize: F.small, color: C.onDark, lineSpacingMultiple: 1.35 });
  },

  SECTION(slide, s) {
    if (s.kicker)
      slide.addText(String(s.kicker), { x: 0.9, y: 1.6, w: 3, h: 1.6, fontFace: F.fontHead, fontSize: 72, bold: true, color: C.accent });
    slide.addText(s.title || '', { x: 0.9, y: 3.3, w: L.w - 2.4, h: 1.3, fontFace: F.fontHead, fontSize: F.sectionTitle, bold: true, color: C.onPrimary });
    if (s.subtitle)
      slide.addText(s.subtitle, { x: 0.9, y: 4.7, w: L.w - 2.4, h: 0.9, fontFace: F.fontBody, fontSize: F.body, color: C.onDark });
  },

  AGENDA(slide, s) {
    chrome(slide, s);
    const items = arr(s.items);
    const cols = items.length > 4 ? 2 : 1;
    const perCol = Math.ceil(items.length / cols);
    for (let c = 0; c < cols; c++) {
      const part = items.slice(c * perCol, (c + 1) * perCol);
      const x = L.marginX + c * (contentW / cols);
      part.forEach((it, i) => {
        const y = L.contentY + i * 0.78;
        const n = c * perCol + i + 1;
        slide.addShape(pptx.ShapeType.ellipse, { x, y, w: 0.46, h: 0.46, fill: { color: C.primary } });
        slide.addText(String(n).padStart(2, '0'), { x, y, w: 0.46, h: 0.46, align: 'center', valign: 'middle', fontFace: F.fontHead, fontSize: F.small, bold: true, color: C.onPrimary });
        slide.addText(typeof it === 'string' ? it : it.text, {
          x: x + 0.62, y, w: contentW / cols - 0.85, h: 0.46, valign: 'middle',
          fontFace: F.fontBody, fontSize: F.body, color: C.ink,
        });
      });
    }
  },

  BULLETS(slide, s) {
    chrome(slide, s);
    if (s.lead)
      slide.addText(s.lead, { x: L.marginX, y: L.contentY, w: contentW, h: 0.5, fontFace: F.fontBody, fontSize: F.h2, color: C.muted, italic: true });
    slide.addText(toRuns(s.bullets, F.body), {
      x: L.marginX, y: L.contentY + (s.lead ? 0.62 : 0), w: contentW, h: L.contentH - (s.lead ? 0.62 : 0), valign: 'top',
    });
  },

  TWO_COL(slide, s) {
    chrome(slide, s);
    const gap = 0.45, colW = (contentW - gap) / 2;
    [[s.left, L.marginX], [s.right, L.marginX + colW + gap]].forEach(([col, x]) => {
      if (!col) return;
      panel(slide, x, L.contentY, colW, L.contentH);
      if (col.heading)
        slide.addText(col.heading, { x: x + 0.25, y: L.contentY + 0.2, w: colW - 0.5, h: 0.42, fontFace: F.fontHead, fontSize: F.h2, bold: true, color: C.primary });
      slide.addText(toRuns(col.bullets, F.body - 1), {
        x: x + 0.25, y: L.contentY + (col.heading ? 0.74 : 0.24), w: colW - 0.5, h: L.contentH - (col.heading ? 0.98 : 0.48), valign: 'top',
      });
    });
  },

  FIGURE(slide, s) {
    chrome(slide, s);
    const hasText = arr(s.bullets).length > 0;
    const imgW = hasText ? contentW * 0.58 : contentW;
    fitImage(slide, s.image, { x: L.marginX, y: L.contentY, w: imgW, h: L.contentH - (s.caption ? 0.36 : 0) });
    if (s.caption)
      slide.addText(s.caption, { x: L.marginX, y: L.contentY + L.contentH - 0.34, w: imgW, h: 0.3, align: 'center', fontFace: F.fontBody, fontSize: F.caption, italic: true, color: C.muted });
    if (hasText)
      slide.addText(toRuns(s.bullets, F.body - 1), {
        x: L.marginX + imgW + 0.4, y: L.contentY, w: contentW - imgW - 0.4, h: L.contentH, valign: 'top',
      });
  },

  METRICS(slide, s) {
    chrome(slide, s);
    const items = arr(s.metrics);
    const withText = arr(s.bullets).length > 0;
    const cardH = withText ? 2.3 : 3.0;
    const cardY = withText ? L.contentY : L.contentY + (L.contentH - cardH) / 2 - 0.25;
    const gap = 0.35, cardW = (contentW - gap * (items.length - 1)) / items.length;
    items.forEach((m, i) => {
      const x = L.marginX + i * (cardW + gap);
      panel(slide, x, cardY, cardW, cardH);
      slide.addText(String(m.value), {
        x, y: cardY + cardH * 0.22, w: cardW, h: 1.0, align: 'center',
        fontFace: F.fontHead, fontSize: F.metricValue, bold: true, color: C.primary,
      });
      slide.addText(String(m.label), {
        x: x + 0.18, y: cardY + cardH * 0.22 + 1.02, w: cardW - 0.36, h: 0.85, align: 'center', valign: 'top',
        fontFace: F.fontBody, fontSize: F.small, color: C.muted,
      });
    });
    if (withText)
      slide.addText(toRuns(s.bullets, F.body - 1), { x: L.marginX, y: cardY + cardH + 0.3, w: contentW, h: L.contentH - cardH - 0.3, valign: 'top' });
  },

  TABLE(slide, s) {
    chrome(slide, s);
    const head = arr(s.header).map((h) => ({ text: String(h), options: { bold: true, color: C.onPrimary, fill: { color: C.primary } } }));
    const body = arr(s.rows).map((r) => r.map((c) => ({ text: String(c), options: { color: C.ink } })));
    slide.addTable(head.length ? [head, ...body] : body, {
      x: L.marginX, y: L.contentY, w: contentW,
      colW: s.colW || undefined,
      border: { type: 'solid', color: C.line, pt: 0.75 },
      fontFace: F.fontBody, fontSize: F.small, valign: 'middle',
      margin: 6, autoPage: false,
    });
    if (s.source) {
      // sit just under the table (~0.38" per row) instead of drifting to the footer
      const tableH = (arr(s.rows).length + (arr(s.header).length ? 1 : 0)) * 0.38;
      const y = Math.min(L.contentY + tableH + 0.14, L.footerRuleY - 0.42);
      slide.addText(s.source, { x: L.marginX, y, w: contentW, h: 0.3, fontFace: F.fontBody, fontSize: F.caption, italic: true, color: C.muted });
    }
  },

  CHART(slide, s) {
    chrome(slide, s);
    const spec = s.chart || {};
    const typeMap = { bar: pptx.ChartType.bar, column: pptx.ChartType.bar, line: pptx.ChartType.line, pie: pptx.ChartType.pie, doughnut: pptx.ChartType.doughnut, area: pptx.ChartType.area };
    const type = typeMap[spec.type] || pptx.ChartType.bar;
    const data = arr(spec.series).map((se) => ({ name: se.name, labels: spec.labels, values: se.values }));
    if (!data.length) fail(`slide "${s.title}": chart thieu "series".`);
    slide.addChart(type, data, {
      x: L.marginX, y: L.contentY, w: arr(s.bullets).length ? contentW * 0.62 : contentW, h: L.contentH,
      barDir: spec.type === 'bar' ? 'bar' : 'col',
      chartColors: C.series, varyColors: spec.varyColors ?? (data.length === 1),
      showLegend: data.length > 1, legendPos: 'b', legendColor: C.muted, legendFontSize: F.caption,
      showValue: !!spec.showValue, dataLabelColor: C.ink, dataLabelFontSize: F.caption,
      catAxisLabelFontSize: F.caption, valAxisLabelFontSize: F.caption,
      catAxisLabelColor: C.muted, valAxisLabelColor: C.muted,
      // keep the frame quiet: data first, chrome second
      valGridLine: { style: 'none' }, catGridLine: { style: 'none' },
      catAxisLineShow: false, valAxisLineShow: false,
      valAxisHidden: !!spec.showValue,
      fontFace: F.fontBody, border: { pt: 0, color: C.bg },
    });
    if (arr(s.bullets).length)
      slide.addText(toRuns(s.bullets, F.body - 1), { x: L.marginX + contentW * 0.66, y: L.contentY, w: contentW * 0.34, h: L.contentH, valign: 'top' });
  },

  QUOTE(slide, s) {
    chrome(slide, s);
    panel(slide, L.marginX, L.contentY, contentW, L.contentH - 0.4);
    slide.addText(`“${s.text}”`, {
      x: L.marginX + 0.6, y: L.contentY + 0.5, w: contentW - 1.2, h: L.contentH - 1.8, valign: 'middle',
      fontFace: F.fontHead, fontSize: F.h2 + 2, italic: true, color: C.ink, lineSpacingMultiple: 1.3,
    });
    if (s.attribution)
      slide.addText(`— ${s.attribution}`, { x: L.marginX + 0.6, y: L.contentY + L.contentH - 1.15, w: contentW - 1.2, h: 0.4, fontFace: F.fontBody, fontSize: F.small, color: C.muted });
  },

  CLOSING(slide, s) {
    slide.addText(s.title || 'Xin cảm ơn', { x: 0.9, y: 2.5, w: L.w - 2.4, h: 1.2, fontFace: F.fontHead, fontSize: F.display, bold: true, color: C.onPrimary });
    if (s.subtitle)
      slide.addText(s.subtitle, { x: 0.9, y: 3.75, w: L.w - 2.4, h: 0.7, fontFace: F.fontBody, fontSize: F.h2, color: C.accent });
    const lines = arr(s.contacts);
    if (lines.length)
      slide.addText(lines.join('\n'), { x: 0.9, y: 4.6, w: L.w - 2.4, h: 1.4, fontFace: F.fontBody, fontSize: F.small, color: C.onDark, lineSpacingMultiple: 1.35 });
  },
};

const DARK_LAYOUTS = new Set(['COVER', 'SECTION', 'CLOSING']);

for (const s of slides) {
  const render = RENDER[s.layout];
  if (!render) fail(`Layout khong ho tro: "${s.layout}"`, `Dung mot trong: ${Object.keys(RENDER).join(', ')}`);
  const slide = pptx.addSlide({ masterName: DARK_LAYOUTS.has(s.layout) ? 'DARK' : 'LIGHT' });
  render(slide, s);
  slide.addNotes(String(s.notes).trim());
}

/* ================================================================ write */

const outPath = args.out ? path.resolve(String(args.out)) : path.join(ws, 'output', 'slide.pptx');
ensureDir(path.dirname(outPath));
await pptx.writeFile({ fileName: outPath });

log('');
log(`  Da tao ${outPath}  (${(fs.statSync(outPath).size / 1024).toFixed(0)} KB)`);
log(`  ${slides.length} slide | palette: ${cfg.palette} | ~${perSlide.toFixed(0)}s/slide cho ${cfg.durationMinutes} phut`);
log('  Moi slide deu co script thuyet trinh trong phan Notes (View > Notes Page).');
