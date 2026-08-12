---
name: fix-native-height
description: >-
  Fixes native ad height and CTA autosize issues in the LibAds module.
  This skill should be used when native ads have incorrect height, CTA text is
  oversized, collapsible native leaks NativeAdView references, or layout templates lack
  proper android:tag and fixed height. Also use when user reports "chieu cao native bi sai",
  "CTA bi to qua", "native collapsible bi leak", or "layout native thieu tag".
---

# Fix Native Ad Height

This skill fixes multiple interrelated native ad height and lifecycle issues in the LibAds module. All changes work together - applying them partially may leave the ad system in an inconsistent state.

**CRITICAL:** The modifications have been organized by file to ensure a clean, step-by-step application. Always complete all modifications within one file before moving to the next.

## Pre-flight: Detect whether this fix has already been applied

Before making any code changes, run the diagnostic script to check the current state:

```bash
python .agents/skills/fix-native-height/scripts/check_native_status.py <project_root>
```

If the script reports all steps as PASSED, the fix is already in place. **Stop here and inform the user that the skill has already been applied successfully.** Running it again would be a no-op at best and could introduce duplicate code at worst.

If any step is FAILED, proceed with applying the fixes to the respective files below.

## 1. File: XML Layouts (Audit)

Run the layout audit script:

```bash
python .agents/skills/fix-native-height/scripts/check_native_layouts.py <project_root>
```

**CRITICAL INSTRUCTION FOR THE AI AGENT:** 
**DO NOT ATTEMPT TO AUTOMATICALLY FIX OR MODIFY ANY XML LAYOUT FILES YOURSELF!** 
If the script reports failed layouts (missing tags or wrap_content height), your ONLY job is to **generate a Markdown report/artifact** detailing which layouts are broken and what they are missing. Present this report to the user and stop. Let the user manually fix the XML files.

The script checks two things for every XML layout file whose name contains "native" in the LibAds module:

### 1.1 - android:tag on root element
Every native layout template must have an `android:tag` attribute on its root element with one of these values: `"normal"`, `"collapsible"`, or `"fullscreen"`.
- If the layout name contains `collapsible` -> expected tag = `"collapsible"`
- If the layout name contains `full` or `nativefull` -> expected tag = `"fullscreen"`
- Otherwise -> expected tag = `"normal"`

### 1.2 - Fixed height on root view and adViewHolder
Every non-fullscreen native layout must have a **fixed height** (e.g. `@dimen/_120dp`) on either the root view or the `adViewHolder` ConstraintLayout. 
Layouts with `match_parent` height are acceptable ONLY for fullscreen templates.

## 2. File: `ids.xml` (LibAds module)

Add `R.id.cta_original_text_size` to `ids.xml` in the LibAds module:

```xml
<item name="cta_original_text_size" type="id"/>
```

## 3. File: `AdmobAds.kt`

Add this extension function and companion constant:

```kotlin
protected fun TextView.applyShrinkOnlyAutoSize() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

    val originalTextSizePx = getTag(R.id.cta_original_text_size) as? Float
        ?: textSize.also { setTag(R.id.cta_original_text_size, it) }

    val maxTextSizePx = originalTextSizePx.toInt()
    val minTextSizePx = TypedValue.applyDimension(
        TypedValue.COMPLEX_UNIT_SP,
        MIN_CTA_TEXT_SIZE_SP,
        resources.displayMetrics
    ).toInt()
    if (maxTextSizePx <= minTextSizePx) return

    setAutoSizeTextTypeUniformWithConfiguration(
        minTextSizePx,
        maxTextSizePx,
        1,
        TypedValue.COMPLEX_UNIT_PX
    )
}

companion object {
    private const val MIN_CTA_TEXT_SIZE_SP = 10f
}
```

## 4. File: `AdmobNativeAds.kt`

This file requires multiple related changes to lifecycle management and sizing. Check and apply all of the following:

### 4.1 Add release helpers
Add these helper methods:

```kotlin
/**
 * Destroy moi NativeAdView cu dang nam trong [this] truoc khi thay bang view moi, de SDK
 * nha tham chieu toi NativeAd cua lan show truoc.
 */
private fun ViewGroup.releaseChildNativeAdViews(keep: View?) {
    for (i in 0 until childCount) {
        releaseNativeAdView(getChildAt(i), keep)
    }
}

/**
 * [keep] la template quang cao duoc tai su dung cho lan show sau nen phai go ra khoi cay view
 * truoc khi destroy [view].
 */
private fun releaseNativeAdView(view: View, keep: View?) {
    if (view !is NativeAdView) return
    if (keep != null && keep.isDescendantOf(view)) {
        (keep.parent as? ViewGroup)?.removeView(keep)
    }
    view.destroy()
}

private fun View.isDescendantOf(root: View): Boolean {
    var current = parent
    while (current is View) {
        if (current === root) return true
        current = current.parent
    }
    return false
}
```

