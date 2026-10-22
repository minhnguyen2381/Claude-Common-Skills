# Behavioral patterns — Kotlin/Android

Nguồn intent/applicability: refactoring.guru/design-patterns. Mục **Android** là chuyển thể.

---

## Chain of Responsibility

**Intent**: *pass requests along a chain of handlers. Upon receiving a request, each handler decides either to process the request or to pass it to the next handler.*

**Dùng khi**: nhiều loại request xử lý theo nhiều cách · cần chạy các handler theo thứ tự cố định · tập handler/thứ tự đổi lúc runtime.

**Android có sẵn — dùng, đừng tự viết**:
- OkHttp `Interceptor` (auth header, logging, retry): `chain.proceed(request)` = chuyển cho mắt xích sau.
- Touch: `dispatchTouchEvent` → `onInterceptTouchEvent` → `onTouchEvent` trả `true` = đã xử lý.
- `OnBackPressedDispatcher`: callback thêm sau được hỏi trước, chỉ callback `isEnabled`.

**Kotlin idiom (chuỗi tự viết)**
```kotlin
val deepLinkHandlers: List<(Uri) -> Boolean> = listOf(::openProduct, ::openPromo, ::openHome)
fun handle(uri: Uri) = deepLinkHandlers.firstOrNull { it(uri) } ?: Timber.w("Unhandled $uri")
```

**Bẫy**: request có thể không ai xử lý → luôn có nhánh mặc định/log. Với OkHttp: retry trong interceptor chỉ cho method idempotent; `addInterceptor` (1 lần/call) khác `addNetworkInterceptor` (mỗi lần lên mạng).

---

## Command

**Intent**: *turns a request into a stand-alone object that contains all information about the request… pass requests as method arguments, delay or queue a request's execution, and support undoable operations.*

**Dùng khi**: tham số hoá object bằng thao tác · xếp hàng/lên lịch/thực thi từ xa · thao tác đảo ngược được (undo).

**Kotlin/Android idiom**
```kotlin
val onRetry: () -> Unit = { viewModel.reload() }          // command đơn giản = function type

sealed interface EditorAction {                              // command có dữ liệu (MVI intent)
    data class Rotate(val degrees: Int) : EditorAction
    data class Crop(val rect: RectF) : EditorAction
    data object Undo : EditorAction
}
fun onAction(action: EditorAction) { /* reducer */ }
```
- Lệnh phải chạy kể cả khi app bị kill/khởi động lại → `WorkManager` (`OneTimeWorkRequest` là command được hệ thống lưu và xếp hàng).
- `Runnable` post vào `Handler`, `Message` cũng là command.

**Undo**: hai cách — mỗi command có `undo()` (tiết kiệm RAM, khó khi thao tác không đảo được như filter), **hoặc** lưu snapshot state trước mỗi lệnh (Memento, đơn giản và đúng hơn với state immutable).

**Liên quan**: kết hợp Memento cho undo; Command đóng gói hành động, Strategy hoán đổi thuật toán.

---

## Iterator

**Intent**: *traverse elements of a collection without exposing its underlying representation.*

**Kotlin idiom — gần như không bao giờ viết class Iterator**
```kotlin
class Playlist(private val songs: List<Song>) : Iterable<Song> by songs  // uỷ quyền
fun DocNode.walk(): Sequence<DocNode> = sequence {                          // duyệt cây lazy
    val node = this@walk
    yield(node)
    if (node is GroupNode) node.children.forEach { yieldAll(it.walk()) }
}
```

**Android có sẵn**: `Flow` (iterator bất đồng bộ), Paging 3 `PagingSource` (duyệt theo trang), `Cursor`.

**Bẫy**: overkill cho collection đơn giản (refactoring.guru).

---

## Mediator

**Intent**: *reduce chaotic dependencies between objects… restricts direct communications between the objects and forces them to collaborate only via a mediator object.*

**Dùng khi**: khó sửa class vì coupling chặt · component không tái dùng được vì phụ thuộc lẫn nhau.

