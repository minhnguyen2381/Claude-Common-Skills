# Clean Code — Chapter 5: Formatting

## Core Idea
Formatting là **giao tiếp**, mà giao tiếp là việc **ưu tiên số một** của dev chuyên nghiệp. Tính năng hôm nay sẽ đổi, nhưng **phong cách và kỷ luật thì sống sót**. Team chọn một bộ quy tắc đơn giản, **tự động hóa** nó, và mọi người tuân theo: *"the team rules."*

## Frameworks Introduced
- **Vertical Formatting**:
  - **File size**: FitNesse (~50K dòng) có file trung bình ~65 dòng, lớn nhất ~400. Hệ thống lớn vẫn xây được với file **thường ~200 dòng, giới hạn trên ~500**.
  - **The Newspaper Metaphor**: tên file như tiêu đề; phần đầu là khái niệm cấp cao; chi tiết tăng dần khi đi xuống.
  - **Vertical Openness Between Concepts**: dòng trống tách các ý (package, import, mỗi hàm).
  - **Vertical Density**: dòng liên quan chặt thì đặt sát nhau; comment vô ích phá vỡ sự gắn kết.
  - **Vertical Distance** [G10]: khái niệm liên quan đặt gần nhau; tránh tách sang file khác nếu không có lý do (một lý do để tránh `protected` variable).
    - **Variable declarations**: biến local khai báo gần chỗ dùng (đầu hàm ngắn); biến điều khiển vòng lặp khai báo trong vòng lặp.
    - **Instance variables**: ở **đầu class**, một chỗ ai cũng biết (ví dụ xấu: `TestSuite` của JUnit giấu field ở giữa).
    - **Dependent functions**: hàm gọi ở **trên** hàm được gọi.
    - **Conceptual affinity**: hàm cùng nhóm (`assertTrue`/`assertFalse`) đặt cạnh nhau.
    - Constant ở mức phù hợp [G35]: `"FrontPage"` truyền xuống từ nơi biết nó, không chôn trong hàm cấp thấp.
  - **Vertical Ordering**: call dependency chĩa **xuống**; quan trọng trước, chi tiết sau.
- **Horizontal Formatting**:
  - Dòng ngắn: phần lớn dòng 20–60 ký tự; chấp nhận tới 100–120; giới hạn của tác giả là **120**.
  - **Horizontal openness and density**: khoảng trắng quanh `=`; không có khoảng trắng giữa tên hàm và `(`; khoảng trắng thể hiện **độ ưu tiên toán tử** (`b*b - 4*a*c`).
  - **Horizontal alignment**: *không* căn thẳng cột khai báo/gán. Nó nhấn sai chỗ; danh sách dài cần căn là dấu hiệu class nên tách.
  - **Indentation**: thể hiện cấp scope. **Không phá indentation** cho `if`/`while`/hàm ngắn một dòng.
  - **Dummy scopes**: thân rỗng `while (...) ;` đặt `;` thụt lề trên dòng riêng.
- **Team Rules**: FitNesse thống nhất trong ~10 phút rồi mã hóa vào formatter của IDE.
- **Uncle Bob's Formatting Rules**: `CodeAnalyzer.java` (Listing 5-6). *Code là tài liệu coding standard tốt nhất.*

## Key Concepts
- **Newspaper metaphor**.
- **Vertical openness / density / distance / ordering**.
- **Conceptual affinity**.
- **Team rules**.

## Mental Models
- Mở một file, **nheo mắt nhìn**: khối nào là một ý phải hiện rõ.
- Nếu phải căn thẳng cột cho dễ đọc, có lẽ class quá dài.

## Anti-patterns
- File hàng nghìn dòng.
- Field rải giữa class.
- Hàm được gọi nằm trên hàm gọi, nhảy lung tung.
- Mỗi dev một style; không có formatter tự động.
- Căn cột thủ công; dòng 200 ký tự.

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **Tự động hóa "team rules"**: `ktlint` hoặc `spotless` + `.editorconfig` (`max_line_length = 120`, `ktlint_official` style), chạy trong CI và pre-commit. Android Studio: *Reformat Code* với code style Kotlin. Không tranh cãi trong review về dấu ngoặc.
- **Vertical ordering trong một Kotlin class Android**:
```kotlin
class LiveCameraSearchResultViewModel(/* deps */) : BaseViewModel<State, Event>(State()) {
    // 1. state/fields (một chỗ, ở trên)
    private var searchJob: Job? = null

    // 2. public API — "tiêu đề báo" mà Fragment gọi
    fun onSearchSubmitted(keyword: String) { ... }
    fun onLoadMore() { ... }

    // 3. private helpers — ngay dưới hàm gọi chúng (stepdown)
    private fun requestFor(page: Int) = ...

    // 4. companion object ở cuối (hằng số)
    companion object { private const val PAGE_SIZE = 20 }
}
```
- **File size**: ViewModel/Fragment Android hay phình quá 500 dòng. Satellite2 đã tách `Fragment` và `FragmentEx` (init/click). Tiếp tục tách reducer, mapper và adapter ra file riêng khi vượt ~200–300 dòng.
- **Kotlin-specific density**: trailing lambda và chain `.map{}.filter{}`: mỗi bước một dòng khi chain > 2 bước; dùng trailing comma cho danh sách tham số nhiều dòng (giúp diff sạch).
- **XML layout** cũng là code: thứ tự attribute nhất quán (`id`, `layout_*`, rồi style), dùng `@dimen`/`@color`/`@string` (Satellite2 bắt buộc, là một dạng "team rules").

## Key Takeaways
1. Formatting là giao tiếp; nó sống lâu hơn code.
2. File nhỏ (~200, ≤500 dòng); cấu trúc như bài báo.
3. Dòng trống tách ý; liên quan thì đặt gần; gọi ở trên, được gọi ở dưới.
4. Dòng ≤120; không căn cột; giữ indentation.
5. Team thống nhất một style và tự động hóa nó.

## Connects To
- **code-ch03 (Stepdown Rule)**, **code-ch10 (class organization)**, **code-ch17 (G10 Vertical Separation, G35 Constants at right level)**.
