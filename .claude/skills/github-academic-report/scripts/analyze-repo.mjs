#!/usr/bin/env node
/**
 * Clone (or read) a project and write a compact, factual profile of it.
 * The profile is the ONLY source of project statistics quoted in the report -
 * never estimate these numbers by hand.
 *
 *   node scripts/analyze-repo.mjs --ws ./ws --repo https://github.com/org/name
 *   node scripts/analyze-repo.mjs --ws ./ws --repo D:/AndroidStudioProjects/MyApp
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  parseArgs, requireWs, readJson, writeJson, exists, log, warn, fail, today, imageSize,
} from './lib/common.mjs';

const SKIP_DIRS = new Set([
  '.git', '.svn', '.hg', 'node_modules', 'bower_components', 'vendor', 'Pods',
  'build', 'out', 'dist', 'target', 'bin', 'obj', '.gradle', '.idea', '.vscode',
  '__pycache__', '.venv', 'venv', 'env', '.next', '.nuxt', '.cache', 'coverage',
  'DerivedData', '.dart_tool', '.expo', 'Carthage', '.terraform',
]);

const LANG = {
  '.kt': 'Kotlin', '.kts': 'Kotlin', '.java': 'Java', '.swift': 'Swift',
  '.js': 'JavaScript', '.jsx': 'JavaScript', '.mjs': 'JavaScript', '.cjs': 'JavaScript',
  '.ts': 'TypeScript', '.tsx': 'TypeScript', '.py': 'Python', '.rb': 'Ruby',
  '.go': 'Go', '.rs': 'Rust', '.php': 'PHP', '.cs': 'C#', '.c': 'C', '.h': 'C/C++ header',
  '.cpp': 'C++', '.cc': 'C++', '.hpp': 'C++', '.m': 'Objective-C', '.mm': 'Objective-C++',
  '.dart': 'Dart', '.scala': 'Scala', '.sh': 'Shell', '.ps1': 'PowerShell',
  '.sql': 'SQL', '.xml': 'XML', '.html': 'HTML', '.css': 'CSS', '.scss': 'SCSS',
  '.json': 'JSON', '.yml': 'YAML', '.yaml': 'YAML', '.toml': 'TOML', '.gradle': 'Gradle',
  '.md': 'Markdown', '.vue': 'Vue', '.proto': 'Protobuf', '.tf': 'Terraform',
};
const CODE_LANGS = new Set(['Kotlin', 'Java', 'Swift', 'JavaScript', 'TypeScript', 'Python',
  'Ruby', 'Go', 'Rust', 'PHP', 'C#', 'C', 'C++', 'Objective-C', 'Objective-C++', 'Dart',
  'Scala', 'Shell', 'PowerShell', 'SQL', 'Vue']);
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']);

const MANIFESTS = [
  'package.json', 'build.gradle', 'build.gradle.kts', 'settings.gradle', 'settings.gradle.kts',
  'pom.xml', 'requirements.txt', 'pyproject.toml', 'Pipfile', 'go.mod', 'Cargo.toml',
  'Gemfile', 'composer.json', 'pubspec.yaml', 'Package.swift', 'CMakeLists.txt',
  'gradle/libs.versions.toml', 'Podfile',
];
const ENTRY_HINTS = [
  /(^|\/)MainActivity\.(kt|java)$/i, /(^|\/)Application\.(kt|java)$/i, /(^|\/)App\.(kt|java|tsx?|jsx?)$/i,
  /(^|\/)main\.(py|go|rs|ts|js|dart|c|cpp|swift)$/i, /(^|\/)index\.(ts|js|tsx|jsx)$/i,
  /(^|\/)Program\.cs$/i, /(^|\/)manage\.py$/i, /(^|\/)server\.(ts|js)$/i, /(^|\/)AppDelegate\.swift$/i,
];
const CI_FILES = [/^\.github\/workflows\//, /^\.gitlab-ci\.yml$/, /^Jenkinsfile$/, /^\.circleci\//,
  /^azure-pipelines\.yml$/, /^\.travis\.yml$/, /^bitrise\.yml$/];

const args = parseArgs();
if (args.help) { log('Usage: node scripts/analyze-repo.mjs --ws <dir> --repo <url|path> [--depth N]'); process.exit(0); }
const ws = requireWs(args);
if (!args.repo) fail('Thieu --repo <url github hoac duong dan local>');

/* ----------------------------------------------------------- get source */

const isUrl = /^(https?:\/\/|git@)/.test(String(args.repo));
let repoPath, repoUrl = null, source;

