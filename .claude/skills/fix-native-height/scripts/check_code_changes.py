#!/usr/bin/env python3
"""
check_code_changes.py - Verify code-level changes for Steps 1-9.

Walks the LibAds source tree to find relevant Kotlin files and checks
each step's required patterns are present (or absent where expected).

Usage:
    python check_code_changes.py <project_root>
"""

import os
import re
import sys

# ─── Helpers ────────────────────────────────────────────────────────────────

def find_file(root: str, target_filename: str) -> str | None:
    """Walk root to find a file matching target_filename (case-insensitive)."""
    target_lower = target_filename.lower()
    for dirpath, _dirs, filenames in os.walk(root):
        for fn in filenames:
            if fn.lower() == target_lower:
                return os.path.join(dirpath, fn)
    return None


def read_file(path: str) -> str:
    """Read a file with UTF-8 encoding."""
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


def has(content: str, pattern: str) -> bool:
    """Check if literal pattern exists in content."""
    return pattern in content


def has_re(content: str, pattern: str) -> bool:
    """Check if regex pattern matches anywhere in content."""
    return bool(re.search(pattern, content))


# ─── Step Checkers ──────────────────────────────────────────────────────────

def check_step1(project_root: str) -> dict:
    """Step 1: applyShrinkOnlyAutoSize in AdmobAds."""
    result = {
        "step": 1,
        "title": "applyShrinkOnlyAutoSize in AdmobAds",
        "file": None,
        "checks": [],
        "passed": False,
    }

    libads = os.path.join(project_root, "LibAds")
    path = find_file(libads, "AdmobAds.kt")
    if not path:
        result["checks"].append(("AdmobAds.kt found", False))
        return result

    result["file"] = path
    content = read_file(path)

    c1 = has(content, "applyShrinkOnlyAutoSize")
    c2 = has(content, "MIN_CTA_TEXT_SIZE_SP")
    result["checks"] = [
        ("applyShrinkOnlyAutoSize method", c1),
        ("MIN_CTA_TEXT_SIZE_SP constant", c2),
    ]

    # Also check ids.xml for cta_original_text_size
    ids_path = find_file(os.path.join(project_root, "LibAds", "src", "main", "res"), "ids.xml")
    if ids_path:
        ids_content = read_file(ids_path)
        c3 = has(ids_content, "cta_original_text_size")
        result["checks"].append(("cta_original_text_size in ids.xml", c3))
    else:
        result["checks"].append(("ids.xml found", False))

    result["passed"] = all(ok for _, ok in result["checks"])
    return result


def check_step2(project_root: str) -> dict:
    """Step 2: Release helpers in AdmobNativeAds."""
    result = {
        "step": 2,
        "title": "Release helpers in AdmobNativeAds",
        "file": None,
        "checks": [],
        "passed": False,
    }

    libads = os.path.join(project_root, "LibAds")
    path = find_file(libads, "AdmobNativeAds.kt")
    if not path:
        result["checks"].append(("AdmobNativeAds.kt found", False))
        return result

    result["file"] = path
    content = read_file(path)

    c1 = has(content, "releaseChildNativeAdViews")
    c2 = has(content, "releaseNativeAdView")
    c3 = has(content, "isDescendantOf")
    result["checks"] = [
        ("releaseChildNativeAdViews", c1),
        ("releaseNativeAdView", c2),
        ("isDescendantOf", c3),
    ]

    result["passed"] = all(ok for _, ok in result["checks"])
    return result


def check_step3(project_root: str) -> dict:
    """Step 3: releaseNativeAdView with keep param near collapsible removal."""
    result = {
        "step": 3,
        "title": "releaseNativeAdView(it, keep) for collapsible",
        "file": None,
        "checks": [],
        "passed": False,
    }

    libads = os.path.join(project_root, "LibAds")
    path = find_file(libads, "AdmobNativeAds.kt")
    if not path:
        result["checks"].append(("AdmobNativeAds.kt found", False))
        return result

    result["file"] = path
    content = read_file(path)

    c1 = has_re(content, r"releaseNativeAdView\s*\(\s*it\s*,\s*keep")
    result["checks"] = [
        ("releaseNativeAdView(it, keep...) call", c1),
    ]

    result["passed"] = all(ok for _, ok in result["checks"])
    return result


