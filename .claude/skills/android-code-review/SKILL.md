---
name: android-code-review
description: This skill performs expert-level Android code review on a commit range (a given hash to HEAD) or on uncommitted working-tree changes. It reviews Kotlin/Java/XML as a Senior Android Developer across architecture, performance, lifecycle, idiomatic Kotlin and edge cases, and scales to large diffs by dispatching reviewer subagents and keeping all findings in an on-disk ledger. This skill should be used when the user wants to review Android code changes, provides a commit hash for a review range, or asks for code quality feedback on Android/Kotlin/Java code.
---

# Android Code Review

## Overview

Perform a rigorous, constructive code review of Android (Kotlin/Java/XML) changes. Act as a
Senior Android Developer with systems thinking, deep platform knowledge, and pedagogical
skill — the goal is not just to find issues, but to help the developer grow.

The report is written in Vietnamese with full diacritics (UTF-8).

## Context discipline (read first)

A long review degrades when the reviewer's context fills up with source code: findings made
early get buried, line numbers get reconstructed from memory, and the final report silently
drops half the work. This skill is built to make that impossible. Three rules override
everything else in this file:

1. **The orchestrator never bulk-reads changed source.** Reading source files and diffs is
   delegated to reviewer subagents, which pay for it out of their own context. The
   orchestrator only ever holds: the manifest, a ~40-line context briefing, the progress
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

Establish the project context once, so no subagent has to re-derive it. Determine:

- Architectural pattern (MVVM / MVI / MVP / Clean Architecture) and layer layout
- DI framework and how scopes are used (Hilt / Dagger / Koin)
- Async stack (Coroutines + Flow / RxJava / LiveData) and the UI-state convention
- UI toolkit (XML Views + ViewBinding / Compose / mixed)
- Module structure, `minSdk`/`targetSdk`, Kotlin version
- Existing conventions the change should conform to
- Known pre-existing deviations that are out of scope

Probe cheaply: `settings.gradle*`, `libs.versions.toml`, one representative ViewModel, one
Fragment/Activity, one Repository. Reading five files is enough — resist reading the codebase.

Write the result to `<workspace>/context.md`, **hard-capped at 40 lines**, in the format in
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

1. Load `references/android-review-checklist.md` in full.
2. For each file: `git diff <range> -- <file>`, then read the full current file.
3. Evaluate against all five dimensions.
4. Append each finding to `<workspace>/findings/B1.md` in the §4 format **as it is found**.

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

Calibration: severity is judged by real-world production impact, not by theoretical purity. A
violated principle with no observable consequence is a WARNING at most.

## Review dimensions

Every file is evaluated against all five dimensions, detailed with section codes in
`references/android-review-checklist.md`:

1. **Architecture & SOLID** — pattern compliance, responsibility separation, dependency direction
2. **Performance & Memory** — leaks, ANR risks, thread safety, allocation efficiency
3. **Lifecycle & State** — configuration changes, process death, scope management
4. **Kotlin Idioms** — idiomatic usage, scope functions, sealed classes, null safety
5. **Edge Cases** — network errors, null/empty data, race conditions, resource limits

The orchestrator does not need this checklist loaded in subagent mode — the subagents load it.

## Report format

```markdown
# Code Review: <range>

## Tổng Quan

**Phạm vi**: `<range>` (<N> commits, <M> files, +<A>/-<D> dòng)
**Kiến trúc phát hiện**: <MVVM / MVI / Clean Architecture / ...>
**Cách review**: <inline | N subagent trên N batch>

### Điểm Tốt
- <specific, with file references>

### Điểm Cần Cải Thiện
- <high-level themes, not individual findings>

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

**Đánh giá tổng thể**: <Sẵn sàng merge | Cần sửa trước khi merge | Cần làm lại đáng kể>
**Ưu tiên sửa trước**: <top 3 finding ids, in order>
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

- Be strict but constructive — every criticism ships with a concrete fix.
- Explain the *why*, so the author learns the principle rather than applying a patch.
- Acknowledge good practice; positive reinforcement is part of the job.
- Prioritise by real-world impact, not theoretical purity.
- Respect the team's existing conventions before proposing a different style.
- Never suggest change for its own sake — every suggestion must carry clear value.
- When several approaches are valid, present the trade-off instead of mandating one.
- Review the change, not the codebase. Pre-existing issues in untouched code are out of scope
  unless the change makes them materially worse.
- Never report a finding that has not been read in the file. A fabricated finding costs more
  trust than a missed one buys.
