# Clean Architecture — Chapter 18: Boundary Anatomy

## Core Idea
Lúc runtime, vượt ranh giới (boundary crossing) chỉ là **hàm bên này gọi hàm bên kia và truyền data**. Mấu chốt kiến trúc là **quản lý source code dependency** để tạo "tường lửa" chặn sự lan truyền thay đổi. Có nhiều dạng ranh giới với chi phí giao tiếp khác nhau, từ monolith tới service.

## Frameworks Introduced
- **Boundary crossing = function call + data**; thứ cần quản lý là dependency của **source code** (vì nó quyết định recompile/redeploy).
- **The Dreaded Monolith (source-level)**: không có biểu hiện vật lý; chỉ là sự phân tách có kỷ luật trong một address space. Ranh giới vô hình khi deploy nhưng **vẫn có giá trị**. Dựa vào **dynamic polymorphism**.
  - **Low-level client → high-level service**: runtime và compile-time dependency cùng chiều; **Data** định nghĩa ở **phía được gọi** (high-level).
  - **High-level client → low-level service**: dùng interface `Service` để đảo dependency ngược flow of control; **Data** định nghĩa ở **phía gọi** (high-level).
  - Giao tiếp rẻ nên có thể **chatty**.
- **Deployment Components**: DLL, jar, Gem, shared lib. Giống monolith nhưng giao dưới dạng binary; vẫn là function call, vẫn chatty được.
- **Threads**: **không phải** ranh giới kiến trúc hay đơn vị deploy, chỉ là cách tổ chức lịch thực thi.
- **Local Processes**: ranh giới vật lý mạnh hơn; address space riêng; giao tiếp qua socket, mailbox, message queue. Là "uber-component". Process cấp cao **không được** chứa tên, địa chỉ vật lý hay registry key của process cấp thấp. Chi phí vừa phải (OS call, marshaling, context switch), nên **hạn chế chatty**.
- **Services**: ranh giới mạnh nhất; giả định mọi giao tiếp qua mạng, độ trễ từ hàng chục ms tới giây, nên **tránh chatty**. Service cấp cao không chứa **URI** cụ thể của service cấp thấp.
- **Mixture**: hệ thống thực thường trộn nhiều loại; một service thường là facade cho các local process, bên trong là monolith hoặc deployment component.

## Key Concepts
- **Source-level / deployment-level / local process / service**: bốn dạng ranh giới, mạnh dần, đắt dần.
- **Chattiness**: tần suất gọi qua ranh giới; phải tỉ lệ nghịch với chi phí ranh giới.
- **Static vs dynamic polymorphism**: generics/template không bảo vệ khỏi recompile như interface.
- **Data placement rule**: data structure luôn thuộc về phía **cấp cao** của ranh giới.

## Mental Models
- Chọn **độ "dày" của ranh giới** theo nhu cầu: càng dày càng cách ly tốt nhưng càng đắt và càng phải ít trao đổi.
- "Data đi qua ranh giới **thuộc về ai?**". Luôn thuộc về phía policy.

## Anti-patterns
- **Coi thread là ranh giới kiến trúc**.
- **Gọi chatty qua network/IPC** như gọi hàm local.
- **Hard-code URI / process name** của component cấp thấp trong code cấp cao.

## 🤖 Android mapping (chuyển thể, không có trong sách)
| Dạng ranh giới | Android | Chi phí gọi | Chatty? |
|---|---|---|---|
| Source-level | Package trong `:app` (`domain` ↔ `data`) | Function call | OK |
| Deployment | Gradle module / AAR (`:LibAds`, `:core:domain`) | Function call | OK |
| Thread | `Dispatchers.IO/Main`, `launchIO {}` | **Không phải ranh giới** | — |
| Local process | `android:process=":player"`, bound Service + AIDL/Messenger, ContentProvider | Binder IPC + Parcel | Hạn chế |
| Service | Backend REST (`api.piontech.site`), Google Maps API | Network (100ms–s) | Tránh: gom batch, cache |

- **Data placement**: khi `UseCase` (cao) gọi `Repository` (thấp) qua interface, kiểu dữ liệu trả về (`LiveVideo`) phải **định nghĩa ở domain**, không phải `LiveVideoDtoModel` ở `data`. Hiện Satellite2 làm ngược (`Flow<Result<List<XxxDtoModel>>>`), nên DTO đang "rò" lên tầng cao.
- **Service-level chatty**: gọi API từng item trong list (`for (id in ids) api.getDetail(id)`) thì gom thành endpoint batch hoặc cache.
- **Không hard-code URI cấp thấp**: `BASE_URL`/`MAPS_BASE_URL` nằm trong `BuildConfig` và `NetworkModule` (Main), không nằm trong UseCase. Satellite2 đã làm đúng.
- **Thread không phải boundary**: chuyển `withContext(Dispatchers.IO)` không làm code "tách tầng". Repository chạy trên IO vẫn có thể vi phạm Dependency Rule.

## Key Takeaways
1. Ranh giới là về **source dependency**, không phải về runtime.
2. Bốn dạng ranh giới: source, deployment, process, service. Chọn theo nhu cầu.
3. Ranh giới càng đắt thì giao tiếp càng phải thưa.
4. Data qua ranh giới thuộc về phía cấp cao.

## Connects To
- **arch-ch16 (Decoupling modes)**, **arch-ch24 (Partial Boundaries)**, **arch-ch27 (Services)**.
