# Hướng dẫn Kiểm thử Quảng cáo Thu nhỏ (Squeeze Back / SB Ad)

Quảng cáo Squeeze Back (SB) hoạt động bằng cách "bóp nhỏ" nội dung đang phát (như video content) để nhường một phần màn hình cho nội dung quảng cáo xuất hiện (thường ở viền bên, dưới hoặc trên).

## 1. Yêu cầu Hiển thị (Display Requirements)
- **Hoạt ảnh Thu nhỏ (Squeeze Animation)**: Khi quảng cáo xuất hiện, nội dung chính phải được thu nhỏ lại mượt mà, không bị cắt xén (crop) mất tỷ lệ.
- **Vùng Quảng Cáo**: Vùng không gian trống tạo ra bởi việc thu nhỏ phải được lấp đầy bằng nội dung quảng cáo.
- **Label**: Nên có nhãn "Quảng cáo" / "Ad" rõ ràng trên vùng quảng cáo.

## 2. Yêu cầu Hành vi (Behavior Requirements)
- **Click**: Click vào phần nội dung quảng cáo sẽ mở Store hoặc Trình duyệt. Việc click vào phần nội dung đang thu nhỏ không được tính là click quảng cáo.
- **Hoạt ảnh Khôi phục (Un-squeeze/Restore)**: Khi quảng cáo kết thúc, nội dung chính phải phóng to mượt mà trở lại lấp đầy màn hình như cũ.

## Checklist test case bắt buộc
Khi phân tích cấu hình quảng cáo SB, BẮT BUỘC thêm các testcase sau:
1. Kiểm tra hiệu ứng thu nhỏ màn hình chính diễn ra mượt mà không bị lỗi layout.
2. Kiểm tra tỷ lệ khung hình của video gốc được giữ nguyên (không bị crop dẹt hoặc méo mó).
3. Kiểm tra vùng quảng cáo lấp đầy chính xác không gian trống.
4. Kiểm tra chỉ có vùng quảng cáo mới có thể click được (chuyển hướng), vùng video gốc vẫn hoạt động bình thường.
5. Kiểm tra khi quảng cáo đóng, màn hình chính được phóng to khôi phục lại trạng thái ban đầu mượt mà.
