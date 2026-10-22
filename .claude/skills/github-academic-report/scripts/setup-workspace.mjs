#!/usr/bin/env node
/**
 * Create (or repair) a report workspace and install the Node dependencies the
 * builders need. Idempotent - safe to re-run.
 *
 *   node scripts/setup-workspace.mjs --ws "D:/bao-cao-my-project"
 *   node scripts/setup-workspace.mjs --ws ./ws --skip-install
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  parseArgs, resolveWs, WS_DIRS, ensureDir, exists, writeJson, readJson,
  findDrawio, log, warn, fail, today,
} from './lib/common.mjs';

const DEPS = ['docx@^9', 'pptxgenjs@^4', 'jszip@^3'];

const args = parseArgs();
if (args.help) {
  log('Usage: node scripts/setup-workspace.mjs --ws <dir> [--skip-install]');
  process.exit(0);
}
const ws = resolveWs(args);

log(`Workspace: ${ws}`);
ensureDir(ws);
for (const d of WS_DIRS) ensureDir(path.join(ws, d));

const pkgPath = path.join(ws, 'package.json');
if (!exists(pkgPath)) {
  writeJson(pkgPath, {
    name: 'academic-report-workspace',
    private: true,
    version: '1.0.0',
    description: 'Workspace sinh bao cao Word + slide tu du an GitHub',
    type: 'module',
  });
  log('  + package.json');
}

/* ------------------------------------------------------------- install */

let installed = { ok: false, versions: {} };
if (args['skip-install']) {
  log('  = bo qua npm install (--skip-install)');
} else {
  log(`  ~ npm install ${DEPS.join(' ')} ...`);
  const npmArgs = ['install', ...DEPS, '--no-audit', '--no-fund', '--loglevel', 'error'];
  const opts = { cwd: ws, stdio: 'inherit' };

  // Node >= 20 refuses to spawn .cmd/.bat without a shell, and shell:true with
  // args is deprecated - so drive npm's JS entry point with this same node binary.
  const npmCli = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
  const r = exists(npmCli)
    ? spawnSync(process.execPath, [npmCli, ...npmArgs], opts)
    : spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', npmArgs, { ...opts, shell: process.platform === 'win32' });

  if (r.status !== 0)
    fail('npm install that bai.',
      'Kiem tra ket noi mang / proxy, hoac cai thu cong: npm i docx pptxgenjs jszip trong thu muc workspace.');
}

for (const name of ['docx', 'pptxgenjs', 'jszip']) {
  const p = path.join(ws, 'node_modules', name, 'package.json');
  if (exists(p)) installed.versions[name] = readJson(p).version;
}
installed.ok = Object.keys(installed.versions).length === 3;

/* ------------------------------------------------------------ tooling */

const drawio = findDrawio();
const gitProbe = spawnSync('git', ['--version'], { encoding: 'utf8' });
const git = gitProbe.status === 0 ? gitProbe.stdout.trim() : null;

const env = {
  generatedAt: today(),
  workspace: ws,
  node: process.version,
  platform: process.platform,
  deps: installed,
  tools: {
    git,
    drawio,
    drawioNote: drawio
      ? 'draw.io Desktop CLI san sang - render hinh bang scripts/render-figures.mjs'
      : 'Khong tim thay draw.io Desktop. Cai tu https://www.drawio.com/ hoac dat bien DRAWIO_PATH.',
  },
};
writeJson(path.join(ws, 'env-report.json'), env);

/* -------------------------------------------------------------- report */

log('');
log('  node       : ' + process.version);
log('  git        : ' + (git || 'KHONG CO  <- can git de clone repo'));
log('  draw.io    : ' + (drawio || 'KHONG CO  <- hinh ve se phai do user cung cap'));
for (const [k, v] of Object.entries(installed.versions)) log(`  ${k.padEnd(11)}: ${v}`);
log('');
log(`  env-report.json da ghi vao ${path.join(ws, 'env-report.json')}`);

if (!installed.ok) fail('Thieu dependency - khong the build.', 'Chay lai lenh nay sau khi co mang.');
if (!git) warn('Khong co git: chi co the phan tich repo tu duong dan local.');
if (!drawio) warn('Khong co draw.io: bo qua buoc render hinh, hoac dung anh co san trong repo.');

log('\nBuoc tiep theo: node scripts/analyze-repo.mjs --ws "' + ws + '" --repo <url|path>');
