# Clean Code — Chapter 2: Meaningful Names (Tim Ottinger)

## Core Idea
Tên phải **trả lời mọi câu hỏi lớn**: vì sao tồn tại, làm gì, dùng thế nào. *"If a name requires a comment, then the name does not reveal its intent."* Đặt tên tốt tốn thời gian nhưng tiết kiệm nhiều hơn; **đổi tên ngay** khi tìm được tên tốt hơn.

## Frameworks Introduced (các quy tắc đặt tên)
1. **Use Intention-Revealing Names**: `int d; // elapsed time in days` → `elapsedTimeInDays`, `daysSinceCreation`. Vấn đề không phải *simplicity* mà là **implicity** (ngữ cảnh không hiện trong code).
2. **Avoid Disinformation**: không dùng `hp`, `aix`, `sco`; không gọi `accountList` nếu không phải `List`; tránh tên khác nhau rất ít (`XYZControllerForEfficientHandlingOfStrings` vs `...StorageOfStrings`); không dùng `l` và `O`.
3. **Make Meaningful Distinctions**: không dùng dãy số (`a1, a2`) hay **noise words** (`Info`, `Data`, `Object`, `the`, `variable`, `String`). `ProductInfo` vs `Product`? `getActiveAccount()` / `getActiveAccounts()` / `getActiveAccountInfo()` thì gọi cái nào? `klass` là "hideous".
4. **Use Pronounceable Names**: `genymdhms` → `generationTimestamp`. Lập trình là hoạt động xã hội.
5. **Use Searchable Names**: hằng số có tên (`WORK_DAYS_PER_WEEK`) thay vì `5`. **Độ dài tên tương ứng với kích thước scope** [N5]; tên một chữ cái chỉ dùng cho biến local trong hàm ngắn.
6. **Avoid Encodings**: không dùng Hungarian notation (`phoneString` khi type đã đổi thành `PhoneNumber`), không dùng tiền tố `m_`. **Interface để trơn**: `ShapeFactory` (interface) + `ShapeFactoryImp` (impl); tránh `IShapeFactory`.
7. **Avoid Mental Mapping**: `i, j, k` cho vòng lặp nhỏ thì OK; `r` = "url viết thường đã bỏ host" thì không. *"Clarity is king."*
8. **Class Names**: danh từ (`Customer`, `WikiPage`, `AddressParser`); tránh `Manager`, `Processor`, `Data`, `Info`; không dùng động từ.
9. **Method Names**: động từ (`postPayment`, `deletePage`); `get/set/is`. Constructor overload thì dùng **static factory** có tên (`Complex.FromRealNumber(23.0)`).
10. **Don't Be Cute**: `HolyHandGrenade` → `deleteItems`; `whack()` → `kill()`. *"Say what you mean. Mean what you say."*
11. **Pick One Word per Concept**: không trộn `fetch` / `retrieve` / `get`; không trộn `Controller` / `Manager` / `Driver`.
12. **Don't Pun**: không dùng `add` cho hai nghĩa khác nhau (cộng giá trị vs chèn vào collection; cái sau nên là `insert`/`append`).
13. **Use Solution Domain Names**: `AccountVisitor`, `JobQueue` (người đọc là lập trình viên).
14. **Use Problem Domain Names**: khi không có thuật ngữ kỹ thuật thì dùng tên domain.
15. **Add Meaningful Context**: `state` đứng một mình mơ hồ; gom vào class `Address`. Ví dụ `GuessStatisticsMessage`.
16. **Don't Add Gratuitous Context**: không prefix mọi class bằng `GSD`; `Address` tốt hơn `GSDAccountAddress`.

## Key Concepts
- **Implicity**: ngữ cảnh ngầm không có trong code.
- **Noise word**: từ không phân biệt nghĩa (`Info`, `Data`).
- **Encoding**: nhét type/scope vào tên.
- **Pun**: một từ, hai nghĩa.
- **Scope-length rule**: scope càng lớn thì tên càng dài và rõ.

