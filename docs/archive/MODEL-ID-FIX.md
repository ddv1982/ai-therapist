# Model ID Hardcoding Fix

## The Problem

The code had **hardcoded model IDs** scattered throughout `use-chat-actions.ts` instead of using the centralized constants from `model-metadata.ts`. This caused:

1. ❌ **Local model (Ollama) completely broken** - checking for `'llama3.2'` instead of `'ollama/gemma3:4b'`
2. ❌ **Smart model toggle broken** - toggling between `'claude-3-7-sonnet'` and `'gpt-4o'` instead of actual model IDs
3. ❌ **Web search broken** - using `'gpt-4o'` instead of `ANALYTICAL_MODEL_ID`

## The Root Cause

**Single source of truth was ignored.**

In `model-metadata.ts` we have:
```typescript
export const MODEL_IDS = {
  default: 'openai/gpt-oss-20b',      // 20B model
  analytical: 'openai/gpt-oss-120b',  // 120B smart model
  local: 'ollama/gemma3:4b',          // Local Ollama (was Gemma4)
} as const;
```

But in `use-chat-actions.ts` we had:
```typescript
// WRONG ❌
const isLocal = settings.model === 'llama3.2';  // Model doesn't exist!
updateSettings({ model: 'gpt-4o' });            // Wrong model!
const nextModel = settings.model === 'claude-3-7-sonnet' ? 'gpt-4o' : 'claude-3-7-sonnet';  // Both wrong!
```

## The Fix

**Use constants everywhere:**

```typescript
// ✅ CORRECT
import { DEFAULT_MODEL_ID, ANALYTICAL_MODEL_ID, LOCAL_MODEL_ID } from '@/features/chat/config';

// Local model toggle
const isLocal = settings.model === LOCAL_MODEL_ID;  // 'ollama/gemma3:4b'
updateSettings({ model: DEFAULT_MODEL_ID });        // 'openai/gpt-oss-20b'

// Smart model toggle (20B ↔ 120B)
const nextModel = settings.model === ANALYTICAL_MODEL_ID ? DEFAULT_MODEL_ID : ANALYTICAL_MODEL_ID;

// Web search
updateSettings({
  webSearchEnabled: newWebSearchEnabled,
  ...(newWebSearchEnabled ? { model: ANALYTICAL_MODEL_ID } : {}),
});
```

## What Each Button Does Now

### 🧠 Smart Model Button (Sparkles Icon)
- **Off → On**: Switches to `openai/gpt-oss-120b` (120B model)
- **On → Off**: Switches to `openai/gpt-oss-20b` (20B model)
- Always disables web search

### 🌐 Web Search Button (Globe Icon)
- **Off → On**: Enables web search + switches to `openai/gpt-oss-120b` (analytical model)
- **On → Off**: Disables web search + **resets to `openai/gpt-oss-20b` (default model)**

### 🔒 Local Model Button (Eye-off Icon)
- **Off → On**: 
  1. Checks if Ollama is running (`/api/ollama/health`)
  2. If available, switches to `ollama/gemma3:4b`
  3. Shows toast with status
- **On → Off**: Switches back to `openai/gpt-oss-20b` (default)

## Model Selection Logic

The actual model used follows this priority:

```typescript
// In model-selector.ts
function selectModelAndTools(input) {
  let model = DEFAULT_MODEL_ID;  // Start with 20B
  
  // 1. Use preferred model if valid
  if (requestedModel && AVAILABLE_MODELS.has(requestedModel)) {
    model = requestedModel;
  }
  
  // 2. Web search always uses analytical
  if (webSearchEnabled) {
    model = ANALYTICAL_MODEL_ID;  // 120B
  }
  
  // 3. Keywords trigger analytical
  if (/analy(s|z)e|cbt|schema|plan|report/i.test(message)) {
    model = ANALYTICAL_MODEL_ID;  // 120B
  }
  
  return { model, tools };
}
```

## Why This Matters

### Before Fix
```typescript
// User clicks local model button
settings.model = 'llama3.2'  // ❌ Model doesn't exist!

// Model validation in use-chat-streaming.ts
const validModels = ['openai/gpt-oss-20b', 'openai/gpt-oss-120b', 'ollama/gemma3:4b'];
const isValid = validModels.includes('llama3.2');  // false!
const safeModel = DEFAULT_MODEL_ID;  // Falls back to 20B

// Result: Local model NEVER works, always falls back
```

