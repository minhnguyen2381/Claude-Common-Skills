---
name: admob-policy-review
description: This skill performs a comprehensive review of Android AdMob SDK implementation against Google AdMob policies. It checks all ad formats (Banner, Interstitial, Rewarded, Native, App Open, Collapsible Banner) for policy violations that could lead to account suspension, ad serving limitations, or invalid traffic warnings. This skill should be used when the user wants to review AdMob integration code, check for policy compliance issues, or audit ad implementation before publishing to Google Play.
---

# AdMob Policy Review

## Overview

Perform a rigorous review of Android AdMob SDK implementation to identify policy violations
before they lead to account suspension, ad serving limitations, or app removal. Act as a
Google AdMob Policy Expert with deep knowledge of all ad formats, placement rules, consent
requirements, and invalid traffic prevention.

## Workflow

### Step 1: Scan Project for Ad Implementation

Scan the project to identify which ad formats are implemented and gather all ad-related files.

#### Grep Patterns

Use these patterns to find ad-related code:

```
# Banner Ads
AdView|BannerAd|AdSize|BANNER|LARGE_BANNER|MEDIUM_RECTANGLE|FULL_BANNER|LEADERBOARD|ADAPTIVE_BANNER

# Interstitial Ads
InterstitialAd|InterstitialAdLoadCallback|FullScreenContentCallback|interstitial

# Rewarded Ads
RewardedAd|RewardedAdLoadCallback|OnUserEarnedRewardListener|RewardedInterstitialAd

# Native Ads
NativeAd|NativeAdView|NativeAdOptions|UnifiedNativeAd|NativeAdLoader

# App Open Ads
AppOpenAd|AppOpenAdLoadCallback|AppOpenAdManager

# Collapsible Banner
CollapsibleBanner|collapsibleBanner|COLLAPSIBLE

# Consent/UMP
ConsentInformation|ConsentForm|UserMessagingPlatform|UMP|GDPR|consent

# Common SDK
MobileAds|AdRequest|AdError|AdListener|adUnitId|ca-app-pub|loadAd|showAd
```

#### File Patterns to Scan

```
*.kt, *.java, *.xml (layout files), build.gradle*, AndroidManifest.xml
```

### Step 2: Identify Ad Types in Use

Based on scan results, create a summary:

```
Ad Types Detected:
- [ ] Banner Ads
- [ ] Interstitial Ads
- [ ] Rewarded Ads
- [ ] Native Ads
- [ ] App Open Ads
- [ ] Collapsible Banner
```

### Step 3: Load and Apply Checklists

1. Load `references/admob-policy-checklist.md` for the master checklist
2. For each detected ad type, load the corresponding reference file:
   - Banner -> `references/banner-ads-policy.md`
   - Interstitial -> `references/interstitial-ads-policy.md`
   - Rewarded -> `references/rewarded-ads-policy.md`
   - Native -> `references/native-ads-policy.md`
   - App Open -> `references/app-open-ads-policy.md`
   - Collapsible Banner -> `references/collapsible-banner-policy.md`
3. Always load `references/consent-privacy-policy.md` for consent/privacy checks
4. Load `references/common-violations.md` for known anti-patterns

### Step 4: Review Each Ad Implementation

For each detected ad type, evaluate against ALL checklist items in the corresponding
reference file. Check code for:

1. **Ad Placement & UX** - Position, spacing, layout shifts, user flow
2. **Invalid Traffic Prevention** - Test ads, click protection, frequency capping
3. **Ad Loading & Lifecycle** - Preloading, lifecycle awareness, memory management
4. **Consent & Privacy** - GDPR/UMP, COPPA, privacy policy
5. **Format-Specific Rules** - Rules unique to each ad format
6. **SDK Configuration** - Version, initialization, error handling

### Step 5: Classify Findings

Classify each finding by severity:

