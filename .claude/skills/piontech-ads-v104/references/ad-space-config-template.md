# Template Cấu Hình Vị Trí Quảng Cáo (AdsSpaceConfig)

Khi thêm một màn hình mới hoặc một luồng quảng cáo mới, bạn phải khai báo các ID và cấu hình của quảng cáo vào file `AdsSpaceConfig.kt`. 

Dưới đây là template chuẩn để tuân thủ quy ước đặt tên (Naming Convention) của Satellite2. Copy template này và điều chỉnh các hậu tố `_CONFIG`, `_SPACE`, `_NATIVE`, `_ADAPTIVE`... tùy theo yêu cầu cụ thể của từng luồng quảng cáo.

```kotlin
// === TEMPLATE: Ads Config cho màn hình Feature Mới ===

// 1. Group config dành cho các trigger cụ thể trên màn hình (Action/Vị trí)
object MyFeatureSearchAds {
    // Bottom config (Dành cho việc quyết định hiển thị banner adaptive hay native)
    const val BOTTOM_CONFIG = "myfeature_search_bottom"

    // Interstitial triggers (Gắn vào các nút bấm chuyển màn hình hoặc kết thúc hành động)
    const val ACTION_CONFIG = "myfeature_search-action"
    const val MORE_CONFIG = "myfeature_search-more"
    const val MAP_CONFIG = "myfeature_search-map"
    const val CONTENT_CONFIG = "myfeature_search-content"
    const val SEARCH_CONFIG = "myfeature_search-search"
    
    // Dialog / Bottom Sheet
    const val DLG_CONFIG = "myfeature_search-dlg"

    // Between config (In-list)
    const val BETWEEN_CONFIG = "myfeature_search_between"
}

// 2. Group config dành cho common Space Names (Mapping với Ad Unit IDs)
object MyFeatureCommonAds {
    const val BOTTOM_NATIVE = "myfeature_1ID_native"
    const val BOTTOM_ADAPTIVE = "myfeature_1ID_adaptive"
    
    const val BETWEEN_NATIVE = "myfeature_between_1ID_native"
    const val DLG_NATIVE = "myfeature_dlg_1ID_native"
}
```

**Lưu ý:**
- `CONFIG`: Thường là tên cấu hình trên Remote Config, quyết định xem ads đó đang Bật/Tắt và là loại hình gì.
- `SPACE`, `_NATIVE`, `_ADAPTIVE`: Thường trỏ đến một ID Unit thực tế (ví dụ như "ca-app-pub-xxx/yyy") cấu hình trong `admob_id.json`.
