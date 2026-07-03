# Hướng dẫn Kiểm thử Quảng cáo Native
## Checklist test case bắt buộc
### 1. Testcase chung cho toàn bộ loại Native

Khi phân tích cấu hình quảng cáo Native, BẮT BUỘC thêm các testcase (toàn bộ loại native) sau:

1. Kiểm tra type có đúng là "Native" trên remote config không ?
2. Kiểm tra có đổi được trên Remote Config của nút CTA như: Màu, Corner Radius, Text Color
3. Kiểm tra có đổi được trên Remote Config của background color hay không ? 
4. Kiểm tra có đổi được trên Remote Config của text color của các nội dung khác CTA hay không ?
5. Kiểm tra với isPreloadAfterShow=true => Đã load được quảng cáo sau khi show chưa?
6. Kiểm tra với isPreloadAfterShow=false => Phải không được phép load được quảng cáo sau khi show chưa?
7. Kiểm tra có đổi được remote config thay được template quảng cáo hay không
8. Kiểm tra với isCloseWhenClick=true => Quảng cáo phải được ẩn đi khi click ads native (QUAN TRỌNG: KHÔNG ÁP DỤNG CHO NATIVE FULL SCREEN)
9. Kiểm tra với isCloseWhenClick=false => Quảng cáo không được phép ẩn khi click ads native
10. Kiểm tra với isCloseWhenClickNativeCollapsible=true => Quảng cáo phải được ẩn đi (VÀ KHÔNG SHOW LẠI) khi click nút Collapsible trên Native Collapse
11. Kiểm tra với isCloseWhenClickNativeCollapsible=false => Quảng cáo không được phép ẩn khi click nút Collapsible trên Native Collapse
12. Kiểm tra việc click ads trên toàn bộ vị trí của ads native dạng thường hoạt động hay không ?
13. Kiểm tra việc click ads trên toàn bộ vị trí của ads native dạng Collapsible có hoạt động hay không?

### 2. Testcase cho loại Native gắn trong dạng List

### 2.1 Dấu hiệu nhận biết quảng cáo dạng Native gắn trong List:
- Tên config có chữ "between"
- Mô tả quảng cáo thường theo dạng "quảng cáo giữa các content"

### 2.2 Khi phân tích cấu hình quảng cáo Native trên list, BẮT BUỘC thêm các testcase sau:
1. Kiểm tra ads đã được span đủ theo chiều dài màn hình
2. Kiểm tra việc ads được show và không load lại nhiều lần (phải sử dụng includeHasBeenOpened=true)

### 3. Testcase cho loại dạng Native full screen (loại thường)
### 3.1 Dấu hiệu nhận biết quảng cáo dạng Native full screen (loại thường):
- Tên loại quảng cáo là "Native Full Screen"

### 3.2 Khi phân tích cấu hình quảng cáo Native full screen, BẮT BUỘC thêm các testcase sau:
- Kể cả isCloseWhenClick=true, không được phép ẩn Native Full Screen này đi

### 4. Test case cho loại dạng Native Interstitial hoặc Native After Inter:
### 4.1 Dấu hiệu nhận biết quảng cáo dạng Native Interstitial hoặc Native After Inter:
- Tên loại quảng cáo là "Native Full Screen"

### 4.2 Khi phân tích cấu hình quảng cáo Native full screen, BẮT BUỘC thêm các testcase sau:
- Chỉ được phép xuất hiện sau tắt quảng cáo inter
