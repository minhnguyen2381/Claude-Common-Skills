# Review Protocol

Contract shared by the orchestrator and every reviewer subagent. Governs the finding
format, the subagent briefing, and the verification rules.

## 1. Workspace layout

Everything durable lives on disk so no step depends on remembering an earlier step.

```
<workspace>/
├── manifest.md          # written by scripts/scope-review.sh - scope + batch plan
├── batches.tsv          # batch_id, module, path, added, deleted, churn
├── context.md           # project + app context briefing (<= 55 lines) - shared by all subagents
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
Hard cap 55 lines - it is duplicated into every subagent, so every line costs N times.

It has two halves. The **technical** half decides whether code is correct. The **app_context**
half decides how much a defect *matters*, and is what dimension 6.4 is judged against - a
review without it produces textbook severities instead of useful ones.

```markdown
# Project Context

## technical
- architecture: MVVM + Clean Architecture (domain/data/presentation)
- di: Hilt (@HiltViewModel, @Singleton in AppModule)
- async: Coroutines + Flow (StateFlow for UI state); no RxJava
- ui: XML Views + ViewBinding; Compose only in feature/settings
- modules: app, core/data, core/ui, feature/home, feature/settings
- min_sdk: 24, target_sdk: 35, kotlin: 2.0.21, agp: 8.7
- state: UiState sealed interface per feature (Loading/Success/Error)
- conventions:
  - repositories return Result<T>, never throw across layers
  - Fragments observe with repeatOnLifecycle(STARTED)
  - strings always in res/values/strings.xml, no hardcoded literals
- known_deviations:
  - LegacyPlayerActivity still uses AsyncTask - out of scope, pre-existing

## app_context
- domain: ứng dụng tiện ích quét tài liệu, người dùng phổ thông
- scale: ~2M MAU, phần lớn thiết bị tầm trung Android 10-14
- monetization: AdMob (app-open + native), doanh thu phụ thuộc cold start
- critical_paths: cold start -> Home -> Scan; mọi thứ chậm ở đây là tiền
- non_critical: Settings, About, Feedback
- direction: đang chuyển dần XML -> Compose; màn mới ưu tiên Compose
- constraints: team 3 người, release 2 tuần/lần; refactor lớn không khả thi trong sprint
```

Rules for `app_context`:

- Derive it from evidence (Gradle config, manifest, ad SDK presence, module names, README,
  recent commit messages), and mark anything inferred with `?`.
- If the user stated the app's purpose or constraints in the request, that overrides inference.
- If it genuinely cannot be determined, write `domain: unknown` explicitly rather than
  guessing - subagents will then judge on technical grounds only and say so.

Only record what changes how a finding is judged. Do not paste code into it.

## 4. Finding entry format

Every finding is one block appended to `findings/<batch-id>.md`. The header line is strict
and greppable; everything below it is free-form Vietnamese prose.

Write the prose in Vietnamese with full diacritics (UTF-8).

````markdown
<!--FINDING-->
### [B1-3] BLOCKER | dim=2.1 | `app/src/main/java/com/x/HomeViewModel.kt:88`

**Bằng chứng**
```kotlin
// HomeViewModel.kt:88 (trích nguyên văn từ file)
private val ctx: Context = activity
```

**Vấn đề**: <what is wrong and WHY it is wrong>

**Tác động**: <concrete production consequence - crash path, leak path, ANR path>

**Phù hợp bối cảnh**: <REQUIRED. Judge against app_context: how much does this cost THIS
app, on which path, at which scale? Is the approach still appropriate for the project's
current direction? Is the proposed fix affordable given the team's constraints? If the
honest answer is "no observable consequence in this app", the severity must drop.>

**Đề xuất sửa**:
```kotlin
// Trước
<original>

