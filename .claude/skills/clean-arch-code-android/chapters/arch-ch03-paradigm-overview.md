# Clean Architecture — Chapter 3: Paradigm Overview

## Core Idea
Chỉ có **ba paradigm** lập trình, và mỗi paradigm **lấy đi** một khả năng của lập trình viên chứ không thêm gì. Ba paradigm đó tương ứng với ba mối quan tâm lớn của kiến trúc.

## Frameworks Introduced
- **The Three Paradigms (as disciplines)**:
  - **Structured programming** *imposes discipline on direct transfer of control* (bỏ `goto`). Dijkstra, 1968.
  - **Object-oriented programming** *imposes discipline on indirect transfer of control* (bỏ con trỏ hàm thô). Dahl & Nygaard, 1966.
  - **Functional programming** *imposes discipline upon assignment* (hạn chế gán biến). Church, λ-calculus, 1936.
- **Paradigm → Architecture concern**:
  | Paradigm | Dùng trong kiến trúc để |
  |---|---|
  | Polymorphism (OO) | Vượt qua architectural boundaries |
  | Functional | Kỷ luật vị trí và truy cập dữ liệu |
  | Structured | Nền tảng thuật toán bên trong module |
  → Tương ứng với **function, separation of components, data management**.

## Key Concepts
- **Paradigm**: cách lập trình (dùng cấu trúc nào, khi nào), độc lập với ngôn ngữ.
- **Negative discipline**: paradigm nói "đừng làm gì" nhiều hơn "hãy làm gì".
- **Không có paradigm thứ tư**: cả ba bỏ đi `goto`, function pointer, assignment; không còn gì để bỏ nữa.

## Mental Models
- Nghĩ về mỗi best practice như **một sự kiềm chế có chủ đích**. Sức mạnh đến từ việc từ bỏ tự do.
- Khi thiết kế, hỏi: "Ở đây mình đang dùng paradigm nào cho mục đích nào: điều khiển, ranh giới, hay dữ liệu?"

## Anti-patterns
- **Coi OO là "mô hình hóa thế giới thực"**: mơ hồ, không giúp gì cho kiến trúc (xem arch-ch05).
- **Nghĩ ngôn ngữ mới thì có paradigm mới**: công cụ đổi, bản chất phần mềm không đổi.

## 🤖 Android mapping (chuyển thể, không có trong sách)
Kotlin hỗ trợ cả ba, và mỗi paradigm có "đất dụng võ" riêng trong app Android:
| Paradigm | Dùng ở đâu trong app |
|---|---|
| Structured | Thân hàm trong UseCase/ViewModel: `if/when/for`, early return |
| OO / polymorphism | `interface Repository` + `RepositoryImpl`, `DeviceLocaleProvider` + `AndroidDeviceLocaleProvider`, Koin `bind` |
| Functional | `data class UiState` + `copy()`, `StateFlow`, `Flow.map/combine`, mapper `toPresentation()` thuần |

## Key Takeaways
1. Ba paradigm, ba loại kỷ luật: control trực tiếp, control gián tiếp, assignment.
2. Polymorphism là công cụ vượt boundary. Immutability là công cụ quản lý dữ liệu.
3. Phần mềm vẫn chỉ là sequence, selection, iteration, indirection.

## Connects To
- **arch-ch04/05/06**: đi sâu từng paradigm.
- **arch-ch11 (DIP)**: polymorphism dùng để đảo chiều dependency.
