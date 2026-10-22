---
name: estimating-from-requirement-doc
description: Use when the user hands over a requirement, feature spec, change request or bug report (.docx, .xlsx or .md) and wants an estimate, a work plan, a task checklist, a self-test case count, or the list of unclear points to confirm before starting — e.g. "estimate tài liệu này", "lên kế hoạch từ spec", "bug này sửa mất bao lâu", "cần hỏi lại PM những gì".
---

# Estimating From a Requirement Doc

## Overview

Turn one requirement/bug document into a plan the user can send to a lead: checklist of real
work, two estimates (human coding vs. the user's agent workflow), self-test time derived from a
counted test-case list, and the questions that block completion.

**Core principle:** the agent estimate is NOT "human time, but faster". It models the user's
actual loop — plan/spec → several review rounds → agent codes → manual test → fix loop (plus a
real-device log loop for bugs). Every number traces back to a checklist item or a test case.

## Workflow

1. **Read the doc.** `.md` → Read it. `.docx`/`.xlsx` → `python <this-skill-dir>/scripts/doc_to_text.py <file>`
   (absolute path; dumps headings, lists, tables, hyperlink URLs, header/footer, Word comments,
   every sheet). Note what is referenced but missing (Figma "gửi sau", screenshots, "giống app X").
2. **Classify:** `Feature` or `Bug`.
3. **Map to code if inside a repo** (Grep/Read): find the screens, classes, layouts, remote-config
   keys and tracking helpers each requirement touches; checklist items cite `file:line`.
   Not in a repo → header says `Độ tin cậy: Thấp (chưa quét code)` and items stay functional.
4. **Bug only:** write a root-cause hypothesis (ranked suspects) — it decides the checklist.
5. **Build checklist → questions → test cases → estimate**, in that order (each feeds the next).
6. **Write** `<doc-name>-plan.md` next to the input doc (not writable → current directory), then
   post the chat summary (format below).

## Time model (user calibration — use these numbers)

| Step | Value |
|---|---|
| Plan review round (read, comment, agent revises) | 10–15 min |
| Agent drafts plan/spec | 10–20 min |
| Agent coding (wall-clock) per item | S 5–10 min · M 15–30 min · L 30–60 min |
| Human coding per item (1 day = 8 h) | S 0.5–1 h · M 2–4 h · L 8 h |
| Human bug investigation (repro + debug) | Reproducible 2–4 h · Intermittent 6–16 h |
| Manual test per case | Simple UI 2–5 · Needs reinstall/clear data/network/remote config/ads/tracking check 5–10 · Real device + 3rd-party app 10–15 min · Case with a wait (capping, timeout) or multi-screen sweep: real minutes |
| Bug log-loop round (other agent adds logs 10–15 + build & reproduce on real device 15–30 + copy log back 5 min) | 30–50 min |
| Fix-loop round (1 review round + agent code S + retest P1 cases of the M/L items and items touched by blocking questions) | sum those parts |

Bug investigation on the agent track IS the log loop — don't also count it under "Agent code".

## Scenario rules

| | Best | Expected | Worst |
|---|---|---|---|
| Point in every range | lower bound | midpoint | upper bound |
| Checklist items `Tùy Q#` / `Tùy log` | excluded | included | included |
| Test cases | P1 only | all | all |
| Review rounds | 1 | 2 (4 if any push factor) | 7 |
| Log-loop rounds (bug) | 1 | 2 (3 if any push factor) | 3 |
| Fix-loop rounds | 0 | 1 | 2 |

**Push factors:** ≥3 blocking questions · design not available · "giống app X" with no reference ·
intermittent bug · no real device / 3rd-party app to reproduce · no repo scanned. Name the ones that apply.

The human track uses the same Best/Worst bounds (no review/log rounds) and always ends with a
Self test row, so both tables compare.

## Classification

- **Size:** `S` one place, no new state (text, icon, string, log event, flag check) · `M` new UI
  part or logic over 2–4 files (nav change, list item, remote-config wiring, dialog) · `L` new
  screen/flow, ad slot with fallback states, lifecycle/async work, or ≥5 files.
- **Checklist status:** `Chắc chắn` (must be done; still counted when it waits for an asset —
  note what is missing) · `Tùy Q#` (may not be needed, depends on an answer) · `Tùy log` (bug:
  depends on which hypothesis the log loop confirms).
- **Blocking question:** a wrong guess forces rework of an M/L item (even if a default exists —
  still record it), or no safe default exists. Otherwise non-blocking with its default assumption.
- **P1 test:** the main path of every `Chắc chắn` item, plus each requirement written explicitly in
  the doc (incl. the bug's repro steps). **P2:** edge case, regression, inferred variant.

## Output template (`<doc-name>-plan.md`, Vietnamese)

Fill every section. A section with nothing to report says so explicitly.

```markdown
# Kế hoạch: <tên task>
Loại: Feature | Bug · Nguồn: <file> · Repo: <đã quét / không có> · Độ tin cậy: <Cao/TB/Thấp>

## 0. Giả thuyết nguyên nhân (chỉ Bug)
1. <nghi phạm có khả năng nhất> — dấu hiệu ủng hộ ...

## 1. Checklist công việc thực sự
| ID | Việc cần làm | File / vị trí | Size | Trạng thái |
|----|--------------|---------------|------|------------|
| C1 | ... | `Foo.kt:42` hoặc "—" | S/M/L | Chắc chắn / Tùy Q2 / Tùy log |

## 2. Câu hỏi cần confirm
### Chặn (phải có trả lời trước khi code)
| ID | Câu hỏi | Hỏi ai (PM/Design/Lead/QA) | Chặn checklist | Giả định nếu chưa có trả lời | Ảnh hưởng estimate |
### Không chặn (hỏi song song)
(cùng bảng)

## 3. Self test
Tổng: <N> case (P1: x · P2: y) · Thời gian: Best <P1, cận dưới> / Expected <tất cả, giữa> / Worst <tất cả, cận trên>
| TC | Kịch bản | Checklist | P1/P2 | Phút |

## 4. Estimate
### Làm thủ công (người)
| Hạng mục (checklist ID) | Best | Expected | Worst |
(Bug: dòng đầu = điều tra/repro · Mọi loại: dòng cuối trước Tổng = Self test)
### Làm với agent (quy trình của bạn)
| Bước | Best | Expected | Worst |
| (Bug) Vòng đặt log + chạy máy thật | | | |
| Agent lập plan/spec | | | |
| Duyệt plan (số vòng × 10–15') | | | |
| Agent code | | | |
| Manual test | | | |
| Vòng sửa sau test | | | |
| **Tổng** | | | |
Push factor áp dụng: ...
Chưa tính: chờ trả lời câu hỏi chặn, chờ design, review PR, release.
```

## Chat summary (after writing the file)

```
<Loại> · <tên task> · Độ tin cậy <..>
Agent: Best <h> · Expected <h> · Worst <h>   |   Thủ công: Best <h> · Expected <h> · Worst <h>
Self test: <N> case (P1 x) · <Expected phút>
Câu hỏi chặn (<n>): Q1 <ngắn>, Q2 <ngắn>, ...
Push factor: ...
File: <absolute path>
```

## Common Mistakes

| Mistake | Fix |
|---|---|
| Agent column = human column × 0.5 | Fill the agent table step by step from the time model |
| Self-test time guessed ("~1 ngày") | Sum of the TC table; count must match |
| Speculative work mixed with required work | Status `Tùy Q#` / `Tùy log`; excluded from Best |
| Questions not linked to impact | Every question names blocked checklist IDs and its default assumption |
| Bug plan skips the real-device log loop | Bug → first row of the agent table is the log loop, always |
| Investigation counted twice on agent track | Log loop covers it; "Agent code" is only the fix |
