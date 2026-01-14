# AI SDK 6 Migration Tasks

**Spec**: [spec.md](./spec.md)  
**Priority**: Urgent (1-2 days)  
**Strategy**: Big Bang (single PR)  
**Package Manager**: bun

---

## Task Group 1: Setup & Preparation

### Task 1.1: Pre-Migration Baseline Verification
- **Description**: Verify all existing tests pass and capture baseline metrics before migration
- **Dependencies**: None
- **Acceptance Criteria**:
  - `bun run qa:smoke` passes successfully
  - `bun run test` reports all unit tests passing
  - Document current test count and coverage
  - Commit baseline state (optional)
- **Complexity**: Small
- **Duration**: 15 min

### Task 1.2: Create Migration Branch
- **Description**: Create feature branch for atomic migration
- **Dependencies**: Task 1.1
- **Acceptance Criteria**:
  - Branch `feat/ai-sdk-6-migration` created from main
  - Clean working directory confirmed
- **Complexity**: Small
- **Duration**: 5 min
- **Commands**:
  ```bash
  git checkout -b feat/ai-sdk-6-migration
  git status --porcelain  # should be clean
  ```

### Task 1.3: Update Package Versions
- **Description**: Update all AI SDK packages to v6/v3 versions
- **Dependencies**: Task 1.2
- **Acceptance Criteria**:
  - All packages updated to target versions
  - `bun.lock` regenerated
  - No peer dependency conflicts
- **Complexity**: Small
- **Duration**: 10 min
- **File**: `package.json`
- **Commands**:
  ```bash
  bun install ai@^6.0.33 \
    @ai-sdk/groq@^3.0.6 \
    @ai-sdk/openai@^3.0.9 \
    @ai-sdk/react@^3.0.35 \
    @ai-sdk/rsc@^2.0.33 \
    streamdown@^2.0.1 \
    uuid@^13.0.0
  ```
- **Version Changes**:
  | Package | From | To |
  |---------|------|-----|
  | `ai` | 5.0.115 | 6.0.33 |
  | `@ai-sdk/groq` | 2.0.33 | 3.0.6 |
  | `@ai-sdk/openai` | 2.0.88 | 3.0.9 |
  | `@ai-sdk/react` | 2.0.117 | 3.0.35 |
  | `@ai-sdk/rsc` | 1.0.117 | 2.0.33 |
  | `streamdown` | 1.6.10 | 2.0.1 |
  | `uuid` | 12.0.0 | 13.0.0 |

---

## Task Group 2: Automated Codemods

### Task 2.1: Run AI SDK v6 Codemod Suite
- **Description**: Execute the official AI SDK codemod to handle automatic transformations
- **Dependencies**: Task 1.3
- **Acceptance Criteria**:
  - Codemod runs without errors
  - Changes applied to relevant files
  - Review git diff to confirm transformations
- **Complexity**: Small
- **Duration**: 10 min
- **Commands**:
  ```bash
  bunx @ai-sdk/codemod v6
  git diff --stat  # review what changed
  ```
- **Expected Transformations**:
  - `add-await-converttomodelmessages` - Adds await to convertToModelMessages calls
  - `rename-core-message-to-model-message` - Type renames
  - `rename-mock-v2-to-v3` - Mock class updates
  - `rename-tool-call-options-to-tool-execution-options` - Type renames

### Task 2.2: Review Codemod Output
- **Description**: Manually review codemod changes for correctness and completeness
- **Dependencies**: Task 2.1
- **Acceptance Criteria**:
  - All `convertToModelMessages` calls have await
  - Type imports updated correctly
  - No syntax errors introduced
  - Identify any missed transformations for manual handling
- **Complexity**: Small
- **Duration**: 15 min
- **Files to Review**:
  - `src/app/api/chat/route.ts`
  - `src/lib/api/groq-client.ts`
  - `src/features/chat/lib/streaming.ts`
  - `__tests__/lib/services/report-generation-service.test.ts`

---

## Task Group 3: Manual Code Changes

### Task 3.1: Migrate generateObject to generateText with Output.object
- **Description**: Replace deprecated `generateObject` with `generateText` + `Output.object()` pattern
- **Dependencies**: Task 2.2
- **Acceptance Criteria**:
  - Import changed from `generateObject` to `Output`
  - Function signature updated to use `generateText`
  - Return value changed from `result.object` to `result.output`
  - Types are correct and compile without errors
