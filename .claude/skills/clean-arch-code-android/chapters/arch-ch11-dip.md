# Clean Architecture — Chapter 11: DIP — The Dependency Inversion Principle

## Core Idea
Hệ thống linh hoạt nhất là hệ thống mà **source code dependency chỉ trỏ tới abstraction**, không trỏ tới concretion **volatile**. Code concrete không tránh được thì được gom vào vài component nhỏ (thường là `main`).

## Frameworks Introduced
- **DIP**: `import`/`use`/`include` chỉ nên trỏ tới interface, abstract class, khai báo trừu tượng.
  - Ngoại lệ thực tế: phụ thuộc vào thứ concrete nhưng **stable** (`java.lang.String`, OS, platform) là chấp nhận được. Cần tránh **volatile concrete**: module đang phát triển và thay đổi thường xuyên.
- **Stable Abstractions**: interface ít volatile hơn implementation; designer giỏi cố thêm chức năng mà không đổi interface ("Software Design 101").
- **4 coding practices**:
  1. **Don't refer to volatile concrete classes.** Tham chiếu interface; dùng **Abstract Factory** để tạo object.
  2. **Don't derive from volatile concrete classes.** Kế thừa là quan hệ cứng nhất.
  3. **Don't override concrete functions.** Override vẫn kế thừa dependency; hãy làm hàm abstract và tạo nhiều impl.
  4. **Never mention the name of anything concrete and volatile.**
- **Abstract Factory**: `Application` dùng `Service` (interface) và gọi `ServiceFactory.makeSvc()`; `ServiceFactoryImpl` tạo `ConcreteImpl`. Một **đường cong (architectural boundary)** chia hệ thống thành phía abstract (business rules) và phía concrete (details). Mọi dependency vượt đường cong đều trỏ về phía abstract, **ngược** flow of control.
- **Concrete Components / main**: vi phạm DIP không xóa hết được; hãy gom vào **main**, nơi khởi tạo `ServiceFactoryImpl` và đặt vào biến global kiểu `ServiceFactory`.

## Key Concepts
- **Volatile vs stable**: tần suất thay đổi quyết định có nên phụ thuộc hay không.
- **Abstract Factory**: tạo object concrete mà không có source dependency vào nó.
- **Architectural boundary**: đường chia abstract/concrete; sau này trở thành **Dependency Rule**.
- **Main**: component concrete chứa hàm khởi động và nối mọi thứ.

## Mental Models
- Mỗi `import` là một lời hứa "nếu nó đổi, tôi đổi theo". Chỉ hứa với thứ stable.
- DI container = **Abstract Factory + main** được tự động hóa.

## Anti-patterns
- **`new ConcreteVolatile()` rải rác trong business logic**.
- **Kế thừa class concrete volatile** để "tái sử dụng".
- **Override hàm concrete** thay vì tách abstract.

## Worked Example
```
          (abstract side)                 ║        (concrete side)
Application ──uses──> <I> Service         ║   ConcreteImpl ──implements──> Service
Application ──uses──> <I> ServiceFactory  ║   ServiceFactoryImpl ──implements──> ServiceFactory
                                          ║   ServiceFactoryImpl ──creates──> ConcreteImpl
main(): factory = ServiceFactoryImpl()  // vi phạm DIP được cô lập ở đây
```

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **Koin = Abstract Factory + Main**. Module `di/` là component concrete duy nhất biết `XxxRepositoryImpl`.
```kotlin
val repositoryModule = module {
    singleOf(::LiveVideoRepositoryImpl) bind LiveVideoRepository::class
}
```
- **Điểm cần sửa trong Satellite2**: interface `ApiRepository` nằm ở `data/repository/...` và trả `DtoModel` (`data/model`). Use case ở `domain` import `pion.tech.pionbase.data...`, nghĩa là **domain phụ thuộc data**, sai hướng DIP. Hướng đúng:
```kotlin
// domain/repository/LiveVideoRepository.kt — abstraction thuộc về policy
interface LiveVideoRepository {
    fun getMostViewed(limit: Int): Flow<Result<List<LiveVideo>>>   // domain model, không phải DTO
}
// data/repository/LiveVideoRepositoryImpl.kt — detail implements abstraction
class LiveVideoRepositoryImpl(private val api: LiveVideoApi) : LiveVideoRepository {
    override fun getMostViewed(limit: Int) = flow { emit(Result.Success(api.mostViewed(limit).map { it.toDomain() })) }
        .catch { if (it is CancellationException) throw it; emit(Result.Error(it)) }
        .flowOn(Dispatchers.IO)
}
```
- **Stable concrete chấp nhận được**: `kotlinx.coroutines.Flow`, `kotlin.Result`, stdlib. **Volatile concrete cần tránh trong domain**: `Context`, `LatLng` (Play Services), Retrofit `Response`, Room `Entity`, Gson annotation.
- **"Don't derive from volatile concrete classes"**: cân nhắc khi `BaseFragment`/`BaseViewModel` quá dày. Mỗi lần base đổi, mọi màn đều bị ảnh hưởng. Ưu tiên extension function / delegation cho phần phụ (ví dụ `launchIO` là extension, đó là cách đúng).

## Key Takeaways
1. Phụ thuộc vào abstraction; chỉ chấp nhận concrete khi nó stable.
2. Tạo object volatile qua factory/DI, không `new` trong business logic.
3. Gom vi phạm DIP vào Main (Koin modules).
4. Interface thuộc về phía policy (domain), impl thuộc về phía detail (data).

## Connects To
- **arch-ch05**: polymorphism đảo chiều dependency.
- **arch-ch22 (Dependency Rule)**, **arch-ch26 (Main Component)**.
