# Clean Code — Chapter 3: Functions

## Core Idea
Function là **tầng tổ chức đầu tiên** của mọi chương trình. Function phải **nhỏ**, **làm một việc**, ở **một mức trừu tượng**, có **tên mô tả**, **ít tham số**, **không side effect**, tách **command/query**, và dùng **exception thay error code**. Function là **động từ** của ngôn ngữ domain mà bạn thiết kế; mục tiêu thật là **kể câu chuyện của hệ thống**.

## Frameworks Introduced
- **Small!**: *"The first rule of functions is that they should be small. The second rule of functions is that they should be smaller than that."* Hiếm khi tới 20 dòng; Sparkle của Kent Beck có mỗi hàm 2–4 dòng.
  - **Blocks and Indenting**: khối trong `if/else/while` nên dài **một dòng**, thường là một lời gọi hàm có tên mô tả. Indent tối đa 1–2 cấp.
- **Do One Thing**: *"FUNCTIONS SHOULD DO ONE THING. THEY SHOULD DO IT WELL. THEY SHOULD DO IT ONLY."*
  - Test "**TO paragraph**": mô tả hàm bằng "TO X, we do A, B, C"; nếu A, B, C đều ở **một mức dưới tên hàm** thì hàm làm một việc.
  - Test "**extract**": nếu trích được một hàm con với tên **không chỉ là lặp lại implementation** thì hàm đang làm nhiều việc [G34].
  - **Sections within functions** (declarations / initializations / sieve) là triệu chứng làm nhiều việc.
- **One Level of Abstraction per Function**: không trộn `getHtml()` (cao) với `PathParser.render(path)` (giữa) và `.append("\n")` (thấp).
- **The Stepdown Rule**: code đọc từ trên xuống như truyện; mỗi hàm theo sau là các hàm ở mức trừu tượng thấp hơn kế tiếp.
- **Switch Statements**: switch luôn làm N việc. Quy tắc: chấp nhận nếu **chỉ xuất hiện một lần**, dùng để **tạo object đa hình**, ẩn sau quan hệ kế thừa. Ví dụ `calculatePay(Employee)` switch theo type vi phạm SRP + OCP và sẽ bị nhân bản (`isPayday`, `deliverPay`), nên chôn switch trong **Abstract Factory** (`EmployeeFactoryImpl.makeEmployee`).
- **Use Descriptive Names**: tên dài mô tả tốt hơn tên ngắn bí ẩn và tốt hơn comment dài. Nhất quán cụm từ (`includeSetupAndTeardownPages`, `includeSetupPages`, `includeSuiteSetupPage`).
- **Function Arguments**: lý tưởng là 0 (niladic), rồi 1 (monadic), 2 (dyadic); **tránh 3** (triadic); >3 (polyadic) cần lý do rất đặc biệt.
  - **Common monadic forms**: *question* (`fileExists("x")`), *transformation* (`fileOpen("x")` trả về `InputStream`), *event* (`passwordAttemptFailedNtimes(n)`).
  - **Flag Arguments**: *"Passing a boolean into a function is a truly terrible practice."* `render(true)` → `renderForSuite()` / `renderForSingleTest()`.
  - **Dyadic**: `Point(0,0)` ổn (hai thành phần có thứ tự tự nhiên); `assertEquals(expected, actual)` dễ nhầm thứ tự. Chuyển thành monad: method của object (`outputStream.writeField(name)`), field, hoặc class mới (`FieldWriter`).
  - **Argument Objects**: `makeCircle(x, y, radius)` → `makeCircle(center: Point, radius)`.
  - **Argument Lists** (varargs) tính như một tham số List.
  - **Verbs and Keywords**: `writeField(name)`; keyword form `assertExpectedEqualsActual(expected, actual)`.
- **Have No Side Effects**: *"Side effects are lies."* Ví dụ `checkPassword()` gọi `Session.initialize()` là **temporal coupling** ẩn. Nếu bắt buộc thì đặt vào tên (`checkPasswordAndInitializeSession`).
- **Output Arguments**: tránh `appendFooter(s)`; dùng `report.appendFooter()`.
- **Command Query Separation**: hàm hoặc **làm** gì đó, hoặc **trả lời** gì đó, không cả hai. `if (set("username","unclebob"))` mơ hồ → `if (attributeExists(...)) setAttribute(...)`.
- **Prefer Exceptions to Returning Error Codes**: error code dẫn tới `if` lồng sâu và vi phạm CQS. **Extract Try/Catch Blocks**: `delete()` chỉ lo xử lý lỗi; `deletePageAndAllReferences()` lo việc chính. **Error Handling Is One Thing**: `try` là từ đầu tiên, không có gì sau `catch/finally`.
- **The Error.java Dependency Magnet**: enum mã lỗi chung bị mọi class import, nên không ai dám thêm mã mới. Exception mới là class con nên không bắt recompile (OCP).
- **Don't Repeat Yourself**: *"Duplication may be the root of all evil in software."* (Normal forms của Codd, OOP, AOP đều nhằm loại bỏ duplication.)
- **Structured Programming**: single-entry/single-exit có ích cho hàm lớn; với hàm nhỏ, `return`, `break`, `continue` sớm là ổn; **tránh `goto`**.
- **How Do You Write Functions Like This?**: viết bản nháp vụng về **có test bao phủ**, rồi refactor (tách hàm, đổi tên, xóa trùng) mà test vẫn xanh. Không ai viết đẹp ngay từ đầu.

## Key Concepts
- **Stepdown Rule**, **TO paragraph**.
- **Niladic / monadic / dyadic / triadic / polyadic**.
- **Flag argument**, **output argument**, **argument object**.
- **Temporal coupling**.
- **CQS**.
- **Dependency magnet**.

