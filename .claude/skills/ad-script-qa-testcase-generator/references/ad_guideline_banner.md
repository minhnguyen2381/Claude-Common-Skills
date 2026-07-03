# Hướng dẫn Kiểm thử Quảng cáo Biểu ngữ (Banner Ad)

Quảng cáo biểu ngữ (Banner) là định dạng quảng cáo hình chữ nhật hoặc dải ngang/dọc, thường được ghim ở cạnh trên, cạnh dưới màn hình, hoặc xen kẽ giữa các phần nội dung. Banner có thể là tĩnh (cố định kích thước) hoặc Adaptive (tự động điều chỉnh kích thước theo chiều rộng màn hình).

## 1. Yêu cầu Hiển thị (Display Requirements)
- **Vị trí**: Đảm bảo hiển thị đúng vị trí (Top/Bottom) mà không che khuất nội dung hay các nút chức năng cốt lõi của ứng dụng (như thanh tab, nút back).
- **Kích thước / Tỷ lệ**: 
  - Standard Banner: Kích thước cố định (ví dụ 320x50, 300x250).
  - Adaptive Banner: Chiều rộng phải lấp đầy màn hình ngang một cách hợp lý và chiều cao tự động co giãn.
- **Biểu tượng Tắt / Đóng (Nếu có)**: Đôi khi quảng cáo banner cho phép người dùng ẩn đi. Nếu có nút "X" trên banner, nó phải hoạt động.
- **Label**: Phải có ký hiệu phân biệt "Ad" hoặc "Quảng cáo" (có thể do mạng quảng cáo tự động thêm).

## 2. Yêu cầu Hành vi (Behavior Requirements)
- **Auto-Refresh (Tự động làm mới)**: Nếu cấu hình có thiết lập refresh rate (ví dụ 30s, 60s), nội dung quảng cáo trong banner phải thay đổi tương ứng.
- **Tương tác**: Click vào banner phải đưa người dùng đến trang đích (Store/Trình duyệt).
- **Trải nghiệm cuộn (Nếu xen kẽ nội dung)**: Banner nội tuyến (Inline banner) không được cản trở thao tác cuộn (scroll) của người dùng.

## Checklist test case bắt buộc
Khi phân tích cấu hình quảng cáo Banner, BẮT BUỘC thêm các testcase sau:
1. Kiểm tra vị trí hiển thị banner không che khuất tính năng quan trọng của app.
2. Kiểm tra kích thước của banner, đặc biệt là tính tương thích trên các kích thước màn hình khác nhau (nếu là Adaptive Banner).
3. Kiểm tra tính năng tự động làm mới (Auto-refresh) hoạt động theo đúng khoảng thời gian quy định (nếu có cấu hình).
4. Kiểm tra click vào banner chuyển hướng người dùng đúng cách.
5. Kiểm tra trải nghiệm cuộn qua banner không bị khựng, lag, hay bị vô tình click nhầm (đối với banner xen giữa list nội dung).
