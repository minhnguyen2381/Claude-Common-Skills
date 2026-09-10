#!/usr/bin/env bash
#
# scope-review.sh - Deterministic review scope, file inventory and batch plan.
#
# Usage:
#   scope-review.sh --out <workspace-dir> [<base-ref>]
#
#   <base-ref>  Commit hash / tag / branch. Range reviewed is <base-ref>..HEAD.
#               Omit to review the working tree (staged + unstaged) against HEAD.
#
# Options:
#   --max-files N   Max files per review batch (default 6)
#   --max-lines N   Max changed lines per review batch (default 800)
#
# Writes <workspace-dir>/manifest.md and prints a short plan summary to stdout.
# Exit codes: 0 ok, 2 usage/repo error, 3 nothing to review.

set -euo pipefail

MAX_FILES=${MAX_FILES:-6}
MAX_LINES=${MAX_LINES:-800}
INLINE_FILES=${INLINE_FILES:-3}
INLINE_LINES=${INLINE_LINES:-300}

OUT=""
BASE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --out)        OUT="$2"; shift 2 ;;
    --max-files)  MAX_FILES="$2"; shift 2 ;;
    --max-lines)  MAX_LINES="$2"; shift 2 ;;
    -h|--help)    sed -n '3,20p' "$0"; exit 0 ;;
    -*)           echo "ERROR: unknown option $1" >&2; exit 2 ;;
    *)            BASE="$1"; shift ;;
  esac
done

[ -n "$OUT" ] || { echo "ERROR: --out <workspace-dir> is required" >&2; exit 2; }
git rev-parse --git-dir >/dev/null 2>&1 || { echo "ERROR: not a git repository" >&2; exit 2; }

if [ -n "$BASE" ]; then
  git rev-parse --verify --quiet "${BASE}^{commit}" >/dev/null \
    || { echo "ERROR: base ref '$BASE' does not exist" >&2; exit 2; }
  BASE_SHA=$(git rev-parse --short "${BASE}^{commit}")
  RANGE="${BASE_SHA}..HEAD"
  DIFF_TARGET="${BASE}..HEAD"
  NCOMMITS=$(git rev-list --count "${BASE}..HEAD")
else
  BASE_SHA="HEAD"
  RANGE="HEAD..worktree (uncommitted)"
  DIFF_TARGET="HEAD"
  NCOMMITS=0
fi

REVIEW_GLOBS=('*.kt' '*.java' '*.xml' '*.kts' '*.gradle' '*.pro' '*.toml')

mkdir -p "$OUT"
MANIFEST="$OUT/manifest.md"

# added <TAB> deleted <TAB> path ; binary files come through as "-" and are dropped.
NUMSTAT=$(git diff --numstat --no-renames "$DIFF_TARGET" -- "${REVIEW_GLOBS[@]}" 2>/dev/null | awk -F'\t' '$1 != "-"' || true)

UNTRACKED=""
if [ -z "$BASE" ]; then
  UNTRACKED=$(git ls-files --others --exclude-standard -- "${REVIEW_GLOBS[@]}" || true)
  if [ -n "$UNTRACKED" ]; then
    while IFS= read -r f; do
      [ -n "$f" ] || continue
      n=$(wc -l < "$f" 2>/dev/null | tr -d ' ' || echo 0)
      NUMSTAT="${NUMSTAT}
${n}	0	${f}"
    done <<< "$UNTRACKED"
    NUMSTAT=$(printf '%s\n' "$NUMSTAT" | awk 'NF')
  fi
fi

if [ -z "$NUMSTAT" ]; then
  echo "NOTHING_TO_REVIEW: no Kotlin/Java/XML/Gradle changes in ${RANGE}"
  exit 3
fi

