---
name: kotlin-naming-kdoc
description: Use when writing, reviewing, or renaming Kotlin/Android functions, classes, interfaces, or properties; when names are vague or misleading, or KDoc is missing, redundant, or inconsistent with behavior. Applies to requests about naming conventions, clean code, and KDocs.
---

# Kotlin Naming & KDoc

Tên diễn đạt ý định; KDoc diễn đạt hợp đồng. Đọc tên ở nơi gọi phải hiểu hành vi chính mà không mở implementation.

## Phạm vi và cách dùng

Áp dụng cho code Kotlin mới hoặc phần được yêu cầu review/refactor. Java dùng cùng nguyên tắc ngữ nghĩa, nhưng viết Javadoc. Ưu tiên quy ước dự án và tên bắt buộc của framework.

1. Đọc implementation, nơi gọi và tài liệu liên quan. Xác định trách nhiệm, đầu vào, kết quả, lỗi và tác dụng phụ.
2. Chọn tên theo bảng; giữ thuật ngữ nghiệp vụ nhất quán.
3. Viết KDoc theo hợp đồng bên dưới. Chỉ mô tả điều đã xác minh.
4. Nếu sửa code: cập nhật references, imports, tên file, tests và KDoc links trong phạm vi; chạy build/tests liên quan. Nếu chỉ review: đưa đề xuất, không tự sửa.

## Quy chuẩn đặt tên

| Thành phần | Quy tắc | Ví dụ |
|---|---|---|
| Class/interface/object | `UpperCamelCase`, danh từ + trách nhiệm cụ thể | `InvoiceCalculator`, `UserRepository` |
| Hàm | `lowerCamelCase`, động từ + đối tượng; thêm điều kiện có ý nghĩa | `filterTimestampsAtOrAfter` |
| Boolean | Câu hỏi/trạng thái khẳng định | `isLoading`, `hasPermission`, `canShowAds` |
| Tham số/property | Nghĩa nghiệp vụ; số nhiều cho collection | `orders`, `retryCount`, `timeoutMillis` |
| Hằng compile-time | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| File một class chính | Khớp tên class | `InvoiceCalculator.kt` |

Tên tiếng Anh, đọc tự nhiên, đủ phân biệt; không đặt giới hạn độ dài cứng. Tránh `data`, `temp`, `process`, `handle`, `Manager`, `Helper`, `Utils` đứng một mình; bổ sung đối tượng/trách nhiệm. Dùng hậu tố `Repository`, `Factory`, `Validator`, `UseCase` khi đúng vai trò thực tế, không tạo abstraction chỉ để hợp thức hóa tên.

Quy ước động từ **của skill**, không phải bảo đảm của Kotlin:

- `find...`: tìm kiếm có thể không thấy; ghi rõ `null`/kết quả rỗng.
- `get...`: lấy giá trị; xác minh nguồn, chi phí và lỗi trước khi dùng.
- `fetch...`: lấy từ nguồn bên ngoài; `refresh...`: cập nhật dữ liệu hiện có.
- `observe...`: theo dõi thay đổi; `save...`/`delete...`: ghi/xóa.
- `validate...`: kiểm tra hợp lệ; KDoc nêu trả Boolean, danh sách lỗi hay ném lỗi.

Phân biệt bản sao và mutation (`sortedOrders` / `sortOrdersInPlace`); KDoc ghi rõ tác dụng phụ. Property biểu diễn giá trị/trạng thái; thao tác network hoặc ghi dữ liệu dùng hàm. Extension tận dụng receiver, tránh lặp tên kiểu. `@Composable` trả `Unit` dùng `UpperCamelCase` như `ProfileScreen`; factory kiểu constructor có thể trùng tên kiểu trả về như `UserRepository()`. Giữ tên `override`; giữ acronym quen thuộc (`userId`, `HttpClient`, `IOStream`).

## Quy ước hàm Dialog, UI và ViewModel

