# Banner Ads Policy Checklist

Detailed review criteria for Banner Ad implementations in Android.

## Policy Requirements

### Placement Rules

1. **Position**: Place banners at the TOP or BOTTOM edge of the screen only.
   Placing banners in the middle of content or overlapping scrollable areas is a violation.

2. **Fixed Space**: Reserve a fixed-height container for the banner BEFORE it loads.
   Layout shifts caused by banner loading trigger accidental clicks and policy warnings.

3. **Separation**: Maintain clear visual separation between the banner and interactive elements.
   Minimum recommended distance: 16dp from any clickable element.

4. **No Overlap**: Banners must not overlap any app content, navigation bars, or system UI.

### Refresh Rate

- Minimum refresh interval: **60 seconds**
- Do NOT refresh banners when the screen is off or app is in background
- AdMob auto-refresh can be configured in the AdMob console; code-level refresh must also
  respect this minimum
- Refreshing too frequently reduces fill rate AND triggers policy review

### Sizing

- **Recommended**: Use `AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize()` for
  responsive sizing across devices
- **Fixed sizes**: `BANNER` (320x50), `LARGE_BANNER` (320x100), `MEDIUM_RECTANGLE` (300x250),
  `FULL_BANNER` (468x60), `LEADERBOARD` (728x90)
- Match container height to the exact ad size to prevent layout shifts

## Code Review Patterns

### VIOLATION: Banner near clickable buttons

```kotlin
// BAD - Banner directly adjacent to a button
<LinearLayout android:orientation="vertical">
    <Button android:id="@+id/nextButton" />
    <com.google.android.gms.ads.AdView
        android:id="@+id/adView" />
</LinearLayout>
```

```kotlin
// GOOD - Banner at bottom with clear separation
<RelativeLayout>
    <ScrollView
        android:layout_above="@id/adContainer">
        <!-- App content -->
    </ScrollView>

    <FrameLayout
        android:id="@+id/adContainer"
        android:layout_alignParentBottom="true"
        android:layout_height="wrap_content">
        <com.google.android.gms.ads.AdView
            android:id="@+id/adView" />
    </FrameLayout>
</RelativeLayout>
```

### VIOLATION: No fixed space reserved

```kotlin
// BAD - Banner loads into wrap_content, causing layout shift
<FrameLayout
    android:layout_height="wrap_content">
    <com.google.android.gms.ads.AdView />
</FrameLayout>
```

```kotlin
// GOOD - Fixed height container matching banner size
<FrameLayout
    android:layout_height="50dp"
    android:background="@color/ad_placeholder">
    <com.google.android.gms.ads.AdView
        android:layout_width="match_parent"
        android:layout_height="50dp" />
</FrameLayout>
```

### VIOLATION: Banner not respecting lifecycle

```kotlin
// BAD - Banner continues loading in background
class MyActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        adView.loadAd(AdRequest.Builder().build())
    }
    // Missing onPause, onResume, onDestroy
}
```

```kotlin
// GOOD - Banner lifecycle properly managed
class MyActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        adView.loadAd(AdRequest.Builder().build())
    }

    override fun onPause() {
        adView.pause()
        super.onPause()
    }

    override fun onResume() {
        super.onResume()
        adView.resume()
    }

    override fun onDestroy() {
        adView.destroy()
        super.onDestroy()
    }
}
```

### VIOLATION: Manual refresh too fast

```kotlin
// BAD - Refreshing every 30 seconds
handler.postDelayed({
    adView.loadAd(AdRequest.Builder().build())
}, 30_000)
```

```kotlin
// GOOD - Minimum 60 second refresh (prefer letting AdMob auto-refresh)
// Best practice: Configure auto-refresh in AdMob console instead of manual refresh
// If manual refresh is needed:
private val AD_REFRESH_INTERVAL = 60_000L // 60 seconds minimum

handler.postDelayed({
    if (isActivityVisible) { // Only refresh when visible
        adView.loadAd(AdRequest.Builder().build())
    }
}, AD_REFRESH_INTERVAL)
```

## Checklist Summary

| ID | Check Item | Severity |
|----|-----------|----------|
| BN-01 | Banner at top/bottom edge | CRITICAL |
| BN-02 | Fixed space reserved | CRITICAL |
| BN-03 | Refresh rate >= 60s | BLOCKER |
| BN-04 | Not loaded when invisible | WARNING |
| BN-05 | Adaptive size used | NITPICK |
| BN-06 | No overlap with scroll content | CRITICAL |
| BN-07 | Container height matches ad | WARNING |
| BN-08 | Lifecycle management (pause/resume/destroy) | CRITICAL |
