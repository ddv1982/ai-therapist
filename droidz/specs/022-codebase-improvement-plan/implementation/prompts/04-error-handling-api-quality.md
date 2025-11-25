# Implementation: Task Group 4 - Error Handling & API Quality

## Task Assignment

### Task 4.1: Implement Result Type Utility

- **Description**: Create type-safe Result type for operations that can fail.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] `Result<T, E>` type defined in `src/lib/utils/result.ts`
  - [ ] `ok()` and `err()` helper functions
  - [ ] Type guards for narrowing
  - [ ] Documentation with usage examples
- **Complexity**: Small

### Task 4.2: Create Unified API Mutation Hook

- **Description**: Implement `useApiMutation` hook with consistent error handling.
- **Dependencies**: Task 4.1
- **Acceptance Criteria**:
  - [ ] `useApiMutation` wraps TanStack Query mutation
  - [ ] Automatic error extraction from `ApiResponse`
  - [ ] Centralized error handling callback
  - [ ] Toast notifications for user-facing errors
- **Complexity**: Medium

### Task 4.3: Implement API Retry Logic

- **Description**: Add retry functionality with exponential backoff for transient failures.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] `withRetry` utility created
  - [ ] Configurable max attempts and backoff
  - [ ] `isRetryable` error classification
  - [ ] Tests for retry behavior
- **Complexity**: Medium

### Task 4.4: Standardize Hook Error Handling

- **Description**: Update hooks to use Result type and consistent error patterns.
- **Dependencies**: Tasks 4.1, 4.2
- **Acceptance Criteria**:
  - [ ] Fallible operations return `Result<T>`
  - [ ] No silent failures (console.error without user feedback)
  - [ ] Proper error logging with context
  - [ ] Error recovery documented per hook
- **Complexity**: Medium

### Task 4.5: Add Development Request/Response Logging

- **Description**: Implement logging middleware for API calls in development mode.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] Request/response logged in dev mode only
  - [ ] Sensitive data redacted
  - [ ] Timing information included
  - [ ] Toggle via environment variable
- **Complexity**: Small

## Context Files

Read these for requirements and patterns:

- spec: `droidz/specs/022-codebase-improvement-plan/spec.md`
- requirements: `droidz/specs/022-codebase-improvement-plan/planning/requirements.md`
- tasks: `droidz/specs/022-codebase-improvement-plan/tasks.md`

Key files to study:

- `src/lib/api/api-response.ts` - Current ApiResponse type
- `src/lib/api/error-codes.ts` - Error code system
- `src/lib/utils/errors.ts` - Error utilities
- `src/hooks/` - Current hook error patterns

## Instructions

1. Read spec and requirements for error handling context
2. Study existing error handling patterns
3. Implement Result type first (foundation for other tasks)
4. Create unified hooks that wrap TanStack Query
5. Add retry logic with proper error classification
6. Run tests: `npm run test`
7. Run type check: `npx tsc --noEmit`
8. Mark tasks complete with [x] in `droidz/specs/022-codebase-improvement-plan/tasks.md`

## Standards

- Follow existing patterns in `src/lib/utils/`
- Use TanStack Query for data fetching
- Integrate with existing toast system (`src/components/ui/toast.tsx`)
- Use structured logging with the existing logger
- Keep development logging disabled in production
