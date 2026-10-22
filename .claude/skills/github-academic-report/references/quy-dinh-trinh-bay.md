# Quy định trình bày báo cáo — bản trích có đánh số điều khoản

Nguồn: **"HD viết báo cáo Bài tập lớn cao học.docx"** (Trường Công nghệ Thông tin và Truyền
thông — Đại học Công nghiệp Hà Nội). Mỗi điều khoản dưới đây trích nguyên ý từ tài liệu gốc,
kèm mã `QĐ-xx` để `scripts/verify-output.mjs` đối chiếu và xuất bằng chứng tuân thủ.

Nếu người dùng cung cấp một bản hướng dẫn khác, **đọc lại bản đó** và cập nhật các giá trị
trong `scripts/build-docx.mjs` (hằng số `G`) trước khi build.

---

## A. Trang in

| Mã | Quy định (nguyên văn rút gọn) | Giá trị máy dùng |
|---|---|---|
| QĐ-01 | Giấy trắng khổ A4 (210 × 297 mm), in 1 mặt | `11906 × 16838` twip |
| QĐ-02 | Mẫu chữ Times New Roman, cỡ 13; mật độ chữ bình thường, không nén hoặc kéo dãn | `font: "Times New Roman"`, `size: 26` (nửa point) |
| QĐ-03 | Định dạng dãn dòng đặt ở chế độ **1,3 lines** | `spacing.line = 312`, `lineRule = "auto"` |
| QĐ-04 | Lề trên 2,5 cm; lề dưới 2 cm; lề trái 3,5 cm; lề phải 2 cm | `1417 / 1134 / 1984 / 1134` twip |
| QĐ-05 | Số trang được đánh **ở giữa, phía trên** đầu mỗi trang giấy | trường `PAGE` đặt trong **header**, căn giữa — **không phải footer** |

> Vì 1 cm = 1440/2,54 ≈ 566,93 twip, script làm tròn tới twip gần nhất; sai số ≤ 1 twip
> (≈ 0,002 cm) nên Word vẫn hiển thị đúng 2,5 / 2 / 3,5 / 2 cm trong hộp Page Setup.

## B. Đánh số trang

| Mã | Quy định | Cách hiện thực |
|---|---|---|
| QĐ-06 | Trang tiểu mục dùng `i, ii, iii, …`; **số trang là "i" cho trang LỜI NÓI ĐẦU** | section riêng, `pgNumType fmt="lowerRoman" start="1"` |
| QĐ-06 | Phần nội dung dùng `1, 2, 3, …`; **MỞ ĐẦU là trang 1** | section riêng, `pgNumType fmt="decimal" start="1"` |

**Giả định được ghi rõ:** tài liệu gốc chỉ nói "i" bắt đầu ở LỜI NÓI ĐẦU, không nói bìa và
MỤC LỤC đánh số thế nào. Skill mặc định **bìa và MỤC LỤC không đánh số trang** (hai section
đầu không có header). Nếu giảng viên yêu cầu khác, sửa `sections[0..1]` trong
`scripts/build-docx.mjs`.

## C. Bảng biểu, hình vẽ, phụ lục

| Mã | Quy định | Cách hiện thực |
|---|---|---|
| QĐ-07 | Bảng biểu, hình vẽ **phải được đặt tên và đánh số**. Ví dụ: *Hình 2.1. Hình số 1 của chương 2* | `Hình {STYLEREF 1 \s}.{SEQ Hinh \* ARABIC \s 1}. <tên>` |
| QĐ-07 | Tương tự cho bảng | `Bảng {STYLEREF 1 \s}.{SEQ Bang \* ARABIC \s 1}. <tên>` |
| QĐ-08 | Mỗi hình/bảng đúng một số hiệu | verify: `count(SEQ Hinh) == số figure có caption` |
| QĐ-07 | Phụ lục phải được đặt tên và đánh số. Ví dụ: *Phụ lục 2.1* | `Phụ lục {SEQ PhuLuc \* ARABIC}.` (mặc định) hoặc `{STYLEREF 1 \s}.{SEQ PhuLuc \s 1}` khi `config.phuLucNumbering = "theo-chuong"` |
| QĐ-01 | Bảng/hình xoay ngang thì đầu bảng là lề trái của trang | dùng section landscape riêng nếu cần (hiếm) |

**Quy ước vị trí caption** (thông lệ học thuật, tài liệu gốc không quy định):
tên **bảng đặt phía trên** bảng, tên **hình đặt phía dưới** hình. Builder áp dụng sẵn.

**Tuyệt đối không gõ tay số hiệu.** Viết `Hình 2.1` trực tiếp vào câu văn là vi phạm QĐ-07 —
chèn thêm một hình ở đầu chương sẽ làm sai toàn bộ số phía sau. Dùng `[[xref:id]]`.

## D. Mục và tiểu mục

| Mã | Quy định | Cách hiện thực |
|---|---|---|
| QĐ-09 | Đánh số thành nhóm số, **nhiều nhất bốn chữ số** (ví dụ 1.1.2.1) | numbering 4 cấp gắn Heading 1–4; verify chặn Heading ≥ 5 |

Cấp 1 hiển thị `CHƯƠNG %1:`, cấp 2–4 hiển thị `%1.%2`, `%1.%2.%3`, `%1.%2.%3.%4`.

## E. Viết tắt

| Mã | Quy định | Cách hiện thực |
|---|---|---|
| QĐ-14 | Chỉ viết tắt từ/cụm từ dùng **trên 3 lần**; lần đầu viết đầy đủ kèm chữ viết tắt trong ngoặc đơn | verify đếm số lần xuất hiện, cảnh báo nếu ≤ 3 |
| QĐ-14b | Phải có **DANH MỤC CÁC CHỮ VIẾT TẮT xếp theo ABC** ở đầu báo cáo | builder tự sắp xếp bảng viết tắt |
| QĐ-14 | Không viết tắt cụm từ dài, mệnh đề | người viết tự kiểm |

