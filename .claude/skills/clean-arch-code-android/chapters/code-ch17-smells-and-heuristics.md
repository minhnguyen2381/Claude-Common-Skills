# Clean Code — Chapter 17: Smells and Heuristics

## Core Idea
Danh mục **66 smell/heuristic** (nhiều cái lấy từ *Refactoring* của Fowler), được tác giả ghi lại khi tự hỏi "vì sao mình sửa chỗ này?" lúc refactor. Dùng nó như **checklist review**. Nhưng *"Clean code is not written by following a set of rules… Professionalism and craftsmanship come from values that drive disciplines."*

## Catalog (mã gốc | ý chính | cách áp dụng cho Kotlin/Android)

### Comments
| Mã | Heuristic | Kotlin/Android |
|---|---|---|
| C1 | **Inappropriate Information**: changelog, author, ticket trong comment | Dùng git/Jira; xóa header changelog |
| C2 | **Obsolete Comment** | Sửa hoặc xóa ngay |
| C3 | **Redundant Comment** (`i++; // increment i`, javadoc lặp signature) | Xóa KDoc `@param x the x` |
| C4 | **Poorly Written Comment** | Viết ngắn, đúng ngữ pháp |
| C5 | **Commented-Out Code**: *"an abomination"* | Xóa; git nhớ hộ |

### Environment
| Mã | Heuristic | Kotlin/Android |
|---|---|---|
| E1 | **Build Requires More Than One Step** | `./gradlew assembleDebug`; `local.properties` thiếu key thì fail rõ ràng (Satellite2 `require()` ✅) |
| E2 | **Tests Require More Than One Step** | `./gradlew test` một lệnh, CI chạy mỗi PR |

### Functions
| Mã | Heuristic | Kotlin/Android |
|---|---|---|
| F1 | **Too Many Arguments** (>3) | Gom thành Request/params `data class` |
| F2 | **Output Arguments** | Trả giá trị mới; không sửa `MutableList` truyền vào |
| F3 | **Flag Arguments** | Tách hàm; named arg chỉ là giảm nhẹ |
| F4 | **Dead Function** | Android Studio *Inspect Code → Unused declaration*; detekt `UnusedPrivateMember` |

