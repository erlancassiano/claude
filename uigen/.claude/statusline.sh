#!/bin/bash
# Claude Code statusline script
# Displays: model | progress bar | % context | tokens | git branch | project name

INPUT=$(cat)

# Extract fields (try multiple possible field names for robustness)
MODEL=$(echo "$INPUT" | jq -r '.model // ""' 2>/dev/null || echo "")
TOKENS_USED=$(echo "$INPUT" | jq -r '.context_tokens_used // .tokens_used // .input_tokens // 0' 2>/dev/null || echo "0")
CONTEXT_WINDOW=$(echo "$INPUT" | jq -r '.context_window // .max_tokens // .context_window_tokens // 200000' 2>/dev/null || echo "200000")

# Shorten model name: "claude-opus-4-6" -> "opus-4-6"
SHORT_MODEL=$(echo "$MODEL" | sed 's/^claude-//')

# Git branch
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

# Project name: git root name, else current dir name
PROJECT_NAME=$(basename "$(git rev-parse --show-toplevel 2>/dev/null || pwd)")

# Percentage (integer)
if [ "$CONTEXT_WINDOW" -gt 0 ]; then
  PCT=$(awk "BEGIN { printf \"%d\", ($TOKENS_USED / $CONTEXT_WINDOW) * 100 }")
else
  PCT=0
fi
[ "$PCT" -gt 100 ] && PCT=100

# Progress bar (15 chars wide)
BAR_WIDTH=15
FILLED=$(awk "BEGIN { printf \"%d\", ($PCT / 100) * $BAR_WIDTH }")
EMPTY=$(( BAR_WIDTH - FILLED ))
BAR=""
for i in $(seq 1 $FILLED 2>/dev/null); do BAR="${BAR}█"; done
for i in $(seq 1 $EMPTY 2>/dev/null); do BAR="${BAR}░"; done

# Format tokens: 12345 -> "12.3k"
if [ "$TOKENS_USED" -gt 999 ]; then
  TOKEN_STR=$(awk "BEGIN { printf \"%.1fk\", $TOKENS_USED / 1000 }")
else
  TOKEN_STR="${TOKENS_USED}"
fi

# Build output
PARTS=()
[ -n "$SHORT_MODEL" ] && PARTS+=("$SHORT_MODEL")
PARTS+=("[${BAR}] ${PCT}%")
PARTS+=("${TOKEN_STR} tok")
[ -n "$GIT_BRANCH" ] && PARTS+=("$GIT_BRANCH")
[ -n "$PROJECT_NAME" ] && PARTS+=("$PROJECT_NAME")

# Join with separator
OUTPUT=""
for PART in "${PARTS[@]}"; do
  [ -n "$OUTPUT" ] && OUTPUT="${OUTPUT}  │  "
  OUTPUT="${OUTPUT}${PART}"
done

echo "$OUTPUT"
