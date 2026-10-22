# Clean Code — Chapter 11: Systems (Dr. Kevin Dean Wampler)

## Core Idea
*"Complexity kills."* (Ray Ozzie). Hệ thống cũng phải sạch ở **cấp cao**: **tách khởi tạo (construction) khỏi sử dụng (use)**, viết domain bằng **POJO**, đưa **cross-cutting concerns** vào theo cách **ít xâm lấn** (aspect-like), để kiến trúc **lớn dần theo từng bước** và **test-drive được**. *"Use the simplest thing that can possibly work."*

## Frameworks Introduced
- **How Would You Build a City?**: thành phố vận hành được nhờ các đội lo từng phần, với mức trừu tượng và tính module phù hợp.
- **Separate Constructing a System from Using It**: *"Software systems should separate the startup process… from the runtime logic that takes over after startup."* (khách sạn đang xây có cần cẩu, xây xong thì cần cẩu biến mất).
  - **Lazy Initialization** (`if (service == null) service = new MyServiceImpl(...)`): có lợi (khởi động nhanh, không null) nhưng hard-code dependency vào `MyServiceImpl`, khó test, vi phạm SRP nhẹ, và không biết đó có phải object đúng cho mọi ngữ cảnh hay không. Rải khắp nơi thì chiến lược setup toàn cục **bị phân tán**.
  - **Separation of Main**: mọi construction nằm ở `main` (hoặc module `main` gọi); ứng dụng giả định mọi thứ đã được dựng sẵn. Mũi tên dependency đi **từ main ra**, ứng dụng không biết main.
  - **Factories**: khi app cần quyết định *khi nào* tạo (`LineItem` trong `Order`), dùng **Abstract Factory**: `LineItemFactoryImplementation` nằm phía main.
  - **Dependency Injection**: IoC áp cho dependency. Object **thụ động hoàn toàn**: nhận qua constructor/setter; container (hoặc main) khởi tạo và nối. JNDI lookup chỉ là DI "một phần" (object vẫn chủ động resolve). Lazy vẫn có thể nhờ container.
- **Scaling Up**: *"It is a myth that we can get systems 'right the first time.'"* Chỉ làm story hôm nay, refactor và mở rộng ngày mai. *"Software systems… architectures can grow incrementally, if we maintain the proper separation of concerns."*
  - **Phản ví dụ EJB1/EJB2**: business logic dính chặt container (kế thừa type container, lifecycle method, XML descriptor, `InitialContext.lookup`), khó unit test, không tái dùng được, không kế thừa bean được, DTO dư thừa và boilerplate copy.
- **Cross-Cutting Concerns**: persistence, transaction, security, caching… cắt ngang ranh giới domain. **AOP** khôi phục tính module bằng **aspects** khai báo những điểm cần đổi hành vi một cách nhất quán, **noninvasive**.
  - **Java Proxies**: được nhưng nhiều code, phức tạp, chỉ hợp cho trường hợp đơn giản.
  - **Pure Java AOP (Spring AOP, JBoss AOP)**: domain là POJO; hạ tầng khai báo qua config; "**Russian doll**" decorator (Bank được bọc bởi DAO, DAO được bọc bởi DataSource). EJB3 học theo mô hình này (annotation).
  - **AspectJ**: mạnh nhất, nhưng phải học thêm công cụ.
- **Test Drive the System Architecture**: domain là POJO nên có thể **phát triển kiến trúc từ "naively simple" nhưng decoupled** tới tinh vi theo nhu cầu. **BDUF** (Big Design Up Front) có hại: tạo kháng cự tâm lý với việc bỏ công sức cũ.
  - *"An optimal system architecture consists of modularized domains of concern, each of which is implemented with Plain Old Java (or other) Objects. The different domains are integrated together with minimally invasive Aspects or Aspect-like tools. This architecture can be test-driven, just like the code."*
