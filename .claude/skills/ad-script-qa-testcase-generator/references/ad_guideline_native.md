# Native Ad & Native Full Screen Guidelines

This document contains reference guidelines and mandatory test case checks for Native Ads.

## 1. General Rules
- Must render cleanly within the app's layout without overlapping other UI elements.
- Must accurately display the "Ad" or "Quảng cáo" label.

## 2. Configuration Keys (JSON/Config)
When receiving configurations for Native Ad (e.g., from JSON), you MUST generate test cases for the following keys:
- `isOn`: Check if the ad is toggled on/off correctly based on the flag.
- `layoutTemplate`: Check if the layout displays the correctly assigned template (e.g., medium3_ctabot).
- **Colors**: Check `ctaGradientListColor` (gradient colors of the CTA button), `textCTAColor` (text color of the CTA), `backGroundColor` (ad background color), `textContentColor` (ad content text color).
- **Layout/Shape**: Check `ctaRatio` (CTA button size ratio) and `ctaConnerRadius` (CTA button border radius).
- **Behaviors**: 
  - `isPreloadAfterShow`: Does it preload the next ad after showing the current one?
  - `isCloseWhenClick`: Does it automatically close the ad when the user clicks on the ad and returns to the app?
  - `isCloseWhenClickCollapsible`: Does it close the ad upon click (if using a collapsible format)?
- **Script description**: Must generate testcases checking the display logic following any additional script descriptions (if available).

## 3. Interaction
- Call-to-Action (CTA) button must be clickable and redirect to the correct destination (Store/Web).
