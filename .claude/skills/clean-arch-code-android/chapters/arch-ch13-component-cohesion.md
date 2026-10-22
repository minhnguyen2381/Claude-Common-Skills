# Clean Architecture — Chapter 13: Component Cohesion

## Core Idea
Ba nguyên tắc quyết định **class nào thuộc component nào**: REP, CCP, CRP. Chúng **kéo nhau ngược chiều**. Kiến trúc sư phải chọn điểm cân bằng trong "tension triangle", và điểm đó **dịch chuyển theo độ trưởng thành** của dự án.

## Frameworks Introduced
- **REP — Reuse/Release Equivalence Principle**: *"The granule of reuse is the granule of release."*
  - Component tái sử dụng phải có release process, số version, release notes để người dùng quyết định nâng cấp hay không.
  - Class trong cùng component phải có **chủ đề chung** và "make sense" khi release cùng nhau. Lời khuyên yếu, nhưng vi phạm thì dễ thấy.
- **CCP — Common Closure Principle**: *"Gather into components those classes that change for the same reasons and at the same times. Separate into different components those classes that change at different times and for different reasons."*
  - Đây là **SRP cho component**, liên quan đến "closure" của OCP: closure mang tính chiến lược, khép với những loại thay đổi thường gặp nhất.
  - Với đa số ứng dụng, **maintainability quan trọng hơn reusability**.
- **CRP — Common Reuse Principle**: *"Don't force users of a component to depend on things they don't need."*
  - Class được reuse cùng nhau thì đặt chung (ví dụ container + iterator). Class **không** gắn chặt thì **tách ra**.
  - Đây là **phiên bản tổng quát của ISP**.
- **Sound bite (SRP/CCP)**: *"Gather together those things that change at the same times and for the same reasons. Separate those things that change at different times or for different reasons."*
- **Sound bite (ISP/CRP)**: *"Don't depend on things you don't need."*
- **Tension Diagram**: REP và CCP là nguyên tắc *inclusive* (làm component to ra), CRP là *exclusive* (làm nhỏ lại). Mỗi cạnh tam giác là cái giá khi bỏ đỉnh đối diện:
  - Bỏ CCP (chỉ REP + CRP): **too many components to change** khi có thay đổi đơn giản.
  - Bỏ CRP (chỉ REP + CCP): **too many unneeded releases**.
  - Bỏ REP (chỉ CCP + CRP): **hard to reuse**.
  - Dự án mới bắt đầu ở phía CCP (chỉ hy sinh reuse); khi trưởng thành và được dự án khác dùng thì trượt sang REP.

## Key Concepts
- **Granule of reuse/release**: đơn vị nhỏ nhất có version.
- **Strategic closure**: khép component trước những loại thay đổi phổ biến nhất.
- **Inclusive vs exclusive principle**: làm to ra vs làm nhỏ lại.
- **Jitter**: cấu trúc component thay đổi theo thời gian.

## Mental Models
- Hỏi khi đặt một class: (1) Nó **đổi cùng lúc** với ai? (CCP) (2) Ai **dùng** nó cùng với ai? (CRP) (3) Có **release** cùng được không? (REP)
- Cấu trúc component phản ánh **cách dự án được phát triển và sử dụng**, không phải chức năng của nó.

## Anti-patterns
- **Component "utils" hổ lốn**: vi phạm REP và CRP.
- **Chẻ quá nhỏ ngay từ đầu vì "reuse"**: mỗi feature đổi phải sửa 5 module (mất CCP).
- **Thiết kế component cố định mãi mãi**: cân bằng là động.

## Worked Example
Dự án app mới (1 team):
- Giai đoạn 1: ưu tiên CCP, gom theo feature (`feature/liveCamera/*`) vì mọi thay đổi xảy ra trong một chỗ.
- Giai đoạn 2: team khác muốn dùng phần ads, nên tách `:LibAds` có version (REP) và chỉ chứa thứ luôn dùng cùng nhau (CRP).
- Giai đoạn 3: app thứ hai chỉ cần interstitial, không cần native ads. CRP gợi ý tách tiếp `:ads-interstitial`, `:ads-native`.

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **CCP → package-by-feature**: Satellite2 đã gom `feature/{name}/` (Fragment, FragmentEx, ViewModel, adapter, dialog), nên thay đổi một màn chỉ chạm một thư mục. Nhưng `data/model/liveVideo/*UiModel` lại nằm ở `data`, tách xa feature, nên mỗi đổi UI phải chạm hai nơi. Gợi ý: UiModel và mapper `toPresentation()` nên ở cạnh feature/presentation.
- **CRP → module `:core:ui` bị nhồi**: nếu `:core:ui` chứa cả BlurView glass effect, YouTube player, map utils thì mọi feature kéo theo các lib nặng đó. Hãy tách `:core:ui-media`, `:core:ui-map`.
- **REP → `:LibAds`, `:permissionx`**: nếu dùng chung giữa nhiều app của công ty, publish lên Maven nội bộ hoặc JitPack có version (`libads:1.4.2`) cùng CHANGELOG, thay vì copy source module.
- Bảng chọn nhanh:
| Tình huống | Ưu tiên |
|---|---|
| 1 app, 1–3 dev | CCP (package-by-feature trong `:app`) |
| Nhiều app dùng chung lib | REP (module publish có version) |
| Lib dùng chung nhưng mỗi app dùng một phần | CRP (chẻ lib theo nhóm dùng chung) |

## Key Takeaways
1. REP: cái gì reuse thì phải release có version.
2. CCP: gom thứ đổi cùng nhau (SRP cho component).
3. CRP: không bắt người dùng phụ thuộc thứ họ không cần (ISP cho component).
4. Ba nguyên tắc xung đột nhau; dự án trẻ ưu tiên CCP, dự án trưởng thành tiến về REP.

## Connects To
- **arch-ch07 (SRP)**, **arch-ch10 (ISP)**, **arch-ch14 (Coupling)**, **arch-ch21 (Screaming Architecture)**.
