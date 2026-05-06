# App Open Ads Policy Checklist

Detailed review criteria for App Open Ad implementations in Android.
App Open ads carry HIGH risk due to launch-time abuse and ad stacking violations.

## Policy Requirements

### When to Show
- ONLY when app is foregrounded (cold start or returning from background)
- Integrate with splash/loading screen as natural context
- NOT when user is actively using the app and navigating between screens

### Prohibited Patterns
- Do NOT show on top of other ads (no ad stacking)
- Do NOT show immediately before or after another ad (e.g., interstitial then app open)
- Do NOT use in apps enrolled in "Designed for Families" program
- Do NOT show on every single foreground event (implement frequency control)

### Expiration
- App Open ads expire after 4 HOURS from load time
- MUST check expiration before attempting to show
- Reload expired ads before showing

### Lifecycle Integration
- Implement using Application class + DefaultLifecycleObserver
- Track app state transitions with ProcessLifecycleOwner
- Distinguish between cold starts and warm returns

## Code Review Patterns

### VIOLATION: No expiration check
```kotlin
// BAD - Showing potentially expired ad
class AppOpenAdManager {
    private var appOpenAd: AppOpenAd? = null

    fun showAdIfAvailable(activity: Activity) {
        appOpenAd?.show(activity) // May be expired!
    }
}

// GOOD - Check 4-hour expiration
class AppOpenAdManager {
    private var appOpenAd: AppOpenAd? = null
    private var loadTime: Long = 0

    companion object {
        private const val AD_EXPIRATION_HOURS = 4L
    }

    private fun wasLoadTimeLessThanNHoursAgo(): Boolean {
        val dateDifference = Date().time - loadTime
        val numMilliSecondsPerHour = 3_600_000L
        return dateDifference < numMilliSecondsPerHour * AD_EXPIRATION_HOURS
    }

    fun showAdIfAvailable(activity: Activity) {
        if (appOpenAd != null && wasLoadTimeLessThanNHoursAgo()) {
            appOpenAd?.show(activity)
        } else {
            appOpenAd = null
            loadAd(activity) // Reload expired ad
        }
    }
}
```

### VIOLATION: Showing on every foreground
```kotlin
// BAD - No frequency control
override fun onStart(owner: LifecycleOwner) {
    currentActivity?.let { showAdIfAvailable(it) } // Every time!
}

// GOOD - Frequency control
private var lastShowTime: Long = 0
private val MIN_INTERVAL = 5 * 60 * 1000L // 5 minutes

override fun onStart(owner: LifecycleOwner) {
    val now = System.currentTimeMillis()
    if (now - lastShowTime >= MIN_INTERVAL) {
        currentActivity?.let { showAdIfAvailable(it) }
    }
}

fun onAdShown() { lastShowTime = System.currentTimeMillis() }
```

### VIOLATION: Ad stacking with banner
```kotlin
// BAD - App open shown while banner is visible
fun showAdIfAvailable(activity: Activity) {
    // Banner is already showing on this activity
    appOpenAd?.show(activity) // Stacking violation!
}

// GOOD - Hide banner before showing app open
fun showAdIfAvailable(activity: Activity) {
    if (activity is BannerAdHost) {
        activity.hideBanner()
    }
    appOpenAd?.show(activity)
}
```

### VIOLATION: Missing lifecycle integration
```kotlin
// BAD - Manual tracking without lifecycle awareness
class MainActivity : AppCompatActivity() {
    override fun onResume() {
        super.onResume()
        AppOpenAdManager.showAd(this) // Not reliable
    }
}

// GOOD - Lifecycle-aware with Application class
class MyApplication : Application(), DefaultLifecycleObserver {
    private lateinit var appOpenAdManager: AppOpenAdManager

    override fun onCreate() {
        super.onCreate()
        appOpenAdManager = AppOpenAdManager()
        ProcessLifecycleOwner.get().lifecycle.addObserver(this)
        registerActivityLifecycleCallbacks(activityCallbacks)
    }

    override fun onStart(owner: LifecycleOwner) {
        currentActivity?.let { appOpenAdManager.showAdIfAvailable(it) }
    }
}
```

## Checklist Summary

| ID | Check Item | Severity |
|----|-----------|----------|
| AO-01 | Only on foreground (cold start/return) | BLOCKER |
| AO-02 | Not on top of other ads | BLOCKER |
| AO-03 | Not before/after another ad | CRITICAL |
| AO-04 | 4-hour expiration checked | CRITICAL |
| AO-05 | Lifecycle-aware (Application + Observer) | CRITICAL |
| AO-06 | Not in Designed for Families apps | BLOCKER |
| AO-07 | Appropriate for app usage pattern | WARNING |
| AO-08 | Splash/loading screen context | WARNING |
| AO-09 | Frequency control implemented | CRITICAL |
