# Clean Architecture — Chapter 5: Object-Oriented Programming

## Core Idea
Với kiến trúc sư, OO **không** phải là encapsulation, inheritance hay "mô hình hóa thế giới thực". OO là khả năng dùng **polymorphism** để kiểm soát tuyệt đối **hướng của mọi source code dependency**, từ đó xây **plugin architecture**.

## Frameworks Introduced
- **Đánh giá "3 từ thần chú"**:
  | Thuộc tính | Điểm cho OO | Lý do |
  |---|---|---|
  | Encapsulation | 0 | C đã có encapsulation hoàn hảo (forward declare trong `.h`); C++/Java còn làm yếu đi |
  | Inheritance | ½ | C đã "giả lập" được bằng masquerade struct; OO chỉ làm tiện hơn |
  | Polymorphism | ✔ | Có từ trước (con trỏ hàm, UNIX `FILE`), nhưng OO làm nó **an toàn và tiện**, nghĩa là đặt kỷ luật lên indirect transfer of control |
- **The Power of Polymorphism / Plugin**: chương trình `copy()` dùng `getchar/putchar` không phụ thuộc thiết bị I/O; thiết bị là **plugin**. "OO allows the plugin architecture to be used anywhere, for anything."
- **Dependency Inversion**: không có polymorphism thì source dependency **đi theo** flow of control. Chèn interface vào thì dependency **ngược chiều** flow of control.
  - Kết quả: UI và DB phụ thuộc vào business rules, không phải ngược lại. Từ đó có **independent deployability** và **independent developability**.

## Key Concepts
- **Flow of control vs source code dependency**: hai hướng có thể khác nhau nhờ interface.
- **Plugin**: module chi tiết cấp thấp cắm vào policy cấp cao.
- **Independent deployability**: chỉ component đổi source mới cần deploy lại.
- **Independent developability**: các team làm song song trên các component độc lập.
- **vtable**: cơ chế C++ hiện thực polymorphism, thực chất là bảng con trỏ hàm.

## Mental Models
- "Ai gọi ai" (runtime) và "ai import ai" (compile time) là **hai câu hỏi khác nhau**. Kiến trúc sư điều khiển câu thứ hai.
- Mọi mũi tên dependency trên sơ đồ đều có thể quay đầu bằng một interface. Hãy chọn chiều có chủ đích.

## Anti-patterns
- **Định nghĩa OO là "data + function" hay "model the real world"**: không giúp ra quyết định kiến trúc.
- **Để dependency đi theo call tree**: business rules phải import DB/UI, nên mọi thay đổi chi tiết đều lan vào lõi.

## Code Examples
```c
// UNIX-style polymorphism — copy() không biết thiết bị nào
struct FILE { int (*read)(); void (*write)(char); /* open, close, seek */ };
extern struct FILE* STDIN;
int getchar() { return STDIN->read(); }
```
- **What it demonstrates**: polymorphism = con trỏ hàm; thiết bị I/O là plugin.

## 🤖 Android mapping (chuyển thể, không có trong sách)
Ví dụ đúng trong Satellite2: interface nằm ở `domain`, impl nằm ở `data`, và Koin nối hai bên.
```kotlin
// domain/provider — policy, không biết Android
interface DeviceLocaleProvider { fun getDeviceLanguageCode(): String }

// data/provider — detail, plugin
class AndroidDeviceLocaleProvider(private val context: Context) : DeviceLocaleProvider {
    override fun getDeviceLanguageCode() =
        context.resources.configuration.locales[0].language
}

// di — Main component nối plugin vào
val coreModule = module { singleOf(::AndroidDeviceLocaleProvider) bind DeviceLocaleProvider::class }
```
Flow of control: UseCase → AndroidDeviceLocaleProvider. Source dependency: `data` → `domain`, tức là **đảo chiều**. UseCase test được trên JVM với `FakeDeviceLocaleProvider("vi")`.

## Key Takeaways
1. OO, xét về kiến trúc, = polymorphism an toàn = quyền kiểm soát hướng dependency.
2. Dùng interface để biến DB, UI, framework thành plugin của business rules.
3. Dependency đảo chiều cho phép deploy và phát triển độc lập.

## Connects To
- **arch-ch11 (DIP)**, **arch-ch17 (Boundaries)**, **arch-ch22 (Clean Architecture)**.
- **code-ch06**: Objects vs Data Structures, mặt code của cùng ý tưởng.