### General
| Mã | Heuristic | Kotlin/Android |
|---|---|---|
| G1 | **Multiple Languages in One Source File** | Hạn chế SQL/JSON/HTML lớn trong `.kt`; Room `@Query` ngắn; JSON test để trong `resources/` |
| G2 | **Obvious Behavior Is Unimplemented** (Least Surprise) | `parseDay("monday")` phải không phân biệt hoa thường, nhận viết tắt |
| G3 | **Incorrect Behavior at the Boundaries** | Test list rỗng, trang cuối, 0/1/max, timezone, 29/2 |
| G4 | **Overridden Safeties** (Chernobyl) | Đừng `@Suppress` bừa, đừng `@Ignore` test, đừng `!!` để "cho chạy" |
| G5 | **Duplication** (DRY, "Once and only once") | Copy-paste → hàm; `when` lặp → polymorphism; thuật toán giống nhau → Template Method/Strategy |
| G6 | **Code at Wrong Level of Abstraction** (`Stack.percentFull()` → `BoundedStack`) | Interface domain không chứa khái niệm Room/Retrofit; base class không chứa chi tiết của 1 subclass |
| G7 | **Base Classes Depending on Their Derivatives** | `BaseFragment` không `is HomeFragment` |
| G8 | **Too Much Information** (interface rộng) | Ẩn data, hằng, helper; `private`/`internal`; ít method public |
| G9 | **Dead Code** | Xóa nhánh không thể xảy ra, `catch` không bao giờ throw |
| G10 | **Vertical Separation** | Biến khai báo sát chỗ dùng; private fun ngay dưới chỗ gọi |
| G11 | **Inconsistency** | Cùng quy ước tên (`get…`/`observe…`, `XxxUiState`), cùng pattern repository |
| G12 | **Clutter** | Constructor rỗng, biến không dùng, comment vô ích |
| G13 | **Artificial Coupling** | Enum chung không lồng trong class cụ thể; util chung không nằm trong Fragment |
| G14 | **Feature Envy** | Hàm dùng nhiều getter của class khác thì chuyển vào class đó (trừ khi vi phạm SRP, ví dụ format report) |
| G15 | **Selector Arguments** (`calculateWeeklyPay(false)`) | Nhiều hàm thay cho một hàm + selector (boolean/enum/int) |
| G16 | **Obscured Intent** (`iThsWkd - 400`) | Tên rõ, không magic number, không Hungarian |
| G17 | **Misplaced Responsibility** (`PI`, `OVERTIME_RATE` ở đâu?) | Đặt code nơi người đọc **mong đợi**; tên hàm phản ánh chỗ tính toán (`computeRunningTotalOfHours`) |
| G18 | **Inappropriate Static** | Kotlin: top-level fun/`object` chỉ cho hàm thuần không cần đa hình; thứ có thể đa hình thì làm instance/interface |
| G19 | **Use Explanatory Variables** | `val (key, value) = match.destructured` |
| G20 | **Function Names Should Say What They Do** (`date.add(5)`) | `plusDays(5)` (immutable), `increaseByDays` (mutable) |
| G21 | **Understand the Algorithm** | Đừng "nhét `if` cho tới khi test pass"; refactor tới khi hiển nhiên |
| G22 | **Make Logical Dependencies Physical** (`PAGE_SIZE` ở `HourlyReporter`) | Hỏi bên sở hữu (`formatter.maxPageSize`), đừng giả định |
| G23 | **Prefer Polymorphism to If/Else or Switch/Case**, quy tắc **"ONE SWITCH"** | Mỗi loại lựa chọn chỉ một `when`, dùng để tạo object đa hình |
| G24 | **Follow Standard Conventions** | Kotlin coding conventions + ktlint/detekt; quy ước team (Satellite2 CLAUDE.md) |
| G25 | **Replace Magic Numbers with Named Constants** (cả magic string `"John Doe"`) | `const val`, `@dimen`, `@string`; ngoại lệ: công thức hiển nhiên (`* 2`) |
| G26 | **Be Precise** (float cho tiền là "almost criminal") | Tiền dùng `Long` (đơn vị nhỏ nhất)/`BigDecimal`; khai báo `List` không phải `ArrayList`; xử lý `null`, nhiều bản ghi, concurrent update |
| G27 | **Structure over Convention** | sealed/abstract buộc implement, tốt hơn quy ước đặt tên + `when` |
| G28 | **Encapsulate Conditionals** | `if (shouldBeDeleted(timer))` thay biểu thức dài |
| G29 | **Avoid Negative Conditionals** | `if (buffer.shouldCompact())` thay `if (!buffer.shouldNotCompact())` |
| G30 | **Functions Should Do One Thing** | `payIfNecessary()` → `isPayday()` + `calculateAndDeliverPay()` |
| G31 | **Hidden Temporal Couplings** | "Bucket brigade": `val g = saturateGradient(); val s = reticulateSplines(g); diveForMoog(s)` |
| G32 | **Don't Be Arbitrary** | Cấu trúc phải có lý do và nhất quán; class public không lồng tùy tiện |
| G33 | **Encapsulate Boundary Conditions** (`level + 1` → `nextLevel`) | Chuyển page 0/1-based ở một chỗ |
| G34 | **Functions Should Descend Only One Level of Abstraction** (`HruleWidget` → `HtmlTag`) | ViewModel không build chuỗi URL/HTML thủ công |
| G35 | **Keep Configurable Data at High Levels** | Default/config ở Main/`BuildConfig`/Remote Config provider, truyền xuống |
| G36 | **Avoid Transitive Navigation** (Law of Demeter, "shy code") | Không `a.b.c.doSomething()`; collaborator trực tiếp cung cấp dịch vụ |

### Java (→ Kotlin)
| Mã | Heuristic | Kotlin/Android |
|---|---|---|
| J1 | **Avoid Long Import Lists by Using Wildcards** | ⚠ **Xung đột với quy ước Kotlin hiện đại**: ktlint mặc định *cấm* wildcard import. Theo **G24**, quy ước team thắng; đừng tranh cãi trong review |
| J2 | **Don't Inherit Constants** | Kotlin: `const val` trong `companion`/top-level, import trực tiếp |
| J3 | **Constants versus Enums** | `enum class`/`sealed` có field và method (`HourlyPayGrade.rate()`) |

