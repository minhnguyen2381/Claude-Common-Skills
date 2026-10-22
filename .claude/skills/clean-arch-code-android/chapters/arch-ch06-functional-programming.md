# Clean Architecture — Chapter 6: Functional Programming

## Core Idea
Mọi race condition, deadlock và concurrent update đều bắt nguồn từ **biến mutable**. Kiến trúc sư nên **tách vùng mutable khỏi vùng immutable**, đẩy càng nhiều logic càng tốt sang vùng immutable.

## Frameworks Introduced
- **Variables in functional languages do not vary**: so sánh vòng `for` của Java (biến `i` mutable) với Clojure `(take 25 (map square (range)))` không có biến nào thay đổi.
- **Immutability and Architecture**: không có biến mutable thì không có race condition/deadlock. Immutability khả thi nếu chấp nhận một số thỏa hiệp.
- **Segregation of Mutability**:
  - When to use: mọi app đa luồng.
  - How: chia component thành (a) purely functional, không mutate; và (b) component cho phép mutate, được bảo vệ bằng **transactional memory** (ví dụ Clojure `atom` + `swap!` dùng compare-and-swap).
  - Rule: *đẩy tối đa xử lý vào component immutable; đẩy code ra khỏi component phải mutate.*
- **Event Sourcing**: lưu **transaction**, không lưu **state**. Khi cần state thì replay từ đầu (có thể snapshot, ví dụ mỗi nửa đêm). Ứng dụng trở thành **CR**, không còn CRUD. Ví dụ quen thuộc: hệ thống source control.

## Key Concepts
- **Mutable variable**: nguồn gốc của mọi vấn đề concurrency.
- **Transactional memory**: bảo vệ biến trong RAM như DB bảo vệ record.
- **Compare-and-swap**: đọc → tính → khóa → so sánh → ghi hoặc retry.
- **Event sourcing**: state = fold(transactions).
- **Snapshot**: lưu state định kỳ để chỉ replay phần mới.

## Mental Models
- Nghĩ về state như **kết quả của một hàm trên chuỗi sự kiện**, không phải một ô nhớ để ghi đè.
- Vẽ ranh giới: "vùng này có ai mutate không?". Nếu có, nó cần một cơ chế đồng bộ duy nhất.

## Anti-patterns
- **Mutable state rải rác khắp nơi**: race condition khó tái hiện.
- **Nhiều biến phụ thuộc nhau chỉ dùng atom đơn lẻ**: atom không đủ bảo vệ khi có nhiều biến liên quan.

## Code Examples
```clojure
(def counter (atom 0)) ; khởi tạo
(swap! counter inc)    ; tăng an toàn bằng compare-and-swap
```
- **What it demonstrates**: mutation có kỷ luật, cô lập trong một cơ chế duy nhất.

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **Segregation of mutability trong ViewModel**: state là `data class` immutable, và **chỉ một cửa** mutate là `MutableStateFlow.update {}`. Đây chính là CAS giống `swap!`.
```kotlin
// BaseViewModel kiểu Satellite2 — setState là "swap!" của Android
protected fun setState(reduce: State.() -> State) { _uiState.update { it.reduce() } }

// Reducer thuần, test được không cần coroutine
fun LiveCameraUiState.onPageLoaded(page: Int, items: List<VideoUiModel>) =
    copy(pages = pages + (page to items), isLoading = false)
```
- Đừng giữ `var` mutable trong ViewModel ngoài StateFlow, vì `launchIO` chạy trên nhiều thread. Nếu buộc phải giữ (Job, cache) thì bảo vệ bằng `Mutex` như `LiveCameraSearchResultViewModel` đang làm.
- **Event-sourcing nhẹ**: lịch sử tìm kiếm trong Room là CR (insert + đọc), state "recent keywords" được tính bằng query.

## Key Takeaways
1. Mutable state là gốc rễ của bug concurrency.
2. Tách component mutable/immutable; giữ phần mutable nhỏ và có kỷ luật.
3. Event sourcing biến CRUD thành CR khi có đủ storage.

## Connects To
- **code-ch13 (Concurrency)**: giới hạn phạm vi dữ liệu dùng chung.
- **arch-ch03**: FP = kỷ luật lên phép gán.
