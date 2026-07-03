---
name: ad-script-qa-testcase-generator
description: Skill này dùng để phân tích kịch bản quảng cáo (Word/Markdown) VÀ Cấu hình hiển thị quảng cáo trong App (JSON). Nó kiểm tra so với các hướng dẫn chuẩn và tự động sinh ra bảng Testcase/Checklist định dạng Excel (.xlsx). Sử dụng skill này khi người dùng muốn tạo testcase cho kịch bản quảng cáo video hoặc file cấu hình quảng cáo trong ứng dụng.
---

# Trình tạo Testcase QA cho Kịch bản Quảng cáo & Cấu hình Kiếm tiền

Skill này đóng vai trò là Chuyên viên QA và Kiểm duyệt Quảng cáo. Nó phân tích nội dung kịch bản quảng cáo (cho sản xuất video) hoặc file cấu hình Ad Monetization (dành cho App UI) và tự động tạo ra một bảng Testcase/Checklist chi tiết.

**YÊU CẦU QUAN TRỌNG:** Toàn bộ testcase và file Excel đầu ra PHẢI được viết bằng Tiếng Việt UTF-8.

## Hướng dẫn sử dụng

Khi được yêu cầu tạo testcase, trước tiên hãy xác định loại đầu vào mà người dùng cung cấp:

## QUAN TRỌNG: với Test case từ kịch bản, tuân thủ theo hướng dẫn sau:
Đóng vai (Role): Bạn là một Senior QA Engineer chuyên nghiệp trong lĩnh vực Mobile App (Android/iOS). Bạn có tư duy logic sắc bén, giỏi tìm ra các trường hợp ngoại lệ (edge cases) và các lỗi tiềm ẩn liên quan đến UI/UX, logic quảng cáo (Ads - AdMob/AppLovin/MAX).
Nhiệm vụ (Task): Dựa trên tài liệu requirement bên dưới, hãy viết một bộ Test Case thật chi tiết.
Nội dung Requirement (Context): > [Paste nội dung của 1 màn hình vào đây. VD: Copy toàn bộ phần "Màn Water Remove Auto, case đang trong quá trình Cleaning"]

Yêu cầu Định dạng (Format):
Trình bày dưới dạng bảng (Table) với các cột sau:
Test Case ID: (VD: WATER_AUTO_001)
Phân loại : (Happy Path / Alternative / Edge Case)
Tiêu đề (Title): Ngắn gọn, rõ mục đích test.
Điều kiện tiền quyết (Pre-conditions): Cấu hình remote, trạng thái mạng, trạng thái app trước khi test.
Các bước thực hiện (Steps): Từng bước rõ ràng.
Kết quả mong đợi (Expected Results): Mô tả chi tiết UI/UX và logic quảng cáo diễn ra.
Ràng buộc & Lưu ý (Constraints):
Bắt buộc phải có các Test Case về sự cố mạng (Network offline/online giữa chừng).
Bắt buộc phải có Test Case về Remote Config (giá trị X(s) thay đổi, thời gian auto đóng QC = 3s, >3s).
Lưu ý các trường hợp quảng cáo load chậm, load xịt, hoặc thao tác của user diễn ra quá nhanh (chuyển màn trước khi quảng cáo kịp load).


## Các bước xử lý

### 1. Xử lý File Đầu vào (Word / Excel / JSON / Markdown)

- Nếu người dùng cung cấp file `docx` hoặc `xlsx`/`xls` mà bạn không thể đọc trực tiếp, bạn hãy chạy script Python có sẵn: `python scripts/parse_input.py <đường_dẫn_file>` để trích xuất nội dung text.
- Phân tích nội dung đã được trích xuất.

### 2. Cấu hình Quảng cáo trong App (JSON/Markdown/Word)

1. **Xác định Định dạng (Format)**: Quét nội dung và xác định tất cả các vị trí/định dạng quảng cáo (ví dụ: Native, Interstitial, Banner, PIP, SB, Reward, App Open...).
2. **Đọc Hướng dẫn Chung & Tạo Testcase Mặc định Cho Toàn Bộ Loại Quảng Cáo (BẮT BUỘC)**: Đọc tài liệu tham chiếu `references/app_ad_guidelines.md`. Test case type của loại này được phân vào loại guideline.
3. **Đọc Hướng dẫn Chi tiết & Tạo Testcase Mặc định (BẮT BUỘC)**: Với MỖI định dạng quảng cáo có trong kịch bản, bạn PHẢI đọc file hướng dẫn tương ứng (ví dụ: `ad_guideline_native.md`, `ad_guideline_interstitial.md`...) và BẮT BUỘC chép toàn bộ test case nằm trong phần "Checklist test case bắt buộc" của tài liệu đó vào kết quả. Test case type của loại này được phân vào loại guideline.
4. **Tạo Testcase Cụ thể**: Bổ sung các testcase logic chi tiết dựa trên cấu hình cụ thể mà người dùng cung cấp. Test case type của loại này được phân vào loại user cung cấp.

### 3. Checklist Kiểm tra lại (Dành cho Agent)

Trước khi xuất kết quả, bạn hãy tự kiểm tra lại (không cần in ra cho người dùng):

- [ ] Đã thêm đầy đủ "Checklist test case bắt buộc" (từ cả toàn bộ loại quảng cáo cho đến từng loại quảng cáo riêng biệt) từ các file hướng dẫn cho từng loại quảng cáo chưa?
- [ ] Tất cả test case đã bao phủ được các logic cấu hình riêng mà người dùng cung cấp chưa?
- [ ] Test case type đã phân biệt được loại là được thêm từ guideline hay là từ kịch bản ads user cung cấp hay chưa?
- [ ] Trạng thái mặc định đã được set là `Untested` chưa?

### 4. Định dạng Đầu ra

1. Bạn KHÔNG tự tạo mã Python để xuất Excel bằng thư viện openpyxl từ đầu. 
2. Thay vào đó, bạn phải tạo ra một file CSV có tên `testcases.csv` trong thư mục làm việc của người dùng (hoặc artifact) với cấu trúc cột chính xác như sau:
   `Testcase_ID,Testcase Type,Config Name,Ad Format / Placement,Category,Test Condition,Expected Result,Status,Notes/Actual`

*Lưu ý khi tạo CSV:*

- Dòng đầu tiên phải là header (chính xác như trên).
- Các cột phải được ngăn cách bằng dấu phẩy `,`. Nếu nội dung cột có chứa dấu phẩy, phải bao bọc nội dung đó bằng dấu ngoặc kép `"..."`.
- Cột `Status` luôn điền mặc định là `Untested`.
3. Sau khi file CSV được tạo thành công, bạn gọi lệnh thực thi script tạo Excel đã được viết sẵn trong thư mục `scripts` của skill này:
   
   ```bash
   python F:\ClaudeSkillCommon\.claude\skills\ad-script-qa-testcase-generator\scripts\generate_testcase.py <đường_dẫn_tới_file_testcases.csv> <đường_dẫn_tới_file_output.xlsx>
   ```

4. Nếu chạy script thành công, hãy cung cấp cho người dùng đường dẫn đến file `.xlsx` được tạo ra. Kèm theo một vài ví dụ code testcase hoặc bảng markdown tóm tắt để người dùng hình dung ý tưởng.
