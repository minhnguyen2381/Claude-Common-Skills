# Checklist Kiểm Tra Tích Hợp Quảng Cáo

Đây là danh sách kiểm tra các hạng mục tích hợp quảng cáo dựa trên dữ liệu chuẩn từ file Excel. Bạn có thể sử dụng file này như một tài liệu tham khảo nhanh. Để xuất ra file Excel phục vụ cho Tester/QA sử dụng, vui lòng dùng script `generate_test_excel.py`.

## Các Hạng Mục Kiểm Tra Cốt Lõi Trên Từng Vị Trí Quảng Cáo

Đối với mỗi vị trí hiển thị quảng cáo (Config/Space Name), cần kiểm tra các bước sau:

1. **Load:** Quảng cáo có được trả về dữ liệu (có nội dung, hình ảnh) không? Hoặc có trả về lỗi "No fill" thay vì crash?
2. **Show:** Quảng cáo có hiển thị đúng vị trí (Bottom, Middle, hay Toàn Màn Hình) trên giao diện không? Không bị đè lên các UI components khác.
3. **Click:** Khi bấm vào quảng cáo, ứng dụng có mở được trang web đích hoặc Google Play không?
4. **Preload:** Nếu đây là vị trí được load ngầm ở màn hình trước, kiểm tra xem việc load ngầm có được kích hoạt thành công (dựa theo log) và hiển thị tức thời (instant show) ở màn hình này không? (Cần tham khảo cột "Mô tả Preload" trong Excel).
5. **Error Fallback:** Nếu quảng cáo thất bại (No internet, No Fill), ứng dụng có tiếp tục luồng sự kiện (ví dụ: chuyển qua màn hình khác) thay vì bị chặn lại không?

## Dữ Liệu Tham Khảo (Các luồng chính)

Danh sách rút gọn một số luồng cấu hình quan trọng đã tích hợp (Xem file Excel đầu ra để có đầy đủ 125 test case):

### 1. Luồng Splash & Onboard
- `SplashAds.CONFIG`: Interstitial / Open Ad
- `SplashAds.AFTER_INTER_CONFIG`: Native
- `LanguageAds.NATIVE_11_CONFIG`, `12_CONFIG`, `21_CONFIG`, `22_CONFIG`: Native
- `OnboardAds.NATIVE_11_CONFIG`, `12_CONFIG`, `2_CONFIG`, `3_CONFIG`: Native
- *Lưu ý Preload:* Splash sẽ preload ads cho Language. Language sẽ preload ads cho Onboard.

### 2. Luồng Home & Tìm Kiếm Theo Số (Phone Search)
- `HomeAds.BOTTOM_CONFIG`: Native / Banner Adaptive (Tùy Remote Config)
- `HomeAds.MIDDLE_CONFIG`, `MIDDLE_CT_CONFIG`: Native
- `PhoneSearchAds.MIDDLE_BEFORE_CONFIG`, `MIDDLE_AFTER_CONFIG`: Native
- `PhoneSearchAds.BOTTOM_CONFIG`: Native / Banner Adaptive
- `PhoneSearchAds.SEARCH_CONFIG`: Interstitial trước khi navigate sang kết quả

### 3. Luồng Live Camera & Street View 360
- Khá tương đồng nhau về cấu trúc:
- `*_search_bottom`, `*_result_bottom`, `*_famous_bottom`, `*_map_bottom`: Native / Banner Adaptive
- `*_search-search`, `*_search-map`, `*_search-more`, `*_search-content`: Interstitial trên các action
- `*_between`: Quảng cáo Native được chèn giữa danh sách

### 4. History / Exit App / Resume
- `HistoryAds.BOTTOM_CONFIG`: Native / Banner Adaptive
- `AppResumeAds.CONFIG`: Open Ad khi mở lại từ nền.
- `ExitAppAds.CONFIG`: Native hiển thị trên hộp thoại xác nhận thoát app (Được preload từ HomeFragment).
