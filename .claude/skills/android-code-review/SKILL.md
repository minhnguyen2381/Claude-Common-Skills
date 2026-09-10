---
name: android-code-review
description: Use when the user wants an Android/Kotlin/Java/XML code review — on a commit range (a given hash, tag, branch or PR to HEAD) or on uncommitted working-tree changes — or asks for code quality feedback, architecture compliance checks (MVVM / MVI / Clean Architecture), or a YAGNI/KISS/DRY assessment of Android code. Also use when the user provides a commit hash and asks what is wrong with the changes.
---

# Android Code Review

## Overview

Perform a rigorous, constructive code review of Android (Kotlin/Java/XML) changes. Act as a
Senior Android Developer with systems thinking, deep platform knowledge, and pedagogical
skill — the goal is not just to find issues, but to help the developer grow.

The report is written in Vietnamese with full diacritics (UTF-8).

## Two rules that outrank everything else in the review

**1. YAGNI / KISS / DRY come first.** Before asking whether code is well-architected, ask
whether it should exist at all (YAGNI), whether it is the simplest thing that solves the real
requirement (KISS), and whether it duplicates knowledge already in the codebase (DRY). These
are dimension 0 in the checklist and they are judged before every other dimension. A change
that is architecturally immaculate but solves a problem nobody has is still a defect. When
DRY and KISS collide, KISS wins; when DRY and YAGNI collide, YAGNI wins.

**2. Every finding is judged against this app's context.** What kind of app is this, who uses
it, at what scale, how does it earn, where are its critical paths, and what can this team
actually afford to change? The same defect is CRITICAL on the cold-start path of an ad-funded
app and NITPICK in the settings screen of an internal tool. Severity is reach × likelihood ×
cost *for this app*, never textbook severity. A finding must also answer whether the approach
is still appropriate for the project's current direction — extending a library the project is
migrating away from is a finding even when the code is correct.

Neither rule is optional, and neither is satisfied by mentioning it. Dimension 0 produces its
own findings; context produces a required `Phù hợp bối cảnh` paragraph in every finding.

## Context discipline (read first)

A long review degrades when the reviewer's context fills up with source code: findings made
early get buried, line numbers get reconstructed from memory, and the final report silently
drops half the work. This skill is built to make that impossible. Three rules override
everything else in this file:

1. **The orchestrator never bulk-reads changed source.** Reading source files and diffs is
   delegated to reviewer subagents, which pay for it out of their own context. The
   orchestrator only ever holds: the manifest, a ~55-line context briefing, the progress
   ledger, and the finding files.
2. **A finding is not real until it is on disk.** Findings are appended to
   `<workspace>/findings/<batch-id>.md` as they are discovered — never held in conversation
   to be written up later. The final report is assembled *by reading those files*.
3. **Every number is recomputed, never recalled.** Counts come from `grep -c`, ids come from
   re-reading the finding files, line numbers come from `sed -n` against the real file.

If any step is ever unclear about where state lives, the answer is: on disk, under the
workspace.

## Workflow

### Step 0 — Determine the range

- A commit hash / tag / branch given by the user → review `<ref>..HEAD`.
- No ref given → review uncommitted working-tree changes (staged + unstaged + untracked)
  against HEAD. State this assumption in the report header.
- If the user names a PR or branch, resolve the base with
  `git merge-base HEAD <branch>` and use that as the ref.

Create the workspace under the session scratchpad directory:

```
<scratchpad>/android-review/<short-sha-or-worktree>/
```

Use an absolute path. Every subagent will be handed this path.

### Step 1 — Scope and batch plan

Run the scoping script. It is deterministic, so the batch plan does not have to be reasoned
about (and cannot drift between re-runs):

```bash
bash <skill-dir>/scripts/scope-review.sh --out <workspace> [<base-ref>]
```

It writes `manifest.md` and `batches.tsv`, and prints `MODE=inline|subagent` plus file and
churn counts. Exit code 3 means there is nothing reviewable — report that and stop.

Read `manifest.md` (it is small). Do **not** run `git diff` for the whole range.

### Step 2 — Context probe

Establish the context once, so no subagent has to re-derive it. It has two halves, and both
are required — the technical half decides whether code is *correct*, the app half decides how
much a defect *matters*.

**Technical:**

