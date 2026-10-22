# Cheatsheet — Quyết định như Uncle Bob (áp vào Android)

## Decision rules (Khi X → làm Y, vì Z)
- **Khi một `import` trong domain trỏ ra ngoài** (`android.*`, `data.*`, Retrofit, Room, Koin) → đảo bằng interface ở domain, vì Dependency Rule. (arch-ch22)
- **Khi hai đoạn code giống nhau nhưng phục vụ actor khác** → giữ riêng, vì đó là duplication giả. (arch-ch07/16)
- **Khi cùng `when(type)` xuất hiện lần thứ 2** → sealed/polymorphism + một factory, vì G23 "ONE SWITCH". (code-ch03)
- **Khi thêm feature mà phải mở ≥3 file cũ giống nhau** → dừng, refactor ra abstraction trước, vì OCP + "So I stopped". (arch-ch08, code-ch14)
- **Khi quyết định không liên quan use case** (DB, DI, UI toolkit, multi-module) → hoãn hoặc đặt sau interface, vì giữ options open. (arch-ch15/17)
- **Khi cần SDK/thư viện mới** → wrapper + learning test, không để type của nó lan qua public API. (code-ch08)
- **Khi test business rule phải đi qua UI** → tạo testing API (ViewModel/UseCase + fake), vì UI volatile làm test fragile. (arch-ch28)
- **Khi hàm trả `null` để báo "không có/không hợp lệ"** → Special Case/sealed result, vì null đẩy việc cho caller. (code-ch07)
- **Khi viết comment giải thích code** → đổi tên/tách hàm trước; comment chỉ cho *why*/*warning*. (code-ch04)
- **Khi ranh giới đầy đủ quá đắt** → partial boundary + test kiến trúc canh giữ. (arch-ch24)

## Cây quyết định: logic này đặt ở đâu?
- Có tồn tại khi làm bằng giấy bút (quy tắc kiếm/tiết kiệm tiền)? → **Entity** (domain model có hành vi)
- Chỉ có nghĩa trong app (thứ tự bước, quota màn hình, điều kiện chuyển màn)? → **UseCase**
  - Chỉ đọc 1 nguồn, không rule? → ViewModel gọi Repository trực tiếp (relaxed layering có chủ đích)
- Biến dữ liệu thành thứ hiển thị (format, màu, ẩn/hiện)? → **Presenter** (ViewModel/mapper → UiState/UiModel)
- Gán vào widget, nhận click? → **View** (Fragment/FragmentEx/Adapter), humble
- Gọi SDK/DB/network/`Context`? → **Adapter/impl** ở data/platform sau interface domain
- Tạo/nối object? → **Main** (Koin module/Application)

## Trade-off matrix: chọn mức ranh giới
| Mức | Chi phí | Bảo vệ | Khi nào |
|---|---|---|---|
| Không ranh giới | 0 | 0 | Prototype, màn 1 lần |
| Facade | Rất thấp | Thấp (transitive) | Gom API cho tiện |
| Strategy (interface + impl, cùng module) | Thấp | Trung bình (kỷ luật) | Mặc định cho repository/provider |
| Skip last step (domain/data package riêng + Konsist) | Vừa | Khá | App 1 module cỡ Satellite2 |
| Gradle module + `internal` | Cao | Cao (compiler) | Build chậm, ≥2 team, reuse |
| Service/process | Rất cao | Rất cao | Scale/vận hành thật sự cần |

## Thresholds & defaults
| Thứ | Ngưỡng |
|---|---|
| Hàm | Hiếm khi > 20 dòng; indent ≤ 2; lý tưởng 2–5 dòng |
| Tham số | 0–2; tránh 3; >3 → argument object |
| Dòng code | ≤ 120 ký tự |
| File | ~200 dòng, giới hạn ~500 |
| Mô tả class | ≤ 25 từ, không "và/hoặc/nếu/nhưng" |
| Component metric | `I = Fan-out/(Fan-in+Fan-out)` giảm dần theo mũi tên; `A ≈ 1 − I`; `D = \|A+I−1\|` > ~0.1 thì xem lại |
| Tỉ lệ đọc:viết | > 10:1, nên tối ưu cho người đọc |
| Test | Chạy một lệnh; nhanh; một khái niệm mỗi test |
| Tiền tệ | Không dùng `Float/Double`; dùng `Long` (đơn vị nhỏ nhất)/`BigDecimal` [G26] |

## Tells & smells (thấy X → có lẽ đang bị Y)
| Thấy | Có lẽ | Mã |
|---|---|---|
| Tên class có `Manager/Helper/Processor/Super` | Nhiều trách nhiệm | code-ch10 |
| Tham số `Boolean` | Hàm làm 2 việc | F3/G15 |
| `a.b().c().d()` qua object | Vi phạm Demeter | G36 |
| `if (x is Impl)` / `startsWith("acme")` | Vi phạm LSP | arch-ch09 |
| `+1/-1` rải rác | Boundary chưa đóng gói | G33 |
| Comment `// step 1 / step 2` | Hàm nhiều section | code-ch03 |
| Mỗi PR chạm `CommonViewModel`/`BaseFragment` | God class / framework nội bộ quá dày | arch-ch07/32 |
| UseCase nhận `UiModel` / trả `Dto` | Dependency Rule bị phá | arch-ch20/22 |
| UseCase có `Context`, `LatLng`, `FirebaseX` | Viết "firmware" | arch-ch29 |
| Test cần emulator để kiểm logic | Thiếu Humble Object | arch-ch23 |
| Flaky test bị `@Ignore` | Overridden safety / bug concurrency | G4, code-ch13 |
| `var` trong ViewModel ngoài StateFlow | Shared mutable state | arch-ch06 |
| Thêm SDK mới thì sửa 20 file | Thiếu wrapper | code-ch08 |
| Muốn "viết lại từ đầu" | Grand Redesign trap | arch-ch01, code-ch01 |

## Câu thần chú
- *"The only way to go fast, is to go well."*
- *"Source code dependencies must point only inward."*
- *"A module should be responsible to one, and only one, actor."*
- *"A good architect maximizes the number of decisions not made."*
- *"Functions should do one thing. They should do it well. They should do it only."*
- *"Leave the campground cleaner than you found it."*