# module <TAB> path <TAB> added <TAB> deleted <TAB> churn, sorted by module then churn desc.
ROWS=$(printf '%s\n' "$NUMSTAT" | awk -F'\t' '
  {
    path = $3
    mod = path
    i = index(path, "/src/")
    if (i > 0) {
      mod = substr(path, 1, i - 1)
    } else {
      n = split(path, seg, "/")
      mod = (n > 1) ? seg[1] "/" seg[2] : "(root)"
    }
    churn = $1 + $2
    printf "%s\t%s\t%d\t%d\t%d\n", mod, path, $1, $2, churn
  }' | sort -t'	' -k1,1 -k5,5nr)

NFILES=$(printf '%s\n' "$ROWS" | wc -l | tr -d ' ')
TOTAL_ADD=$(printf '%s\n' "$ROWS" | awk -F'\t' '{s+=$3} END {print s+0}')
TOTAL_DEL=$(printf '%s\n' "$ROWS" | awk -F'\t' '{s+=$4} END {print s+0}')
TOTAL_CHURN=$((TOTAL_ADD + TOTAL_DEL))
NMODULES=$(printf '%s\n' "$ROWS" | cut -f1 | sort -u | wc -l | tr -d ' ')

# Assign batch ids: new batch on module change, or when file/line budget is exceeded.
BATCHED=$(printf '%s\n' "$ROWS" | awk -F'\t' -v maxf="$MAX_FILES" -v maxl="$MAX_LINES" '
  BEGIN { b = 0; cf = 0; cl = 0; prev = "" }
  {
    if (prev != $1 || cf >= maxf || (cf > 0 && cl + $5 > maxl)) {
      b++; cf = 0; cl = 0; prev = $1
    }
    cf++; cl += $5
    printf "B%d\t%s\t%s\t%d\t%d\t%d\n", b, $1, $2, $3, $4, $5
  }')

NBATCHES=$(printf '%s\n' "$BATCHED" | cut -f1 | sort -u | wc -l | tr -d ' ')

if [ "$NFILES" -le "$INLINE_FILES" ] && [ "$TOTAL_CHURN" -le "$INLINE_LINES" ]; then
  MODE="inline"
  MODE_WHY="${NFILES} file(s) / ${TOTAL_CHURN} changed lines is within the inline budget (<= ${INLINE_FILES} files and <= ${INLINE_LINES} lines)."
else
  MODE="subagent"
  MODE_WHY="${NFILES} file(s) / ${TOTAL_CHURN} changed lines exceeds the inline budget (> ${INLINE_FILES} files or > ${INLINE_LINES} lines); dispatch one reviewer subagent per batch."
fi

{
  echo "# Review Manifest"
  echo
  echo "- range: \`${RANGE}\`"
  echo "- base_sha: \`${BASE_SHA}\`"
  echo "- commits: ${NCOMMITS}"
  echo "- files: ${NFILES}"
  echo "- modules: ${NMODULES}"
  echo "- added_lines: ${TOTAL_ADD}"
  echo "- deleted_lines: ${TOTAL_DEL}"
  echo "- total_churn: ${TOTAL_CHURN}"
  echo "- batches: ${NBATCHES}"
  echo "- mode: ${MODE}"
  echo
  echo "> ${MODE_WHY}"
  echo
  if [ "$NCOMMITS" -gt 0 ]; then
    echo "## Commits"
    echo
    git log --oneline "${BASE}..HEAD" | sed 's/^/- /'
    echo
  fi
  echo "## Batches"
  echo
  printf '%s\n' "$BATCHED" | awk -F'\t' '
    {
      if ($1 != cur) {
        if (cur != "") { printf "\n" }
        cur = $1
        printf "### %s - module `%s`\n\n", $1, $2
        printf "| file | +added | -deleted |\n|---|---|---|\n"
      }
      printf "| `%s` | %d | %d |\n", $3, $4, $5
    }'
  echo
  echo "## Diff commands"
  echo
  echo "Per-file diff (use inside a reviewer subagent, never dump the whole diff into the main context):"
  echo
  echo '```bash'
  if [ -n "$BASE" ]; then
    echo "git diff ${BASE}..HEAD -- <file>"
  else
    echo "git diff HEAD -- <file>   # untracked files: read the file directly"
  fi
  echo '```'
} > "$MANIFEST"

printf '%s\n' "$BATCHED" > "$OUT/batches.tsv"

echo "MODE=${MODE}"
echo "RANGE=${RANGE}"
echo "FILES=${NFILES}"
echo "CHURN=${TOTAL_CHURN}"
echo "BATCHES=${NBATCHES}"
echo "MANIFEST=${MANIFEST}"
echo "BATCHES_TSV=${OUT}/batches.tsv"