- Architectural pattern (MVVM / MVI / MVP / Clean Architecture) and layer layout
- DI framework and how scopes are used (Hilt / Dagger / Koin)
- Async stack (Coroutines + Flow / RxJava / LiveData) and the UI-state convention
- UI toolkit (XML Views + ViewBinding / Compose / mixed)
- Module structure, `minSdk`/`targetSdk`, Kotlin/AGP version
- Existing conventions the change should conform to
- Known pre-existing deviations that are out of scope

**App context** (this is what dimension 6.4 and every severity is calibrated against):

- What the app does and who its users are
- Scale — user count, device profile, Android version spread
- How it earns (ads / IAP / subscription / internal tool) and what that makes expensive
- Critical paths where latency or a crash costs real money, and areas where it does not
- The project's current direction (XML → Compose migration, a library being retired, a
  module split in progress)
- Team constraints — size, release cadence, whether a large refactor is realistic

Probe cheaply: `settings.gradle*`, `libs.versions.toml`, `AndroidManifest.xml`, one
representative ViewModel, one Fragment/Activity, one Repository, plus `README` and recent
commit subjects for direction. Reading a handful of files is enough — resist reading the
codebase. Anything inferred rather than observed is marked with `?`. If the user described
the app in their request, that beats inference. If the app's purpose truly cannot be
determined, write `domain: unknown` rather than guessing, and say so in the report.

Write the result to `<workspace>/context.md`, **hard-capped at 55 lines**, in the format in
`references/review-protocol.md` §3. This file is duplicated into every subagent prompt, so
every line costs once per batch.

### Step 3 — Initialise the progress ledger

Write `<workspace>/progress.md` from `batches.tsv`, in the format in `references/review-protocol.md` §2:
one row per batch, all `pending`. This file is the recovery anchor — see
"Resuming after context loss" below.

### Step 4 — Review

Branch on the mode reported by the script.

#### Step 4a — Inline mode (`MODE=inline`)

For a small change (≤ 3 files and ≤ 300 changed lines) subagent overhead is not worth it.
Review directly:

1. Load `references/android-review-checklist.md`, `references/architecture-guide.md` and
   `references/do-and-dont.md` in full.
2. For each file: `git diff <range> -- <file>`, then read the full current file.
3. Evaluate against all seven dimensions, **starting with dimension 0 (YAGNI/KISS/DRY)**.
4. Append each finding to `<workspace>/findings/B1.md` in the §4 format **as it is found**,
   including the required `Phù hợp bối cảnh` paragraph. Open the file with the
   `<!--DIMENSIONS-->` verdict table.

#### Step 4b — Subagent mode (`MODE=subagent`)

Dispatch one reviewer subagent per batch, using `subagent_type: "general-purpose"` and the
briefing template in `references/review-protocol.md` §5. Fill in every placeholder — a fresh
agent has none of this session's context, so the prompt must stand alone.

- Launch up to **4 batches in parallel** by putting several `Agent` calls in one message.
- Mark those batches `running` in `progress.md` before launching, `done` when they return,
  `failed` if a subagent errors or returns no file.
- After each wave returns, **rewrite `progress.md` immediately** — before starting the next
  wave. This is what makes the review resumable.
- Do not read the returned findings in detail yet. The return value is a bounded summary;
  the content stays on disk until Step 5.
- If a subagent reports context that contradicts `context.md`, update `context.md` and
  include the correction in later waves' prompts.

Re-dispatch `failed` batches once. If a batch fails twice, mark it `failed` permanently and
declare it explicitly in the report — never silently omit a batch.

### Step 5 — Verify

Only once every batch is `done`, apply the verification rules in
`references/review-protocol.md` §6:

- Line-verify every `BLOCKER` and `CRITICAL` against the real file with `sed -n`.
- Drop findings whose evidence quote does not match the file, and note the drop.
- **Context gate**: drop any non-POSITIVE finding with no `Phù hợp bối cảnh`, or whose impact
  is only "a principle is violated" with no consequence named for this app.
- **Dimension 0 gate**: if a non-trivial change produced not a single 0.x finding, spot-check
  one batch — was dimension 0 genuinely passed, or never walked?
- **Over-abstraction gate**: drop any suggestion that trades a small duplication for a new
  interface, module, or layer without justifying it against 0.1 and 0.2.
