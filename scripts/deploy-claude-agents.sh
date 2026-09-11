#!/usr/bin/env bash
#
# Deploy .claude skills tree to a target project as both .claude and .agents.
#
# Copies the source .claude directory (commands/, skills/, etc.) into
# $TARGET_PATH/.claude and $TARGET_PATH/.agents with identical content.
# Merge-only: overwrites matching files, does not delete extra files in target.
# settings.local.json is excluded by default.
# After deploy, appends .agents/ and .claude/ to the target .gitignore when missing.

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

TARGET_PATH=""
SOURCE_PATH=""
INCLUDE_SETTINGS=0
SKIP_GITIGNORE=0
DRY_RUN=0

usage() {
    cat <<'EOF'
Usage: deploy-claude-agents.sh --target-path <path> [options]
       deploy-claude-agents.sh <path> [options]

Options:
  -t, --target-path <path>   Destination project directory (required)
  -s, --source-path <path>   Source .claude directory (default: repo's .claude next to this script)
      --include-settings     Also copy settings.local.json
      --skip-gitignore       Do not update the target project's .gitignore
      --dry-run              Preview actions without writing files
  -h, --help                 Show this help

Examples:
  ./scripts/deploy-claude-agents.sh --target-path "/home/user/AndroidStudioProjects/MyApp"
  ./scripts/deploy-claude-agents.sh "/home/user/..." --dry-run
  ./scripts/deploy-claude-agents.sh "/home/user/..." --include-settings
  ./scripts/deploy-claude-agents.sh "/home/user/..." --skip-gitignore

Run with no path in a terminal (e.g. double-clicked from a file manager)
and you'll be prompted for the target path interactively.
EOF
}

INTERACTIVE_LAUNCH=0

pause_before_exit() {
    if [[ "$INTERACTIVE_LAUNCH" -eq 1 ]]; then
        echo ""
        read -r -p "Press Enter to close..." _ || true
    fi
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        -t|--target-path)
            TARGET_PATH="$2"
            shift 2
            ;;
        -s|--source-path)
            SOURCE_PATH="$2"
            shift 2
            ;;
        --include-settings)
            INCLUDE_SETTINGS=1
            shift
            ;;
        --skip-gitignore)
            SKIP_GITIGNORE=1
            shift
            ;;
        --dry-run)
            DRY_RUN=1
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        -*)
            echo "Unknown option: $1" >&2
            usage >&2
            exit 1
            ;;
        *)
            if [[ -z "$TARGET_PATH" ]]; then
                TARGET_PATH="$1"
            else
                echo "Unexpected argument: $1" >&2
                usage >&2
                exit 1
            fi
            shift
            ;;
    esac
done

