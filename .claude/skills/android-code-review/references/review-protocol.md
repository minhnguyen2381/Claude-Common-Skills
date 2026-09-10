# Review Protocol

Contract shared by the orchestrator and every reviewer subagent. Governs the finding
format, the subagent briefing, and the verification rules.

## 1. Workspace layout

Everything durable lives on disk so no step depends on remembering an earlier step.

```
<workspace>/
├── manifest.md          # written by scripts/scope-review.sh - scope + batch plan
├── batches.tsv          # batch_id, module, path, added, deleted, churn
├── context.md           # project context briefing (<= 40 lines) - shared by all subagents
├── progress.md          # resumable ledger: one line per batch, status pending|running|done|failed
├── findings/
│   ├── B1.md            # findings for batch B1, written by its reviewer subagent
│   └── B2.md
└── report.md            # final assembled report
```

**Rule**: the orchestrator reads `manifest.md`, `context.md`, `progress.md` and the
`findings/*.md` files. It never reads changed source files in bulk. Source reading is the
subagents' job, paid for out of their context, not the main one.

## 2. progress.md format

Written once after scoping, then rewritten (whole file) after each batch completes. Keep
one line per batch, nothing else - it must stay cheap to re-read after a context compaction.

```markdown
# Progress

range: <base>..HEAD
mode: subagent
context_probe: done

| batch | module | files | status | findings | file |
|---|---|---|---|---|---|
| B1 | app | 4 | done | 2B 1C 3W 1N 2P | findings/B1.md |
| B2 | core/data | 5 | running | - | - |
| B3 | feature/home | 3 | pending | - | - |
```

Statuses: `pending`, `running`, `done`, `failed`. On resume after compaction, re-read this
file and continue from the first non-`done` batch. Never re-review a `done` batch.

## 3. context.md format

Produced once, in the context probe step, and pasted verbatim into every subagent prompt.
Hard cap 40 lines - it is duplicated into every subagent, so every line costs N times.

```markdown
# Project Context

- architecture: MVVM + Clean Architecture (domain/data/presentation)
- di: Hilt (@HiltViewModel, @Singleton in AppModule)
- async: Coroutines + Flow (StateFlow for UI state); no RxJava
- ui: XML Views + ViewBinding; Compose only in feature/settings
- modules: app, core/data, core/ui, feature/home, feature/settings
- min_sdk: 24, target_sdk: 35, kotlin: 2.0.21
- state: UiState sealed interface per feature (Loading/Success/Error)
- conventions:
  - repositories return Result<T>, never throw across layers
  - Fragments observe with repeatOnLifecycle(STARTED)
  - strings always in res/values/strings.xml, no hardcoded literals
- known_deviations:
  - LegacyPlayerActivity still uses AsyncTask - out of scope, pre-existing
```

Only record what changes how a finding is judged. Do not paste code into it.

## 4. Finding entry format

Every finding is one block appended to `findings/<batch-id>.md`. The header line is strict
and greppable; everything below it is free-form Vietnamese prose.

Write the prose in Vietnamese with full diacritics (UTF-8).

```markdown
<!--FINDING-->
### [B1-3] BLOCKER | dim=2.1 | `app/src/main/java/com/x/HomeViewModel.kt:88`

**Bằng chứng**
```kotlin
// HomeViewModel.kt:88 (trích nguyên văn từ file)
private val ctx: Context = activity
```

**Vấn đề**: <what is wrong and WHY it is wrong>

**Tác động**: <concrete production consequence - crash path, leak path, ANR path>

**Đề xuất sửa**:
```kotlin
// Trước
<original>

// Sau
<fixed>
```

**Giải thích**: <why the fix works, which principle it follows>
<!--/FINDING-->
```

Field rules:

- **id**: `<batch-id>-<n>`, n counted from 1 within the batch. The orchestrator renumbers
  to `B-01 / C-01 / W-01 / N-01 / P-01` at report time by reading the files, never from memory.
- **severity**: exactly one of `BLOCKER`, `CRITICAL`, `WARNING`, `NITPICK`, `POSITIVE`.
- **dim**: section code from `android-review-checklist.md`, e.g. `2.1`, `4.3`.
- **location**: repo-relative path plus the line number in the **post-change** file.
- **Bằng chứng**: verbatim quote of the offending lines, copied from the file, never
  paraphrased or reconstructed. A finding without a verbatim quote is not reportable.
