# Clean Architecture — Chapter 25: Layers and Boundaries

## Core Idea
Hệ thống thường có **nhiều hơn 3 tầng** (UI, business, DB). Ranh giới kiến trúc **ở khắp nơi**, theo mọi trục thay đổi. Kiến trúc sư phải **đoán thông minh** ranh giới nào làm đầy đủ, một phần hay bỏ qua, và **theo dõi liên tục** để dựng ranh giới đúng **điểm uốn**, khi chi phí làm nhỏ hơn chi phí bỏ qua.

## Frameworks Introduced
- **Hunt the Wumpus** (game text 1972): `GO EAST`, `SHOOT WEST`.
  - Trục 1: **ngôn ngữ** (English/Spanish), nên GameRules giao tiếp qua **API không phụ thuộc ngôn ngữ**.
  - Trục 2: **lưu trữ** (flash/cloud/RAM), nên có API cho DataStorage theo Dependency Rule.
  - Trục 3: **cơ chế truyền văn bản** (shell, SMS, chat), nên có ranh giới Language ↔ TextDelivery.
- **API is owned by the user (upstream)**: `GameRules` định nghĩa API mà `Language` implement; `Language` định nghĩa API mà `TextDelivery` implement. Biến thể (English, SMS, CloudData) implement interface của component API trừu tượng (dashed outline).
- **Streams**: sắp diagram để mọi mũi tên chĩa lên, `GameRules` ở đỉnh. Data flow chia thành **luồng user** (TextDelivery → Language → GameRules) và **luồng persistence** (GameRules → DataStorage), gặp nhau ở GameRules (Central Transform).
- **Crossing the streams**: thêm multiplayer (Network) thì có 3 luồng.
- **Splitting the streams**: GameRules tách tiếp thành **MoveManagement** (cơ chế bản đồ, cấp thấp hơn, phát sự kiện `FoundFood`, `FellInPit`) và **PlayerManagement** (máu, thắng thua, cấp cao hơn). Với MMO thì PlayerManagement là **micro-service** trên server, nên đó là ranh giới đầy đủ.
- **The architect's dilemma**: YAGNI (*over-engineering often much worse than under-engineering*) đối lập với chi phí và rủi ro rất cao khi thêm ranh giới muộn.
  - *"O Software Architect, you must see the future. You must guess—intelligently."*
  - Không phải quyết định một lần: **quan sát**, chờ **dấu hiệu ma sát đầu tiên**, cân chi phí và xem lại thường xuyên. Dựng ranh giới tại **inflection point**.
  - Chú thích của tác giả: **không** áp dụng Clean Architecture cho chương trình 200 dòng; Wumpus chỉ là proxy cho hệ thống lớn.

## Key Concepts
- **Axis of change**: mỗi trục là một ranh giới tiềm năng.
- **API ownership**: upstream định nghĩa, downstream implement.
- **Data streams**: các luồng dữ liệu hội tụ ở policy cao nhất.
- **Inflection point**: thời điểm chi phí dựng ranh giới < chi phí bỏ qua.
- **Friction**: dấu hiệu đầu tiên cho thấy thiếu ranh giới.

## Mental Models
- Liệt kê **mọi trục có thể thay đổi**, rồi đánh dấu: full / partial / ignore / watch.
- Kiến trúc là **việc canh gác liên tục**, không phải bản vẽ ngày đầu.

## Anti-patterns
- **Áp full Clean Architecture cho app nhỏ** (over-engineering).
- **Không bao giờ xem lại**: bỏ lỡ inflection point, rồi thêm ranh giới muộn rất đắt.
- **API do implementer định nghĩa** (ví dụ domain dùng API do Retrofit service quy định).

## 🤖 Android mapping (chuyển thể, không có trong sách)
Liệt kê trục thay đổi cho một app kiểu Satellite2 và quyết định:
| Trục thay đổi | Ví dụ | Quyết định gợi ý |
|---|---|---|
| Ngôn ngữ UI (23 ngôn ngữ) | `strings.xml` | Đã có (Android resource), giữ `UiText` ở Presenter |
| Nguồn dữ liệu | API Piontech ↔ assets JSON ↔ Room cache | **Full**: repository interface ở domain |
| Map provider | Google Maps ↔ Mapbox ↔ OSM | **Partial (Strategy)**: `MapRenderer` interface, impl Google |
| Ads/IAP vendor | AdMob, Pangle, Mintegral… | **Full**: `:LibAds` module + interface `AdsGateway` |
| Analytics vendor | Firebase ↔ khác | **Partial**: `AnalyticsLogger` interface (rẻ, đáng làm) |
| UI toolkit | XML ↔ Compose | **Watch**: giữ ViewModel/UiState không phụ thuộc View; khi có màn Compose đầu tiên là inflection point |
| Multi-module | `:app` ↔ `:feature:*` | **Watch**: khi build > vài phút hoặc 2+ team, tách |

- **API ownership**: domain định nghĩa `LiveVideoRepository.getNearest(lat, lng)`; Retrofit `@GET` trong `data` chỉ là cách implement. **Đừng** để signature domain bám theo response của backend (`DataResponse<T>`, `customField`).
- **Splitting streams kiểu Android**: trong NumberLocator, `ParseInternationalNumberUseCase` (cơ chế, cấp thấp) phát kết quả cho `LookupQuota`/premium policy (cấp cao). Nếu sau này quota chuyển lên server thì đó là ranh giới service, nên giữ quota sau interface ngay từ giờ (partial).

## Key Takeaways
1. Ranh giới tiềm năng ở khắp nơi, theo mọi trục thay đổi.
2. API thuộc về component upstream (bên dùng).
3. Cân YAGNI và chi phí thêm muộn; đoán thông minh.
4. Theo dõi ma sát, dựng ranh giới tại inflection point, xem lại thường xuyên.

## Connects To
- **arch-ch24 (Partial)**, **arch-ch19 (Level, central transform)**, **arch-ch17 (axis of change)**.
