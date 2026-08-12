---
name: fix-libads-native-clipped
description: Fixes the LibAds bug where a native ad renders perfectly in a full-width slot but gets clipped as soon as its holder is narrower than the screen — headline or body cut off, CTA button sliced in half, the bottom of the card missing. Happens in dialogs, cards with horizontal margins, bottom sheets, and RecyclerView items. The cause is that LibAds measures the ad template at screen width and converts the result into a layout_constraintDimensionRatio applied to the holder, so a narrower holder gets a proportionally shorter height while the template's real height does not shrink. Use this whenever someone working in an Android project that vendors the LibAds module reports a native ad looking wrong, cropped, squashed, or overflowing in a non-full-width container — including loose phrasings like "quảng cáo native bị cắt", "nút CTA mất chữ", "ad card is cut off in my dialog", or "native looks fine on Home but broken in the exit popup". Also use it when a previous attempt at this fix left the ad showing but with a missing headline, or working only when the show call is wrapped in viewGroupAds.post { }.
---

# Fixing clipped LibAds native ads in narrow holders

## The mechanism

LibAds never measures the ad against the container it will actually live in. Instead:

1. `ConfigAds.calculateLayoutViewSize()` measures the inflated template at
   `displayMetrics.widthPixels` — **always the full screen width**.
2. That measurement becomes a ratio string, `"$measuredWidth:$measuredHeight"`.
3. `NativeUtils` applies it to the holder as `dimensionRatio` with `height = 0`.

Which means the holder's height is:

```
holderHeight = holderWidth × (measuredHeight / screenWidth)
```

When `holderWidth == screenWidth` the two cancel out and the height is exactly right — that is
why full-width slots look flawless. Narrow the holder and the height shrinks *proportionally*,
but the template's real height does not shrink with it:

- icon sizes, paddings, and CTA `paddingVertical` are fixed dp — they are width-independent;
- headline and body have **less** width, so they wrap onto **more** lines and get **taller**.

The height requirement goes up while the allotted height goes down. The overflow is clipped by
`clipChildren` (default `true`), and because the layout stacks top-down what disappears is the
bottom — typically the CTA, sliced through the middle.

**`AdmobNativeAds.showNormal()` is not the culprit.** It is a tempting suspect because it force-fits
`viewAds` with `MATCH_PARENT/MATCH_PARENT`, but the wrong size was already decided two steps
earlier. Patching it wastes time and hides the real bug. Verify the ratio path first.

## Step 1 — Confirm the diagnosis

Package paths vary between projects, so locate by symbol:

```bash
grep -rn "calculateLayoutViewSize\|dimensionRatio = it" --include=*.kt .
```

You are looking for two things:

- a measure call using `displayMetrics.widthPixels` (or `heightPixels` in the landscape branch);
- a `// set ratio view` block in `NativeUtils` that assigns `dimensionRatio` and `height = 0`
  to `viewGroupAds`.

If `NativeUtils` already hands the holder `WRAP_CONTENT` from inside `onAdShow`, the fix is in
place — stop.

Also check the cache key, usually `hashRatio[configName]` in `ConfigAds`. Keying by config name
alone means the ratio computed for the first (possibly full-width) holder gets reused for every
other holder sharing that config. It needs the width in the key.

## Step 2 — Do NOT hand-measure the template

The instinct here is to measure the template yourself against `viewGroupAds.width` and pin the
resulting pixel height onto the holder — something shaped like:

```kotlin
// DO NOT DO THIS
targetView.measure(makeMeasureSpec(holderWidth, EXACTLY), makeMeasureSpec(0, UNSPECIFIED))
params.height = targetView.measuredHeight
```

It compiles, it fixes the clipping, and it **silently breaks the ad**: the native renders with
its icon, body and CTA intact but the **headline missing** — leaving just the little "Ad" badge
floating where the title should be.

### Why hand-measuring destroys the headline

The measurement runs *before the ad is bound*. `showAdsNative` sizes the holder at call time,
but `bindHeadLineView` only fills `ad_headline` later, when the ad load completes. So the
manual `measure()` walks the whole template while every text asset is still **empty**, and it
leaves that empty-state geometry cached in several places at once:

| Cache | Set by | Keyed / scoped by |
|---|---|---|
| `View.mMeasureCache` | every `measure()` call | the (widthSpec, heightSpec) pair |
| `mOldWidthMeasureSpec` / `mOldHeightMeasureSpec` | every `measure()` call | the view |
| `TextView` `StaticLayout` (`mLayout`) | `TextView.onMeasure` | the text width at measure time |
| `ConstraintLayout` solver hierarchy | `ConstraintLayout.onMeasure` | cleared only by `markHierarchyDirty()` |

