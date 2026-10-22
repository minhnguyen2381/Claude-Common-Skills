# Clean Code — Chapter 13: Concurrency (Brett L. Schuchert) + Appendix A: Concurrency II

## Core Idea
*"Objects are abstractions of processing. Threads are abstractions of schedule."* (Coplien). Concurrency là **chiến lược tách "làm gì" khỏi "khi nào"**. Nó khó, và lỗi của nó **hiếm, không lặp lại được**. Phòng thủ bằng: **SRP cho code concurrency**, **giới hạn dữ liệu chia sẻ**, **hiểu thư viện**, **section đồng bộ nhỏ**, và **test có chủ đích để ép lỗi lộ ra**.

## Frameworks Introduced
- **Why Concurrency?**: decouple *what* khỏi *when* (Servlet model); tăng throughput/response time (aggregator nhiều web site, xử lý nhiều user).
- **Myths and Misconceptions**: ~~concurrency luôn tăng hiệu năng~~ (chỉ khi có nhiều thời gian chờ chia sẻ được); ~~thiết kế không đổi~~ (thường đổi căn bản); ~~container lo hết~~. Thực tế: tốn overhead; đúng là phức tạp; bug không lặp lại nên hay bị coi là "one-off"; thường đòi đổi chiến lược thiết kế.
- **Challenges**: `return ++lastIdUsed;` với 2 thread có thể cho kết quả 43/43 (sai). Có **12.870** đường thực thi khác nhau (int); với `long` là **2.704.156**.
- **Concurrency Defense Principles**:
  - **SRP**: *Keep your concurrency-related code separate from other code.*
  - **Limit the Scope of Data**: *severely limit the access of any data that may be shared*; ít critical section.
  - **Use Copies of Data**: copy, xử lý riêng, merge ở một thread.
  - **Threads Should Be as Independent as Possible**: mỗi thread một thế giới, chỉ dùng biến local (giống Servlet `doGet`).
- **Know Your Library**: thread-safe collection (`ConcurrentHashMap`), executor framework, nonblocking (`AtomicInteger`, CAS), biết class nào **không** thread-safe; `ReentrantLock`, `Semaphore`, `CountDownLatch`.
- **Know Your Execution Models**: định nghĩa *Bound Resources, Mutual Exclusion, Starvation, Deadlock, Livelock*; ba bài toán kinh điển **Producer-Consumer**, **Readers-Writers**, **Dining Philosophers**. *Learn these basic algorithms.*
- **Beware Dependencies Between Synchronized Methods**: tránh gọi nhiều method trên một object chia sẻ. Nếu buộc phải gọi: **Client-Based Locking**, **Server-Based Locking** (ưu tiên), **Adapted Server**.
- **Keep Synchronized Sections Small**.
- **Writing Correct Shut-Down Code Is Hard**: nghĩ về shutdown sớm (deadlock khi child chờ tín hiệu không bao giờ đến).
- **Testing Threaded Code**: *Do not ignore system failures as one-offs*; *get your nonthreaded code working first* (POJO không biết thread); làm code thread **pluggable** (1/nhiều thread, test double nhanh/chậm) và **tunable**; chạy **nhiều thread hơn số CPU**; chạy **trên nhiều nền tảng**; **instrument** để ép lỗi (`yield`, `sleep`; tự động bằng `ThreadJigglePoint.jiggle()` / IBM ConTest).
- **Appendix A highlights**:
  - Throughput: I/O-bound thì nhiều thread giúp; CPU-bound thì cần thêm phần cứng. Dùng **Executor** thay vì tự quản thread.
  - **Atomic?**: gán 32-bit là atomic; `long` không chắc; `++` **không** atomic.
  - **Nonblocking** (CAS) thường nhanh hơn `synchronized`.
  - Xử lý non-thread-safe API: tolerate the failure / client-based locking / **server-based locking (ưu tiên: ít lặp, an toàn hơn)**.
  - **4 điều kiện deadlock**: Mutual exclusion, Lock & wait, No preemption, Circular wait. **Phá một điều kiện là hết deadlock** (ví dụ dùng tài nguyên cho phép dùng đồng thời; lấy đủ tài nguyên trước; cho phép giải phóng; **thứ tự khóa toàn cục**).

## Key Concepts
- **What vs when**.
- **Critical section**, **shared data**.
- **Bound resource, starvation, deadlock, livelock**.
- **Client/Server-based locking**.
- **Jiggling**.
- **4 deadlock conditions**.