Các quy ước dưới đây áp dụng cho hàm thông thường; vẫn giữ tên bắt buộc của framework và quy ước riêng cho `@Composable`.

| Mục đích | Mẫu tên | Ví dụ |
|---|---|---|
| Hiển thị Dialog | `show<ContentOrPurpose>Dialog` | `showDeleteAccountConfirmationDialog()` |
| Hiển thị BottomSheet | `show<ContentOrPurpose>BottomSheet` | `showPaymentMethodBottomSheet()` |
| Gán thông tin lên UI | Ưu tiên `set<Subject>`; có thể thêm `Info` | `setUserProfileInfo(profile)` |
| Cập nhật thông tin UI | Ưu tiên `update<Subject>`; có thể thêm `Info` | `updateOrderSummaryInfo(order)` |
| Gán/cập nhật trạng thái UI | Ưu tiên `set`/`update`, kết thúc bằng `State` | `setLoadingState(isLoading)`, `updateOrderUiState(state)` |
| Hành động trong ViewModel | Động từ + đối tượng + mục đích/điều kiện cần phân biệt | `refreshOrdersByCustomerId(customerId)`, `submitPasswordResetRequest(email)` |

- Hàm **hiển thị** Dialog/BottomSheet bắt đầu bằng `show`, kết thúc đúng loại UI. Phần giữa nêu nội dung hoặc mục đích; tránh `showDialog()` khi chưa rõ dialog nào. Hàm chỉ tạo instance dùng tên thể hiện việc tạo, không gọi `show` khi chưa hiển thị.
- Hàm cập nhật UI ưu tiên tiền tố `set` khi gán giá trị, `update` khi cập nhật theo dữ liệu/trạng thái mới. Hậu tố `Info` là tùy chọn cho thông tin hiển thị; khi mô tả trạng thái, dùng hậu tố `State`, không dùng `Info`. Viết hoa `Info`/`State` ở cuối tên để giữ `lowerCamelCase`.
- Tên hàm ViewModel phải đủ nghĩa để người đọc hiểu mục đích ngay tại nơi gọi. Tránh tên quá ngắn hoặc mơ hồ như `load()`, `getData()`, `submit()`, `process()`, `updateInfo()`; dùng `loadUserProfile()`, `submitPasswordResetRequest(email)` hoặc `updateUserProfileInfo(profile)` theo đúng hành vi. Không rút gọn thành `ldUsr()`/`updOrd()`; không thêm từ chỉ để kéo dài tên. Nêu nguồn hoặc điều kiện khi cần phân biệt, ví dụ `loadOrdersFromLocalStorage()`.

## Clean code trong phạm vi

Mỗi hàm có một mục đích chính; mỗi class có trách nhiệm thống nhất. Nếu tên phải nối nhiều hành động độc lập bằng `And`, xem xét tách theo trách nhiệm thực tế. Ưu tiên luồng rõ, guard clause, ít nesting; chỉ trích xuất logic khi giúp hiểu hoặc loại bỏ cùng quy tắc nghiệp vụ bị lặp. Không tạo class/interface cho nhu cầu giả định, không đổi behavior trong lần đổi tên.

## Hợp đồng KDoc

Viết `/** ... */` ngay trước declaration. Dòng đầu tóm tắt ý nghĩa; đoạn sau giải thích điều người gọi cần biết, không kể lại từng dòng code.

