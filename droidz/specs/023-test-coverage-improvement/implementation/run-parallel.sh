#!/bin/bash
# Parallel Implementation Execution
# Uses Droid Exec with bounded concurrency

set -e

SPEC_DIR="droidz/specs/023-test-coverage-improvement"
PROMPTS_DIR="$SPEC_DIR/implementation/prompts"
CONFIG_FILE="droidz/config.yml"

echo "🚀 Starting parallel implementation..."
echo "📋 Processing 10 task groups concurrently"
echo ""

# Load Factory API key from config.yml or environment
if [ -f "$CONFIG_FILE" ]; then
  echo "📄 Loading configuration from $CONFIG_FILE"
  
  # Extract API key from YAML (simple grep approach)
  API_KEY=$(grep "^factory_api_key:" "$CONFIG_FILE" | sed 's/factory_api_key:[[:space:]]*//' | tr -d '"' | tr -d "'")
  
  # Extract optional settings
  AUTONOMY=$(grep "^default_autonomy_level:" "$CONFIG_FILE" | sed 's/default_autonomy_level:[[:space:]]*//' | tr -d '"' | tr -d "'" || echo "high")
  MAX_PARALLEL=$(grep "^max_parallel_executions:" "$CONFIG_FILE" | sed 's/max_parallel_executions:[[:space:]]*//' || echo "4")
  
  # Use config file API key if set, otherwise fall back to env var
  if [ -n "$API_KEY" ]; then
    export FACTORY_API_KEY="$API_KEY"
    echo "✅ Using API key from config.yml"
  fi
else
  # Use defaults if no config file
  AUTONOMY="high"
  MAX_PARALLEL="4"
fi

# Check that we have an API key from either source
if [ -z "$FACTORY_API_KEY" ]; then
  echo "❌ Error: No Factory API key found"
  echo ""
  echo "Option 1 (Recommended): Add to config file"
  echo "   1. Copy droidz/config.yml.template to droidz/config.yml"
  echo "   2. Get your key from: https://app.factory.ai/settings/api-keys"
  echo "   3. Add to config.yml: factory_api_key: \"fk-...\""
  echo ""
  echo "Option 2: Use environment variable"
  echo "   export FACTORY_API_KEY=fk-..."
  echo ""
  exit 1
fi

echo "⚙️  Autonomy level: $AUTONOMY"
echo "🔢 Max parallel: $MAX_PARALLEL"
echo ""

# List all prompts to be executed
echo "📝 Task groups to execute:"
for f in "$PROMPTS_DIR"/*.md; do
  echo "   - $(basename "$f")"
done
echo ""

# Function to run a single prompt
run_prompt() {
  local PROMPT_FILE="$1"
  local BASENAME=$(basename "$PROMPT_FILE")
  echo "▶️  Starting: $BASENAME"
  droid exec --auto "$AUTONOMY" -f "$PROMPT_FILE" 2>&1 | sed "s/^/[$BASENAME] /"
  local EXIT_CODE=$?
  if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Completed: $BASENAME"
  else
    echo "❌ Failed: $BASENAME (exit code: $EXIT_CODE)"
  fi
  return $EXIT_CODE
}

export -f run_prompt
export AUTONOMY

# Run prompts in parallel using background jobs with job control
RUNNING=0
PIDS=()

for PROMPT_FILE in "$PROMPTS_DIR"/*.md; do
  # Wait if we've hit max parallel
  while [ $RUNNING -ge $MAX_PARALLEL ]; do
    # Wait for any job to finish
    wait -n 2>/dev/null || true
    RUNNING=$((RUNNING - 1))
  done
  
  # Start new job in background
  run_prompt "$PROMPT_FILE" &
  PIDS+=($!)
  RUNNING=$((RUNNING + 1))
done

# Wait for all remaining jobs
echo ""
echo "⏳ Waiting for all task groups to complete..."
for PID in "${PIDS[@]}"; do
  wait $PID 2>/dev/null || true
done

echo ""
echo "🎉 All task groups completed!"
echo "📝 Check tasks.md for progress: $SPEC_DIR/tasks.md"
echo ""
echo "🔍 Run coverage check: npm run test:coverage"
