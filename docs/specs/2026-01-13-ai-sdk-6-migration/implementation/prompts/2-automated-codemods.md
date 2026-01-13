We're continuing our implementation of AI SDK 6 Migration by implementing task group number 2:

## Implement this task and its sub-tasks:

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
