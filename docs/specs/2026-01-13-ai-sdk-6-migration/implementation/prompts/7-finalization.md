We're continuing our implementation of AI SDK 6 Migration by implementing task group number 7:

## Implement this task and its sub-tasks:

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