The later `setText()` does not reliably invalidate all of them. `View.measure()` never clears
`PFLAG_FORCE_LAYOUT` — only `layout()` does — so on a detached, hand-measured tree every parent
still reports `isLayoutRequested() == true`, and `View.requestLayout()` short-circuits:

```java
if (mParent != null && !mParent.isLayoutRequested()) {
    mParent.requestLayout();   // never runs -> ConstraintLayout.markHierarchyDirty() never runs
}
```

The damage lands hardest on a `wrap_content` headline, whose width is *entirely* content-derived.
`layout_native_medium1_icontop_ctabot.xml` is the canonical shape:

```xml
<LinearLayout android:id="@+id/ad_headline_container"
    android:layout_width="wrap_content" ...>          <!-- wraps its children -->
    <TextView ... "Ad" badge, wrap_content ... />
    <TextView android:id="@+id/ad_headline"
        android:layout_width="wrap_content" ... />     <!-- measured empty -> width 0 -->
</LinearLayout>
```

Measured empty, `ad_headline` is 0 wide, so the container wraps down to just the badge — and it
stays that way after the real headline arrives. That is exactly the reported symptom.

### Why `viewGroupAds.post { }` appears to fix it, and why it doesn't

Someone hitting this will discover that wrapping the show call fixes the headline:

```kotlin
viewGroupAds.post { AdsController.getInstance().showLoadedAds(...) }   // band-aid, not a fix
```

It works by **reordering, not by repairing**. `View.post` on a not-yet-attached view queues into
the attach run-queue, which drains *before* the first traversal. When the ad is already
preloaded, `safePreloadAds` invokes `onLoadDone` synchronously, so `setText` lands before the
manual measure ever sees an empty template.

That only holds while the ad is preloaded. On a cold start, a slow network, or a slow fill,
`show()` arrives *after* the first layout pass and the headline disappears again — with `post`
still in place. If you find `post { }` around `showLoadedAds`, treat it as evidence of this bug,
not as a solution: remove it as part of the fix.

## Step 3 — Give the holder back to the framework, once the ad is bound

The framework already knows how to measure a template against its real parent width. The only
thing to get right is *when* to let it.

Keep the ratio as the placeholder frame while the ad loads — restore the original `// set ratio
view` block verbatim, with a comment recording its narrowed role:

```kotlin
//set ratio view
//ratio o day chi lam KHUNG PLACEHOLDER trong luc cho quang cao ve, de holder khong bi sap roi
//nhay chieu cao. Khi ad show that, onAdShow se chuyen holder sang wrap_content.
newRatioView?.let {
    val layoutContainAdsParams =
        viewGroupAds.layoutParams as ConstraintLayout.LayoutParams?
    layoutContainAdsParams?.dimensionRatio = it
    layoutContainAdsParams?.height = 0
    viewGroupAds.layoutParams = layoutContainAdsParams
}
```

Add this helper at the bottom of `NativeUtils.kt`:

```kotlin
/**
 * Bo ratio va cho holder tu co gian theo noi dung that cua quang cao.
 *
 * Truoc day chieu cao holder duoc suy ra tu dimensionRatio tinh o width man hinh, nen khi holder
 * hep hon man hinh (vd native trong dialog) chieu cao bi co lai theo ti le trong khi chieu cao thuc
 * cua template khong doi (icon/padding/CTA la dp co dinh, text con wrap them dong) -> noi dung bi cat.
 *
 * Chi goi SAU KHI ad da bind noi dung va da attach vao holder. Khi do framework se do template theo
 * dung be ngang that cua holder trong layout pass binh thuong. Xoay man hinh / split screen cung tu
 * dung vi wrap_content duoc tinh lai moi lan layout.
 *
 * KHONG tu goi View.measure() len template o day. Template la view song, framework cung do no.
 * Do tay truoc luc quang cao duoc bind se cache lai kich thuoc cua template khi con rong
 * (View.mMeasureCache, mOldWidth/HeightMeasureSpec, StaticLayout cua TextView, ket qua solver cua
 * ConstraintLayout); setText() sau do khong huy sach duoc cac cache nay, khien headline
 * wrap_content ket o width 0 - trieu chung "native hien nhung mat headline".
 */
private fun ViewGroup.applyWrapContentAdsHeight() {
    val params = layoutParams ?: return
    var isChanged = false
    (params as? ConstraintLayout.LayoutParams)?.let { constraintParams ->
        if (constraintParams.dimensionRatio != null) {
            constraintParams.dimensionRatio = null
            isChanged = true
        }
    }
    if (params.height != ViewGroup.LayoutParams.WRAP_CONTENT) {
        params.height = ViewGroup.LayoutParams.WRAP_CONTENT
        isChanged = true
    }
    // chi requestLayout khi thuc su co thay doi, tranh vong lap layout vo han
    if (isChanged) {
        layoutParams = params
    }
}
```

