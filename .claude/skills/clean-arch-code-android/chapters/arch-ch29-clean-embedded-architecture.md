# Clean Architecture — Chapter 29: Clean Embedded Architecture (by James Grenning)

## Core Idea
*"Although software does not wear out, it can be destroyed from within by unmanaged dependencies on firmware and hardware."* **Firmware** không được định nghĩa bởi nơi lưu trữ (ROM) mà bởi **thứ nó phụ thuộc** và **độ khó thay đổi khi phần cứng tiến hóa**. Hãy viết ít firmware, nhiều software, bằng các lớp trừu tượng **HAL / PAL / OSAL** để test được ngoài thiết bị đích.

## Frameworks Introduced
- **Software vs Firmware** (Doug Schmidt + Grenning): firmware = code phụ thuộc phần cứng, khó đổi. Nhúng SQL vào code, rải dependency nền tảng khắp nơi là **viết firmware**. Sách viết thẳng: *"Android app developers write firmware when they don't separate their business logic from the Android API."*
- **Ví dụ "legacy code is the spec"**: hệ thống chuyển từ TDM sang VOIP; câu trả lời về hành vi cuộc gọi chỉ tìm được bằng cách đọc code cũ, vì logic nghiệp vụ trộn với TDM, nên **toàn bộ sản phẩm thành firmware**. Message dispatcher nằm chung file với code UART cũng bị ô nhiễm như vậy.
- **App-titude test**: Kent Beck: *"First make it work. Then make it right. Then make it fast."* Brooks: *"plan to throw one away."* Chỉ "làm cho chạy" là mới qua **App-titude test**, chưa đủ.
  - Ví dụ: một file trộn `ISR(TIMER1_vect)`, `calc_RPM()` (domain), `Read_RawData()` (phần cứng), `Load_FLASH_Setup()` (lưu trữ)… Nhóm lại theo concern sẽ thấy ngay các tầng.
- **Target-Hardware Bottleneck**: chỉ test được trên thiết bị đích thì phát triển bị chậm.
- **A clean embedded architecture is a testable embedded architecture**:
  - **Layers**: Software / Firmware / Hardware. *"Software and firmware intermingling is an anti-pattern."*
  - **The Hardware Is a Detail → HAL**: API của HAL được **may theo nhu cầu của software** phía trên. Ví dụ: firmware lưu bytes vào flash, HAL cung cấp lưu name/value. Ví dụ LED: firmware `Led_TurnOn(5)`, HAL `Indicate_LowBattery()`. Các tầng lặp lại như **fractal**. *"Don't reveal hardware details to the user of the HAL."*
  - **The Processor Is a Detail → PAL**: compiler extension (`acmetypes.h`, thanh ghi `SBUF0`, `IE`, `TI_0`) chỉ được biết ở rất ít file; dùng `stdint.h`, tự viết nếu target không có.
  - **The Operating System Is a Detail → OSAL**: RTOS có thể bị mua lại, tăng phí, thiếu tính năng. OSAL cô lập, giúp đổi OS chỉ cần viết OSAL mới.
- **Programming to Interfaces and Substitutability**: header file làm interface, chỉ chứa khai báo hàm và hằng/struct cần thiết; giấu chi tiết impl. **DRY conditional compilation**: dùng HAL thay vì `#ifdef BOARD_V2` rải khắp nơi.

## Key Concepts
- **Firmware** (định nghĩa mới): code bị trói vào phần cứng/nền tảng.
- **HAL / PAL / OSAL**: lớp trừu tượng phần cứng / bộ xử lý / hệ điều hành.
- **Off-target testing**: test ngoài thiết bị đích.
- **Seam / substitution point**: điểm có thể thay impl để test.

## Mental Models
- Hỏi một file: "**Nếu đổi nền tảng (thiết bị/OS/SDK), file này có sống sót không?**" Nếu không thì nó là firmware; giữ nó mỏng.
- API của lớp trừu tượng nói bằng **ngôn ngữ sản phẩm** (`Indicate_LowBattery`), không bằng ngôn ngữ phần cứng (`Led_TurnOn(5)`).

## Anti-patterns
- **Business logic trộn với API nền tảng** trong cùng file/class.
- **Chỉ test được trên thiết bị thật**.
- **`#ifdef` / kiểm tra phiên bản nền tảng rải khắp code**.

## 🤖 Android mapping (chuyển thể, không có trong sách)
Android framework **chính là** "hardware/OS" của app. Bảng HAL/OSAL cho Android:
| Chi tiết nền tảng | Lớp trừu tượng (ngôn ngữ sản phẩm) | Impl (firmware mỏng) |
|---|---|---|
| FusedLocationProvider, `LatLng` | `interface LocationSource { suspend fun current(): Coordinates? }` | `PlayServicesLocationSource(context)` |
| `Locale`, `Configuration` | `DeviceLocaleProvider` (Satellite2 đã có ✅) | `AndroidDeviceLocaleProvider` |
| DataStore Preferences | `interface PremiumStatusSource { val isPremium: Flow<Boolean> }` | `DataStorePremiumStatusSource` |
| `ConnectivityManager` | `interface NetworkMonitor { val isOnline: Flow<Boolean> }` | `AndroidNetworkMonitor` |
| Runtime permission | `interface LocationPermission { fun isGranted(): Boolean }` | `AndroidLocationPermission` |
| `Build.VERSION.SDK_INT` check | Ẩn trong impl, không lên domain | — |

- **Ví dụ "firmware" trong Satellite2**: `GetCurrentUserGPSLocationUseCase` nằm ở `domain` nhưng nhận `Context`, gọi `LocationServices`, trả `com.google.android.gms.maps.model.LatLng`. Đây là firmware giả dạng use case, không test được trên JVM. Tách theo HAL:
```kotlin
// domain — software
data class Coordinates(val lat: Double, val lng: Double)
interface LocationSource { suspend fun current(): Coordinates?; suspend fun lastKnown(): Coordinates? }
class GetUserLocationUseCase(private val source: LocationSource, private val permission: LocationPermission) {
    suspend operator fun invoke(): Coordinates? {
        if (!permission.isGranted()) return null
        return withTimeoutOrNull(5.seconds) { source.current() } ?: withTimeoutOrNull(5.seconds) { source.lastKnown() }
    }
}
// data/platform — firmware mỏng: suspendCancellableCoroutine + FusedLocationProviderClient (giữ code hiện có ở đây)
class PlayServicesLocationSource(private val context: Context) : LocationSource { ... }
```
  Map `Coordinates` thành `LatLng` ở tầng UI/Map (presenter), nơi Google Maps thực sự cần.
- **"App-titude test" trên Android**: app chạy được trên máy dev là mới qua bài kiểm tra đầu. "Make it right" = tách firmware khỏi software để test JVM.

## Key Takeaways
1. Firmware = code bị trói vào nền tảng; viết càng ít càng tốt.
2. Phần cứng, bộ xử lý, OS (và Android SDK) đều là detail.
3. Dùng lớp trừu tượng nói ngôn ngữ sản phẩm, cho phép test ngoài thiết bị.
4. Đừng dừng ở "make it work".

## Connects To
- **arch-ch17 (Boundaries)**, **arch-ch22 (Frameworks & Drivers)**, **arch-ch32 (Frameworks Are Details)**.
