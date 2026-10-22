# Clean Architecture — Appendix A: Architecture Archaeology

## Core Idea
Hồi ký các dự án của Uncle Bob từ 1970 tới đầu thập niên 1990. Mỗi câu chuyện là **nguồn gốc thực tế** của một nguyên tắc trong sách: tách phần cứng khỏi business rules, DB là detail, kiến trúc phải vừa với quy mô, framework tái sử dụng phải được xây cùng nhiều ứng dụng.

## Frameworks Introduced (bài học theo dự án)
| Dự án | Chuyện gì xảy ra | Bài học |
|---|---|---|
| **Union Accounting** (1970s) | Code hard-wire cấu trúc đĩa; code lộn xộn bị quản lý ra lệnh "lock down, never modify", thành **officially rigid** | Giá trị của code sạch; relative addressing (xem arch-ch15) |
| **Laser Trim** | Compile 30 phút; kiến trúc "MOP" kiểu cũ | Murphy's law of program size |
| **SAC: Service Area Computer** (M365 assembler, 60K dòng) | Code điều khiển modem **rải khắp** business rules và UI. Phần cứng mới có bit format khác hoàn toàn, nên phải hack subroutine serial bus để dịch lệnh modem cũ sang mới: *"the worst hack imaginable"* | **Cô lập phần cứng khỏi business rules, trừu tượng hóa interface** |
| **4-TEL: SAC/COLT split** | Tách phần "dial & measure" (COLT ở central office) khỏi phần "analyze & report" (SAC); hai bên trao đổi gói lệnh ngắn kiểu DSL ("DIAL XXXX", "MEASURE") | Ranh giới sạch, tách theo trách nhiệm, giao tiếp hẹp |
| **4-TEL: ROM chips + RAM vectors** | Gọi subroutine trên từng chip EPROM qua bảng vector trong RAM, nên sửa một chip không phải burn lại cả 30 chip | Polymorphism/plugin trước khi có OO |
| **Grand Redesign in the Sky** (SAC → C/UNIX) | "Tiger Team" đầu tiên đốt 2–3 man-year rồi thất bại; lần hai kéo dài nhiều năm, không chắc từng được deploy. Đội redesign không đuổi kịp đội bảo trì hệ cũ; bản Europe bị fork và tích hợp lại thất bại 3 lần | Big rewrite là cái bẫy (xem arch-ch01); khác biệt nên là cấu hình, không phải fork |
| **pCCU / Schedule Trap** | Liên tục hoãn kiến trúc lớn vì "còn thời gian", rồi khách cần trong 1 tháng. Giải pháp tối giản pCCU làm trong 1 tuần | Đừng hoãn việc quan trọng mãi; giải pháp đơn giản thường đủ |
| **VRS** | Bị trói vào hệ DB bên thứ ba | **Database là detail**; tránh couple chặt với hệ thống bên thứ ba |
| **Electronic Receptionist** (voice mail đầu tiên) | Kiến trúc "service-oriented": mỗi trạng thái cuộc gọi là một process, truyền qua file | Ranh giới thật xuất hiện dù chưa "clean" |
| **Craft Dispatch System** (1985) | State machine **externalize ra file text**; mỗi transition khởi động service mới; hot-swap; shared memory 3DBB; định dạng **FLD** (giống XML/JSON) | OCP qua cấu hình; *"There is nothing new under the Sun."* |
| **Clear Communications** | Chuyển sang C++ và OO, học Booch, Wirfs-Brock, Stroustrup | Nền tảng của SOLID |
| **ROSE** (công cụ CASE, Rational) | Kiến trúc "enterprise" hoành tráng; nhiều năm, 2 bản phát hành nhạt, bị thay bằng một app nhỏ từ Wisconsin | *"Architecture must be flexible enough to adapt to the size of the problem."* |
| **Architects Registry Exam** (ETS/NCARB, 18 vignette × 2 = 36 app) | Năm đầu làm framework 45K dòng cho app đầu tiên nhưng **không tái dùng được**. Làm lại cùng **4 app song song**; sau đó app mới "pop out every few weeks". Vignette là plugin của framework (Dependency Rule) | *"You can't make a reusable framework until you first make a usable framework."* Framework tái dùng phải được xây **cùng nhiều ứng dụng tái dùng** |

## Key Concepts
- **Officially rigid code**: code bị cấm sửa vì quá rối.
- **Smeared hardware control**: logic thiết bị rải khắp hệ thống.
- **Schedule trap**: hoãn kiến trúc vì tưởng còn thời gian.
- **Rule of three for frameworks**: xây cùng ≥ 3–4 ứng dụng thật.

## Mental Models
- Mỗi nguyên tắc trừu tượng trong sách đều có **một vết sẹo thật** phía sau.
- Trước khi làm "framework dùng chung", hỏi: "**Đã có ít nhất 3 nơi thật sự dùng chưa?**"

## Anti-patterns
- **Rải code điều khiển thiết bị/SDK khắp nơi**.
- **Kiến trúc enterprise cho vấn đề nhỏ**.
- **Viết framework tái dùng trước khi có ứng dụng dùng nó**.

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **SAC modem story = SDK ads/maps rải khắp app**: AdMob, Pangle hay Google Maps đổi API (major version) thì mọi Fragment gọi trực tiếp đều phải sửa. Satellite2 gom ads vào `:LibAds` là đúng hướng; giữ API của `:LibAds` theo **ngôn ngữ sản phẩm** (`showInterstitialAt(Placement.AFTER_SEARCH)`) thay vì lộ class SDK.
- **Base project/template công ty** (ví dụ package `pion.tech.pionbase` gợi ý một base dùng chung giữa nhiều app): bài học ETS áp dụng trực tiếp. Base class và util chỉ nên đưa vào "base" khi đã được **3–4 app thật** dùng; nếu không, base sẽ đầy thứ không vừa với app mới (đúng như framework 45K dòng đầu tiên).
- **Externalized state machine ≈ Remote Config / navigation graph**: thay đổi flow (onboarding, vị trí ads) bằng cấu hình thay vì code, chính là OCP. Cần giữ logic diễn giải config ở một chỗ (một `ConfigProvider`) để không thành "modem control smeared everywhere".

## Key Takeaways
1. Cô lập phần cứng/SDK khỏi business rules (bài học SAC).
2. DB và hệ thống bên thứ ba là detail (VRS).
3. Kiến trúc phải vừa với quy mô vấn đề (ROSE).
4. Framework tái dùng chỉ thành công khi xây cùng nhiều ứng dụng thật (ETS).

## Connects To
- **arch-ch15 (Device independence, physical addressing)**, **arch-ch29 (Embedded)**, **arch-ch30 (DB detail)**, **arch-ch32 (Frameworks)**.