def check_step4(project_root: str) -> dict:
    """Step 4: showCollapsible returns Boolean."""
    result = {
        "step": 4,
        "title": "showCollapsible returns Boolean",
        "file": None,
        "checks": [],
        "passed": False,
    }

    libads = os.path.join(project_root, "LibAds")
    path = find_file(libads, "AdmobNativeAds.kt")
    if not path:
        result["checks"].append(("AdmobNativeAds.kt found", False))
        return result

    result["file"] = path
    content = read_file(path)

    # Look for showCollapsible method signature returning Boolean
    c1 = has_re(content, r"fun\s+showCollapsible\b.*\)\s*:\s*Boolean\s*\{")
    # Fallback: also check for ): Boolean { on nearby line
    if not c1:
        c1 = has_re(content, r"showCollapsible[^}]*\):\s*Boolean\s*\{")
    result["checks"] = [
        ("showCollapsible returns Boolean", c1),
    ]

    result["passed"] = all(ok for _, ok in result["checks"])
    return result


def check_step5(project_root: str) -> dict:
    """Step 5: releaseChildNativeAdViews before removeAllViews in showNormal."""
    result = {
        "step": 5,
        "title": "releaseChildNativeAdViews before removeAllViews",
        "file": None,
        "checks": [],
        "passed": False,
    }

    libads = os.path.join(project_root, "LibAds")
    path = find_file(libads, "AdmobNativeAds.kt")
    if not path:
        result["checks"].append(("AdmobNativeAds.kt found", False))
        return result

    result["file"] = path
    content = read_file(path)

    # Find showNormal method block
    show_normal_match = re.search(
        r"fun\s+showNormal\b", content
    )
    if show_normal_match:
        # Extract a reasonable block after the function declaration
        block_start = show_normal_match.start()
        block = content[block_start:block_start + 3000]

        has_release = has(block, "releaseChildNativeAdViews")
        has_remove = has(block, "removeAllViews")

        if has_release and has_remove:
            # Check ordering: release should come before removeAllViews
            pos_release = block.index("releaseChildNativeAdViews")
            pos_remove = block.index("removeAllViews")
            order_ok = pos_release < pos_remove
        else:
            order_ok = False

        result["checks"] = [
            ("releaseChildNativeAdViews in showNormal", has_release),
            ("removeAllViews in showNormal", has_remove),
            ("release called BEFORE removeAllViews", order_ok),
        ]
    else:
        result["checks"] = [
            ("showNormal method found", False),
        ]

    result["passed"] = all(ok for _, ok in result["checks"])
    return result


def check_step6(project_root: str) -> dict:
    """Step 6: Safe ConstraintLayout cast and collapsibleNativeAdView.destroy()."""
    result = {
        "step": 6,
        "title": "Safe ConstraintLayout cast + collapsible destroy",
        "file": None,
        "checks": [],
        "passed": False,
    }

    libads = os.path.join(project_root, "LibAds")
    path = find_file(libads, "AdmobNativeAds.kt")
    if not path:
        result["checks"].append(("AdmobNativeAds.kt found", False))
        return result

    result["file"] = path
    content = read_file(path)

    c1 = has_re(content, r"as\?\s*ConstraintLayout\s*\?\:\s*run")
    c2 = has(content, "collapsibleNativeAdView.destroy()")
    result["checks"] = [
        ("as? ConstraintLayout ?: run", c1),
        ("collapsibleNativeAdView.destroy()", c2),
    ]

    result["passed"] = all(ok for _, ok in result["checks"])
    return result


def check_step7(project_root: str) -> dict:
    """Step 7: Uses applyShrinkOnlyAutoSize, not old setAutoSizeText config."""
    result = {
        "step": 7,
        "title": "applyShrinkOnlyAutoSize in CTA binding",
        "file": None,
        "checks": [],
        "passed": False,
    }

    libads = os.path.join(project_root, "LibAds")

    # Check AdmobNativeAds.kt
    path1 = find_file(libads, "AdmobNativeAds.kt")
    if path1:
        result["file"] = path1
        content1 = read_file(path1)
        c1 = has(content1, "applyShrinkOnlyAutoSize")
        c2_bad = has_re(content1, r"setAutoSizeTextTypeUniformWithConfiguration\s*\(\s*10\s*,\s*40")
        result["checks"].append(("applyShrinkOnlyAutoSize in AdmobNativeAds", c1))
        result["checks"].append(("NO old setAutoSizeText(10,40...) in AdmobNativeAds", not c2_bad))
    else:
        result["checks"].append(("AdmobNativeAds.kt found", False))

    # Check AdmobNativeFullScreenAds.kt
    path2 = find_file(libads, "AdmobNativeFullScreenAds.kt")
    if path2:
        content2 = read_file(path2)
        c3 = has(content2, "applyShrinkOnlyAutoSize")
        c4_bad = has_re(content2, r"setAutoSizeTextTypeUniformWithConfiguration\s*\(\s*10\s*,\s*40")
        result["checks"].append(("applyShrinkOnlyAutoSize in FullScreenAds", c3))
        result["checks"].append(("NO old setAutoSizeText(10,40...) in FullScreenAds", not c4_bad))
    else:
        result["checks"].append(("AdmobNativeFullScreenAds.kt found", False))

    result["passed"] = all(ok for _, ok in result["checks"])
    return result


