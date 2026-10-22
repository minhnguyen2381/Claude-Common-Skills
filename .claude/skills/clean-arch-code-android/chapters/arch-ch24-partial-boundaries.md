# Clean Architecture — Chapter 24: Partial Boundaries

## Core Idea
Ranh giới đầy đủ (interface đối xứng hai chiều, Input/Output DS, component compile/deploy riêng) **rất đắt**. Khi chưa chắc cần, kiến trúc sư có thể làm **partial boundary** để "giữ chỗ". Mỗi cách đều rẻ hơn nhưng **có thể suy thoái** nếu ranh giới không bao giờ thành hiện thực.

## Frameworks Introduced
- **YAGNI vs "Yeah, but I might"**: Agile phản đối thiết kế dự phòng; kiến trúc sư đôi khi vẫn muốn giữ chỗ.
- **Skip the Last Step**: làm đủ mọi thứ để compile/deploy riêng (interface đối xứng, DS in/out) nhưng **vẫn gộp vào một component**. Tốn code như ranh giới đầy đủ nhưng **không tốn** quản lý version/release.
  - FitNesse: web server được thiết kế tách khỏi wiki để tái dùng, nhưng vẫn giao một jar ("download and go"). Theo thời gian không ai cần tách, nên dependency bắt đầu vượt ranh giới **sai chiều**, và giờ tách lại là việc nặng.
- **One-Dimensional Boundaries (Strategy pattern)**: `Client` → `ServiceBoundary` (interface) ← `ServiceImpl`. Đã có dependency inversion cô lập Client khỏi Impl. Nhưng không có interface đối xứng nên **backchannel** (Client gọi thẳng ServiceImpl, mũi tên chấm "nasty dotted arrow") chỉ được ngăn bằng kỷ luật.
- **Facades**: rẻ nhất, **hy sinh cả dependency inversion**. Class `Facade` liệt kê mọi service như method và chuyển tiếp tới các class mà client không được gọi trực tiếp. Client vẫn **phụ thuộc bắc cầu** vào mọi service class (đổi một cái thì recompile), backchannel rất dễ.
- **Vai trò kiến trúc sư**: quyết định nơi nào **có thể** có ranh giới, và làm **đầy đủ** hay **một phần**.

## Key Concepts
- **Full-fledged boundary**: reciprocal polymorphic interfaces + I/O DS + component riêng.
- **Partial boundary**: giữ chỗ với chi phí thấp hơn.
- **Backchannel**: dependency lách qua ranh giới, phá cô lập.
- **Degradation**: ranh giới mục dần khi không được dùng.

## Mental Models
- Partial boundary là **"đặt cột mốc"**. Phải có người canh, nếu không sẽ bị xóa dần.
- Chọn mức theo **xác suất cần** × **chi phí thêm sau này**.

## Anti-patterns
- **Partial boundary không ai canh**: dependency vượt sai chiều theo thời gian.
- **Facade mà client vẫn import các service bên dưới**.

## 🤖 Android mapping (chuyển thể, không có trong sách)
| Mức | Android | Chi phí | Rủi ro |
|---|---|---|---|
| Full | Module Gradle riêng `:core:domain` (JVM) + `:core:data` + interface hai chiều | Cao (build config, publish nếu tái dùng) | Thấp: compiler chặn |
| Skip last step | Package `domain/` + `data/` trong `:app`, có interface đầy đủ, nhưng **cùng module** | Vừa | Import sai chiều không bị compiler chặn |
| One-dimensional (Strategy) | `interface LiveVideoRepository` + `Impl`, binding Koin | Thấp | ViewModel lỡ `import ...RepositoryImpl` hoặc gọi thẳng `ApiInterface` |
| Facade | `CommonViewModel` / `AppRepository` gom mọi repo | Rất thấp | Phụ thuộc bắc cầu toàn bộ |

- Satellite2 hiện ở mức **skip the last step / one-dimensional**: có `domain/` và `data/` nhưng chung `:app`. Đúng như cảnh báo FitNesse, đã có dependency vượt sai chiều (`domain.usecase` → `data.repository`, `data.model.*UiModel`).
- **Canh giữ partial boundary rẻ tiền** khi chưa tách module:
  - Thêm test kiến trúc bằng **Konsist** (thư viện lint kiến trúc cho Kotlin), ví dụ assert "các file trong `..domain..` không import `..data..` hoặc `android..`".
  - Hoặc một bước CI dùng `grep` (xem lệnh ở arch-ch22).
  - Hoặc `internal` visibility khi đã tách module.

## Key Takeaways
1. Ranh giới đầy đủ đắt. Partial boundary là phương án giữ chỗ hợp lý.
2. Ba kiểu: skip last step, Strategy (one-dimensional), Facade, giảm dần chi phí và sức bảo vệ.
3. Partial boundary sẽ suy thoái nếu không được canh. Tự động hóa việc canh.

## Connects To
- **arch-ch25 (Layers and Boundaries: khi nào làm full/partial)**, **arch-ch17**, **arch-ch34 (encapsulation & package)**.
