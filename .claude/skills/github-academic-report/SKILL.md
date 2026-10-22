---
name: github-academic-report
description: Use when the user wants a graduate-level academic report and/or presentation deck generated from a software project — typically a GitHub repository (URL or local path), with or without an existing outline. Produces a Word report (.docx) that follows the faculty formatting guideline (Times New Roman 13, 1.3 line spacing, A4 margins 2.5/2/3.5/2 cm, roman-then-arabic page numbering, auto-numbered figures/tables via Word fields, verified references) plus a designed PowerPoint deck (.pptx) where every slide carries a presenter script. Trigger phrases include "viết báo cáo bài tập lớn từ repo này", "làm báo cáo Word + slide cho đồ án", "báo cáo cao học", "tạo slide thuyết trình cho dự án GitHub", "sinh báo cáo từ mã nguồn".
---

# GitHub project → academic report + slides

## Overview

Turn a software project into two deliverables: a Word report that a graduate committee will
accept, and a presentation deck that can actually be presented. The hard parts — Word field
plumbing, formatting compliance, reference integrity, slide consistency — are handled by
scripts so the work here is research and writing, not layout.

Everything the user reads is **Vietnamese**. This file is the procedure; the reference files
carry the domain rules.

## Three rules that outrank everything else

**1. No number is ever typed.** Figure, table, appendix and reference numbers, cross-references,
page numbers, the table of contents and the lists of figures/tables are all **Word fields**
(`SEQ`, `STYLEREF`, `REF`, `TOC`, `PAGE`). Writing `Hình 2.1` into a sentence is a defect, not a
style choice — use `[[xref:id]]`. `verify-output.mjs` fails the build when it finds a typed one.

**2. No reference is ever invented.** Every entry in `refs.json` must come from a search
performed in this session and must be opened and checked (title + authors + year) before it is
recorded, with `verified.url` and `verified.accessed`. If a claim cannot be sourced, rewrite the
claim. See `references/tai-lieu-tham-khao.md`.

**3. Every slide has a presenter script.** `build-pptx.mjs` refuses to build a deck where any
slide is missing `notes` or has fewer than 200 characters of it.

Nothing about the project may be asserted unless it is traceable to the cloned repository —
a file path, a commit, or a number from `repo-profile.json`. Paths quoted in the report are
checked for existence (QĐ-15).

## Workflow

Eight steps, five approval gates. Do not run ahead of a gate.

### Step 0 — Intake (BLOCKING, always ask)

Ask these in one message and **wait for answers**. Never guess, never infer from the repo.

1. **Người hướng dẫn** — họ tên đầy đủ kèm học hàm/học vị (TS. / PGS.TS. / ThS. …).
2. **Cá nhân hay nhóm?** — nếu nhóm: họ tên **và mã học viên** của từng thành viên.
3. **Đã có outline chưa?** — nếu có, xin đường dẫn file hoặc nội dung; nếu chưa, skill sẽ đề xuất.

Ask for the rest in the same message (these have defaults, so note the default and move on if
the user skips them):

4. Repo GitHub (URL) hoặc đường dẫn dự án local — **bắt buộc**.
5. Tên học phần; tên đề tài.
6. Lớp, khoá; trường/khoa (mặc định: Trường CNTT&TT — Đại học Công nghiệp Hà Nội).
7. Thời lượng thuyết trình (mặc định 15 phút); độ dài báo cáo mong muốn (mặc định 30–40 trang).
8. Thư mục làm việc (mặc định `./bao-cao-<slug-đề-tài>/`).

Write the answers to `<ws>/intake.json`, echo them back as a table, and **GATE 1**: ask the user
to confirm before continuing.

### Step 1 — Workspace

```bash
node scripts/setup-workspace.mjs --ws "<ws>"
```

Creates the directory tree, installs `docx` + `pptxgenjs` + `jszip`, detects `git` and the
draw.io Desktop CLI, and writes `env-report.json`. If draw.io is missing, figures must come from
the repo or the user; if `git` is missing, only a local path can be analysed.

### Step 2 — Analyse the project

```bash
node scripts/analyze-repo.mjs --ws "<ws>" --repo <url|path>
```

Produces `repo-profile.json`: languages and LOC, directory weights, dependency manifests, entry
points, tests, CI, README excerpt, embedded images, and git statistics (commits, authors, activity
by month, most-changed files).

Then read the profile plus the README and the handful of files that actually explain the system
(entry points, the largest source files, the DI/module wiring). Write `<ws>/repo-findings.md`:
domain, real features, architecture, tech stack, notable engineering decisions, and the numbers
worth quoting. **Every number in the report comes from this file — never estimate.**

### Step 3 — Outline — GATE 2

Read `references/cau-truc-va-outline.md`.

- User has one → normalise it to the required skeleton, flag anything that breaks the guideline
  (deeper than 4 levels, missing MỞ ĐẦU/KẾT LUẬN, a chapter with a single subsection), and list
  the sections the repo has no evidence for.
- User has none → pick the template matching the project type, rename chapters to the real domain,
  and drop sections the repo cannot support.