## Mental Models
- Hàm là **câu**, class là **đoạn văn**, module là **chương**: đọc phải trôi.
- Thấy `Boolean` trong tham số thì có hai hàm đang trốn bên trong.
- Thấy comment `// step 2:` trong hàm thì đó là chỗ cần tách.

## Anti-patterns
- Hàm dài, nhiều cấp indent, nhiều section.
- Trộn mức trừu tượng.
- `switch` theo type lặp ở nhiều nơi.
- Flag/output argument; >3 tham số.
- Side effect ẩn; vừa command vừa query.
- Mã lỗi trả về + enum lỗi toàn cục.

## Code Examples
```java
// Listing 3-3 — làm một việc, một mức trừu tượng
public static String renderPageWithSetupsAndTeardowns(PageData pageData, boolean isSuite) throws Exception {
  if (isTestPage(pageData))
    includeSetupAndTeardownPages(pageData, isSuite);
  return pageData.getHtml();
}
```
- **What it demonstrates**: ba bước đều ở một mức dưới tên hàm, nên đây là "one thing".

## Worked Example
Refactor `testableHtml` (Listing 3-1, dài, lặp thuật toán 4 lần cho SetUp/SuiteSetUp/TearDown/SuiteTearDown) thành `SetupTeardownIncluder` (Listing 3-7):
`render()` → `isTestPage()` → `includeSetupAndTeardownPages()` → { `includeSetupPages()` → `includeSuiteSetupPage()`/`includeSetupPage()`, `includePageContent()`, `includeTeardownPages()`, `updatePageContent()` } → `include(pageName, arg)` → `findInheritedPage()`, `getPathNameForPage()`, `buildIncludeDirective()`. Mỗi hàm 1–5 dòng; bốn bản trùng lặp gộp vào một `include()`.

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **Stepdown trong ViewModel/Fragment**:
```kotlin
// Fragment (Satellite2 pattern init + FragmentEx) — đọc như mục lục
override fun init(view: View, savedInstanceState: Bundle?) {
    initView()
    settingEvent()
}
// ViewModel — mỗi public fun là một "câu" nghiệp vụ, chi tiết ở private fun bên dưới
fun onSearchSubmitted(keyword: String) = launchIO {
    showLoading()
    val result = searchLiveCameras(requestFor(keyword))
    render(result)
}
private fun requestFor(keyword: String) = SearchCamerasRequest(keyword.trim(), page = 0, pageSize = PAGE_SIZE)
private fun render(result: Result<SearchCamerasResponse>) = when (result) {
    is Result.Success -> setState { copy(results = UiState.Success(result.data.items.map { it.toPresentation() })) }
    is Result.Error   -> setState { copy(results = UiState.Error(result.error)) }
}
```
- **Flag argument**: `navigator.navigateTo(R.id.action_x, clearBackStack = true)` có named argument nên dễ đọc hơn `render(true)`, nhưng vẫn là flag. Với hành vi khác hẳn nhau, tách `navigateTo()` / `navigateAndClearBackStack()`. Tương tự `showHideLoading(Boolean)` có thể thành `showLoading()` / `hideLoading()`.
- **Argument object**: use case 5 tham số (`pageIndex, pageSize, keyword, categoryUiModel, countryUiModel`) thành `SearchCamerasRequest` (xem arch-ch20).
- **Switch theo type**: `when (camera.type) { YOUTUBE -> …; HLS -> …; MJPEG -> … }` lặp ở Adapter, Player và Analytics. Gom vào **sealed class** / Strategy với factory **một chỗ** (`PlayerFactory.create(type)`). Kotlin `when` trên sealed class là exhaustive, nhưng quy tắc "chỉ một nơi" vẫn áp dụng.
- **CQS với state**: `setState {}` (command) và `getCurrentState()` (query) đã tách; tránh hàm kiểu `fun loadIfNeeded(): Boolean` vừa load vừa trả cờ.
- **Side effect ẩn**: `isPremium()` mà bên trong còn ghi analytics hoặc refresh DataStore là temporal coupling.
- **Exceptions vs `Result` trong Kotlin**: sách ủng hộ exception. Satellite2 dùng `sealed class Result` cho Flow repository, một dạng "error value". Cách hòa giải: giữ `Result` **sealed** (không phải enum mã lỗi), xử lý bằng `when`/`onSuccess`/`onError` để tránh `if` lồng, **không** tạo enum `ErrorCode` dùng chung toàn app (dependency magnet); phân loại lỗi bằng exception type (`NoNetworkException`, `QuotaExceededException`). Trong hàm suspend nội bộ, cứ throw và để một nơi (`launchIO` handler / repository `catch`) xử lý. **Luôn rethrow `CancellationException`**.
- **Extract try/catch**: trong coroutine, `try` ở đầu hàm, thân việc chính ở hàm riêng:
```kotlin
suspend fun refresh() = try { refreshCatalogAndCameras() } catch (e: IOException) { reportOffline(e) }
```

## Key Takeaways
1. Nhỏ, rồi nhỏ hơn nữa; indent ≤ 2.
2. Một việc, một mức trừu tượng; Stepdown Rule.
3. ≤ 2 tham số; không flag, không output argument; gom thành argument object.
4. Không side effect ẩn; tách command/query.
5. Exception (hoặc sealed result) thay error code; tách try/catch.
6. DRY; switch theo type chỉ một lần trong factory.
7. Viết nháp có test, rồi refactor.

## Connects To
- **code-ch02 (Names)**, **code-ch07 (Error Handling)**, **code-ch17 (F1–F4, G5, G23, G30, G34)**, **arch-ch04 (functional decomposition)**.
