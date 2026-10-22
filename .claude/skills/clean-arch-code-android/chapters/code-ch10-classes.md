# Clean Code — Chapter 10: Classes (với Jeff Langr)

## Core Idea
Class phải **nhỏ**, nhưng nhỏ đo bằng **số trách nhiệm**, không bằng số dòng. Hệ thống nên gồm **nhiều class nhỏ**, mỗi class một trách nhiệm (SRP), **cohesion cao**, được **tổ chức để thay đổi** (OCP) và **cô lập khỏi thay đổi** (DIP).

## Frameworks Introduced
- **Class Organization** (quy ước Java): public static constant → private static → private instance variable (hiếm khi có public variable) → public function → private helper **ngay sau** public function gọi nó (stepdown, newspaper).
- **Encapsulation**: giữ private; nới lỏng (protected/package) **chỉ khi test cần** và là **giải pháp cuối cùng**. *"For us, tests rule."*
- **Classes Should Be Small!**: đo bằng **responsibilities**. `SuperDashboard` có ~70 public method là "God class"; ngay cả bản 5 method vẫn quá nhiều trách nhiệm.
  - **Tên** là thước đo đầu tiên: không đặt được tên ngắn gọn thì class quá lớn. Từ "weasel" như `Processor`, `Manager`, `Super` là dấu hiệu gom trách nhiệm.
  - **25-word description test**: mô tả class trong khoảng 25 từ **không dùng "if", "and", "or", "but"**. "…provides access to the component that last held the focus, **and** it also allows us to track the version…" thì có 2 trách nhiệm.
- **The Single Responsibility Principle**: một class, một lý do để thay đổi. Tách `Version` (`getMajorVersionNumber`, `getMinorVersionNumber`, `getBuildNumber`) khỏi `SuperDashboard` (Swing), và `Version` có tiềm năng tái sử dụng cao.
  - Vì sao SRP bị lạm dụng nhiều nhất: "làm cho chạy" và "làm cho sạch" là **hai hoạt động khác nhau**; ta dừng lại khi code chạy.
  - **Toolbox metaphor**: nhiều class nhỏ không có nhiều "moving parts" hơn vài class lớn; câu hỏi là muốn hộp đồ nghề **nhiều ngăn nhỏ có nhãn** hay **vài ngăn ném lung tung**.
- **Cohesion**: ít instance variable; mỗi method dùng một hoặc nhiều biến; method dùng càng nhiều biến thì càng cohesive. `Stack` (chỉ `size()` không dùng cả hai biến) có cohesion rất cao.
  - Hàm nhỏ + ít tham số thường làm **sinh ra instance variable** chỉ một nhóm method dùng, nghĩa là **có class khác đang muốn thoát ra**.
- **Maintaining Cohesion Results in Many Small Classes**: tách hàm lớn thì nâng biến lên instance variable, cohesion giảm, nên tách class. Ví dụ `PrintPrimes` của Knuth (một hàm khổng lồ) thành **`PrimePrinter`** (main, môi trường thực thi), **`RowColumnPagePrinter`** (định dạng trang), **`PrimeGenerator`** (sinh số nguyên tố). **Không phải viết lại**: có test suite cố định hành vi, rồi rất nhiều bước nhỏ.
- **Organizing for Change**: class `Sql` (`create`, `insert`, `selectAll`, `findByKey`, `select`, `preparedInsert`…) phải mở ra khi thêm `update` hoặc khi đổi chi tiết `select`, nên vi phạm SRP. Dấu hiệu: private method chỉ liên quan một tập con (`selectWithCriteria`). Tách thành `abstract class Sql { abstract String generate(); }` + `CreateSql`, `SelectSql`, `InsertSql`, `SelectWithCriteriaSql`, `SelectWithMatchSql`, `FindByKeySql`, `PreparedInsertSql`, cùng tiện ích `Where`, `ColumnList`. Thêm `UpdateSql` không sửa class nào (**OCP**).
  - Nhưng: **chỉ hành động khi hệ thống thật sự thay đổi**. Nếu `Sql` đã "logically complete" thì để yên.
