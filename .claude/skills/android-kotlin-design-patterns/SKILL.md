---
name: android-kotlin-design-patterns
description: Use when choosing, implementing, reviewing or explaining a GoF design pattern (Singleton, Factory, Builder, Adapter, Decorator, Facade, Proxy, Observer, Strategy, State, Command, Memento, Visitor, Mediator, Template Method...) in Android/Kotlin code, when code looks like a Java pattern ported to Kotlin, or when asked which pattern fits an Android problem ("dùng pattern gì", "áp dụng design pattern", "refactoring guru").
---

# Design Patterns cho Android/Kotlin

**Nguồn**: refactoring.guru/design-patterns (intent, applicability, pros/cons, relations của 22 pattern GoF) · dbacinski/Design-Patterns-In-Kotlin (Kotlin idiom) · Outcome School *Design Patterns in Android Libraries*. Phần Android/Kotlin là **chuyển thể**. Khi được hỏi giải thích/dạy một pattern, trích intent refactoring.guru (tiếng Anh), rồi mới diễn giải và cho ví dụ Android.

Nguyên tắc nền (SOLID, OCP, DIP, boundaries) → `clean-arch-code-android`.

## Nguyên tắc cốt lõi

Pattern là **tên của một vấn đề đã có lời giải**, không phải mục tiêu. Kotlin và Android SDK đã đưa phần lớn GoF vào ngôn ngữ/thư viện. Chọn theo thang, dừng ở bậc đầu tiên đủ dùng:

1. **Vấn đề có thật chưa?** (≥2 biến thể thật, `when` lớn thật, code trùng thật). Chưa → không cần pattern.
2. **Project đã có?** (base kit, interceptor, repository, mapper…) → dùng lại. Dự án Piontech: **REQUIRED SUB-SKILL** `pion-android-coding-style`.
3. **Android/thư viện đã implement?** (cột "Có sẵn") → dùng nó.
4. **Kotlin idiom?** (cột "Kotlin") → dùng nó.
5. Mới viết bản GoF cổ điển, kèm một dòng lý do vì sao bậc 1–4 không đủ.

## Quick reference

| Pattern | Dấu hiệu cần | Kotlin | Có sẵn trên Android |
|---|---|---|---|
| Factory Method | tạo object theo loại lúc runtime | hàm trả interface, `companion fun newInstance`, Koin `factory` | `ViewModelProvider.Factory`, Retrofit `Converter.Factory` |
| Abstract Factory | họ sản phẩm phải đi cùng nhau | interface N hàm `create…`; Koin module / product flavor theo họ | — |
| Builder | nhiều tham số tuỳ chọn | named + default args, `copy()`, `buildList`, `bundleOf` | `NotificationCompat.Builder`, `Retrofit.Builder` |
| Prototype | copy không phụ thuộc class | `data class.copy()` (shallow!) | `Intent(other)`, `Drawable.mutate()` |
| Singleton | đúng 1 instance | `object` (không Context); Koin `single` (có dependency) | Room DB, `OkHttpClient` bắt buộc single |
| Adapter | interface không khớp | extension mapper, `suspendCancellableCoroutine`, `callbackFlow` | `RecyclerView.Adapter`, `CallAdapter` |
| Bridge | 2 chiều biến thiên (N×M class) | inject interface của chiều thứ 2 qua constructor | — |
| Composite | cây; lá và nhánh xử lý như nhau | sealed + đệ quy | `ViewGroup`, `ConcatAdapter` |
| Decorator | thêm hành vi, giữ interface | `class X(inner: I) : I by inner` | `ContextWrapper`, toán tử Flow |
| Facade | API gọn cho subsystem rối | class bọc SDK; Repository | Glide, WorkManager |
| Flyweight | RAM vì quá nhiều object giống nhau | share qua `object`/Koin `single`; **đo trước** | RecyclerView recycle, `ConstantState`, `Message.obtain()` |
| Proxy | lazy / guard / cache / remote, giữ interface | `by lazy`, Koin `by inject()`, `by` delegation | Retrofit `create()`, Room `_Impl`, Binder |
| Chain of Resp. | chuỗi handler có thứ tự | `handlers.firstOrNull { it(req) }` | OkHttp `Interceptor`, touch dispatch, `OnBackPressedDispatcher` |
| Command | hoãn / xếp hàng / undo thao tác | `() -> Unit`, sealed `Action` | `WorkRequest`, `Runnable` + `Handler` |
| Iterator | duyệt cấu trúc mà giấu bên trong | `Iterable by list`, `sequence { yield() }` | `Flow`, Paging 3, `Cursor` |
| Mediator | nhiều component gọi chéo nhau | ViewModel dùng chung | `activityViewModels`, `navGraphViewModels`, `requireParentFragment()` |
| Memento | snapshot để undo/restore | data class immutable + `ArrayDeque` có giới hạn | `SavedStateHandle`, `onSaveInstanceState` (Bundle ≤ ~50 KB) |
| Observer | báo thay đổi cho nhiều bên | `StateFlow` (state), `Channel`/`SharedFlow` (event), `callbackFlow` | `Flow`, `Lifecycle`, `LiveData` |
| State | hành vi đổi theo trạng thái | sealed state + `when` + `StateFlow` | — |
| Strategy | hoán đổi thuật toán | function type / `fun interface`; interface + Koin `getAll()` | `LayoutManager`, `Comparator`, `Interpolator` |
| Template Method | khung cố định, vài bước thay đổi | hook `abstract`/`open`, khung `final` | lifecycle callback, `Worker.doWork()` |
| Visitor | thêm thao tác cho hierarchy | extension fun + `when` exhaustive trên sealed | — |

