---
name: piontech-ads-v104
description: Tích hợp, chỉnh sửa, và kiểm tra quảng cáo AdMob trong dự án Android sử dụng thư viện in-house Dolphin-Ads:1.0.4. Dùng skill này khi cần tuân thủ đúng ad pattern của Satellite2.
---

# Tích hợp quảng cáo Dolphin-Ads (piontech-ads-v104)

Skill này cung cấp các pattern và quy trình chuẩn để tích hợp quảng cáo vào codebase sử dụng thư viện `com.github.piontech96:Dolphin-Ads:1.0.4-alpha26` (Dựa trên dự án Satellite2).

## Workflow Tích Hợp Quảng Cáo & IAP

Khi được yêu cầu thêm hoặc sửa quảng cáo/IAP cho một màn hình, hãy tuân thủ quy trình sau:

1. **Xác định Screen & Vị trí:** Xác định Fragment và vị trí cần gắn ad (Bottom, Middle, Interstitial, Dialog...) hoặc flow IAP (Onboard, Home).
2. **Khai báo Config:** Thêm các hằng số (config name, space name) vào file cấu hình (`AdsSpaceConfig.kt`) hoặc các ID IAP vào `Constant.kt`. Tham khảo `references/ad-space-config-template.md`.
3. **Chọn Pattern:** Tham chiếu các mã mẫu từ `references/ad-patterns.md` hoặc `references/iap-patterns.md` để lấy đúng đoạn code.
4. **Implement Show Logic:** Implement việc hiển thị quảng cáo theo pattern đã chọn. **Không cần kiểm tra isPremium thủ công** vì logic này đã được tách biệt ở lớp cao hơn, hoặc sẽ được cung cấp riêng khi gọi hàm.
5. **Xử lý Preload (Nếu có):** Dựa vào test checklist hoặc yêu cầu kịch bản, xác định màn hình nào sẽ load trước quảng cáo cho màn hình này.
6. **Kiểm Tra Test Checklist:** Review lại mã theo `references/ad-test-checklist.md` và đảm bảo các điều kiện load/show/click/fallback đều thỏa mãn.

## Các Pattern Gắn Quảng Cáo Chính

Chi tiết về mã nguồn cho từng pattern nằm ở file `references/ad-patterns.md`. 
Danh sách các pattern được support:
- **Pattern 1:** Bottom Ad (Banner Adaptive / Native switching)
- **Pattern 2:** Interstitial trước Navigation
- **Pattern 3:** Splash Open Ad
- **Pattern 4:** App Resume Open Ad
- **Pattern 5:** Preload chuỗi quảng cáo

## Các Pattern Tích Hợp IAP (Premium)

Luồng mua hàng, mở khóa tính năng và quản lý state Premium. Chi tiết tại `references/iap-patterns.md`.
- **Pattern IAP 1:** Khởi tạo & Kiểm tra Premium khi mở app
- **Pattern IAP 2:** Quản lý State Premium (ViewModel & DataStore)
- **Pattern IAP 3:** Xử lý Mua hàng Thành công (Restart App)
- **Pattern IAP 4:** Ẩn Quảng Cáo Bằng Check Premium

## Test Checklist & Kịch bản Preload

Bạn có thể tự động sinh checklist kiểm thử dưới dạng Excel bằng cách sử dụng các script Python trong thư mục `scripts/`:

1. **Từ file JSON Config (Khuyên dùng):**
   Nếu bạn có file JSON chứa `listConfig` của quảng cáo (ví dụ: `config_show_ads.json`), hãy dùng:
   ```bash
   python scripts/generate_test_excel_from_json.py --input <đường_dẫn_json> --output test_checklist.xlsx
   ```
   Script sẽ tự động phân tích `type`, `isOn` và `isPreloadAfterShow` để vẽ bảng màu phù hợp cho các luồng.

2. **Từ script tạo sẵn:**
   Nếu bạn không có file JSON, bạn có thể chỉnh sửa `scripts/generate_test_excel.py` để định nghĩa list quảng cáo tĩnh.

Sử dụng script Python đi kèm để tự động sinh test checklist dạng Excel, giúp Tester và QA có thể kiểm tra toàn diện các kịch bản quảng cáo. sẽ có thêm cột mô tả Preload.

## Lifecycle & Architecture

Để hiểu sâu về luồng sống của quảng cáo (Initialization -> Preload -> Show -> Dismiss) cũng như tích hợp Consent và Remote Config, hãy tham khảo `references/ad-lifecycle-guide.md`.