- **Complexity**: Medium
- **Duration**: 30 min
- **File**: `src/lib/api/groq-client.ts`
- **Code Changes**:
  ```typescript
  // BEFORE
  import { generateText, generateObject, convertToModelMessages, streamText } from 'ai';
  
  const result = await generateObject({
    model,
    schema: parsedAnalysisSchema,
    system: systemPrompt,
    prompt: userPrompt,
    output: 'object',
    ...(options?.temperature !== undefined && { temperature: options.temperature }),
  });
  return result.object;
  
  // AFTER
  import { generateText, Output, convertToModelMessages, streamText } from 'ai';
  
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
  ```

### Task 3.2: Fix async convertToModelMessages in Chat Route
- **Description**: Ensure the codemod properly added await; verify async/await chain is correct
- **Dependencies**: Task 2.2
- **Acceptance Criteria**:
  - `convertToModelMessages` is awaited
  - Parent function context supports async properly
  - No runtime promise resolution issues
- **Complexity**: Small
- **Duration**: 10 min
- **File**: `src/app/api/chat/route.ts`
- **Line ~140**:
  ```typescript
  // Ensure this is awaited:
  const modelMessages = await convertToModelMessages(uiMessages);
  ```

### Task 3.3: Fix async convertToModelMessages in Groq Client
- **Description**: Add await to all convertToModelMessages calls in groq-client
- **Dependencies**: Task 2.2
- **Acceptance Criteria**:
  - Both calls to `convertToModelMessages` in `streamTextWithBrowserSearch` are awaited
  - Function remains async-compatible
- **Complexity**: Small
- **Duration**: 10 min
- **File**: `src/lib/api/groq-client.ts`
- **Code Changes**:
  ```typescript
  // Line ~85 and ~100 - ensure both are awaited:
  const modelMessages = await convertToModelMessages(uiMessages);
  ```

### Task 3.4: Enable Per-Tool Strict Mode
- **Description**: Add `strict: true` to browser_search tool definition
- **Dependencies**: Task 3.2
- **Acceptance Criteria**:
  - `tool` function imported from 'ai'
  - `strict: true` added to browser_search tool
  - Tool still functions correctly with Groq
- **Complexity**: Small
- **Duration**: 15 min
- **File**: `src/app/api/chat/route.ts`
- **Code Changes**:
  ```typescript
  import { convertToModelMessages, tool } from 'ai';
  
  // In the tools section (~line 145):
  ...(hasWebSearch
    ? {
        tools: {
          browser_search: tool({
            ...groq.tools.browserSearch({}),
            strict: true,
          }),
        },
        toolChoice: 'auto' as const,
      }
    : {}),
  ```

---

## Task Group 4: New Features Implementation

### Task 4.1: Create AI Config Module
- **Description**: Create centralized AI SDK configuration including DevTools settings
- **Dependencies**: Task 3.4
- **Acceptance Criteria**:
  - Config file created at specified path
  - DevTools enabled only in development
  - Exported config is type-safe
- **Complexity**: Small
- **Duration**: 15 min
- **File**: `src/config/ai-config.ts` (new)
- **Code**:
  ```typescript
  /**
   * AI SDK configuration
   * @see https://sdk.vercel.ai/docs
   */
  export const aiConfig = {
    /** Enable AI SDK DevTools in development mode only */
    devTools: process.env.NODE_ENV === 'development',
    /** Control AI SDK warning logs */
    warnings: process.env.AI_SDK_LOG_WARNINGS !== 'false',
  } as const;
  
  export type AIConfig = typeof aiConfig;
  ```

### Task 4.2: Create ToolLoopAgent Wrapper
- **Description**: Implement agent abstraction for chat using new ToolLoopAgent API
- **Dependencies**: Task 3.4
- **Acceptance Criteria**:
  - Agent wrapper created following project patterns
  - Proper TypeScript types
  - Configurable max steps (default 20)
  - Exports match feature-first architecture conventions
- **Complexity**: Medium
- **Duration**: 30 min
- **File**: `src/features/chat/lib/agent.ts` (new)
- **Code**:
  ```typescript
  import { ToolLoopAgent, stepCountIs, type LanguageModel, type ToolSet } from 'ai';
  
  export interface ChatAgentConfig {
    model: LanguageModel;
    instructions: string;
    tools?: ToolSet;
    maxSteps?: number;
  }
  
  /**
   * Create a chat agent using AI SDK's ToolLoopAgent.
   * Provides a unified abstraction for tool-enabled conversations.
   * 
   * @param config - Agent configuration
   * @returns Configured ToolLoopAgent instance
   */
  export function createChatAgent(config: ChatAgentConfig): ToolLoopAgent {
    return new ToolLoopAgent({
      model: config.model,
      instructions: config.instructions,
      tools: config.tools,
      stopWhen: config.maxSteps ? stepCountIs(config.maxSteps) : undefined,
    });
  }
  
  export type { ToolLoopAgent };
  ```