Chi tiết từng pattern (intent nguyên văn, dùng khi, code, bẫy, quan hệ): `creational.md`, `structural.md`, `behavioral.md`. Hỏi sâu về một pattern → **đọc mục đó trước khi trả lời**.

## Base class (Template Method)

- Project đã có `BaseFragment`/`BaseViewModel`/`BaseDialogFragment` → đọc kit đó (`base/`) và mở rộng nó. Không viết base class song song.
- Hành vi **mọi** màn đều cần → thêm bước vào khung (`final override`) + hook `abstract` cho dữ liệu riêng từng màn.
- Hành vi chỉ **một số** màn cần → composition (extension function, `DefaultLifecycleObserver`, delegate). Không bật/tắt bằng flag trong base.
- Mẫu code: mục Template Method trong `behavioral.md`.

## Dấu hiệu "port từ Java" khi review

| Thấy | Đề xuất |
|---|---|
| `companion object` + `@Volatile` + double-checked locking | `object` nếu không cần tham số; có `Context`/dependency → class thường + Koin `single` |
| `getInstance(context)` lưu `context` vào static | leak Activity → Koin `single { X(androidContext()) }` |
| `object` + `lateinit var context` + `fun init(context)` | class nhận Context qua constructor + Koin `single` |
| `class Builder` cho data class Kotlin | named/default args + `copy()` (`@JvmOverloads` nếu có caller Java) |
| `interface XFactory` + 1 impl, `create()` không tham số | constructor / Koin binding |
| `listeners: MutableList<Listener>` + register/unregister | `StateFlow`/`SharedFlow`; `callbackFlow` để bọc API cũ |
| Visitor `accept()` trên sealed hierarchy của chính mình | extension + `when` exhaustive, **không** `else` |
| Tự viết Flyweight cho list tốn RAM | profile; giảm size bitmap; không tạo `Paint`/`Typeface` trong `onBind` |
| Bitmap / list lớn / cả undo stack trong Bundle | file/Room + id nhỏ trong `SavedStateHandle` |
| Fragment gọi thẳng Fragment khác, EventBus | ViewModel dùng chung (Mediator) |
| Retry/auth/log viết quanh từng call Retrofit | OkHttp `Interceptor` |