- Public/protected API được thêm/sửa cần KDoc; `override` kế thừa hợp đồng không cần lặp. Private/internal cần KDoc khi có quy tắc hoặc tác dụng phụ khó thấy.
- Class: trách nhiệm và invariant; `@property` giải thích constructor properties, `@constructor` khi cách khởi tạo cần giải thích.
- Hàm: giải thích tham số có ý nghĩa không hiển nhiên bằng `[parameter]` hoặc `@param`; ghi đơn vị, miền hợp lệ, mặc định khi đã xác minh.
- Kết quả: nêu ý nghĩa, `null`/rỗng, thứ tự, bản sao/mutation. Dùng `@return` khi giúp tách hợp đồng; không thêm cho `Unit`.
- `@throws ExceptionType`: nêu điều kiện ném lỗi thực tế.
- Tác dụng phụ là phần bắt buộc khi có: network, ghi storage, mutation, logging, analytics. Nêu thread/coroutine, cancellation, ownership/lifecycle khi hợp đồng có quy định; `suspend` không tự bảo đảm chạy background.
- Liên kết `[Type]`, `[function]`; `@sample` chỉ trỏ đến sample tồn tại. Ngôn ngữ prose theo dự án, mặc định tiếng Việt; identifiers tiếng Anh.

Nếu chưa biết đơn vị/thứ tự/thread: đọc nguồn để xác minh, hoặc ghi rõ chưa xác định trong báo cáo. Không tự gán milliseconds, thread safety hay tính idempotent. Khi deadline ngắn, rút gọn câu chữ nhưng vẫn ghi tác dụng phụ thực tế.

## Ví dụ Kotlin

Thay `DataManager.getData(x, t)` bằng tên sau **trong code mới hoặc API đã cho phép migration**:

```kotlin
/** Chọn các mốc thời gian đạt ngưỡng, không sửa danh sách đầu vào. */
class TimestampFilter {
    /**
     * Chọn các mốc thời gian lớn hơn hoặc bằng [threshold].
     * Ghi số phần tử đầu vào ra standard output mỗi lần gọi hợp lệ.
     *
     * @param timestamps Các mốc thời gian cùng đơn vị với [threshold].
     * @param threshold Ngưỡng không âm, bao gồm giá trị bằng ngưỡng.
     * @return Danh sách mới giữ thứ tự và phần tử trùng; rỗng nếu không có kết quả.
     * @throws IllegalArgumentException Nếu [threshold] âm.
     */
    fun filterTimestampsAtOrAfter(
        timestamps: List<Long>,
        threshold: Long,
    ): List<Long> {
        require(threshold >= 0) { "threshold must be non-negative" }
        println("Filtering ${timestamps.size} timestamps")
        return timestamps.filter { timestamp -> timestamp >= threshold }
    }
}
```

## Lỗi thường gặp và kiểm tra cuối

| Lỗi | Cách xử lý |
|---|---|
| KDoc chỉ diễn giải tên | Bổ sung hợp đồng, edge cases và tác dụng phụ |
| Hàm `getUser` gọi HTTP và lưu lại | Đề xuất `refreshUser`; mô tả network và persistence |
| API public có người dùng bên ngoài | Giữ API hiện tại, đề xuất tên đích + migration; khi được phép, thêm API mới và deprecate API cũ bằng wrapper giữ nguyên signature/hành vi |
| Đổi tham số tưởng không ảnh hưởng | Kiểm tra named arguments, Kotlin/Java callers và compatibility |
| Comment và code mâu thuẫn | Lấy hành vi đã xác minh làm căn cứ; sửa cả docs liên quan |

Kiểm tra: tên đúng hành vi? KDoc có lỗi/nullable/side effects thực tế? Có bịa hợp đồng? References và build đã kiểm chứng? Với SDK, kiểm tra thêm binary/source compatibility, serialization và reflection trước khi đổi tên.

**Đầu ra:** code + KDoc nếu được yêu cầu triển khai; bảng `tên cũ → tên đề xuất → lý do` nếu review. Báo cáo ngắn thay đổi, xác minh đã chạy và giới hạn còn lại; không tuyên bố build pass khi chưa chạy.

## Tham khảo

- [Kotlin coding conventions](https://kotlinlang.org/docs/coding-conventions.html)
- [KDoc syntax and tags](https://kotlinlang.org/docs/kotlin-doc.html)
