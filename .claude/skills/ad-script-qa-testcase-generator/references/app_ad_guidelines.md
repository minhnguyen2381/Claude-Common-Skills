# In-App Ad Monetization Guidelines (Master Index)

This document contains reference guidelines for testing in-app ad configurations. 

## 1. General Config Rules
- **`isOn` Flag**: If `isOn` is `false`, the ad MUST NOT be requested or shown. If `true`, the ad should be shown when its trigger condition is met.

## 2. Ad Format Specific Guidelines
When encountering the following ad formats in the script/config, you MUST read the corresponding detailed documentation to generate default test cases:

- **Native Ad**: Read `ad_guideline_native.md`
- **Interstitial Ad**: Read `ad_guideline_interstitial.md`
- **Picture-in-Picture (PiP) Ad**: Read `ad_guideline_pip.md`
- **Squeeze Back (SB) Ad**: Read `ad_guideline_sb.md`
- **Other Formats (Open App, Rewarded, Banner Adaptive)**: Follow standard industry logic (displays at correct location, normal close/reward behavior).

*(Note: Users can edit these reference files to include their specific project or company guidelines.)*
