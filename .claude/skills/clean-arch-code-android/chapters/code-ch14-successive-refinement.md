# Clean Code — Chapter 14: Successive Refinement (Case Study: Command-Line Argument Parser `Args`)

## Core Idea
*"To write clean code, you must first write dirty code and then clean it."* Code sạch là kết quả của **tinh chỉnh dần (successive refinement)** như viết luận nhiều bản nháp, được bảo vệ bởi **test**, qua **rất nhiều bước nhỏ** mà mỗi bước đều giữ hệ thống chạy. *"Never let the rot get started."*

## Frameworks Introduced
- **Args** (sản phẩm cuối): `new Args("l,p#,d*", args)` với schema: `l` boolean, `p#` integer, `d*` string (về sau thêm `##` double, `[*]` string array). Truy vấn bằng `getBoolean`, `getInteger`, `getString`; lỗi ném `ArgsException` có `errorMessage()`.
  - Cấu trúc: interface **`ArgumentMarshaler`** + các derivative (`BooleanArgumentMarshaler`, `StringArgumentMarshaler`, `IntegerArgumentMarshaler`, `DoubleArgumentMarshaler`…); `ArgsException` chứa `ErrorCode` và message.
  - **Thêm kiểu mới** chỉ cần một marshaler mới, một hàm `getXXX`, một case trong `parseSchemaElement`, có thể thêm `ErrorCode`.
- **Args: The Rough Draft**: bản đầu chỉ boolean thì gọn, nhưng **hạt giống của mớ hỗn độn** đã có. Thêm String rồi Integer khiến code "festering pile": nhiều instance variable, chuỗi lạ như `"TILT"`, `HashSet`/`TreeSet`, `try-catch-catch`.
- **So I Stopped**: còn hai kiểu nữa phải thêm. Nếu cứ "ủi" tiếp thì sẽ để lại mớ hỗn độn quá lớn để sửa. **Lúc đó là lúc phải dừng và refactor.** Mỗi kiểu argument cần code ở **3 chỗ** (parse schema, parse giá trị, getXXX), từ đó ra khái niệm **ArgumentMarshaler**.
- **On Incrementalism**: *"One of the best ways to ruin a program is to make massive changes to its structure in the name of improvement."* Có unit test (JUnit) và acceptance test (FitNesse); **mỗi thay đổi giữ hệ thống chạy như trước**.
  - Các bước tiêu biểu: thêm skeleton `ArgumentMarshaler` vào cuối file; đổi `HashMap` boolean sang marshaler; sửa test vỡ (NPE do `falseIfNull` mất tác dụng); đưa `set`/`get` thành abstract và đẩy xuống derivative; gộp 3 map thành một `marshalers` map; inline các `isXxxArg`; chuyển `args` thành `Iterator` để `set` chỉ nhận một tham số [F1]; **xóa type-case** (*"Touché!"*); biến `ArgumentMarshaler` thành interface; thêm double bằng TDD; gom exception vào `ArgsException` (khoảng 30 bước nhỏ).
  - Bài học phụ: acceptance test (FitNesse) bắt được hành vi mà unit test bỏ sót (`getBoolean` trên arg không phải boolean trả `false`), nên thêm một unit test chạy toàn bộ FitNesse tests.
  - **Refactoring giống giải Rubik**: nhiều bước nhỏ, bước này mở đường cho bước sau; thường phải thêm rồi lại xóa.
- **Conclusion**: *"It is not enough for code to work. Code that works is often badly broken."* Lịch trình, yêu cầu, team đều sửa được; **code xấu** thì đè nặng mãi. Dọn mess **5 phút trước** là dễ nhất.

## Key Concepts
- **Successive refinement**.
- **Festering pile**.
- **Stop point**: khoảnh khắc nhận ra phải refactor trước khi thêm tính năng.
- **Incrementalism**, **tests as safety net**.
- **Type-case elimination via polymorphism**.

## Mental Models
- Nhận ra **"mỗi tính năng mới phải sửa N chỗ giống nhau"** thì có một abstraction đang chờ ra đời.
- Refactor = **chuỗi bước nhỏ, mỗi bước xanh test**, không phải "viết lại".

## Anti-patterns
- Dừng lại khi code "chạy được".
- Đại tu cấu trúc trong một bước lớn.
- Chỉ chạy một loại test (unit) và bỏ qua acceptance.

## Worked Example
Trước (rough draft, rút gọn):
```java
private boolean setArgument(char argChar) throws ArgsException {
  if (isBooleanArg(argChar)) setBooleanArg(argChar, true);
  else if (isStringArg(argChar)) setStringArg(argChar);
  else if (isIntArg(argChar)) setIntArg(argChar);
  else return false;
  return true;
}
```
Sau:
```java
private boolean setArgument(char argChar) throws ArgsException {
  ArgumentMarshaler m = marshalers.get(argChar);
  if (m == null) return false;
  try { m.set(currentArgument); return true; }
  catch (ArgsException e) { e.setErrorArgumentId(argChar); throw e; }
}
```
Type-case biến mất; thêm kiểu mới = thêm marshaler.

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **"So I stopped" trên Android**: màn search ban đầu chỉ có keyword (gọn). Thêm category filter, rồi country filter, rồi paging, rồi "see more", và ViewModel thành "festering pile" (nhiều `Job`, `Mutex`, cờ, log debug). Khi thấy feature tiếp theo (ví dụ sort) phải sửa ở 3 chỗ là lúc dừng và tách `SearchParams` + reducer + Flow `flatMapLatest` (xem code-ch13).
- **Type-case → polymorphism (kiểu Args)** cho deep link/notification payload:
```kotlin
// Rough: when(type) { "camera" -> ...; "place" -> ...; "number" -> ... } ở 3 nơi (parse, validate, navigate)
interface DeepLinkHandler { val host: String; fun parse(uri: Uri): Destination? }
class CameraDeepLinkHandler : DeepLinkHandler { override val host = "camera"; override fun parse(uri: Uri) = ... }
class DeepLinkRouter(handlers: List<DeepLinkHandler>) {
    private val byHost = handlers.associateBy { it.host }          // ≈ marshalers map
    fun route(uri: Uri): Destination? = byHost[uri.host]?.parse(uri)
}
```
- **Incrementalism với Android Studio**: dùng refactor tự động (Extract Function/Class, Move, Inline, Change Signature), chạy `testDebugUnitTest` sau **mỗi** bước; commit nhỏ. Satellite2 có quy tắc GitNexus "impact analysis before edit", nên kết hợp: kiểm tra impact rồi đi từng bước nhỏ.
- **Acceptance + unit**: unit test ViewModel/UseCase cộng một vài test UI (Espresso/Compose test) cho flow quan trọng, để bắt hành vi mà unit test không thấy.

## Key Takeaways
1. Code sạch đến từ nhiều bản nháp, không phải viết một lần.
2. Nhận ra thời điểm phải dừng thêm tính năng để refactor.
3. Refactor bằng nhiều bước nhỏ, test xanh sau mỗi bước.
4. Loại bỏ type-case bằng polymorphism (marshaler/handler map).
5. Đừng để code mục bắt đầu; dọn ngay.

## Connects To
- **code-ch03 (How do you write functions like this?)**, **code-ch09 (TDD)**, **code-ch17 (G23 Prefer polymorphism to if/else, F1 Too many arguments)**.
