---
name: clean-arch-code-android
description: "Knowledge base from \"Clean Architecture: A Craftsman's Guide to Software Structure and Design\" and \"Clean Code: A Handbook of Agile Software Craftsmanship\" by Robert C. Martin, adapted for Android/Kotlin (Koin, Coroutines/Flow, Room, Retrofit, XML/ViewBinding, MVVM). Use when applying Uncle Bob's frameworks for SOLID, the Dependency Rule, component principles, boundaries, naming, functions, error handling, unit tests, code smells, reviewing or refactoring Android code, designing Android app architecture, or studying either book (Vietnamese)."
---

<!-- argument-hint: [chủ đề, tên nguyên tắc, mã heuristic (G23, F3…), hoặc chương (arch-ch22, code-ch03)] -->

# Clean Architecture + Clean Code cho Android
**Tác giả**: Robert C. Martin (Uncle Bob) | **Nguồn**: *Clean Architecture* (2017, ~444 tr., 34 ch. + phụ lục) · *Clean Code* (2008, ~462 tr., 17 ch. + phụ lục) | **Chương**: 52 file | **Generated**: 2026-10-22

## Cách dùng skill
- **Không đối số**: dùng Core Frameworks bên dưới.
- **Theo chủ đề**: "SRP", "Dependency Rule", "flag argument", "G23"… → tra Topic Index rồi đọc file chương.
- **Theo chương**: `arch-ch22`, `code-ch03` → đọc `chapters/<file>`.
- **Review/refactor code Android**: dùng `cheatsheet.md` + `chapters/code-ch17-smells-and-heuristics.md`, trích mã heuristic.
- **Thiết kế feature/kiến trúc Android**: `android-patterns.md` (ví dụ end-to-end, lộ trình refactor Satellite2).
- Mục **🤖 Android mapping** trong mỗi chương là **chuyển thể**, không phải lời sách. Khi trả lời phải phân biệt "sách nói" và "áp dụng cho Android".
- Câu hỏi ngoài Core Frameworks → **đọc file chương liên quan trước khi trả lời**.

---

## Core Frameworks & Mental Models

### 1. Mục tiêu và giá trị
- **Mục tiêu kiến trúc**: *minimize the human resources required to build and maintain the required system.* Đo bằng effort cho mỗi thay đổi theo thời gian (arch-ch01).
- **Two values**: behavior (urgent) < **structure/dễ thay đổi** (important). Dev phải đấu tranh cho kiến trúc (arch-ch02).
- **"The only way to go fast, is to go well."** Code bẩn luôn chậm hơn; *Later equals never* (code-ch01).
- **Keep options open**: tách **policy** (business rules) khỏi **details** (DB, UI, framework, DI, SDK). *A good architect maximizes the number of decisions not made* (arch-ch15).

### 2. The Dependency Rule (cốt lõi)
- *Source code dependencies must point only inward, toward higher-level policies.* Vòng: **Entities ← Use Cases ← Interface Adapters ← Frameworks & Drivers** (arch-ch22).
- Vòng trong không nhắc **tên** hay **format dữ liệu** của vòng ngoài. Data vượt ranh giới là DS đơn giản theo nhu cầu vòng trong; không truyền Entity/DB row/DTO.
- Flow of control đi ra ngoài (use case → presenter) thì dùng **DIP**: interface (output port) ở vòng trong.
- **Android**: domain chỉ import stdlib + coroutines; interface repository ở domain; impl ở data; Koin/Application là **Main** (bẩn nhất, arch-ch26).

### 3. SOLID (cấp module)
- **SRP**: *one, and only one, actor*. Không phải "làm một việc" (đó là quy tắc cho function). Đừng DRY code của các actor khác nhau (arch-ch07).
- **OCP**: mở rộng bằng **thêm code**; sắp component thành **phân cấp bảo vệ**: *if A should be protected from B, B depends on A* (arch-ch08).
- **LSP**: impl phải thay thế được, kể cả contract lỗi/threading; `if (x is Impl)` là triệu chứng vi phạm (arch-ch09).
- **ISP**: đừng phụ thuộc thứ không dùng; interface hẹp theo client (arch-ch10).
- **DIP**: phụ thuộc abstraction; tránh **volatile concrete**; gom `new` vào factory/Main (arch-ch11).

