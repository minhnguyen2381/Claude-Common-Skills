# Clean Architecture — Chapter 20: Business Rules

## Core Idea
Business rules là **lý do hệ thống tồn tại**, là "family jewels". Có hai loại: **Critical Business Rules** (tồn tại kể cả khi không có máy tính), gói trong **Entities**; và **application-specific business rules**, gói trong **Use Cases**. Use case nhận **Request Model** và trả **Response Model** thuần, độc lập với mọi framework.

## Frameworks Introduced
- **Critical Business Rules + Critical Business Data**: quy tắc kiếm hoặc tiết kiệm tiền cho doanh nghiệp, *kể cả khi làm thủ công* (ngân hàng tính N% lãi, bằng máy hay bằng bàn tính đều vậy). Dữ liệu cần cho quy tắc (số dư, lãi suất, lịch trả) là Critical Business Data.
- **Entity** (thuật ngữ của Ivar Jacobson): object chứa một nhóm nhỏ Critical Business Rules thao tác trên Critical Business Data.
  - Ví dụ `Loan`: data (principal, rate, period) + rules (`makePayment()`, `applyInterest()`, `chargeLateFee()`).
  - **Pure business**: không dính DB, UI, framework. Không bắt buộc OO; chỉ cần gói data + rules trong một module riêng.
- **Use Case**: mô tả cách hệ thống *tự động hóa* được sử dụng; chứa **application-specific business rules**.
  - Ví dụ: không cho xem ước tính khoản vay trước khi thu thập và xác thực thông tin liên hệ, và credit score ≥ 500.
  - Gồm: input, output, các bước xử lý; tham chiếu Entity (`Customer`).
  - **"Use cases control the dance of the Entities."**
  - **Không mô tả UI**: không biết là web, thick client, console hay service.
  - Là một object: có hàm và data (input, output, tham chiếu Entity).
- **Dependency direction**: Entity (cao, tổng quát, dùng cho nhiều app) **không biết** Use Case (thấp hơn, đặc thù một app, gần I/O hơn). Use Case phụ thuộc Entity.
- **Request and Response Models**: data structure đơn giản, **không phụ thuộc gì** (không kế thừa `HttpRequest`/`HttpResponse`, không biết HTML/SQL).
  - **Đừng** để chúng tham chiếu Entity dù nhiều field trùng nhau, vì hai thứ đổi vì lý do khác nhau (vi phạm CCP/SRP). Hậu quả là **tramp data** và nhiều `if`.

## Key Concepts
- **Critical Business Rule / Data**.
- **Entity**: critical rules + critical data, framework-free.
- **Use Case**: application-specific rules, điều phối Entity.
- **Request/Response Model**: DTO thuần cho use case.
- **Tramp data**: dữ liệu bị "kéo theo" qua nhiều tầng mà không dùng.

## Mental Models
- Test Entity: "**Quy tắc này có tồn tại nếu làm bằng giấy bút không?**" Nếu có thì là Entity; nếu chỉ có nghĩa trong app thì là Use Case.
- Use case là **biên đạo**, Entity là **vũ công**.

## Anti-patterns
- **Entity biết DB/UI** (annotation ORM, `Parcelable`, `@SerializedName`).
- **Request/Response model kế thừa framework type** hoặc **chứa Entity**.
- **Use case mô tả UI** ("bấm nút xanh").

## Worked Example
```
Use case: Gather Contact Info for New Loan
Input:  Name, Address, Birthdate, DL#, SSN, etc.
Output: Same info for readback + credit score
Primary course:
  1. Accept and validate name.
  2. Validate address, birthdate, DL#, SSN, etc.
  3. Get credit score.
  4. If credit score < 500 activate Denial.
  5. Else create Customer and activate Loan Estimation.
```

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **Entity trong app mobile** thường mỏng nhưng vẫn có. Ví dụ hợp lý với domain của Satellite2:
```kotlin
// Critical rule tồn tại kể cả không có app: "số điện thoại hợp lệ theo vùng"
@JvmInline value class E164(val value: String) {
    init { require(value.matches(Regex("^\\+[1-9]\\d{6,14}$"))) { "Invalid E.164: $value" } }
}
// Quy tắc business của công ty: free user được tra tối đa N lần/ngày
data class LookupQuota(val usedToday: Int, val dailyLimit: Int) {
    fun canLookup(isPremium: Boolean) = isPremium || usedToday < dailyLimit
}
```
- **Use case với Request/Response thuần**:
```kotlin
data class SearchCamerasRequest(val keyword: String, val categoryId: String?, val countryCode: String?, val page: Int, val pageSize: Int)
data class SearchCamerasResponse(val items: List<LiveVideo>, val hasMore: Boolean)

class SearchLiveCamerasUseCase(private val repo: LiveVideoRepository) {
    suspend operator fun invoke(req: SearchCamerasRequest): Result<SearchCamerasResponse> = ...
}
```
- **Vi phạm cần sửa trong Satellite2**: `GetAllLiveVideosWithFilterAndSearchByKeywordUseCase(..., liveVideoCategoryUiModel, liveVideoCountryUiModel)` nhận **UiModel** (thuộc presentation) làm input. Use case bị kéo theo UI: đổi UiModel thì use case đổi. Hãy truyền `categoryId: String?` / `countryCode: String?` hoặc Request model thuần.
- **Đừng**: Entity là `@Entity` của Room, `@Parcelize`, hay có `@SerializedName`. Đó là detail. Nếu cần thì map ở `data`/`presentation`.
- **Đừng** để Response chứa `UiState`/`Resource` hay `LiveData`. ViewModel mới là nơi chuyển `Result` thành `UiState` (Satellite2 đã quy ước "never mix them").

## Key Takeaways
1. Entity = critical rules + data, thuần business.
2. Use case = application rules, điều phối Entity, không biết UI.
3. Entity không biết use case; use case biết Entity.
4. Request/Response model thuần, không chứa Entity, không kế thừa framework.

## Connects To
- **arch-ch22 (Entities & Use Cases circles)**, **arch-ch23 (Presenters)**.
- **code-ch06 (Objects and Data Structures)**: Entity là object, Request/Response là data structure.
