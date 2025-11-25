# Implementation: Task Group 2 - Services Module Tests

## Task Assignment

### Task 2.1: Create API Client Adapter Tests

- **File to Test:** `src/lib/services/chat/api-client-adapter.ts`
- **Test File Location:** `__tests__/lib/services/chat/api-client-adapter.test.ts`
- **Current Coverage:** All metrics 0%
- **Key Test Cases:**
  - `listMessages()`: transforms response, handles null, maps timestamps, pagination
  - `postMessage()`: transforms creation response, handles null/error
  - `patchMessageMetadata()`: transforms update response, handles partial/error
  - Data transformation: null modelUsed, missing metadata, error objects
  - Edge cases: missing id, missing timestamp/createdAt, success: false
- **Estimated Effort:** 2-3 hours

### Task 2.2: Create Chat Services Index Test

- **File to Test:** `src/lib/services/chat/index.ts`
- **Test File Location:** `__tests__/lib/services/chat/index.test.ts`
- **Current Coverage:** Statements 0%, Lines 0%
- **Key Test Cases:**
  - Verify all expected exports are present
- **Estimated Effort:** 15 minutes

### Task 2.3: Create Error Handlers Tests

- **File to Test:** `src/lib/api/middleware/error-handlers.ts`
- **Test File Location:** `__tests__/lib/api/middleware/error-handlers.test.ts`
- **Current Coverage:** Statements 40%, Branches 0%, Functions 0%, Lines 33.33%
- **Key Test Cases:**
  - `handleDatabaseError()`: UNIQUE constraint → validation error
  - `handleDatabaseError()`: FOREIGN KEY constraint → validation error
  - `handleDatabaseError()`: unknown error → server error
  - Verify error logging with context
- **Estimated Effort:** 1 hour

## Context Files

Read these for requirements and patterns:

- spec: `droidz/specs/023-test-coverage-improvement/spec.md`
- requirements: `droidz/specs/023-test-coverage-improvement/planning/requirements.md`
- tasks: `droidz/specs/023-test-coverage-improvement/tasks.md`

Key files to study:

- `src/lib/services/chat/api-client-adapter.ts` - File to test
- `src/lib/services/chat/index.ts` - File to test
- `src/lib/api/middleware/error-handlers.ts` - File to test
- `__tests__/lib/services/chat/` - Existing service test patterns

## Instructions

1. Read the source files to understand the code structure
2. Study existing test patterns in `__tests__/lib/services/`
3. Mock `apiClient` from `@/lib/api/client` for adapter tests
4. Mock `createValidationErrorResponse`, `createServerErrorResponse` for error handlers
5. Test all response transformation paths
6. Run tests after each file: `npm test -- [test-file-path]`
7. Verify coverage improved: `npm run test:coverage`
8. Mark tasks complete with [x] in `droidz/specs/023-test-coverage-improvement/tasks.md`

## Standards

- Follow existing test patterns in `__tests__/`
- Use Jest for testing
- Mock external dependencies (apiClient, logger)
- Test null handling and error paths
- Cover all data transformation scenarios