// Sau
<fixed>
```

**Giải thích**: <why the fix works, which principle it follows>
<!--/FINDING-->
````

Field rules:

- **id**: `<batch-id>-<n>`, n counted from 1 within the batch. The orchestrator renumbers
  to `B-01 / C-01 / W-01 / N-01 / P-01` at report time by reading the files, never from memory.
- **severity**: exactly one of `BLOCKER`, `CRITICAL`, `WARNING`, `NITPICK`, `POSITIVE`.
- **dim**: section code from `android-review-checklist.md`, e.g. `0.1`, `2.1`, `4.3`. A
  finding may cite a second code after a `+` (e.g. `dim=0.3+0.2`) when two principles apply.
- **location**: repo-relative path plus the line number in the **post-change** file.
- **Bằng chứng**: verbatim quote of the offending lines, copied from the file, never
  paraphrased or reconstructed. A finding without a verbatim quote is not reportable.
- **Phù hợp bối cảnh**: required on every non-POSITIVE finding. A finding that only restates
  a principle without connecting it to this app is dropped at verification.
- POSITIVE entries may omit `Phù hợp bối cảnh`, `Đề xuất sửa` and `Giải thích`.

Each findings file also opens with the `<!--DIMENSIONS-->` verdict table from
`android-review-checklist.md`, proving all seven dimensions were walked.

Counting is mechanical: `grep -c '^### \[' findings/*.md`, per severity with
`grep -c '| BLOCKER |'` etc.

## 5. Reviewer subagent briefing

Dispatch with `subagent_type: "general-purpose"` and `model: "sonnet"`. A reviewer matches
code against a fixed checklist and writes findings in a fixed format; the judgement that
needs the stronger model - severity calibration, verification, assembly - stays with the
orchestrator. A fresh agent knows nothing about this session, so the prompt must be
self-contained. Fill in the placeholders:

---

You are a Senior Android Developer performing a rigorous code review of one batch of
changed files. Report in Vietnamese with full diacritics.

**Repository**: `<absolute repo path>`
**Review range**: `<base>..HEAD` (or: uncommitted working-tree changes vs HEAD)
**Your batch**: `<batch-id>` - module `<module>`

Files assigned to you (review ONLY these):
```
<one path per line>
```

**Project and app context** (already established - trust it, do not re-derive it):
```
<verbatim contents of context.md>
```

**Method** - follow exactly:

1. Your reading list, in this order. It is the whole list - each reference below is read at
   the stated width, and the two catalogues are opened by section, not front to back.
   - `<skill-dir>/references/android-review-checklist.md` - **in full**. This is the review
     contract: the seven dimensions and their section codes.
   - `<skill-dir>/references/architecture-guide.md` - **§1, the one §2/§3/§4 section matching
     the pattern this project actually uses (from the context above), and §5**. A project on
     MVVM is judged by the MVVM rules; the MVI and Clean sections do not apply to it.
     ```bash
     bash <skill-dir>/scripts/ref-section.sh <skill-dir>/references/architecture-guide.md '## 2. MVVM'
     ```
   - `<skill-dir>/references/do-and-dont.md` - **by section code, once you have a finding**.
     When a finding cites dimension 2.1, pull section 2.1 and model the fix on it:
     ```bash
     bash <skill-dir>/scripts/ref-section.sh <skill-dir>/references/do-and-dont.md '## 2.1'
     ```
   - section 4 of `<skill-dir>/references/review-protocol.md` - the finding format.
2. For each assigned file: get the diff (`git diff <range> -- <file>`), then read the
   surrounding code so the change is judged in context, not in isolation. Read the whole
   file when it is 400 lines or fewer; above that, read the diff plus roughly 60 lines
   around each hunk, and widen only where a specific claim needs it.
3. Evaluate every file against **all seven dimensions, in order**. Dimension 0
   (YAGNI / KISS / DRY) is judged **first and outranks every other dimension**: before asking
   whether the code is well-architected, ask whether it should exist at all, whether it is the
   simplest thing that works, and whether it duplicates knowledge already in the codebase.
   A change that is architecturally immaculate but solves a problem nobody has is still a
   defect, and the finding says so.
4. Judge the pattern the project actually uses (from the context above), not your preferred
   one. Cite the specific rule broken, from `architecture-guide.md`.
5. Where a change touches something outside your batch (a caller, an interface, a DI module,
   a layout referenced by the code), read that too - but only what is needed to judge the
   change. Do not review files outside your batch.
6. Write every finding to `<workspace>/findings/<batch-id>.md` using the exact format from
   section 4, **appending as you go**, not at the end. If you find nothing in a file, write
   nothing for it.
7. Start the file with the `<!--DIMENSIONS-->` verdict table (format at the end of
   `android-review-checklist.md`), filled in for all seven dimensions.

**Context rule**: every finding carries a `Phù hợp bối cảnh` paragraph judged against the
`app_context` block above - what this costs *this* app, on which path, at what scale, and
whether the fix is affordable for this team. Severity is reach x likelihood x cost **for this
app**, not textbook severity. The same defect is CRITICAL on a cold-start path of an
ad-funded app and NITPICK in a settings screen of an internal tool. If a principle is
violated with no observable consequence in this app, it is a WARNING at most - and if the
consequence is genuinely zero, do not report it.

**Evidence rule**: never report a finding you have not read in the file. Every finding
carries a verbatim quote and a real line number. If unsure whether something is a defect,
downgrade it to WARNING and say what would confirm it. Inventing a plausible-sounding issue
is worse than missing one.

**Scope rule**: review the change, not the whole codebase. Pre-existing problems in
untouched code are out of scope unless the change makes them materially worse - if so, mark
the finding `WARNING` and say it is pre-existing.

**Quality bar**: every criticism ships with a concrete fix, written in the project's own
naming and conventions, drawn from or modelled on `do-and-dont.md`. Explain the why, so the
author learns the principle rather than just applying a patch. Record at least one POSITIVE
finding per batch if the code genuinely earns it - do not manufacture praise.

**Return** (keep it under 200 words - the details live in the file, not in your reply):
```
batch: <batch-id>
file: findings/<batch-id>.md
counts: <n>B <n>C <n>W <n>N <n>P
dim0_counts: <n>   (findings citing 0.1 / 0.2 / 0.3)
titles:
- [<id>] <SEVERITY> <one-line title>
- ...
notes: <anything the orchestrator must know: files skipped, context that contradicts context.md>
```

---

## 6. Verification rules (orchestrator)

Hallucinated line numbers and textbook severities are the two main failure modes of a long
review. Before reporting:

1. For every `BLOCKER` and `CRITICAL` finding, confirm the cited location. Read just the
   cited lines and check that the `Bằng chứng` quote matches:
   ```bash
   sed -n '<line-4>,<line+4>p' <file>
   ```
2. If the quote does not match the file, do not silently fix the line number - the finding is
   suspect. Re-verify the claim; if it cannot be substantiated, drop it and note the drop.
3. **Context gate**: drop any non-POSITIVE finding whose `Phù hợp bối cảnh` is missing, or
   which only restates a principle without naming a consequence for this app. Downgrade any
   BLOCKER/CRITICAL whose stated consequence is hypothetical rather than reachable.
4. **Dimension 0 gate**: check that dimension 0 was actually applied, not skipped in favour of
   architecture findings. If no batch produced a single 0.x finding on a change of
   non-trivial size, spot-check one batch: was any speculative abstraction, duplicated rule,
   or over-complex construct genuinely absent, or was the dimension not walked?
   Re-dispatch that batch with dimension 0 only if the check shows it was not walked.
5. **Over-DRY / over-abstraction check**: a suggestion that itself adds an interface, a
   module, or a layer must justify itself against 0.1 and 0.2. Drop suggestions that trade a
   small duplication for a large abstraction.
6. Deduplicate across batches: the same defect found in two modules becomes one finding with
   both locations listed, not two entries.
7. Sanity-check severity distribution. An all-BLOCKER report and an all-NITPICK report are
   both signs the reviewer lost calibration; re-read the severity definitions in SKILL.md and
   reclassify.

WARNING and NITPICK findings are not line-verified individually - the cost outweighs the
benefit - but any of them whose evidence block is empty is dropped.

## 7. Report assembly

Assemble on disk, not in context:

1. Write the header + `Tổng Quan` section to `report.md`, including the `Bối Cảnh Ứng Dụng`
   block taken from `context.md`'s `app_context` (the reader must be able to see what the
   severities were calibrated against).
2. Append the `Tuân Thủ YAGNI / KISS / DRY` section: the dimension-0 findings, listed first,
   before any other severity section. This is the highest-priority dimension and the report
   must lead with it.
3. Append the remaining findings in severity order (BLOCKER, CRITICAL, WARNING, NITPICK,
   POSITIVE), taking the blocks from `findings/*.md` and rewriting only the id line to the
   final numbering. A dimension-0 finding already listed in section 2 is referenced by id
   there, not duplicated.
4. Append the `Tổng Kết` table, with counts taken from `grep -c`, not from memory.
5. Read `report.md` back once, at the end, only to present it.