if [[ -z "$TARGET_PATH" ]]; then
    if [[ -t 0 ]]; then
        INTERACTIVE_LAUNCH=1
        trap pause_before_exit EXIT
        echo "Deploy .claude skills to a target project"
        echo ""
        while [[ -z "$TARGET_PATH" ]]; do
            read -r -p "Target project path: " TARGET_PATH
            TARGET_PATH="${TARGET_PATH#"${TARGET_PATH%%[![:space:]]*}"}"
            TARGET_PATH="${TARGET_PATH%"${TARGET_PATH##*[![:space:]]}"}"
            if [[ -z "$TARGET_PATH" ]]; then
                echo "Path cannot be empty." >&2
            fi
        done
        TARGET_PATH="${TARGET_PATH/#\~/$HOME}"
        echo ""
    else
        echo "Error: --target-path is required" >&2
        usage >&2
        exit 1
    fi
fi

if [[ -z "$SOURCE_PATH" ]]; then
    SOURCE_PATH="$(dirname -- "$SCRIPT_DIR")/.claude"
fi

# --- Validate target ---
if [[ ! -d "$TARGET_PATH" ]]; then
    if [[ "$DRY_RUN" -eq 1 ]]; then
        echo "What if: Create directory \"$TARGET_PATH\""
    else
        mkdir -p -- "$TARGET_PATH"
    fi
fi

if [[ ! -d "$TARGET_PATH" && "$DRY_RUN" -eq 0 ]]; then
    echo "Target path does not exist and could not be created: $TARGET_PATH" >&2
    exit 1
fi

# --- Validate source ---
if [[ ! -d "$SOURCE_PATH" ]]; then
    echo "Source path not found: $SOURCE_PATH" >&2
    exit 1
fi

if [[ ! -d "$SOURCE_PATH/skills" ]]; then
    echo "Source path is missing skills/ subdirectory: $SOURCE_PATH" >&2
    exit 1
fi

SOURCE_ROOT="$(cd -- "$SOURCE_PATH" >/dev/null 2>&1 && pwd)"
# Target may not exist yet on a dry run; resolve what we can.
if [[ -d "$TARGET_PATH" ]]; then
    TARGET_ROOT="$(cd -- "$TARGET_PATH" >/dev/null 2>&1 && pwd)"
else
    TARGET_ROOT="$TARGET_PATH"
fi

copy_agent_tree() {
    local dest_root="$1"
    local copied=0
    local skipped=0

    while IFS= read -r -d '' file; do
        local rel_path="${file#"$SOURCE_ROOT"/}"

        if [[ "$INCLUDE_SETTINGS" -eq 0 && "$rel_path" == "settings.local.json" ]]; then
            skipped=$((skipped + 1))
            continue
        fi

        local dest_file="$dest_root/$rel_path"
        local dest_dir
        dest_dir="$(dirname -- "$dest_file")"

        if [[ "$DRY_RUN" -eq 1 ]]; then
            echo "What if: Copy \"$dest_file\"" >&2
        else
            mkdir -p -- "$dest_dir"
            cp -f -- "$file" "$dest_file"
        fi

        copied=$((copied + 1))
    done < <(find "$SOURCE_ROOT" -type f -print0)

    echo "$copied $skipped"
}

is_gitignore_entry_present() {
    local gitignore_path="$1"
    local entry="$2"
    local expected="${entry#/}"
    expected="${expected%/}"

    [[ -f "$gitignore_path" ]] || return 1

    while IFS= read -r line; do
        local pattern="${line%%#*}"
        pattern="$(echo -n "$pattern" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
        [[ -z "$pattern" ]] && continue

        local normalized="${pattern#/}"
        normalized="${normalized%/}"
        if [[ "$normalized" == "$expected" ]]; then
            return 0
        fi
    done < "$gitignore_path"

    return 1
}

update_target_gitignore() {
    local target_root="$1"
    local gitignore_path="$target_root/.gitignore"
    local section_header="# ClaudeSkillCommon deploy (auto-added)"
    local required_entries=(".agents/" ".claude/")
    local missing=()

    for entry in "${required_entries[@]}"; do
        if ! is_gitignore_entry_present "$gitignore_path" "$entry"; then
            missing+=("$entry")
        fi
    done

    if [[ ${#missing[@]} -eq 0 ]]; then
        echo ""
        echo ".gitignore already ignores .agents/ and .claude/."
        return
    fi

    local has_section=0
    if [[ -f "$gitignore_path" ]]; then
        if grep -Fxq "$section_header" "$gitignore_path"; then
            has_section=1
        fi
    fi

    local append_lines=()
    if [[ -f "$gitignore_path" && -s "$gitignore_path" ]]; then
        append_lines+=("")
    fi
    if [[ "$has_section" -eq 0 ]]; then
        append_lines+=("$section_header")
    fi
    append_lines+=("${missing[@]}")

    local action="Append gitignore entries"
    if [[ ! -f "$gitignore_path" ]]; then
        action="Create gitignore"
    fi

    echo ""
    if [[ "$DRY_RUN" -eq 1 ]]; then
        echo "What if: $action on \"$gitignore_path\""
        for line in "${append_lines[@]}"; do
            echo "  + $line"
        done
        return
    fi

    printf '%s\n' "${append_lines[@]}" >> "$gitignore_path"
    joined_missing="$(IFS=', '; echo "${missing[*]}")"
    echo "Updated .gitignore (added: $joined_missing)."
}

DESTINATIONS=("$TARGET_ROOT/.claude" "$TARGET_ROOT/.agents")

echo "Deploy agent skills"
echo "  Source : $SOURCE_ROOT"
echo "  Target : $TARGET_ROOT"
echo "  Include settings.local.json: $([[ "$INCLUDE_SETTINGS" -eq 1 ]] && echo true || echo false)"
echo ""

TOTAL_COPIED=0
TOTAL_SKIPPED=0

for dest in "${DESTINATIONS[@]}"; do
    echo "-> $dest"
    read -r copied skipped <<< "$(copy_agent_tree "$dest")"
    echo "   Copied : $copied"
    echo "   Skipped: $skipped"
    TOTAL_COPIED=$((TOTAL_COPIED + copied))
    TOTAL_SKIPPED=$((TOTAL_SKIPPED + skipped))
done

echo ""
echo "Done. ${#DESTINATIONS[@]} destinations updated ($TOTAL_COPIED files copied, $TOTAL_SKIPPED skipped)."

if [[ "$SKIP_GITIGNORE" -eq 0 ]]; then
    update_target_gitignore "$TARGET_ROOT"
fi