if (isUrl) {
  repoUrl = String(args.repo);
  repoPath = path.join(ws, 'repo');
  source = 'clone';
  if (exists(path.join(repoPath, '.git'))) {
    log(`Repo da clone truoc do: ${repoPath} (dung lai, chay "git pull" thu cong neu can)`);
  } else {
    fs.rmSync(repoPath, { recursive: true, force: true });
    const cloneArgs = ['clone', '--single-branch'];
    if (args.depth) cloneArgs.push('--depth', String(args.depth));
    cloneArgs.push(repoUrl, repoPath);
    log(`git ${cloneArgs.join(' ')}`);
    const r = spawnSync('git', cloneArgs, { stdio: 'inherit' });
    if (r.status !== 0) fail('git clone that bai.', 'Repo private? Thu clone thu cong roi truyen --repo <duong-dan-local>.');
  }
} else {
  repoPath = path.resolve(String(args.repo));
  source = 'local';
  if (!exists(repoPath)) fail(`Khong tim thay duong dan: ${repoPath}`);
}

/* -------------------------------------------------------------- walk fs */

const files = [];
let skipped = 0;
(function walk(dir, rel = '') {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) { skipped++; continue; }
      walk(abs, r);
    } else if (e.isFile()) {
      let st; try { st = fs.statSync(abs); } catch { continue; }
      files.push({ rel: r, abs, size: st.size, ext: path.extname(e.name).toLowerCase() });
    }
  }
})(repoPath);

const isBinary = (buf) => buf.includes(0);
function countLines(f) {
  if (f.size > 2 * 1024 * 1024) return null;
  try {
    const buf = fs.readFileSync(f.abs);
    if (isBinary(buf.subarray(0, 1024))) return null;
    const s = buf.toString('utf8');
    return s.length ? s.split(/\r?\n/).length : 0;
  } catch { return null; }
}

/* ------------------------------------------------------------ languages */

const byLang = new Map();
let totalLoc = 0, totalSize = 0;
for (const f of files) {
  totalSize += f.size;
  const lang = LANG[f.ext];
  if (!lang) continue;
  const loc = countLines(f);
  if (loc === null) continue;
  f.loc = loc;
  totalLoc += loc;
  const cur = byLang.get(lang) || { language: lang, files: 0, loc: 0, isCode: CODE_LANGS.has(lang) };
  cur.files++; cur.loc += loc;
  byLang.set(lang, cur);
}
const languages = [...byLang.values()].sort((a, b) => b.loc - a.loc)
  .map((l) => ({ ...l, pct: totalLoc ? +(l.loc * 100 / totalLoc).toFixed(1) : 0 }));
const codeLoc = languages.filter((l) => l.isCode).reduce((s, l) => s + l.loc, 0);

/* ----------------------------------------------------------------- tree */

const tree = {};
for (const f of files) {
  const parts = f.rel.split('/');
  const key = parts.length === 1 ? '(root)' : parts.slice(0, Math.min(2, parts.length - 1)).join('/');
  const n = tree[key] || (tree[key] = { path: key, files: 0, loc: 0 });
  n.files++; n.loc += f.loc || 0;
}
const topDirs = Object.values(tree).sort((a, b) => b.loc - a.loc).slice(0, 30);

/* ------------------------------------------------------------ manifests */

