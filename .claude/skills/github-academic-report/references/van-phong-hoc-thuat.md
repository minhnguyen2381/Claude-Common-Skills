# Văn phong báo cáo trình độ thạc sĩ

Khác biệt giữa báo cáo đại học và báo cáo cao học không nằm ở độ dài hay số thuật ngữ, mà ở
**thái độ với tri thức**: cao học phải nêu tiêu chí, đối chiếu phương án, thừa nhận giới hạn
và tách bạch điều đã chứng minh với điều mới là phỏng đoán.

---

## 1. Bốn động tác bắt buộc trong mỗi chương

| Động tác | Nghĩa là gì | Dấu hiệu thiếu |
|---|---|---|
| **Định nghĩa** | Thuật ngữ then chốt được định nghĩa một lần, có nguồn | Dùng "kiến trúc sạch" suốt 10 trang mà không nói nó là gì |
| **So sánh** | Nêu ít nhất hai phương án và tiêu chí chọn | "Nhóm chọn MVVM" mà không nói vì sao không chọn MVP |
| **Đánh giá có tiêu chí** | Kết quả đo bằng thước đo nói rõ từ trước | "Hệ thống chạy tốt", "giao diện thân thiện" |
| **Thừa nhận giới hạn** | Nói rõ kết luận đúng trong phạm vi nào | Khái quát hoá từ một dự án lên "mọi ứng dụng Android" |

## 2. Quy tắc câu chữ

**Ngôi kể.** Dùng ngôi phi cá nhân hoặc "nhóm tác giả": *"Nhóm tiến hành khảo sát…"*,
*"Bài toán được phát biểu như sau…"*. Tránh "em", "chúng ta", "bạn".

**Thì và giọng.** Mô tả việc đã làm dùng quá khứ/hoàn thành; mô tả tính chất hệ thống dùng
hiện tại. Ưu tiên câu chủ động khi chủ thể rõ ràng.

**Độ dài câu.** Trung bình 18–28 từ. Câu trên 45 từ gần như luôn có thể tách đôi.

**Mỗi đoạn một ý.** Câu đầu đoạn nêu ý, các câu sau chứng minh. Đoạn 1 câu hoặc đoạn dài quá
nửa trang đều là dấu hiệu cần sửa.

**Số liệu phải có đơn vị và nguồn.** *"12 458 dòng mã (thống kê từ `repo-profile.json`,
commit `a1b2c3d`)"* — không viết *"hơn 12 nghìn dòng"*.

## 3. Danh sách cấm

Những lối viết sau khiến báo cáo mất chất học thuật ngay lập tức:

| Cấm | Vì sao | Viết lại thành |
|---|---|---|
| "trong thời đại công nghệ 4.0", "kỷ nguyên số" | sáo ngữ, không mang thông tin | nêu số liệu bối cảnh cụ thể có nguồn |
| "vô cùng quan trọng", "cực kỳ hiệu quả" | cường điệu không đo được | "giảm thời gian phản hồi từ 820 ms xuống 310 ms" |
| "như chúng ta đã biết", "ai cũng biết rằng" | né trách nhiệm dẫn chứng | trích nguồn, hoặc bỏ |
| "Nhìn chung, có thể thấy rằng…" mở đoạn | rào đón rỗng | vào thẳng luận điểm |
| "Bên cạnh đó", "Ngoài ra" lặp đầu mỗi đoạn | nối rỗng nghĩa | dùng nối chỉ quan hệ thật: "Ngược lại", "Do đó", "Tuy nhiên" |
| Liệt kê 8–10 gạch đầu dòng liên tiếp | né việc lập luận | chuyển thành văn xuôi có liên kết, hoặc thành bảng |
| "Hệ thống hoạt động ổn định, giao diện thân thiện" | đánh giá không tiêu chí | nêu tiêu chí + số đo |
| Chép nguyên định nghĩa từ Wikipedia | không phải nguồn học thuật | trích từ sách/bài báo, diễn đạt lại |
| Hứa hẹn ở thì tương lai ("sẽ phát triển thêm…") trong thân bài | lạc chỗ | dồn về mục "Hướng phát triển" |

## 4. Trước / sau

**Mở đầu chương**

> ✗ Trong thời đại công nghệ 4.0 hiện nay, ứng dụng di động ngày càng trở nên vô cùng quan
> trọng. Chính vì vậy, việc lựa chọn kiến trúc phù hợp là hết sức cần thiết.

