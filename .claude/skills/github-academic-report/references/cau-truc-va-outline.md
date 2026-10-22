# Cấu trúc báo cáo và cách đề xuất outline

---

## 1. Khung cố định (không thương lượng)

Thứ tự các phần do QĐ-I quy định. Skill luôn sinh đủ; việc của outline là quyết định
**nội dung bên trong các chương**.

```
Bìa · MỤC LỤC · LỜI NÓI ĐẦU · DANH MỤC CHỮ VIẾT TẮT · DANH MỤC HÌNH VẼ ·
DANH MỤC BẢNG BIỂU · MỞ ĐẦU · CHƯƠNG 1..n · KẾT LUẬN VÀ KIẾN NGHỊ ·
TÀI LIỆU THAM KHẢO · PHỤ LỤC
```

### Nội dung bắt buộc của các phần khung

| Phần | Phải có | Độ dài gợi ý |
|---|---|---|
| **LỜI NÓI ĐẦU** | lời cảm ơn, bối cảnh học phần, cam kết về tính trung thực của số liệu | 0,5–1 trang |
| **MỞ ĐẦU** | (1) lý do chọn đề tài, (2) mục tiêu nghiên cứu, (3) đối tượng và phạm vi, (4) phương pháp nghiên cứu, (5) bố cục báo cáo | 2–3 trang |
| **KẾT LUẬN VÀ KIẾN NGHỊ** | (1) những gì đã làm được, đối chiếu từng mục tiêu ở MỞ ĐẦU, (2) hạn chế, (3) hướng phát triển | 1,5–2 trang |

**MỞ ĐẦU và KẾT LUẬN phải soi chiếu nhau.** Mỗi mục tiêu nêu ở MỞ ĐẦU phải có một câu trả
lời tương ứng ở KẾT LUẬN. Đây là điều hội đồng kiểm tra đầu tiên.

## 2. Ba chương thân bài — logic chung

Với đề tài "phân tích/xây dựng một dự án phần mềm", bố cục ba chương hiệu quả nhất là
**lý thuyết → phân tích → hiện thực & đánh giá**:

| Chương | Vai trò | Câu hỏi chương trả lời |
|---|---|---|
| 1 | Cơ sở lý thuyết và tổng quan | *Bài toán này đã được giải quyết thế nào? Khái niệm nào cần thống nhất?* |
| 2 | Phân tích & thiết kế | *Hệ thống cụ thể được tổ chức ra sao, vì sao lại chọn cách đó?* |
| 3 | Hiện thực, thực nghiệm & đánh giá | *Kết quả là gì, đo bằng tiêu chí nào, so với kỳ vọng ra sao?* |

Tỷ lệ độ dài lành mạnh: **chương 1 ≈ 25%, chương 2 ≈ 35%, chương 3 ≈ 40%**. Chương 1 dài hơn
chương 3 là dấu hiệu báo cáo nặng chép lý thuyết, nhẹ đóng góp — hội đồng trừ điểm ngay.

## 3. Mẫu outline theo loại dự án

Chọn mẫu khớp với `repo-profile.json`, rồi **điều chỉnh theo những gì repo thật sự có** —
không bê nguyên mẫu khi dự án không có phần tương ứng.

### 3.1 Ứng dụng di động / web (Android, iOS, React, Flutter…)

```
CHƯƠNG 1: TỔNG QUAN VÀ CƠ SỞ LÝ THUYẾT
  1.1 Bài toán và bối cảnh ứng dụng
  1.2 Các mẫu kiến trúc ứng dụng client (MVC, MVP, MVVM, MVI)
  1.3 Công nghệ nền tảng sử dụng trong dự án
  1.4 Các công trình/dự án liên quan          <- so sánh, có trích dẫn thật

CHƯƠNG 2: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG
  2.1 Khảo sát yêu cầu chức năng và phi chức năng
  2.2 Thiết kế kiến trúc tổng thể              <- hình: sơ đồ kiến trúc
  2.3 Thiết kế dữ liệu                         <- hình: ERD / lược đồ
  2.4 Thiết kế luồng nghiệp vụ chính           <- hình: sequence/activity
  2.5 Thiết kế giao diện người dùng

CHƯƠNG 3: HIỆN THỰC VÀ ĐÁNH GIÁ
  3.1 Môi trường và công cụ triển khai
  3.2 Hiện thực các thành phần cốt lõi         <- trích mã thật, có đường dẫn file
  3.3 Kiểm thử
  3.4 Đánh giá theo tiêu chí                   <- bảng: tiêu chí x kết quả
  3.5 Hạn chế của giải pháp
```

### 3.2 Hệ thống backend / dịch vụ phân tán

```
CHƯƠNG 1: TỔNG QUAN VÀ CƠ SỞ LÝ THUYẾT
  1.1 Bài toán và yêu cầu hệ thống
  1.2 Kiến trúc microservice / monolith - đánh đổi
  1.3 Cơ chế giao tiếp, nhất quán dữ liệu, chịu lỗi
  1.4 Các hệ thống tương tự

CHƯƠNG 2: PHÂN TÍCH VÀ THIẾT KẾ
  2.1 Yêu cầu chức năng, phi chức năng, ràng buộc vận hành
  2.2 Phân rã dịch vụ và ranh giới nghiệp vụ
  2.3 Thiết kế dữ liệu và chiến lược nhất quán
  2.4 Thiết kế API và hợp đồng giữa các dịch vụ
  2.5 Bảo mật và phân quyền

CHƯƠNG 3: TRIỂN KHAI VÀ ĐÁNH GIÁ
  3.1 Hạ tầng, đóng gói, CI/CD
  3.2 Hiện thực các dịch vụ chính
  3.3 Thực nghiệm hiệu năng / tải
  3.4 Đánh giá và bàn luận
  3.5 Hạn chế
```

