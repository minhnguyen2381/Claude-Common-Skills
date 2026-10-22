# Clean Architecture — Chapter 26: The Main Component

## Core Idea
Mọi hệ thống có ít nhất một component **tạo, điều phối và giám sát** các component khác, gọi là **Main**. Main là **"the ultimate detail"**, là component **bẩn nhất**, nằm ở vòng ngoài cùng. Nó nạp mọi thứ rồi trao quyền điều khiển cho policy cấp cao. Main là **plugin**, nên có thể có nhiều Main cho nhiều cấu hình.

## Frameworks Introduced
- **The Ultimate Detail**: Main là policy cấp thấp nhất, điểm vào ban đầu; ngoài OS thì không ai phụ thuộc nó. Nhiệm vụ: tạo mọi **Factory, Strategy, global facility**, rồi giao quyền cho phần trừu tượng cấp cao.
- **DI framework chỉ ở Main**: *"It is in this Main component that dependencies should be injected by a Dependency Injection framework. Once they are injected into Main, Main should distribute those dependencies normally, without using the framework."*
- **"Think of Main as the dirtiest of all the dirty components."**
- **Ví dụ Hunt the Wumpus `Main`**:
  - Chứa mọi **chuỗi** mà phần chính không nên biết (environments: "bright", "humid"…; shapes; cavernTypes; adornments).
  - Dùng `HtwFactory.makeGame("htw.game.HuntTheWumpusFacade", new Main())`, truyền **tên class dạng chuỗi** vì Facade còn bẩn hơn Main, để đổi Facade không bắt Main recompile.
  - Tạo input stream, chạy **main loop**, dịch lệnh đơn giản (`e`, `w`, `sw`…) thành Command rồi **ủy quyền** mọi xử lý cho component cấp cao.
  - Tạo bản đồ (`createMap()`): số hang ngẫu nhiên, nối hang, đặt Wumpus, dơi, hố, quiver = 5.
- **Main as a plugin**: có thể có Main cho **Dev / Test / Production**, cho từng quốc gia, khu vực pháp lý hay khách hàng. Coi Main là plugin sau ranh giới thì bài toán **configuration** dễ hơn nhiều.

## Key Concepts
- **Main**: entry point, composition root.
- **Dirty component**: biết mọi concrete class.
- **Configuration as plugin**: mỗi cấu hình là một Main.

## Mental Models
- Main = **composition root**: nơi duy nhất được phép `new` mọi thứ và biết DI framework.
- Muốn thêm môi trường/flavor? **Thêm một Main**, đừng rải `if (env == ...)`.

## Anti-patterns
- **DI framework lan khắp codebase** (annotation/`get()` trong business logic).
- **Config string/hằng số business rải trong policy**.
- **`if (BuildConfig.DEBUG)` trong use case**.

## Code Examples
```java
public static void main(String[] args) throws IOException {
  game = HtwFactory.makeGame("htw.game.HuntTheWumpusFacade", new Main());
  createMap();
  BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
  game.makeRestCommand().execute();
  while (true) {
    // ...in trạng thái, đọc lệnh, map "e"/"w"/"sw"... → Command
    c.execute();
  }
}
```
- **What it demonstrates**: Main nạp, dịch input thô, rồi ủy quyền hết cho tầng cao.

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **Main trên Android** = `Application.onCreate()` + `startKoin { modules(appModule) }` + `di/*Module.kt` + `MainActivity` (single-Activity host). Đây là nơi **duy nhất** biết `XxxRepositoryImpl`, `Retrofit.Builder`, `Room.databaseBuilder`, `BuildConfig.BASE_URL`, API key.
```kotlin
class App : Application() {
    override fun onCreate() {
        super.onCreate()
        startKoin {
            androidContext(this@App)
            modules(coreModule, networkModule, databaseModule, repositoryModule, useCaseModule, viewModelModule)
        }
    }
}
```
- **"Inject at Main, distribute normally"**: UseCase, Repository và ViewModel nhận dependency qua **constructor thuần**, không `KoinComponent`, không `by inject()` bên trong. Satellite2 tuân thủ ở UseCase/Repository (`factoryOf(::XxxUseCase)`, `singleOf(::XxxImpl) bind Xxx::class`). Chỗ cần soi lại: `BaseFragment` cung cấp `dataStoreRepository`, `logger` cho mọi Fragment (DI framework thấm vào base class).
- **Nhiều Main = build variants / flavors**: `src/debug/.../DebugModule.kt` (Chucker, fake ads, log BODY) và `src/release/.../ReleaseModule.kt` (no-op). Satellite2 đã làm đúng tinh thần này với `chucker-library` / `chucker-library-no-op` và mức log theo build type. Mở rộng tự nhiên: `testModule` thay `LiveVideoRepository` bằng fake cho UI test.
- **Chuỗi "bẩn" ở Main**: Remote Config default values, URL, API key, danh sách quốc gia mặc định nên nằm ở `di/`/`BuildConfig`/resource, không nằm trong UseCase.

## Key Takeaways
1. Main là component bẩn nhất, ở vòng ngoài cùng.
2. DI framework chỉ ở Main; phần còn lại dùng constructor injection thuần.
3. Main nạp cấu hình và tài nguyên rồi giao quyền cho policy cao.
4. Mỗi cấu hình (dev/test/prod, flavor) là một Main plugin.

## Connects To
- **arch-ch11 (DIP: concrete components gom vào main)**, **arch-ch22 (Frameworks & Drivers)**, **code-ch11 (Systems: separate construction from use)**.
