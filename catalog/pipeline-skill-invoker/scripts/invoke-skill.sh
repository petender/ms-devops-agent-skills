#!/usr/bin/env bash
#
# invoke-skill.sh - Invoke a DevOps skill using GitHub Models API
#
# Usage:
#   ./invoke-skill.sh --skill SKILL_PATH --task "TASK" [options]
#
# Options:
#   --skill PATH        Path to SKILL.md file (required)
#   --task TASK         Task/question for the AI (required)
#   --input INPUT       Additional input context (optional)
#   --model MODEL       AI model to use (default: gpt-4o-mini)
#   --temperature NUM   Temperature 0.0-2.0 (default: 0.3)
#   --max-tokens NUM    Max response tokens (default: 4096)
#   --output FILE       Save response to file (optional)
#   --token TOKEN       GitHub PAT (default: $GH_MODELS_TOKEN)
#   --verbose           Enable verbose output
#   --help              Show this help message

set -euo pipefail

# Default values
SKILL_PATH=""
TASK=""
INPUT=""
MODEL="gpt-4o-mini"
TEMPERATURE="0.3"
MAX_TOKENS="4096"
OUTPUT_FILE=""
TOKEN="${GH_MODELS_TOKEN:-}"
VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --skill)
      SKILL_PATH="$2"
      shift 2
      ;;
    --task)
      TASK="$2"
      shift 2
      ;;
    --input)
      INPUT="$2"
      shift 2
      ;;
    --model)
      MODEL="$2"
      shift 2
      ;;
    --temperature)
      TEMPERATURE="$2"
      shift 2
      ;;
    --max-tokens)
      MAX_TOKENS="$2"
      shift 2
      ;;
    --output)
      OUTPUT_FILE="$2"
      shift 2
      ;;
    --token)
      TOKEN="$2"
      shift 2
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --help)
      sed -n '2,/^$/p' "$0" | sed 's/^# //' | sed 's/^#//'
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      echo "Use --help for usage information" >&2
      exit 1
      ;;
  esac
done

# Validate required arguments
if [ -z "$SKILL_PATH" ]; then
  echo "Error: --skill is required" >&2
  exit 1
fi

if [ -z "$TASK" ]; then
  echo "Error: --task is required" >&2
  exit 1
fi

if [ ! -f "$SKILL_PATH" ]; then
  echo "Error: Skill file not found: $SKILL_PATH" >&2
  exit 1
fi

if [ -z "$TOKEN" ]; then
  echo "Error: GitHub token not provided. Set GH_MODELS_TOKEN or use --token" >&2
  exit 1
fi

# Check for jq
if ! command -v jq &> /dev/null; then
  echo "Error: jq is required but not installed" >&2
  exit 1
fi

# Verbose output helper
log() {
  if [ "$VERBOSE" = true ]; then
    echo "[INFO] $*" >&2
  fi
}

# Read the skill content
log "Reading skill from: $SKILL_PATH"
SKILL_CONTENT=$(cat "$SKILL_PATH")

# Construct the prompt
PROMPT="You are a DevOps expert with deep knowledge of best practices and automation.

$SKILL_CONTENT

Task: $TASK"

if [ -n "$INPUT" ]; then
  PROMPT="$PROMPT

Input:
$INPUT"
fi

log "Prompt constructed (${#PROMPT} characters)"

# Prepare API request body
REQUEST_BODY=$(jq -n \
  --arg model "$MODEL" \
  --arg system_content "You are a DevOps expert. Always provide accurate, actionable advice." \
  --arg user_content "$PROMPT" \
  --arg temperature "$TEMPERATURE" \
  --arg max_tokens "$MAX_TOKENS" \
  '{
    model: $model,
    messages: [
      {role: "system", content: $system_content},
      {role: "user", content: $user_content}
    ],
    temperature: ($temperature | tonumber),
    max_tokens: ($max_tokens | tonumber)
  }')

# API endpoint
API_URL="https://models.github.com/v1/chat/completions"

# Retry logic
MAX_RETRIES=3
RETRY_DELAY=5
ATTEMPT=1

while [ $ATTEMPT -le $MAX_RETRIES ]; do
  log "Calling GitHub Models API (attempt $ATTEMPT/$MAX_RETRIES)..."
  
  # Make the API call
  HTTP_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$REQUEST_BODY")
  
  # Extract HTTP code and body
  HTTP_CODE=$(echo "$HTTP_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
  RESPONSE_BODY=$(echo "$HTTP_RESPONSE" | sed '/HTTP_CODE:/d')
  
  case $HTTP_CODE in
    200)
      # Success - extract the response
      RESULT=$(echo "$RESPONSE_BODY" | jq -r '.choices[0].message.content')
      
      # Log usage statistics
      if [ "$VERBOSE" = true ]; then
        PROMPT_TOKENS=$(echo "$RESPONSE_BODY" | jq -r '.usage.prompt_tokens')
        COMPLETION_TOKENS=$(echo "$RESPONSE_BODY" | jq -r '.usage.completion_tokens')
        TOTAL_TOKENS=$(echo "$RESPONSE_BODY" | jq -r '.usage.total_tokens')
        log "Tokens used: $TOTAL_TOKENS (prompt: $PROMPT_TOKENS, completion: $COMPLETION_TOKENS)"
      fi
      
      # Output result
      if [ -z "$OUTPUT_FILE" ]; then
        echo "$RESULT"
      else
        echo "$RESULT" > "$OUTPUT_FILE"
        echo "Response saved to: $OUTPUT_FILE" >&2
      fi
      
      exit 0
      ;;
    
    429)
      # Rate limited - retry with backoff
      echo "Warning: Rate limited. Waiting ${RETRY_DELAY}s before retry..." >&2
      sleep $RETRY_DELAY
      RETRY_DELAY=$((RETRY_DELAY * 2))
      ATTEMPT=$((ATTEMPT + 1))
      ;;
    
    401)
      echo "Error: Authentication failed. Check your GitHub token." >&2
      exit 1
      ;;
    
    *)
      echo "Error: API call failed with HTTP $HTTP_CODE" >&2
      echo "$RESPONSE_BODY" | jq . >&2 || echo "$RESPONSE_BODY" >&2
      exit 1
      ;;
  esac
done

echo "Error: Failed after $MAX_RETRIES attempts" >&2
exit 1
