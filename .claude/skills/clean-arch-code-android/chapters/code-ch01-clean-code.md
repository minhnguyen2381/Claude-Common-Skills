# Clean Code — Chapter 1: Clean Code

## Core Idea
Code sẽ **không bao giờ biến mất**, vì code chính là chi tiết của yêu cầu. Code bẩn giết năng suất và có thể giết cả công ty. Giữ code sạch **mọi lúc** là cách duy nhất để đi nhanh, và là vấn đề **chuyên nghiệp**, không phải sở thích.

## Frameworks Introduced
- **There Will Be Code**: specification đủ chi tiết để máy chạy được *chính là* code. DSL hay ngôn ngữ cấp cao hơn vẫn là code.
- **LeBlanc's law**: *"Later equals never."*
- **The Total Cost of Owning a Mess**: năng suất tiệm cận 0. Quản lý thêm người, người mới không hiểu design intent, nên càng thêm mess (Figure 1-1: Productivity vs. time).
- **The Grand Redesign in the Sky**: tiger team viết lại và chạy đua với team bảo trì hệ cũ, có khi mất 10 năm; cuối cùng hệ mới cũng bị đòi viết lại.
- **Attitude**: lỗi không ở yêu cầu, lịch hay sếp, mà ở chính dev: *"We are unprofessional."* Ví dụ bác sĩ rửa tay (Semmelweis): bệnh nhân là "sếp" nhưng bác sĩ phải từ chối bỏ rửa tay. Dev phải bảo vệ code với **sự nhiệt thành ngang** quản lý bảo vệ lịch.
- **The Primal Conundrum**: *"The only way to make the deadline—the only way to go fast—is to keep the code as clean as possible at all times."*
- **Code-sense**: nhận ra code bẩn chưa đủ; cần "cảm quan code" để thấy các lựa chọn và chuỗi biến đổi bảo toàn hành vi từ bẩn sang sạch.
- **What Is Clean Code? (các bậc thầy)**:
  - **Bjarne Stroustrup**: elegant, efficient; logic thẳng để bug không có chỗ trốn; dependency tối thiểu; error handling đầy đủ; *"Clean code does one thing well."* Code xấu **cám dỗ** mess lớn thêm (**Broken windows**, Pragmatic Programmers).
  - **Grady Booch**: *"Clean code is simple and direct. Clean code reads like well-written prose."* **Crisp abstractions**.
  - **"Big" Dave Thomas**: người khác đọc và **nâng cấp** được; có unit + acceptance test; tên có nghĩa; **một cách** làm một việc; dependency tối thiểu, explicit; API tối thiểu. *"Code, without tests, is not clean."*
  - **Michael Feathers**: *"Clean code always looks like it was written by someone who cares."*
  - **Ron Jeffries**, theo **Beck's rules of simple code** (thứ tự ưu tiên): chạy hết test, không duplication, biểu đạt mọi ý thiết kế, tối thiểu số entity. Cộng với: tách method làm nhiều việc, **bọc collection sau abstraction nhỏ** từ sớm.
  - **Ward Cunningham**: *"You know you are working on clean code when each routine you read turns out to be pretty much what you expected."* Code đẹp khiến ngôn ngữ trông như được tạo ra cho chính bài toán.
- **Schools of Thought**: sách là **"Object Mentor School of Clean Code"**: tuyệt đối trong trường phái này, nhưng không phải chân lý duy nhất.
- **We Are Authors**: tỉ lệ **đọc : viết > 10 : 1**. Muốn viết nhanh thì phải làm cho dễ đọc.
- **The Boy Scout Rule**: *"Leave the campground cleaner than you found it."* Mỗi lần check-in, sạch hơn một chút: đổi một tên, tách một hàm, xóa một duplication, gọn một `if`.

## Key Concepts
- **Wading**: lội qua code bẩn.
- **Code-sense**.
- **Broken windows**.
- **Read/write ratio 10:1**.
- **Boy Scout Rule**.

## Mental Models
- Code bạn viết là **thư gửi người đọc tương lai** (kể cả chính bạn).
- Mỗi PR là một lần "dọn trại": luôn để lại thứ gì đó sạch hơn.

## Anti-patterns
- **"Working mess is better than nothing"** rồi bỏ đó.
- **Đổ lỗi cho deadline/sếp** để biện minh code bẩn.
- **Big redesign** thay vì cải thiện liên tục.

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **Boy Scout Rule trong PR Android**: mỗi PR feature kèm 1–2 cải thiện nhỏ ở file đã chạm: đổi tên biến `it` lồng nhau thành tên có nghĩa, tách một block `setState { copy(...) }` 30 dòng thành hàm reducer, xóa log debug `Timber.tag("testAPI")` còn sót (Satellite2 có ở `LiveCameraSearchResultViewModel`).
- **Beck's rules cho Kotlin**: (1) `./gradlew test` xanh; (2) không lặp logic mapping/format giữa các Adapter; (3) tên class/hàm nói được ý thiết kế (`ValidatePhoneNumberUseCase` ✅); (4) không tạo class/interface thừa (đừng tạo `BaseUseCase<P, R>` nếu `operator fun invoke` là đủ).
- **"Code without tests is not clean"**: với app Android, tối thiểu là UseCase và ViewModel có test JVM.

## Key Takeaways
1. Code sạch là điều kiện để đi nhanh, không phải xa xỉ.
2. Bảo vệ code là trách nhiệm chuyên nghiệp của dev.
3. Clean code: đơn giản, dễ đọc, làm một việc, có test, viết bởi người quan tâm.
4. Áp dụng Boy Scout Rule mỗi lần commit.

## Connects To
- **arch-ch01**: cùng luận điểm ở cấp kiến trúc.
- **code-ch12 (Emergence)**: Beck's 4 rules of simple design chi tiết.
