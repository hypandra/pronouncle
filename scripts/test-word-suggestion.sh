#!/bin/bash
# Test the word suggestions API endpoint locally
# Usage: ./scripts/test-word-suggestion.sh <word> [definition] [sentence]

WORD="${1:-petrichor}"
DEFINITION="${2}"
SENTENCE="${3}"
BASE_URL="${BASE_URL:-http://localhost:3000}"

# Build JSON payload
JSON="{\"word\":\"$WORD\""
[ -n "$DEFINITION" ] && JSON="$JSON,\"userDefinition\":\"$DEFINITION\""
[ -n "$SENTENCE" ] && JSON="$JSON,\"userSentence\":\"$SENTENCE\""
JSON="$JSON}"

echo "Testing word: $WORD"
echo "---"

curl -s -X POST "$BASE_URL/api/word-suggestions" \
  -H "Content-Type: application/json" \
  -H "x-debug-user-id: local-dev-user" \
  -d "$JSON" | jq .

echo ""
