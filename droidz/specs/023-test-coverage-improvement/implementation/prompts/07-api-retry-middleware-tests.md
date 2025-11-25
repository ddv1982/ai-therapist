# Implementation: Task Group 7 - API Retry & Middleware Tests

## Task Assignment

### Task 7.1: Improve Retry Logic Tests

- **File to Test:** `src/lib/api/retry.ts`
- **Test File Location:** `__tests__/lib/api/retry.test.ts`
- **Current Coverage:** Statements 78.72%, Branches 63.82%, Functions 100%, Lines 82.78%
- **Target Coverage:** Branch coverage 85%+
- **Key Test Cases:**
  - Cover remaining ~36% of branches
  - Test all retry condition variations
  - Edge cases: max retries reached, backoff timing
  - Error types that trigger vs skip retry
  - Timeout scenarios
- **Estimated Effort:** 2 hours

### Task 7.2: Improve Middleware Tests

- **File to Test:** `src/lib/api/middleware.ts`
- **Test File Location:** `__tests__/lib/api/middleware.test.ts`
- **Current Coverage:** Statements 79.08%, Branches 66.49%, Functions 66.66%, Lines 79.53%
- **Target Coverage:** Statements 85%+, Branches 80%+, Functions 90%+
- **Key Test Cases:**
  - Cover remaining ~34% of functions
  - Cover additional middleware branches
  - Error handling paths
  - Authentication/authorization branches
  - Rate limiting scenarios
- **Estimated Effort:** 2-3 hours

## Context Files

Read these for requirements and patterns:

- spec: `droidz/specs/023-test-coverage-improvement/spec.md`
- requirements: `droidz/specs/023-test-coverage-improvement/planning/requirements.md`
- tasks: `droidz/specs/023-test-coverage-improvement/tasks.md`

Key files to study:

- `src/lib/api/retry.ts` - File to test
- `src/lib/api/middleware.ts` - File to test
- `__tests__/lib/api/retry.test.ts` - Existing tests to extend
- `__tests__/lib/api/middleware.test.ts` - Existing tests to extend

## Instructions

1. Run coverage to identify specific uncovered lines:
   ```bash
   npm run test:coverage -- --collectCoverageFrom='src/lib/api/retry.ts'
   npm run test:coverage -- --collectCoverageFrom='src/lib/api/middleware.ts'
   ```
2. Read existing tests to understand current coverage
3. Identify uncovered branches and functions
4. Add tests for retry logic:
   - Different error types (retryable vs non-retryable)
   - Max retry limit reached
   - Backoff calculation
   - Abort scenarios
5. Add tests for middleware:
   - All middleware wrapper functions
   - Error handling branches
   - Auth validation paths
6. Run tests: `npm test -- __tests__/lib/api/retry.test.ts __tests__/lib/api/middleware.test.ts`
7. Verify coverage: `npm run test:coverage`
8. Mark tasks complete with [x] in `droidz/specs/023-test-coverage-improvement/tasks.md`

## Standards

- Extend existing test files, don't replace them
- Follow existing test structure
- Mock async operations for timing control
- Test all error paths
- Verify retry counts and delays
