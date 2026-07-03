# Hướng dẫn Kiểm thử Quảng cáo Có thưởng (Rewarded Ad)

Quảng cáo có thưởng (Rewarded Ads) là định dạng quảng cáo cho phép người dùng chủ động xem quảng cáo (thường là video hoặc nội dung tương tác) để đổi lấy phần thưởng trong ứng dụng (như xu, mạng sống, vật phẩm...).

## 1. Yêu cầu Hiển thị (Display Requirements)
- **Thông báo rõ ràng**: Trước khi xem, phải có thông báo hoặc popup cho biết phần thưởng cụ thể mà người dùng sẽ nhận được nếu xem hết.
- **Phủ toàn màn hình**: Tương tự như Interstitial, thường sẽ phủ toàn màn hình để đảm bảo người dùng tập trung xem quảng cáo.
- **Nút Đóng (Close Button / X Button)**:
  - Nếu người dùng bấm Đóng khi chưa xem xong, phải có một hộp thoại cảnh báo (Confirmation Dialog) kiểu: "Bạn có chắc muốn đóng không? Bạn sẽ mất phần thưởng."

## 2. Yêu cầu Hành vi (Behavior Requirements)
- **Trả thưởng (Reward Callback)**: Chỉ khi video quảng cáo đã phát hết (hoặc đếm ngược xong), hệ thống mới thực hiện callback cộng thưởng cho người dùng.
- **Khôi phục trạng thái**: Sau khi đóng quảng cáo (dù có nhận thưởng hay không), ứng dụng phải trở về đúng vị trí người dùng đã gọi quảng cáo, không được reset hoặc crash app.
- **Trạng thái Mạng**: Nếu mạng yếu hoặc mất mạng giữa chừng, cần có thông báo lỗi hợp lý thay vì treo app, và không cộng phần thưởng.

## Checklist test case bắt buộc
Khi phân tích cấu hình quảng cáo Rewarded, BẮT BUỘC thêm các testcase sau:
1. Kiểm tra màn hình xác nhận xem quảng cáo có hiển thị rõ phần thưởng sẽ nhận được không.
2. Kiểm tra nếu người dùng đóng quảng cáo giữa chừng, popup cảnh báo mất phần thưởng có xuất hiện không.
3. Kiểm tra phần thưởng KHÔNG được cộng nếu người dùng đóng quảng cáo giữa chừng.
4. Kiểm tra phần thưởng ĐƯỢC cộng chính xác sau khi xem hết toàn bộ video.
5. Kiểm tra người dùng được trả về đúng màn hình trước đó sau khi đóng quảng cáo.
6. Kiểm tra xử lý lỗi khi mất kết nối mạng (Network error) trong lúc load/xem quảng cáo.
7. Kiểm tra kịch bản có vị trí inter thay thế show trong trường hợp reward không show được hay không?
