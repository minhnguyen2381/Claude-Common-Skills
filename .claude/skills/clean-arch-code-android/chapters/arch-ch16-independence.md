# Clean Architecture — Chapter 16: Independence

## Core Idea
Kiến trúc tốt hỗ trợ **use cases, operation, development, deployment**. Vì không biết trước hết mọi yêu cầu, hãy tách hệ thống theo **lớp ngang (layers)** và **lát dọc (use cases)**, cẩn thận với **duplication giả**, và để ngỏ **decoupling mode** (source / deployment / service).

## Frameworks Introduced
- **4 thứ kiến trúc phải hỗ trợ**:
  - **Use cases**: kiến trúc phải *phơi bày* ý đồ hệ thống; app giỏ hàng phải *trông như* app giỏ hàng.
  - **Operation**: throughput, latency; lựa chọn thread/process/service là một **option để ngỏ**.
  - **Development**, theo **Conway's law**: *"Any organization that designs a system will produce a design whose structure is a copy of the organization's communication structure."*
  - **Deployment**: mục tiêu "immediate deployment" sau khi build, không cần chục script config.
- **Decoupling Layers (horizontal)**: UI | application-specific business rules (ví dụ validate input) | application-independent business rules (ví dụ tính lãi, đếm tồn kho) | database. Mỗi lớp đổi vì lý do và nhịp độ khác nhau.
- **Decoupling Use Cases (vertical)**: `addOrder` và `deleteOrder` đổi khác nhau. Mỗi use case là một lát dọc xuyên qua các lớp; tách UI, rule, DB của từng use case.
- **Duplication: true vs accidental**:
  - *True*: sửa một chỗ thì phải sửa mọi bản sao, nên phải loại bỏ.
  - *Accidental/false*: hai đoạn giống nhau nhưng tiến hóa khác nhau. **Đừng hợp nhất theo phản xạ.** Hai màn hình có cấu trúc giống nhau rất có thể sẽ phân kỳ.
  - Truyền **DB record lên UI** vì "giống view model" là duplication giả; hãy tạo view model riêng và copy field.
- **Decoupling Modes**:
  | Mode | Ranh giới | Giao tiếp |
  |---|---|---|
  | Source level | Module source không ép nhau recompile | Function call, một executable (monolith) |
  | Deployment level | jar/DLL/shared lib độc lập | Function call, IPC, socket, shared memory |
  | Service level | Chỉ chia sẻ data structure | Network packets |
  - Lời khuyên của tác giả: đẩy decoupling tới mức **có thể** tạo service khi cần, nhưng **giữ cùng address space càng lâu càng tốt**. Hệ thống tốt có thể sinh ra là monolith, lớn thành service, và **trượt ngược lại** về monolith.
  - Service-level mặc định: đắt (thời gian dev và tài nguyên) và thô.

## Key Concepts
- **Horizontal layers** vs **vertical use case slices**.
- **Conway's law**.
- **Accidental duplication**: giống nhau tạm thời.
- **Decoupling mode**: source / deployment / service.
- **Hot-swap**: thêm use case bằng cách thêm jar/service mới.

## Mental Models
- Hệ thống là **lưới**: hàng ngang là layer, cột dọc là use case. Mỗi ô là một đơn vị đổi độc lập.
- Trước khi DRY, hỏi: "**Hai đoạn này có luôn đổi cùng nhau không?**"
- Decoupling mode là núm vặn, không phải quyết định một lần.

## Anti-patterns
- **Knee-jerk elimination of duplication** giữa các use case hay giữa DB record và view model.
- **Micro-service by default**: tốn kém, thô.
- **Monolith phụ thuộc vào tính monolith** (chia sẻ state toàn cục) nên không thể tách sau này.

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **Lưới layer × use case trong Satellite2**:
  | | LiveCamera search | NumberLocator search |
  |---|---|---|
  | UI | `LiveCameraSearchResultFragment` | `NumberLocatorMainScreenFragment` |
  | App rules | `GetAllLiveVideosWithFilterAndSearchByKeywordUseCase` | `ValidatePhoneNumberUseCase`, `SearchNumberLocatorUseCase` |
  | Data | `LiveVideoRepository` | `NumberLocatorRepository` |
  Hai cột phải tách nhau, đừng tạo `GenericSearchViewModel` dùng chung chỉ vì cả hai "có ô search + list + paging".
- **Accidental duplication thường gặp**: `SearchHistoryLiveVideo` và `SearchHistoryNumberLocator` giống nhau hôm nay nhưng là hai actor; giữ hai use case. Một `BaseSearchHistoryUseCase<T>` generic sẽ bó buộc cả hai.
- **DB record → UI**: dùng Room `@Entity` trực tiếp trong `BaseListAdapter`. Tạo `XxxUIModel` + `toPresentation()` (Satellite2 đã có quy ước DtoModel/UIModel, giữ nó nghiêm ngặt).
- **Decoupling modes trên Android**:
  | Mode | Android |
  |---|---|
  | Source | Package trong `:app` (`feature/`, `domain/`, `data/`) |
  | Deployment | Gradle module (`:feature:liveCamera`, `:core:domain`), Dynamic Feature Module |
  | Service | Logic chạy ở backend / Cloud Function; app chỉ gửi DTO; hoặc tách process (`android:process`) cho service nặng |
  Bắt đầu ở mức source nhưng giữ quy tắc import (domain không import data/feature) để khi cần có thể tách module trong một buổi chiều.
- **Conway trên Android**: nếu có team riêng cho ads/monetization thì `:LibAds` là module riêng; đó là đúng quy luật.

## Key Takeaways
1. Tách theo cả layer (ngang) lẫn use case (dọc).
2. Phân biệt duplication thật và giả; đừng gộp use case hoặc DB-record/view-model.
3. Decoupling mode là option: bắt đầu monolith có kỷ luật, tách dần khi cần, có thể đảo ngược.
4. Kiến trúc phản ánh cấu trúc tổ chức (Conway).

## Connects To
- **arch-ch07 (SRP, accidental duplication)**, **arch-ch21 (Screaming Architecture)**, **arch-ch27 (Services)**.
- **code-ch17 (G5 Duplication)**: phía code của DRY; cần cân bằng với chương này.
