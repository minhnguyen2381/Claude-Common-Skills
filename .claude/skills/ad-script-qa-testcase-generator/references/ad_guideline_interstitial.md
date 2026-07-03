# Hướng dẫn Kiểm thử Quảng cáo Toàn màn hình (Interstitial Ad)

Quảng cáo Interstitial là loại quảng cáo che phủ toàn bộ màn hình của ứng dụng, thường hiển thị tại các điểm chuyển tiếp tự nhiên trong luồng sử dụng app (ví dụ: chuyển cấp độ trong game, sau khi hoàn thành một bài viết).

## 1. Yêu cầu Hiển thị (Display Requirements)
- **Độ phủ**: BẮT BUỘC phủ toàn bộ màn hình, chặn người dùng tương tác với nội dung ứng dụng bên dưới.
- **Nút Đóng (Close Button / X Button)**: 
  - Phải hiển thị rõ ràng.
  - Có thể bị ẩn trong một khoảng thời gian (VD: 5 giây đầu) nhưng sau đó phải xuất hiện và bấm được.

## 2. Yêu cầu Tương tác (Interaction Requirements)
- **Click vào nền/ảnh/video**: Phải chuyển hướng người dùng ra Trình duyệt hoặc Store.
- **Click vào nút Đóng (X)**: Phải tắt quảng cáo ngay lập tức và đưa người dùng trở lại màn hình ứng dụng trước đó, không gây mất dữ liệu.
- **Nút Back của thiết bị (Android)**: 
  - Phải có tác dụng đóng quảng cáo tương tự như nút X (sau khi quảng cáo đã hết thời gian khóa).
  - Không được phép để nút Back thoát hoàn toàn khỏi ứng dụng.

## Checklist test case bắt buộc
Khi phân tích cấu hình quảng cáo Interstitial, BẮT BUỘC thêm các testcase sau:
1. Kiểm tra quảng cáo che phủ toàn bộ màn hình.
2. Kiểm tra isShowNativeAfterInter=false => Không load và show quảng cáo native after inter (hoặc native interstitial) tại vị trí này
3. Kiểm tra isShowNativeAfterInter=true => Load và show được quảng cáo native after inter (hoặc native interstitial) tại vị trí này
2. Kiểm tra nội dung ứng dụng bên dưới bị vô hiệu hóa khi quảng cáo đang hiện.
3. Kiểm tra thời gian xuất hiện của nút Close (X) (nếu cấu hình có yêu cầu delay).
4. Kiểm tra nhấn nút Close (X) quảng cáo sẽ đóng và ứng dụng trở về trạng thái bình thường.
5. Kiểm tra nhấn nút Back của thiết bị (trên Android) có thể đóng quảng cáo.
6. Kiểm tra nhấn vào nội dung quảng cáo sẽ mở Store/Trình duyệt chính xác.