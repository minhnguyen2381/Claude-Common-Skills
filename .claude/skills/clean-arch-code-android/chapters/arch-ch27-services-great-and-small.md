# Clean Architecture — Chapter 27: Services: Great and Small

## Core Idea
Service (SOA, micro-service) **tự nó không phải là kiến trúc**. Kiến trúc được định nghĩa bởi **ranh giới tuân theo Dependency Rule**, và ranh giới đó **chạy xuyên qua** service chứ không nằm giữa các service. Hai "lợi ích" phổ biến của service (decoupling, independent development/deployment) phần lớn là **ngụy biện**.

## Frameworks Introduced
- **Service Architecture?**: service chỉ tách hành vi thì chỉ là **function call đắt tiền**. Giống function: có function vượt ranh giới kiến trúc, có function không. Service cũng vậy.
- **The Decoupling Fallacy**: service tách nhau ở mức biến, nhưng vẫn **coupled** qua tài nguyên chung và **qua dữ liệu chung**. Thêm field vào record dùng chung thì mọi service xử lý field đó phải đổi. Interface service không "formal" hơn interface function.
- **The Fallacy of Independent Development and Deployment**: hệ thống lớn vẫn xây được bằng monolith/component. Vì bị coupled qua data/behavior, dev/deploy/vận hành **vẫn phải phối hợp**.
- **The Kitty Problem**: taxi aggregator dùng micro-service `TaxiUI`, `TaxiFinder`, `TaxiSupplier`, `TaxiSelector`, `TaxiDispatcher`. Marketing muốn **giao mèo con**: chỉ một số nhà cung cấp tham gia; tài xế dị ứng mèo không được chọn; xe vừa chở mèo trong 3 ngày không được chọn cho khách dị ứng. Kết quả: **mọi service đều phải đổi**. Đây là **cross-cutting concern**, mà functional decomposition rất dễ tổn thương trước nó.
- **Objects to the Rescue**: dùng SOLID. Logic chung ở base class trừu tượng; logic đặc thù chuyến xe tách sang component **Rides**; feature mới vào component **Kittens**; override bằng **Template Method** hoặc **Strategy**; tạo qua factory do UI điều khiển. Thêm feature Kitty chỉ đổi TaxiUI và **thêm jar mới**.
- **Component-Based Services**: service không cần là "monolith nhỏ". Service = tập abstract class trong jar; feature mới = jar mới extend, thêm vào load path. Thêm feature tuân thủ **OCP**.
- **Cross-Cutting Concerns**: *"architectural boundaries do not fall between services. Rather, those boundaries run through the services, dividing them into components."*

## Key Concepts
- **Architecturally significant** vs không.
- **Decoupling fallacy** / **independent deployability fallacy**.
- **Cross-cutting concern**: feature cắt ngang mọi phân rã chức năng.
- **Component-based service**: service có cấu trúc component bên trong.

## Mental Models
- "Thêm một feature cắt ngang thì **bao nhiêu service/module phải đổi**?" Đó là thước đo thật của decoupling.
- Dữ liệu dùng chung là **coupling ẩn** mạnh nhất.

## Anti-patterns
- **Đồng nhất "micro-service" với "kiến trúc tốt"**.
- **Phân rã theo chức năng (finder/selector/dispatcher)** mà bên trong không có điểm mở rộng.
- **Số micro-service ≈ số lập trình viên**.

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **"Module = service" fallacy trên Android**: tách `:feature:liveCameraMain`, `:feature:liveCameraMap`, `:feature:liveCameraSearch`, `:feature:liveCameraWatch` theo màn hình (giống TaxiFinder/Selector). Một yêu cầu cắt ngang như **"camera premium chỉ user premium xem được, free thì xem quảng cáo trước"** sẽ chạm **mọi** module.
- **Giải theo kiểu "Objects to the rescue"**: một điểm mở rộng ở domain mà mọi màn đều đi qua:
```kotlin
// domain — policy truy cập, mở rộng bằng Strategy
interface CameraAccessPolicy { suspend fun check(camera: LiveVideo): AccessDecision }
sealed interface AccessDecision { data object Allowed : AccessDecision; data object NeedsAd : AccessDecision; data object NeedsPremium : AccessDecision }

class WatchCameraUseCase(private val policy: CameraAccessPolicy) {
    suspend operator fun invoke(camera: LiveVideo) = policy.check(camera)
}
// feature mới = impl mới, đăng ký ở Main (Koin); các màn hình không đổi
class PremiumTierAccessPolicy(private val premium: PremiumStatusSource) : CameraAccessPolicy { ... }
```
- **Data coupling**: một `CommonUiState`/`DataStore` key dùng chung bởi 10 màn là "record dùng chung giữa các service". Thêm field thì phải soát cả 10 màn.
- **Backend**: app gọi nhiều endpoint nhỏ (`/categories`, `/templates`, `/famous-places`, `/live-cameras`) cũng không tự động "decoupled". Nếu cả 4 cùng đổi khi thêm khái niệm "region", coupling vẫn ở đó.

## Key Takeaways
1. Service không phải kiến trúc; ranh giới + Dependency Rule mới là kiến trúc.
2. Service vẫn coupled qua dữ liệu dùng chung.
3. Cross-cutting feature phơi bày điểm yếu của phân rã chức năng.
4. Thiết kế service/module có cấu trúc component bên trong và điểm mở rộng (OCP).

## Connects To
- **arch-ch08 (OCP)**, **arch-ch16 (Decoupling modes)**, **arch-ch18 (Service boundary)**.