def check_step8(project_root: str) -> dict:
    """Step 8: getConfigNative has parent:ViewGroup?, no isLandscape:Boolean."""
    result = {
        "step": 8,
        "title": "getConfigNative signature updated",
        "file": None,
        "checks": [],
        "passed": False,
    }

    libads = os.path.join(project_root, "LibAds")
    path = find_file(libads, "ConfigAds.kt")
    if not path:
        result["checks"].append(("ConfigAds.kt found", False))
        return result

    result["file"] = path
    content = read_file(path)

    # Find getConfigNative and check signature
    has_parent = has_re(content, r"getConfigNative[^{]*parent\s*:\s*ViewGroup\?")
    has_landscape_bad = has_re(content, r"getConfigNative[^{]*isLandscape\s*:\s*Boolean")

    result["checks"] = [
        ("parent: ViewGroup? in getConfigNative", has_parent),
        ("NO isLandscape: Boolean in getConfigNative", not has_landscape_bad),
    ]

    result["passed"] = all(ok for _, ok in result["checks"])
    return result


def check_step9(project_root: str) -> dict:
    """Step 9: Height-based logic in NativeUtils, no old ratio block."""
    result = {
        "step": 9,
        "title": "Height-based logic in NativeUtils",
        "file": None,
        "checks": [],
        "passed": False,
    }

    libads = os.path.join(project_root, "LibAds")
    path = find_file(libads, "NativeUtils.kt")
    if not path:
        result["checks"].append(("NativeUtils.kt found", False))
        return result

    result["file"] = path
    content = read_file(path)

    c1 = has(content, "content_view_holder")
    c2 = has_re(content, r"layoutContainAdsParams\??\.\s*height\s*=\s*height")
    # Old ratio block should NOT be present
    c3_bad = has_re(content, r"dimensionRatio\s*=\s*it") and has_re(content, r"height\s*=\s*0\b")

    result["checks"] = [
        ("content_view_holder reference", c1),
        ("layoutContainAdsParams.height = height", c2),
        ("NO old dimensionRatio=it + height=0 block", not c3_bad),
    ]

    result["passed"] = all(ok for _, ok in result["checks"])
    return result


# ─── Main ───────────────────────────────────────────────────────────────────

STEP_CHECKERS = [
    check_step1,
    check_step2,
    check_step3,
    check_step4,
    check_step5,
    check_step6,
    check_step7,
    check_step8,
    check_step9,
]


def main():
    if len(sys.argv) < 2:
        print("Usage: python check_code_changes.py <project_root>")
        sys.exit(1)

    project_root = sys.argv[1]

    if not os.path.isdir(project_root):
        print(f"ERROR: Project root not found: {project_root}")
        sys.exit(1)

    print("=" * 70)
    print("  CODE CHANGES STATUS (Steps 1-9)")
    print("=" * 70)

    total_pass = 0
    total_fail = 0

    for checker in STEP_CHECKERS:
        result = checker(project_root)

        step_num = result["step"]
        title = result["title"]
        file_display = result["file"] if result["file"] else "(not found)"

        print(f"\n[STEP {step_num}] {title}")
        print(f"  File: {file_display}")

        max_label = max((len(label) for label, _ in result["checks"]), default=0)
        for label, ok in result["checks"]:
            status = "FOUND" if ok else "NOT FOUND"
            print(f"  - {label:<{max_label}} : {status}")

        status_str = "PASS" if result["passed"] else "FAIL"
        print(f"  Status: {status_str}")

        if result["passed"]:
            total_pass += 1
        else:
            total_fail += 1

    # Summary
    total = len(STEP_CHECKERS)
    print()
    print("=" * 70)
    print("  SUMMARY")
    print("=" * 70)
    print(f"  Passed : {total_pass}/{total}")
    print(f"  Failed : {total_fail}/{total}")
    print("=" * 70)

    sys.exit(0 if total_fail == 0 else 1)


if __name__ == "__main__":
    main()
