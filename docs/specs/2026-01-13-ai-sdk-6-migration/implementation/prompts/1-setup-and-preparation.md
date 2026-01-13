We're continuing our implementation of AI SDK 6 Migration by implementing task group number 1:

## Implement this task and its sub-tasks:

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
