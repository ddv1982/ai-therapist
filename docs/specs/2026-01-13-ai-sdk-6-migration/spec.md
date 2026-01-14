# AI SDK 6 Migration Specification

**Status**: Ready for Implementation  
**Priority**: Urgent (1-2 days)  
**Strategy**: Big Bang (single PR)  
**Author**: Specification Agent  
**Date**: 2026-01-13

---

## 1. Overview

### 1.1 Goals

Upgrade the Therapist AI App from AI SDK v5 to v6 including all related provider packages:

| Package | Current | Target |
|---------|---------|--------|
| `ai` | 5.0.115 | 6.0.33 |
| `@ai-sdk/groq` | 2.0.33 | 3.0.6 |
| `@ai-sdk/openai` | 2.0.88 | 3.0.9 |
| `@ai-sdk/react` | 2.0.117 | 3.0.35 |
| `@ai-sdk/rsc` | 1.0.117 | 2.0.33 |
| `streamdown` | 1.6.10 | 2.0.1 |
| `uuid` | 12.0.0 | 13.0.0 |

### 1.2 Success Criteria

- [ ] All AI SDK packages updated to v6/v3
- [ ] All deprecated code removed (not just migrated)
- [ ] All existing tests passing with V3 mocks
- [ ] No runtime errors in chat/therapy flows
- [ ] DevTools working in development
- [ ] Streaming performance maintained (<500ms to first token)

### 1.3 Non-Goals

- MCP (Model Context Protocol) support – deferred
- Tool approval workflows – deferred for future implementation
- New feature additions beyond migration requirements

---

## 2. Technical Approach

### 2.1 Migration Strategy

**Big Bang Migration**: All changes in a single PR for atomic upgrade.

**Rationale**:
- AI SDK v5 and v6 have minimal breaking changes (unlike v4→v5)
- Provider packages must align with core SDK version
- Codemod tooling handles most transformations automatically

### 2.2 Migration Phases

1. **Phase 1**: Run codemods (`npx @ai-sdk/codemod v6`)
2. **Phase 2**: Manual code changes for uncovered cases
3. **Phase 3**: Adopt new features (ToolLoopAgent, strict mode, DevTools)
4. **Phase 4**: Test verification
5. **Phase 5**: Performance validation

---

## 3. Breaking Changes Analysis

### 3.1 `convertToCoreMessages` → `convertToModelMessages` (async)

**Impact**: HIGH – Used in API route and groq-client

**Files Affected**:
- `src/app/api/chat/route.ts`
- `src/lib/api/groq-client.ts`

**Before (v5)**:
```typescript
import { convertToModelMessages } from 'ai';

const modelMessages = convertToModelMessages(uiMessages);
```

**After (v6)**:
```typescript
import { convertToModelMessages } from 'ai';

const modelMessages = await convertToModelMessages(uiMessages);
```

**Codemod**: `add-await-converttomodelmessages` handles this automatically.

---

### 3.2 `generateObject` Deprecation

**Impact**: HIGH – Used for structured analysis extraction

**Files Affected**:
- `src/lib/api/groq-client.ts` (`extractStructuredAnalysis`)

**Before (v5)**:
```typescript
import { generateObject } from 'ai';

const result = await generateObject({
  model,
  schema: parsedAnalysisSchema,
  system: systemPrompt,
  prompt: userPrompt,
  output: 'object',
});

return result.object;
```

**After (v6)**:
```typescript
import { generateText, Output } from 'ai';

const result = await generateText({
  model,
  output: Output.object({
    schema: parsedAnalysisSchema,
  }),
  system: systemPrompt,
  prompt: userPrompt,
});

return result.output;
```

**Notes**:
- `generateObject` is deprecated but not removed yet
- Migrate immediately per user decision to remove deprecated code
- Return value changes from `result.object` to `result.output`

---

### 3.3 Mock Classes V2 → V3

**Impact**: MEDIUM – Test infrastructure

**Files Affected**:
- `__tests__/lib/services/report-generation-service.test.ts`
- Any other test files using AI SDK mocks