### Names
| Mã | Heuristic | Kotlin/Android |
|---|---|---|
| N1 | **Choose Descriptive Names** (Bowling: `score += 10 + nextTwoBallsForStrike(frame)`) | Tên chiếm 90% khả năng đọc |
| N2 | **Choose Names at the Appropriate Level of Abstraction** (`Modem.dial(phoneNumber)` → `connect(connectionLocator)`) | Domain không nói `retrofitCall`, `roomRow` |
| N3 | **Use Standard Nomenclature Where Possible** (`AutoHangupModemDecorator`, ubiquitous language) | `…Repository`, `…UseCase`, `…Adapter`, `…Factory` đúng nghĩa pattern |
| N4 | **Unambiguous Names** (`doRename` vs `renamePage` → `renamePageAndOptionallyAllReferences`) | |
| N5 | **Use Long Names for Long Scopes** | `i` trong lambda 3 dòng OK; field/property thì đầy đủ |
| N6 | **Avoid Encodings** (`m_`, `f`, `vis_`) | Không `mViewModel`, `IRepository` |
| N7 | **Names Should Describe Side-Effects** (`getOos` → `createOrReturnOos`) | `getOrCreate…`, `loadAndCache…` |

### Tests
| Mã | Heuristic | Kotlin/Android |
|---|---|---|
| T1 | **Insufficient Tests**: test mọi thứ có thể hỏng | |
| T2 | **Use a Coverage Tool!** | Kover/JaCoCo trong Gradle |
| T3 | **Don't Skip Trivial Tests** | Giá trị tài liệu > chi phí |
| T4 | **An Ignored Test Is a Question about an Ambiguity** | `@Ignore("Chờ PM xác nhận: free user có được xem lịch sử?")` |
| T5 | **Test Boundary Conditions** | |
| T6 | **Exhaustively Test Near Bugs**: bug hay đi thành bầy | |
| T7 | **Patterns of Failure Are Revealing** | |
| T8 | **Test Coverage Patterns Can Be Revealing** | |
| T9 | **Tests Should Be Fast** | JVM test, không emulator cho logic |

## Mental Models
- Review theo **nhóm**: tên (N), hàm (F), comment (C), cấu trúc (G), test (T).
- Smell là **tín hiệu để xem xét**, không phải luật tuyệt đối. Giá trị đứng sau quan trọng hơn.

## Anti-patterns
- Dùng danh sách như checklist máy móc mà không hiểu giá trị.
- Bật/tắt safety (lint, warnings, test) để "cho qua".

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **Tự động hóa một phần catalog**: **detekt** (complexity: `LongMethod`, `LongParameterList` ≈ F1, `ComplexCondition` ≈ G28, `MagicNumber` ≈ G25, `UnusedPrivateMember` ≈ F4/G9, `ForbiddenComment` ≈ C5/T4) + **ktlint** (G24, N6) + **Android Lint** (`HardcodedText`, `UnusedResources`) + **Konsist** (G6/G13: kiến trúc package).
- **Smell hay gặp trong code Android (theo kinh nghiệm review)**: G5 lặp `collectFlowOnView` boilerplate; G14 Fragment đào sâu `uiState.value.a.b.c`; G15 `showHideLoading(Boolean)`; G25 `delay(5000)`, `"testAPI"`; G26 `Float` cho giá IAP; G31 `initView()` phải trước `settingEvent()`; G36 `binding.include.layout.textView`; N7 `getLocation()` mà có hỏi quyền.

## Key Takeaways
1. Thuộc lòng các mã quan trọng: **F1–F3, G5, G6, G14, G23, G25, G28–G31, G34, G36, N1, N7, T5, T9**.
2. Dùng catalog khi review; trích mã (ví dụ "[G23]") để comment ngắn gọn.
3. Tự động hóa những gì có thể (detekt/ktlint/lint), dành sức người cho những gì cần phán đoán.
4. Rule là biểu hiện của giá trị; craftsmanship đến từ giá trị.

## Connects To
- **Mọi chương code-ch01…ch16** (mã heuristic được trích dẫn khắp nơi); **code-ch16 (SerialDate)** là nơi phần lớn mã được sinh ra.
