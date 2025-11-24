#!/bin/bash
# Parallel Implementation Execution
# Uses Droid Exec with bounded concurrency

set -e

SPEC_DIR="droidz/specs/019-dark-mode-only"
PROMPTS_DIR="$SPEC_DIR/implementation/prompts"
CONFIG_FILE="droidz/config.yml"

echo "🚀 Starting parallel implementation..."
echo "📋 Processing 5 task groups concurrently"
echo ""

# Load Factory API key from config.yml or environment
if [ -f "$CONFIG_FILE" ]; then
  echo "📄 Loading configuration from $CONFIG_FILE"
  
  # Extract API key from YAML (simple grep approach)
  API_KEY=$(grep "^factory_api_key:" "$CONFIG_FILE" | sed 's/factory_api_key:[[:space:]]*//' | tr -d '"' | tr -d "'")
  
  # Extract optional settings
  AUTONOMY=$(grep "^default_autonomy_level:" "$CONFIG_FILE" | sed 's/default_autonomy_level:[[:space:]]*//' | tr -d '"' | tr -d "'" || echo "medium")
  MAX_PARALLEL=$(grep "^max_parallel_executions:" "$CONFIG_FILE" | sed 's/max_parallel_executions:[[:space:]]*//' || echo "4")
  
  # Use config file API key if set, otherwise fall back to env var
  if [ -n "$API_KEY" ]; then
    export FACTORY_API_KEY="$API_KEY"
    echo "✅ Using API key from config.yml"
  fi
else
  # Use defaults if no config file
  AUTONOMY="medium"
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

# Run all prompts in parallel with configured settings
for prompt in "$PROMPTS_DIR"/*.md; do
  (
    echo "▶️  Starting: $(basename "$prompt")"
    droid exec --auto "$AUTONOMY" -f "$prompt" 2>&1 | sed "s/^/[$(basename "$prompt")] /"
    echo "✅ Completed: $(basename "$prompt")"
  ) &
  
  # Limit parallelism
  while [ $(jobs -r | wc -l) -ge "$MAX_PARALLEL" ]; do
    sleep 1
  done
done

# Wait for all background jobs to complete
wait

echo ""
echo "🎉 All task groups completed!"
echo "📝 Check tasks.md for progress"
