# Clean Code — Chapter 15: JUnit Internals (Case Study: `ComparisonCompactor`)

## Core Idea
Ngay cả code **đã tốt** (JUnit, coverage 100%) vẫn có thể **sạch hơn**. Chương này áp **Boy Scout Rule** lên `ComparisonCompactor` qua chuỗi tinh chỉnh nhỏ, mỗi bước gắn với một heuristic (code-ch17). *"No module is immune from improvement."*

## Frameworks Introduced
- **Bối cảnh**: `ComparisonCompactor` nhận hai chuỗi khác nhau, ví dụ `ABCDE` và `ABXDE`, rồi tạo `<...B[X]D...>`, với tham số `contextLength`. Kent Beck & Erich Gamma viết JUnit trên máy bay tới Atlanta. Test phủ **100%**.
- **Chuỗi refactor (kèm mã heuristic)**:
  1. Bỏ tiền tố `f` cho member (`fExpected` → `expected`) [**N6** Avoid Encodings].
  2. **Encapsulate conditional**: `if (expected == null || actual == null || areStringsEqual())` → `shouldNotCompact()` [**G28**].
  3. Tên biến local trùng tên field nhưng nghĩa khác thì đổi cho rõ (`expected` → `compactExpected`) [**N4** Unambiguous Names].
  4. **Tránh điều kiện phủ định**: `shouldNotCompact()` → `canBeCompacted()`, đảo `if` [**G29**].
  5. Tên hàm phải nói **side effect**: `compact()` có thể không compact (khi `canBeCompacted()` false) → `formatCompactedComparison(message)` [**N7**].
  6. **Hàm làm một việc**: tách phần compact ra `compactExpectedAndActual()`; `formatCompactedComparison` chỉ format [**G30**].
  7. **Quy ước nhất quán**: `findCommonPrefix`/`findCommonSuffix` cùng trả về giá trị thay vì một số gán field, một số trả về [**G11**].
  8. **Phơi bày temporal coupling**: `findCommonSuffix` phụ thuộc `prefixIndex` do `findCommonPrefix` tính. Thử truyền `prefixIndex` làm tham số, nhưng như vậy là tùy tiện [**G32**] (người khác có thể gỡ đi). Cách tốt hơn: `findCommonPrefixAndSuffix()` gọi `findCommonPrefix()` trước tiên, nên thứ tự hiển nhiên [**G31**].
  9. **Đóng gói boundary condition**: `suffixIndex` (1-based) gây hàng loạt `+1` nên đổi sang `suffixLength` (0-based), `+1` biến mất [**G33**]. Phát hiện một `if` vốn **không bao giờ có tác dụng** (đó là bug ẩn).
  10. **Xóa dead code**: hai `if` thừa; comment out rồi chạy test vẫn pass nên xóa; `compactString` chỉ còn ghép mảnh [**G9**].
  11. **Sắp xếp**: các hàm *analysis* trước, *synthesis* sau; mỗi hàm định nghĩa ngay sau chỗ dùng (stepdown).
  12. Có lúc **inline lại** hàm đã tách: refactoring là quá trình lặp, thử-sai, hội tụ.
- **Conclusion**: thỏa Boy Scout Rule; module vốn đã sạch, giờ sạch hơn.

## Key Concepts
- **Encapsulate conditionals**, **avoid negative conditionals**.
- **Temporal coupling exposed by structure**.
- **Boundary condition encapsulation** (+1/-1).
- **Analysis-then-synthesis ordering**.

## Mental Models
- Thấy `+1`/`-1` rải rác thì biến/khái niệm đang sai "gốc" (0-based vs 1-based).
- Thứ tự gọi bắt buộc nên được **cấu trúc code** thể hiện, không phải trí nhớ của dev.

## Anti-patterns
- Tiền tố scope (`f`, `m`).
- `if (!shouldNot…)` (phủ định kép).
- Hàm tên "compact" nhưng có thể không compact.
- Hàm phụ thuộc thứ tự ngầm.

## Worked Example
```java
// Trước (Listing 15-2)
public String compact(String message) {
  if (fExpected == null || fActual == null || areStringsEqual())
    return Assert.format(message, fExpected, fActual);
  findCommonPrefix();
  findCommonSuffix();
  String expected = compactString(fExpected);
  String actual = compactString(fActual);
  return Assert.format(message, expected, actual);
}
// Sau (Listing 15-5) — canBeCompacted() ở bước trung gian, bản cuối gọi là shouldBeCompacted()
public String formatCompactedComparison(String message) {
  String compactExpected = expected;
  String compactActual = actual;
  if (shouldBeCompacted()) {
    findCommonPrefixAndSuffix();
    compactExpected = compact(expected);
    compactActual = compact(actual);
  }
  return Assert.format(message, compactExpected, compactActual);
}
```

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **Encapsulate + positive conditional trong ViewModel/Fragment**:
```kotlin
// ❌
if (!(state.isLoading || state.items.isEmpty() || !state.hasMore)) loadMore()
// ✅
if (state.canLoadMore) loadMore()          // val canLoadMore get() = !isLoading && items.isNotEmpty() && hasMore
```
- **Boundary condition +1** trong paging: `pageIndex` 0-based phía app vs `page` 1-based phía API. Gom việc chuyển đổi vào **một chỗ** (`toApiPage()` trong `RepositoryImpl`), không rải `+ 1` trong ViewModel.
- **Temporal coupling Android**: `adapter.setListener(this)` phải gọi trước `binding.rv.adapter = adapter`; `initView()` trước `settingEvent()`. Đưa vào một hàm `setupList()` để thứ tự nằm trong cấu trúc, hoặc truyền listener qua constructor nếu quy ước team cho phép (Satellite2 quy định *không* truyền listener qua constructor adapter; khi đó gom thứ tự vào `initView()`).
- **Tên phản ánh side effect**: `fun loadData()` vừa load vừa log analytics vừa show ad thì đặt tên đúng hoặc tách.

## Key Takeaways
1. Code tốt vẫn có thể sạch hơn; áp Boy Scout Rule.
2. Encapsulate conditional, tránh phủ định.
3. Tên hàm phản ánh đúng hành vi và side effect; một hàm một việc.
4. Phơi bày temporal coupling bằng cấu trúc.
5. Đóng gói boundary (+1/-1); xóa dead code.

## Connects To
- **code-ch17 (N4, N6, N7, G9, G11, G28–G33)**, **code-ch03 (Functions)**, **code-ch01 (Boy Scout Rule)**.
