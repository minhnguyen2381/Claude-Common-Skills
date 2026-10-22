# Creational patterns — Kotlin/Android

Nguồn intent/applicability: refactoring.guru/design-patterns. Kotlin idiom: dbacinski/Design-Patterns-In-Kotlin + Kotlin docs. Mục **Android** là chuyển thể, không phải lời của refactoring.guru.

---

## Factory Method

**Intent**: *provides an interface for creating objects in a superclass, but allows subclasses to alter the type of objects that will be created.*

**Dùng khi**: chưa biết trước loại object cụ thể · muốn cho người dùng library mở rộng component nội bộ · muốn tái sử dụng object thay vì tạo mới.

**Kotlin idiom**
```kotlin
// 1) Hàm trả về interface: đủ cho 90% trường hợp
fun createPlayer(type: MediaType): Player = when (type) {
    MediaType.AUDIO -> AudioPlayer()
    MediaType.VIDEO -> VideoPlayer()
}

// 2) Static factory trong companion (tên có nghĩa, có thể cache/validate)
class DetailFragment : Fragment() {
    companion object { fun newInstance(id: Long) = DetailFragment().apply { arguments = bundleOf(KEY_ID to id) } }
}
```

**Android có sẵn**: `ViewModelProvider.Factory` / `viewModelFactory { initializer { } }`, `Fragment.newInstance()`, Retrofit `Converter.Factory` / `CallAdapter.Factory`, `LayoutInflater.Factory2`. Koin `factory { }` là factory cho mọi object có dependency.

**Không dùng khi**: chỉ có **một** sản phẩm, không tham số runtime → gọi constructor hoặc để Koin tạo. `interface XFactory { fun create(): X }` + 1 implementation là lớp gián tiếp thừa.

**Liên quan**: hay tiến hoá thành Abstract Factory/Builder/Prototype; là trường hợp riêng của Template Method.

---

## Abstract Factory

**Intent**: *lets you produce families of related objects without specifying their concrete classes.*

**Dùng khi**: code phải làm việc với nhiều **họ** sản phẩm liên quan và các sản phẩm trong một họ phải đi cùng nhau · muốn tránh phụ thuộc vào class cụ thể.

**Kotlin/Android idiom**: một interface có N hàm `create…`, **hoặc** một Koin module cho mỗi họ, **hoặc** product flavor source set (`src/admob/`, `src/applovin/`) như một abstract factory ở compile-time.
```kotlin
interface AdFactory {
    fun banner(context: Context): BannerAd
    fun interstitial(): InterstitialAd
    fun native(): NativeAd
}
class AdMobFactory : AdFactory { /* 3 sản phẩm cùng họ AdMob */ }

val adModule = module { single<AdFactory> { AdMobFactory() } } // đổi họ = đổi 1 dòng
```

**Không dùng khi**: chỉ có một họ, hoặc các sản phẩm không ràng buộc nhau → mỗi sản phẩm một binding Koin riêng là đủ.

**Liên quan**: thường gồm nhiều Factory Method; có thể thay Facade để giấu việc khởi tạo; hay đi cùng Bridge.

---

## Builder

**Intent**: *lets you construct complex objects step by step… produce different types and representations of an object using the same construction code.*

**Dùng khi**: object có nhiều tham số tuỳ chọn · cần dựng nhiều biểu diễn qua cùng các bước · dựng cây Composite.

**Kotlin idiom (thay Builder class)**
```kotlin
data class ExportConfig(
    val format: Format = Format.PNG,
    val quality: Int = 90,
    val watermark: String? = null,
) { init { require(quality in 1..100) } }

val cfg = ExportConfig(format = Format.JPEG)   // named + default args
val low = cfg.copy(quality = 60)                // biến thể
val args = bundleOf("id" to 1L)                 // DSL có sẵn
val list = buildList { add(a); if (x) add(b) }  // builder function của stdlib
```

