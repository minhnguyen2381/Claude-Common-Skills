#!/usr/bin/env node
/**
 * Render every declared figure to PNG and record its real pixel size, so the
 * DOCX builder can scale images without distorting them.
 *
 * Input : <ws>/content/figures.json
 * Output: <ws>/figures/<id>.png  +  <ws>/figures/manifest.json
 *
 *   node scripts/render-figures.mjs --ws ./ws
 *   node scripts/render-figures.mjs --ws ./ws --only fig-kien-truc --force
 *
 * figures.json:
 * {
 *   "figures": [
 *     { "id": "fig-kien-truc", "kind": "mermaid", "source": "flowchart TD\n  A --> B" },
 *     { "id": "fig-erd",  "kind": "drawio", "source": "<mxfile>...</mxfile>", "layout": "verticalFlow" },
 *     { "id": "fig-ui",   "kind": "image",  "path": "repo/docs/screen.png" }
 *   ]
 * }
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  parseArgs, requireWs, readJson, writeJson, exists, ensureDir, findDrawio,
  imageSize, log, warn, fail, today,
} from './lib/common.mjs';

const args = parseArgs();
if (args.help) { log('Usage: node scripts/render-figures.mjs --ws <dir> [--only id] [--force]'); process.exit(0); }
const ws = requireWs(args);

const figPath = path.join(ws, 'content', 'figures.json');
const spec = readJson(figPath, { figures: [] });
const list = (spec.figures || []).filter((f) => !args.only || f.id === args.only);
if (!list.length) { log('Khong co hinh nao de render.'); process.exit(0); }

const outDir = path.join(ws, 'figures');
const srcDir = path.join(outDir, 'src');
ensureDir(outDir); ensureDir(srcDir);

const drawio = args.drawio ? String(args.drawio) : findDrawio();
const needsCli = list.some((f) => f.kind === 'mermaid' || f.kind === 'drawio');
if (needsCli && !drawio)
  fail('Khong tim thay draw.io Desktop CLI.',
    'Cai draw.io Desktop roi chay lai, hoac dat DRAWIO_PATH, hoac doi hinh sang kind:"image".');

function runDrawio(argv, expectOut, label) {
  const attempts = [argv, [...argv, '--no-sandbox']];
  let last = null;
  for (const a of attempts) {
    const r = spawnSync(drawio, a, { encoding: 'utf8', timeout: 180000, windowsHide: true });
    last = r;
    if (exists(expectOut) && fs.statSync(expectOut).size > 0) return true;
  }
  warn(`${label}: draw.io khong tao duoc file.`);
  if (last?.stderr) warn('  stderr: ' + String(last.stderr).split(/\r?\n/).slice(0, 4).join(' | '));
  if (last?.error) warn('  error : ' + last.error.message);
  return false;
}

const manifest = [];
const failures = [];

for (const f of list) {
  if (!f.id) fail('Moi hinh phai co "id".');
  const png = path.join(outDir, `${f.id}.png`);
  const rel = path.posix.join('figures', `${f.id}.png`);

  if (exists(png) && !args.force && f.kind !== 'image') {
    log(`  = ${f.id} (da co, dung --force de render lai)`);
  } else if (f.kind === 'image') {
    const srcAbs = path.isAbsolute(f.path) ? f.path : path.join(ws, f.path);
    if (!exists(srcAbs)) { failures.push(`${f.id}: khong thay anh ${f.path}`); continue; }
    fs.copyFileSync(srcAbs, png);
    log(`  + ${f.id} (copy tu ${f.path})`);
  } else if (f.kind === 'mermaid') {
    const body = f.source ?? (f.sourceFile ? fs.readFileSync(path.join(ws, f.sourceFile), 'utf8') : null);
    if (!body) { failures.push(`${f.id}: thieu "source" hoac "sourceFile"`); continue; }
    const mmd = path.join(srcDir, `${f.id}.mmd`);
    const dio = path.join(srcDir, `${f.id}.drawio`);
    fs.writeFileSync(mmd, body, 'utf8');
    fs.rmSync(dio, { force: true });
    if (!runDrawio(['-x', '-f', 'xml', '-o', dio, mmd], dio, f.id)) { failures.push(`${f.id}: mermaid -> drawio that bai`); continue; }
    fs.rmSync(png, { force: true });
    if (!runDrawio(['-x', '-f', 'png', '-e', '-b', '10', '-s', '2', '-o', png, dio], png, f.id) &&
        !runDrawio(['-x', '-f', 'png', '-e', '-b', '10', '-o', png, dio], png, f.id)) {
      failures.push(`${f.id}: drawio -> png that bai`); continue;
    }
    log(`  + ${f.id} (mermaid)`);
  } else if (f.kind === 'drawio') {
    const body = f.source ?? (f.sourceFile ? fs.readFileSync(path.join(ws, f.sourceFile), 'utf8') : null);
    if (!body) { failures.push(`${f.id}: thieu "source" hoac "sourceFile"`); continue; }
    const dio = path.join(srcDir, `${f.id}.drawio`);
    fs.writeFileSync(dio, body, 'utf8');
    if (f.layout) runDrawio(['-x', '-f', 'xml', '--layout', f.layout, '-o', dio, dio], dio, f.id);
    fs.rmSync(png, { force: true });
    if (!runDrawio(['-x', '-f', 'png', '-e', '-b', '10', '-s', '2', '-o', png, dio], png, f.id) &&
        !runDrawio(['-x', '-f', 'png', '-e', '-b', '10', '-o', png, dio], png, f.id)) {
      failures.push(`${f.id}: drawio -> png that bai`); continue;
    }
    log(`  + ${f.id} (drawio xml)`);
  } else {
    failures.push(`${f.id}: kind "${f.kind}" khong ho tro (mermaid | drawio | image)`);
    continue;
  }

  if (!exists(png)) { failures.push(`${f.id}: khong co file PNG dau ra`); continue; }
  const dim = imageSize(fs.readFileSync(png));
  if (!dim) { failures.push(`${f.id}: khong doc duoc kich thuoc anh`); continue; }
  manifest.push({ id: f.id, kind: f.kind, file: rel, width: dim.width, height: dim.height, type: dim.type });
}

/* keep entries for figures that were filtered out by --only */
if (args.only && exists(path.join(outDir, 'manifest.json'))) {
  const prev = readJson(path.join(outDir, 'manifest.json'), { figures: [] }).figures || [];
  for (const p of prev) if (!manifest.some((m) => m.id === p.id)) manifest.push(p);
}

writeJson(path.join(outDir, 'manifest.json'), { generatedAt: today(), figures: manifest });

log('');
log(`  ${manifest.length} hinh san sang -> ${path.join(outDir, 'manifest.json')}`);
if (failures.length) {
  warn(`${failures.length} hinh LOI:`);
  for (const m of failures) warn('   - ' + m);
  process.exit(1);
}