- POSITIVE entries may omit `Đề xuất sửa` and `Giải thích`.

Counting is mechanical: `grep -c '^### \[' findings/*.md`, per severity with
`grep -c '| BLOCKER |'` etc.

## 5. Reviewer subagent briefing

Dispatch with `subagent_type: "general-purpose"`. A fresh agent knows nothing about this
session, so the prompt must be self-contained. Fill in the placeholders:

---

You are a Senior Android Developer performing a rigorous code review of one batch of
changed files. Report in Vietnamese.

**Repository**: `<absolute repo path>`
**Review range**: `<base>..HEAD` (or: uncommitted working-tree changes vs HEAD)
**Your batch**: `<batch-id>` - module `<module>`

Files assigned to you (review ONLY these):
```
<one path per line>
```

**Project context** (already established - trust it, do not re-derive it):
```
<verbatim contents of context.md>
```

**Method** - follow exactly:

1. Read `<skill-dir>/references/android-review-checklist.md` in full. It defines the five
   review dimensions and their section codes. Every file must be evaluated against all five.
2. Read `<skill-dir>/references/review-protocol.md` section 4 for the finding format.
3. For each assigned file: get the diff (`git diff <range> -- <file>`), then read the full
   current file so the change is judged in context, not in isolation.
4. Where a change touches something outside your batch (a caller, an interface, a DI module,
   a layout referenced by the code), read that too - but only what is needed to judge the
   change. Do not review files outside your batch.
5. Write every finding to `<workspace>/findings/<batch-id>.md` using the exact format from
   section 4, **appending as you go**, not at the end. If you find nothing in a file, write
   nothing for it.

**Evidence rule**: never report a finding you have not read in the file. Every finding
carries a verbatim quote and a real line number. If unsure whether something is a defect,
downgrade it to WARNING and say what would confirm it. Inventing a plausible-sounding issue
is worse than missing one.

**Scope rule**: review the change, not the whole codebase. Pre-existing problems in
untouched code are out of scope unless the change makes them materially worse - if so, mark
the finding `WARNING` and say it is pre-existing.

**Quality bar**: every criticism ships with a concrete fix. Explain the why, so the author
learns the principle rather than just applying a patch. Record at least one POSITIVE finding
per batch if the code genuinely earns it - do not manufacture praise.

**Return** (keep it under 200 words - the details live in the file, not in your reply):
```
batch: <batch-id>
file: findings/<batch-id>.md
counts: <n>B <n>C <n>W <n>N <n>P
titles:
- [<id>] <SEVERITY> <one-line title>
- ...
notes: <anything the orchestrator must know: files skipped, context that contradicts context.md>
```

---

## 6. Verification rules (orchestrator)

Hallucinated line numbers are the main failure mode of a long review. Before reporting:

1. For every `BLOCKER` and `CRITICAL` finding, confirm the cited location. Read just the
   cited lines and check that the `Bằng chứng` quote matches:
   ```bash
   sed -n '<line-4>,<line+4>p' <file>
   ```
2. If the quote does not match the file, do not silently fix the line number - the finding is
   suspect. Re-verify the claim; if it cannot be substantiated, drop it and note the drop.
3. Deduplicate across batches: the same defect found in two modules becomes one finding with
   both locations listed, not two entries.
4. Sanity-check severity distribution. An all-BLOCKER report and an all-NITPICK report are
   both signs the reviewer lost calibration; re-read the severity definitions in SKILL.md and
   reclassify.

WARNING and NITPICK findings are not line-verified individually - the cost outweighs the
benefit - but any of them whose evidence block is empty is dropped.

## 7. Report assembly

Assemble on disk, not in context:

1. Write the header + `Tổng Quan` section to `report.md`.
2. Append findings in severity order (BLOCKER, CRITICAL, WARNING, NITPICK, POSITIVE), taking
   the blocks from `findings/*.md` and rewriting only the id line to the final numbering.
3. Append the `Tổng Kết` table, with counts taken from `grep -c`, not from memory.
4. Read `report.md` back once, at the end, only to present it.
