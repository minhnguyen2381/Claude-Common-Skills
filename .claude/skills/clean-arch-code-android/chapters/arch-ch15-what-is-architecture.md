# Clean Architecture — Chapter 15: What Is Architecture?

## Core Idea
Architecture là **hình dạng** mà người xây dựng tạo cho hệ thống (cách chia component, sắp xếp và giao tiếp) nhằm hỗ trợ **development, deployment, operation, maintenance**. Chiến lược: **"leave as many options open as possible, for as long as possible."** Kiến trúc tốt tách **policy** khỏi **details**.

## Frameworks Introduced
- **Architect is a programmer**: kiến trúc sư vẫn code, và là người code giỏi nhất. Nếu không tự trải nghiệm vấn đề mình tạo ra cho đội thì không làm đúng việc được.
- **Purpose of architecture**: hỗ trợ **vòng đời** hệ thống, không phải làm cho nó *chạy* (nhiều hệ thống kiến trúc tệ vẫn chạy tốt). Mục tiêu cuối: *minimize lifetime cost, maximize programmer productivity*.
- **4 mối quan tâm của vòng đời**:
  - **Development**: team 5 người làm monolith vẫn ổn; 5 team × 7 người thì cần component với interface ổn định. Nếu chỉ chạy theo lịch, kiến trúc sẽ thành "component-per-team".
  - **Deployment**: mục tiêu là **deploy bằng một hành động**. Micro-service sớm có thể dễ phát triển nhưng khó deploy.
  - **Operation**: phần cứng rẻ, người đắt, nên kiến trúc cản trở vận hành ít tốn kém hơn kiến trúc cản trở phát triển. Kiến trúc nên **phơi bày operation**: use case và feature là first-class, dễ thấy.
  - **Maintenance**: tốn nhất; chi phí chính là **spelunking** (đào bới tìm chỗ sửa) và **risk** (sửa chỗ này hỏng chỗ khác).
- **Policy vs Details**: Policy = business rules và quy trình, nơi chứa giá trị thật. Details = IO, DB, web, server, framework, protocol, DI framework.
  - Không cần chọn DB, web server, REST, micro-service hay DI framework sớm. Chờ càng lâu thì càng nhiều thông tin, càng nhiều thí nghiệm.
  - Nếu công ty đã chọn sẵn: *kiến trúc sư giỏi giả vờ như quyết định chưa được đưa ra*.
  - **"A good architect maximizes the number of decisions not made."**
- **Device Independence**: chương trình gắn chặt với card reader phải viết lại khi chuyển sang băng từ. OS trừu tượng hóa unit-record device, và OCP ra đời (chưa có tên).
- **Junk Mail story**: in thư quảng cáo; đổi đích từ line printer sang băng từ (rồi in offline 24/7) mà chương trình không đổi. Policy = định dạng tên/địa chỉ; detail = thiết bị.
- **Physical Addressing story**: code hard-wire cylinder/head/sector; đổi ổ đĩa thì sửa khắp nơi. Giải pháp: **relative address** + một routine chuyển đổi nhỏ.

## Key Concepts
- **Shape**: cách chia, sắp, nối component.
- **Policy**: business rules, giá trị cốt lõi.
- **Details**: IO, DB, framework… cần thiết nhưng không ảnh hưởng policy.
- **Spelunking**: chi phí đào bới code để tìm chỗ sửa.
- **Deferred decision**: quyết định chi tiết được hoãn nhờ policy không phụ thuộc vào nó.

## Mental Models
- "**Quyết định này có phải là business requirement không?**" Nếu không, nó là detail và nên hoãn được.
- Đo kiến trúc bằng **số quyết định chưa phải đưa ra** mà vẫn tiến triển được.

## Anti-patterns
- **Kiến trúc sư không code** (ivory tower).
- **Chọn DB/framework/DI ngày đầu** và để business rules dính vào chúng.
- **Hard-wire chi tiết vật lý** (cylinder/head/sector, URL, SDK cụ thể) vào policy.

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **Details trong một app Android**: Room vs DataStore vs file JSON assets, Retrofit vs Ktor, Koin vs Hilt, XML vs Compose, Glide vs Coil, Google Maps SDK, Firebase Remote Config, ads SDK (`:LibAds`). **Policy**: quy tắc tìm camera gần nhất, quy tắc xác thực số điện thoại, quy tắc giới hạn lượt dùng free/premium.
- **"Pretend the decision hasn't been made"**: công ty bắt buộc Koin, nhưng UseCase và ViewModel không nên `import org.koin.*` (chỉ dùng constructor injection), để mai đổi sang Hilt chỉ phải sửa `di/`. Satellite2 đã làm đúng: `factoryOf(::XxxUseCase)`, constructor thuần.
- **Physical addressing hiện đại**: hard-code tọa độ `LatLng`, URL ảnh CDN, hay key Remote Config khắp ViewModel. Hãy đặt sau một `ConfigProvider` / `LocationSource` interface.
- **Operation visible**: thư mục `domain/usecase/numberLocator/ValidatePhoneNumberUseCase.kt` cho dev mới biết app *làm gì* mà không cần chạy app. Đây là điểm mạnh của Satellite2.

## Key Takeaways
1. Kiến trúc hỗ trợ vòng đời (dev/deploy/ops/maintain), không phải "làm cho chạy".
2. Tách policy khỏi details; để details là plugin.
3. Hoãn quyết định chi tiết càng lâu càng tốt; tối đa hóa số quyết định chưa đưa ra.
4. Kiến trúc sư phải code.

## Connects To
- **arch-ch02**: hai giá trị. **arch-ch16**: Independence. **arch-ch17**: Boundaries.
- **arch-ch30–32**: DB, Web, Framework là details.
