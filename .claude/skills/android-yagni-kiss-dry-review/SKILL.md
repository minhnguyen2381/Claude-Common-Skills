---
name: android-yagni-kiss-dry-review
description: Use when the user wants a quick, read-only check of Android/Kotlin/Java/XML changes against YAGNI, KISS, and DRY only — not a full architecture/style review. Reviews uncommitted working-tree changes or a given commit range/ref/PR. Never edits files; only reports findings in chat. Use instead of android-code-review when the user explicitly asks for a fast simplicity/duplication check rather than a comprehensive review.
---

# Android YAGNI / KISS / DRY Review

## Overview

Perform a narrow, read-only review of Android (Kotlin/Java/XML) changes through exactly
three lenses: YAGNI, KISS, DRY. This is deliberately lighter than `android-code-review` — no
scratchpad workspace, no subagents, no architecture/MVVM checks, no app-context severity
calibration. It exists for the moment the user wants a fast simplicity/duplication pass, not
a comprehensive review.

**This skill never edits, creates, or deletes files.** Its only allowed actions are reading
diffs and source (`git`, `Read`, `Grep`) and writing the report to chat. If the user asks for
fixes to be applied, say so is out of scope for this skill and suggest `simplify` or
`android-code-review --fix`-style follow-up instead.

## The three lenses, in order

For every changed hunk, judge in this order — an earlier lens can make a later one moot:

1. **YAGNI — should this code exist at all?**
   Is this solving a real requirement that exists *right now*, or is it speculative:
   unused parameters, config flags nothing reads yet, interfaces with a single implementation,
   generic/pluggable machinery built for a second use case that hasn't shown up. Flag it even
   if it's well-written — YAGNI violations are about existence, not quality.

2. **KISS — is this the simplest solution to the real requirement?**
   Only asked once YAGNI passes. Look for unnecessary indirection (wrapper classes/interfaces
   with one implementation and no test-seam reason to exist), pattern usage heavier than the
   problem warrants (e.g. a full state machine for a two-state toggle), more moving parts than
   the requirement needs.

3. **DRY — does this duplicate knowledge that already exists elsewhere in the codebase?**
   Only asked once YAGNI and KISS pass. This is about duplicated *knowledge* (the same
   business rule, mapping, or validation expressed twice), not incidental similarity. Before
   flagging, actually search the codebase (`Grep`) for the existing implementation — do not
   flag DRY on a guess. Cite the other location by `file:line`.

If two lenses conflict on the same code, resolve as: **YAGNI > KISS > DRY** (don't recommend a
DRY-driven abstraction that reintroduces something YAGNI would cut).

## Workflow

### Step 1 — Determine the diff range

Same convention as `android-code-review`:

- User gives a commit hash / tag / branch / PR → review `<ref>..HEAD`. For a branch/PR, resolve
  the base with `git merge-base HEAD <branch>` and use that as `<ref>`.
- No ref given → review uncommitted working-tree changes (staged + unstaged + untracked)
  against HEAD. State this assumption at the top of the report.

### Step 2 — List changed files, filtered to Android source

```bash
git diff --name-only <ref>..HEAD          # or against HEAD for working-tree mode
```

Keep only `*.kt`, `*.java`, `*.xml`. If nothing matches, say so and stop — do not review
unrelated file types.

### Step 3 — Walk the diff hunk by hunk

Use `git diff <ref>..HEAD -- <file>` (or the working-tree equivalent) per file. For each added
or meaningfully-changed hunk, apply the three lenses above. Read a bit of surrounding file
context with `Read` when a hunk alone doesn't show enough (e.g. to check whether an interface
really has only one implementation, or whether a flag is read anywhere).

Do not review unchanged code — this skill is diff-scoped, not a whole-file audit.

### Step 4 — Report

Print the report directly in chat, in Vietnamese, grouped by principle. For each finding:

```
### [YAGNI|KISS|DRY] <file>:<line>
**Vấn đề:** <what's wrong, one or two sentences>
**Đề xuất:** <how to simplify, described in words — do not apply it>
**Độ tin cậy:** <Cao|Trung bình|Thấp>
```

For DRY findings, always include the existing location: `**Trùng lặp với:** <file>:<line>`.

If a changed hunk has no violation on any of the three lenses, do not manufacture a finding —
silence on a hunk is a valid outcome. If the whole diff is clean, say explicitly:
"Không phát hiện vi phạm YAGNI/KISS/DRY trong thay đổi này." Do not pad the report with
architecture, style, naming, or test-coverage commentary — that's out of scope; point the user
at `android-code-review` if they want that.
