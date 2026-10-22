# Clean Architecture — Chapter 9: LSP — The Liskov Substitution Principle

## Core Idea
Để xây hệ thống từ các phần thay thế được, các phần đó phải tuân thủ **cùng một contract**. LSP không chỉ áp cho kế thừa mà cho mọi **interface ↔ implementation**, kể cả REST service. Vi phạm LSP sẽ làm kiến trúc nhiễm đầy cơ chế xử lý đặc biệt.

## Frameworks Introduced
- **Liskov's definition (1988)**: *"If for each object o1 of type S there is an object o2 of type T such that for all programs P defined in terms of T, the behavior of P is unchanged when o1 is substituted for o2 then S is a subtype of T."*
- **License example (tuân thủ)**: `Billing` gọi `License.calcFee()`; `PersonalLicense` và `BusinessLicense` tính khác nhau nhưng Billing không phụ thuộc subtype nào.
- **Square/Rectangle problem (vi phạm)**: `Square` không phải subtype đúng của `Rectangle` vì width/height của Rectangle độc lập. `r.setW(5); r.setH(2); assert(r.area()==10)` sẽ fail nếu `r` là Square. Cách "phòng thủ" duy nhất là `if` kiểm tra type, nghĩa là các type không còn thay thế được.
- **LSP and Architecture, Taxi dispatch**: aggregator gửi `PUT .../pickupAddress/%s/pickupTime/%s/destination/%s`. Acme viết tắt `dest`, nên hệ thống phải có special case.
  - Giải pháp tệ: `if (driver.getDispatchUri().startsWith("acme.com"))`. Tên công ty trong code dẫn đến bug bí ẩn và lỗ hổng bảo mật.
  - Giải pháp của kiến trúc sư: module tạo dispatch command điều khiển bằng **config DB** theo URI, tức là thêm một cơ chế phức tạp chỉ vì interface không thay thế được.

## Key Concepts
- **Substitutability**: client không đổi behavior khi đổi implementation.
- **Contract**: ngữ nghĩa (không chỉ chữ ký) mà mọi implementation phải tôn trọng.
- **Type-checking `if`**: triệu chứng chắc chắn của vi phạm LSP.
- **Interface forms**: Java interface, Ruby duck-typing, REST endpoint dùng chung.

## Mental Models
- "Nếu client phải hỏi **'mày là loại gì?'** thì LSP đã gãy."
- Contract gồm cả **hành vi lỗi**, **side-effect**, **threading**, chứ không chỉ kiểu trả về.

## Anti-patterns
- **`is`/`instanceof` + nhánh đặc biệt trong client**.
- **Hard-code tên vendor/brand trong logic** (`"acme"`).
- **Subtype làm yếu hậu điều kiện / tăng tiền điều kiện** (Square ràng buộc thêm w==h).

## Worked Example
```
URI          Dispatch Format
Acme.com     /pickupAddress/%s/pickupTime/%s/dest/%s
*.*          /pickupAddress/%s/pickupTime/%s/destination/%s
```
Bảng config này là "chi phí kiến trúc" phải trả cho một vi phạm LSP nhỏ.

## 🤖 Android mapping (chuyển thể, không có trong sách)
Contract của `Repository` trong Satellite2: **mọi hàm trả `Flow<Result<T>>`, không bao giờ throw ra ngoài (trừ `CancellationException`), chạy trên IO**. Mọi impl (Retrofit, Room, assets JSON, Fake trong test) phải giữ đúng contract này.
```kotlin
// ✅ Tôn trọng contract — giống ApiRepositoryImpl/CityRepositoryImpl
override fun getAllCities(): Flow<Result<List<CityDtoModel>>> = flow<Result<List<CityDtoModel>>> {
    emit(Result.Success(readCitiesFromAssets()))
}.catch { e ->
    if (e is CancellationException) throw e   // giữ ngữ nghĩa cancel của coroutine
    emit(Result.Error(e))
}.flowOn(Dispatchers.IO)

// ❌ Vi phạm LSP — impl mới throw thẳng, ViewModel phải thêm try/catch riêng cho impl này
override fun getAllCities() = flow { emit(Result.Success(api.getCities())) } // quên catch
```
- `FakeRepository` trong test cũng phải emit `Result.Error` thay vì throw, nếu không thì test đang kiểm một contract khác với production.
- Smell LSP trên Android: `if (repository is RemoteRepository) showLoading()` hoặc `if (BuildConfig.FLAVOR == "xyz")` rải trong ViewModel. Hãy đưa khác biệt vào implementation hoặc config, giống bảng dispatch của sách.
- Adapter: `BaseListAdapter` subclass không được thay đổi ngữ nghĩa `submitList` (ví dụ tự sort ngầm), vì Fragment giả định thứ tự giữ nguyên.

## Key Takeaways
1. LSP áp dụng cho mọi interface: class, module, REST API.
2. Kiểm tra type trong client là dấu hiệu vi phạm.
3. Một vi phạm nhỏ kéo theo cơ chế đặc biệt lớn trong kiến trúc.
4. Viết rõ contract (lỗi, threading, cancel) và bắt mọi impl/fake tuân theo.

## Connects To
- **arch-ch05**: polymorphism chỉ có giá trị khi các impl thay thế được.
- **code-ch07 (Error Handling)**: định nghĩa exception theo nhu cầu của caller.
