#!/usr/bin/env python3
"""
check_native_layouts.py - Step 10: Audit native XML layouts.

Scans all XML files with 'native' in the filename under LibAds layout
directories. Checks:
  1. android:tag attribute (normal / collapsible / fullscreen)
  2. Fixed height for non-fullscreen layouts
  3. adViewHolder presence

Usage:
    python check_native_layouts.py <project_root>
"""

import os
import sys
import xml.etree.ElementTree as ET

ANDROID_NS = "http://schemas.android.com/apk/res/android"
VALID_TAGS = {"normal", "collapsible", "fullscreen"}

# Files to skip entirely (dialog wrappers, not templates)
SKIP_FILES = {"dialog_native_after_inter.xml"}


def detect_expected_tag(filename: str) -> str:
    """Auto-detect the expected android:tag from the filename."""
    name_lower = filename.lower()
    if "collapsible" in name_lower:
        return "collapsible"
    if "nativefull" in name_lower or "native_full" in name_lower or "native_inter_full" in name_lower:
        return "fullscreen"
    return "normal"


def is_fixed_height(value: str) -> bool:
    """Return True if the height value is a fixed dp value (not wrap/match/0dp)."""
    if not value:
        return False
    bad = {"match_parent", "wrap_content", "0dp", "fill_parent"}
    if value.strip() in bad:
        return False
    # Accept @dimen/... references or literal dp values like "120dp"
    if value.startswith("@dimen/") or value.endswith("dp") or value.endswith("px"):
        return True
    # Accept pure numeric (rare, but valid)
    try:
        float(value.replace("dp", "").replace("px", "").replace("sp", ""))
        return True
    except ValueError:
        pass
    return False


def find_element_by_id(root, target_id):
    """Recursively find an element with the given android:id."""
    for elem in root.iter():
        aid = elem.get(f"{{{ANDROID_NS}}}id", "")
        if target_id in aid:
            return elem
    return None


def audit_file(filepath: str) -> dict:
    """Audit a single native layout XML file."""
    filename = os.path.basename(filepath)
    result = {
        "file": filename,
        "tag": None,
        "expected_tag": detect_expected_tag(filename),
        "tag_ok": False,
        "height": None,
        "height_ok": False,
        "ad_view_holder": False,
        "issues": [],
        "skipped": False,
    }

    if filename in SKIP_FILES or filename.startswith("layout_item_") or filename.startswith("dialog_"):
        result["skipped"] = True
        return result

    try:
        tree = ET.parse(filepath)
        root = tree.getroot()
    except ET.ParseError as e:
        result["issues"].append(f"XML parse error: {e}")
        return result

    # --- Check 1: android:tag ---
    tag_value = root.get(f"{{{ANDROID_NS}}}tag")
    result["tag"] = tag_value

    if tag_value is None:
        result["issues"].append(
            f'MISSING android:tag (expected "{result["expected_tag"]}")'
        )
        result["tag_ok"] = False
    elif tag_value not in VALID_TAGS:
        result["issues"].append(
            f'Invalid android:tag="{tag_value}" (must be one of {VALID_TAGS})'
        )
        result["tag_ok"] = False
    elif tag_value != result["expected_tag"]:
        result["issues"].append(
            f'Tag mismatch: got "{tag_value}", expected "{result["expected_tag"]}"'
        )
        result["tag_ok"] = False
    else:
        result["tag_ok"] = True

    # --- Check 2: Fixed height ---
    root_height = root.get(f"{{{ANDROID_NS}}}layout_height", "")
    result["height"] = root_height if root_height else "(none)"

    is_fullscreen = (tag_value == "fullscreen") or (result["expected_tag"] == "fullscreen")

    if is_fullscreen:
        # For fullscreen layouts, match_parent is expected
        result["height_ok"] = True
    else:
        # Non-fullscreen: root or adViewHolder must have fixed dp height
        if is_fixed_height(root_height):
            result["height_ok"] = True
        else:
            # Check adViewHolder child
            holder = find_element_by_id(root, "adViewHolder")
            if holder is not None:
                holder_height = holder.get(f"{{{ANDROID_NS}}}layout_height", "")
                if is_fixed_height(holder_height):
                    result["height_ok"] = True
                    result["height"] = f"{root_height} (holder: {holder_height})"
                else:
                    result["height_ok"] = False
                    result["issues"].append(
                        f'Height is "{root_height}" (holder: "{holder_height}"), expected fixed dp'
                    )
            else:
                result["height_ok"] = False
                result["issues"].append(
                    f'Height is "{root_height}", expected fixed dp value'
                )

    # --- Check 3: adViewHolder presence ---
    holder = find_element_by_id(root, "adViewHolder")
    result["ad_view_holder"] = holder is not None
    if not result["ad_view_holder"]:
        result["issues"].append("Missing @+id/adViewHolder")

    return result


