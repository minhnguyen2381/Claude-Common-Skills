# Các Pattern Gắn IAP (In-App Purchase)

Dưới đây là các pattern quản lý luồng thanh toán và trạng thái Premium (VIP) sử dụng trong dự án (dựa trên `com.pion.libads.iaphelper`).

## Pattern IAP 1: Khởi tạo & Kiểm tra Premium khi mở app

Được thực hiện tại `MainActivity.kt` sau khi SDK quảng cáo (`isAdsReadyFlow()`) đã khởi tạo xong.

```kotlin
import com.pion.libads.iaphelper.hasAnyPurchasedProduct
import pion.tech.pionbase.util.Constant

// Khi observe thấy isAdsReady == true, kiểm tra các gói đã mua:
val isPremiumUser = hasAnyPurchasedProduct(
    listOf(Constant.idIapRemove, Constant.idSubRemove)
)

if (isPremiumUser) {
    commonViewModel.setPremium(true)
}
```

## Pattern IAP 2: Quản lý State Premium (ViewModel & DataStore)

Quản lý trạng thái đồng bộ giữa biến runtime (`CommonViewModel`) và lưu trữ vĩnh viễn (`DataStore`).

```kotlin
import com.pion.libads.adhelper.setAdPremium

// Trong CommonViewModel.kt
fun setPremium(isPremium: Boolean) {
    // 1. Cập nhật cho SDK Ads ngừng load ads
    setAdPremium(isPremium) 
    
    // 2. Lưu vào local storage
    handleApiCall(apiCall = { 
        dataStoreRepository.setIsPremium(isPremium) 
    })
}
```

## Pattern IAP 3: Xử lý Mua hàng Thành công (Restart App)

Khi người dùng mua hàng thành công, ứng dụng cần xóa toàn bộ cache của quảng cáo đang hiển thị hoặc được preload. Giải pháp là khởi động lại (restart) ứng dụng. Pattern này thường nằm trong `MainActivity.kt`.

```kotlin
import android.content.Intent
import android.os.Handler
import android.os.Looper
import com.pion.libads.iaphelper.SubscribeInterface
import com.pion.libads.iaphelper.model.ProductModel
import com.pion.libads.iaphelper.resetIapInfo
import com.pion.libads.iaphelper.setIAPListener

setIAPListener(object : SubscribeInterface {
    override fun subscribeSuccess(productModel: ProductModel) {
        // 1. Set trạng thái Premium
        commonViewModel.setPremium(true)
        
        // 2. Reset thông tin cache của IAP
        resetIapInfo(application = application, onDone = {
            
            // 3. Khởi động lại toàn bộ ứng dụng sau 500ms
            Handler(Looper.getMainLooper()).postDelayed({
                val intent = baseContext.packageManager.getLaunchIntentForPackage(baseContext.packageName)
                if (intent != null) {
                    intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
                    intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK)
                    startActivity(intent)
                }
            }, 500L)
        })
    }
})
```

## Pattern IAP 4: Ẩn Quảng Cáo Bằng Check Premium

Sử dụng extension function `hideAdsViewIfPremium` làm lá chắn tại *bất kỳ* hàm hiển thị quảng cáo nào trong các Fragment. Điều này giúp code gọn gàng và loại bỏ nguy cơ lọt quảng cáo cho user VIP.

```kotlin
import pion.tech.pionbase.util.hideAdsViewIfPremium

fun MyFragment.showAdsBottom() {
    // Kiểm tra Premium trước khi thực hiện logic hiển thị quảng cáo
    if (!hideAdsViewIfPremium(commonViewModel.isPremium(), binding.layoutAdsBottom)) {
        return // Dừng hàm ngay lập tức nếu là Premium
    }

    // Logic hiển thị quảng cáo ở đây...
}
```
