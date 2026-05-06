# Native Ads Policy Checklist

Detailed review criteria for Native Ad implementations in Android.
Native ads carry HIGH risk due to deceptive design and clickable area violations.

## Policy Requirements

### Ad Identification
- "Ad" or "Advertisement" badge MUST be clearly visible at all times
- AdChoices icon MUST be displayed and not obscured or hidden
- Badge must not blend into background or be too small to read
- No fake close buttons overlapping the native ad

### Clickable Area Rules
- ONLY these elements should be clickable: headline, CTA button, media, icon, URL
- Background whitespace must NOT be clickable
- Click areas must not be misleadingly large
- Entire NativeAdView should NOT be set as clickable

### Design Rules
- Ad must be distinguishable from app content (despite blending with UI style)
- All required assets must be displayed: headline, body, CTA, icon
- Media view must respect aspect ratio
- No deceptive similarity to navigation elements

## Code Review Patterns

### VIOLATION: Missing Ad badge
```kotlin
// BAD - No ad attribution label
<com.google.android.gms.ads.nativead.NativeAdView>
    <TextView android:id="@+id/ad_headline" />
    <ImageView android:id="@+id/ad_icon" />
    <!-- Missing ad_attribution / ad_badge -->
</com.google.android.gms.ads.nativead.NativeAdView>

// GOOD - Clear ad badge
<com.google.android.gms.ads.nativead.NativeAdView>
    <TextView
        android:id="@+id/ad_attribution"
        android:text="Ad"
        android:background="@drawable/ad_badge_bg"
        android:textColor="#FFFFFF"
        android:textSize="10sp"
        android:padding="2dp" />
    <TextView android:id="@+id/ad_headline" />
    <!-- ... other elements -->
</com.google.android.gms.ads.nativead.NativeAdView>
```

### VIOLATION: Entire view clickable
```kotlin
// BAD - Setting the entire NativeAdView as clickable
nativeAdView.setOnClickListener { /* ... */ }
// or making the root view clickable

// GOOD - Only register specific views as clickable
nativeAdView.headlineView = headlineTextView
nativeAdView.callToActionView = ctaButton
nativeAdView.iconView = iconImageView
nativeAdView.mediaView = mediaView
// Let SDK handle click registration on these elements only
nativeAdView.setNativeAd(nativeAd)
```

### VIOLATION: Not using NativeAdView
```kotlin
// BAD - Custom layout without NativeAdView wrapper
<LinearLayout>
    <TextView android:text="@{ad.headline}" />
    <Button android:text="@{ad.callToAction}" />
</LinearLayout>

// GOOD - Must use NativeAdView as root
<com.google.android.gms.ads.nativead.NativeAdView>
    <LinearLayout>
        <TextView android:id="@+id/ad_headline" />
        <com.google.android.gms.ads.nativead.MediaView
            android:id="@+id/ad_media" />
        <Button android:id="@+id/ad_call_to_action" />
    </LinearLayout>
</com.google.android.gms.ads.nativead.NativeAdView>
```

### VIOLATION: Hidden AdChoices
```kotlin
// BAD - AdChoices icon hidden or overlapped
adChoicesView.visibility = View.GONE
// or placing it behind another view
// or making it too small (< 15x15dp)

// GOOD - AdChoices visible and appropriately sized
// AdChoices is automatically rendered by the SDK
// Ensure nothing overlaps the top-right corner of NativeAdView
```

## Checklist Summary

| ID | Check Item | Severity |
|----|-----------|----------|
| NT-01 | Ad badge clearly visible | BLOCKER |
| NT-02 | AdChoices icon displayed | BLOCKER |
| NT-03 | Only designated elements clickable | BLOCKER |
| NT-04 | Background not clickable | CRITICAL |
| NT-05 | NativeAdView as root layout | CRITICAL |
| NT-06 | Required assets displayed | CRITICAL |
| NT-07 | Distinguishable from content | CRITICAL |
| NT-08 | No fake close buttons | BLOCKER |
| NT-09 | Media aspect ratio respected | WARNING |
| NT-10 | Click areas not misleadingly large | CRITICAL |
