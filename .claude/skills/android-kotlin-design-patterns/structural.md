# Structural patterns — Kotlin/Android

Nguồn intent/applicability: refactoring.guru/design-patterns. Mục **Android** là chuyển thể.

---

## Adapter

**Intent**: *allows objects with incompatible interfaces to collaborate.*

**Dùng khi**: muốn dùng một class có sẵn nhưng interface không khớp với code của mình · muốn tái dùng nhiều subclass thiếu chung một chức năng.

**Kotlin/Android idiom**
```kotlin
// 1) Đổi dữ liệu: extension mapper (Adapter nhẹ nhất)
fun UserDto.toDomain() = User(id = id, name = fullName.orEmpty())

// 2) Callback API → suspend
suspend fun FusedLocationProviderClient.awaitLastLocation(): Location? =
    suspendCancellableCoroutine { cont ->
        lastLocation.addOnSuccessListener { cont.resume(it) }
            .addOnFailureListener { cont.resumeWithException(it) }
    }

// 3) Listener API → Flow
fun EditText.textChanges(): Flow<CharSequence> = callbackFlow {
    val watcher = doAfterTextChanged { trySend(it ?: "") }
    awaitClose { removeTextChangedListener(watcher) }
}
```

**Android có sẵn**: `RecyclerView.Adapter` (data → ViewHolder), Retrofit `CallAdapter`/`Converter`, `ArrayAdapter`.

**Không dùng khi**: sửa được chính class kia cho khớp. refactoring.guru: *"Sometimes it's simpler to change the service class."*

**Liên quan**: Adapter **đổi** interface, Decorator **giữ/mở rộng** interface, Proxy **giữ nguyên** interface, Facade **tạo interface mới** cho cả subsystem.

---

## Bridge

**Intent**: *split a large class or a set of closely related classes into two separate hierarchies—abstraction and implementation—which can be developed independently.*

**Dùng khi**: một class phình vì có nhiều biến thể · cần mở rộng theo **hai chiều độc lập** (N×M subclass) · cần đổi implementation lúc runtime.

**Triệu chứng**: tên class kiểu `SimpleSystemNotice`, `SimpleSnackbarNotice`, `ProgressSystemNotice`… (tích Descartes).

**Kotlin idiom**: chiều "abstraction" giữ tham chiếu (constructor-injected) tới interface của chiều "implementation".
```kotlin
interface NoticeChannel { fun show(title: String, body: String, progress: Int?) }  // implementation
class SystemNotificationChannel(private val ctx: Context) : NoticeChannel { /* NotificationCompat */ }
class SnackbarChannel(private val host: () -> View?) : NoticeChannel { /* Snackbar */ }

sealed class Notice(protected val channel: NoticeChannel) {                         // abstraction
    abstract fun send()
}
class SimpleNotice(channel: NoticeChannel, private val msg: String) : Notice(channel) {
    override fun send() = channel.show("Info", msg, null)
}
class ProgressNotice(channel: NoticeChannel, private val percent: Int) : Notice(channel) {
    override fun send() = channel.show("Downloading", "$percent%", percent)
}
// 2 kiểu + 3 kênh = 5 class, không phải 6; thêm kênh = +1 class.
```

**Không dùng khi**: chỉ một chiều biến thiên → đó là Strategy; class vốn rất gắn kết (cohesive).

**Bridge vs Strategy vs State** (cấu trúc giống nhau — một object giữ tham chiếu tới interface — mục đích khác):

| | Bridge | Strategy | State |
|---|---|---|---|
| Số chiều biến thiên | 2, độc lập (N×M) | 1 | 1 (trạng thái) |
| Ai chọn biến thể | nơi lắp ráp (DI), lúc tạo | client, lúc tạo hoặc runtime | chính object, theo luật chuyển |
| Các biến thể biết nhau? | không | không | có (state quyết định state kế) |
| Bên "abstraction" có hierarchy riêng? | có | không | không |
| Ví dụ Android | kiểu thông báo × kênh hiển thị | `LayoutManager`, `Comparator` | player Idle/Playing/Paused |

**Liên quan**: Bridge thiết kế **từ đầu**, Adapter **chữa cháy** cho class có sẵn.

---

## Composite

**Intent**: *compose objects into tree structures and then work with these structures as if they were individual objects.*

**Dùng khi**: model cốt lõi là **cây** · client muốn xử lý lá và nhánh như nhau.

**Kotlin idiom**: sealed hierarchy + đệ quy.
```kotlin
sealed interface MenuNode { val price: Long }
data class Item(val name: String, override val price: Long) : MenuNode
data class Combo(val children: List<MenuNode>) : MenuNode {
    override val price get() = children.sumOf { it.price }
}
```

**Android có sẵn**: `View`/`ViewGroup` (ví dụ kinh điển: `measure/layout/draw` đệ quy), `ConcatAdapter` (gộp nhiều adapter thành một), `PreferenceGroup`.

**Bẫy**: ép interface chung cho các node quá khác nhau → interface phình, nhiều hàm "không hỗ trợ".

**Liên quan**: dựng bằng Builder; duyệt bằng Iterator; thao tác toàn cây bằng Visitor; lá dùng chung có thể là Flyweight; CoR hay đi trên cây Composite.

---

## Decorator

**Intent**: *attach new behaviors to objects by placing these objects inside special wrapper objects that contain the behaviors.*

**Dùng khi**: cần thêm hành vi lúc runtime mà không đổi client · không thể/khó kế thừa (class `final` — mặc định trong Kotlin).