### 3.3 Học máy / phân tích dữ liệu

```
CHƯƠNG 1: TỔNG QUAN VÀ CƠ SỞ LÝ THUYẾT
  1.1 Bài toán và ý nghĩa thực tiễn
  1.2 Các phương pháp hiện có            <- bảng so sánh, trích dẫn thật
  1.3 Cơ sở toán học của mô hình sử dụng
  1.4 Độ đo đánh giá

CHƯƠNG 2: DỮ LIỆU VÀ PHƯƠNG PHÁP
  2.1 Nguồn dữ liệu và đặc trưng
  2.2 Tiền xử lý và kỹ thuật sinh đặc trưng
  2.3 Kiến trúc mô hình đề xuất
  2.4 Thiết kế thực nghiệm (chia tập, siêu tham số, tiêu chí dừng)

CHƯƠNG 3: KẾT QUẢ VÀ BÀN LUẬN
  3.1 Môi trường thực nghiệm
  3.2 Kết quả định lượng                 <- bảng + biểu đồ
  3.3 So sánh với phương pháp cơ sở
  3.4 Phân tích lỗi
  3.5 Hạn chế và hướng cải thiện
```

### 3.4 Thư viện / công cụ cho lập trình viên

```
CHƯƠNG 1: TỔNG QUAN
  1.1 Nhu cầu và bài toán thư viện giải quyết
  1.2 Các thư viện tương đương            <- bảng so sánh tính năng
  1.3 Nguyên lý thiết kế API tốt

CHƯƠNG 2: THIẾT KẾ THƯ VIỆN
  2.1 Phạm vi chức năng
  2.2 Thiết kế API công khai
  2.3 Kiến trúc bên trong và điểm mở rộng
  2.4 Chiến lược tương thích ngược

CHƯƠNG 3: HIỆN THỰC, KIỂM THỬ VÀ ĐÁNH GIÁ
  3.1 Tổ chức mã nguồn
  3.2 Hiện thực các thành phần cốt lõi
  3.3 Chiến lược kiểm thử và độ phủ
  3.4 Đánh giá (kích thước, hiệu năng, trải nghiệm tích hợp)
  3.5 Hạn chế
```

## 4. Cách đề xuất outline khi người dùng chưa có

1. Đọc `repo-profile.json` và README → xác định **loại dự án** và **miền nghiệp vụ**.
2. Chọn mẫu ở mục 3, đổi tên chương cho khớp miền nghiệp vụ thật
   (ví dụ "CHƯƠNG 2: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG QUẢN LÝ CÔNG VIỆC").
3. **Cắt bỏ mục mà repo không có dữ liệu.** Repo không có test thì không đặt mục "Kiểm thử"
   rồi viết suông — thay bằng mục "Đánh giá chất lượng mã nguồn" và nêu việc thiếu kiểm thử
   như một phát hiện.
4. Với mỗi mục, ghi rõ ba thứ để người dùng duyệt:
   - **Nội dung dự kiến** (2–3 dòng)
   - **Hình/bảng dự kiến** (id + mô tả)
   - **Nguồn dẫn chứng** (đường dẫn file trong repo, hoặc loại tài liệu cần tìm)
5. Trình bày dạng bảng, hỏi người dùng duyệt, **không viết nội dung trước khi được duyệt**.

### Mẫu trình bày outline để duyệt

```markdown
## CHƯƠNG 2: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG   (~12 trang)

| Mục | Nội dung dự kiến | Hình/Bảng | Dẫn chứng |
|---|---|---|---|
| 2.1 Khảo sát yêu cầu | Trích xuất yêu cầu chức năng từ README và tập test | Bảng: danh sách use case | `README.md`, `app/src/test/` |
| 2.2 Kiến trúc tổng thể | Ba tầng ui/domain/data, luồng phụ thuộc một chiều | Hình: sơ đồ kiến trúc | `app/src/main/java/.../di/`, tài liệu Android |
| 2.3 Thiết kế dữ liệu | Lược đồ Room, quan hệ các thực thể | Hình: ERD | `data/local/*Entity.kt` |
```

## 5. Chuẩn hoá outline người dùng đã có

Khi người dùng đưa outline sẵn:

1. **Giữ nguyên ý định của họ.** Không tự ý đổi số chương hay gộp mục.
2. Đối chiếu với quy định, báo các điểm vi phạm:
   - tiểu mục quá 4 cấp (QĐ-09) → đề xuất gộp
   - thiếu phần khung bắt buộc (MỞ ĐẦU/KẾT LUẬN) → bổ sung
   - chương chỉ có một tiểu mục con → đề xuất gộp hoặc tách thêm
3. Chỉ ra mục nào **repo không có dữ liệu để viết**, hỏi người dùng muốn bỏ hay tự cung cấp
   thông tin.
4. Trình bày bản chuẩn hoá kèm danh sách thay đổi, chờ duyệt.

## 6. Ước lượng độ dài

| Tổng số trang nội dung mong muốn | Số mục cấp 2 mỗi chương | Số hình | Số bảng |
|---|---|---|---|
| 20–25 | 3–4 | 6–8 | 3–5 |
| 30–40 (mặc định) | 4–5 | 8–12 | 5–8 |
| 45–60 | 5–6 | 12–18 | 8–12 |

Một trang A4 với Times New Roman 13, giãn dòng 1,3 và lề theo quy định chứa khoảng
**450–500 từ** văn xuôi. Dùng con số này để ước lượng, đừng đoán.
