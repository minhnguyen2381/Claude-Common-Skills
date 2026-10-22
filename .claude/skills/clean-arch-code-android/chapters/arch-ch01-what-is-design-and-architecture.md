# Clean Architecture — Chapter 1: What Is Design and Architecture?

## Core Idea
Design và architecture **không khác nhau**: chúng là một dải liên tục các quyết định từ cao xuống thấp. Thước đo duy nhất của chất lượng thiết kế là **công sức cần để đáp ứng nhu cầu khách hàng**, và công sức đó phải giữ ở mức thấp suốt vòng đời hệ thống.

## Frameworks Introduced
- **The Goal of Software Architecture**: *"The goal of software architecture is to minimize the human resources required to build and maintain the required system."*
  - When to use: khi tranh luận "có nên refactor/tách module không", hãy đo bằng chi phí của các thay đổi trong tương lai, không bằng vẻ đẹp.
  - How: theo dõi xem effort cho mỗi feature/release có tăng dần không. Nếu có thì thiết kế đang xấu đi.
- **The Signature of a Mess**: số dev tăng, LOC/release chững lại, cost/LOC tăng vọt (ví dụ thật: release 8 đắt hơn release 1 khoảng 40 lần; payroll lên $20M/tháng mà gần như không thêm được tính năng).
- **"The only way to go fast, is to go well."** Thí nghiệm của Jason Gorman: dùng TDD thì nhanh hơn khoảng 10%, và ngày TDD chậm nhất vẫn nhanh hơn ngày non-TDD nhanh nhất.

## Key Concepts
- **Design = Architecture**: chi tiết cấp thấp và cấu trúc cấp cao là một tấm vải liền, không có ranh giới.
- **Measure of design quality**: effort để đáp ứng nhu cầu khách hàng; thấp và ổn định thì design tốt.
- **Hare's overconfidence**: niềm tin "làm bẩn trước để chạy nhanh, sau này dọn". Sự thật là làm bẩn **luôn chậm hơn** ở mọi khung thời gian.
- **Redesign from scratch trap**: viết lại từ đầu với cùng tư duy thì sẽ tạo lại cùng một mớ hỗn độn.

## Mental Models
- Nghĩ về codebase như **một khoản nợ lãi kép**: mỗi lần "để sau" là vay thêm với lãi suất tăng dần.
- Dùng câu hỏi "**feature tiếp theo có tốn effort tương đương feature trước không?**" làm health check kiến trúc.
- Coi lời đề nghị "viết lại toàn bộ" là triệu chứng của chính căn bệnh đã gây ra mess.

## Anti-patterns
- **"We can clean it up later; we just have to get to market first!"**: market pressure không bao giờ giảm, nên "later" không bao giờ đến.
- **Thêm người để tăng tốc khi code đã bẩn**: chỉ làm đường cong năng suất tiệm cận 0 nhanh hơn.
- **Big rewrite**: cùng một đội, cùng thói quen thì cùng kết quả.

## Worked Example
Case study trong sách gồm 4 biểu đồ:
1. Số kỹ sư tăng mạnh qua 8 release (trông như thành công).
2. LOC mỗi release tiệm cận một giới hạn trên.
3. Cost/LOC tăng khoảng 40 lần.
4. Năng suất của dev giảm từ ~100% ở release 1 xuống gần 0 ở release 4+.

Kết luận: mọi effort bị chuyển sang việc "di chuyển mess từ chỗ này sang chỗ khác" để nhét thêm một feature nhỏ.

## 🤖 Android mapping (chuyển thể, không có trong sách)
- Dấu hiệu "signature of a mess" trên app Android: mỗi màn mới phải sửa `CommonViewModel` dùng chung, sửa `BaseFragment`, và thêm cờ vào DataStore. Build time và số file chạm vào cho mỗi PR tăng dần.
- Metric thực dụng: **số file thay đổi / feature PR** và **thời gian chạy `./gradlew test`**. Nếu cả hai tăng theo release thì kiến trúc đang mục.
- "Go well" trên Android = viết unit test cho UseCase/ViewModel bằng `kotlinx-coroutines-test` ngay từ đầu, không đợi "khi nào rảnh".

## Key Takeaways
1. Design và architecture là một. Đừng tách "người vẽ sơ đồ" khỏi "người viết code".
2. Chất lượng kiến trúc = chi phí của thay đổi, được đo theo thời gian.
3. Code bẩn không bao giờ nhanh hơn, kể cả trong ngắn hạn.
4. Đừng tin vào "big rewrite". Hãy cải thiện liên tục.

## Connects To
- **arch-ch02**: vì sao structure (giá trị thứ hai) quan trọng hơn behavior.
- **code-ch01**: Clean Code mở đầu bằng cùng luận điểm "The Total Cost of Owning a Mess".