### Task 4.3: Integrate ToolLoopAgent into Chat Route (Optional)
- **Description**: Refactor chat API route to use ToolLoopAgent abstraction
- **Dependencies**: Task 4.2
- **Acceptance Criteria**:
  - Chat route uses createChatAgent for streaming
  - Existing functionality preserved
  - Backward compatible with current chat flows
  - All error handling maintained
- **Complexity**: Large
- **Duration**: 45 min
- **File**: `src/app/api/chat/route.ts`
- **Note**: This is marked optional as the existing `streamChatCompletion` pattern works with v6. The ToolLoopAgent provides a cleaner abstraction but may require more extensive testing.

---

## Task Group 5: Test Updates & Verification

### Task 5.1: Update Test Mocks for V3 API
- **Description**: Update any test mocks that directly reference AI SDK mock classes
- **Dependencies**: Task 3.1
- **Acceptance Criteria**:
  - All `MockLanguageModelV2` updated to `MockLanguageModelV3` (if present)
  - Mock return shapes match new API (`result.output` vs `result.object`)
  - Test assertions updated accordingly
- **Complexity**: Small
- **Duration**: 20 min
- **Files**:
  - `__tests__/lib/services/report-generation-service.test.ts`
  - Search for any other files using AI SDK mocks
- **Note**: Current tests mock the groq-client functions directly, not the AI SDK. Verify mock return values match new API.

### Task 5.2: Run Unit Test Suite
- **Description**: Execute full unit test suite and fix any failures
- **Dependencies**: Task 5.1
- **Acceptance Criteria**:
  - `bun run test` passes 100%
  - No new test failures introduced
  - Coverage maintained or improved
- **Complexity**: Medium (depends on issues found)
- **Duration**: 30 min
- **Commands**:
  ```bash
  bun run test
  bun run test:coverage
  ```

### Task 5.3: Run TypeScript Compilation Check
- **Description**: Verify all TypeScript types are correct after migration
- **Dependencies**: Task 5.2
- **Acceptance Criteria**:
  - `tsc --noEmit` passes without errors
  - No type mismatches in migrated code
  - All imports resolve correctly
- **Complexity**: Small
- **Duration**: 10 min
- **Commands**:
  ```bash
  bunx tsc --noEmit
  ```

### Task 5.4: Run Linting
- **Description**: Ensure code quality standards maintained
- **Dependencies**: Task 5.3
- **Acceptance Criteria**:
  - `bun run lint` passes
  - No new linting errors introduced
- **Complexity**: Small
- **Duration**: 10 min
- **Commands**:
  ```bash
  bun run lint
  ```

---

## Task Group 6: Integration Testing

### Task 6.1: Run E2E Test Suite
- **Description**: Execute Playwright E2E tests for chat and therapy flows
- **Dependencies**: Task 5.4
- **Acceptance Criteria**:
  - `bun run test:e2e` passes
  - Chat session creation works
  - Streaming responses function correctly
  - Report generation flows work
- **Complexity**: Medium
- **Duration**: 30 min
- **Commands**:
  ```bash
  bun run test:e2e
  ```

### Task 6.2: Manual Smoke Testing
- **Description**: Manually verify critical user paths work correctly
- **Dependencies**: Task 6.1
- **Acceptance Criteria**:
  - [ ] Start new chat session - message sends and streams response
  - [ ] Multi-turn conversation works
  - [ ] Web search toggle functions (when enabled)
  - [ ] BYOK flow works with OpenAI key
  - [ ] Session report generation completes
  - [ ] DevTools visible in development (browser console)
- **Complexity**: Medium
- **Duration**: 30 min
- **Commands**:
  ```bash
  bun run dev
  # Test at http://localhost:4000
  ```

### Task 6.3: Performance Validation
- **Description**: Verify streaming performance meets targets
- **Dependencies**: Task 6.2
- **Acceptance Criteria**:
  - Time to first token < 500ms
  - No regression in response times
  - Memory usage stable
- **Complexity**: Small
- **Duration**: 15 min
- **Metrics**:
  - Measure time from request to first SSE chunk
  - Compare with pre-migration baseline if available