const manifests = {};
for (const m of MANIFESTS) {
  const f = files.find((x) => x.rel === m || x.rel.endsWith(`/${m}`));
  if (!f || f.size > 200 * 1024) continue;
  const text = fs.readFileSync(f.abs, 'utf8');
  const entry = { path: f.rel, lines: text.split(/\r?\n/).length };
  if (m === 'package.json') {
    try {
      const j = JSON.parse(text);
      entry.name = j.name; entry.version = j.version;
      entry.dependencies = Object.keys(j.dependencies || {});
      entry.devDependencies = Object.keys(j.devDependencies || {});
      entry.scripts = Object.keys(j.scripts || {});
    } catch { /* ignore */ }
  } else {
    entry.declaredDependencies = [...new Set(
      (text.match(/(?:implementation|api|compileOnly|testImplementation|kapt|ksp)\s*[("']([^"')]+)/g) || [])
        .map((s) => s.replace(/^[a-zA-Z]+\s*[("']/, '')),
    )].slice(0, 60);
    if (!entry.declaredDependencies.length) delete entry.declaredDependencies;
    entry.excerpt = text.split(/\r?\n/).slice(0, 60).join('\n');
  }
  manifests[m] = entry;
}

/* ------------------------------------------- entry points / tests / ci */

const entryPoints = files.filter((f) => ENTRY_HINTS.some((re) => re.test(f.rel)))
  .map((f) => ({ path: f.rel, loc: f.loc ?? null })).slice(0, 25);

const testFiles = files.filter((f) =>
  /(^|\/)(test|tests|spec|__tests__|androidTest)(\/|$)/i.test(f.rel) ||
  /(Test|Tests|Spec|_test)\.[a-z]+$/.test(f.rel));
const ciFiles = files.filter((f) => CI_FILES.some((re) => re.test(f.rel))).map((f) => f.rel);

const images = files.filter((f) => IMAGE_EXT.has(f.ext) && f.size > 4 * 1024)
  .map((f) => {
    let dim = null;
    try { dim = imageSize(fs.readFileSync(f.abs)); } catch { /* svg etc. */ }
    return { path: f.rel, sizeKb: Math.round(f.size / 1024), width: dim?.width ?? null, height: dim?.height ?? null };
  })
  .sort((a, b) => b.sizeKb - a.sizeKb).slice(0, 40);

const readmeFile = files.find((f) => /^readme(\.md|\.rst|\.txt)?$/i.test(f.rel));
const readme = readmeFile ? {
  path: readmeFile.rel,
  lines: readmeFile.loc ?? countLines(readmeFile),
  excerpt: fs.readFileSync(readmeFile.abs, 'utf8').split(/\r?\n/).slice(0, 120).join('\n'),
} : null;

const licenseFile = files.find((f) => /^licen[sc]e(\.\w+)?$/i.test(f.rel));

const biggest = files.filter((f) => f.loc && CODE_LANGS.has(LANG[f.ext]))
  .sort((a, b) => b.loc - a.loc).slice(0, 25).map((f) => ({ path: f.rel, loc: f.loc }));

/* ------------------------------------------------------------------ git */

function git(argv) {
  const r = spawnSync('git', ['-C', repoPath, ...argv], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return r.status === 0 ? r.stdout : null;
}
let gitInfo = null;
if (exists(path.join(repoPath, '.git'))) {
  const logOut = git(['log', '--pretty=format:%H|%an|%ad', '--date=short']);
  if (logOut) {
    const rows = logOut.split(/\r?\n/).filter(Boolean).map((l) => {
      const [hash, author, date] = l.split('|');
      return { hash, author, date };
    });
    const authors = new Map();
    const byMonth = new Map();
    for (const c of rows) {
      authors.set(c.author, (authors.get(c.author) || 0) + 1);
      const m = c.date.slice(0, 7);
      byMonth.set(m, (byMonth.get(m) || 0) + 1);
    }
    const nameStat = git(['log', '--pretty=format:', '--name-only']) || '';
    const churn = new Map();
    for (const p of nameStat.split(/\r?\n/)) if (p.trim()) churn.set(p, (churn.get(p) || 0) + 1);
    gitInfo = {
      commits: rows.length,
      branch: (git(['rev-parse', '--abbrev-ref', 'HEAD']) || '').trim() || null,
      headCommit: rows[0]?.hash?.slice(0, 10) || null,
      firstCommitDate: rows[rows.length - 1]?.date || null,
      lastCommitDate: rows[0]?.date || null,
      authors: [...authors.entries()].sort((a, b) => b[1] - a[1]).map(([name, commits]) => ({ name, commits })),
      commitsByMonth: Object.fromEntries([...byMonth.entries()].sort()),
      mostChangedFiles: [...churn.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)
        .map(([p, changes]) => ({ path: p, changes })),
    };
  }
}

/* --------------------------------------------------------------- output */

const profile = {
  generatedAt: today(),
  repo: {
    source, url: repoUrl, path: repoPath,
    name: path.basename(repoPath),
    hasLicense: !!licenseFile, licensePath: licenseFile?.rel ?? null,
  },
  totals: {
    files: files.length,
    skippedDirs: skipped,
    sizeMb: +(totalSize / 1048576).toFixed(2),
    loc: totalLoc,
    codeLoc,
    testFiles: testFiles.length,
  },
  languages,
  topDirectories: topDirs,
  entryPoints,
  biggestSourceFiles: biggest,
  testFiles: testFiles.slice(0, 40).map((f) => f.rel),
  ciFiles,
  manifests,
  images,
  readme,
  git: gitInfo,
};

const out = args.out ? path.resolve(String(args.out)) : path.join(ws, 'repo-profile.json');
writeJson(out, profile);

log('');
log(`  Repo        : ${profile.repo.name}  (${source})`);
log(`  Files       : ${profile.totals.files}   LOC: ${profile.totals.loc}   code LOC: ${codeLoc}`);
log(`  Languages   : ${languages.slice(0, 6).map((l) => `${l.language} ${l.pct}%`).join(', ') || 'khong nhan dang duoc'}`);
log(`  Tests       : ${testFiles.length} file    CI: ${ciFiles.length} file`);
log(`  Git         : ${gitInfo ? `${gitInfo.commits} commit, ${gitInfo.authors.length} tac gia, ${gitInfo.firstCommitDate} -> ${gitInfo.lastCommitDate}` : 'khong phai git repo'}`);
log(`  Anh co san  : ${images.length}`);
log('');
log(`  Da ghi ${out}`);
if (!readme) warn('Repo khong co README - can doc truc tiep source de hieu nghiep vu.');
