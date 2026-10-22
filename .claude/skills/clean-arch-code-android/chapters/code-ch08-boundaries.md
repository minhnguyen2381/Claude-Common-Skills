# Clean Code — Chapter 8: Boundaries (James Grenning)

## Core Idea
Ta hiếm khi kiểm soát toàn bộ code trong hệ thống: có thư viện bên thứ ba, open source, module của team khác. Hãy **giữ ranh giới sạch**: ít chỗ biết về code ngoài, **bọc** hoặc dùng **Adapter**, viết **learning tests** và **boundary tests**. *"It's better to depend on something you control than on something you don't control, lest it end up controlling you."*

## Frameworks Introduced
- **Using Third-Party Code**: nhà cung cấp muốn interface **rộng** (cho nhiều người); người dùng muốn interface **hẹp** theo nhu cầu.
  - Ví dụ `java.util.Map`: có `clear()` (ai cũng xóa được), không ràng buộc type; cast rải khắp nơi `(Sensor) sensors.get(id)`.
  - Bọc vào `Sensors.getById(id)`: interface ở ranh giới được **giấu**, có thể tiến hóa, **may đo** theo app, cưỡng chế business rule.
  - Không cần bọc *mọi* Map, nhưng **đừng truyền Map (hay bất kỳ boundary interface nào) đi khắp hệ thống**; giữ nó trong class hoặc nhóm class gần, không trả về hay nhận làm tham số của public API.
- **Exploring and Learning Boundaries → Learning Tests** (Jim Newkirk): thay vì vừa học vừa tích hợp trong production code, viết **test gọi API bên thứ ba theo cách app sẽ dùng** như những thí nghiệm có kiểm soát. Ví dụ học log4j: `testLogCreate` → lỗi thiếu Appender → `ConsoleAppender` + `PatternLayout` + `SYSTEM_OUT` → đóng gói tri thức vào `LogTest`, rồi bọc vào logger riêng.
- **Learning Tests Are Better Than Free**: tốn 0 (đằng nào cũng phải học), lại có ROI: khi thư viện ra bản mới, chạy lại để phát hiện thay đổi hành vi. Dù không cần học, ranh giới sạch vẫn nên có **outbound/boundary tests** để di chuyển phiên bản không sợ.
- **Using Code That Does Not Yet Exist**: subsystem "Transmitter" chưa có API. Team tự định nghĩa **interface mình mong muốn** (`Transmitter.transmit(frequency, stream)`), viết `CommunicationsController` sạch; khi API thật có thì viết `TransmitterAdapter` (**Adapter** pattern). Có **seam** để test với `FakeTransmitter`.
- **Clean Boundaries**: ít chỗ tham chiếu code ngoài; bọc (như Map) hoặc Adapter (chuyển từ interface hoàn hảo của ta sang interface được cung cấp).

## Key Concepts
- **Boundary interface**: API của bên ngoài.
- **Wrapper / Adapter**.
- **Learning test**, **boundary test**.
- **Seam**: điểm thay thế để test.
- **Interface we wish we had**.

## Mental Models
- Đếm **số file import thư viện X**. Con số đó chính là chi phí khi phải đổi X.
- Khi chờ team khác: **viết interface mình muốn**, đừng ngồi chờ.

## Anti-patterns
- Truyền type của thư viện (Map, Response, SDK object) qua public API của mình.
- Học thư viện bằng cách thử trực tiếp trong production code.
- Bị block vì API chưa có.

## Code Examples
```java
public class Sensors {
  private Map sensors = new HashMap();
  public Sensor getById(String id) { return (Sensor) sensors.get(id); }
}
```
- **What it demonstrates**: giấu boundary interface, chỉ lộ đúng thao tác app cần.

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **Bọc SDK bên thứ ba** (Satellite2 có rất nhiều: Google Maps/Places, Firebase, ExoPlayer/Media3, YouTube player, Glide, BlurView, libphonenumber, ads SDK):
| SDK | Wrapper/Adapter trong app | Lợi ích |
|---|---|---|
| libphonenumber `PhoneNumberUtil` | `PhoneNumberParser` interface + `LibPhoneNumberParser` | Use case test được; đổi lib dễ |
| Firebase Analytics | `AnalyticsLogger.log(Event)` | Đổi vendor; fake trong test |
| Firebase Remote Config | `ConfigProvider.adsInterval()` | Không rải key string |
| Glide | `ImageView.loadImage()` extension (Satellite2 ✅) | Một chỗ đổi sang Coil |
| BlurView | `setupGlassEffect()` (Satellite2 ✅) | Một chỗ |
| Media3/YouTube player | `VideoPlayer` interface theo nhu cầu màn Watch | Thay player theo loại stream |
- **Đừng truyền boundary type**: `retrofit2.Response<T>`, `com.google.android.gms.maps.model.LatLng`, `com.google.firebase.remoteconfig.FirebaseRemoteConfig`, `android.location.Location`, hay `MutableMap` có thể sửa, qua UseCase/ViewModel public API. Trả `List`/`Map` read-only của Kotlin, hoặc class riêng.
- **Learning tests trên Android**: thêm `src/test/.../LibPhoneNumberLearningTest.kt` kiểm cách lib parse `+84 912 345 678`, số Việt Nam không có `+84`, và số có chữ. Khi bump `libphonenumber = "9.0.27"` lên bản mới, chạy lại để biết hành vi có đổi.
```kotlin
class LibPhoneNumberLearningTest {
    private val util = PhoneNumberUtil.getInstance()
    @Test fun `parses local VN number with default region`() {
        val n = util.parse("0912345678", "VN")
        assertEquals(84, n.countryCode)
        assertTrue(util.isValidNumber(n))
    }
}
```
- **Code chưa tồn tại**: backend chưa có endpoint "nearest cameras"? Định nghĩa `LiveVideoRepository.nearest(coordinates, radiusKm)` (interface mình muốn), làm UI/ViewModel với `FakeLiveVideoRepository`; khi API xong thì viết impl Retrofit (Adapter).

## Key Takeaways
1. Giữ code bên ngoài ở ít chỗ; bọc hoặc dùng Adapter.
2. Không để boundary type lan qua public API.
3. Học thư viện bằng learning tests; giữ chúng làm boundary tests.
4. Với API chưa có, viết interface bạn mong muốn rồi adapt sau.

## Connects To
- **arch-ch17 (Boundaries: Drawing Lines)**, **arch-ch32 (Frameworks are details)**, **code-ch07 (wrap third-party exceptions)**.
