We're continuing our implementation of AI SDK 6 Migration by implementing task group number 4:

## Implement this task and its sub-tasks:

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
