# Squeeze Back (SB) / Collapsible Banner Ad Guidelines

This document contains reference guidelines and mandatory test case checks for Squeeze Back (SB) Ads.

## 1. General Rules
- The main app content layout must "squeeze" (resize/scale down or shift) to make room for the ad, rather than being obscured by it.
- Must display as a banner-style ad at the top or bottom of the screen.

## 2. Configuration Keys
- `timeCloseSqueezeBack` (or auto close delay): If configured, the ad must automatically close and the layout must return to normal after that many seconds.
- `isCloseWhenClickCollapsible`: If configured, clicking the ad should close the collapsible banner layout and return the app to normal layout.