Present it as a table: mỗi mục → nội dung dự kiến, hình/bảng dự kiến, nguồn dẫn chứng.
**Do not write any content until the user approves the outline.**

### Step 4 — References — GATE 3

Read `references/tai-lieu-tham-khao.md` and follow its protocol. Search with
`firecrawl_research_search_papers`, `firecrawl_developer_search`, `WebSearch`; open each candidate
with `WebFetch` and verify before recording. Target 10–15 entries, ≥ 5 academic, ≥ 3 from the last
five years, Vietnamese sources where the field has them.

Write `<ws>/content/refs.json`, present the list, **wait for approval**.

### Step 5 — Write the chapters — GATE 4 (per chapter)

Read `references/van-phong-hoc-thuat.md` and `references/word-fields-va-schema.md` once, then
write chapter by chapter into `<ws>/content/report.json`.

For each chapter: draft → run the self-check list at the end of `van-phong-hoc-thuat.md` →
show the user a readable Markdown preview → get approval → next chapter. Declare figures and
tables as blocks with an `id`; reference them only through `[[xref:id]]`, and cite only through
`[[cite:key]]`.

Collect every figure into `<ws>/content/figures.json` as you go.

### Step 6 — Figures

Author diagrams as Mermaid (preferred — the draw.io CLI lays them out) or draw.io XML when the
layout must be hand-controlled, then:

```bash
node scripts/render-figures.mjs --ws "<ws>"
```

Add `%%{init: {'theme':'neutral'}}%%` at the top of a Mermaid source for a grayscale academic look
instead of the default purple. Screenshots must come from the repo or the user — never fabricate a
screenshot of a screen that does not exist. If the `drawio` skill is loaded, it is the reference
for Mermaid and mxGraph syntax; this script just drives the same CLI deterministically and records
each image's real pixel size.

### Step 7 — Build

```bash
node scripts/build-docx.mjs --ws "<ws>"
node scripts/build-pptx.mjs --ws "<ws>"
```

Derive `deck.json` **from the approved report content** so the two deliverables cannot drift —
same figures, same numbers, same conclusions. Read `references/slide-design-system.md` for the
layout catalogue, the text budgets and the presenter-script formula.

### Step 8 — Verify and hand over — GATE 5

```bash
node scripts/verify-output.mjs --ws "<ws>"
```

Writes `output/compliance-report.md`, a rule-by-rule evidence table, and exits non-zero on any
FAIL. Fix and rebuild until there are no FAILs; explain any remaining WARN to the user.

Hand over with the three paths (`bao-cao.docx`, `slide.pptx`, `compliance-report.md`) and this
instruction, which matters:

> Mở `bao-cao.docx` bằng Word → chọn **Yes** khi Word hỏi cập nhật trường → `Ctrl+A` rồi `F9`
> (nhấn **hai lần**) để điền số trang cho MỤC LỤC và các danh mục. `Alt+F9` để xem mã trường.

## Bundled resources

| File | Read it when |
|---|---|
| `references/quy-dinh-trinh-bay.md` | Before touching formatting, or when the user supplies a different guideline document |
| `references/cau-truc-va-outline.md` | Step 3 — outline templates by project type, length budgeting |
| `references/tai-lieu-tham-khao.md` | Step 4 — citation formats and the anti-fabrication protocol |
| `references/van-phong-hoc-thuat.md` | Step 5 — graduate register, banned phrasing, before/after examples, self-check list |
| `references/word-fields-va-schema.md` | Step 5/7 — `report.json` schema, inline markup, Word field recipes |
| `references/slide-design-system.md` | Step 7 — tokens, 11 layouts, text budgets, presenter-script formula |
| `assets/design-tokens.json` | Palette/typography source of truth for the deck |
| `assets/*.example.json` | Working examples of every content file — they build cleanly, but describe a *fictional* Android project, so QĐ-15 will fail until the paths are replaced with real ones from the analysed repo |

## Workspace layout

```
<ws>/
├── intake.json            thông tin do user cung cấp
├── env-report.json        công cụ phát hiện được
├── repo/                  repo đã clone (hoặc trỏ tới path local)
├── repo-profile.json      số liệu dự án - nguồn duy nhất cho mọi con số
├── repo-findings.md       phân tích của bạn
├── content/
│   ├── report.json  refs.json  figures.json  deck.json
├── figures/               PNG đã render + manifest.json
└── output/
    ├── bao-cao.docx  slide.pptx  compliance-report.md
```

## Notes

- Scripts are plain Node ESM and take `--ws`; every one supports `--help`.
- The builders load `docx`/`pptxgenjs` from the **workspace** `node_modules`, so the skill folder
  never needs to be an npm package.
- Word (or LibreOffice) is not required to build — only to read the result. On a machine with
  Word, exporting to PDF after updating fields is a good final visual check.
- If the user supplies a different faculty guideline, read it, update
  `references/quy-dinh-trinh-bay.md` and the `G` constants in `scripts/build-docx.mjs`, and say
  explicitly which rules changed.
- If a caption ever shows the wrong chapter number in some Word build, set
  `config.captionChapterSource = "seq"` in `report.json` — the builder then derives chapter numbers
  from a `SEQ` chain instead of `STYLEREF`.