And call it from the **first line of `onAdShow`**, in every `showAds` helper that owns a holder
(`showAdsNative`, `showAdsNativeSplash`, and `showAdsNativeFullScreen` if it sizes its holder):

```kotlin
override fun onAdShow() {
    //den day quang cao da bind noi dung that va da attach vao holder ->
    //bo ratio placeholder, tha cho holder tu co gian theo template
    viewGroupAds.applyWrapContentAdsHeight()
    ...
}
```

Three things worth understanding rather than copying blindly:

- **`onAdShow` is the correct hook, not a timer or a listener.** `AdmobNativeAds.show()` calls
  `populateUnifiedNativeAdView(...)` (which binds headline, body, icon, CTA), then
  `viewGroupAds.addView(nativeAdView)`, and only then `mAdCallback?.onAdShow()`. By that point
  the content is real and the view is attached — the two preconditions the measurement needs.
  Verify that ordering in the project you are patching before relying on it.
- **`as?`, not `as`.** The holder is not always inside a `ConstraintLayout`; a hard cast throws
  when someone drops it into a `LinearLayout`. Clearing `dimensionRatio` is a no-op there,
  setting `WRAP_CONTENT` still works.
- **Rotation and split screen need no extra code.** `WRAP_CONTENT` is re-evaluated on every
  layout pass, so a width change is handled for free. A hand-measured pixel height is *not*,
  which is why that approach also needs a layout-change listener — more machinery, still wrong.

## Step 4 — Stop the ratio cache from poisoning other holders

The ratio is now only the placeholder frame, but a placeholder computed for a full-width holder
and reused in a narrow one still shows a visible jump when the ad lands. In
`ConfigAds.getConfigNative()`, thread the real width through and widen the cache key:

```kotlin
fun getConfigNative(
    context: Context?,
    isLandscape: Boolean = false,
    default: ConfigNative,
    availableWidth: Int? = null,      // optional -> existing callers keep compiling
): ConfigNative {
```

```kotlin
// ratio phu thuoc vao be ngang thuc te cua holder, khong chi rieng configName
val ratioKey = "$configName-$availableWidth-$isLandscape"
ratio = hashRatio[ratioKey]
if (ratio == null) {
    val sizeAds = calculateLayoutViewSize(viewAds, isLandscape, availableWidth)
    ratio = "${sizeAds.first}:${sizeAds.second}"
}
hashRatio[ratioKey] = ratio
```

And in `calculateLayoutViewSize`, rename the existing screen-derived value to `screenWidth` and
let the caller override it — falling back only when the width is genuinely unknown:

```kotlin
//uu tien be ngang thuc te cua holder, chi fallback ve width man hinh khi chua biet
val availableWidth = widthOverride?.takeIf { it > 0 } ?: screenWidth
```

Pass `availableWidth = viewGroupAds.width` from the `getConfigNative` call in `NativeUtils`. It
will often be `0` on the first call (holder not laid out yet) and fall back to screen width —
that is fine and expected. This step is a polish on the placeholder, not the fix; do not let it
tempt you back into measuring the live template.

Leave the other `getConfigNative` callers alone. In `DialogNative` and the preload path in
`CommonUtils` the call only computes `adChoice`, and their `null` width keeps them on a separate
cache key.

## Step 5 — Fix the collapsible branch too

The collapsible template mounts an extra media overlay as a **sibling** of the holder in the
root `ConstraintLayout`, and sizes it against the root instead of the holder. It appears in two
shapes depending on the LibAds vintage — grep for `ad_media_container` or `showCollapsible` and
match whichever you find:

*Shape A — an overlay built inline in `bindMediaView`* (common in recent forks): a `FrameLayout`
with `id = R.id.ad_media_container`, `MATCH_PARENT` width and a `dimensionRatio`, constrained
only `BOTTOM_toTOP_of` the holder. Two edits:

