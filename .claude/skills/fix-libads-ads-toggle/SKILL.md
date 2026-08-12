---
name: fix-libads-ads-toggle
description: Fixes the LibAds bug where switching off a remote-config ad-type flag (isNativeOn, isBannerOn, isBannerAdaptiveOn, isBannerCollapsibleOn, isBannerLargeOn, isNativeFullScreenOn, isInterstitialOn, isOpenAppOn, isRewardVideoOn, isRewardInterOn) stops ads loading but leaves the empty ad placeholder visible — a grey box, a "Loading ads" / "Tải quảng cáo" label, or blank reserved space. Use this whenever someone working in an Android project that vendors the LibAds module says an ad slot still shows up after they disabled ads from Firebase Remote Config, and also whenever they ask to audit or repair how checkConditionShowAds and checkAdsByType gate ad display. Reach for it even if they describe the symptom loosely ("tắt quảng cáo rồi mà vẫn hiện ô xám", "ad space still reserved", "placeholder won't go away") without naming the flags.
---

# Fixing the LibAds ad-type toggle leak

LibAds có một lỗi hiển thị khiến placeholder của quảng cáo vẫn hiện (khoảng trống xám, chữ "Loading ads") ngay cả khi quảng cáo đã bị tắt thông qua Firebase Remote Config.

Để sửa lỗi này, hãy thực hiện lần lượt các bước dưới đây để điều chỉnh logic kiểm tra cấu hình quảng cáo.

## Bước 1: Thêm 2 hàm kiểm tra logic bật/tắt quảng cáo

Sử dụng tool `grep_search` để tìm file chứa các hàm check quảng cáo như `checkConditionShowAds` (thường là ở file `AdsConstant.kt`, `AdsUtils.kt` hoặc class quản lý ads tương tự).

Nếu 2 hàm dưới đây chưa tồn tại, hãy chèn chúng vào:

```kotlin
fun checkAdsIsOnByConfigName(configName: String): Boolean {
    return checkAdsByTypeWithConfigName(configName) && AdsConstant.listConfigAds[configName]?.isOn == true
}

fun checkAdsByTypeWithConfigName(configName: String): Boolean {
    if (AdsConstant.disableAllConfig) {
        return false
    }
    val adsType = AdsConstant.listConfigAds[configName]?.type
    return when (adsType) {
        //admob
        AdDef.ADS_TYPE_ADMOB.OPEN_APP -> {
            return AdsConstant.isOpenAppOn
        }

        AdDef.ADS_TYPE_ADMOB.INTERSTITIAL -> {
            return AdsConstant.isInterstitialOn
        }

        AdDef.ADS_TYPE_ADMOB.NATIVE -> {
            return AdsConstant.isNativeOn
        }

        AdDef.ADS_TYPE_ADMOB.NATIVE_FULL_SCREEN -> {
            return AdsConstant.isNativeFullScreenOn
        }

        AdDef.ADS_TYPE_ADMOB.BANNER -> {
            return AdsConstant.isBannerOn
        }

        AdDef.ADS_TYPE_ADMOB.BANNER_ADAPTIVE -> {
            return AdsConstant.isBannerAdaptiveOn
        }

        AdDef.ADS_TYPE_ADMOB.BANNER_LARGE -> {
            return AdsConstant.isBannerLargeOn
        }

        AdDef.ADS_TYPE_ADMOB.BANNER_INLINE -> {
            return AdsConstant.isBannerInlineOn
        }

        AdDef.ADS_TYPE_ADMOB.BANNER_COLLAPSIBLE -> {
            return AdsConstant.isBannerCollapsibleOn
        }

        AdDef.ADS_TYPE_ADMOB.REWARD_VIDEO -> {
            return AdsConstant.isRewardVideoOn
        }

        AdDef.ADS_TYPE_ADMOB.REWARD_INTERSTITIAL -> {
            return AdsConstant.isRewardInterOn
        }

        else -> {
            false
        }
    }
}
```

## Bước 2: Sửa hàm checkConditionShowAds

Tìm hàm `checkConditionShowAds` hiện tại và sửa đổi toàn bộ nội dung của nó thành như sau (sử dụng hàm kiểm tra mới):

```kotlin
fun checkConditionShowAds(context: Context?, configName: String): Boolean {
    context ?: return false
    val config: ConfigAds? = AdsConstant.listConfigAds[configName]
    val isOn = config?.isOn ?: false
    if (!checkAdsByTypeWithConfigName(configName)) return false
    return (AdsConstant.isInternetConnected
            && !AdsConstant.isPremium
            && isOn
            && isOverTimeDelay(configName = configName))
}
```

## Bước 3: Tìm và thay thế logic check isOn trên toàn bộ app

Sử dụng `grep_search` để tìm toàn bộ trong app những chỗ có logic:
```kotlin
AdsConstant.listConfigAds[configName]?.isOn == true
```
hoặc đoạn mã tương đương mà đang chỉ kiểm tra đơn thuần `isOn == true`.

**LƯU Ý QUAN TRỌNG:** Ngoại trừ hàm `checkAdsIsOnByConfigName()` (vừa thêm ở Bước 1), hãy dùng lệnh thay thế để sửa đoạn logic tìm được thành việc gọi hàm:
```kotlin
checkAdsIsOnByConfigName(configName)
```
hoặc tương tự tuỳ thuộc vào biến truyền vào, nhằm đảm bảo mọi nơi đều phải check điều kiện theo type của config quảng cáo.

## Bước 4: Kiểm tra và Verify
- Chạy build hoặc sync để đảm bảo logic vừa thay không bị lỗi cú pháp.
- Thông báo cho user về những thay đổi đã thực hiện và dặn user tự test trên device thực tế (hoặc dùng emulator) để xem placeholder (ô màu xám / chữ Loading...) đã bị ẩn đi chưa.
