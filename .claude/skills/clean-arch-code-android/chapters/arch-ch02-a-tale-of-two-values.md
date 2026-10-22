# Clean Architecture — Chapter 2: A Tale of Two Values

## Core Idea
Mỗi hệ thống phần mềm mang **hai giá trị**: *behavior* (chạy đúng yêu cầu) và *structure/architecture* (dễ thay đổi). Giá trị thứ hai lớn hơn, và dev có **trách nhiệm đấu tranh** cho nó.

## Frameworks Introduced
- **Two Values of Software**: Behavior và Architecture ("soft" + "ware").
  - When to use: khi PM ép bỏ qua refactor để kịp deadline.
  - How: lập luận bằng hai cực đoan. Chương trình chạy hoàn hảo nhưng *không thể* sửa sẽ trở thành vô dụng khi yêu cầu đổi. Chương trình chưa chạy nhưng *dễ* sửa thì có thể sửa cho chạy và giữ nó chạy mãi.
- **Scope vs Shape**: độ khó của một thay đổi phải tỉ lệ với *scope* (phạm vi) của nó, không phải với *shape* (hình dạng) so với kiến trúc hiện có. Kiến trúc nên **shape agnostic**.
- **Eisenhower's Matrix**: *"I have two kinds of problems, the urgent and the important. The urgent are not important, and the important are never urgent."*
  - Thứ tự ưu tiên: (1) urgent & important, (2) not urgent & important, (3) urgent & not important, (4) not urgent & not important.
  - Architecture nằm ở vị trí 1–2; behavior nằm ở vị trí 1 và 3.
  - Lỗi phổ biến: đẩy mục (3) lên vị trí (1).
- **Fight for the Architecture**: dev cũng là stakeholder và phải "squabble as equals" với business.

## Key Concepts
- **Behavior**: làm máy chạy đúng spec, kiếm hoặc tiết kiệm tiền.
- **Architecture value**: khả năng thay đổi behavior với chi phí thấp.
- **Shape agnostic architecture**: kiến trúc không ưu tiên một "hình" thay đổi nào.
- **Cost of change > benefit of change**: điểm mà tại đó hệ thống "thực tế không thể sửa".

## Mental Models
- Mỗi yêu cầu mới giống **một mảnh ghép**. Nếu kiến trúc có "hình" cố định thì mảnh sau luôn khó nhét hơn mảnh trước.
- Business **không đủ công cụ** để đánh giá tầm quan trọng của kiến trúc. Đó chính là việc dev được thuê để làm.

## Anti-patterns
- **Chỉ tối ưu behavior**: "nó chạy là được" dẫn đến hệ thống mất giá trị dần.
- **Để architecture đi cuối**: chi phí tăng mãi cho tới khi thay đổi gần như không thể.
- **Im lặng trước áp lực deadline**: nếu hệ thống mục, nghĩa là đội dev "did not fight hard enough".

## Worked Example
Phép thử hai cực đoan:
| Chương trình | Hôm nay | Khi yêu cầu đổi |
|---|---|---|
| Chạy hoàn hảo, không thể sửa | Hữu ích | Vô dụng vĩnh viễn |
| Chưa chạy, dễ sửa | Chưa hữu ích | Sửa cho chạy và tiếp tục hữu ích |
→ Dễ thay đổi là giá trị lớn hơn.

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **Scope vs shape trên Android**: yêu cầu "thêm nguồn dữ liệu offline (Room) cho màn danh sách" có scope nhỏ. Nếu ViewModel gọi thẳng Retrofit `ApiInterface` thì shape lại lệch, vì phải sửa ViewModel, Fragment và state. Nếu ViewModel phụ thuộc vào `Repository` interface thì chỉ cần sửa `RepositoryImpl`.
- **Urgent nhưng không important**: đổi màu nút hay A/B test vị trí quảng cáo. **Important nhưng không urgent**: tách `CommonViewModel` đang phình to, chuyển interface repository sang domain.
- Cách "fight" thực tế: gắn mỗi task refactor vào một feature cụ thể ("để thêm X nhanh, cần tách Y trước"), thay vì xin một sprint refactor chung chung.

## Key Takeaways
1. Dễ thay đổi quan trọng hơn chạy đúng ngay hôm nay.
2. Chi phí thay đổi phải tỉ lệ với scope chứ không với shape.
3. Phân biệt rõ "urgent" và "important". Architecture luôn là "important".
4. Bảo vệ kiến trúc là **nhiệm vụ** của dev, không phải đặc ân.

## Connects To
- **arch-ch15**: mục tiêu của kiến trúc là giữ các lựa chọn mở (keep options open).
- **arch-ch01**: chi phí của mess.