**Android idiom**: **ViewModel dùng chung** là mediator giữa các Fragment.
```kotlin
class SearchViewModel(private val repo: SearchRepository) : ViewModel() {
    private val _filter = MutableStateFlow(Filter())
    val filter = _filter.asStateFlow()
    private val _selectedId = MutableStateFlow<Long?>(null)
    val selectedId = _selectedId.asStateFlow()
    val results = filter.flatMapLatest { repo.search(it) }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())
    fun updateFilter(f: Filter) { _filter.value = f }
    fun select(id: Long) { _selectedId.value = id }
}
// Fragment con (Koin): private val vm: SearchViewModel by viewModel(ownerProducer = { requireParentFragment() })
// Phạm vi Activity (Koin): by activityViewModel()
```
Phạm vi: con của cùng parent Fragment → `requireParentFragment()`; các màn trong một nav graph → `navGraphViewModels`; cả Activity → `activityViewModels`.

**Bẫy**:
- Fragment gọi thẳng Fragment khác (`findFragmentByTag(...) as MapFragment`), EventBus/global singleton → đúng thứ Mediator muốn loại bỏ.
- Mediator thành **god object** (refactoring.guru). ViewModel dùng chung chỉ giữ state **chia sẻ**; state riêng của từng màn để ở ViewModel riêng.

**Liên quan**: Facade che subsystem nhưng các phần tử vẫn biết nhau; Observer là cơ chế để component nghe mediator.

---

## Memento

**Intent**: *save and restore the previous state of an object without revealing the details of its implementation.*

**Dùng khi**: cần snapshot để khôi phục (undo, restore) · truy cập trực tiếp field sẽ phá encapsulation.

**Kotlin idiom**: UiState là `data class` immutable → **chính nó là memento**; history là `ArrayDeque` có giới hạn.
```kotlin
class History<T>(private val limit: Int = 20) {
    private val undo = ArrayDeque<T>(); private val redo = ArrayDeque<T>()
    fun push(state: T) { undo.addLast(state); if (undo.size > limit) undo.removeFirst(); redo.clear() }
    fun undo(current: T): T? = undo.removeLastOrNull()?.also { redo.addLast(current) }
    fun redo(current: T): T? = redo.removeLastOrNull()?.also { undo.addLast(current) }
}
```

**Android có sẵn**: `onSaveInstanceState(Bundle)`, `SavedStateHandle`, `View.onSaveInstanceState(): Parcelable` (snapshot "mờ" đúng nghĩa memento), `@Parcelize`.

**Sống qua process death — quy tắc Bundle**:
- Bundle đi qua Binder, giới hạn ~1 MB **cho cả transaction**; Android khuyên < 50 KB → vượt là `TransactionTooLargeException`.
- **Không** đưa `Bitmap`, ảnh, list lớn, cả undo stack vào `SavedStateHandle`. Lưu file/Room (`cacheDir`), chỉ để **đường dẫn/id + vài tham số nhỏ** trong `SavedStateHandle`.
- Undo stack thường **không cần** sống qua process death; nếu cần thì lưu danh sách thao tác nhỏ (command log) chứ không lưu ảnh.

**Bẫy**: snapshot quá dày tốn RAM (ảnh full-size × 20 bước) → lưu tham số thao tác, render lại từ ảnh gốc.

**Liên quan**: đi cùng Command cho undo; Prototype (`copy()`) là phương án đơn giản hơn.

---

## Observer

**Intent**: *define a subscription mechanism to notify multiple objects about any events that happen to the object they're observing.*

**Kotlin/Android idiom — không tự viết `listeners: MutableList<Listener>`**

| Cần | Dùng |
|---|---|
| State hiện tại (UI render lại được) | `StateFlow` |
| Event một lần (toast, navigate) | `Channel(BUFFERED).receiveAsFlow()` hoặc `SharedFlow` |
| Bọc listener API cũ | `callbackFlow { …; awaitClose { remove } }` |
| Nghe lifecycle | `DefaultLifecycleObserver` |
| Một property trong class | `Delegates.observable` |

```kotlin
viewLifecycleOwner.lifecycleScope.launch {
    viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) { viewModel.state.collect(::render) }
}
```

**Bẫy**: listener list tự viết giữ tham chiếu Fragment → leak; collect trong `lifecycleScope` thiếu `repeatOnLifecycle` → chạy cả khi ở background; `launchWhenStarted` đã deprecated; event một lần đặt trong `StateFlow` → bắn lại sau khi xoay màn hình.

**Android có sẵn**: `Flow`, `LiveData` (legacy), `BroadcastReceiver`, `Lifecycle`.

---

## State