**Before (v5)**:
```typescript
import { MockLanguageModelV2 } from 'ai/test';
```

**After (v6)**:
```typescript
import { MockLanguageModelV3 } from 'ai/test';
```

**Codemod**: `rename-mock-v2-to-v3` handles this automatically.

**Current Status**: No direct mock imports found in codebase. Tests mock the groq-client functions instead.

---

### 3.4 Per-Tool Strict Mode

**Impact**: MEDIUM – Tool definitions

**Files Affected**:
- `src/app/api/chat/route.ts` (browser_search tool)
- Any future tool definitions

**Before (v5)**:
```typescript
const result = streamText({
  model,
  tools: {
    browser_search: groq.tools.browserSearch({}),
  },
  providerOptions: {
    openai: {
      strictJsonSchema: true,  // Applied to all tools
    },
  },
});
```

**After (v6)**:
```typescript
import { tool } from 'ai';

const result = streamText({
  model,
  tools: {
    browser_search: tool({
      ...groq.tools.browserSearch({}),
      strict: true,  // Per-tool strict mode
    }),
  },
});
```

---

### 3.5 Type Renames

**Impact**: LOW – Type-only changes

| v5 Type | v6 Type |
|---------|---------|
| `CoreMessage` | `ModelMessage` |
| `ToolCallOptions` | `ToolExecutionOptions` |

**Codemod**: Handled automatically by:
- `rename-core-message-to-model-message`
- `rename-tool-call-options-to-tool-execution-options`

---

### 3.6 `Tool.toModelOutput` Signature Change

**Impact**: LOW – Not currently used in codebase

**Before (v5)**:
```typescript
toModelOutput: output => { /* ... */ }
```

**After (v6)**:
```typescript
toModelOutput: ({ output }) => { /* ... */ }
```

---

## 4. Files to Migrate

### 4.1 Core AI Integration Files

| File | Changes Required |
|------|------------------|
| `src/app/api/chat/route.ts` | `await convertToModelMessages`, strict tool mode |
| `src/lib/api/groq-client.ts` | `await convertToModelMessages`, migrate `generateObject` |
| `src/features/chat/lib/streaming.ts` | Already using `ModelMessage` type ✅ |
| `src/features/chat/lib/title-generator.ts` | No changes needed ✅ |
| `src/features/therapy/lib/report-generation-service.ts` | Upstream from groq-client changes |
| `src/ai/providers.ts` | Provider specification version check |

### 4.2 Test Files

| File | Changes Required |
|------|------------------|
| `__tests__/lib/services/report-generation-service.test.ts` | Mock function updates |
| `__tests__/contexts/session-context.test.tsx` | Check for AI imports |

### 4.3 Type Files

| File | Changes Required |
|------|------------------|
| Global type imports | `CoreMessage` → `ModelMessage` |

---

## 5. New Features to Adopt

### 5.1 ToolLoopAgent (User Decision: Yes)

**Purpose**: Unified agent abstraction replacing manual tool loop orchestration.

**Implementation Plan**:

The current chat streaming uses manual tool orchestration. Refactor to use `ToolLoopAgent`:

**Before (Current Implementation)**:
```typescript
// src/features/chat/lib/streaming.ts
export async function streamChatCompletion(params: {
  model: LanguageModel;
  messages: ModelMessage[];
  tools?: ChatTools;
  toolChoice?: ChatToolChoice;
}) {
  return streamText({
    model: params.model,
    messages: params.messages,
    tools: params.tools,
    toolChoice: params.toolChoice,
  });
}
```

**After (ToolLoopAgent)**:
```typescript
import { ToolLoopAgent } from 'ai';

export function createChatAgent(params: {
  model: LanguageModel;
  instructions: string;
  tools?: ChatTools;
}) {
  return new ToolLoopAgent({
    model: params.model,
    instructions: params.instructions,
    tools: params.tools,
    // stopWhen defaults to stepCountIs(20)
  });
}

// Usage in API route
const agent = createChatAgent({
  model: modelToUse,
  instructions: systemPrompt,
  tools: hasWebSearch ? { browser_search: groq.tools.browserSearch({}) } : undefined,
});

const result = await agent.stream({ 
  messages: modelMessages,
});
```