**Kotlin idiom**: interface delegation `by` — chỉ override hàm cần trang trí.
```kotlin
class CachingUserRepository(
    private val inner: UserRepository,
) : UserRepository by inner {
    private val cache = LruCache<Long, User>(100)   // androidx.collection: thread-safe, có giới hạn
    override suspend fun getUser(id: Long): User =
        cache.get(id) ?: inner.getUser(id).also { cache.put(id, it) }
    override suspend fun updateUser(user: User) = inner.updateUser(user).also { cache.remove(user.id) } // hàm ghi phải invalidate
    fun clear() = cache.evictAll()                  // gọi khi logout
}

val dataModule = module {
    single<UserRepository> { CachingUserRepository(RemoteUserRepository(get())) } // single: factory thì mỗi nơi một cache
}
```
**Bẫy riêng của `by inner`**: mọi hàm không override đi thẳng xuống `inner`, kể cả hàm **ghi** và hàm mới thêm vào interface sau này → cache cũ mà không ai báo. Khi bọc cache, rà lại từng hàm ghi. `mutableMapOf` + `getOrPut` trong hàm `suspend` không thread-safe.

**Android có sẵn**: `ContextWrapper`/`ContextThemeWrapper` (trang trí `Context`), `BufferedInputStream`, toán tử Flow (`map`, `onEach`, `retry`, `catch` bọc một Flow thành Flow mới).

**Bẫy**: thứ tự wrapper ảnh hưởng hành vi; khó gỡ một lớp ở giữa; cấu hình nhiều lớp trông rối.

**Liên quan**: Decorator đổi "vỏ", Strategy đổi "ruột"; giống cấu trúc Composite và CoR (đệ quy).

---

## Facade

**Intent**: *provides a simplified interface to a library, a framework, or any other complex set of classes.*

**Dùng khi**: cần interface hẹp, dễ dùng cho một subsystem phức tạp · muốn phân tầng subsystem.

**Android**: Repository (che Room + Retrofit + cache) · lớp bọc SDK quảng cáo/analytics/billing để feature chỉ gọi `ads.showInterstitial(activity)` · `Glide.with(ctx).load(url).into(iv)` · `WorkManager`.

```kotlin
class AnalyticsTracker(private val firebase: FirebaseAnalytics, private val appsFlyer: AppsFlyerLib) {
    fun logPurchase(sku: String, price: Double) {
        firebase.logEvent("purchase", bundleOf("sku" to sku, "value" to price))
        appsFlyer.logEvent(/* … */)
    }
}
```

**Bẫy (refactoring.guru)**: *"can become a god object coupled to all classes of an app."* Facade chỉ forward 1:1 từng hàm của SDK = lớp thừa.

**Liên quan**: Facade tạo interface **mới**, Adapter làm interface **cũ** dùng được; Facade khác Mediator ở chỗ các component vẫn biết nhau.

---

## Flyweight

**Intent**: *fit more objects into the available amount of RAM by sharing common parts of state between multiple objects.*

**Dùng khi** (cả ba): số object **khổng lồ**, gần chạm RAM · object giống nhau nhiều · có state trùng lặp tách ra dùng chung được (intrinsic) còn phần riêng truyền vào lúc dùng (extrinsic).

**Android đã làm sẵn — kiểm tra trước khi tự viết**:
- `RecyclerView` chỉ tạo đủ ViewHolder cho màn hình rồi tái sử dụng; 5000 item ≠ 5000 view. Extrinsic state truyền trong `onBindViewHolder`. Nested RecyclerView: chia sẻ `RecycledViewPool`.
- `Drawable` từ cùng resource chia sẻ `ConstantState`; `ResourcesCompat.getFont()` cache `Typeface`; `Message.obtain()` dùng pool; Glide có `LruCache` + `BitmapPool`.
- Hằng số/style dùng chung: `companion object` / `object` (một instance `Paint`, `Typeface`, formatter).

**Bẫy**:
- RAM tăng khi scroll list thường do **bitmap quá to** (load full-size), tạo `Paint`/`Typeface`/`SimpleDateFormat` trong `onBind`/`onDraw`, hoặc leak ViewHolder — **không phải** do thiếu Flyweight. Đo bằng Android Studio Memory Profiler/LeakCanary trước.
- Đổi tint một drawable dùng chung mà quên `mutate()` → đổi màu mọi chỗ khác.

**Liên quan**: lá dùng chung của Composite; giống Singleton nhưng nhiều instance.

---

## Proxy

**Intent**: *provide a substitute or placeholder for another object. A proxy controls access to the original object.*

**Dùng khi**: lazy init object nặng (virtual proxy) · kiểm soát quyền truy cập (protection) · gọi dịch vụ từ xa như local (remote) · log request · cache kết quả.

**Kotlin idiom**
```kotlin
private val interpreter by lazy { Interpreter(loadModelFile()) }  // virtual proxy: chỉ load model khi dùng
class HomeFragment : Fragment() { private val ads: AdManager by inject() } // Koin: lazy injection
class PremiumGuard(private val inner: Exporter, private val billing: Billing) : Exporter by inner {
    override fun exportHd(file: File) { check(billing.isPremium) { "Premium only" }; inner.exportHd(file) }
} // protection proxy
```

**Android có sẵn**: `Retrofit.create()` trả về dynamic `java.lang.reflect.Proxy`; Room sinh `XxxDao_Impl`; AIDL/Binder `Stub.Proxy` (remote proxy).

**Decorator hay Proxy?** Cả hai giữ interface và có thể cache. Phân biệt theo **ai tạo object thật**:
- Wrapper **nhận** object thật từ ngoài (constructor/Koin), có thể xếp chồng nhiều lớp → **Decorator** (vd. `CachingUserRepository(inner)`).
- Wrapper **tự tạo/giữ** object thật (lazy, theo quyền, qua IPC), client không biết object thật tồn tại → **Proxy** (vd. `by lazy { Interpreter(...) }`, Retrofit `create()`).
