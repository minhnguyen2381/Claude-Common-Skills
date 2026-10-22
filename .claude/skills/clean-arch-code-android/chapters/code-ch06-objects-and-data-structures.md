# Clean Code — Chapter 6: Objects and Data Structures

## Core Idea
**Object** giấu data sau abstraction và lộ ra **hành vi**. **Data structure** lộ data và **không có hành vi đáng kể**. Hai thứ là **đối xứng ngược** (anti-symmetry): thứ dễ với cái này thì khó với cái kia. Chọn đúng loại cho từng phần hệ thống và **tránh hybrid**.

## Frameworks Introduced
- **Data Abstraction**: `Point` concrete (`public double x, y`) và `Point` interface (`getX/getY/setCartesian/getR/getTheta/setPolar`). Bản abstract không lộ toạ độ Descartes hay cực, và còn áp **access policy** (set toạ độ là atomic).
  - `Vehicle.getFuelTankCapacityInGallons()` + `getGallonsOfGasoline()` (concrete) và `getPercentFuelRemaining()` (abstract). *"The worst option is to blithely add getters and setters."*
  - Giấu implementation **không phải** là thêm getter/setter; đó là **abstraction**.
- **Data/Object Anti-Symmetry**:
  - *"Procedural code (code using data structures) makes it easy to add new functions without changing the existing data structures. OO code, on the other hand, makes it easy to add new classes without changing existing functions."*
  - Và ngược lại: procedural khó thêm data structure mới; OO khó thêm function mới.
  - Ví dụ: `Geometry.area(Object shape)` với `instanceof` Square/Rectangle/Circle (thêm `perimeter()` dễ, thêm shape khó) so với `Shape.area()` đa hình (thêm shape dễ, thêm hàm khó). Visitor/dual-dispatch có giá riêng.
  - *"Mature programmers know that the idea that everything is an object is a myth."*
- **The Law of Demeter**: method `f` của class `C` chỉ gọi method của: `C`; object do `f` tạo ra; object truyền vào `f`; object trong instance variable của `C`. *"Talk to friends, not to strangers."*
  - **Train Wrecks** [G36]: `ctxt.getOptions().getScratchDir().getAbsolutePath()`. Tách ra từng biến cũng không giải quyết nếu đó là **object**. Nếu là **data structure** (`ctxt.options.scratchDir.absolutePath`) thì Demeter không áp dụng.
  - **Hybrids**: nửa object nửa data structure (có hàm làm việc thật *và* getter/setter lộ data). *"the worst of both worlds"*: khó thêm hàm, khó thêm type. Gắn với **Feature Envy**.
  - **Hiding Structure**: hỏi *vì sao* cần absolute path? Để tạo file scratch. Vậy hãy **bảo** object làm: `ctxt.createScratchFileStream(classFileName)` (**Tell, don't ask**).
- **Data Transfer Objects**: class public field, không hàm; hữu ích khi giao tiếp DB/socket; là bước đầu của chuỗi dịch raw data thành object. Dạng "bean" (private + getter/setter) chỉ là quasi-encapsulation.
- **Active Record**: DTO + `save`/`find`. **Đừng** nhét business rule vào; tạo object riêng chứa rule và giấu Active Record bên trong.

## Key Concepts
- **Object** vs **Data structure**.
- **Anti-symmetry**.
- **Law of Demeter**, **train wreck**.
- **Hybrid**, **Feature Envy**.
- **DTO**, **Bean**, **Active Record**.
- **Tell, don't ask**.

## Mental Models
- Hỏi: "Phần này sẽ **thêm type mới** hay **thêm thao tác mới** thường xuyên hơn?". Type mới thì dùng object (polymorphism); thao tác mới thì dùng data structure + function.
- Thấy chuỗi `a.b().c().d()` thì hỏi "mình định **làm gì** với `d`?" và bảo `a` làm.

## Anti-patterns
- Getter/setter tự động cho mọi field.
- Hybrid object/data.
- Business rule trong DTO/Active Record/ORM entity.
- Train wreck qua object có hành vi.

## Code Examples
```java
// Tell, don't ask — thay vì đào outputDir rồi tự ghép path
BufferedOutputStream bos = ctxt.createScratchFileStream(classFileName);
```
- **What it demonstrates**: object giấu cấu trúc, client nói ý định.

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **Kotlin `data class` = data structure** (DTO, `UiState`, `UIModel`, Request/Response). Hợp lệ khi **không chứa logic nghiệp vụ**. `sealed interface` + `when` là **procedural side** của anti-symmetry: dễ thêm hàm xử lý mới, khó thêm subtype (phải sửa mọi `when`). Interface + impl đa hình là **OO side**.
| Nhu cầu | Chọn |
|---|---|
| `UiState`, `DtoModel`, Room `@Entity`, Request/Response | `data class` (DS) |
| Tập trạng thái cố định, thêm nhiều cách xử lý (render, log, analytics) | `sealed` + `when` |
| Nhiều biến thể, thêm biến thể thường xuyên (map provider, ad network, player type) | interface + polymorphism |
| Quy tắc nghiệp vụ (quota, premium) | class có hành vi, giấu data (`LookupQuota.canLookup()`) |
- **Hybrid trên Android**: `data class LiveVideoUiModel(...)` vừa có field public vừa có `fun shouldShowAd(isPremium: Boolean, count: Int): Boolean` đọc 5 field. Tách rule vào domain (`AdPolicy`), giữ UiModel là DS thuần. Room `@Entity` có method `isExpired()` gọi `System.currentTimeMillis()` cũng là hybrid kiểu Active Record.
- **Law of Demeter / train wreck**:
```kotlin
// ❌ Fragment đào sâu
val isLive = viewModel.uiState.value.pagingUiState.items[pos].video.status.isLive
// ✅ data structure phẳng do Presenter chuẩn bị (DS nên Demeter không áp dụng, nhưng phẳng thì đọc dễ)
val item = adapter.currentList[pos]; item.isLiveBadgeVisible
// ❌ ViewModel hỏi object rồi tự quyết
if (premiumRepository.getStatus().expiry.isAfter(now) && premiumRepository.getStatus().tier == PRO) ...
// ✅ Tell, don't ask
if (premium.isActive(now)) ...
```
- **Bean-style getter** không cần trong Kotlin: property là đủ. Đừng viết `fun getName() = name`.

## Key Takeaways
1. Object giấu data, lộ hành vi; data structure lộ data, không hành vi.
2. OO dễ thêm type; procedural dễ thêm function. Chọn theo hướng thay đổi.
3. Law of Demeter: chỉ nói chuyện với "bạn"; tránh train wreck qua object.
4. Tránh hybrid; không nhét business rule vào DTO/Active Record.

## Connects To
- **arch-ch05 (OO = polymorphism)**, **arch-ch20 (Request/Response models)**, **arch-ch23 (no such thing as ORM)**, **code-ch17 (G14 Feature Envy, G36 Avoid Transitive Navigation)**.