### 4. Component principles
- Cohesion: **REP** (reuse = release), **CCP** (SRP cho component), **CRP** (ISP cho component). Dự án trẻ ưu tiên CCP (arch-ch13).
- Coupling: **ADP** (không vòng, phá bằng DIP hoặc component mới), **SDP** (`I = Fan-out/(Fan-in+Fan-out)` giảm theo mũi tên), **SAP** (ổn định thì trừu tượng; tránh Zone of Pain/Uselessness; `D = |A+I−1|`) (arch-ch14).

### 5. Boundaries & các pattern kiến trúc
- Vẽ ranh giới giữa thứ quan trọng và không quan trọng, theo **trục thay đổi**; plugin architecture (arch-ch17).
- **Humble Object**: View/DB impl tối giản; **Presenter format mọi thứ** thành String/boolean/enum (arch-ch23).
- **Entities** (critical rules) vs **Use Cases** (application rules), **Request/Response models** thuần (arch-ch20).
- **Partial boundaries** (skip last step / Strategy / Facade) giữ chỗ nhưng cần canh giữ (arch-ch24). Dựng ranh giới ở **inflection point** (arch-ch25).
- **Screaming Architecture**: top-level hét use case, không hét framework (arch-ch21). **DB, Web, Framework là details**; *Don't marry the framework* (arch-ch30–32).
- **Android = firmware nếu business logic dính Android API** (arch-ch29). **Tests là vòng ngoài cùng**, tránh fragile tests (arch-ch28).
- **Package by component + `internal`**: để compiler cưỡng chế, không chỉ quy ước (arch-ch34).

### 6. Clean Code (cấp code)
- **Names**: intention-revealing; không noise/encoding/pun; một từ một khái niệm; độ dài theo scope (code-ch02).
- **Functions**: nhỏ; **một việc, một mức trừu tượng**; Stepdown; ≤2 tham số; không flag/output arg; không side effect; CQS; exception thay error code; DRY (code-ch03).
- **Comments**: là thất bại diễn đạt; chỉ giữ legal/intent/warning/TODO/public API (code-ch04).
- **Objects vs Data structures**: anti-symmetry; Law of Demeter; tránh hybrid (code-ch06).
- **Error handling**: unchecked exceptions có context; wrap third-party; Special Case; **không trả và không truyền null** (code-ch07).
- **Boundaries**: bọc API ngoài, learning tests (code-ch08). **Tests**: 3 laws of TDD, clean tests, F.I.R.S.T. (code-ch09).
- **Classes**: nhỏ theo trách nhiệm; test 25 từ; cohesion; OCP/DIP (code-ch10). **Systems**: tách construction khỏi use; DI; aspect-like cross-cutting (code-ch11).
- **Simple Design**: chạy hết test → không trùng lặp → biểu đạt → ít class (code-ch12).
- **Successive refinement**: viết bẩn, rồi làm sạch bằng nhiều bước nhỏ có test (code-ch14). **Boy Scout Rule** (code-ch01).
- **Smells**: C1–C5, E1–E2, F1–F4, G1–G36, J1–J3, N1–N7, T1–T9 (code-ch17).

---

## Chapter Index

