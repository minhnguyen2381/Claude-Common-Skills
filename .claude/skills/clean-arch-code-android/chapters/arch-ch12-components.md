# Clean Architecture — Chapter 12: Components

## Core Idea
**Component là đơn vị deploy** nhỏ nhất (jar, DLL, gem, shared lib). Sau 50 năm tiến hóa (relocatable binary → linking loader → linker → dynamic linking), **component plugin architecture** đã trở thành mặc định dễ dàng chứ không còn là nỗ lực phi thường.

## Frameworks Introduced
- **Component = unit of deployment**: có thể gộp nhiều component thành một executable, hoặc deploy riêng từng cái như plugin load lúc runtime. Dù thế nào, component được thiết kế tốt **luôn giữ khả năng deploy độc lập** và vì vậy phát triển độc lập.
- **Lịch sử ngắn**:
  1. Thư viện hàm đặt ở địa chỉ cố định trong bộ nhớ, app phải "nhảy" quanh library.
  2. **Relocatable binaries**: loader thông minh dịch địa chỉ; compiler ghi external reference/definition.
  3. **Linking loader** → quá chậm → tách **linker** (chậm, chạy một lần) và **loader** (nhanh).
  4. **Murphy's law of program size**: *"Programs will grow to fill all available compile and link time."*
  5. Moore thắng Murphy (giữa thập niên 1990): link lại đủ nhanh để link lúc load, từ đó có .jar, DLL, shared library, plugin (mod Minecraft, Resharper).

## Key Concepts
- **Component**: đơn vị deploy (jar/DLL/gem/AAR…).
- **Relocatable binary**: mã có cờ để loader sửa địa chỉ.
- **External reference / definition**: metadata tên hàm để linker nối.
- **Component plugin architecture**: ghép các file link động vào lúc runtime.

## Mental Models
- Ranh giới component = **ranh giới build/deploy**, không chỉ là thư mục.
- Thời gian build là chi phí kiến trúc thật. Murphy luôn quay lại khi codebase lớn lên.

## Anti-patterns
- **Một khối build duy nhất cho mọi thứ**: build lâu và mọi thay đổi đều build lại toàn bộ.
- **Gọi một thư mục là "component" khi nó không thể build/test riêng.**

## 🤖 Android mapping (chuyển thể, không có trong sách)
| Sách | Android |
|---|---|
| jar / DLL | **Gradle module** (`com.android.library` → AAR, `kotlin("jvm")` → JAR) |
| Linker | Gradle + R8/D8 ghép các module vào APK/AAB |
| Plugin load lúc runtime | **Dynamic Feature Module**, hoặc module được Koin "cắm" vào lúc `startKoin` |
| Murphy's law | Build time của `:app` tăng theo số file; **incremental build** chỉ hiệu quả khi tách module |

- Satellite2 hiện có 3 component: `:app`, `:LibAds`, `:permissionx`. `:LibAds` là ví dụ tốt về component tái sử dụng được giữa nhiều app của công ty.
- Khi `:app` vượt khoảng vài trăm file (Satellite2 đang có ~330 file Kotlin), cân nhắc tách `:core:domain` (JVM thuần), `:core:data`, `:feature:liveCamera`… để vừa build song song vừa giữ ranh giới bằng compiler.

## Key Takeaways
1. Component = đơn vị deploy, kể cả khi cuối cùng mọi thứ gộp thành một APK.
2. Kiến trúc plugin giờ rẻ. Hãy tận dụng nó.
3. Thời gian build là thước đo sức khỏe kiến trúc.

## Connects To
- **arch-ch13/14**: nên đặt class nào vào component nào và component nào phụ thuộc component nào.
- **arch-ch18 (Boundary Anatomy)**: deployment component là một dạng boundary.