- Deduplicate the same defect appearing in multiple batches into one finding with several
  locations.
- Re-check severity calibration against the definitions below.

### Step 6 — Assemble and deliver

Assemble `report.md` on disk (protocol §7), then read it back once to present it. Counts come
from `grep -c` over the finding files.

If the report is under ~400 lines, print it in full. Otherwise print `Tổng Quan`, all
BLOCKER/CRITICAL findings, and `Tổng Kết`, then give the absolute path to `report.md` and
offer to send the full file.

## Severity levels

- **BLOCKER** — will cause a crash, data loss, security vulnerability, or memory leak in
  production. Must be fixed before merge.
- **CRITICAL** — incorrect behaviour, real performance degradation, or an architectural
  violation that will bite at scale. Should be fixed before merge.
- **WARNING** — a probable problem or a code smell that will cause trouble later. Strongly
  recommended to fix.
- **NITPICK** — style, naming, or micro-optimisation. Nice to have, never blocking.
- **POSITIVE** — a good practice worth naming. Acknowledge what was done well.

**Calibration is contextual, not textbook.** Severity is reach × likelihood × cost *for this
app*, judged against the `app_context` block. A violated principle with no observable
consequence in this app is a WARNING at most; if the consequence is genuinely zero, it is not
a finding. Conversely a "minor" inefficiency on a monetised critical path can be CRITICAL.

| Question | Effect on severity |
|---|---|
| Is it on a critical path from `app_context`? | raises |
| How many users reach it, on what devices? | raises / lowers |
| Does it cost money, data, or trust when it fails? | raises |
| Is it in a screen behind three taps, used by staff? | lowers |
| Is the fix affordable for this team, this sprint? | lowers priority, not severity — say so |
| Is it correct code that contradicts the project's current direction? | WARNING, with the direction named |

## Review dimensions

Every file is evaluated against all seven dimensions, in order, detailed with section codes in
`references/android-review-checklist.md`:

0. **YAGNI / KISS / DRY** — *judged first, outranks everything below*: should this code exist,
   is it the simplest thing that works, does it duplicate existing knowledge
1. **Architecture & SOLID** — pattern compliance (MVVM / MVI / Clean), responsibility
   separation, dependency direction — rules in `references/architecture-guide.md`
2. **Performance & Memory** — leaks, ANR risks, thread safety, allocation, startup, rendering
3. **Lifecycle & State** — configuration changes, process death, scope management, Compose effects
4. **Kotlin Idioms** — idiomatic usage, scope functions, sealed hierarchies, null safety
5. **Edge Cases** — network errors, null/empty data, race conditions, resource limits, security
6. **Platform Currency & Context Fit** — superseded APIs, targetSdk obligations (edge-to-edge,
   predictive back, 16 KB pages, FGS types), and whether the change fits *this* app's context

`references/do-and-dont.md` holds the ❌/✅ code pairs for each section code; draw the fix
block of a finding from it rather than inventing one.

The orchestrator does not need these references loaded in subagent mode — the subagents load
them.

## Report format