### 4.2 Release collapsible views on removal
In the `show()` method's collapsible removal block, add `releaseNativeAdView(it, keep = viewAds)`:

```kotlin
viewsToRemove.forEach {
    rootView.removeView(it)
    releaseNativeAdView(it, keep = viewAds) // ADD THIS
}
```

### 4.3 Make showCollapsible() return Boolean with fallback
Change `showCollapsible()` return type from `Unit` to `Boolean`. Update the dispatch logic:

```kotlin
val isCollapsible = viewAds.tag == "collapsible" && nativeAds?.mediaContent != null
val shownAsCollapsible = isCollapsible && showCollapsible(
    nativeAd = nativeAds!!,
    viewGroupAds = viewGroupAds,
    viewAds = viewAds,
    adCallback = adCallback
)
if (!shownAsCollapsible) {
    showNormal(
        nativeAd = nativeAds!!,
        viewGroupAds = viewGroupAds,
        viewAds = viewAds
    )
}
```

### 4.4 Release before removeAllViews in showNormal
In `showNormal()`, add `viewGroupAds.releaseChildNativeAdViews(keep = viewAds)` before `removeAllViews()`:

```kotlin
bindNativeAdContent(nativeAd, nativeAdView, viewAds, mediaContainer = null)

viewGroupAds.releaseChildNativeAdViews(keep = viewAds) // ADD THIS
viewGroupAds.removeAllViews()
viewGroupAds.addView(nativeAdView)
```

### 4.5 Fix showCollapsible internals
In `showCollapsible()`:

1. Return false when rootView is null:
```kotlin
val rootView = viewGroupAds.parent as? ConstraintLayout ?: run {
    Log.d(
        "TESTERADSEVENT",
        "show collapsible native failed : parent of viewGroupAds must be ConstraintLayout, fallback to normal native"
    )
    return false
}
```

2. Call bindNativeAdContent after adding collapsibleContainer:
```kotlin
collapsibleNativeAdView.addView(collapsibleContainer)

bindNativeAdContent(
    nativeAd,
    collapsibleNativeAdView,
    viewAds,
    mediaContainer = mediaSection
)
```

3. Destroy and release in buttonClose click:
After removing the collapsible overlay, destroy `collapsibleNativeAdView` after removing it from rootView. Call `viewGroupAds.releaseChildNativeAdViews(keep = viewAds)` before adding the new normal NativeAdView.

### 4.6 Replace CTA autosize in bindCTAView
Replace the old autosize block in `bindCTAView`:

```kotlin
// OLD - REMOVE THIS
if (adView.callToActionView is TextView) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        (adView.callToActionView as TextView).setAutoSizeTextTypeUniformWithConfiguration(
            10, 40, 2, TypedValue.COMPLEX_UNIT_SP
        )
    }
}
```
With:
```kotlin
// NEW
(adView.callToActionView as? TextView)?.applyShrinkOnlyAutoSize()
```

## 5. File: `AdmobNativeFullScreenAds.kt`

### 5.1 Replace CTA autosize in bindCTAView
Replace the old autosize block (same as 4.6):

```kotlin
// NEW
(adView.callToActionView as? TextView)?.applyShrinkOnlyAutoSize()
```

## 6. File: `ConfigAds.kt`

### 6.1 Update ConfigAds.getConfigNative() signature
Remove `isLandscape` and `availableWidth` parameters, add `parent`:

```kotlin
fun getConfigNative(
    context: Context?,
    default: ConfigNative,
    parent: ViewGroup? = null
): ConfigNative {
```

**CRITICAL**: Pass `parent` to ALL `LayoutInflater.inflate()` calls inside the `when` block:
```kotlin
LayoutInflater.from(context).inflate(R.layout.layout_native_xxx, parent, false)
```

### 6.2 Update runCatching block (Remove ctaRatio)
Find the `runCatching` block that applies `ctaRatio` and replace it to read `dimensionRatio` from `adViewHolder`.

