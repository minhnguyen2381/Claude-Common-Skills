# Clean Code — Chapter 12: Emergence (Jeff Langr)

## Core Idea
Thiết kế tốt có thể **"nổi lên" (emerge)** khi theo **4 quy tắc Simple Design của Kent Beck**, theo thứ tự quan trọng: (1) **Runs all the tests**, (2) **Contains no duplication**, (3) **Expresses the intent of the programmer**, (4) **Minimizes the number of classes and methods**.

## Frameworks Introduced
- **Rule 1: Runs All the Tests**: hệ thống không kiểm chứng được thì không nên deploy. Viết test **đẩy** thiết kế về class nhỏ, một mục đích (SRP), giảm coupling (DIP, DI, interface). *"Writing tests leads to better designs."*
- **Rules 2–4: Refactoring**: có test thì không sợ dọn dẹp. Sau mỗi vài dòng, dừng lại và hỏi "mình vừa làm thiết kế tệ đi không?". Áp dụng mọi tri thức thiết kế: tăng cohesion, giảm coupling, tách concern, rút gọn hàm/class, đặt tên tốt.
- **No Duplication**: *"Duplication is the primary enemy of a well-designed system."*
  - Duplication **dòng giống nhau**, **dòng tương tự** (chỉnh cho giống rồi gộp), và **duplication of implementation** (`isEmpty()` tự đếm riêng thay vì `return 0 == size();`).
  - Ví dụ nhỏ: `scaleToOneDimension()` và `rotate()` cùng có `image.dispose(); System.gc(); image = newImage;` nên tách `replaceImage(newImage)`. Gộp nhỏ giúp **nhìn ra vi phạm SRP** và **reuse in the small**, tiền đề của reuse in the large.
  - **Template Method**: `accrueUSDivisionVacation` / `accrueEuropeanDivisionVacation` gần giống nhau, chỉ khác "legal minimums", nên `abstract class VacationPolicy { accrueVacation() { calculateBaseVacationHours(); alterForLegalMinimums(); applyToPayroll(); } abstract alterForLegalMinimums(); }`.
- **Expressive**: phần lớn chi phí là bảo trì dài hạn. Diễn đạt bằng **tên tốt**, **hàm/class nhỏ**, **danh pháp chuẩn** (tên pattern: `Command`, `Visitor`), **unit test như tài liệu bằng ví dụ**. Quan trọng nhất là **cố gắng**: *"the most likely next person to read the code will be you."* *"Care is a precious resource."*
- **Minimal Classes and Methods**: đừng quá đà. Chống **dogma** như "mọi class phải có interface", "luôn tách data class và behavior class". Đây là quy tắc **ưu tiên thấp nhất**.

## Key Concepts
- **Simple Design (4 rules, ordered)**.
- **Duplication of implementation**.
- **Reuse in the small**.
- **Template Method**.
- **Pragmatism vs dogma**.

## Mental Models
- Khi tranh luận thiết kế, xét theo thứ tự 4 quy tắc: test → duplication → expressiveness → số lượng class.
- Gộp duplication nhỏ là **kính hiển vi** để thấy trách nhiệm lạc chỗ.

## Anti-patterns
- Thiết kế đẹp trên giấy nhưng không test được.
- Copy-paste "chỉ hai chỗ thôi".
- Interface cho mọi class; tách class chỉ vì quy tắc.

## Worked Example
```java
// Duplication nhỏ → replaceImage()
public void scaleToOneDimension(float desiredDimension, float imageDimension) {
  if (Math.abs(desiredDimension - imageDimension) < errorThreshold) return;
  float scalingFactor = desiredDimension / imageDimension;
  scalingFactor = (float)(Math.floor(scalingFactor * 100) * 0.01f);
  replaceImage(ImageUtilities.getScaledImage(image, scalingFactor, scalingFactor));
}
public synchronized void rotate(int degrees) {
  replaceImage(ImageUtilities.getRotatedImage(image, degrees));
}
private void replaceImage(RenderedOp newImage) {
  image.dispose();
  System.gc();
  image = newImage;
}
```

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **Rule 1 trên Android**: CI chạy `./gradlew testDebugUnitTest` (và `lint`) cho mỗi PR. Thiết kế phải cho phép test ViewModel/UseCase không cần thiết bị.
- **Duplication thường gặp & cách gộp**:
  - Mỗi `RepositoryImpl` lặp `flow { emit(Result.Success(...)) }.catch { if (it is CancellationException) throw it; emit(Result.Error(it)) }.flowOn(IO)` (Satellite2 lặp mẫu này ở `ApiRepositoryImpl`, `CityRepositoryImpl`…). Gộp thành một helper:
```kotlin
inline fun <T> resultFlow(crossinline block: suspend () -> T): Flow<Result<T>> =
    flow<Result<T>> { emit(Result.Success(block())) }
        .catch { e -> if (e is CancellationException) throw e; emit(Result.Error(e)) }
        .flowOn(Dispatchers.IO)

override fun getAppCategory() = resultFlow { apiInterface.getAppCategory().dataResponse }
override fun getAllCities() = resultFlow { readCitiesFromAssets() }
```
  - Mỗi Fragment lặp `uiState.map { it.x }.distinctUntilChanged().collectFlowOnView(viewLifecycleOwner) {}`. Một extension `observe(selector) { }` gộp được.
  - **Cẩn thận duplication giả** (arch-ch16): hai màn search của hai actor giống nhau hôm nay không có nghĩa phải gộp.
- **Template Method có sẵn**: `BaseFragment` với `init()` + `subscribeObserver()` là Template Method (Satellite2). Giữ "lỗ hổng" ít và rõ; đừng biến base class thành nơi chứa mọi thứ.
- **Minimal classes, chống dogma**:
  - Không cần interface cho mỗi `UseCase` (một impl, test bằng fake repository là đủ).
  - Không cần `BaseUseCase<Params, Result>` nếu `operator fun invoke` đơn giản đã rõ.
  - Không bắt buộc Mapper class riêng cho mỗi model; extension `toPresentation()` (Satellite2) là đủ.
  - Nhưng **cần** interface ở **ranh giới** (repository, platform provider). Đó là chỗ có giá trị thật (arch-ch11).
- **Expressive**: tên pattern trong tên class (`CameraAccessPolicy` = Strategy, `LiveVideoRepository`, `NavigatorImpl` = Decorator), test đọc như tài liệu.

## Key Takeaways
1. Bốn quy tắc theo thứ tự: chạy hết test → không trùng lặp → biểu đạt ý định → ít class/method.
2. Test đẩy thiết kế tốt lên; refactor liên tục khi có test.
3. Gộp cả duplication nhỏ; dùng Template Method cho duplication cấu trúc.
4. Chống dogma: không tạo class/interface vô ích.

## Connects To
- **code-ch01 (Ron Jeffries / Beck's rules)**, **code-ch03 (DRY)**, **code-ch09 (Unit tests)**, **arch-ch16 (true vs accidental duplication)**.