```markdown
# Code Review: <range>

## Tổng Quan

**Phạm vi**: `<range>` (<N> commits, <M> files, +<A>/-<D> dòng)
**Kiến trúc phát hiện**: <MVVM / MVI / Clean Architecture / ...>
**Cách review**: <inline | N subagent trên N batch>

### Bối Cảnh Ứng Dụng (cơ sở để chấm mức độ)
- **Loại app / người dùng**: <from app_context>
- **Quy mô**: <MAU, device profile>
- **Doanh thu & đường đi trọng yếu**: <what costs money when it breaks>
- **Hướng đi hiện tại của dự án**: <migration, retirement, refactor in progress>
- **Ràng buộc đội ngũ**: <team size, cadence, feasible scope of change>

> Mọi mức độ (severity) bên dưới được chấm theo bối cảnh này, không theo lý thuyết chung.

### Điểm Tốt
- <specific, with file references>

### Điểm Cần Cải Thiện
- <high-level themes, not individual findings>

---

## Tuân Thủ YAGNI / KISS / DRY (ưu tiên cao nhất)

<all dimension-0 findings, listed before every other section regardless of their severity.
If there are none, state explicitly: "Không phát hiện vi phạm YAGNI/KISS/DRY trong phạm vi
thay đổi này." — never omit the section.>

| Nguyên tắc | Vi phạm | Finding |
|---|---|---|
| YAGNI (0.1) | X | <ids> |
| KISS (0.2)  | X | <ids> |
| DRY (0.3)   | X | <ids> |

---

## Vấn Đề Nghiêm Trọng (Blocker/Critical)

<finding blocks, format in references/review-protocol.md §4, renumbered B-01, C-01, ...>

---

## Gợi Ý Tối Ưu (Warning/Nitpick)

<finding blocks, renumbered W-01, N-01, ...>

---

## Điểm Làm Tốt (Positive)

<finding blocks, renumbered P-01, ...>

---

## Đề Xuất Refactor

<only for changes spanning multiple files or requiring architectural change; full refactored
code with step-by-step reasoning. Omit this section entirely when there is nothing to say.>

---

## Tổng Kết

| Mức Độ   | Số Lượng |
|----------|----------|
| Blocker  | X |
| Critical | X |
| Warning  | X |
| Nitpick  | X |
| Positive | X |

| Chiều đánh giá | Số finding |
|---|---|
| 0. YAGNI/KISS/DRY | X |
| 1. Architecture & SOLID | X |
| 2. Performance & Memory | X |
| 3. Lifecycle & State | X |
| 4. Kotlin Idioms | X |
| 5. Edge Cases | X |
| 6. Platform & Context Fit | X |

**Đánh giá tổng thể**: <Sẵn sàng merge | Cần sửa trước khi merge | Cần làm lại đáng kể>
**Ưu tiên sửa trước**: <top 3 finding ids, in order>
**Phù hợp bối cảnh dự án**: <one paragraph: does this change fit where the app and the
project are now — its scale, its monetisation, its current migration direction — or does it
pull against them? Name the specific mismatch, or say plainly that it fits.>
**Batch không review được**: <ids, or "không có">
```

## Resuming after context loss

If it is ever unclear how far the review has got — after a compaction, an interruption, or a
resumed session — do not restart and do not guess. Recover from disk:

1. Read `<workspace>/progress.md` → which batches are `done`.
2. Read `<workspace>/context.md` → the project briefing.
3. `ls <workspace>/findings/` → which finding files exist.
4. Continue from the first batch that is not `done`. Never re-review a `done` batch, and
   never rewrite an existing finding file.

If the workspace path itself has been lost, `ls <scratchpad>/android-review/` and pick the
most recent directory.

## Review philosophy

- **Simplicity first.** YAGNI, KISS and DRY are judged before architecture, and they win when
  they conflict with it. The cheapest code to maintain is the code that was never written.
- **The reviewer's suggestions obey the same rules.** A fix that introduces an interface, a
  module, or a layer must justify itself against 0.1 and 0.2 exactly as the author's code
  must. Never trade a small duplication for a large abstraction.
- Be strict but constructive — every criticism ships with a concrete fix.
- Explain the *why*, so the author learns the principle rather than applying a patch.
- Acknowledge good practice; positive reinforcement is part of the job.
- Prioritise by real-world impact **in this app's context**, not theoretical purity.
- Respect the team's existing conventions before proposing a different style. Consistency
  with the codebase beats the reviewer's preference.
- Never suggest change for its own sake — every suggestion must carry clear value.
- When several approaches are valid, present the trade-off instead of mandating one.
- Review the change, not the codebase. Pre-existing issues in untouched code are out of scope
  unless the change makes them materially worse.
- Never report a finding that has not been read in the file. A fabricated finding costs more
  trust than a missed one buys.

## Red flags — the review has gone wrong

| Symptom in the report | What it means |
|---|---|
| Zero dimension-0 findings on a non-trivial change | dimension 0 was skipped, not passed |
| A finding whose `Tác động` is "vi phạm nguyên tắc X" | no real consequence found; drop or downgrade |
| The suggested fix is longer than the code it replaces | the reviewer violated KISS |
| A DRY finding proposing a helper with a boolean flag | over-DRY; that is itself a finding |
| Every finding could have been written without opening the app's manifest | context was never applied |
| Severities identical to what a textbook would say for any app | 6.4 was not applied |
| An architecture finding citing no specific rule from `architecture-guide.md` | it is a preference, not a defect |
