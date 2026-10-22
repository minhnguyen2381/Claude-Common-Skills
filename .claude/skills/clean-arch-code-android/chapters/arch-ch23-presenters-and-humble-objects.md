# Clean Architecture — Chapter 23: Presenters and Humble Objects

## Core Idea
**Humble Object pattern**: tách hành vi **khó test** (giữ ở mức tối giản trong humble object) khỏi hành vi **dễ test**. Ranh giới testable/untestable thường **chính là ranh giới kiến trúc**. Ranh giới này xuất hiện ở khắp nơi: Presenter/View, Gateway/DB, Data Mapper, Service Listener.

## Frameworks Introduced
- **Humble Object (Meszaros, *xUnit Patterns*)**: chia thành 2 module. **Humble** chứa phần khó test, rút gọn tới mức cốt lõi; phần còn lại chứa mọi hành vi testable.
- **Presenters and Views**:
  - **View = humble**: chỉ chuyển data vào GUI, **không xử lý**.
  - **Presenter = testable**: nhận data từ app, **format** vào **View Model**:
    - Date thành String đã format.
    - Currency thành String với số lẻ và ký hiệu tiền; **số âm đỏ thì là một boolean flag**.
    - Tên mọi button, menu item, radio, checkbox là String; gray-out là boolean.
    - Bảng số thành bảng String đã format.
  - *"Anything and everything that appears on the screen… is represented in the View Model as a string, or a boolean, or an enum."*
- **Testing and Architecture**: tính testable là thuộc tính của kiến trúc tốt; tách testable/non-testable thường **định nghĩa ra ranh giới**.
- **Database Gateways** (Fowler, *PoEAA*): interface đa hình với method cho mỗi CRUD mà app cần, ví dụ `UserGateway.getLastNamesOfUsersWhoLoggedInAfter(Date)`. **Không có SQL** ở tầng use case. Implementation (ở tầng DB) là **humble**. Interactor không humble nhưng **testable** vì gateway thay được bằng stub/test double.
- **Data Mappers**: *"There is no such thing as an object relational mapper (ORM)."* Object là tập thao tác (data private); data structure là tập data public không hành vi. ORM nên gọi là **data mapper**, thuộc **tầng database**, và là thêm một humble boundary.
- **Service Listeners**: output thì app nạp data vào DS đơn giản rồi module ngoài format và gửi đi; input thì listener nhận và format thành DS đơn giản cho app. Đây cũng là humble.

## Key Concepts
- **Humble object**: phần khó test, càng mỏng càng tốt.
- **View Model**: DS gồm String/boolean/enum cho View.
- **Gateway**: interface truy cập DB do use case định nghĩa, method theo nhu cầu nghiệp vụ.
- **Data mapper**: nạp bảng quan hệ vào data structure.
- **Test double / stub**.

## Mental Models
- Hỏi về mỗi dòng code UI: "**Dòng này có cần màn hình thật để kiểm tra không?**" Nếu không, chuyển nó vào Presenter.
- Gateway method đặt tên theo **câu hỏi nghiệp vụ**, không theo câu lệnh SQL.

## Anti-patterns
- **View chứa logic format/điều kiện** (if âm thì đỏ, format ngày trong adapter).
- **Generic CRUD repository** (`findAll`, `findBy(criteria)`) để use case tự lắp query.
- **Gọi ORM entity là "domain object"**.

## 🤖 Android mapping (chuyển thể, không có trong sách)
| Humble (khó test) | Testable |
|---|---|
| Fragment, XML, `BaseListAdapter.bindView` | ViewModel + mapper `toPresentation()` |
| `RepositoryImpl` + Room DAO / Retrofit | UseCase (với fake repository) |
| `FirebaseMessagingService`, `BroadcastReceiver` | Handler/UseCase nhận DS đơn giản |
| Google Maps `GoogleMap` callbacks | `MapPresenter` tính marker list, camera bounds |

- **Mâu thuẫn với một quy ước của Satellite2**: CLAUDE.md của dự án ghi *"Format display values in the adapter, not in the UIModel"*. Sách khuyên **ngược lại**: Presenter format, View humble. Format trong adapter thì logic hiển thị (định dạng view count "1.2K", ngày, màu trạng thái live/offline) **không unit test được**. Lý do thực tế của quy ước kia thường là cần `Context` để lấy string resource. Cách giải giữ View humble:
```kotlin
// UiText: Presenter quyết định "hiển thị gì", View chỉ resolve resource
sealed interface UiText {
    data class Raw(val value: String) : UiText
    data class Res(@StringRes val id: Int, val args: List<Any> = emptyList()) : UiText
}
fun UiText.asString(ctx: Context) = when (this) { is UiText.Raw -> value; is UiText.Res -> ctx.getString(id, *args.toTypedArray()) }

// Presenter/mapper — testable trên JVM
fun LiveVideo.toPresentation() = LiveVideoUiModel(
    id = id,
    title = title,
    viewCountText = formatCompact(viewCount),          // "1.2K" — test được
    statusText = if (isLive) UiText.Res(R.string.live) else UiText.Res(R.string.offline),
    isLiveBadgeVisible = isLive,                       // boolean flag thay cho if trong adapter
)

// View — humble
override fun bindView(binding: ItemLiveVideoBinding, item: LiveVideoUiModel, position: Int) {
    binding.tvTitle.text = item.title
    binding.tvViews.text = item.viewCountText
    binding.tvStatus.text = item.statusText.asString(binding.root.context)
    binding.badgeLive.isVisible = item.isLiveBadgeVisible
}
```
- **Gateway theo nghiệp vụ**: `LiveVideoRepository.getMostViewed(limit)`, `getNearest(lat, lng, radiusKm)` thay cho `getAll()` rồi lọc trong ViewModel.
- **Room = data mapper**: `@Entity` + DAO là humble và nằm ở `data`; test chúng bằng instrumented test riêng (in-memory Room), còn use case test trên JVM.

## Key Takeaways
1. Tách khó test (humble) khỏi dễ test; humble càng mỏng càng tốt.
2. Presenter format mọi thứ thành String/boolean/enum; View chỉ gán.
3. Gateway (repository interface) có method theo nhu cầu nghiệp vụ; SQL chỉ ở impl.
4. ORM là data mapper, thuộc tầng DB.
5. Ở mỗi ranh giới kiến trúc thường có một humble object.

## Connects To
- **arch-ch22 (Typical scenario)**, **arch-ch28 (Test Boundary)**.
- **code-ch09 (Unit Tests)**: test sạch cho presenter/use case.
