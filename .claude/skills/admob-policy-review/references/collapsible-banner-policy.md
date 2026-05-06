# Collapsible Banner Ads Policy Checklist

Detailed review criteria for Collapsible Banner Ad implementations in Android.

## Policy Requirements

### Behavior Rules
- Banner starts in expanded state, then collapses after a period
- Collapsed state must not obscure any app content
- User must be able to interact with content when banner is collapsed
- Expanded state must have a clear close/collapse mechanism
- No forced re-expansion without user action or new ad load

### Placement Rules
- Same rules as standard banner: top or bottom of screen
- Must reserve space for both expanded AND collapsed states
- No overlap with interactive elements in either state

## Code Review Patterns

### VIOLATION: No space management
```kotlin
// BAD - Not handling expand/collapse size changes
<FrameLayout
    android:id="@+id/adContainer"
    android:layout_height="50dp"> <!-- Only fits collapsed -->
    <com.google.android.gms.ads.AdView />
</FrameLayout>

// GOOD - Dynamic container that adjusts
<FrameLayout
    android:id="@+id/adContainer"
    android:layout_height="wrap_content"
    android:layout_alignParentBottom="true">
    <com.google.android.gms.ads.AdView />
</FrameLayout>
<!-- Content area uses layout_above="@id/adContainer" -->
```

### Implementation Pattern
```kotlin
// Collapsible banner request
val extras = Bundle().apply {
    putString("collapsible", "bottom") // or "top"
}

val adRequest = AdRequest.Builder()
    .addNetworkExtrasBundle(AdMobAdapter::class.java, extras)
    .build()

adView.loadAd(adRequest)
```

## Checklist Summary

| ID | Check Item | Severity |
|----|-----------|----------|
| CB-01 | Collapse/expand behavior correct | CRITICAL |
| CB-02 | Collapsed state doesn't obscure content | CRITICAL |
| CB-03 | User can interact when collapsed | CRITICAL |
| CB-04 | Expanded state has close/collapse button | CRITICAL |
| CB-05 | Auto-collapse timing appropriate | WARNING |
| CB-06 | No forced re-expansion | WARNING |