**Migration Scope**:
- Primary: `src/app/api/chat/route.ts`
- Helper: `src/features/chat/lib/streaming.ts`

**Note**: `ToolLoopAgent` defaults to `stopWhen: stepCountIs(20)`. Adjust if needed for therapy context.

---

### 5.2 DevTools (User Decision: Development Only)

**Purpose**: Development tooling for debugging AI responses.

**Implementation**:

```typescript
// src/config/ai-config.ts (new file)
export const aiConfig = {
  devTools: process.env.NODE_ENV === 'development',
};

// Usage in streaming calls
const result = streamText({
  model,
  messages,
  // DevTools automatically enabled in development
});
```

**Environment Setup**:
```bash
# .env.local (development only)
AI_SDK_DEVTOOLS=true
```

---

### 5.3 Strict Mode on All Tools (User Decision: Yes)

**Implementation**:

Update all tool definitions to include `strict: true`:

```typescript
import { tool } from 'ai';
import { z } from 'zod';

const browserSearchTool = tool({
  description: 'Search the web for information',
  inputSchema: z.object({
    query: z.string().describe('The search query'),
  }),
  execute: async ({ query }) => {
    // Implementation
  },
  strict: true,  // Enable strict JSON schema validation
});
```

**Files to Update**:
- `src/app/api/chat/route.ts` (browser_search tool)

---

### 5.4 Input Examples (Consider for Future)

**Purpose**: Improve tool alignment with example inputs.

**Deferred**: Not required for initial migration. Consider for Phase 2.

---

## 6. Migration Steps

### Step 1: Package Updates

```bash
bun install ai@^6.0.33 \
  @ai-sdk/groq@^3.0.6 \
  @ai-sdk/openai@^3.0.9 \
  @ai-sdk/react@^3.0.35 \
  @ai-sdk/rsc@^2.0.33 \
  streamdown@^2.0.1 \
  uuid@^13.0.0
```

### Step 2: Run Codemods

```bash
npx @ai-sdk/codemod v6
```

This runs the following transformations:
- `add-await-converttomodelmessages`
- `rename-core-message-to-model-message`
- `rename-mock-v2-to-v3`
- `rename-tool-call-options-to-tool-execution-options`

### Step 3: Manual Code Changes

#### 3.1 Migrate `generateObject` in groq-client.ts

```typescript
// src/lib/api/groq-client.ts

// BEFORE
import { generateText, generateObject, convertToModelMessages, streamText } from 'ai';

export const extractStructuredAnalysis = async (
  reportContent: string,
  systemPrompt: string,
  modelOrId: LanguageModel | string = ANALYTICAL_MODEL_ID,
  options?: GenerationOptions
): Promise<ParsedAnalysis> => {
  const result = await generateObject({
    model,
    schema: parsedAnalysisSchema,
    system: systemPrompt,
    prompt: userPrompt,
    output: 'object',
    ...(options?.temperature !== undefined && { temperature: options.temperature }),
  });

  return result.object;
};

// AFTER
import { generateText, Output, convertToModelMessages, streamText } from 'ai';

export const extractStructuredAnalysis = async (
  reportContent: string,
  systemPrompt: string,
  modelOrId: LanguageModel | string = ANALYTICAL_MODEL_ID,
  options?: GenerationOptions
): Promise<ParsedAnalysis> => {
  const result = await generateText({
    model,
    output: Output.object({
      schema: parsedAnalysisSchema,
    }),
    system: systemPrompt,
    prompt: userPrompt,
    ...(options?.temperature !== undefined && { temperature: options.temperature }),
  });

  return result.output;
};
```

#### 3.2 Add await to convertToModelMessages

```typescript
// src/app/api/chat/route.ts
// BEFORE
const modelMessages = convertToModelMessages(uiMessages);

// AFTER
const modelMessages = await convertToModelMessages(uiMessages);
```

