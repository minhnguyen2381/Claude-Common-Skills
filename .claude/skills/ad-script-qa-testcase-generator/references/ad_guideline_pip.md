# Hướng dẫn Kiểm thử Quảng cáo Hình trong Hình (PiP Ad)

Quảng cáo PiP (Picture-in-Picture) là dạng quảng cáo hiển thị ở một góc nhỏ trên màn hình, thường trôi nổi trên nội dung chính (floating video).

## 1. Yêu cầu Hiển thị (Display Requirements)
- **Vị trí**: Phải nằm ở vị trí không che khuất các thao tác quan trọng của người dùng (thường là góc dưới cùng bên phải hoặc trái).
- **Kích thước**: Không được quá lớn chiếm tỷ lệ lớn màn hình.
- **Kéo thả (Draggable)**: Người dùng có thể kéo thả cửa sổ PiP sang các góc khác của màn hình không? (Tùy thuộc cấu hình).

## 2. Yêu cầu Hành vi (Behavior Requirements)
- **Mở rộng/Thu nhỏ**: Nếu có nút phóng to, click vào sẽ mở full màn hình.
- **Đóng**: Nút Close (X) nhỏ xíu ở góc cửa sổ PiP phải hoạt động và đóng quảng cáo ngay lập tức.

## Checklist test case bắt buộc
Khi phân tích cấu hình quảng cáo PiP, BẮT BUỘC thêm các testcase sau:
1. Kiểm tra vị trí xuất hiện ban đầu của PiP không che lấp tính năng chính của app.
2. Kiểm tra khả năng kéo thả cửa sổ PiP (nếu tính năng này được kích hoạt).
3. Kiểm tra nút Đóng (X) trên cửa sổ PiP tắt được quảng cáo PIP.
4. Kiểm tra nút Đóng (X) trên cửa sổ PIP phải được hiển thị sau 3 giây
5. Kiểm tra thay đổi được vị trí hiển thị ban đầu của pip trên remote config thông qua "positionShowPIP"

