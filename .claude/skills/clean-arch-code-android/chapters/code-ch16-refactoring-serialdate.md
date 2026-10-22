# Clean Code — Chapter 16: Refactoring SerialDate

## Core Idea
Review và refactor `org.jfree.date.SerialDate` (JCommon, David Gilbert), code "tốt" có kỷ luật. Review công khai là **hành động chuyên nghiệp** (bác sĩ, phi công, luật sư đều làm vậy). Quy trình: **"First, Make It Work"** (tăng coverage, sửa bug) rồi **"Then Make It Right"** (đi từ trên xuống dưới, mỗi thay đổi đều chạy toàn bộ test).

## Frameworks Introduced
- **First, Make It Work**:
  - Test sẵn có pass nhưng **không đủ** [T1]: `MonthCodeToQuarter` không ai dùng [F4]. Clover cho thấy test chỉ chạy **91/185** statement (~50%) [T2].
  - Viết bộ test độc lập mới, ban đầu **fail**, mô tả hành vi *nên có*. Coverage lên **170/185** (92%).
  - Sửa: so sánh tên ngày **không phân biệt hoa thường** [G2]; hỗ trợ "tues", "thurs"; `stringToMonthCode` nhận cả tên tháng ngắn/dài; bug **boundary** ở `getFollowingDayOfWeek` (`>` thành `>=`) [T5]; **mẫu thất bại** của test bị comment out cho thấy `getNearestDayOfWeek` sai khi ngày gần nhất ở tương lai [T6][T7]; ném `IllegalArgumentException` thay vì trả chuỗi lỗi.
- **Then Make It Right** (chọn lọc các thay đổi tiêu biểu):
  - Xóa **change history** đầu file [C1]; giữ license.
  - Comment trộn 4 ngôn ngữ (Java, English, Javadoc, HTML) [G1].
  - Tên `SerialDate` lộ implementation và sai mức trừu tượng [N1][N2], nên đổi thành **`DayDate`** (thỏa hiệp vì `Date`/`Day` đã bị dùng). "Serial" thật ra là **ordinal**.
  - Kế thừa `MonthConstants` để dùng hằng số là mẹo cũ, nên đổi thành **`enum Month`** [J2/J3]; xóa `isValidMonthCode` và kiểm tra lỗi tháng [G5].
  - `serialVersionUID`: tác giả chọn xóa để compiler tự sinh (an toàn hơn quên cập nhật) [G4], có ghi chú rằng reviewer phản đối.
  - Hằng `EARLIEST/LATEST_DATE_ORDINAL` chỉ `SpreadsheetDate` dùng nên **push down** [G6]. `MINIMUM/MAXIMUM_YEAR_SUPPORTED` được dùng bởi `RelativeDayOfWeekRule` (user của abstract class cần biết implementation) nên tạo **`DayDateFactory`** (Abstract Factory + Singleton + Decorator) [G7].
  - Các hằng int nhóm thành enum: `WeekInMonth`, `DateInterval` (`CLOSED`, `CLOSED_LEFT`, `CLOSED_RIGHT`, `OPEN`, dùng thuật ngữ toán học [N3]), `WeekdayRange` (`LAST`, `NEXT`, `NEAREST`), `Day` [J3].
  - Xóa Javadoc thừa/sai [C2][C3]; bỏ `final` rải rác (clutter, unit test đã bắt lỗi) [G12].
  - Hai hàm, một gọi hàm kia kèm **flag** chọn format, nên gộp, đổi tên và chuyển vào `Month` enum [G15][N1][G14].
  - Hàm static thao tác biến của `DayDate` thì chuyển thành instance method [G18]; dùng **explaining temporary variables** [G19]; `getYYY` → `getYear`.
  - `addDays(5)` mơ hồ (có sửa object không?) nên đổi thành **`plusDays`/`plusMonths`** [N4][G20].
  - Hiểu thuật toán trước khi sửa [G21]; giữ quy ước nhất quán [G11].
  - `getDayOfWeek` có **phụ thuộc logic** vào gốc ordinal, nên tách phần phụ thuộc thành `getDayOfWeekForOrdinalZero()` (abstract) và kéo phần chung lên.
  - `compare` → `daysSince`; tiện ích tĩnh → `DateUtil`; `toSerial` → `toOrdinal` → `getOrdinalDay`.
  - Coverage % **giảm** (84.9%) vì class **nhỏ đi nhiều**: 45/53 statement được phủ.
- **Conclusion**: Boy Scout Rule: coverage tăng, bug được sửa, code rõ và nhỏ hơn.

## Key Concepts
- **Make it work → make it right**.
- **Coverage tool** [T2].
- **Push down / pull up** theo phụ thuộc [G6].
- **Logical vs physical dependency**.
- **Enum thay int constants** [J3].
- **Explaining temporary variables**.

## Mental Models
- Test hiện có pass **không có nghĩa** là đủ; đo coverage và đọc **mẫu** thất bại.
- Đặt code ở nơi **phụ thuộc** của nó sống (abstract hay concrete).

## Anti-patterns
- Changelog trong file; Javadoc thừa/sai.
- Hằng số int thay vì enum; kế thừa interface hằng số.
- Tên lộ implementation (`SerialDate`).
- `final` khắp nơi; flag argument chọn format.
- Hàm static thao tác trạng thái instance.

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **"Make it work" trước khi refactor một màn legacy**: chạy coverage (`./gradlew testDebugUnitTest` + JaCoCo/Kover) cho ViewModel cần sửa; viết test đặc tả hành vi trước (characterization test), rồi mới refactor.
- **Int constants → enum/sealed** (Kotlin):
```kotlin
// ❌ const val TYPE_YOUTUBE = 1; const val TYPE_HLS = 2 ; when (type) { 1 -> ...}
// ✅
enum class StreamType { YOUTUBE, HLS, MJPEG }
@JvmInline value class Ordinal(val value: Int)
```
- **Mơ hồ mutate/immutable** như `addDays`: Kotlin `data class` immutable + đặt tên `plus…`/`with…` (`state.withPage(2)`, `date.plusDays(5)`), đồng bộ với `java.time` (minSdk 28 cho phép dùng `LocalDate` mà không cần desugaring).
- **Push down / pull up**: hằng số chỉ `RoomLookupHistoryStore` dùng thì không để ở domain interface; logic chung của mọi `RepositoryImpl` thì kéo lên helper (`resultFlow {}`, code-ch12).
- **`final` của Java ↔ `val` của Kotlin**: Kotlin mặc định class/method `final` và khuyến khích `val`. Bài học "đừng rải clutter" chuyển thành: đừng `open` tùy tiện, đừng `lateinit var` khi `val` được.
- **Characterization test cho date/time** (dễ có bug boundary): "ngày thứ Bảy tiếp theo sau thứ Bảy 25/12/2004 phải là 1/1/2005" là kiểu test nên có cho logic lịch (lịch nhắc, quota theo ngày).

## Key Takeaways
1. Làm cho chạy đúng (tăng coverage, sửa bug) trước, làm cho sạch sau.
2. Coverage và mẫu thất bại tiết lộ bug boundary.
3. Đặt code theo phụ thuộc (push down/pull up), dùng factory khi client cần thông tin implementation.
4. Enum thay hằng int; tên rõ về immutability (`plusDays`).
5. Mỗi bước refactor chạy toàn bộ test.

## Connects To
- **code-ch17 (gần như mọi mã heuristic được trích từ chương này)**, **code-ch09 (Unit tests, T1–T9)**, **code-ch14 (Successive refinement)**.