```kotlin
//width = 0 (MATCH_CONSTRAINT) chu khong phai MATCH_PARENT: MATCH_PARENT se bo qua
//rang buoc start/end ben duoi va overlay se rong bang ca rootView
layoutParams = ConstraintLayout.LayoutParams(0, 0).apply {
    dimensionRatio = ratio.toString()
}
```

```kotlin
val constraintSet = ConstraintSet().apply {
    clone(rootView)
    connect(mediaContainer.id, ConstraintSet.BOTTOM, viewGroupAds.id, ConstraintSet.TOP)
    //bam theo be ngang cua holder chu khong phai cua rootView
    connect(mediaContainer.id, ConstraintSet.START, viewGroupAds.id, ConstraintSet.START)
    connect(mediaContainer.id, ConstraintSet.END, viewGroupAds.id, ConstraintSet.END)
}
```

*Shape B — an explicit `AdmobNativeAds.showCollapsible()`* that measures with `MeasureSpec`: it
needs the same two edits, plus measuring against the holder rather than the screen:

```kotlin
val availableWidth =
    if (viewGroupAds.width > 0) viewGroupAds.width else displayMetrics.widthPixels
val widthSpec = View.MeasureSpec.makeMeasureSpec(availableWidth, View.MeasureSpec.EXACTLY)
```

The width change is the one that is silent if you skip it: in ConstraintLayout `MATCH_PARENT`
**ignores** start/end constraints, so the constraint edits would have no effect on their own.
`0` means MATCH_CONSTRAINT, which is what actually honours them.

Note the asymmetry with Step 2: measuring is acceptable here because the overlay is a throwaway
container you construct and own, not the live ad template whose assets get bound later.

## Step 6 — Leave the XML holders alone

Ad holders across the app are typically declared `layout_height="0dp"` with a hardcoded
`layout_constraintDimensionRatio`. It is tempting to strip all of them. Don't — the runtime now
clears `dimensionRatio` and switches to `WRAP_CONTENT` when the ad shows, so those XML values
serve as the placeholder frame while the ad loads. Keeping them is better than removing them: a
holder that collapses to zero and then jumps to full height is a visible layout jank.

The exception is a holder whose declared ratio is wildly different from the real ad height —
there the jump is jarring either way, and matching the placeholder to the expected ad size is
worth doing.

## Step 7 — Verify

```bash
./gradlew :app:assembleDebug
```

Compiling proves nothing about layout. Test these on a device, in this order — cases 1 and 2 are
where regressions hide, and case 2 is the one a `post { }` band-aid passes and a real fix must
also pass:

| # | Case | Expect |
|---|---|---|
| 1 | Native in a dialog / narrow card | Full content, nothing clipped |
| 2 | **Cold start, ad NOT preloaded**, open the screen directly | Headline present, nothing clipped |
| 3 | Ad already preloaded (e.g. Language right after Splash) | Headline present |
| 4 | Native full-width (Home, Language, Onboard) | Unchanged from before |
| 5 | Rotate, then reopen the narrow case | Height recomputed correctly |
| 6 | Collapsible template in a narrow holder | Overlay matches holder width |
| 7 | Ad fails to load | Placeholder holds its place, layout intact |
| 8 | System font scale set to largest | Extra wrapped lines still not clipped |

Cases 2 and 3 must **both** pass. Passing 3 alone is the signature of the reordering band-aid.

Turn on `AdsConstant.isDebug` while testing: the headline is then filled with the space name and
the body with the ad unit id, so "headline missing" is unambiguous rather than a guess about
whether the fill simply had no title asset. Watch `CHECKHASHRATIO` for the placeholder ratio and
`TESTERADSEVENT` for show/bind events:

```bash
adb logcat -s CHECKHASHRATIO TESTERADSEVENT
```

## What this fix does not cover

**Templates with no headline asset.** `bindHeadLineView` returns early when
`nativeAd.headline == null`, while `bindBodyView` in debug mode sets the body unconditionally.
So "body visible, headline absent" has two possible causes: this layout bug, or a fill genuinely
without a headline. Case 2 in the table distinguishes them — a layout bug is deterministic
across reloads, a missing asset is not.

**Holder visibility.** Hiding a slot when a remote-config ad-type flag is switched off is a
different bug with its own gate (`checkConditionShowAds` vs `checkAdsByType`). If the complaint
is "the empty grey box won't go away" rather than "the ad is cut off", that is the other fix.
