#!/usr/bin/env bash
# PostToolUse hook (Edit|Write): remind Claude to run /ux-review when a UI file changed.
# Claude Code passes the tool call as JSON on stdin; we only need tool_input.file_path.
# Uses grep/sed only (no jq), so it also works in Git Bash on Windows.
# The path is kept JSON-escaped, so it can be embedded in the JSON reply unchanged.
file=$(grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -n 1 | sed 's/^.*:[[:space:]]*"//; s/"$//')
case "$file" in
  *.tsx|*.jsx|*.html|*.css|*.scss)
    printf '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"[UX Feedback] UI file modified: %s - run /ux-review before committing UI changes (see CLAUDE.md)."}}\n' "$file"
    ;;
esac
exit 0
