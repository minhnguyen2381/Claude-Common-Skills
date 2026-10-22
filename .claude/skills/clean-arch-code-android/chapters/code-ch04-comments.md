# Clean Code — Chapter 4: Comments

## Core Idea
*"Don't comment bad code—rewrite it."* (Kernighan & Plauger). Comment **trong trường hợp tốt nhất là một điều xấu cần thiết**: nó bù đắp cho **thất bại** khi diễn đạt bằng code. Comment **nói dối** theo thời gian vì code thay đổi mà comment không theo kịp. *"Truth can only be found in one place: the code."*

## Frameworks Introduced
- **Comments Do Not Make Up for Bad Code**: dành thời gian dọn mess thay vì giải thích mess.
- **Explain Yourself in Code**: `// Check to see if the employee is eligible for full benefits` + `if ((employee.flags & HOURLY_FLAG) && (employee.age > 65))` → `if (employee.isEligibleForFullBenefits())`.
- **Good Comments** (*"the only truly good comment is the comment you found a way not to write"*):
  1. **Legal comments**: copyright/license, ngắn, tham chiếu license chuẩn.
  2. **Informative comments**: ví dụ format regex `kk:mm:ss EEE, MMM dd, yyyy`; tốt hơn nữa là đổi tên (`responderBeingTested`) hoặc tách class.
  3. **Explanation of intent**: *vì sao* chọn cách này (`return 1; // we are greater because we are the right type.`; "best attempt to get a race condition").
  4. **Clarification**: dịch giá trị khó hiểu của API **không sửa được** (`// a < b`); rủi ro sai cao nên phải cẩn thận.
  5. **Warning of consequences**: `//SimpleDateFormat is not thread safe, so we need to create each instance independently.`; `@Ignore("Takes too long to run")`.
  6. **TODO comments**: được phép, nhưng không phải cớ để để code xấu; quét và xóa định kỳ.
  7. **Amplification**: nhấn mạnh thứ trông có vẻ vô hại (`// the trim is real important…`).
  8. **Javadocs in public APIs**: cần thiết cho API công khai, nhưng vẫn có thể sai.
- **Bad Comments**:
  1. **Mumbling**: comment mơ hồ (`// No properties files means all defaults are loaded` trong catch rỗng).
  2. **Redundant comments**: đọc lâu hơn code (`waitForClose`); javadoc Tomcat cho từng field.
  3. **Misleading comments**: "returns when this.closed is true" nhưng thực tế là chờ timeout rồi throw.
  4. **Mandated comments**: bắt mọi hàm phải có javadoc (`@param title The title of the CD`).
  5. **Journal comments**: changelog đầu file (đã có VCS).
  6. **Noise comments**: `/** Default constructor. */`, `/** The day of the month. */`; `//Give me a break!` nên **tách hàm** (`addExceptionAndCloseResponse`).
  7. **Scary noise**: javadoc copy-paste sai.
  8. **Don't use a comment when you can use a function or a variable**.
  9. **Position markers** (`// Actions //////////`): dùng rất hiếm.
  10. **Closing brace comments** (`} //while`): rút ngắn hàm thay vì làm vậy.
  11. **Attributions and bylines** (`/* Added by Rick */`): VCS đã lưu.
  12. **Commented-out code**: *"Few practices are as odious."* Xóa đi, VCS sẽ nhớ.
  13. **HTML comments**: việc của tool, không phải của dev.
  14. **Nonlocal information**: comment nói về default port ở chỗ khác.
  15. **Too much information**: lịch sử, chi tiết RFC base64 không cần.
  16. **Inobvious connection**: comment cần được giải thích lại ("filter byte… why 200?").
  17. **Function headers**: hàm nhỏ có tên tốt thì không cần header.
  18. **Javadocs in nonpublic code**: cruft.

## Key Concepts
- **Comment as failure**.
- **Comment rot**: comment xa code thì sai dần.
- **Intent vs what**: comment tốt nói *why*, code nói *what/how*.
- **Commented-out code**: rác không ai dám xóa.

## Mental Models
- Trước khi gõ `//`, hỏi: "**Mình có thể đổi tên hay tách hàm để comment này thừa không?**"
- Comment chỉ nên trả lời **"tại sao"** hoặc **"cẩn thận"**.

## Anti-patterns
- Comment giải thích code rối.
- Javadoc bắt buộc cho mọi thứ.
- Changelog/byline trong file.
- Code bị comment out.
- `catch {}` rỗng kèm comment mơ hồ.

## Worked Example
`GeneratePrimes.java` (Listing 4-7) từng được coi là "well documented" với `// get rid of known non-primes`, `// sieve`, `// how many primes are there?`, `// move the primes into the result`. Mỗi comment đánh dấu một **section**, tức hàm làm nhiều việc. Bản refactor `PrimeGenerator` (Listing 4-8) chỉ còn **2 comment**, đều giải thích *thuật toán Sieve of Eratosthenes* và *lý do* một bước; các section thành hàm có tên (`uncrossIntegersUpTo`, `crossOutMultiples`, `putUncrossedIntegersIntoResult`).

## 🤖 Android mapping (chuyển thể, không có trong sách)
```kotlin
// ❌ Comment thay cho tên
// check user can watch premium camera
if (!state.isPremium && camera.tier == 2 && dailyWatch >= 3) showPaywall()
// ✅
if (quota.requiresPaywall(camera, isPremium = state.isPremium)) showPaywall()
```
- **Comment tốt kiểu Android (why/warning)**:
  - `// Maps Retrofit KHÔNG gắn Chucker để không lộ API key trong log` (Satellite2 có ý này, nên giữ ở NetworkModule). Đây là *warning of consequences*.
  - `// minSdk 28: Locale API cũ trả sai cho zh-Hant, xem issue #123` (*explanation of intent*).
  - `@Suppress("MissingPermission") // đã kiểm tra quyền ở isGranted() ngay trên`. Tốt hơn nữa là đưa vào kiểu: chỉ cho gọi khi có `PermissionGranted` token.
- **Comment xấu thường gặp trong Android**: `// TODO: remove` tồn tại nhiều năm; code `// binding.btnOld.setOnClickListener {...}` bị comment out; comment tiếng Việt kiểu "Khai báo ngoài init block" (mumbling, Satellite2 có trong `LiveCameraSearchResultViewModel`); KDoc `/** Get data */ fun getData()`.
- **Log là "comment chạy được"**: `Timber.tag("testAPI").d(...)` để lại sau khi debug là *noise*. Xóa, hoặc dùng tag/level có chủ đích.
- **KDoc** chỉ cần cho API "public" của module dùng chung (`:LibAds`, `:permissionx`, `:core:*`), không cần cho từng ViewModel nội bộ.
- **Lint hỗ trợ**: dùng detekt rule `CommentOverPrivateFunction`, `ForbiddenComment` (bắt `TODO:`/`FIXME:` không kèm ticket) để cưỡng chế.

## Key Takeaways
1. Comment là thất bại diễn đạt; ưu tiên diễn đạt bằng code.
2. Comment tốt: legal, intent, warning, clarification (API ngoài), TODO có kiểm soát, public API doc.
3. Xóa comment thừa, gây hiểu lầm, bắt buộc, journal, byline, code comment-out.
4. Comment phải đặt sát code nó mô tả và được bảo trì như code.

## Connects To
- **code-ch02 (Names)**, **code-ch03 (Functions)**, **code-ch17 (C1–C5 Comments heuristics)**.
