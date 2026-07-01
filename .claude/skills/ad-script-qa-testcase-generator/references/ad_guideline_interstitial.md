# Interstitial Ad Guidelines

This document contains reference guidelines and mandatory test case checks for Interstitial Ads.

## 1. General Rules
- Must display full screen.
- Must block user interaction with the app underneath until dismissed.

## 2. Configuration Keys
- `timeDelayShowInter`: If set, the ad must not show unless the specified number of seconds has passed since the last interstitial or app start.
- `isShowNativeAfterInter`: If true, a Native ad must load and display immediately on the screen that appears after closing the interstitial.
- `isPreloadAfterShow`: If true, the next ad must be requested in the background as soon as the current one is shown.

## 3. Interaction
- The Close button (X) must display after a specified duration and must be clickable to dismiss the ad.
