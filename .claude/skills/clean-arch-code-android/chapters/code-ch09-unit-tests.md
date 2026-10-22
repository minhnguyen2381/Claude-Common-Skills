# Clean Code — Chapter 9: Unit Tests

## Core Idea
**Test code quan trọng ngang production code**, không phải công dân hạng hai. Test bẩn **tương đương hoặc tệ hơn** không có test: chúng sẽ bị vứt bỏ, rồi code mục theo. Test sạch là thứ **cho phép mọi "-ility"** (flexibility, maintainability, reusability), vì **test cho phép thay đổi**.

## Frameworks Introduced
- **The Three Laws of TDD**:
  1. *You may not write production code until you have written a failing unit test.*
  2. *You may not write more of a unit test than is sufficient to fail, and not compiling is failing.*
  3. *You may not write more production code than is sufficient to pass the currently failing test.*
  Vòng lặp khoảng 30 giây; số test có thể ngang production code, nên chúng phải được quản lý tốt.
- **Keeping Tests Clean**: câu chuyện team cho phép test "quick and dirty". Chi phí bảo trì test tăng, bị đổ lỗi cho estimate, test bị **vứt bỏ**, defect tăng, sợ thay đổi, ngừng dọn code, code mục. *"Test code is just as important as production code."*
- **Tests Enable the -ilities**: có test thì không sợ đổi code, kể cả code kiến trúc tệ; có thể cải thiện kiến trúc an toàn. *"If you let the tests rot, then your code will rot too."*
- **Clean Tests**: *"Readability, readability, and readability."* Rõ ràng, đơn giản, mật độ biểu đạt cao.
  - **BUILD-OPERATE-CHECK**: mỗi test chia 3 phần: dựng data, thao tác, kiểm tra (Listing 9-1 dài, rối với `PathParser`, cast, `assertSubString` lặp, refactor thành Listing 9-2 với `makePages`, `submitRequest`, `assertResponseIsXML`, `assertResponseContains`).
  - **Domain-Specific Testing Language**: bộ hàm tiện ích chuyên cho test, **tiến hóa** qua refactor chứ không thiết kế trước.
- **A Dual Standard**: code test không cần **hiệu năng** như production (ví dụ `getState()` ghép String `"HBchL"`, chấp nhận dù chưa tối ưu), nhưng **không bao giờ** được kém sạch. Ví dụ `EnvironmentControllerTest`: `wayTooCold(); assertEquals("HBchL", hw.getState());` (hoa = bật, thường = tắt; thứ tự heater, blower, cooler, hi-temp-alarm, lo-temp-alarm). Gần vi phạm "mental mapping" nhưng dễ đọc trong ngữ cảnh.
- **One Assert per Test**: guideline tốt (given-when-then: `givenPages`, `whenRequestIsIssued`, `thenResponseShouldBeXML`), nhưng tách quá mức gây duplication. Tối thiểu hóa số assert.
- **Single Concept per Test**: quy tắc tốt hơn. `testAddMonths` gộp 3 khái niệm nên tách ra; khi tách lộ ra **quy tắc ẩn** ("ngày không vượt quá ngày cuối tháng"), từ đó thấy **test còn thiếu** (28/2 + 1 tháng = 28/3).
- **F.I.R.S.T.**:
  - **Fast**: chạy nhanh để chạy thường xuyên.
  - **Independent**: không phụ thuộc nhau, chạy theo thứ tự bất kỳ.
  - **Repeatable**: chạy được ở mọi môi trường (kể cả trên tàu không mạng).
  - **Self-Validating**: kết quả boolean, không đọc log.
  - **Timely**: viết **ngay trước** production code; viết sau thì code thường khó test.

## Key Concepts
- **Three Laws of TDD**.
- **BUILD-OPERATE-CHECK / Given-When-Then**.
- **Testing DSL**.
- **Dual standard** (hiệu năng vs độ sạch).
- **Single concept per test**.
- **F.I.R.S.T.**

## Mental Models
- Test là **tài liệu sống** cho hành vi; người đọc phải hiểu trong vài giây.
- Thấy test dài nhiều "section" thì đang test nhiều khái niệm.

