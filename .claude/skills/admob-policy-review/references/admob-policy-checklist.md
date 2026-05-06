# AdMob Policy Master Checklist

Comprehensive checklist covering all ad formats. Load this file for every review to ensure
complete coverage. Each ad format has a dedicated reference file with detailed criteria.

## Universal Checklist (All Ad Formats)

### A. SDK & Initialization

- [ ] **A-01**: Google Mobile Ads SDK is the latest stable version
- [ ] **A-02**: `MobileAds.initialize()` is called before loading any ads
- [ ] **A-03**: `MobileAds.initialize()` is called only ONCE (typically in Application class)
- [ ] **A-04**: Test ad unit IDs are used in debug/development builds
- [ ] **A-05**: Production ad unit IDs are NOT hardcoded in source code (use BuildConfig, remote config, or encrypted storage)
- [ ] **A-06**: No test ad unit IDs exist in production/release builds

### B. Ad Placement & User Experience

- [ ] **B-01**: Ads do not cover or overlap app content
- [ ] **B-02**: Ads are clearly distinguishable from app content
- [ ] **B-03**: No UI elements that encourage or trick users into clicking ads
- [ ] **B-04**: No text near ads like "Click here", "Support us", "Tap the ad"
- [ ] **B-05**: Ads are not placed too close to interactive elements (buttons, navigation, input fields)
- [ ] **B-06**: App provides genuine value beyond just showing ads
- [ ] **B-07**: Content-to-ad ratio is reasonable (content > ads)
- [ ] **B-08**: Ads do not cause unexpected layout shifts
- [ ] **B-09**: No ad stacking (multiple ads overlapping or showing simultaneously in same viewport)
- [ ] **B-10**: Audio from app is paused when full-screen ads are displayed

### C. Invalid Traffic Prevention

- [ ] **C-01**: No code that programmatically clicks ads
- [ ] **C-02**: No code that incentivizes ad clicks
- [ ] **C-03**: Click debouncing is implemented for buttons near ads
- [ ] **C-04**: Frequency capping is implemented for full-screen ads
- [ ] **C-05**: Ads are not loaded when the screen is off or app is in background
- [ ] **C-06**: No automated ad refresh faster than policy allows
- [ ] **C-07**: Traffic sources are legitimate (no purchased bot traffic)

### D. Consent & Privacy

- [ ] **D-01**: UMP SDK is integrated for GDPR compliance
- [ ] **D-02**: Consent is collected BEFORE initializing MobileAds SDK
- [ ] **D-03**: User can revoke consent (settings/privacy screen)
- [ ] **D-04**: Child-directed treatment tag is set correctly if targeting children
- [ ] **D-05**: Under age of consent tag (TFUA) is used for mixed-audience apps
- [ ] **D-06**: Privacy Policy is accessible and mentions ad data collection
- [ ] **D-07**: CCPA opt-out is handled if targeting US users

### E. Ad Loading & Lifecycle

- [ ] **E-01**: Ads are loaded with proper error handling (onAdFailedToLoad)
- [ ] **E-02**: Failed ad loads have retry logic with exponential backoff
- [ ] **E-03**: Full-screen ads are preloaded before showing
- [ ] **E-04**: Ad references are properly cleaned up (no memory leaks)
- [ ] **E-05**: Ads respect Activity/Fragment lifecycle (no show after destroy)
- [ ] **E-06**: FullScreenContentCallback is implemented for full-screen ads
- [ ] **E-07**: Ad load state is tracked to prevent loading already-loaded ads

### F. Error Handling & Resilience

- [ ] **F-01**: App functions normally when ads fail to load
- [ ] **F-02**: No crash when ad loading returns error
- [ ] **F-03**: Timeout handling for ad requests
- [ ] **F-04**: Graceful degradation when no ad fill available
- [ ] **F-05**: Network state check before loading ads (optional but recommended)

## Per-Format Checklists

### Banner Ads Checklist
Reference: `references/banner-ads-policy.md`

