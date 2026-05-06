# Consent & Privacy Policy Checklist

Review criteria for GDPR, COPPA, and privacy compliance in AdMob implementations.
This checklist MUST be applied to EVERY review regardless of ad format.

## GDPR / UMP SDK Requirements

### UMP SDK Integration
- UMP SDK dependency must be present in build.gradle
- `ConsentInformation.requestConsentInfoUpdate()` called before MobileAds init
- `ConsentForm.loadAndShowIfRequired()` used to collect consent
- MobileAds SDK initialized ONLY after consent flow completes
- Consent status checked on every app launch

### User Control
- User can revoke/change consent at any time
- Settings/Privacy screen provides `showPrivacyOptionsForm()` access
- Consent preferences persisted correctly

### Testing
- Debug device IDs configured for testing consent flow
- Geography debug setting used to simulate EU user behavior

## COPPA / Child Safety

### Child-Directed Treatment
- If app targets children (or mixed audience), child-directed tag must be set
- `RequestConfiguration.Builder().setTagForChildDirectedTreatment()` used
- Under age of consent tag (TFUA) set for mixed-audience apps
- Apps in "Designed for Families" cannot use App Open ads
- Personalized ads disabled for child users

## Privacy Policy Requirements

- Privacy Policy accessible from app (Settings or About screen)
- Privacy Policy URL provided in Google Play Console
- Privacy Policy mentions: ad data collection, advertising IDs, third-party networks
- Privacy Policy mentions user rights (opt-out, data deletion)

## Code Review Patterns

### VIOLATION: MobileAds init before consent
```kotlin
// BAD - Init before consent
class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        MobileAds.initialize(this) // No consent first!
    }
}

// GOOD - Consent first, then init
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val params = ConsentRequestParameters.Builder().build()
        consentInformation = UserMessagingPlatform
            .getConsentInformation(this)

        consentInformation.requestConsentInfoUpdate(this, params,
            { // Success
                UserMessagingPlatform.loadAndShowConsentMessageIfRequired(
                    this) { error ->
                    if (consentInformation.canRequestAds()) {
                        initializeMobileAdsSdk()
                    }
                }
            },
            { error -> /* Handle error */ }
        )

        if (consentInformation.canRequestAds()) {
            initializeMobileAdsSdk()
        }
    }

    private fun initializeMobileAdsSdk() {
        MobileAds.initialize(this)
    }
}
```

### VIOLATION: No consent revocation option
```kotlin
// BAD - No way for user to change consent
// Settings screen has no privacy option

// GOOD - Privacy options in settings
class SettingsActivity : AppCompatActivity() {
    fun onPrivacySettingsClicked() {
        UserMessagingPlatform.showPrivacyOptionsForm(this) { error ->
            error?.let { /* Handle error */ }
        }
    }
}
```

### VIOLATION: Missing child-directed tag
```kotlin
// BAD - App targets children but no tag set
MobileAds.initialize(this)

// GOOD - Child-directed treatment configured
val requestConfiguration = RequestConfiguration.Builder()
    .setTagForChildDirectedTreatment(
        RequestConfiguration.TAG_FOR_CHILD_DIRECTED_TREATMENT_TRUE
    )
    .build()
MobileAds.setRequestConfiguration(requestConfiguration)
MobileAds.initialize(this)
```

## Checklist Summary

| ID | Check Item | Severity |
|----|-----------|----------|
| D-01 | UMP SDK integrated | BLOCKER |
| D-02 | Consent before MobileAds init | BLOCKER |
| D-03 | User can revoke consent | CRITICAL |
| D-04 | Child-directed tag (if applicable) | BLOCKER |
| D-05 | TFUA tag for mixed audience | CRITICAL |
| D-06 | Privacy Policy accessible | CRITICAL |
| D-07 | CCPA handling (if US users) | WARNING |