- **Optimize Decision Making**: phân quyền quyết định; **hoãn quyết định tới khoảnh khắc cuối cùng có thể** (không phải lười, mà là quyết với thông tin tốt nhất).
- **Use Standards Wisely, When They Add Demonstrable Value**: đừng dùng EJB2 chỉ vì nó là "standard".
- **Systems Need Domain-Specific Languages**: DSL thu hẹp khoảng cách giữa khái niệm domain và code; nâng mức trừu tượng trên idiom và pattern.

## Key Concepts
- **Construction vs use**, **Separation of Main**.
- **Lazy initialization** (và cái giá của nó).
- **Abstract Factory**, **DI / IoC**.
- **Cross-cutting concern**, **AOP**, **aspect**, **decorator "Russian doll"**.
- **POJO**.
- **BDUF**, **last responsible moment**.
- **DSL**.

## Mental Models
- "Code này **tạo** object hay **dùng** object?". Không được làm cả hai.
- Hạ tầng (log, retry, auth, cache) nên được **"quấn quanh"** domain, không **trộn vào** domain.

## Anti-patterns
- `if (x == null) x = ConcreteImpl()` rải khắp nơi.
- Domain kế thừa framework/container.
- Kiến trúc "đúng ngay từ đầu" (BDUF).
- Dùng "standard"/framework vì hype.

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **Separation of Main**: `Application` + Koin modules = construction; Fragment/ViewModel/UseCase = use. Satellite2 đã có `di/AppModule.kt` gom `coreModule`, `networkModule`, `databaseModule`, `repositoryModule`, `useCaseModule`, `viewModelModule`.
- **Lazy init trong Kotlin**: `by lazy { MyServiceImpl(...) }` trong class nghiệp vụ vẫn là hard-code dependency. Dùng `single { }` / `factory { }` của Koin (container lo lazy) và constructor injection.
- **Factory khi app quyết định thời điểm tạo**: `ViewModelProvider.Factory`, Koin `factory { params -> ... }` với `parametersOf(id)`, `AssistedInject` (Hilt). Ví dụ `PlayerFactory.create(streamType)` khi người dùng chọn camera.
- **Aspect-like cross-cutting trên Android** (noninvasive):
| Concern | Cơ chế "aspect" | Ví dụ |
|---|---|---|
| HTTP header/auth/logging | **OkHttp Interceptor** | `HeaderInterceptor`, `HttpLoggingInterceptor` (Satellite2 ✅) |
| Lỗi coroutine | `CoroutineExceptionHandler` bọc trong `launchIO {}` | `BaseViewModel.launchWithExceptionHandler` (Satellite2 ✅) |
| Debounce click | Extension `setPreventDoubleClick {}` | Satellite2 ✅ |
| Navigation an toàn | Decorator `Navigator` quanh `NavController` | Satellite2 ✅ |
| Transaction DB | Room `@Transaction` / `withTransaction {}` | |
| Analytics màn hình | `FragmentLifecycleCallbacks` đăng ký một lần | thay vì gọi `logScreen()` trong mọi Fragment |
| Crash reporting | `Timber.Tree` cho Crashlytics | |
  Đây là tinh thần "Russian doll": domain không biết mình đang được log/retry/đo.
- **Test-drive architecture**: bắt đầu `:app` đơn module nhưng domain là Kotlin thuần (không `android.*`), tách module khi cần (xem arch-ch24/25).
- **DSL Kotlin**: Koin `module { }`, Gradle Kotlin DSL, `buildList {}`; test DSL (`givenPages`, `whenUserSearches`) trong code-ch09.

## Key Takeaways
1. Tách construction (Main/DI) khỏi runtime logic.
2. DI: object thụ động, container hoặc main lắp ráp.
3. Kiến trúc có thể lớn dần nếu tách concern đúng; tránh BDUF.
4. Cross-cutting concern xử lý bằng cơ chế aspect-like, ít xâm lấn.
5. Hoãn quyết định; dùng standard khi có giá trị thật; dùng DSL để gần domain.

## Connects To
- **arch-ch26 (Main Component)**, **arch-ch15 (keep options open)**, **arch-ch32 (frameworks)**, **code-ch12 (Emergence)**.
