#!/usr/bin/env bash
#
# ref-section.sh - Print one section of a reference file instead of the whole file.
#
# Usage:
#   ref-section.sh <reference-file> <heading>   # e.g. ref-section.sh do-and-dont.md '## 2.1'
#
# Prints from the first line starting with <heading> up to (not including) the next
# heading at the same level. Exit 1 if the heading is not found.

set -euo pipefail

[ $# -eq 2 ] || { echo "usage: ref-section.sh <file> <heading>" >&2; exit 2; }
FILE="$1"
HEAD="$2"
LEVEL="${HEAD%% *}"   # the leading #'s, e.g. "##"

awk -v h="$HEAD" -v lv="^${LEVEL} " '
  !f && index($0, h) == 1 { f = 1; print; next }
  f && $0 ~ lv { exit }
  f { print }
  END { if (!f) exit 1 }
' "$FILE"