**Intent**: *lets an object alter its behavior when its internal state changes. It appears as if the object changed its class.*

**Dùng khi**: object hành xử khác nhau theo state · class đầy `if/when` theo giá trị hiện tại · trùng code giữa các state/transition.

**Kotlin idiom**: `sealed interface` + hàm chuyển trạng thái thuần + `StateFlow`. `when` exhaustive bắt compiler kiểm tra đủ state.
```kotlin
sealed interface PlayerState {
    data object Idle : PlayerState
    data object Preparing : PlayerState
    data object Playing : PlayerState
    data object Paused : PlayerState
    data object Ended : PlayerState
    data class Error(val cause: Throwable) : PlayerState
}
// vị trí phát đổi mỗi frame → đọc player.currentPosition, không nhét vào state

fun PlayerState.canPause() = this == PlayerState.Playing          // UI bật/tắt nút từ đây
fun PlayerState.canPlay() = this == PlayerState.Paused || this == PlayerState.Ended

class PlayerController(private val player: ExoPlayer) {
    private val _state = MutableStateFlow<PlayerState>(PlayerState.Idle)
    val state = _state.asStateFlow()

    fun pause() {
        if (!_state.value.canPause()) { Timber.w("pause() ignored in ${_state.value}"); return }
        player.pause()   // Player.Listener chuyển _state sang Paused (xem dòng Media3 bên dưới)
    }
}
```
- Hành vi mỗi state **lớn** (nhiều hàm, nhiều logic riêng) → mỗi state một class implement chung interface (State cổ điển). Hành vi nhỏ → `when` trên sealed là đủ.
- Media3: dùng `Player.Listener.onPlaybackStateChanged` + `isPlaying` để **chuyển** state, đừng tự đoán.

**Bẫy**: "boolean soup" (`isLoading`, `isError`, `isPlaying` cùng lúc true); đổi state từ nhiều chỗ thay vì một hàm; nuốt im lặng transition sai (ít nhất phải log). refactoring.guru: State cổ điển là **overkill** khi ít state và ít thay đổi.

**Liên quan**: State là mở rộng của Strategy, nhưng các state biết nhau và tự chuyển.

---

## Strategy

**Intent**: *define a family of algorithms, put each of them into a separate class, and make their objects interchangeable.*

**Dùng khi**: đổi biến thể thuật toán lúc runtime · nhiều class chỉ khác cách làm một việc · tách business logic khỏi chi tiết thuật toán · có `when` lớn chọn giữa các biến thể.

**Kotlin idiom**
```kotlin
// Ít logic → function type / fun interface
fun interface PriceFormatter { fun format(amount: Long): String }
val vnd = PriceFormatter { "%,d ₫".format(it) }

// Nhiều logic + dependency → interface + Koin getAll()
interface PaymentMethod { val type: PaymentType; suspend fun pay(req: PaymentRequest): PaymentResult }
val paymentModule = module {
    singleOf(::CardPayment) bind PaymentMethod::class
    singleOf(::MomoPayment) bind PaymentMethod::class
    single { PaymentProcessor(getAll()) }   // associateBy { it.type }
}
```

**Android có sẵn**: `RecyclerView.LayoutManager` (Linear/Grid/Staggered), `Comparator`, `TimeInterpolator`, `DiffUtil.ItemCallback`, Glide `DiskCacheStrategy`, `TransformationMethod`.

**Bẫy (refactoring.guru)**: chỉ có vài thuật toán ít đổi → đừng làm phức tạp; *"modern languages… may not require multiple classes and interfaces"* → lambda trước.

**Liên quan**: Strategy dựa trên composition, Template Method dựa trên kế thừa; State mở rộng Strategy.

---

## Template Method

**Intent**: *defines the skeleton of an algorithm in the superclass but lets subclasses override specific steps of the algorithm without changing its structure.*

**Dùng khi**: cho phép mở rộng **một số bước** của thuật toán · nhiều class có thuật toán gần giống nhau · gom code trùng lên superclass.

**Android có sẵn**: lifecycle `Activity`/`Fragment` (framework gọi `onCreate…onDestroy`), `Worker.doWork()`/`CoroutineWorker`, `RecyclerView.Adapter.onCreateViewHolder/onBindViewHolder`.