> ✓ Chi phí bảo trì chiếm phần lớn tổng chi phí vòng đời của một hệ thống phần mềm
> [[cite:x]]. Với ứng dụng di động, áp lực này còn tăng thêm do vòng đời thành phần do hệ
> điều hành kiểm soát: một thay đổi cấu hình màn hình có thể huỷ và tạo lại toàn bộ tầng
> hiển thị. Chương này xác lập các khái niệm và tiêu chí dùng để đánh giá kiến trúc ở những
> chương sau.

**Trình bày lựa chọn kỹ thuật**

> ✗ Nhóm sử dụng MVVM vì đây là mô hình hiện đại và được Google khuyến nghị.

> ✓ Nhóm lựa chọn MVVM dựa trên ba tiêu chí: khả năng kiểm thử tầng trình bày trên JVM,
> khả năng bảo toàn trạng thái qua thay đổi cấu hình, và mức độ sẵn có của tài liệu chính
> thức. So với MVP, MVVM loại bỏ tham chiếu ngược từ tầng trình bày tới khung nhìn nên
> không phát sinh nhu cầu huỷ liên kết thủ công [[cite:y]]. Đánh đổi là chi phí học tập cao
> hơn với lập trình viên chưa quen lập trình phản ứng.

**Đánh giá kết quả**

> ✗ Sau khi triển khai, hệ thống hoạt động tốt và đáp ứng được yêu cầu đề ra.

> ✓ Đối chiếu với bốn tiêu chí nêu ở mục 1.4, hệ thống đạt hai tiêu chí bắt buộc và một
> trong hai tiêu chí khuyến nghị ([[xref:tbl-danhgia]]). Tiêu chí "mọi ViewModel đều có kiểm
> thử đơn vị" chưa đạt: 6 trên 14 lớp ViewModel không có tệp kiểm thử tương ứng. Nguyên nhân
> được xác định là các lớp này phụ thuộc trực tiếp vào bộ đếm thời gian hệ thống.

## 5. Nói về dự án GitHub: quy tắc dẫn chứng

1. **Mọi khẳng định về dự án phải truy được về mã nguồn.** Nêu đường dẫn file
   (`app/src/main/java/.../TaskViewModel.kt`) hoặc mã commit. Verifier kiểm tra các đường dẫn
   này có thật (QĐ-15).
2. **Không mô tả tính năng dự án không có.** Nếu README nhắc tới một tính năng nhưng mã nguồn
   không có, viết đúng như thế và coi đó là một phát hiện.
3. **Phân biệt quan sát và suy luận.** *"Lớp `X` không có tệp kiểm thử"* là quan sát.
   *"Điều này cho thấy nhóm phát triển ưu tiên tốc độ hơn chất lượng"* là suy luận — phải
   đánh dấu bằng "có thể", "nhiều khả năng", hoặc bỏ.
4. **Không phóng đại quy mô.** Dự án 12 nghìn dòng là dự án vừa, không phải "hệ thống lớn".
5. **Trích mã có chọn lọc.** Mỗi khối mã tối đa 15–20 dòng và phải được bình luận ngay sau
   đó — chép 60 dòng mã rồi đi tiếp là lấp trang.

## 6. Tự kiểm trước khi trình chương

Chạy qua danh sách này với từng chương đã viết:

- [ ] Mỗi mục cấp 2 mở bằng một câu nêu vai trò của mục trong mạch lập luận?
- [ ] Mọi thuật ngữ viết tắt đã định nghĩa ở lần dùng đầu tiên?
- [ ] Mỗi khẳng định có tính tranh luận đều có `[[cite:...]]` hoặc dẫn chứng từ repo?
- [ ] Mọi hình và bảng đều được nhắc tới trong thân bài bằng `[[xref:...]]`?
- [ ] Không có hình/bảng nào "mồ côi" (chèn vào mà không câu nào nhắc đến)?
- [ ] Có ít nhất một đoạn nêu đánh đổi hoặc hạn chế?
- [ ] Không còn câu nào trong danh sách cấm ở mục 3?
- [ ] Số liệu khớp với `repo-profile.json`?
- [ ] Chương kết bằng một đoạn chuyển tiếp sang chương sau?