```typescript
// src/lib/api/groq-client.ts
// BEFORE
const modelMessages = convertToModelMessages(uiMessages);

// AFTER
const modelMessages = await convertToModelMessages(uiMessages);
```

#### 3.3 Enable Strict Mode on Tools

```typescript
// src/app/api/chat/route.ts
import { tool } from 'ai';

// When using browser_search tool
const result = await streamChatCompletion({
  model: modelToUse,
  system: systemPrompt,
  messages: modelMessages,
  tools: hasWebSearch
    ? {
        browser_search: tool({
          ...groq.tools.browserSearch({}),
          strict: true,
        }),
      }
    : undefined,
});
```

### Step 4: Implement ToolLoopAgent

Create new agent abstraction:

```typescript
// src/features/chat/lib/agent.ts (new file)
import { ToolLoopAgent, type LanguageModel, type ToolSet } from 'ai';

export interface ChatAgentConfig {
  model: LanguageModel;
  instructions: string;
  tools?: ToolSet;
  maxSteps?: number;
}

export function createChatAgent(config: ChatAgentConfig): ToolLoopAgent {
  return new ToolLoopAgent({
    model: config.model,
    instructions: config.instructions,
    tools: config.tools,
    // Default: stepCountIs(20), override if needed
    ...(config.maxSteps && { stopWhen: stepCountIs(config.maxSteps) }),
  });
}
```

Update API route to use agent:

```typescript
// src/app/api/chat/route.ts
import { createChatAgent } from '@/features/chat/lib/agent';

// In the POST handler:
const agent = createChatAgent({
  model: modelToUse,
  instructions: systemPrompt,
  tools: hasWebSearch
    ? {
        browser_search: tool({
          ...groq.tools.browserSearch({}),
          strict: true,
        }),
      }
    : undefined,
});

const streamResultPromise = agent.stream({
  messages: modelMessages,
});
```

### Step 5: Update Tests

```typescript
// Update mock return types if needed
// __tests__/lib/services/report-generation-service.test.ts

// The test file mocks functions, not the AI SDK directly
// Ensure extractStructuredAnalysis mock returns proper shape:
(extractStructuredAnalysis as jest.Mock).mockResolvedValue({
  sessionOverview: { themes: ['sadness'] },
  cognitiveDistortions: [],
  keyPoints: ['Point 1'],
} as ParsedAnalysis);
```

### Step 6: DevTools Configuration

```typescript
// src/config/ai-config.ts (new file)
export const aiConfig = {
  devTools: process.env.NODE_ENV === 'development',
  warnings: process.env.AI_SDK_LOG_WARNINGS !== 'false',
} as const;
```

---

## 7. Code Changes Summary

### 7.1 Files to Create

| File | Purpose |
|------|---------|
| `src/features/chat/lib/agent.ts` | ToolLoopAgent wrapper |
| `src/config/ai-config.ts` | AI SDK configuration |

### 7.2 Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Update package versions |
| `src/app/api/chat/route.ts` | await convertToModelMessages, agent integration, strict tools |
| `src/lib/api/groq-client.ts` | await convertToModelMessages, generateObject → generateText |
| `src/features/chat/lib/streaming.ts` | Minor type updates (if any) |

### 7.3 Files Unchanged

| File | Reason |
|------|--------|
| `src/features/chat/lib/title-generator.ts` | Already compatible |
| `src/features/therapy/lib/report-generation-service.ts` | Uses groq-client (upstream) |
| `src/ai/providers.ts` | Custom Ollama implementation, no SDK changes |

---

## 8. Testing Strategy

### 8.1 Pre-Migration Baseline

```bash
# Run full test suite before migration
bun run qa:smoke
```

### 8.2 Unit Tests

```bash
# After migration
bun run test
```

**Focus Areas**:
- `__tests__/lib/services/report-generation-service.test.ts`
- Any tests using AI SDK types

### 8.3 Integration Tests

