# Clean Architecture — Chapter 28: The Test Boundary

## Core Idea
**Test là một phần của hệ thống** và tham gia kiến trúc như mọi component khác: nó là **vòng tròn ngoài cùng**, luôn phụ thuộc vào trong. Test không được thiết kế cẩn thận sẽ **mong manh (fragile)** và làm hệ thống **cứng nhắc (rigid)**. Giải pháp: **Design for testability** + **Testing API**, tránh **structural coupling**.

## Frameworks Introduced
- **Tests as System Components**: về mặt kiến trúc, mọi loại test (TDD, FitNesse, Cucumber, BDD…) là **tương đương**. Test tuân Dependency Rule, rất cụ thể, luôn phụ thuộc vào trong; deploy độc lập (thường ở hệ thống test). Test là component **cô lập nhất**, không cần cho vận hành, nhưng là **hình mẫu** cho các component khác.
- **Design for Testability**:
  - **Fragile Tests Problem**: test gắn chặt hệ thống thì một thay đổi nhỏ làm vỡ hàng trăm, hàng nghìn test. Ví dụ: test business rule qua GUI (login, rồi điều hướng tới trang cần kiểm), đổi login page hay navigation thì vỡ hàng loạt.
  - Fragile tests làm **hệ thống cứng nhắc**: dev ngại đổi vì sợ 1000 test vỡ.
  - **Luật đầu tiên của thiết kế**: *"Don't depend on volatile things."* GUI volatile nên test business rule **không qua GUI**.
- **The Testing API**: API riêng cho test kiểm mọi business rule, có **"superpowers"**: vượt ràng buộc bảo mật, bỏ qua tài nguyên đắt (DB), ép hệ thống vào trạng thái cụ thể. Là **superset** của interactors + interface adapters mà UI dùng. Mục đích: tách **cấu trúc test** khỏi **cấu trúc app**.
- **Structural Coupling**: mỗi class production có một class test, mỗi method có một test method, nên test gắn chặt cấu trúc và refactor production làm vỡ test. Theo thời gian, **test càng cụ thể** còn **production càng trừu tượng/tổng quát**; structural coupling cản trở sự tiến hóa ngược chiều này.
- **Security**: superpowers nguy hiểm nếu lên production, nên đặt testing API và phần nguy hiểm vào **component riêng, deploy độc lập**.

## Key Concepts
- **Outermost circle**: test.
- **Fragile Tests Problem**.
- **Testing API** với superpowers.
- **Structural coupling**: test phản chiếu cấu trúc class/method.
- **Design for testability**.

## Mental Models
- Test nên gọi vào **use case/hành vi**, không vào **cấu trúc** (class nội bộ, method private).
- Nếu refactor (không đổi hành vi) mà test vỡ, đó là structural coupling.

## Anti-patterns
- **Test business rule qua UI** (Espresso click 10 màn để kiểm một phép tính).
- **1 test class / 1 production class, 1 test / 1 method** một cách máy móc.
- **Test bị coi là "ngoài hệ thống"**, không được thiết kế.

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **Kim tự tháp test theo vòng tròn**:
| Loại | Chạy ở | Kiểm gì | Tỉ lệ |
|---|---|---|---|
| JVM unit (`src/test`) | `./gradlew testDebugUnitTest` | UseCase, Entity, ViewModel (state), mapper | Đa số |
| Instrumented data (`src/androidTest`) | Device/emulator | Room DAO (in-memory), Retrofit + MockWebServer | Ít |
| UI (Espresso) | Device | Vài happy path, navigation | Rất ít |
- **Testing API trên Android**: test gọi **ViewModel/UseCase public API** với fake repository (superpower: không mạng, ép trạng thái), không gọi Fragment.
```kotlin
class LiveCameraSearchViewModelTest {
    @get:Rule val main = MainDispatcherRule()               // thay Dispatchers.Main
    private val repo = FakeLiveVideoRepository()            // superpower: ép dữ liệu/lỗi

    @Test fun `search shows results then hasMore=false on last page`() = runTest {
        repo.givenSearchResult("tokyo", items = 3, hasMore = false)
        val vm = LiveCameraSearchViewModel(SearchLiveCamerasUseCase(repo))
        vm.onSearch("tokyo"); advanceUntilIdle()
        val state = vm.uiState.value
        assertTrue(state.results is UiState.Success)
        assertFalse(state.hasMore)
    }
}
```
- **Rào cản test ở Satellite2**: `launchIO` cứng `Dispatchers.IO` trong `BaseViewModel` nên test khó điều khiển thời gian. Hãy inject `CoroutineDispatcher` (hoặc một `DispatcherProvider`) để test thay bằng `StandardTestDispatcher`. Đó là design for testability.
- **Structural coupling**: không cần test riêng cho từng hàm private trong `FragmentEx`; test hành vi qua ViewModel state.
- **Superpowers không lên production**: `FakeLiveVideoRepository`, `TestKoinModule` để trong `src/test` / `src/debug`, không ở `src/main`.

## Key Takeaways
1. Test là vòng ngoài cùng của kiến trúc và phải được thiết kế.
2. Đừng test business rule qua GUI volatile.
3. Tạo testing API (gọi use case/presenter với fake) để tách cấu trúc test khỏi cấu trúc app.
4. Tránh structural coupling; test hành vi, không test cấu trúc.
5. Cô lập superpowers khỏi production.

## Connects To
- **arch-ch23 (Humble Object)**, **arch-ch21 (Testable architecture)**, **code-ch09 (Unit Tests, F.I.R.S.T.)**.