**BaseFragment**: nếu project đã có base kit (vd. `BaseFragment<Binding, VM>` với hook `init()`/`subscribeObserver()`), **dùng đúng base kit đó**. Với dự án Piontech: **REQUIRED SUB-SKILL** `pion-android-coding-style`.

**Thêm một bước mà mọi màn đều cần vào kit có sẵn** (vd. log `screen_view`): gọi bước đó trong hàm khung của base, dữ liệu riêng từng màn lấy qua hook `abstract` để compiler ép cả 30 màn khai báo.
```kotlin
protected abstract val screenName: String          // R8 làm méo javaClass.simpleName → khai báo tay
final override fun onViewCreated(view: View, s: Bundle?) {
    super.onViewCreated(view, s)
    analytics.logScreenView(screenName)            // bước mới của khung
    init(); subscribeObserver()
}
```

**Kotlin idiom khi tự viết**: hàm khung ghi `final override` (member `override` **vẫn open** nếu không ghi `final`; chỉ member khai báo mới mới final mặc định), các bước là `abstract`/`open`.
```kotlin
abstract class BaseFragment<VB : ViewBinding>(private val inflate: (LayoutInflater, ViewGroup?, Boolean) -> VB) : Fragment() {
    private var _binding: VB? = null
    protected val binding get() = _binding!!
    final override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?) = inflate(i, c, false).also { _binding = it }.root
    final override fun onViewCreated(view: View, s: Bundle?) { initView(); observe() }  // khung cố định
    protected abstract fun initView()
    protected open fun observe() {}                                                        // hook tuỳ chọn
    override fun onDestroyView() { _binding = null; super.onDestroyView() }
}
```

**Bẫy**: base class "làm mọi thứ" — toolbar, loading, error dialog, ads… bật/tắt bằng flag hoặc hook trả `null` → màn không dùng vẫn kéo theo (vi phạm ISP; vi phạm LSP khi subclass phải tắt hành vi cha). Phân loại theo **số màn dùng**:
- Mọi màn đều cần (inflate binding, `screen_view`) → bước trong khung base class.
- Chỉ một số màn (error dialog, toolbar, banner ads) → composition, màn nào cần thì gọi:
```kotlin
fun Fragment.showErrorDialogOn(errors: Flow<String>) {
    viewLifecycleOwner.lifecycleScope.launch {
        viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) { errors.collect { /* show dialog của project */ } }
    }
}
// trong subscribeObserver() của 5 màn cần: showErrorDialogOn(viewModel.errors)
```
Các cách composition khác: `DefaultLifecycleObserver`, delegate property.

**Liên quan**: Factory Method là trường hợp riêng; Strategy là phương án composition thay cho kế thừa.

---

## Visitor

**Intent**: *separate algorithms from the objects on which they operate.*

**Dùng khi**: chạy một thao tác trên mọi phần tử của cấu trúc phức tạp · dọn logic phụ ra khỏi class chính · thao tác chỉ có nghĩa với một số class trong hierarchy.

**Kotlin idiom — hierarchy là của mình và `sealed`**: mỗi thao tác là một extension function với `when` exhaustive. Không cần `accept(visitor)`/double dispatch: thêm subtype mới thì compiler báo lỗi ở **mọi** `when`, đúng lợi ích mà Visitor nhắm tới.
```kotlin
fun DocNode.toHtml(): String = when (this) {
    is TextNode -> "<p>${text.htmlEncode()}</p>"
    is ImageNode -> """<img src="$url" width="$w" height="$h">"""
    is GroupNode -> children.joinToString("", "<div>", "</div>") { it.toHtml() }
}
fun DocNode.imageCount(): Int = when (this) {
    is TextNode -> 0
    is ImageNode -> 1
    is GroupNode -> children.sumOf { it.imageCount() }
}
```
Không dùng `else ->` trong các `when` này: `else` tắt kiểm tra exhaustive.

**Visitor cổ điển (`interface Visitor<R>` + `fun <R> accept(v: Visitor<R>): R`) chỉ khi**: hierarchy **không sealed** (open, nằm ở module/library khác, subtype do người khác thêm) **hoặc** cần dispatch theo hai hierarchy cùng lúc.

**Nhược (refactoring.guru)**: thêm/bớt class trong hierarchy thì phải sửa mọi visitor; visitor không truy cập được field private.

**Liên quan**: đi cùng Composite (duyệt cây) và Iterator; là phiên bản mạnh của Command.
