# Common AdMob Policy Violations

Known anti-patterns that commonly trigger Google policy enforcement actions.
Use this reference to check for patterns that automated Google systems detect.

## TOP 10 Violations That Cause Account Suspension

### 1. Clicking Your Own Ads
**Risk**: ACCOUNT TERMINATION
- Clicking ads during testing with production ad unit IDs
- Using devices without test mode configured
- Any team member clicking live ads

**Detection**: Google tracks device IDs, IP addresses, click patterns
**Fix**: ALWAYS use test ad unit IDs or configure test devices

### 2. Encouraging Ad Clicks
**Risk**: ACCOUNT SUSPENSION
- Text like "Support us by clicking ads", "Click here"
- Placing ads deceptively to trick clicks
- UI elements that draw attention to ads

**Detection**: Manual review + automated content scanning
**Fix**: Remove all text/UI that draws attention to ads

### 3. Ad Stacking
**Risk**: AD SERVING LIMITED
- Multiple ads visible in same viewport
- App Open ad shown while banner is visible
- Interstitial shown immediately after/before another ad

**Detection**: SDK reports ad visibility and timing
**Fix**: Ensure only one ad format visible at a time, add delay between ads

### 4. Interstitial on App Launch
**Risk**: AD SERVING LIMITED / POLICY WARNING
- Showing interstitial during splash screen
- Showing interstitial before any user interaction
- App Open + Interstitial on first screen

**Detection**: Automated timing analysis of ad impressions
**Fix**: Use App Open ads for launch, interstitials at natural breaks

### 5. Layout Shift / Accidental Clicks
**Risk**: CONFIRMED CLICK ENFORCEMENT
- Banner loads and pushes content, causing accidental tap
- Ads near navigation buttons
- Scrollable content with banner at scroll boundary

**Detection**: High CTR analysis + click position analysis
**Fix**: Reserve ad space, maintain buffer from interactive elements

### 6. Missing Consent (GDPR)
**Risk**: ACCOUNT SUSPENSION (EU)
- No UMP SDK implementation
- Collecting ad data without consent in EU/EEA
- Not providing consent revocation option

**Detection**: Regional compliance audits
**Fix**: Implement UMP SDK before ad initialization

### 7. Test Ads in Production
**Risk**: POLICY WARNING
- Shipping with test ad unit IDs (ca-app-pub-3940256099942544)
- Accidentally using debug configuration in release

**Detection**: Google detects test IDs in production traffic
**Fix**: Use BuildConfig to switch ad unit IDs per build type

### 8. Excessive Ad Density
**Risk**: AD SERVING LIMITED
- More ads than content on screen
- Multiple banners on same screen
- Ads dominating the user experience

**Detection**: Manual app review + automated analysis
**Fix**: Limit to 1 banner per screen, content must be primary focus

### 9. Background Ad Loading
**Risk**: INVALID TRAFFIC WARNING
- Loading/refreshing ads when app is in background
- Loading ads when screen is off
- Generating impressions without user visibility

**Detection**: Visibility and foreground state tracking
**Fix**: Check app lifecycle state before loading/refreshing ads

### 10. Insufficient App Content
**Risk**: APP REJECTION / AD SERVING LIMITED
- App is essentially an "ad shell" with minimal content
- WebView wrapping another site with injected ads
- Auto-generated content with maximum ad density

**Detection**: Manual app review
**Fix**: Ensure app provides genuine value independent of ads

## Code Patterns That Trigger Automated Detection

### Hardcoded Production Ad Unit IDs
```kotlin
// FLAGGED - Production ID visible in source code
private const val AD_UNIT_ID = "ca-app-pub-XXXXXXXXXX/YYYYYYYYYY"

// BETTER - Use BuildConfig
private val AD_UNIT_ID = if (BuildConfig.DEBUG) {
    "ca-app-pub-3940256099942544/XXXXXXXXXX" // Test
} else {
    BuildConfig.AD_UNIT_BANNER // From build config
}
```

### Rapid Sequential Ad Display
```kotlin
// FLAGGED - Two ads shown back-to-back
fun onScreenTransition() {
    interstitialAd?.show(activity)
    // Immediately after...
    showBanner()
}

// SAFE - Delay between ad formats
fun onScreenTransition() {
    interstitialAd?.show(activity)
    interstitialAd?.fullScreenContentCallback = object : FullScreenContentCallback() {
        override fun onAdDismissedFullScreenContent() {
            // Wait before showing any other ad
            handler.postDelayed({ showBanner() }, 2000)
        }
    }
}
```

### No Error Handling on Ad Load
```kotlin
// FLAGGED - Crash risk + no retry = bad UX
InterstitialAd.load(context, adUnitId, adRequest, null)

// SAFE - Full error handling
InterstitialAd.load(context, adUnitId, adRequest,
    object : InterstitialAdLoadCallback() {
        override fun onAdLoaded(ad: InterstitialAd) { /* ... */ }
        override fun onAdFailedToLoad(error: LoadAdError) {
            Log.e(TAG, "Ad failed: ${error.message}")
            retryWithBackoff()
        }
    })
```

## Quick Reference: Severity by Violation Type

| Violation | Consequence | Recovery Time |
|-----------|------------|---------------|
| Clicking own ads | Account termination | Permanent (appeal possible) |
| Encouraging clicks | Account suspension | Weeks to months |
| Missing GDPR consent | Account suspension | Until fixed + review |
| Interstitial on launch | Ad serving limited | Days to weeks |
| Ad stacking | Ad serving limited | Days to weeks |
| Layout shifts | Confirmed Click added | Until placement fixed |
| Excessive density | Ad serving limited | Until fixed + review |
| Background loading | Invalid traffic warning | Days |
| Test ads in production | Policy warning | Until fixed |
