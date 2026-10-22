# Clean Architecture — Chapter 14: Component Coupling

## Core Idea
Ba nguyên tắc về **quan hệ giữa các component**: không có vòng (ADP), phụ thuộc theo hướng ổn định (SDP), và component ổn định phải trừu tượng (SAP). Có công thức đo **I**, **A**, **D** để kiểm tra.

## Frameworks Introduced
- **ADP — Acyclic Dependencies Principle**: *"Allow no cycles in the component dependency graph."*
  - Vấn đề: **"morning after syndrome"**: hôm qua chạy, sáng nay hỏng vì ai đó sửa thứ mình phụ thuộc.
  - Giải pháp cũ: **weekly build**, nhưng integration phình ra mãi.
  - Giải pháp: chia thành component có release; dependency graph phải là **DAG**. Release đi **bottom-up** (Entities → Database, Interactors → Presenters, View, Controllers, Authorizer → Main).
  - Hậu quả của vòng (`User` trong Entities dùng `Permissions` trong Authorizer): Entities, Authorizer, Interactors gộp thành một khối lớn; test Entities phải kéo theo cả Authorizer và Interactors; không xác định được thứ tự build.
  - **Breaking the cycle**: (1) **DIP**: đặt interface `Permissions` mà `User` cần vào Entities, rồi Authorizer implement nó; (2) **tạo component mới** chứa phần dùng chung mà cả hai phụ thuộc.
  - **"Jitters"**: cấu trúc component dao động và lớn dần theo yêu cầu, nên phải giám sát vòng liên tục.
- **Top-Down Design is impossible for components**: component diagram là **bản đồ buildability & maintainability**, không phải bản đồ chức năng. Nó **tiến hóa** cùng logical design (CCP trước → CRP khi có reuse → ADP khi có vòng).
- **SDP — Stable Dependencies Principle**: *"Depend in the direction of stability."*
  - **Stability** = lượng công cần để thay đổi (đồng xu dựng đứng không ổn định; cái bàn ổn định). Component có nhiều phụ thuộc đến là ổn định.
  - **Metrics**: Fan-in (phụ thuộc vào), Fan-out (phụ thuộc ra), **I = Fan-out / (Fan-in + Fan-out)**, I=0 rất ổn định (*responsible, independent*), I=1 rất bất ổn (*irresponsible, dependent*).
  - Rule: **I giảm dần theo hướng dependency**. Vẽ component bất ổn ở trên; mũi tên chĩa lên là vi phạm.
  - Sửa vi phạm (Stable → Flexible): tạo interface `US` trong component `UServer` (I=0), để `C` trong Flexible implement nó. Đây là **abstract component** chỉ chứa interface.
- **SAP — Stable Abstractions Principle**: *"A component should be as abstract as it is stable."*
  - Policy cấp cao đặt ở component ổn định, nên phải trừu tượng để mở rộng được (OCP).
  - **SDP + SAP = DIP cho component** (nhưng cho phép "một phần" trừu tượng/ổn định).
  - **A = Na / Nc** (số interface+abstract / tổng class).
  - **Main Sequence**: đường nối (0,1) và (1,0) trên đồ thị A/I.
  - **Zone of Pain** (0,0): ổn định + cụ thể, ví dụ **database schema**. Chỉ đau nếu volatile; `String` thì vô hại.
  - **Zone of Uselessness** (1,1): trừu tượng nhưng không ai phụ thuộc (abstract class bỏ hoang).
  - **D = |A + I − 1|**: khoảng cách tới Main Sequence; theo dõi mean/variance, control limit (ví dụ D > 0.1 thì xem lại).

## Key Concepts
- **DAG**: đồ thị có hướng không vòng.
- **Fan-in / Fan-out / I / A / D**: bộ metric quản lý dependency.
- **Responsible / Independent**: có nhiều người phụ thuộc / không phụ thuộc ai.
- **Abstract component**: component chỉ chứa interface (rất phổ biến trong Java/C#/Kotlin).
- **Volatility**: trục thứ ba; chỉ component volatile ở Zone of Pain mới gây đau.

## Mental Models
- Vẽ graph: component **hay đổi ở trên**, component **ổn định/trừu tượng ở dưới**; mọi mũi tên chĩa xuống.
- "Một module dễ đổi có thể **bị biến thành khó đổi** chỉ vì ai đó treo dependency vào nó."
- Metric không phải thần thánh: dùng để **đặt câu hỏi**, không phải để phán xét.

## Anti-patterns
- **Vòng dependency** dẫn đến morning-after, không test riêng được.
- **Component ổn định phụ thuộc component dễ đổi** (vi phạm SDP).
- **Concrete & stable & volatile**: Zone of Pain (schema DB bị mọi tầng phụ thuộc).
- **Interface "để dành"** không ai dùng: Zone of Uselessness.

## Worked Example
Tính I cho component `Cc`: 3 class ngoài phụ thuộc vào Cc (Fan-in = 3), Cc phụ thuộc 1 class ngoài (Fan-out = 1), nên **I = 1/(3+1) = 0.25**, khá ổn định.

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **ADP**: Gradle **cấm vòng giữa các module** (build fail: *Circular dependency between …*). Tách module là cách rẻ nhất để compiler bảo vệ ADP. Bên trong một `:app` duy nhất, vòng giữa các package **không bị phát hiện**, ví dụ `domain.usecase` import `data.repository` trong khi `data.model` lại import UiModel cho UI.
- **SDP/SAP cho bố cục module điển hình**:
| Module | Fan-in | Fan-out | I | A | Ghi chú |
|---|---|---|---|---|---|
| `:core:domain` (interface repo, model, use case) | cao | ~0 (chỉ coroutines) | ~0 | cao | Gần (0,1), đúng Main Sequence |
| `:core:data` (RepositoryImpl, Room, Retrofit) | thấp (chỉ `:app` để DI) | cao | ~1 | thấp | Gần (1,0) |
| `:feature:*` | 0–1 | domain, ui | ~1 | thấp | Dễ đổi |
| `:app` (Koin modules, Application) | 0 | mọi thứ | 1 | 0 | Main |
- **Zone of Pain trên Android**: Room `@Entity` mà UI, ViewModel và use case đều dùng trực tiếp. Mỗi lần đổi schema đều lan khắp app. Hãy giữ Entity ở `:core:data`, map sang domain model.
- **Phá vòng bằng DIP**: `feature:liveCamera` cần mở màn `feature:numberLocator`, và ngược lại. Tạo `:core:navigation` chứa `interface NumberLocatorNavigator`, để `:app` (Main) cung cấp impl.

## Key Takeaways
1. Không để vòng dependency; phá bằng DIP hoặc component mới.
2. Phụ thuộc theo hướng ổn định: I giảm dần dọc theo mũi tên.
3. Component càng ổn định càng phải trừu tượng: A ≈ 1 − I.
4. Tránh Zone of Pain (ổn định + cụ thể + volatile) và Zone of Uselessness.
5. Cấu trúc component tiến hóa; không thiết kế top-down từ ngày đầu.

## Connects To
- **arch-ch11 (DIP)**, **arch-ch13 (Cohesion)**, **arch-ch22 (Dependency Rule)**, **arch-ch30 (Database Is a Detail)**.