## Mental Models
- Mỗi biến mutable được **hai coroutine/thread chạm vào** là một quả bom hẹn giờ. Đếm chúng và giảm về 0 hoặc 1.
- Lỗi "chỉ xảy ra một lần" là **lỗi thật chưa tái hiện được**.

## Anti-patterns
- Trộn logic concurrency vào business logic.
- Chia sẻ state rộng; nhiều chỗ cập nhật cùng dữ liệu.
- Critical section lớn; khóa lồng nhau.
- Bỏ qua flaky test.

## 🤖 Android mapping (chuyển thể, không có trong sách)
| Khái niệm sách | Kotlin Coroutines / Android |
|---|---|
| Thread pool / Executor | `Dispatchers.IO`/`Default`; inject `CoroutineDispatcher` |
| Separate concurrency code (SRP) | UseCase/Repository là suspend thuần; chọn dispatcher ở **một chỗ** (`flowOn(IO)` trong repo, `launchIO` trong VM) |
| Limit scope / copies of data | `data class` immutable + `StateFlow.update {}` (CAS) |
| Nonblocking atomic | `MutableStateFlow.update`, `AtomicInteger`, `AtomicReference` |
| `synchronized` | `Mutex.withLock {}` (không block thread) |
| Producer-Consumer | `Channel`, `Flow` với `buffer()` |
| Readers-Writers | `StateFlow` (nhiều reader, writer qua `update`) |
| Shutdown | **Structured concurrency**: `viewModelScope` tự hủy; `Job.cancelAndJoin()`; luôn rethrow `CancellationException` |
| Jiggling | `StandardTestDispatcher` + `advanceTimeBy`/`runCurrent` để điều khiển thứ tự; chạy `runTest` lặp nhiều lần |
- **Ví dụ trong Satellite2**: `LiveCameraSearchResultViewModel` dùng `Mutex` + `searchJob?.cancelAndJoin()` để tránh search chồng nhau. Đúng tinh thần, nhưng logic concurrency đang **trộn** với logic paging và state (vi phạm SRP của chương này). Đơn giản hơn với Flow operator:
```kotlin
// Concurrency khai báo, một chỗ: mỗi lần tham số đổi thì hủy request cũ (collectLatest/flatMapLatest)
private val searchParams = MutableStateFlow(SearchParams())
init {
    launchIO {
        searchParams
            .debounce(300)
            .distinctUntilChanged()
            .flatMapLatest { params -> searchLiveCameras.stream(params) }   // tự cancel request cũ
            .collect { result -> setState { reduce(result) } }              // reducer thuần, test được
    }
}
fun onKeywordSubmitted(keyword: String) = searchParams.update { it.copy(keyword = keyword, page = 0) }
```
- **Shared mutable state cần tránh**: `var` trong `object` singleton, `companion object` cache `MutableList`, Adapter giữ list bị sửa từ background thread (`BaseListAdapter` của Satellite2 dùng `AsyncListDiffer` với executor chung, nên cần đảm bảo `submitList` nhận list **mới, immutable**).
- **Thread-unsafe library**: `SimpleDateFormat` không thread-safe; dùng `java.time.DateTimeFormatter` (minSdk 28 ✅ có sẵn).
- **Deadlock trên Android**: `runBlocking` trên Main thread chờ coroutine cần Main; `Mutex` không reentrant (gọi `withLock` lồng nhau trên cùng mutex). Phá "lock & wait" bằng cách không giữ lock khi gọi suspend function bên ngoài.
- **Test**: `kotlinx-coroutines-test` + inject dispatcher (`launchIO` hiện cứng `Dispatchers.IO`, nên mở đường inject cho test) để tái hiện race (hai `onSearch` liên tiếp thì chỉ kết quả sau được render).

## Key Takeaways
1. Tách code concurrency khỏi code nghiệp vụ (SRP).
2. Giảm tối đa dữ liệu chia sẻ; ưu tiên immutable/copy.
3. Biết thư viện (Executor, atomic, concurrent collections; trên Android: coroutines/Flow/Mutex).
4. Section đồng bộ nhỏ; ưu tiên server-based locking; thiết kế shutdown sớm.
5. Không bỏ qua "one-off"; test pluggable, tunable, có jiggling.
6. Deadlock cần đủ 4 điều kiện; phá một điều kiện là hết.

## Connects To
- **arch-ch06 (Functional, segregation of mutability)**, **code-ch11 (Systems: tách concern)**, **code-ch09 (F.I.R.S.T.: Repeatable)**.