- **Isolating from Change**: `Portfolio` phụ thuộc `TokyoStockExchange` (giá đổi mỗi 5 phút, khó test). Tạo `interface StockExchange { Money currentPrice(String symbol); }`, inject qua constructor, test bằng `FixedStockExchangeStub` (`fix("MSFT", 100)` → 5 cổ phiếu = 500). Đây là **DIP**.

## Key Concepts
- **Responsibility = reason to change**.
- **God class**, **weasel words**.
- **25-word test**.
- **Cohesion**.
- **Open-Closed via subclass**.
- **Stub for volatile dependency**.

## Mental Models
- Viết mô tả class, đếm "và/hoặc/nếu/nhưng". Mỗi từ là một trách nhiệm tiềm năng.
- Thấy nhóm field chỉ vài method dùng thì có class đang trốn trong class.
- Mỗi lần phải **mở** một class để thêm tính năng là tín hiệu xem lại thiết kế.

## Anti-patterns
- God class, `XxxManager`, `XxxHelper`, `XxxUtils` chứa đủ thứ.
- Mở class cũ mỗi lần thêm biến thể.
- Phụ thuộc trực tiếp vào API concrete volatile (khó test).
- Nới private thành public "cho tiện".

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **25-word test cho class Android thực tế**:
  - `CommonViewModel`: "quản lý categories, templates, famous places, live cameras **và** premium status **và** vị trí GPS…" nên có nhiều trách nhiệm. Tách holder/repository theo actor (xem arch-ch07).
  - `XxxFragment` + `XxxFragmentEx` + `XxxViewModel` (Satellite2) là cách tách theo trách nhiệm hiển thị / tương tác / trạng thái.
- **Weasel words trên Android**: `AppManager`, `DataManager`, `AdsHelper`, `Utils.kt` 1000 dòng. Đặt tên theo trách nhiệm: `InterstitialScheduler`, `PlaceSearchHistory`, `PhoneNumberFormatter`.
- **Cohesion trong ViewModel**: nếu ViewModel có `searchJob`, `parentSearchJob`, `mutex` chỉ dùng cho search, và `historyList` chỉ dùng cho lịch sử, thì tách `SearchPager` (class thường, test được) mà ViewModel ủy quyền.
- **Organizing for change (OCP) kiểu Android**:
```kotlin
// ❌ phải mở class mỗi khi thêm loại thông báo
class NotificationBuilder { fun build(type: String, data: Map<String, String>): Notification = when (type) { ... } }
// ✅ thêm loại = thêm class
interface PushHandler { val type: String; fun build(data: Map<String, String>): Notification }
class NewCameraPushHandler(...) : PushHandler { ... }
class PremiumExpiryPushHandler(...) : PushHandler { ... }
// Koin: factory { listOf<PushHandler>(get<NewCameraPushHandler>(), get<PremiumExpiryPushHandler>()) }
```
- **Isolating from change**: `Portfolio`/`StockExchange` ↔ `NumberLocator`/`PhoneNumberParser`, `CameraRanking`/`ViewCountSource`. Fake cố định (`FixedViewCountSource`) giúp test ổn định.
- **Encapsulation vs test**: tránh `@VisibleForTesting internal` tràn lan; ưu tiên test qua public API (ViewModel state).

## Key Takeaways
1. Class nhỏ, đo bằng trách nhiệm; tên rõ, mô tả ngắn không có "và/hoặc".
2. SRP: một lý do thay đổi; nhiều class nhỏ tốt hơn vài class lớn.
3. Giữ cohesion cao; cohesion giảm thì tách class.
4. Tổ chức để thêm tính năng bằng mở rộng (OCP), chỉ khi thay đổi thật sự đến.
5. Phụ thuộc abstraction để cô lập khỏi thay đổi và dễ test (DIP).

## Connects To
- **arch-ch07 (SRP actor)**, **arch-ch08 (OCP)**, **arch-ch11 (DIP)**, **code-ch05 (vertical ordering)**, **code-ch17 (G8, G17, G18)**.
