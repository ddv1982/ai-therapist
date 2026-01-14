We're continuing our implementation of AI SDK 6 Migration by implementing task group number 5:

## Implement this task and its sub-tasks:

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
