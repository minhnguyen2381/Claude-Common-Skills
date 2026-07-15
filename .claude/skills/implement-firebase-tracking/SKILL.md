---
name: implement-firebase-tracking
description: Use when the user wants to implement, add, or set up Firebase event tracking for a specific screen or feature in the Android project.
---

# Implement Firebase Tracking

## Overview
Quy trình chuẩn để gắn tracking Firebase vào dự án Android, sử dụng các script hỗ trợ đọc dữ liệu từ Excel, kiểm tra Constant và tạo kịch bản gắn tracking.

## Lệnh thực thi Python (UTF-8 Requirement)
**QUAN TRỌNG:** Để tránh lỗi Unicode trên Windows, khi chạy script, **BẮT BUỘC** sử dụng cờ UTF-8. 
Ví dụ: `python -X utf8 path_to_script.py ...`

## Quy trình bắt buộc (Tracking Implementation)

### Bước 0: Khởi tạo và kiểm tra môi trường Python (BẮT BUỘC)
Trước khi chạy bất kỳ script nào dưới đây, bạn (AI) **phải** đảm bảo môi trường Python có sẵn và đủ thư viện.
1. Chạy lệnh: `python --version` (hoặc `py --version`, `python3 --version`) để tìm command chạy Python hợp lệ.
2. Kiểm tra xem thư viện `pandas` (dùng để đọc Excel) và `openpyxl` đã được cài đặt chưa: `python -m pip show pandas openpyxl`.
3. Nếu chưa có, tiến hành cài đặt bằng lệnh: `python -m pip install pandas openpyxl`.
4. Ghi nhớ alias `python` hợp lệ (VD: `python`, `py` hay `python3`) để chạy các lệnh ở Bước 1 đến Bước 6.

### Bước 1: Check danh sách tên FirebaseEventNameSanitizer (BẮT BUỘC)
Chạy script để quét `android:label` trong `nav_main.xml` và xuất ra các event name đã sanitize.
- **Thực thi:** Gọi lệnh: `python -X utf8 .agents/skills/implement-firebase-tracking/scripts/extract_nav_labels.py <path_to_nav_main.xml>` (hãy tìm đường dẫn `nav_main.xml` trong thư mục project của user).
- **Kết quả:** Danh sách lưu vào `docs/sanitize_screen_name.txt`.

### Bước 2: Đọc dữ liệu từ Excel (BẮT BUỘC)
Chạy script để đọc file Excel mẫu (UTF-8) và xuất ra JSON.
- **Thực thi:** Gọi lệnh: `python -X utf8 .agents/skills/implement-firebase-tracking/scripts/parse_excel.py "C:\Users\Admin\Desktop\Excel Tracking Live Video 2.xlsx"`
- **Kết quả:** Dữ liệu lưu vào `docs/tracking_data.json`. *Lưu ý: Nếu JSON đã được cập nhật, có thể bỏ qua.*

### Bước 3: Xác định màn hình cần gắn (TÙY CHỌN)
Nếu User chưa cung cấp tên màn hình, hãy chủ động hỏi User về màn hình họ định gắn tracking.

### Bước 4: Kiểm tra và tạo TrackingConstant (BẮT BUỘC)
Sử dụng script để check xem `EventName` và `ParamName` của màn hình định gắn đã tồn tại trong dự án chưa.
- **Thực thi:** Gọi lệnh: `python -X utf8 .agents/skills/implement-firebase-tracking/scripts/check_tracking_constant.py <path_to_TrackingConstant.kt> <screen_name>` (bạn phải tự tìm đường dẫn đến `TrackingConstant.kt`).
- Nếu chưa tồn tại, BẮT BUỘC phải sinh mã code để bổ sung/tạo Constant cho màn hình đó.

### Bước 5: Đối chiếu `sanitize_screen_name.txt` (BẮT BUỘC)
Chạy script kiểm tra xem event `_show` và `_view` có bị trùng lặp vì Navigation Controller đã xử lý không.
- **Thực thi:** Gọi lệnh: `python -X utf8 .agents/skills/implement-firebase-tracking/scripts/check_sanitized_names.py <screen_name>`
- Nếu TỒN TẠI (script báo True): KHÔNG được gắn event name này (sẽ bị double track).
- Nếu CHƯA (script báo False): Mới tiến hành lên kế hoạch gắn event.

### Bước 6: Tạo Plan gắn Tracking (BẮT BUỘC)
Chạy script để lấy ra kịch bản tracking cho màn hình cụ thể, kết hợp với các Constant cần dùng.
- **Thực thi:** Gọi lệnh: `python -X utf8 .agents/skills/implement-firebase-tracking/scripts/get_tracking_plan.py <screen_name> <path_to_TrackingConstant.kt>`
- Từ output của script, BẮT BUỘC tạo ra Implementation Plan (Kế hoạch triển khai) cho user review, bao gồm cả code ví dụ để tích hợp.

## Firebase Convention & Implementation Rules
- **Sử dụng Logger (BẮT BUỘC):** Phải inject và sử dụng đối tượng `FirebaseAnalyticsLogger` (ví dụ `logger.logEvent(...)`, `logger.logScreen(...)`) để triển khai việc bắn event. KHÔNG sử dụng trực tiếp `FirebaseAnalytics.getInstance()`.
- **Vị trí gắn Event:** Với các event có đuôi là `_show`, `_view`, nên được gắn trong hàm `init()` của ViewModel hoặc UI class (Activity/Fragment/Compose).
- **Tái sử dụng code:** Nếu có nhiều đoạn code trùng lặp để gắn event, hãy viết ra một hàm dùng chung (helper/extension function) để dễ dàng tái sử dụng.
- **Firebase Convention:** Đảm bảo toàn bộ tracking không vi phạm convention của Firebase (tên event tối đa 40 ký tự, chỉ gồm chữ cái/số/dấu gạch dưới, phải bắt đầu bằng chữ cái). Vi phạm điều này sẽ dẫn đến không thể đẩy dữ liệu lên Firebase được.
