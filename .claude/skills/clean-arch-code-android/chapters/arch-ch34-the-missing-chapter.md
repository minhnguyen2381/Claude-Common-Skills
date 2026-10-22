# Clean Architecture — Chapter 34: The Missing Chapter (by Simon Brown)

## Core Idea
Ý định thiết kế tốt có thể **sụp đổ trong chớp mắt** nếu bỏ qua chi tiết hiện thực: cách tổ chức package, **access modifier**, cách tách source tree. *"The devil is in the implementation details."* Hãy **dùng compiler để cưỡng chế kiến trúc** thay vì chỉ trông vào kỷ luật và code review.

## Frameworks Introduced
- **4 cách tổ chức code** (ví dụ use case "view orders" của nhà sách online):
  1. **Package by layer** (horizontal): `web` / `service` / `data`. Nhanh để bắt đầu (Fowler: *Presentation Domain Data Layering*), nhưng **không hét domain** và không đủ khi lớn.
  2. **Package by feature** (vertical): mọi type về orders trong một package. Hét domain, dễ tìm code, nhưng tác giả cho là **vẫn chưa tối ưu**.
  3. **Ports and Adapters** (hexagonal): "inside" (domain) và "outside" (infrastructure); outside phụ thuộc inside. Đặt tên theo **ubiquitous language** (DDD): `OrdersRepository` thành **`Orders`**.
  4. **Package by component**: gom business logic + persistence của một component thô vào **một package**, UI tách riêng. Component (theo **C4 model**): *"A grouping of related functionality behind a nice clean interface, which resides inside an execution environment like an application."* Monolith với component rõ ràng là **bậc thang tới micro-service**.
- **Relaxed layered architecture problem**: dev mới inject thẳng `OrdersRepository` vào `OrdersController`, **bỏ qua** `OrdersService`. Graph vẫn acyclic, mũi tên vẫn chĩa xuống, nhưng vượt qua business logic (ví dụ kiểm tra quyền truy cập record). Kỷ luật hay code review đều dễ vỡ khi deadline đến; static analysis (NDepend, Structure101, Checkstyle) thì vòng phản hồi dài.
- **Organization vs Encapsulation**: lạm dụng `public` khiến package chỉ còn là **thư mục**, và cả 4 kiến trúc trở nên **giống hệt nhau về cú pháp** (đều thành layered). Thu hẹp access modifier:
  - Package by layer: interface `public`, impl package-private.
  - Package by feature: chỉ Controller là entry point.
  - Ports & adapters: `OrdersService`, `Orders` `public`; impl package-private, inject lúc runtime.
  - Package by component: chỉ `OrdersComponent` `public`; repository **không thể** bị gọi từ ngoài, compiler cưỡng chế.
- **Other Decoupling Modes**: module system (OSGi, Java 9 modules: *public* vs *published*); tách **source tree** (Maven/Gradle module): domain / web / persistence.
  - **Périphérique anti-pattern** (đường vành đai Paris): chỉ có 2 source tree (domain + infrastructure) thì code infra này (web controller) gọi thẳng code infra kia (DB repository) mà **không đi qua domain**.
- **The Missing Advice**: ánh xạ thiết kế vào cấu trúc code, chọn decoupling mode compile/runtime, thực dụng theo quy mô team, kỹ năng, thời gian, ngân sách. Dùng compiler; cảnh giác coupling ở chỗ khác (data model).

## Key Concepts
- **Package by layer / feature / component, Ports & Adapters**.
- **Relaxed layering**: bỏ qua tầng kề.
- **Public vs published**.
- **C4 model**: system → container → component → code.
- **Périphérique anti-pattern**.
- **Ubiquitous language**.

## Mental Models
- "**Compiler có ngăn được dev mới làm sai không?**" Nếu không, kiến trúc chỉ là lời khuyên.
- Mặc định **private/internal**; chỉ mở khi có dependency đi vào.

## Anti-patterns
- **Mọi thứ đều `public`**.
- **Controller inject thẳng repository** bỏ qua use case.
- **Một source tree "infrastructure" chung** (Périphérique).
- **Cưỡng chế kiến trúc chỉ bằng "trust & code review"**.

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **Kotlin `internal` = công cụ cưỡng chế cấp module**. `internal` chỉ có tác dụng **giữa các Gradle module**; trong một `:app` duy nhất, `internal` ≈ `public`. Đây là lý do thực tế để tách `:core:data` khi muốn compiler chặn `RepositoryImpl`.
```kotlin
// :core:data
internal class LiveVideoRepositoryImpl(private val api: LiveVideoApi) : LiveVideoRepository { ... }
// Chỉ "published" Koin module
val dataModule = module { singleOf(::LiveVideoRepositoryImpl) bind LiveVideoRepository::class }
```
  `:feature:camera` không thể `import LiveVideoRepositoryImpl` vì compiler báo lỗi.
- **Relaxed layering trên Android**: ViewModel inject thẳng `ApiInterface` / DAO / `DataStoreRepository` bỏ qua UseCase. Satellite2 cho phép điều này một cách hợp lệ ("use cases exist for complex features"), là lựa chọn thực dụng kiểu CQRS cho màn đơn giản. Nhưng cần một **quy tắc rõ ràng** (ví dụ: "ViewModel được gọi Repository trực tiếp cho read đơn giản; mọi rule nghiệp vụ/quyền premium phải qua UseCase") và nên cưỡng chế bằng Konsist test.
- **Bốn kiểu tổ chức trong Android**:
| Kiểu | Android | Đánh giá |
|---|---|---|
| By layer | `data/ domain/ feature/ di/` top-level (Satellite2 hiện tại) | Dễ bắt đầu, không hét domain |
| By feature | `liveCamera/` chứa Fragment+VM+UseCase+Repo | Hét domain, dễ Périphérique nếu mọi thứ public |
| Ports & adapters | `:core:domain` + `:core:data` + `:app` | Tốt; cẩn thận Périphérique trong `:core:data` |
| By component | `:feature:camera` chứa domain+data nội bộ `internal`, chỉ expose `CameraComponent`/Koin module + UI entry | Compiler cưỡng chế mạnh nhất |
- **Périphérique trong Android**: một module `:data` chứa cả `NetworkModule`, `RoomModule`, `AdsManager`, `AnalyticsHelper`; `AdsManager` gọi thẳng `Room` DAO để đếm lượt hiển thị. Hãy đi qua domain (`AdImpressionCounter` interface).
- **Đặt tên theo ubiquitous language**: `LiveVideos` / `SearchHistory` thay vì `LiveVideoRepository` là tùy chọn; quan trọng hơn là method nói ngôn ngữ nghiệp vụ (`nearest()`, `mostViewed()`).

## Key Takeaways
1. Chi tiết hiện thực quyết định kiến trúc có sống sót hay không.
2. Lạm dụng `public` thì mọi kiểu kiến trúc đều thành layered.
3. Package by component + access modifier giúp compiler cưỡng chế.
4. Cẩn thận relaxed layering và Périphérique anti-pattern.
5. Thực dụng theo team, kỹ năng, thời gian; nhưng tự động hóa việc cưỡng chế.

## Connects To
- **arch-ch21 (Screaming)**, **arch-ch24 (Partial boundaries)**, **arch-ch13 (Cohesion)**, **arch-ch12 (Components)**.