| Chương | Key Frameworks |
|---|---|
| [arch-ch01](chapters/arch-ch01-what-is-design-and-architecture.md) | Goal of architecture, signature of a mess |
| [arch-ch02](chapters/arch-ch02-a-tale-of-two-values.md) | Behavior vs structure, Eisenhower matrix |
| [arch-ch03](chapters/arch-ch03-paradigm-overview.md) | 3 paradigms as disciplines |
| [arch-ch04](chapters/arch-ch04-structured-programming.md) | Functional decomposition, falsifiability |
| [arch-ch05](chapters/arch-ch05-object-oriented-programming.md) | Polymorphism, plugin, dependency inversion |
| [arch-ch06](chapters/arch-ch06-functional-programming.md) | Immutability, segregation of mutability, event sourcing |
| [arch-ch07](chapters/arch-ch07-srp.md) | Actor, accidental duplication, Facade |
| [arch-ch08](chapters/arch-ch08-ocp.md) | Hierarchy of protection, financial report |
| [arch-ch09](chapters/arch-ch09-lsp.md) | Square/Rectangle, taxi dispatch |
| [arch-ch10](chapters/arch-ch10-isp.md) | Segregated interfaces, baggage |
| [arch-ch11](chapters/arch-ch11-dip.md) | Stable abstractions, Abstract Factory |
| [arch-ch12](chapters/arch-ch12-components.md) | Unit of deployment |
| [arch-ch13](chapters/arch-ch13-component-cohesion.md) | REP, CCP, CRP, tension diagram |
| [arch-ch14](chapters/arch-ch14-component-coupling.md) | ADP, SDP, SAP, I/A/D metrics |
| [arch-ch15](chapters/arch-ch15-what-is-architecture.md) | Policy vs details, keep options open |
| [arch-ch16](chapters/arch-ch16-independence.md) | Layers × use cases, decoupling modes |
| [arch-ch17](chapters/arch-ch17-boundaries-drawing-lines.md) | FitNesse WikiPage, plugin argument |
| [arch-ch18](chapters/arch-ch18-boundary-anatomy.md) | Monolith → service boundaries |
| [arch-ch19](chapters/arch-ch19-policy-and-level.md) | Level = distance from I/O |
| [arch-ch20](chapters/arch-ch20-business-rules.md) | Entities, use cases, request/response |
| [arch-ch21](chapters/arch-ch21-screaming-architecture.md) | Use-case-centric structure |
| [arch-ch22](chapters/arch-ch22-the-clean-architecture.md) | Dependency Rule, 4 circles |
| [arch-ch23](chapters/arch-ch23-presenters-and-humble-objects.md) | Humble Object, gateways, data mappers |
| [arch-ch24](chapters/arch-ch24-partial-boundaries.md) | Skip last step, Strategy, Facade |
| [arch-ch25](chapters/arch-ch25-layers-and-boundaries.md) | Hunt the Wumpus, inflection point |
| [arch-ch26](chapters/arch-ch26-the-main-component.md) | Main as dirtiest plugin |
| [arch-ch27](chapters/arch-ch27-services-great-and-small.md) | Decoupling fallacy, kitty problem |
| [arch-ch28](chapters/arch-ch28-the-test-boundary.md) | Fragile tests, testing API |
| [arch-ch29](chapters/arch-ch29-clean-embedded-architecture.md) | Firmware vs software, HAL/OSAL |
| [arch-ch30](chapters/arch-ch30-the-database-is-a-detail.md) | Data model ≠ database |
| [arch-ch31](chapters/arch-ch31-the-web-is-a-detail.md) | GUI as IO device |
| [arch-ch32](chapters/arch-ch32-frameworks-are-details.md) | Asymmetric marriage |
| [arch-ch33](chapters/arch-ch33-case-study-video-sales.md) | Actor × layer components |
| [arch-ch34](chapters/arch-ch34-the-missing-chapter.md) | Package by component, access modifiers |
| [arch-appA](chapters/arch-appA-architecture-archaeology.md) | Lessons from SAC, VRS, ETS |
| [code-ch01](chapters/code-ch01-clean-code.md) | Cost of mess, Boy Scout Rule |
| [code-ch02](chapters/code-ch02-meaningful-names.md) | Intention-revealing, no encodings |
| [code-ch03](chapters/code-ch03-functions.md) | Small, one thing, stepdown, CQS |
| [code-ch04](chapters/code-ch04-comments.md) | Good vs bad comments |
| [code-ch05](chapters/code-ch05-formatting.md) | Newspaper metaphor, team rules |
| [code-ch06](chapters/code-ch06-objects-and-data-structures.md) | Anti-symmetry, Law of Demeter |
| [code-ch07](chapters/code-ch07-error-handling.md) | Exceptions, Special Case, no null |
| [code-ch08](chapters/code-ch08-boundaries.md) | Wrap third-party, learning tests |
| [code-ch09](chapters/code-ch09-unit-tests.md) | 3 laws of TDD, F.I.R.S.T. |
| [code-ch10](chapters/code-ch10-classes.md) | SRP, cohesion, OCP, DIP |
| [code-ch11](chapters/code-ch11-systems.md) | Construction vs use, DI, AOP |
| [code-ch12](chapters/code-ch12-emergence.md) | Beck's 4 rules of simple design |
| [code-ch13](chapters/code-ch13-concurrency.md) | Defense principles, deadlock |
| [code-ch14](chapters/code-ch14-successive-refinement.md) | Args case study, incrementalism |
| [code-ch15](chapters/code-ch15-junit-internals.md) | ComparisonCompactor refactor |
| [code-ch16](chapters/code-ch16-refactoring-serialdate.md) | Make it work → make it right |
| [code-ch17](chapters/code-ch17-smells-and-heuristics.md) | C/E/F/G/J/N/T catalog |