## Mental Models
- Đọc tên to lên trong buổi review; nếu phải giải thích thì đổi tên.
- **Một từ, một khái niệm** trong toàn codebase, như một từ điển chung của team.

## Anti-patterns
- Tên kèm comment giải thích.
- `data`, `info`, `item2`, `tmp`, `flag`.
- Prefix kiểu Hungarian/`m`/`I`.
- Tên "hài hước" hoặc tiếng lóng.

## Worked Example
```java
// Trước
public List<int[]> getThem() {
  List<int[]> list1 = new ArrayList<int[]>();
  for (int[] x : theList) if (x[0] == 4) list1.add(x);
  return list1;
}
// Sau (minesweeper)
public List<Cell> getFlaggedCells() {
  List<Cell> flaggedCells = new ArrayList<Cell>();
  for (Cell cell : gameBoard) if (cell.isFlagged()) flaggedCells.add(cell);
  return flaggedCells;
}
```
Cùng số toán tử và độ lồng, nhưng **explicit** hơn hẳn.

## 🤖 Android mapping (chuyển thể, không có trong sách)
```kotlin
// ❌
val list = repo.getData().filter { it.s == 1 }
fun handle(it: Any?) { ... }
// ✅ Kotlin idiomatic + intention-revealing
val liveCameras = liveVideoRepository.mostViewed(limit = 20).filter { it.isLive }
val flaggedCells = gameBoard.filter(Cell::isFlagged)
```
- **Hậu tố tầng là "meaningful distinction"** (không phải noise) khi cả team thống nhất: Satellite2 dùng `XxxDtoModel` (data), `XxxUIModel` (UI), `XxxUiState` (state màn hình). Giữ **một** cách viết: hiện có cả `UIModel` và `UiModel` (ví dụ `LiveVideoUiModel`), nên thống nhất một kiểu. `XxxInfo` / `XxxData` song song với `Xxx` là noise.
- **Interface trơn, impl có hậu tố**: `LiveVideoRepository` + `LiveVideoRepositoryImpl` (đúng ý sách). Tốt hơn nữa khi có nhiều impl: `RoomLookupHistoryStore`, `InMemoryLookupHistoryStore` (tên nói *khác nhau ở đâu*).
- **Encoding kiểu Android cũ**: `mViewModel`, `sInstance`, `IRepository`. Kotlin style guide và sách đều nói bỏ. **View ID** (`tvTitle`, `btnSetting`, `rvMain`) là encoding, nhưng là quy ước phổ biến để phân biệt widget trong ViewBinding; chấp nhận được **chỉ** cho view ID, không dùng cho biến logic.
- **One word per concept**: repository dùng `get…` (one-shot) / `observe…` (Flow). Đừng trộn `fetch`/`load`/`retrieve`. UseCase đặt tên động từ + danh từ: `GetAllCitiesUseCase`, `SaveSearchHistoryLiveVideoUseCase` ✅.
- **Đừng pun**: `refresh()` ở chỗ này là gọi API lại, chỗ kia là xóa cache. Tách thành `reload()` / `clearCache()`.
- **Gratuitous context**: prefix mọi class bằng tên app (`SatXxx`) hay package `pion.tech.pionbase` lặp lại trong tên class.
- **Static factory có tên** trong Kotlin: `companion object { fun fromE164(raw: String) }` hoặc top-level `fun Coordinates.Companion.of(latLng: LatLng)`.

## Key Takeaways
1. Tên phải tự giải thích; nếu cần comment thì đổi tên.
2. Tránh disinformation, noise word, encoding, pun.
3. Độ dài tên tương ứng scope; tên tìm kiếm được.
4. Một từ cho một khái niệm trong toàn dự án.
5. Đổi tên không sợ hãi, vì IDE refactor rất rẻ.

## Connects To
- **code-ch17 (N1–N7 Names heuristics)**, **code-ch03 (function names)**, **code-ch10 (class names, SRP)**.