**Vẫn cần Builder thật khi**: có caller Java (hoặc dùng `@JvmOverloads`) · dựng **từng bước qua nhiều hàm/nhiều nơi** rồi mới `build()` · ràng buộc giữa các bước chỉ kiểm được lúc `build()` · muốn DSL (`lambda with receiver`).

**Android có sẵn**: `AlertDialog.Builder`, `NotificationCompat.Builder`, `Retrofit.Builder`, `OkHttpClient.Builder`, `Room.databaseBuilder`, `OneTimeWorkRequestBuilder<W>()`, `Uri.Builder`. Dùng chúng, đừng bọc thêm builder của mình.

**Bẫy**: viết `class Builder { fun setX(x) = apply { … } }` cho data class Kotlin → nhân đôi số field phải bảo trì.

**Liên quan**: Abstract Factory trả sản phẩm ngay, Builder dựng từng bước; Builder hợp với Composite.

---

## Prototype

**Intent**: *lets you copy existing objects without making your code dependent on their classes.*

**Dùng khi**: code không nên phụ thuộc class cụ thể của object cần copy · muốn bớt subclass chỉ khác nhau ở cách khởi tạo (preset).

**Kotlin idiom**: `data class` + `copy()`.
```kotlin
val defaultStyle = TextStyle(sizeSp = 14f, color = Color.BLACK, tags = listOf("body"))
val title = defaultStyle.copy(sizeSp = 20f)   // preset → biến thể
```

**Bẫy**: `copy()` là **shallow copy**. Nếu field là `MutableList`/`Array`/object mutable thì bản copy dùng chung tham chiếu. Giữ field immutable (`List`, `val`) hoặc tự copy sâu field đó.

**Android có sẵn**: `Intent(other)`, `Bundle(other)`, `Bitmap.copy(config, mutable)`, `Paint(paint)`, `Drawable.constantState?.newDrawable()` + `mutate()` (drawable cùng resource **chia sẻ state**, phải `mutate()` trước khi đổi tint/alpha).

**Liên quan**: thay thế đơn giản cho Memento khi object không có dependency ngoài; hữu ích khi lưu Command vào history.

---

## Singleton

**Intent**: *ensure that a class has only one instance, while providing a global access point to this instance.*

**Nhược điểm (refactoring.guru)**: vi phạm SRP · che giấu thiết kế tồi (component biết quá nhiều về nhau) · cần xử lý đa luồng · **khó unit test**.

**Kotlin/Android idiom — chọn theo dependency**

| Trường hợp | Dùng |
|---|---|
| Không cần tham số, không giữ Context | `object Foo` (thread-safe, lazy khi truy cập lần đầu) |
| Cần Context / dependency / cần fake trong test | class thường + Koin `single { Foo(androidContext(), get()) }` |
| Giá trị tính 1 lần trong 1 class | `private val x by lazy { … }` (mặc định synchronized) |

```kotlin
class SessionManager(context: Context) { /* SharedPreferences… */ }
val appModule = module { single { SessionManager(androidContext()) } } // applicationContext → không leak
```

**Bắt buộc single trong app**: `RoomDatabase`, `OkHttpClient`, `Retrofit` (tạo nhiều = tốn connection pool/thread, Room sai invalidation).

**Bẫy**:
- `getInstance(context)` lưu thẳng `context` được truyền vào (thường là `this` của Activity) vào biến static → **leak Activity** suốt đời process. Tối thiểu phải `context.applicationContext`; tốt hơn là Koin `single` với `androidContext()`.
- `object` có `lateinit var context` + `fun init(context)` → quên init, leak Activity, khó test.
- `companion object` + `@Volatile` + double-checked locking: bản dịch từ Java, trong Kotlin không cần.
- Singleton **không sống qua process death**. State quan trọng phải nằm ở Room/DataStore/SavedStateHandle.

**Liên quan**: Facade thường chỉ cần một instance; Flyweight giống Singleton nhưng có nhiều instance với intrinsic state khác nhau.
