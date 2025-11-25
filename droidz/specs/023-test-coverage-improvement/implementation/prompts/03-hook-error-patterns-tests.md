# Implementation: Task Group 3 - Hook Error Patterns Tests

## Task Assignment

### Task 3.1: Create Hook Error Patterns Tests

- **File to Test:** `src/lib/utils/hook-error-patterns.ts`
- **Test File Location:** `__tests__/lib/utils/hook-error-patterns.test.tsx`
- **Current Coverage:** All metrics 0%
- **Key Test Cases:**
  - `enhanceError()`: enhances Error objects, converts non-Error, preserves original
  - `executeWithErrorHandling()`: ok result on success, err on failure, logs errors, shows toast
  - `executeWithErrorHandlingSync()`: sync success/failure handling
  - `useErrorHandler` hook: provides execute, executeSync, handleError, showSuccess
  - `unwrapOrThrow()`: returns data for ok, throws for err
  - `resultToNullable()`: returns data for ok, null for err
  - `isRecoverableError()`: true for retryable, external_api; false otherwise
  - `getErrorRecoveryAction()`: login for auth, retry for retryable, refresh for system, contact_support default
- **Estimated Effort:** 4-5 hours

**Note:** This file uses `'use client'` directive - tests must be in `.test.tsx` format and use React testing utilities.

## Context Files

Read these for requirements and patterns:

- spec: `droidz/specs/023-test-coverage-improvement/spec.md`
- requirements: `droidz/specs/023-test-coverage-improvement/planning/requirements.md`
- tasks: `droidz/specs/023-test-coverage-improvement/tasks.md`

Key files to study:

- `src/lib/utils/hook-error-patterns.ts` - File to test
- `__tests__/hooks/` - Existing hook test patterns
- `__tests__/lib/utils/result.test.ts` - Related Result type tests

## Instructions

1. Read the source file to understand all exports and their behavior
2. Study existing hook test patterns using `renderHook` and `act`
3. Create test file as `.test.tsx` (React component testing)
4. Mock dependencies:
   - `@/hooks/use-toast` (showToast)
   - `@/lib/utils/logger` (logger)
   - `@/lib/utils/errors` (classifyError, getErrorMessage)
5. Test the hook with `renderHook` from `@testing-library/react`
6. Test utility functions directly
7. Cover async operations with `act()` wrapper
8. Run tests: `npm test -- __tests__/lib/utils/hook-error-patterns.test.tsx`
9. Verify coverage: `npm run test:coverage`
10. Mark tasks complete with [x] in `droidz/specs/023-test-coverage-improvement/tasks.md`

## Standards

- Use `.test.tsx` extension for React hook tests
- Import `renderHook`, `act` from `@testing-library/react`
- Mock all external hooks and utilities
- Test both success and error scenarios
- Verify toast notifications are shown correctly
- Test error classification and recovery actions