- [ ] **BN-01**: Banner placed at top or bottom of screen edge
- [ ] **BN-02**: Fixed space reserved for banner (no layout shift)
- [ ] **BN-03**: Banner refresh rate >= 60 seconds
- [ ] **BN-04**: Banner not loaded when screen is not visible
- [ ] **BN-05**: Adaptive banner size used (recommended over fixed sizes)
- [ ] **BN-06**: Banner does not overlap scrollable content
- [ ] **BN-07**: Banner container has fixed height matching ad size
- [ ] **BN-08**: Banner is paused/resumed with Activity lifecycle

### Interstitial Ads Checklist
Reference: `references/interstitial-ads-policy.md`

- [ ] **IN-01**: Shown only at natural transition/break points
- [ ] **IN-02**: NOT shown immediately on app launch or splash
- [ ] **IN-03**: NOT shown when user is exiting the app (back press)
- [ ] **IN-04**: NOT shown during or interrupting ongoing user action
- [ ] **IN-05**: Frequency capping implemented (max per session/time)
- [ ] **IN-06**: Preloaded before display (load != show)
- [ ] **IN-07**: Close button is not obscured or delayed excessively
- [ ] **IN-08**: Not shown immediately before or after another ad
- [ ] **IN-09**: User can clearly dismiss the ad
- [ ] **IN-10**: Minimum time interval between interstitials (recommended >= 60s)

### Rewarded Ads Checklist
Reference: `references/rewarded-ads-policy.md`

- [ ] **RW-01**: User explicitly opts-in to watch ad (voluntary)
- [ ] **RW-02**: Reward type and amount communicated before watching
- [ ] **RW-03**: Reward delivered only after ad completion callback
- [ ] **RW-04**: No forced/mandatory ad watching
- [ ] **RW-05**: Server-side verification for high-value rewards (recommended)
- [ ] **RW-06**: Reward cannot be exploited (repeated watching abuse prevention)
- [ ] **RW-07**: User not punished for not watching (no negative consequences)
- [ ] **RW-08**: Preloaded before showing opt-in prompt

### Native Ads Checklist
Reference: `references/native-ads-policy.md`

- [ ] **NT-01**: "Ad" or "Advertisement" badge/label is clearly visible
- [ ] **NT-02**: AdChoices icon is displayed and not obscured
- [ ] **NT-03**: Only designated elements are clickable (headline, CTA, media)
- [ ] **NT-04**: Background/whitespace is NOT clickable
- [ ] **NT-05**: Ad layout uses NativeAdView as root
- [ ] **NT-06**: All required assets are displayed (headline, body, CTA, icon)
- [ ] **NT-07**: Ad design is distinguishable from app content
- [ ] **NT-08**: No fake close buttons overlapping native ad
- [ ] **NT-09**: Media view respects aspect ratio
- [ ] **NT-10**: Click areas are not misleadingly large

### App Open Ads Checklist
Reference: `references/app-open-ads-policy.md`

- [ ] **AO-01**: Shown only when app is foregrounded (cold start or return)
- [ ] **AO-02**: NOT shown on top of other ads
- [ ] **AO-03**: NOT shown immediately before or after another ad
- [ ] **AO-04**: Ad expiration checked (4-hour limit from load time)
- [ ] **AO-05**: Integrated with app lifecycle (Application + LifecycleObserver)
- [ ] **AO-06**: NOT used in Designed for Families apps
- [ ] **AO-07**: Appropriate for app usage pattern (frequent opens)
- [ ] **AO-08**: Loading screen or splash used as natural context
- [ ] **AO-09**: Not showing on every single foreground event (frequency control)

### Collapsible Banner Checklist
Reference: `references/collapsible-banner-policy.md`

- [ ] **CB-01**: Collapse/expand behavior works correctly
- [ ] **CB-02**: Collapsed state does not obscure content
- [ ] **CB-03**: User can interact with content when banner is collapsed
- [ ] **CB-04**: Expanded state has clear close/collapse button
- [ ] **CB-05**: Auto-collapse timing is appropriate
- [ ] **CB-06**: No forced re-expansion without user action