**OLD - REMOVE THIS:**
```kotlin
runCatching {
    if (viewAds != null && type == AdDef.ADS_TYPE_ADMOB.NATIVE) {
        val ctaButton = viewAds.findViewById<TextView>(R.id.ad_call_to_action)
        if (ctaRatio != null) {
            val ctaButtonParams = ctaButton?.layoutParams as ConstraintLayout.LayoutParams?
            ctaButtonParams?.dimensionRatio = ctaRatio
            ctaButton?.layoutParams = ctaButtonParams
        }

    }
}
```

**NEW - REPLACE WITH:**
```kotlin
runCatching {
    if (viewAds != null && type == AdDef.ADS_TYPE_ADMOB.NATIVE) {
        val params = viewAds.findViewById<View>(R.id.adViewHolder).layoutParams as? ConstraintLayout.LayoutParams
        ratio = params?.dimensionRatio
        Log.d("CHECKHASHRATIO", "getConfigNative: $ratio")
    }
}
```

## 7. File: `NativeUtils.kt`

### 7.1 Remove ratioView parameter and old ratio logic
Remove any `ratioView` parameter and the old `dimensionRatio` assignment block from functions.

### 7.2 Pass parent to getConfigNative
```kotlin
config.getConfigNative(
    context = context,
    default = ConfigNative(...),
    parent = viewGroupAds,
)
```

### 7.3 Update newViewAds assignment
```kotlin
newViewAds =
    if (configNative.viewAds?.tag == "normal" || configNative.viewAds?.tag == "collapsible") {
        configNative.viewAds
    } else {
        LayoutInflater.from(context).inflate(
            R.layout.layout_native_small_icon_ctaright,
            viewGroupAds,
            false,
        )
    }
```

### 7.4 Replace ratio logic with height-based sizing
Remove the old `layoutContainAdsParams?.dimensionRatio = it` assignment. 

Replace with:
```kotlin
val contentViewHolder = newViewAds?.findViewById<ViewGroup?>(R.id.content_view_holder)
val height = if (contentViewHolder != null) {
    contentViewHolder.layoutParams?.height
} else {
    newViewAds?.findViewById<ViewGroup>(R.id.adViewHolder)?.layoutParams?.height
} ?: ConstraintLayout.LayoutParams.WRAP_CONTENT
Log.d("CHECKHEIGHT", "showAdsNative: $configName $height")
if (height > 0) {
    val layoutContainAdsParams =
        viewGroupAds.layoutParams as? ConstraintLayout.LayoutParams
    layoutContainAdsParams?.height = height
    layoutContainAdsParams?.dimensionRatio = null
    viewGroupAds.layoutParams = layoutContainAdsParams
}
```

### 7.5 Remove ctaRatio and ctaAnimationSpeed
Search for any usage of `config.ctaRatio` and `config.ctaAnimationSpeed` and **remove them completely** from `NativeUtils.kt`.
These configurations are deprecated in NativeUtils.

## 8. All Files Calling `getConfigNative()` or `getNativeConfig()`

You must ensure that at ALL places where `getConfigNative()` (or `getNativeConfig()`) is called throughout the project, the `parent` parameter is passed, and `LayoutInflater.inflate` also receives the `parent` with `attachToRoot = false`.

**Example Pattern to Apply:**
```kotlin
config.getConfigNative(
    context = context,
    parent = viewGroupAds, // BẮT BUỘC TRUYỀN PARENT VÀO ĐÂY
    default = ConfigNative(
        adChoice = AdsConstant.TOP_LEFT,
        viewAds = LayoutInflater.from(context)
            .inflate(giữ_nguyên_layout_hiện_tại, viewGroupAds, false) // BẮT BUỘC TRUYỀN viewGroupAds VÀ false
    )
)
```
Search the entire project for `.getConfigNative(` or `.getNativeConfig(` to apply this rule.

## Verification

After applying all changes, run:

```bash
python .agents/skills/fix-native-height/scripts/check_native_status.py <project_root>
```

All steps should report PASSED. Then build:

```bash
./gradlew :app:assembleDebug
```

Test on device:

| # | Case | Expect |
|---|------|--------|
| 1 | Native in dialog / narrow card | Full content, nothing clipped |
| 2 | Cold start, ad NOT preloaded | Headline present, nothing clipped |
| 3 | Ad already preloaded | Headline present |
| 4 | Native full-width (Home) | Unchanged from before |
| 5 | Collapsible close then show normal | No crash, ad shows correctly |
| 6 | CTA with short text like "OPEN" | Text not oversized |

Watch logcat:
```bash
adb logcat -s CHECKHEIGHT TESTERADSEVENT CHECKHASHRATIO
```
