# Vòng Đời Tích Hợp Quảng Cáo (Lifecycle Guide)

Tài liệu này tóm tắt cách thức một quảng cáo được khởi tạo, quản lý và hiển thị trong kiến trúc thư viện `Dolphin-Ads` đang sử dụng.

## 1. Khởi Tạo (Initialization)
Quá trình khởi tạo ban đầu được thực hiện trong `MyApplication.onCreate()`:
- Hàm `initAds()` khởi tạo SDK (AdMob, AppsFlyer) và truyền vào `admobId`, ID điều hướng chính của app (`navHostId`).

Sau đó, trong `MainActivity.onCreate()` (khi nhận được sự kiện `isAdsReady`), thực hiện:
- Hàm `initPreloadInterstitial()`: Nạp trước (cache) 2 luồng interstitial dự phòng vào bộ nhớ để gọi nhanh khi cần.

## 2. Remote Config (Fetch Cấu Hình)
Ứng dụng sẽ dựa vào Firebase Remote Config để biết quảng cáo ở từng màn hình có trạng thái Bật/Tắt hay sử dụng định dạng gì.
- Quá trình này được kích hoạt ở màn hình `SplashFragment` qua hàm `fetchRemoteConfig()`.
- Các dữ liệu remote được cập nhật vào lớp `AppRemoteConfig`, từ đó hàm `getDisplayConfig(configName)` có thể quyết định show Banner hay Native (như Pattern 1).
- Nếu không fetch được Firebase, thư viện sẽ đọc fallback từ file `admob_id.json` và `config_show_ads.json` trong thư mục `assets/`.

## 3. Preload Chain (Nạp Trước)
Quảng cáo native (đặc biệt là màn hình onboarding hoặc home) có thể mất vài giây để tải. Để tránh trải nghiệm chớp nháy hoặc khung trống:
- Các màn hình trước đó sẽ gọi `loadNativeAd()` để tải ngầm quảng cáo cho màn hình tiếp theo. (Theo Pattern 5)
- Việc load này dựa vào kịch bản cụ thể được mô tả trong file Excel Checklist (cột "Mô tả Preload").

## 4. Hiển Thị (Show)
- Hàm hiển thị gọi ra (`showNativeAd`, `showInterstitialAd`, `showBannerAdaptiveAd`) sẽ lấy quảng cáo đã cache hoặc yêu cầu load mới.
- Việc xử lý Premium User (trả phí IAP) được thực hiện tách biệt ở layer bên trên (ví dụ thông qua logic của `MainActivity` / `CommonViewModel`) báo lại SDK bằng `setAdPremium(true)`.

## 5. Chính Sách Dữ Liệu & Consent (GDPR)
Ứng dụng tuân thủ chính sách bảo mật cho người dùng EU:
- Thư viện cung cấp hàm `isNeedToShowConsent()` để kiểm tra xem có cần bắt đầu luồng xin phép người dùng theo chuẩn UMP của Google hay không.
- Nếu có, gọi hàm `showConsentForm()` (thường ở màn hình Cài đặt hoặc Splash) để hiển thị hộp thoại Consent Form.
