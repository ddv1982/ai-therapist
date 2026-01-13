We're continuing our implementation of AI SDK 6 Migration by implementing task group number 6:

## Implement this task and its sub-tasks:

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