## Topic Index
- **Abstract Factory** → arch-ch11, code-ch03, code-ch11
- **Actor / SRP** → arch-ch07, arch-ch33, code-ch10
- **ADP / SDP / SAP / metrics I, A, D** → arch-ch14
- **Android mapping, end-to-end example, refactor roadmap** → android-patterns.md
- **Arguments (flag, output, argument object)** → code-ch03, code-ch17 (F1–F3, G15)
- **Boundaries** → arch-ch17, arch-ch18, arch-ch24, arch-ch25, code-ch08
- **Boy Scout Rule** → code-ch01, code-ch15, code-ch16
- **Comments** → code-ch04, code-ch17 (C1–C5)
- **Component cohesion (REP/CCP/CRP)** → arch-ch13
- **Concurrency / coroutines / mutability** → arch-ch06, code-ch13
- **Database / Room as detail** → arch-ch30, arch-ch23
- **Dependency Rule / Clean Architecture circles** → arch-ch22
- **DIP / DI / Koin / Main** → arch-ch05, arch-ch11, arch-ch26, code-ch11
- **Duplication (true vs accidental)** → arch-ch16, code-ch03, code-ch12, code-ch17 (G5)
- **Entities / Use cases / Request-Response** → arch-ch20, arch-ch22
- **Error handling / exceptions / null / Result** → code-ch03, code-ch07
- **Firmware / platform abstraction (HAL)** → arch-ch29
- **Formatting** → code-ch05
- **Frameworks as details / don't marry** → arch-ch21, arch-ch32
- **Functions (small, one thing, stepdown, CQS)** → code-ch03
- **Humble Object / Presenter / ViewModel formatting** → arch-ch23
- **ISP / LSP / OCP** → arch-ch10, arch-ch09, arch-ch08
- **Law of Demeter / train wreck** → code-ch06, code-ch17 (G36)
- **Modules / package by feature-component / internal** → arch-ch12, arch-ch21, arch-ch34
- **Names** → code-ch02, code-ch17 (N1–N7)
- **Paradigms (structured/OO/FP)** → arch-ch03–06
- **Partial boundary / YAGNI / inflection point** → arch-ch24, arch-ch25
- **Polymorphism vs switch** → code-ch03, code-ch06, code-ch14, code-ch17 (G23)
- **Refactoring process** → code-ch14, code-ch15, code-ch16
- **Screaming architecture** → arch-ch21
- **Services / micro-services** → arch-ch16, arch-ch27
- **Simple Design (Beck)** → code-ch01, code-ch12
- **Smells & heuristics catalog** → code-ch17
- **Systems / construction vs use / cross-cutting** → code-ch11
- **Tests / TDD / F.I.R.S.T. / test boundary** → arch-ch28, code-ch09, code-ch17 (T1–T9)
- **Third-party wrapping / learning tests** → code-ch08
- **Two values / architecture goal** → arch-ch01, arch-ch02, arch-ch15

## Supporting Files
- [android-patterns.md](android-patterns.md): bản đồ tầng Android, bố cục module, ví dụ end-to-end (Clean Code + Clean Arch), lộ trình refactor Satellite2, test kiến trúc
- [cheatsheet.md](cheatsheet.md): decision rules, cây quyết định đặt logic, ma trận mức ranh giới, ngưỡng, smells
- [patterns.md](patterns.md): các kỹ thuật và pattern (When / How / Trade-offs)
- [glossary.md](glossary.md): thuật ngữ cùng chương nguồn

---

## Scope & Limits
- Tóm tắt tổng hợp, không chép nguyên văn sách. Mục 🤖 Android mapping và `android-patterns.md` là **chuyển thể** (sách dùng Java), tham chiếu quy ước Satellite2.
- Khi sách xung đột với quy ước Kotlin/dự án (J1 wildcard import, exception vs `Result`, format ở Adapter vs Presenter), xem ghi chú trade-off trong chương; quy ước team thắng (G24) nếu không phá nguyên tắc cốt lõi. Hình/UML trong PDF không đọc được, đã tái dựng bằng mô tả.