## Anti-patterns
- Test "quick and dirty".
- Test đầy chi tiết hạ tầng (parse, cast, build request).
- Test phụ thuộc thứ tự, mạng, thời gian thật.
- Test phải đọc log để biết pass/fail.
- Viết test sau, hoặc không viết.

## Worked Example
```java
// Listing 9-2 — BUILD / OPERATE / CHECK với testing DSL
public void testSymbolicLinksAreNotInXmlPageHierarchy() throws Exception {
  WikiPage page = makePage("PageOne");
  makePages("PageOne.ChildOne", "PageTwo");
  addLinkTo(page, "PageTwo", "SymPage");
  submitRequest("root", "type:pages");
  assertResponseIsXML();
  assertResponseContains("<name>PageOne</name>", "<name>PageTwo</name>", "<name>ChildOne</name>");
  assertResponseDoesNotContain("SymPage");
}
```

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **F.I.R.S.T. trên Android**:
  - *Fast/Repeatable*: test JVM (`src/test`) cho UseCase/ViewModel/mapper; không cần emulator, không mạng thật. Dùng `kotlinx-coroutines-test` (`runTest`, `StandardTestDispatcher`) và inject dispatcher. Satellite2 đã có `mockito-kotlin` và `kotlinx-coroutines-test` trong `libs.versions.toml`.
  - *Independent*: không dùng `object` singleton giữ state giữa test; reset Koin (`stopKoin()`) nếu test có dùng Koin.
  - *Self-validating*: assert trên `uiState.value`, không đọc Logcat.
  - *Timely*: viết test UseCase trước khi viết ViewModel gọi nó.
- **Testing DSL cho ViewModel** (Given-When-Then):
```kotlin
class NumberLocatorViewModelTest {
    @get:Rule val mainRule = MainDispatcherRule()
    private val repo = FakeNumberLocatorRepository()
    private lateinit var vm: NumberLocatorViewModel

    @Test fun `invalid number shows validation error`() = runTest {
        givenViewModel()
        whenUserSearches("12ab")
        thenStateShows(error = R.string.invalid_phone_number)
    }

    @Test fun `free user over quota sees paywall`() = runTest {
        givenViewModel(isPremium = false, usedToday = 3)
        whenUserSearches("+84912345678")
        thenEventIs(NumberLocatorEvent.ShowPaywall)
    }

    // DSL — chi tiết hạ tầng giấu ở đây
    private fun givenViewModel(isPremium: Boolean = false, usedToday: Int = 0) { /* fake setup */ }
    private fun TestScope.whenUserSearches(raw: String) { vm.onSearch(raw); advanceUntilIdle() }
    private fun thenStateShows(@StringRes error: Int) = assertEquals(error, vm.uiState.value.errorRes)
    private suspend fun thenEventIs(expected: NumberLocatorEvent) = assertEquals(expected, vm.uiEvent.first())
}
```
- **Fake > Mock** cho repository: `FakeLiveVideoRepository` tuân thủ contract `Flow<Result<T>>` (xem arch-ch09 LSP). Mock (mockito) phù hợp cho kiểm tra tương tác (verify `analytics.log` được gọi).
- **Single concept**: `PagingTest` tách "load trang đầu", "load more nối thêm", "hết trang thì hasMore=false", "lỗi trang 2 giữ data trang 1".
- **Dual standard**: trong test được phép build list lớn bằng `List(100) { fakeVideo(it) }`, nhưng tên hàm và cấu trúc vẫn phải sạch.

## Key Takeaways
1. Test code là công dân hạng nhất; giữ sạch như production.
2. Ba luật TDD tạo vòng lặp ngắn.
3. Test dễ đọc: Build-Operate-Check, testing DSL.
4. Một khái niệm mỗi test; tối thiểu hóa assert.
5. F.I.R.S.T.

## Connects To
- **arch-ch28 (The Test Boundary)**, **code-ch17 (T1–T9 Tests heuristics)**, **code-ch12 (Runs all the tests)**.