```bash
# Verify chat flow
bun run test:e2e
```

**Critical Paths**:
- Chat session creation and streaming
- Therapy report generation
- CBT data extraction
- Web search tool (when enabled)

### 8.4 Manual Testing Checklist

- [ ] Start new chat session
- [ ] Send message and verify streaming response
- [ ] Generate session report
- [ ] Test BYOK (Bring Your Own Key) flow
- [ ] Test web search toggle (if available)
- [ ] Verify DevTools in development mode

### 8.5 Performance Testing

```bash
# Measure time to first token
# Target: < 500ms
```

**Metrics to Capture**:
- Time to first token
- Total response time
- Memory usage
- Error rates

---

## 9. Rollback Plan

### 9.1 Git Strategy

```bash
# Create migration branch
git checkout -b feat/ai-sdk-6-migration

# After verification, merge to main
# If issues arise, revert the merge commit
```

### 9.2 Package Rollback

If critical issues are discovered:

```bash
# Rollback to previous versions
bun install ai@^5.0.115 \
  @ai-sdk/groq@^2.0.33 \
  @ai-sdk/openai@^2.0.88 \
  @ai-sdk/react@^2.0.117 \
  @ai-sdk/rsc@^1.0.117 \
  streamdown@^1.6.10 \
  uuid@^12.0.0
```

### 9.3 Code Rollback

```bash
# Revert all migration changes
git revert <migration-commit-hash>
```

---

## 10. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking change missed by codemod | Low | Medium | Manual code review |
| Test failures | Medium | Low | Comprehensive testing |
| Performance regression | Low | High | Performance benchmarks |
| Runtime errors in production | Low | High | Staging environment testing |
| Provider package incompatibility | Low | Medium | Version pinning |

---

## 11. Dependencies & Prerequisites

### 11.1 Prerequisites

- [ ] Node.js 24+ (current: ✅)
- [ ] Bun 1.2+ (current: ✅)
- [ ] All current tests passing (verify before migration)
- [ ] No uncommitted changes on main branch

### 11.2 External Dependencies

- Groq API compatibility with SDK v3
- OpenAI API compatibility with SDK v3
- Vercel deployment compatibility

---

## 12. Timeline

### Day 1 (4-6 hours)

| Task | Duration |
|------|----------|
| Run codemods | 30 min |
| Manual code changes | 2 hours |
| Unit test fixes | 1 hour |
| Initial integration testing | 1 hour |
| DevTools setup | 30 min |

### Day 2 (2-4 hours)

| Task | Duration |
|------|----------|
| E2E testing | 1 hour |
| Performance validation | 1 hour |
| Documentation updates | 30 min |
| PR review and merge | 1 hour |

---

## 13. Appendix

### A. Codemod Reference

```bash
# Run all v6 codemods
npx @ai-sdk/codemod v6

# Run specific codemod
npx @ai-sdk/codemod v6/add-await-converttomodelmessages src/
npx @ai-sdk/codemod v6/rename-core-message-to-model-message src/
```

### B. Environment Variables

```bash
# Disable AI SDK warnings (optional)
AI_SDK_LOG_WARNINGS=false

# Enable DevTools (development only)
AI_SDK_DEVTOOLS=true
```

### C. Type Migration Reference

| v5 | v6 |
|----|-----|
| `CoreMessage` | `ModelMessage` |
| `CoreUserMessage` | `UserModelMessage` |
| `CoreAssistantMessage` | `AssistantModelMessage` |
| `CoreToolMessage` | `ToolModelMessage` |
| `ToolCallOptions` | `ToolExecutionOptions` |

### D. Import Changes

```typescript
// v5
import { generateObject, convertToCoreMessages, CoreMessage } from 'ai';

// v6
import { generateText, Output, convertToModelMessages, ModelMessage } from 'ai';
```

---

## Approval

- [ ] Technical Lead Review
- [ ] Security Review (no PHI exposure)
- [ ] QA Sign-off

---

*Specification prepared for Therapist AI App AI SDK 6 Migration*
