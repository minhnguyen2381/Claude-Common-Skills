# Các Pattern Gắn Quảng Cáo Chuẩn

Dưới đây là 5 pattern gắn quảng cáo cốt lõi dựa trên việc sử dụng `Dolphin-Ads:1.0.4`. Luôn copy và làm theo đúng cấu trúc này khi tích hợp.

## Pattern 1: Bottom Ad (Banner Adaptive / Native switching)

Sử dụng khi một màn hình có quảng cáo ở dưới cùng và có thể remote config trả về định dạng Banner Adaptive hoặc Native.

```kotlin
import com.pion.libads.adhelper.getDisplayConfig
import com.pion.libads.adhelper.showBannerAdaptiveAd
import com.pion.libads.adhelper.showNativeAd
import com.pion.libads.utils.AdsConstant

fun MyFragment.showAdsBottom() {
    when (getDisplayConfig(MyScreenAds.BOTTOM_CONFIG)?.type) {
        AdsConstant.BANNER_ADAPTIVE -> {
            showBannerAdaptiveAd(
                configName = MyScreenAds.BOTTOM_CONFIG,
                activity = requireActivity(),
                listSpaceName = listOf(MyCommonAds.BOTTOM_ADAPTIVE),
                viewGroupAds = binding.layoutAdsBottom,
            )
        }
        AdsConstant.NATIVE -> {
            showNativeAd(
                configName = MyScreenAds.BOTTOM_CONFIG,
                listSpaceName = listOf(MyCommonAds.BOTTOM_NATIVE),
                viewGroupAds = binding.layoutAdsBottom,
            )
        }
        else -> {
            // Do nothing
        }
    }
}
```

## Pattern 2: Interstitial trước Navigation

Sử dụng để show quảng cáo Interstitial toàn màn hình trước khi thực hiện hành động chuyển trang. Hàm callback `onAdsDone` phải CHẮC CHẮN chứa logic chuyển trang để ứng dụng không bị tắc nếu quảng cáo lỗi.

```kotlin
import com.pion.libads.adhelper.showInterstitialAd

fun MyFragment.showAdsInterAction(onAdsDone: () -> Unit) {
    showInterstitialAd(
        configName = MyScreenAds.ACTION_CONFIG,
        activity = requireActivity(),
        destinationToShowAds = navigator.getCurrentDestinationId(),
        onAdDone = { _, _, _ -> 
            onAdsDone.invoke() 
        }
    )
}

// Cách sử dụng (trong event handler):
binding.btnAction.setPreventDoubleClick {
    showAdsInterAction {
        navigator.navigateTo(R.id.action_to_next_screen)
    }
}
```

## Pattern 3: Splash Open Ad

Sử dụng riêng cho SplashFragment để hiển thị App Open Ad lúc khởi động kèm theo timeout dự phòng.

```kotlin
import com.pion.libads.adhelper.showSplashAdNew

fun SplashFragment.showAds() {
    showSplashAdNew(
        configName = SplashAds.CONFIG,
        openAppSpaceName = SplashAds.OPEN_AD,
        nativeAfterInterConfigName = SplashAds.AFTER_INTER_CONFIG,
        nativeAfterInterSpaceName = listOf(SplashAds.AFTER_INTER_NATIVE),
        timeout = 15000L,
        onAdDone = { _, _, _ -> 
            goToNextScreen() // Luôn tiến lên bước tiếp theo dù ads show thành công hay thất bại
        },
        onAdShow = {
            // Callback khi ad hiện lên
        },
        onAdFailed = { _, _ -> 
            // Callback khi ad thất bại
        }
    )
}
```

## Pattern 4: App Resume Open Ad

Được gọi một lần khi app được tạo, dùng để hiển thị Open Ad khi ứng dụng trở lại từ background (resume). Bỏ qua các màn hình như Splash/Onboard để không xung đột.

```kotlin
import com.pion.libads.adhelper.initAppResume

// Thường gọi trong HomeFragment hoặc MainActivity (lúc init thành công)
initAppResume(
    configName = AppResumeAds.CONFIG,
    listSpaceName = listOf(AppResumeAds.OPEN_AD_1, AppResumeAds.OPEN_AD_2),
    listBlockOpenAppFragment = listOf(R.id.splashFragment, R.id.onboardFragment),
)
```

## Pattern 5: Preload chuỗi quảng cáo

Nạp trước tài nguyên quảng cáo (Native/Interstitial) của các màn hình tiếp theo để giúp hiển thị mượt mà hơn. Xác định kịch bản preload từ mô tả trong Test Checklist (Cột "Mô tả Preload").

```kotlin
import com.pion.libads.adhelper.loadNativeAd

// Ví dụ: Đang ở SplashFragment nhưng load trước quảng cáo cho LanguageFragment
fun SplashFragment.preloadLanguageAds() {
    // Gọi hàm này trong lúc init View hoặc sau khi remote config tải xong
    loadNativeAd(
        configName = LanguageAds.NATIVE_11_CONFIG, 
        spaceName = LanguageAds.NATIVE_11_SPACE1
    )
    loadNativeAd(
        configName = LanguageAds.NATIVE_11_CONFIG, 
        spaceName = LanguageAds.NATIVE_11_SPACE2
    )
}
```
