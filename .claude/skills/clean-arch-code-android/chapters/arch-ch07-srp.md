# Clean Architecture — Chapter 7: SRP — The Single Responsibility Principle

## Core Idea
SRP **không** có nghĩa là "mỗi module chỉ làm một việc" (đó là quy tắc cho *function*). Phát biểu cuối cùng: **"A module should be responsible to one, and only one, actor."** Hãy tách code mà các actor khác nhau phụ thuộc vào.

## Frameworks Introduced
- **SRP (final form)**: *A module should be responsible to one, and only one, actor.*
  - Tiến hóa: "one reason to change" → "one user/stakeholder" → "one **actor**" (nhóm người cần cùng một loại thay đổi).
  - When to use: khi một class/file bị nhiều nhóm yêu cầu sửa vì những lý do khác nhau.
  - How: liệt kê ai (team/vai trò nào) yêu cầu thay đổi từng method, rồi gom theo actor và tách file.
- **Symptom 1: Accidental Duplication**: `Employee` có `calculatePay()` (CFO/kế toán), `reportHours()` (COO/HR), `save()` (CTO/DBA). Hai method dùng chung `regularHours()`. CFO đổi thuật toán, báo cáo HR sai và gây thiệt hại hàng triệu đô.
- **Symptom 2: Merges**: hai dev từ hai team cùng sửa một file vì hai lý do khác nhau, dẫn đến merge conflict, rủi ro cho cả hai actor.
- **Solutions**:
  1. Tách data khỏi function: `EmployeeData` (struct không method) + `PayCalculator`, `HourReporter`, `EmployeeSaver`, các class này không biết nhau.
  2. **Facade**: `EmployeeFacade` khởi tạo và delegate.
  3. Giữ method quan trọng nhất (`calculatePay`) trong `Employee`, dùng nó làm Facade cho các method phụ.
- **SRP ở 3 cấp**: class/function → **Common Closure Principle** (component) → **Axis of Change** tạo ra **Architectural Boundaries**.

## Key Concepts
- **Actor**: nhóm (một hay nhiều người) yêu cầu cùng một loại thay đổi.
- **Module**: thường là một source file, hoặc một tập hàm + data cohesive.
- **Cohesion**: lực gắn kết code chịu trách nhiệm với một actor.
- **Accidental duplication**: code trông giống nhau nhưng phục vụ actor khác nhau, nên dùng chung là sai.
- **Scope**: mỗi class tách ra là một scope với nhiều private method.

## Mental Models
- Hỏi "**Ai sẽ gọi điện bắt mình sửa file này?**". Nếu có hơn một phòng ban thì vi phạm SRP.
- Hai đoạn code giống hệt nhau nhưng **khác actor** thì đó là *duplication giả*, đừng DRY chúng lại.

## Anti-patterns
- **Hiểu SRP thành "chỉ làm một việc"**: dẫn đến chẻ vụn vô nghĩa.
- **DRY bất chấp actor**: gom `regularHours()` dùng chung cho hai actor là gốc của bug âm thầm.
- **God class phục vụ nhiều team**: là nơi sinh ra merge conflict thường trực.

## Worked Example
```
Trước:   Employee { calculatePay(); reportHours(); save(); regularHours() }
Sau:     EmployeeData (DS)
         PayCalculator  → dùng EmployeeData   (actor: CFO)
         HourReporter   → dùng EmployeeData   (actor: COO)
         EmployeeSaver  → dùng EmployeeData   (actor: CTO)
         EmployeeFacade → delegate tới 3 class trên
```
Mỗi class có thể có nhiều private method. "Một class một method" là hiểu lầm.

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **Actors của một app Android**: Product/UX (UI, flow màn hình), Growth/Monetization (ads, IAP, remote config), Backend/API team (DTO, endpoint), Data/Analytics (event log).
- **Smell trong Satellite2**: `CommonViewModel` quản lý categories, templates, famous places, live cameras, premium status và GPS location. Đó là ít nhất 3 actor (content, monetization, location). Đổi logic premium có thể làm hỏng smart-loading categories.
- Cách tách theo SRP:
```kotlin
// Mỗi holder phục vụ 1 actor, CommonViewModel chỉ là Facade
class PremiumStateHolder(private val iapRepository: IapRepository) { val isPremium: StateFlow<Boolean> = ... }
class UserLocationHolder(private val getUserLocation: GetCurrentUserGPSLocationUseCase) { ... }
class CatalogHolder(private val apiRepository: ApiRepository) { ... }

class CommonViewModel(
    val premium: PremiumStateHolder,
    val location: UserLocationHolder,
    val catalog: CatalogHolder,
) : ViewModel()
```
- **Accidental duplication trên Android**: `DtoModel` và `UIModel` có field giống nhau nhưng phục vụ hai actor (API team và UX), nên **giữ hai class** và dùng mapper `toPresentation()`. Đừng dùng DTO thẳng trên UI.
- Pattern `Fragment` + `FragmentEx` (UI init/click) + `ViewModel` (state/logic) là tách theo trục thay đổi ở mức file.

## Key Takeaways
1. SRP = một module, một actor.
2. Code giống nhau của các actor khác nhau thì đừng gộp.
3. Dấu hiệu vi phạm: bug lan chéo giữa các tính năng và merge conflict thường xuyên.
4. Facade giúp giữ API gọn sau khi tách.
5. SRP lặp lại thành CCP (component) và Axis of Change (boundary).

## Connects To
- **arch-ch13 (CCP)**, **arch-ch16 (Independence, decoupling use cases)**.
- **code-ch10 (Classes)**: SRP ở cấp class trong Clean Code.