- **BLOCKER**: Will cause account suspension or ad serving limitation. Must fix immediately.
  Examples: Missing consent, encouraging clicks, ad stacking, showing ads to children without
  proper configuration.
- **CRITICAL**: High risk of policy warning or invalid traffic detection. Should fix before publish.
  Examples: Interstitial on app launch, banner too close to buttons, no frequency capping.
- **WARNING**: Potential policy issue or bad practice that may trigger review. Recommended to fix.
  Examples: No test ads in debug, no ad load error handling, hardcoded ad unit IDs.
- **NITPICK**: Minor optimization or best practice suggestion. Nice to have.
  Examples: SDK version not latest, could improve preloading strategy.
- **POSITIVE**: Good practices worth acknowledging.

### Step 6: Generate Review Report

Structure the output report in Vietnamese with the following format:

---

#### Output Format

```
## AdMob Policy Review Report

**App**: <app_name>
**SDK Version**: <detected_version>
**Ngay review**: <date>

### Loai Ads Su Dung

| Loai Ads | Trang Thai | So File | Risk Level |
|----------|-----------|---------|------------|
| Banner   | Co/Khong  | N       | Cao/TB/Thap|
| ...      |           |         |            |

---

### Diem Tot (Positive)
- [List specific good practices with file references]

### Tong Quan Rui Ro
- [High-level risk assessment]

---

## Van De Nghiem Trong (Blocker/Critical)

### [P-01] <Title> - <Severity>
**Loai Ads**: Banner/Interstitial/...
**File**: `path/to/File.kt:line_number`
**Policy vi pham**: [Which specific Google policy is violated]
**Van de**: [Clear description of what's wrong]
**Tac dong**: [What will happen - suspension, limited serving, etc.]
**De xuat sua**:
```kotlin
// Before (vi pham)
<original code>

// After (compliant)
<fixed code>
```
**Tham chieu policy**: [Link or reference to specific Google policy]

---

## Canh Bao Policy (Warning/Nitpick)

### [W-01] <Title> - <Severity>
**Loai Ads**: Banner/Interstitial/...
**File**: `path/to/File.kt:line_number`
**Hien tai**:
```kotlin
<current code>
```
**De xuat**:
```kotlin
<improved code>
```
**Ly do**: [Why this is risky from policy perspective]

---

## Checklist Results

### Banner Ads
| # | Checklist Item                    | Status | Ghi Chu |
|---|----------------------------------|--------|---------|
| 1 | Placement away from buttons      | Pass/Fail/N-A | ... |
| 2 | Fixed space reserved             | Pass/Fail/N-A | ... |
| ...                                                      |

### Interstitial Ads
[Same format]

### [Other detected ad types]
[Same format]

---

## Consent & Privacy Compliance

| # | Requirement                       | Status | Ghi Chu |
|---|----------------------------------|--------|---------|
| 1 | UMP SDK implemented              | Pass/Fail | ... |
| 2 | Consent before MobileAds.init    | Pass/Fail | ... |
| ...                                                    |

---

## Tong Ket

| Muc Do      | So Luong |
|-------------|----------|
| Blocker     | X        |
| Critical    | X        |
| Warning     | X        |
| Nitpick     | X        |
| Positive    | X        |

**Risk Level Tong The**: [CAO/TRUNG BINH/THAP]
**Danh gia**: [An toan de publish / Can sua truoc khi publish / NGUY HIEM - khong publish]
**Top 3 uu tien sua truoc**:
1. [P-XX] ...
2. [P-XX] ...
3. [P-XX] ...
```

## Review Philosophy

- Focus on POLICY COMPLIANCE first, code quality second
- Every finding must reference the specific Google policy being violated
- Provide concrete code fixes, not just descriptions
- Prioritize by real-world risk of account action (suspension > warning > optimization)
- Consider that Google uses automated scanning - flag patterns that automated systems detect
- Acknowledge good practices to build a complete picture
- When uncertain about a policy interpretation, flag it as WARNING with explanation