def find_layout_dirs(libads_res_path: str) -> list:
    """Find all layout directories (layout, layout-land, layout-sw600dp, etc.)."""
    dirs = []
    if not os.path.isdir(libads_res_path):
        return dirs
    for entry in sorted(os.listdir(libads_res_path)):
        if entry.startswith("layout"):
            full = os.path.join(libads_res_path, entry)
            if os.path.isdir(full):
                dirs.append(full)
    return dirs


def find_native_xmls(layout_dir: str) -> list:
    """Find all XML files that contain the 'ad_call_to_action' ID."""
    results = []
    if not os.path.isdir(layout_dir):
        return results
    for f in sorted(os.listdir(layout_dir)):
        if f.endswith(".xml"):
            path = os.path.join(layout_dir, f)
            try:
                with open(path, "r", encoding="utf-8") as file:
                    content = file.read()
                    if "ad_call_to_action" in content:
                        results.append(path)
            except Exception:
                pass
    return results


def main():
    if len(sys.argv) < 2:
        print("Usage: python check_native_layouts.py <project_root>")
        sys.exit(1)

    project_root = sys.argv[1]
    
    res_dirs = []
    for root, dirs, files in os.walk(project_root):
        # Skip build and agent directories
        if ".agents" in root or "build" in root:
            continue
        # Standard Android res directory path
        if root.replace("\\", "/").endswith("src/main/res"):
            res_dirs.append(root)

    if not res_dirs:
        print(f"ERROR: No res directories found under {project_root}")
        sys.exit(1)

    layout_dirs = []
    for res_dir in res_dirs:
        layout_dirs.extend(find_layout_dirs(res_dir))

    if not layout_dirs:
        print(f"ERROR: No layout directories found")
        sys.exit(1)

    total = 0
    passed = 0
    failed = 0
    skipped_count = 0
    all_issues = []

    print("=" * 70)
    print("  NATIVE LAYOUT AUDIT (Step 10)")
    print("=" * 70)

    for layout_dir in layout_dirs:
        native_files = find_native_xmls(layout_dir)
        if not native_files:
            continue

        dir_name = os.path.basename(layout_dir)
        print(f"\nDirectory: {dir_name}/")
        print("-" * 70)

        # Table header
        header = (
            f"| {'#':>3} | {'File':<52} | {'Tag':<12} | {'Expected':<12} "
            f"| {'Tag OK':<6} | {'Height':<22} | {'Ht OK':<5} | {'Holder':<6} |"
        )
        sep = (
            f"|{'---':->5}|{'':-<54}|{'':-<14}|{'':-<14}"
            f"|{'':-<8}|{'':-<24}|{'':-<7}|{'':-<8}|"
        )
        print(header)
        print(sep)

        idx = 0
        for filepath in native_files:
            result = audit_file(filepath)

            if result["skipped"]:
                skipped_count += 1
                idx += 1
                print(
                    f"| {idx:>3} | {result['file']:<52} | {'(skip)':<12} | "
                    f"{'(skip)':<12} | {'SKIP':<6} | {'(dialog wrapper)':<22} "
                    f"| {'SKIP':<5} | {'SKIP':<6} |"
                )
                continue

            total += 1
            idx += 1

            tag_display = result["tag"] if result["tag"] else "(none)"
            tag_ok_str = "OK" if result["tag_ok"] else "FAIL"
            height_display = result["height"][:22] if result["height"] else "(none)"
            ht_ok_str = "OK" if result["height_ok"] else "FAIL"
            holder_str = "YES" if result["ad_view_holder"] else "NO"

            is_pass = result["tag_ok"] and result["height_ok"] and result["ad_view_holder"]
            if is_pass:
                passed += 1
            else:
                failed += 1
                for issue in result["issues"]:
                    all_issues.append(f"{result['file']}: {issue}")

            print(
                f"| {idx:>3} | {result['file']:<52} | {tag_display:<12} | "
                f"{result['expected_tag']:<12} | {tag_ok_str:<6} | "
                f"{height_display:<22} | {ht_ok_str:<5} | {holder_str:<6} |"
            )

    # Issues section
    print()
    print("=" * 70)
    print("  ISSUES")
    print("=" * 70)
    if all_issues:
        for issue in all_issues:
            print(f"  - {issue}")
    else:
        print("  (none)")

    # Summary
    print()
    print("=" * 70)
    print("  SUMMARY")
    print("=" * 70)
    print(f"  Total templates audited : {total}")
    print(f"  Passed                  : {passed}")
    print(f"  Failed                  : {failed}")
    print(f"  Skipped (dialog)        : {skipped_count}")
    print("=" * 70)

    # Exit code: 0 if all pass, 1 if any fail
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
