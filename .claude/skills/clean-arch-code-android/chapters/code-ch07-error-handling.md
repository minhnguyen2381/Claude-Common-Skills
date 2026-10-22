# Clean Code — Chapter 7: Error Handling (Michael Feathers)

## Core Idea
Error handling quan trọng, nhưng *"if it obscures logic, it's wrong."* Hãy coi xử lý lỗi là **một mối quan tâm riêng**, tách khỏi logic chính, để code vừa **sạch** vừa **robust**.

## Frameworks Introduced
- **Use Exceptions Rather Than Return Codes**: `DeviceController.sendShutDown()` với `if (handle != INVALID)` lồng nhau → `try { tryToShutDown(); } catch (DeviceShutDownError e) { logger.log(e); }`. Hai concern (thuật toán shutdown, xử lý lỗi) được tách ra.
- **Write Your Try-Catch-Finally Statement First**: `try` như một **transaction**: `catch` phải để chương trình ở trạng thái nhất quán. Dùng TDD: viết test ép exception trước (`retrieveSectionShouldThrowOnInvalidFileName`), dựng scope try/catch, rồi thu hẹp loại exception (`FileNotFoundException` → `StorageException`).
- **Use Unchecked Exceptions**: *"The debate is over."* Checked exception vi phạm **OCP**: hàm thấp nhất thêm `throws` thì mọi hàm trên đường đi phải đổi signature, nên encapsulation bị phá. Chỉ hữu ích cho thư viện quan trọng.
- **Provide Context with Exceptions**: message nêu **thao tác thất bại** và **loại lỗi**; stack trace không cho biết ý định.
- **Define Exception Classes in Terms of a Caller's Needs**: phân loại theo **cách bắt**, không theo nguồn. Bọc `ACMEPort` (3 loại exception, catch trùng lặp) bằng `LocalPort` chỉ ném `PortDeviceFailure`.
  - **Wrapping third-party APIs is a best practice**: giảm phụ thuộc, dễ đổi thư viện, dễ mock, tự định nghĩa API phù hợp.
  - Một exception class cho một vùng code thường là đủ; chỉ tách class khi muốn bắt cái này và cho cái kia đi qua.
- **Define the Normal Flow → Special Case Pattern** (Fowler): `try { expenses = dao.getMeals(id); total += expenses.getTotal(); } catch (MealExpensesNotFound) { total += getMealPerDiem(); }` → DAO luôn trả `MealExpenses`; khi không có thì trả `PerDiemMealExpenses`. Client không phải xử lý ngoại lệ.
- **Don't Return Null**: `registerItem` đầy `if (x != null)` (và vẫn quên một chỗ: `persistentStore`). *"the problem… is that it has too many [null checks]."* Thay bằng **exception** hoặc **special case object**; trả `Collections.emptyList()` thay vì `null`. Bọc API bên thứ ba trả null.
- **Don't Pass Null**: còn tệ hơn trả null. Không có cách tốt để xử lý null truyền vào nhầm (exception hay `assert` đều không giải quyết), nên **cấm truyền null theo mặc định**.

## Key Concepts
- **Error handling as separate concern**.
- **Try block as transaction**.
- **Unchecked exception**, **OCP violation of checked exceptions**.
- **Exception wrapper / translation**.
- **Special Case Pattern** (Null Object).
- **Null discipline**.

## Mental Models
- Đọc hàm, che hết `catch`/`if (error)`: logic chính có còn hiển hiện không?
- Exception class được định nghĩa bởi **người bắt**, không bởi **người ném**.

## Anti-patterns
- Error code + `if` lồng.
- Bắt nhiều exception của thư viện ngoài ở khắp nơi (không wrap).
- Exception không có context.
- Trả/nhận `null`; kiểm tra null khắp nơi.
- Dùng exception cho luồng bình thường (thay vì special case).

## Worked Example
```java
// Trước: exception làm rối logic nghiệp vụ
try {
  MealExpenses expenses = expenseReportDAO.getMeals(employee.getID());
  m_total += expenses.getTotal();
} catch (MealExpensesNotFound e) {
  m_total += getMealPerDiem();
}
// Sau: DAO trả Special Case khi không có dữ liệu
MealExpenses expenses = expenseReportDAO.getMeals(employee.getID());
m_total += expenses.getTotal();   // PerDiemMealExpenses.getTotal() trả per diem
```

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **Kotlin không có checked exception**, đúng như lời khuyên "Use Unchecked Exceptions".
- **Wrap third-party ở Repository**, giống `LocalPort`:
```kotlin
// domain — exception theo nhu cầu caller (UI cần phân biệt: offline / server / quota)
sealed class AppError(message: String, cause: Throwable? = null) : Exception(message, cause) {
    class Offline(cause: Throwable) : AppError("No network while loading cameras", cause)
    class Server(val code: Int, cause: Throwable) : AppError("Server error $code while loading cameras", cause)
    class QuotaExceeded : AppError("Daily lookup quota exceeded")
}
// data — dịch exception Retrofit/OkHttp tại ranh giới
private fun Throwable.toAppError(): Throwable = when (this) {
    is CancellationException -> this                          // không bao giờ nuốt cancel
    is IOException -> AppError.Offline(this)
    is HttpException -> AppError.Server(code(), this)
    else -> this
}
override fun mostViewed(limit: Int) = flow { emit(Result.Success(api.mostViewed(limit).map { it.toDomain() })) }
    .catch { e -> if (e is CancellationException) throw e; emit(Result.Error(e.toAppError())) }
    .flowOn(Dispatchers.IO)
```
  Nhờ vậy ViewModel chỉ biết `AppError`, không biết `retrofit2.HttpException`.
- **Không tạo enum mã lỗi toàn cục** (dependency magnet, code-ch03); dùng sealed exception theo vùng.
- **Null trong Kotlin**: type system buộc xử lý `T?` nên null an toàn hơn Java, nhưng tinh thần vẫn đúng:
  - Trả `emptyList()` thay vì `List<T>?`.
  - Thay `LatLng?` (không biết vì sao null: chưa cấp quyền? GPS tắt? timeout?) bằng **special case/sealed**:
```kotlin
sealed interface LocationResult {
    data class Found(val coordinates: Coordinates) : LocationResult
    data object PermissionDenied : LocationResult
    data object Unavailable : LocationResult
}
```
  - Tránh `!!`; tránh tham số `T?` "cho tiện" (Don't pass null), dùng default value hoặc overload.
- **Special case trên UI**: `UiState.None` / empty state object thay vì `null` list; `PerDiemMealExpenses` ↔ `EmptyCatalog` hiển thị placeholder.
- **Try như transaction trong coroutine**: lỗi giữa chừng khi lưu lịch sử + cập nhật quota thì dùng `withTransaction {}` của Room, hoặc đảm bảo state trong `catch` nhất quán (không để `isLoading = true` mãi).
- **Context**: `Timber.e(e, "Failed to load page=%d keyword=%s", page, keyword)` thay vì `Timber.e("error: $e")`.

## Key Takeaways
1. Exception (unchecked) thay error code; tách logic khỏi xử lý lỗi.
2. Viết try/catch trước như một transaction (TDD).
3. Exception có context; class exception theo nhu cầu người bắt.
4. Wrap API bên thứ ba và dịch exception tại ranh giới.
5. Special Case thay cho exception ở luồng bình thường.
6. Không trả null, không truyền null.

## Connects To
- **code-ch03 (Prefer exceptions, extract try/catch)**, **code-ch08 (Boundaries: wrap third-party)**, **arch-ch09 (LSP: contract lỗi của repository)**.