---

## Task Group 7: Finalization

### Task 7.1: Run Full QA Suite
- **Description**: Execute complete quality assurance pipeline
- **Dependencies**: Task 6.3
- **Acceptance Criteria**:
  - `bun run qa:smoke` passes completely
  - All checks green
- **Complexity**: Small
- **Duration**: 15 min
- **Commands**:
  ```bash
  bun run qa:smoke
  ```

### Task 7.2: Commit Migration Changes
- **Description**: Create atomic commit with all migration changes
- **Dependencies**: Task 7.1
- **Acceptance Criteria**:
  - All changes staged
  - Conventional commit message
  - No unrelated changes included
- **Complexity**: Small
- **Duration**: 10 min
- **Commands**:
  ```bash
  git add -A
  git status  # review staged changes
  git commit -m "feat: migrate to AI SDK v6

  BREAKING CHANGES:
  - Update ai to 6.0.33 (from 5.0.115)
  - Update @ai-sdk/groq to 3.0.6 (from 2.0.33)
  - Update @ai-sdk/openai to 3.0.9 (from 2.0.88)
  - Update @ai-sdk/react to 3.0.35 (from 2.0.117)
  - Update @ai-sdk/rsc to 2.0.33 (from 1.0.117)
  - Update streamdown to 2.0.1 (from 1.6.10)
  - Update uuid to 13.0.0 (from 12.0.0)

  Changes:
  - Migrate generateObject to generateText with Output.object()
  - Add await to convertToModelMessages (now async)
  - Enable strict mode on browser_search tool
  - Add AI SDK configuration (DevTools enabled in dev)
  - Create ToolLoopAgent wrapper for chat abstraction"
  ```

### Task 7.3: Create Pull Request
- **Description**: Open PR for review with comprehensive description
- **Dependencies**: Task 7.2
- **Acceptance Criteria**:
  - PR created with detailed description
  - All CI checks pass
  - Linked to migration spec
  - Ready for review
- **Complexity**: Small
- **Duration**: 10 min

---

## Summary

| Group | Tasks | Est. Duration |
|-------|-------|---------------|
| 1. Setup & Preparation | 3 | 30 min |
| 2. Automated Codemods | 2 | 25 min |
| 3. Manual Code Changes | 4 | 65 min |
| 4. New Features | 3 | 90 min |
| 5. Test Updates | 4 | 70 min |
| 6. Integration Testing | 3 | 75 min |
| 7. Finalization | 3 | 35 min |
| **Total** | **22** | **~6.5 hours** |

---

## Dependency Graph

```
Task 1.1 → Task 1.2 → Task 1.3
                         ↓
                    Task 2.1 → Task 2.2
                                  ↓
            ┌─────────────────────┼─────────────────────┐
            ↓                     ↓                     ↓
        Task 3.1              Task 3.2              Task 3.3
            ↓                     ↓                     ↓
            └─────────────────────┼─────────────────────┘
                                  ↓
                              Task 3.4
                                  ↓
                    ┌─────────────┼─────────────┐
                    ↓             ↓             ↓
                Task 4.1      Task 4.2      Task 5.1
                                  ↓             ↓
                            Task 4.3 (opt)  Task 5.2
                                              ↓
                                          Task 5.3
                                              ↓
                                          Task 5.4
                                              ↓
                                          Task 6.1
                                              ↓
                                          Task 6.2
                                              ↓
                                          Task 6.3
                                              ↓
                                          Task 7.1
                                              ↓
                                          Task 7.2
                                              ↓
                                          Task 7.3
```

---

## Rollback Plan

If critical issues are discovered post-migration:

```bash
# Option 1: Revert the PR/commit
git revert <migration-commit-hash>

# Option 2: Restore previous package versions
bun install ai@^5.0.115 \
  @ai-sdk/groq@^2.0.33 \
  @ai-sdk/openai@^2.0.88 \
  @ai-sdk/react@^2.0.117 \
  @ai-sdk/rsc@^1.0.117 \
  streamdown@^1.6.10 \
  uuid@^12.0.0
```

---

## Notes

- **Codemod First**: Always run codemods before manual changes to avoid conflicts
- **Type Safety**: Use `tsc --noEmit` frequently during manual changes
- **Feature Flags**: DevTools are automatically development-only via NODE_ENV check
- **ToolLoopAgent**: Task 4.3 is optional; existing streaming pattern works with v6
- **Testing**: If tests fail, focus on mock return value shapes (`result.output` vs `result.object`)
