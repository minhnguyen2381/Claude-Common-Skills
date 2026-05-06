# Interstitial Ads Policy Checklist

Detailed review criteria for Interstitial Ad implementations in Android.
Interstitial ads carry the HIGHEST risk of policy violations due to their intrusive nature.

## Policy Requirements

### Timing & Placement Rules

1. **Natural Transition Points ONLY**: Show interstitials between levels, after task completion,
   at natural pauses. NEVER during active user interaction.

2. **NEVER on App Launch**: Showing an interstitial immediately when the app opens or on the
   splash screen is a BLOCKER violation. Google explicitly prohibits this.

3. **NEVER on Back Press/Exit**: Showing an interstitial when the user presses back or tries
   to exit is a BLOCKER violation.

4. **NEVER During User Action**: Do not interrupt typing, scrolling, reading, or any focused
   user interaction.

5. **Load != Show**: Always preload the ad well in advance. NEVER call load() and immediately
   show() in the same callback chain.

6. **No Sequential Ads**: Do not show an interstitial immediately before or after another ad
   (banner, app open, another interstitial).

### Frequency Requirements

- Implement frequency capping (maximum impressions per user per time period)
- Recommended minimum interval between interstitials: **60 seconds**
- Consider session-based capping (e.g., max 3 per session)
- Google may reduce fill rate or limit serving if frequency is too high

### User Control

- Close button must be clearly visible and functional
- Do not delay or hide the close button beyond what the ad format provides
- User must be able to dismiss the ad and return to the app

## Code Review Patterns

### VIOLATION: Interstitial on app launch

```kotlin
// BAD - Showing interstitial on first activity
class SplashActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        InterstitialAd.load(this, adUnitId, adRequest,
            object : InterstitialAdLoadCallback() {
                override fun onAdLoaded(ad: InterstitialAd) {
                    ad.show(this@SplashActivity) // BLOCKER: Immediate show on launch
                }
            })
    }
}
```

```kotlin
// GOOD - Preload on launch, show at natural transition
class SplashActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Just preload, don't show
        AdManager.preloadInterstitial(this)
        // Navigate to main content
        navigateToMain()
    }
}

// Show at a natural break point
class LevelCompleteActivity : AppCompatActivity() {
    fun onLevelComplete() {
        showResults()
        // Natural transition point - OK to show interstitial
        AdManager.showInterstitialIfReady(this) {
            navigateToNextLevel()
        }
    }
}
```

### VIOLATION: Load and immediately show

```kotlin
// BAD - Loading and showing in same flow
fun showAd() {
    InterstitialAd.load(context, adUnitId, adRequest,
        object : InterstitialAdLoadCallback() {
            override fun onAdLoaded(ad: InterstitialAd) {
                ad.show(activity) // Immediately showing after load
            }
        })
}
```

```kotlin
// GOOD - Separate load and show
class AdManager {
    private var interstitialAd: InterstitialAd? = null

    fun preload(context: Context) {
        InterstitialAd.load(context, adUnitId, adRequest,
            object : InterstitialAdLoadCallback() {
                override fun onAdLoaded(ad: InterstitialAd) {
                    interstitialAd = ad
                    setupFullScreenCallback(ad)
                }
                override fun onAdFailedToLoad(error: LoadAdError) {
                    interstitialAd = null
                    // Retry with backoff
                }
            })
    }

    fun showIfReady(activity: Activity, onDismissed: () -> Unit) {
        val ad = interstitialAd
        if (ad != null) {
            ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                override fun onAdDismissedFullScreenContent() {
                    interstitialAd = null
                    preload(activity) // Preload next ad
                    onDismissed()
                }
                override fun onAdFailedToShowFullScreenContent(error: AdError) {
                    interstitialAd = null
                    onDismissed()
                }
            }
            ad.show(activity)
        } else {
            onDismissed() // Continue flow even if no ad
        }
    }
}
```

### VIOLATION: No frequency capping

```kotlin
// BAD - No frequency control, shows on every screen transition
fun onNavigateToNextScreen() {
    interstitialAd?.show(activity) // Shows EVERY time
    navigateNext()
}
```

```kotlin
// GOOD - Frequency capping with time and count limits
class InterstitialFrequencyManager {
    private var lastShowTime: Long = 0
    private var showCountThisSession: Int = 0

    companion object {
        private const val MIN_INTERVAL_MS = 60_000L // 60 seconds
        private const val MAX_PER_SESSION = 5
    }

    fun canShowAd(): Boolean {
        val now = System.currentTimeMillis()
        val timeSinceLastShow = now - lastShowTime
        return timeSinceLastShow >= MIN_INTERVAL_MS
            && showCountThisSession < MAX_PER_SESSION
    }

    fun onAdShown() {
        lastShowTime = System.currentTimeMillis()
        showCountThisSession++
    }
}
```

### VIOLATION: Interstitial on back press

```kotlin
// BAD - Showing ad when user tries to leave
override fun onBackPressed() {
    interstitialAd?.show(this) // BLOCKER: Ad on exit attempt
    super.onBackPressed()
}
```

```kotlin
// GOOD - Let user leave freely
override fun onBackPressed() {
    // No ad here - user wants to leave
    super.onBackPressed()
}
```

### VIOLATION: Missing FullScreenContentCallback

```kotlin
// BAD - No callback, cannot track ad state
interstitialAd?.show(activity)
navigateNext() // May navigate before ad is dismissed
```

```kotlin
// GOOD - Proper callback handling
interstitialAd?.fullScreenContentCallback = object : FullScreenContentCallback() {
    override fun onAdDismissedFullScreenContent() {
        interstitialAd = null
        preloadNext()
        navigateNext() // Navigate AFTER dismiss
    }
    override fun onAdFailedToShowFullScreenContent(error: AdError) {
        interstitialAd = null
        navigateNext() // Continue even on failure
    }
    override fun onAdShowedFullScreenContent() {
        // Ad is showing, pause app audio if needed
    }
}
interstitialAd?.show(activity)
```

## Checklist Summary

| ID | Check Item | Severity |
|----|-----------|----------|
| IN-01 | Natural transition points only | BLOCKER |
| IN-02 | NOT on app launch/splash | BLOCKER |
| IN-03 | NOT on back press/exit | BLOCKER |
| IN-04 | NOT during user action | CRITICAL |
| IN-05 | Frequency capping implemented | CRITICAL |
| IN-06 | Preloaded before display | CRITICAL |
| IN-07 | Close button not obscured | BLOCKER |
| IN-08 | Not adjacent to other ads | CRITICAL |
| IN-09 | User can dismiss clearly | BLOCKER |
| IN-10 | Min 60s between interstitials | CRITICAL |
