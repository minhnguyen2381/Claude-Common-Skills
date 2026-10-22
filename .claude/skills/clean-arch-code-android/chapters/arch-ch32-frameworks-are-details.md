# Clean Architecture — Chapter 32: Frameworks Are Details

## Core Idea
Framework hữu ích nhưng **không phải kiến trúc**. Quan hệ với tác giả framework là **"asymmetric marriage"**: bạn cam kết hết, họ không cam kết gì. **"Don't marry the framework!"** Dùng nó, nhưng giữ ở **arm's length**, ở vòng ngoài.

## Frameworks Introduced
- **Framework Authors**: viết để giải **vấn đề của họ**, không phải của bạn; hữu ích ở phần chồng lấn.
- **Asymmetric Marriage**: tài liệu khuyên bạn kế thừa base class và import framework vào business object, tức là coupling tối đa. Tác giả không rủi ro (họ kiểm soát framework); bạn chịu mọi rủi ro.
- **The Risks**:
  1. Kiến trúc framework thường **vi phạm Dependency Rule**: muốn bạn kế thừa vào **Entities**. "The wedding ring is on your finger."
  2. Sản phẩm trưởng thành thì **vượt quá** framework, và framework bắt đầu chống lại bạn.
  3. Framework **tiến hóa theo hướng không có lợi**: buộc nâng cấp, tính năng cũ biến mất.
  4. Có **framework tốt hơn** mà bạn muốn chuyển sang.
- **The Solution**: dùng nhưng không couple. Coi là detail ở vòng ngoài. Framework muốn business object kế thừa base class thì **nói không**; kế thừa **proxy** và để proxy ở component plugin.
  - Ví dụ Spring: đừng rắc `@autowired` khắp business object; dùng Spring inject vào **Main**.
- **I Now Pronounce You…**: có framework buộc phải "cưới" (STL với C++, standard library với Java). Bình thường, nhưng phải là **quyết định có ý thức**: gắn bó trọn đời ứng dụng.
- **Conclusion**: *"try not to marry it right away… date it for a while"*; giữ framework sau ranh giới càng lâu càng tốt. *"Perhaps you can find a way to get the milk without buying the cow."*

## Key Concepts
- **Asymmetric marriage**.
- **Arm's length**: dùng có khoảng cách.
- **Proxy**: lớp kế thừa framework thay cho business object.
- **Must-marry frameworks**: stdlib, ngôn ngữ nền.

## Mental Models
- Với mỗi framework, hỏi: "**Nếu nó bị deprecate năm sau, mình sửa bao nhiêu file?**"
- "Hẹn hò trước khi cưới": thử framework ở module rìa trước.

## Anti-patterns
- **Entity kế thừa base class framework**.
- **Annotation framework trong business object** (`@Autowired`, `@Inject`, `@Entity`, `@SerializedName`).
- **Kiến trúc = "theo cách framework X"**.

## 🤖 Android mapping (chuyển thể, không có trong sách)
| Framework | "Cưới" chấp nhận được? | Giữ ở đâu |
|---|---|---|
| Kotlin stdlib, `kotlinx.coroutines` (Flow) | ✅ Must-marry (như stdlib) | Mọi vòng, kể cả domain |
| Android SDK (`Context`, `Activity`) | ❌ cho domain | `data/platform`, UI, Main |
| `androidx.lifecycle.ViewModel` | ⚠ Chỉ ở **Interface Adapters** (presenter) | `feature/*ViewModel`. ViewModel *là* proxy kế thừa framework, nên không đặt business rule vào đó |
| Koin | ❌ cho domain/data class | Chỉ `di/` + `by viewModel()` ở Fragment |
| Room | ❌ cho domain | `data/database` |
| Retrofit + Gson (`@SerializedName`) | ❌ cho domain | `data/remote`, DTO |
| Jetpack Navigation | ❌ cho ViewModel/domain | Sau `Navigator` interface (Satellite2 ✅) |
| Firebase (Analytics/RemoteConfig/Crashlytics) | ❌ | Sau `AnalyticsLogger`/`ConfigProvider`; gọi ở Main/adapter |
| Glide, BlurView, Lottie | ❌ | Extension ở UI (`loadImage()`, `setupGlassEffect()`) (Satellite2 ✅) |
| Google Maps SDK (`LatLng`) | ❌ cho domain | UI/map adapter; domain dùng `Coordinates` |

- **ViewModel là "proxy"**: `BaseViewModel : androidx.lifecycle.ViewModel` là đúng chỗ (adapter layer). Business rule đặt trong UseCase (POJO) để ViewModel chỉ điều phối. Nếu logic tính toán nằm trong ViewModel thì đã "cưới" Jetpack ở mức business.
- **Base class nặng của chính mình cũng là framework**: `BaseFragment`/`BaseViewModel` cùng quy tắc "mandatory, never use raw Android classes" giúp đồng nhất, nhưng mọi màn hình bị "cưới" base class nội bộ. Giữ base class **mỏng**; ưu tiên extension function (`launchIO`, `collectFlowOnView`, `setPreventDoubleClick`). Satellite2 đã làm vậy cho phần lớn tiện ích, và đó là hướng nên tiếp tục.
- **"Date before marrying"**: muốn thử Compose, Paging 3 hay Hilt thì bắt đầu ở một feature rìa (ví dụ màn Setting), không chuyển đổi toàn app ngay.

## Key Takeaways
1. Framework không phải kiến trúc; tác giả không cam kết với bạn.
2. Đừng để framework vào Entities/Use Cases; dùng proxy ở vòng ngoài.
3. DI framework chỉ ở Main.
4. "Cưới" stdlib là bình thường, nhưng phải là quyết định có ý thức.

## Connects To
- **arch-ch21 (Frameworks are tools)**, **arch-ch26 (Main)**, **code-ch08 (Boundaries: wrap third-party API)**.