### After Fix
```typescript
// User clicks local model button
settings.model = LOCAL_MODEL_ID  // ✅ 'ollama/gemma3:4b'

// Model validation
const validModels = ['openai/gpt-oss-20b', 'openai/gpt-oss-120b', 'ollama/gemma3:4b'];
const isValid = validModels.includes('ollama/gemma3:4b');  // true!
const safeModel = 'ollama/gemma3:4b';  // Uses local model

// Result: Local model works correctly
```

## Changes Made

### File: `src/features/therapy-chat/hooks/use-chat-actions.ts`

1. **Added imports:**
   ```typescript
   import { DEFAULT_MODEL_ID, ANALYTICAL_MODEL_ID, LOCAL_MODEL_ID } from '@/features/chat/config';
   ```

2. **Fixed web search toggle:**
   ```diff
   - ...(newWebSearchEnabled ? { model: 'gpt-4o' } : {}),
   + model: newWebSearchEnabled ? ANALYTICAL_MODEL_ID : DEFAULT_MODEL_ID,
   ```
   
   **Key fix**: When web search is toggled OFF, it now explicitly resets to `DEFAULT_MODEL_ID` instead of leaving the model unchanged.

3. **Fixed smart model toggle:**
   ```diff
   - const nextModel = settings.model === 'claude-3-7-sonnet' ? 'gpt-4o' : 'claude-3-7-sonnet';
   + const nextModel = settings.model === ANALYTICAL_MODEL_ID ? DEFAULT_MODEL_ID : ANALYTICAL_MODEL_ID;
   - ...(nextModel === 'claude-3-7-sonnet' ? { webSearchEnabled: false } : {}),
   + webSearchEnabled: false,
   ```

4. **Fixed local model toggle:**
   ```diff
   - const isLocal = settings.model === 'llama3.2';
   + const isLocal = settings.model === LOCAL_MODEL_ID;
   
   - model: 'gpt-4o',
   + model: DEFAULT_MODEL_ID,
   
   - model: 'llama3.2',
   + model: LOCAL_MODEL_ID,
   ```

## Testing

### Local Model (Ollama)
```bash
# 1. Start Ollama
ollama serve

# 2. Pull the model
ollama pull gemma3:4b

# 3. In the app, click the local model button (eye-off icon)
# Should show "Checking local model..." toast
# Then "Local model ready" or "Model not available"
```

### Smart Model Toggle
```bash
# 1. Click sparkles button (off → on)
# Should switch to 120B model

# 2. Click sparkles button again (on → off)
# Should switch back to 20B model
```

### Web Search
```bash
# 1. Click globe button
# Should enable web search AND switch to 120B model
```

## Architecture Notes

### Model ID Flow

```
User Action (Button Click)
    ↓
use-chat-actions.ts (updateSettings with constant)
    ↓
ChatSettingsContext (settings.model updated)
    ↓
use-chat-controller.ts (passes to useChatStreaming)
    ↓
use-chat-streaming.ts (validates + sends selectedModel)
    ↓
API /api/chat (receives selectedModel)
    ↓
model-selector.ts (final decision + override logic)
    ↓
providers.ts (languageModels[modelId])
    ↓
Actual AI provider (Groq or Ollama)
```

### Single Source of Truth

```
model-metadata.ts
    ↓
config.ts (exports as constants)
    ↓
use-chat-actions.ts (uses constants)
    ↓
use-chat-streaming.ts (validates against MODEL_IDS)
    ↓
model-selector.ts (validates against AVAILABLE_MODELS)
    ↓
providers.ts (maps to actual language models)
```

## Prevention

To prevent this from happening again:

1. ✅ **Use constants** - Never hardcode model IDs
2. ✅ **Single source of truth** - `model-metadata.ts` is authoritative
3. ✅ **Type safety** - Use `ModelIdentifier` type
4. ✅ **Validation** - Check against `MODEL_IDS` or `AVAILABLE_MODELS`
5. ✅ **Tests** - Add tests for model selection logic

### ESLint Rule (Future)
```javascript
// Prevent hardcoded model IDs
{
  "no-restricted-syntax": [
    "error",
    {
      "selector": "Literal[value=/gpt-4o|claude-3|llama3/]",
      "message": "Use MODEL_IDS constants instead of hardcoded model identifiers"
    }
  ]
}
```

## Summary

**Problem:** Hardcoded model IDs everywhere  
**Impact:** All model toggles broken (local, smart, web search)  
**Solution:** Use centralized constants from `model-metadata.ts`  
**Result:** ✅ All model switches work correctly now

The fix ensures:
- 🔧 Local model (Ollama/Gemma) works
- 🧠 Smart model toggle (20B ↔ 120B) works
- 🌐 Web search model selection works
- 🎯 Single source of truth maintained
