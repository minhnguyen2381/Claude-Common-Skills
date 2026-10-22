/**
 * Shared helpers for the github-academic-report skill scripts.
 * No third-party imports here - everything comes from the workspace's node_modules
 * via loadDeps(), so this file works before `npm install` has run.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

/* ------------------------------------------------------------------ args */

export function parseArgs(argv = process.argv.slice(2)) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { out._.push(a); continue; }
    const body = a.slice(2);
    const eq = body.indexOf('=');
    if (eq >= 0) { out[body.slice(0, eq)] = body.slice(eq + 1); continue; }
    if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) out[body] = argv[++i];
    else out[body] = true;
  }
  return out;
}

/* ------------------------------------------------------------------- log */

export const log = (...a) => console.log(...a);
export const warn = (...a) => console.warn('[!]', ...a);

export function fail(msg, hint) {
  console.error(`\nLOI: ${msg}`);
  if (hint) console.error(`     -> ${hint}`);
  process.exit(1);
}

/* ------------------------------------------------------------------- fs */

export const exists = (p) => { try { fs.accessSync(p); return true; } catch { return false; } };

export function readJson(p, fallback) {
  if (!exists(p)) {
    if (fallback !== undefined) return fallback;
    fail(`Khong tim thay file: ${p}`);
  }
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
  } catch (e) {
    fail(`JSON khong hop le: ${p}`, e.message);
  }
}

export function writeJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

export const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });

/* ------------------------------------------------------------ workspace */

export const WS_DIRS = ['content', 'figures', 'figures/src', 'output', 'repo'];

export function resolveWs(args) {
  const ws = args.ws || args.out || args.workspace;
  if (!ws) fail('Thieu tham so --ws <duong-dan-workspace>');
  const abs = path.resolve(String(ws));
  return abs;
}

export function requireWs(args) {
  const ws = resolveWs(args);
  if (!exists(path.join(ws, 'package.json')))
    fail(`Workspace chua duoc khoi tao: ${ws}`, 'Chay: node scripts/setup-workspace.mjs --ws <duong-dan>');
  return ws;
}

/**
 * Load docx / pptxgenjs / jszip out of the WORKSPACE node_modules, not the
 * skill directory - the skill folder itself is never an npm package.
 */
export function loadDeps(ws, names = ['docx', 'pptxgenjs', 'jszip']) {
  const req = createRequire(path.join(ws, 'package.json'));
  const out = {};
  for (const n of names) {
    try {
      const m = req(n);
      out[n] = m && m.__esModule && m.default ? m.default : m;
    } catch (e) {
      fail(`Khong nap duoc dependency "${n}" tu ${ws}`,
        `Chay lai: node scripts/setup-workspace.mjs --ws "${ws}"  (${e.message})`);
    }
  }
  return out;
}

/* ---------------------------------------------------------------- units */

export const TWIP_PER_CM = 567;          // 1440 twip/inch / 2.54
export const cmToTwip = (cm) => Math.round(cm * TWIP_PER_CM);
export const cmToPx = (cm) => Math.round((cm / 2.54) * 96);   // docx image transform is in px @96dpi
export const ptToHalfPt = (pt) => Math.round(pt * 2);

/* ------------------------------------------------------------ image size */

/** Returns { width, height } in pixels for png / jpg / gif, or null. */
export function imageSize(buf) {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47)          // PNG
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), type: 'png' };
  if (buf.length > 10 && buf[0] === 0xff && buf[1] === 0xd8) {        // JPEG
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker))
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7), type: 'jpg' };
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  if (buf.length > 10 && buf.slice(0, 3).toString('latin1') === 'GIF')
    return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8), type: 'gif' };
  return null;
}

export const imageType = (p) => {
  const e = path.extname(p).toLowerCase();
  return e === '.jpg' || e === '.jpeg' ? 'jpg' : e === '.gif' ? 'gif' : e === '.bmp' ? 'bmp' : 'png';
};

/* ---------------------------------------------------------- draw.io CLI */

export function findDrawio() {
  const home = os.homedir();
  const candidates = [
    process.env.DRAWIO_PATH,
    path.join(home, 'AppData/Local/Programs/draw.io/draw.io.exe'),
    'C:/Program Files/draw.io/draw.io.exe',
    'C:/Program Files (x86)/draw.io/draw.io.exe',
    '/mnt/c/Program Files/draw.io/draw.io.exe',
    `/mnt/c/Users/${process.env.WIN_USER || ''}/AppData/Local/Programs/draw.io/draw.io.exe`,
    '/Applications/draw.io.app/Contents/MacOS/draw.io',
  ].filter(Boolean);
  for (const c of candidates) if (exists(c)) return c;
  for (const cmd of ['drawio', 'draw.io']) {
    try {
      const which = process.platform === 'win32' ? 'where' : 'which';
      const out = execFileSync(which, [cmd], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      const first = out.split(/\r?\n/).find(Boolean);
      if (first && exists(first)) return first;
    } catch { /* not on PATH */ }
  }
  return null;
}

/* ------------------------------------------------------------- bookmarks */

/** Word bookmark names: start with a letter or underscore, <= 40 chars, no spaces. */
export function bookmarkName(prefix, id) {
  const clean = String(id).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return `${prefix}${clean}`.slice(0, 40);
}

/* ----------------------------------------------------- vietnamese sorting */

const collator = new Intl.Collator('vi', { sensitivity: 'variant', numeric: true });

/**
 * Guideline rule: Vietnamese authors sort by GIVEN NAME (last token) while keeping
 * the name printed in normal order; foreign authors sort by SURNAME (already first).
 */
export function refSortKey(ref) {
  const first = (ref.authors && ref.authors[0]) || ref.organization || '';
  if ((ref.lang || 'vi') === 'vi') {
    const tokens = String(first).trim().split(/\s+/);
    const given = tokens.length ? tokens[tokens.length - 1] : '';
    return `${given} ${tokens.slice(0, -1).join(' ')}`.trim();
  }
  return String(first).trim();
}

export const sortRefs = (refs) =>
  [...refs].sort((a, b) => collator.compare(refSortKey(a), refSortKey(b)));

export const viCompare = (a, b) => collator.compare(a, b);

/* --------------------------------------------------------------- zip io */

/** Re-open a generated OOXML buffer, mutate entries, and repack. */
export async function patchZip(JSZip, buf, mutate) {
  const zip = await JSZip.loadAsync(buf);
  await mutate(zip);
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

/**
 * docx-js emits w:id="1" for EVERY bookmark, which is invalid OOXML and can break
 * REF fields in Word. Renumber start/end pairs in document order.
 */
export async function fixBookmarkIds(JSZip, buf) {
  return patchZip(JSZip, buf, async (zip) => {
    const file = zip.file('word/document.xml');
    let xml = await file.async('string');
    let n = 0;
    const stack = [];
    xml = xml.replace(/<w:bookmark(Start|End)([^>]*)\/>/g, (full, kind, attrs) => {
      if (kind === 'Start') {
        const id = ++n; stack.push(id);
        return `<w:bookmarkStart${attrs.replace(/\s*w:id="\d+"/, '')} w:id="${id}"/>`;
      }
      const id = stack.pop() ?? ++n;
      return `<w:bookmarkEnd w:id="${id}"/>`;
    });
    zip.file('word/document.xml', xml);
  });
}

/* -------------------------------------------------------------- strings */

export const stripDiacritics = (s) =>
  String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

export const slug = (s) => stripDiacritics(s).toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

export const today = () => new Date().toISOString().slice(0, 10);