## F. Mục lục

| Mã | Quy định | Cách hiện thực |
|---|---|---|
| QĐ-10 | Có trang MỤC LỤC (mẫu Phụ lục 3 của tài liệu gốc) | trường `TOC \o "1-4" \h \z` |
| QĐ-10 | Có DANH MỤC HÌNH VẼ và DANH MỤC BẢNG BIỂU | `TOC \c "Hinh" \h` và `TOC \c "Bang" \h` |

## G. Tài liệu tham khảo

| Mã | Quy định | Cách hiện thực |
|---|---|---|
| QĐ-13 | Xếp **riêng theo từng ngôn ngữ** (Việt, Anh, Pháp, Đức, Nga, Trung, Nhật…) | nhóm theo `lang`, in nhóm Tiếng Việt trước |
| QĐ-13 | Tài liệu nước ngoài **giữ nguyên văn**, không phiên âm, không dịch | không xử lý tự động — người viết tuân thủ |
| QĐ-13 | Tác giả người nước ngoài: xếp ABC theo **họ** | `refSortKey` dùng nguyên chuỗi (định dạng "Họ, Tên viết tắt") |
| QĐ-13 | Tác giả người Việt: xếp ABC theo **tên**, vẫn giữ thứ tự họ-tên thông thường | `refSortKey` lấy token cuối làm khoá sắp xếp |
| QĐ-13 | Tài liệu không có tác giả: xếp theo tên cơ quan ban hành | dùng trường `organization` |
| QĐ-14 | Dòng thứ hai trở đi **lùi vào 1 cm** | `indent: { left: 567, hanging: 567 }` |

### Định dạng từng loại (nguyên văn quy định)

**Sách, giáo trình, báo cáo** — thứ tự các thành phần:

```
Tên các tác giả hoặc cơ quan ban hành   (không có dấu ngăn cách)
(Năm xuất bản),                         (ngoặc đơn, dấu phẩy sau ngoặc)
Tên sách in nghiêng,                    (dấu phẩy cuối tên)
Nhà xuất bản,                           (dấu phẩy cuối)
Nơi xuất bản.                           (dấu chấm kết thúc)
```

→ `Hoàng Quang Huy (2016), *Giáo trình kiểm thử phần mềm*, Nhà xuất bản Thống kê, Hà Nội.`

**Bài báo trong tạp chí / bài trong một cuốn sách**:

```
Tên các tác giả                         (không có dấu ngăn cách)
(Năm công bố),                          (ngoặc đơn, dấu phẩy sau ngoặc)
"Tên bài báo",                          (ngoặc kép, KHÔNG in nghiêng, dấu phẩy cuối)
Tên tạp chí in nghiêng,                 (dấu phẩy cuối tên)
Tập                                     (không có dấu ngăn cách)
(Số),                                   (ngoặc đơn, dấu phẩy sau)
Tr. x-y.                                (gạch ngang giữa hai số, dấu chấm kết thúc)
```

→ `Phạm Văn Bình, Trần Thị Minh Diễm (2006), "Nghiên cứu tình hình nhiễm virus viêm gan B tỉnh
Thừa Thiên Huế", *Tạp chí Y học Thực hành*, 3(536), Tr. 82-85.`

Tài liệu tiếng Anh dùng `pp.` thay cho `Tr.`.

**Mở rộng ngoài tài liệu gốc** (tài liệu gốc không quy định nguồn web/tài liệu kỹ thuật —
bắt buộc phải có với báo cáo về dự án phần mềm). Skill dùng dạng nhất quán với hai mẫu trên
và **ghi rõ trong bảng đối chiếu là phần mở rộng**:

→ `Google (2024), "Guide to app architecture", *Android Developers*,
https://developer.android.com/topic/architecture (truy cập ngày 12/09/2026).`

## H. Bìa báo cáo (mẫu Phụ lục 1)

```
ĐẠI HỌC CÔNG NGHIỆP HÀ NỘI
TRƯỜNG CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG
---------------------------------------

BÁO CÁO BÀI TẬP LỚN
HỌC PHẦN: <TÊN HỌC PHẦN>

<TÊN ĐỀ TÀI / CHỦ ĐỀ NGHIÊN CỨU>

Người hướng dẫn: <học hàm/học vị + họ tên>
Học viên: <họ tên — mã học viên>       (hoặc "Nhóm thực hiện:" + danh sách)
Lớp: ……………  Khóa: ……………

Hà Nội – Năm <năm>
```

## I. Thứ tự các phần trong quyển (theo mẫu Mục lục — Phụ lục 3)

```
Bìa                                   (không đánh số)
MỤC LỤC                               (không đánh số)
LỜI NÓI ĐẦU                           i
DANH MỤC CÁC THUẬT NGỮ, KÝ HIỆU VÀ CÁC CHỮ VIẾT TẮT    ii
DANH MỤC HÌNH VẼ                      iii
DANH MỤC BẢNG BIỂU                    iv
MỞ ĐẦU                                1
CHƯƠNG 1 … CHƯƠNG n
KẾT LUẬN VÀ KIẾN NGHỊ
TÀI LIỆU THAM KHẢO
PHỤ LỤC
```

Builder tạo đúng thứ tự này; các đề mục cấp cao (LỜI NÓI ĐẦU, MỞ ĐẦU, KẾT LUẬN…) dùng
Heading 1 **không đánh số** nên vẫn xuất hiện trong MỤC LỤC mà không mang số chương.
