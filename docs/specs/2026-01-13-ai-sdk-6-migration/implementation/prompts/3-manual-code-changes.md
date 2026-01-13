We're continuing our implementation of AI SDK 6 Migration by implementing task group number 3:

## Implement this task and its sub-tasks:

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

## Understand the context

Read @docs/specs/2026-01-13-ai-sdk-6-migration/spec.md to understand the context for this spec and where the current task fits into it.

Also read these for further context and reference:
- @docs/specs/2026-01-13-ai-sdk-6-migration/tasks.md

## Perform the implementation

After completing each task, check off the corresponding task in @docs/specs/2026-01-13-ai-sdk-6-migration/tasks.md

## User Standards & Preferences Compliance

IMPORTANT: Ensure that your implementation work is ALIGNED and DOES NOT CONFLICT with the user's preferences and standards as detailed in the following files:

- @droidz/standards/global/coding-principles.md
- @droidz/standards/global/coding-style.md
- @droidz/standards/global/commenting.md
- @droidz/standards/global/conventions.md
- @droidz/standards/global/error-handling.md
- @droidz/standards/global/performance.md
- @droidz/standards/global/security.md
- @droidz/standards/global/tech-stack.md
- @droidz/standards/global/testing.md
- @droidz/standards/global/validation.md
- @droidz/standards/frontend/accessibility.md
- @droidz/standards/frontend/components.md
- @droidz/standards/frontend/css.md
- @droidz/standards/frontend/i18n.md
- @droidz/standards/frontend/responsive.md
- @droidz/standards/frontend/routing.md
- @droidz/standards/frontend/state-management.md
- @droidz/standards/frontend/styling.md
- @droidz/standards/backend/ai-llm.md
- @droidz/standards/backend/api-design.md
- @droidz/standards/backend/api.md
- @droidz/standards/backend/authentication.md
- @droidz/standards/backend/database.md
- @droidz/standards/backend/error-responses.md
- @droidz/standards/backend/migrations.md
- @droidz/standards/backend/models.md
- @droidz/standards/backend/queries.md
- @droidz/standards/infrastructure/ci-cd.md
- @droidz/standards/infrastructure/deployment.md
- @droidz/standards/infrastructure/monitoring.md
- @droidz/standards/testing/test-writing.md
