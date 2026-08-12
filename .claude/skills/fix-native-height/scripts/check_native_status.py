#!/usr/bin/env python3
"""
check_native_status.py - Master diagnostic for fix-native-height skill.

Check ALL 10 steps of the fix-native-height skill and report PASS/FAIL.
Step 10 (layout audit) runs FIRST to immediately warn if already applied.

Usage:
    python check_native_status.py <project_root>
"""

import os
import re
import sys
import glob
import xml.etree.ElementTree as ET


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def find_libads_dir(project_root):
    """Find the LibAds module source directory under project root."""
    for root, dirs, _files in os.walk(project_root):
        if root.replace("\\", "/").endswith("LibAds/src/main/java"):
            return os.path.abspath(os.path.join(root, "..", "..", ".."))
    # Fallback: direct path
    candidate = os.path.join(project_root, "LibAds")
    if os.path.isdir(os.path.join(candidate, "src", "main", "java")):
        return candidate
    return None


def read_file(path):
    """Read file content as UTF-8, return empty string on failure."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception:
        return ""


def find_kt_file_containing(java_dir, pattern, extension="*.kt"):
    """Walk java_dir and return the first .kt file whose content matches pattern."""
    for root, _dirs, files in os.walk(java_dir):
        for fname in files:
            if not fname.endswith(".kt"):
                continue
            fpath = os.path.join(root, fname)
            content = read_file(fpath)
            if re.search(pattern, content):
                return fpath, content
    return None, ""


def find_file_by_name(start_dir, filename):
    """Find a file by exact name under start_dir."""
    for root, _dirs, files in os.walk(start_dir):
        if filename in files:
            return os.path.join(root, filename)
    return None


# ---------------------------------------------------------------------------
# Step checks
# ---------------------------------------------------------------------------

ANDROID_NS = "http://schemas.android.com/apk/res/android"
VALID_TAGS = {"normal", "collapsible", "fullscreen"}


def check_step0(libads_dir):
    """Step 10 - Native Layout Audit."""
    project_root = os.path.dirname(libads_dir)
    
    xml_files = []
    for root_dir, dirs, files in os.walk(project_root):
        if ".agents" in root_dir or "build" in root_dir:
            continue
        if "src/main/res/layout" in root_dir.replace("\\", "/"):
            for f in files:
                if f.endswith(".xml"):
                    path = os.path.join(root_dir, f)
                    try:
                        with open(path, "r", encoding="utf-8") as file:
                            content = file.read()
                            if "ad_call_to_action" in content:
                                xml_files.append(path)
                    except Exception:
                        pass

    if not xml_files:
        return False, ["No XML files with 'ad_call_to_action' found"]
        
    xml_files = sorted(xml_files)

    issues = []
    all_ok = True
    for xml_path in xml_files:
        fname = os.path.basename(xml_path)
        
        # Skip dialog wrappers and recycler view items which don't follow normal template rules
        if fname.startswith("dialog_") or fname.startswith("layout_item_"):
            continue

        try:
            tree = ET.parse(xml_path)
            root_el = tree.getroot()
        except ET.ParseError as e:
            issues.append(f"  - {fname:<40s}: XML PARSE ERROR ({e})")
            all_ok = False
            continue

        # Check android:tag on root element
        tag_val = root_el.get(f"{{{ANDROID_NS}}}tag", "")
        if tag_val not in VALID_TAGS:
            issues.append(f"  - {fname:<40s}: MISSING TAG (got '{tag_val}', need normal/collapsible/fullscreen)")
            all_ok = False
            continue

        # For non-fullscreen layouts, check fixed height
        if tag_val != "fullscreen":
            has_fixed = _check_fixed_height(root_el)
            if has_fixed:
                issues.append(f"  - {fname:<40s}: OK (tag={tag_val}, fixed height)")
            else:
                issues.append(f"  - {fname:<40s}: MISSING FIXED HEIGHT (tag={tag_val})")
                all_ok = False
        else:
            issues.append(f"  - {fname:<40s}: OK (tag={tag_val}, fullscreen)")

    return all_ok, issues


def _check_fixed_height(root_el):
    """Check if root element or adViewHolder child has a fixed height."""
    bad_heights = {"wrap_content", "0dp", "match_parent"}

    # Check root element height
    root_height = root_el.get(f"{{{ANDROID_NS}}}layout_height", "")
    if root_height and root_height not in bad_heights:
        return True

    # Check for adViewHolder child
    for child in root_el.iter():
        child_id = child.get(f"{{{ANDROID_NS}}}id", "")
        if "adViewHolder" in child_id or "ad_view_holder" in child_id:
            h = child.get(f"{{{ANDROID_NS}}}layout_height", "")
            if h and h not in bad_heights:
                return True

    return False


def check_step1(libads_dir):
    """Step 1 - applyShrinkOnlyAutoSize in AdmobAds."""
    java_dir = os.path.join(libads_dir, "src", "main", "java")
    details = []

    # Find AdmobAds.kt
    admob_ads_path, admob_ads_content = find_kt_file_containing(java_dir, r"class\s+AdmobAds\b")
    if not admob_ads_path:
        return False, ["AdmobAds.kt not found"]

    has_func = "fun TextView.applyShrinkOnlyAutoSize()" in admob_ads_content
    has_const = "MIN_CTA_TEXT_SIZE_SP" in admob_ads_content

    if not has_func:
        details.append("  Missing: fun TextView.applyShrinkOnlyAutoSize()")
    if not has_const:
        details.append("  Missing: MIN_CTA_TEXT_SIZE_SP")

    # Check ids.xml for cta_original_text_size
    ids_xml = find_file_by_name(os.path.join(libads_dir, "src", "main", "res"), "ids.xml")
    has_ids = False
    if ids_xml:
        ids_content = read_file(ids_xml)
        has_ids = "cta_original_text_size" in ids_content
    if not has_ids:
        details.append("  Missing: cta_original_text_size in ids.xml")

    passed = has_func and has_const and has_ids
    return passed, details


def check_step2(libads_dir):
    """Step 2 - Release helpers in AdmobNativeAds."""
    java_dir = os.path.join(libads_dir, "src", "main", "java")
    path, content = find_kt_file_containing(java_dir, r"class\s+AdmobNativeAds\b")
    if not path:
        return False, ["AdmobNativeAds.kt not found"]

    details = []
    c1 = "fun ViewGroup.releaseChildNativeAdViews(" in content
    c2 = "fun releaseNativeAdView(" in content
    c3 = "fun View.isDescendantOf(" in content

    if not c1:
        details.append("  Missing: fun ViewGroup.releaseChildNativeAdViews(")
    if not c2:
        details.append("  Missing: fun releaseNativeAdView(")
    if not c3:
        details.append("  Missing: fun View.isDescendantOf(")

    return c1 and c2 and c3, details


def check_step3(libads_dir):
    """Step 3 - Collapsible release on removal."""
    java_dir = os.path.join(libads_dir, "src", "main", "java")
    path, content = find_kt_file_containing(java_dir, r"class\s+AdmobNativeAds\b")
    if not path:
        return False, ["AdmobNativeAds.kt not found"]

    # Look for releaseNativeAdView near rootView.removeView in collapsible block
    has_release = bool(re.search(r"releaseNativeAdView\(it,\s*keep", content))
    has_remove = "rootView.removeView(it)" in content

    details = []
    if not has_release:
        details.append("  Missing: releaseNativeAdView(it, keep... near collapsible removal")
    if not has_remove:
        details.append("  Missing: rootView.removeView(it)")

    return has_release and has_remove, details


def check_step4(libads_dir):
    """Step 4 - showCollapsible returns Boolean."""
    java_dir = os.path.join(libads_dir, "src", "main", "java")
    path, content = find_kt_file_containing(java_dir, r"class\s+AdmobNativeAds\b")
    if not path:
        return False, ["AdmobNativeAds.kt not found"]

    details = []
    # Check showCollapsible signature has : Boolean
    has_bool_sig = bool(re.search(r"fun\s+showCollapsible\b[^)]*\)\s*:\s*Boolean", content))
    # Check shownAsCollapsible usage
    has_shown_var = "shownAsCollapsible" in content

    if not has_bool_sig:
        details.append("  Missing: showCollapsible returning Boolean")
    if not has_shown_var:
        details.append("  Missing: shownAsCollapsible variable")

    return has_bool_sig and has_shown_var, details


def check_step5(libads_dir):
    """Step 5 - Release before removeAllViews in showNormal."""
    java_dir = os.path.join(libads_dir, "src", "main", "java")
    path, content = find_kt_file_containing(java_dir, r"class\s+AdmobNativeAds\b")
    if not path:
        return False, ["AdmobNativeAds.kt not found"]

    details = []
    # Find showNormal method region and check order
    show_normal_match = re.search(r"fun\s+showNormal\b", content)
    if not show_normal_match:
        return False, ["  Missing: showNormal method"]

    # Get content after showNormal declaration
    after_show_normal = content[show_normal_match.start():]
    pos_release = after_show_normal.find("releaseChildNativeAdViews")
    pos_remove = after_show_normal.find("removeAllViews")

    if pos_release < 0:
        details.append("  Missing: releaseChildNativeAdViews in showNormal")
        return False, details
    if pos_remove < 0:
        details.append("  Missing: removeAllViews in showNormal")
        return False, details

    if pos_release > pos_remove:
        details.append("  releaseChildNativeAdViews appears AFTER removeAllViews (should be before)")
        return False, details

    return True, details


def check_step6(libads_dir):
    """Step 6 - showCollapsible internals."""
    java_dir = os.path.join(libads_dir, "src", "main", "java")
    path, content = find_kt_file_containing(java_dir, r"class\s+AdmobNativeAds\b")
    if not path:
        return False, ["AdmobNativeAds.kt not found"]

    details = []
    # 6.1: as? ConstraintLayout ?: run
    has_cast = bool(re.search(r"as\?\s*ConstraintLayout\s*\?:\s*run", content))
    # 6.3: collapsibleNativeAdView.destroy()
    has_destroy = "collapsibleNativeAdView.destroy()" in content

    if not has_cast:
        details.append("  Missing: as? ConstraintLayout ?: run (6.1 null guard)")
    if not has_destroy:
        details.append("  Missing: collapsibleNativeAdView.destroy() (6.3)")

    return has_cast and has_destroy, details


def check_step7(libads_dir):
    """Step 7 - CTA autosize replaced."""
    java_dir = os.path.join(libads_dir, "src", "main", "java")
    details = []
    all_ok = True

    # Check AdmobNativeAds.kt
    path_native, content_native = find_kt_file_containing(java_dir, r"class\s+AdmobNativeAds\b")
    if path_native:
        has_new = "applyShrinkOnlyAutoSize()" in content_native
        has_old = "setAutoSizeTextTypeUniformWithConfiguration(10, 40, 2," in content_native
        if not has_new:
            details.append("  AdmobNativeAds.kt: Missing applyShrinkOnlyAutoSize()")
            all_ok = False
        if has_old:
            details.append("  AdmobNativeAds.kt: Still has old setAutoSizeTextTypeUniformWithConfiguration(10, 40, 2,...")
            all_ok = False
    else:
        details.append("  AdmobNativeAds.kt not found")
        all_ok = False

    # Check AdmobNativeFullScreenAds.kt
    path_fs, content_fs = find_kt_file_containing(java_dir, r"class\s+AdmobNativeFullScreenAds\b")
    if path_fs:
        has_new_fs = "applyShrinkOnlyAutoSize()" in content_fs
        has_old_fs = "setAutoSizeTextTypeUniformWithConfiguration(10, 40, 2," in content_fs
        if not has_new_fs:
            details.append("  AdmobNativeFullScreenAds.kt: Missing applyShrinkOnlyAutoSize()")
            all_ok = False
        if has_old_fs:
            details.append("  AdmobNativeFullScreenAds.kt: Still has old setAutoSizeTextTypeUniformWithConfiguration(10, 40, 2,...")
            all_ok = False
    else:
        details.append("  AdmobNativeFullScreenAds.kt not found")
        all_ok = False

    return all_ok, details


def check_step8(libads_dir):
    """Step 8 - ConfigAds.getConfigNative updated."""
    java_dir = os.path.join(libads_dir, "src", "main", "java")
    details = []

    # Find file containing getConfigNative
    path, content = find_kt_file_containing(java_dir, r"fun\s+getConfigNative\b")
    if not path:
        return False, ["  getConfigNative method not found in any .kt file"]

    # Extract signature
    sig_match = re.search(r"fun\s+getConfigNative\s*\([^)]*\)", content)
    if not sig_match:
        return False, ["  Could not parse getConfigNative signature"]

    sig = sig_match.group(0)

    has_landscape = "isLandscape" in sig
    has_parent = "parent: ViewGroup?" in sig or "parent : ViewGroup?" in sig

    all_ok = True
    if has_landscape:
        details.append("  Still has isLandscape parameter (should be removed)")
        all_ok = False
    if not has_parent:
        details.append("  Missing: parent: ViewGroup? parameter")
        all_ok = False

    return all_ok, details


def check_step9(libads_dir):
    """Step 9 - NativeUtils height-based."""
    java_dir = os.path.join(libads_dir, "src", "main", "java")
    path = find_file_by_name(java_dir, "NativeUtils.kt")
    if not path:
        return False, ["  NativeUtils.kt not found"]

    content = read_file(path)
    details = []
    all_ok = True

    has_content_holder = "content_view_holder" in content or "R.id.content_view_holder" in content
    has_height_logic = bool(re.search(r"layoutContainAdsParams\?\.height\s*=\s*height", content))
    has_old_ratio = bool(re.search(r"layoutContainAdsParams\?\.dimensionRatio\s*=\s*it", content))
    has_old_zero = bool(re.search(r"height\s*=\s*0\b", content)) and has_old_ratio

    if not has_content_holder:
        details.append("  Missing: content_view_holder reference")
        all_ok = False
    if not has_height_logic:
        details.append("  Missing: layoutContainAdsParams?.height = height")
        all_ok = False
    if has_old_ratio:
        details.append("  Still has old ratio logic: layoutContainAdsParams?.dimensionRatio = it")
        all_ok = False

    return all_ok, details


def check_step10(libads_dir):
    """Step 10 - Remove ctaRatio and ctaAnimationSpeed from NativeUtils."""
    java_dir = os.path.join(libads_dir, "src", "main", "java")
    path = find_file_by_name(java_dir, "NativeUtils.kt")
    if not path:
        return False, ["  NativeUtils.kt not found"]

    content = read_file(path)
    details = []
    all_ok = True

    has_cta_ratio = "config.ctaRatio" in content
    has_cta_anim_speed = "config.ctaAnimationSpeed" in content

    if has_cta_ratio:
        details.append("  Still has config.ctaRatio usage")
        all_ok = False
    if has_cta_anim_speed:
        details.append("  Still has config.ctaAnimationSpeed usage")
        all_ok = False

    return all_ok, details


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    if len(sys.argv) < 2:
        print("Usage: python check_native_status.py <project_root>")
        sys.exit(1)

    project_root = os.path.abspath(sys.argv[1])
    if not os.path.isdir(project_root):
        print(f"ERROR: Project root not found: {project_root}")
        sys.exit(1)

    libads_dir = find_libads_dir(project_root)
    if not libads_dir:
        print(f"ERROR: LibAds module not found under {project_root}")
        sys.exit(1)

    print()
    print("=== FIX-NATIVE-HEIGHT STATUS CHECK ===")
    print()

    # Define steps in display order: Step 0 first, then 1-10
    steps = [
        (0, "Native Layout Audit",       check_step0),
        (1,  "applyShrinkOnlyAutoSize",   check_step1),
        (2,  "Release helpers",           check_step2),
        (3,  "Collapsible release",       check_step3),
        (4,  "showCollapsible Boolean",   check_step4),
        (5,  "Release in showNormal",     check_step5),
        (6,  "showCollapsible internals", check_step6),
        (7,  "CTA autosize replaced",     check_step7),
        (8,  "ConfigAds updated",         check_step8),
        (9,  "NativeUtils height-based",  check_step9),
        (10, "Remove cta configs",        check_step10),
    ]

    passed_count = 0
    failed_count = 0
    results = []

    for step_num, label, check_fn in steps:
        try:
            ok, details = check_fn(libads_dir)
        except Exception as e:
            ok = False
            details = [f"  ERROR: {e}"]

        status = "PASS" if ok else "FAIL"
        if ok:
            passed_count += 1
        else:
            failed_count += 1

        tag = f"[STEP {step_num:<2d}]"
        print(f"{tag} {label:<30s}: {status}")
        for d in details:
            print(d)

        results.append((step_num, label, ok))

    print()
    print("=== SUMMARY ===")
    print(f"Passed: {passed_count}/11")
    print(f"Failed: {failed_count}/11")

    if passed_count == 11:
        print()
        print("!" * 60)
        print("!  WARNING: ALL STEPS ALREADY APPLIED                     !")
        print("!  This skill has been successfully applied.               !")
        print("!  Running it again is unnecessary.                        !")
        print("!" * 60)

    print()
    sys.exit(0 if passed_count == 11 else 1)


if __name__ == "__main__":
    main()
