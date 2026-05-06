# Rewarded Ads Policy Checklist

Detailed review criteria for Rewarded Ad implementations in Android.

## Policy Requirements

### Opt-In Requirement
- User must EXPLICITLY choose to watch the ad (voluntary)
- Clearly communicate reward type and amount before watching
- No punishment for declining to watch
- Core functionality must remain accessible without watching ads

### Reward Delivery
- Deliver reward ONLY after ad completion callback fires
- Use server-side verification (SSV) for high-value rewards
- Implement daily/session limits to prevent exploitation

## Code Review Patterns

### VIOLATION: Forced rewarded ad
```kotlin
// BAD - No opt-in, directly showing
fun onLevelComplete() {
    RewardedAd.load(context, adUnitId, adRequest,
        object : RewardedAdLoadCallback() {
            override fun onAdLoaded(ad: RewardedAd) {
                ad.show(activity) { grantReward(it) }
            }
        })
}

// GOOD - User opts in with clear reward info
fun onLevelComplete() {
    showRewardDialog(
        title = "Watch ad for bonus?",
        message = "Watch a short video to earn 100 coins!",
        onAccept = { showRewardedAd() },
        onDecline = { continueToNextLevel() } // No punishment
    )
}
```

### VIOLATION: Reward before completion
```kotlin
// BAD
override fun onAdShowedFullScreenContent() {
    grantReward(100) // WRONG: User hasn't finished
}

// GOOD - Reward ONLY on completion callback
rewardedAd?.show(activity) { rewardItem ->
    grantReward(rewardItem.type, rewardItem.amount)
}
```

### VIOLATION: No preloading
```kotlin
// BAD - Loading when user taps button
fun onWatchAdClicked() {
    RewardedAd.load(context, ...) // User waits
}

// GOOD - Preloaded, button only visible when ready
val isAdReady = MutableLiveData(false)
fun preload(context: Context) {
    RewardedAd.load(context, adUnitId, adRequest,
        object : RewardedAdLoadCallback() {
            override fun onAdLoaded(ad: RewardedAd) {
                rewardedAd = ad
                isAdReady.value = true
            }
        })
}
```

## Checklist Summary

| ID | Check Item | Severity |
|----|-----------|----------|
| RW-01 | User explicitly opts-in | BLOCKER |
| RW-02 | Reward communicated before watching | CRITICAL |
| RW-03 | Reward after completion callback only | BLOCKER |
| RW-04 | Not forced/mandatory | BLOCKER |
| RW-05 | Server-side verification for high-value | WARNING |
| RW-06 | Abuse prevention (limits) | WARNING |
| RW-07 | No punishment for declining | CRITICAL |
| RW-08 | Preloaded before showing prompt | CRITICAL |
