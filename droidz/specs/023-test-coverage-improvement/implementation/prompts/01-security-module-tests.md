# Implementation: Task Group 1 - Security Module Tests

## Task Assignment

### Task 1.1: Create CSP Config Tests

- **File to Test:** `src/lib/security/csp-config.ts`
- **Test File Location:** `__tests__/lib/security/csp-config.test.ts`
- **Current Coverage:** Statements 0%, Branches 100%, Functions 0%, Lines 0%
- **Key Test Cases:**
  - Verify `CSP_EXCEPTIONS` structure and required fields
  - Test `getExceptionsByCategory()` for auth, captcha, development categories
  - Test `getExceptionsByDirective()` for script-src, connect-src
  - Test `getProductionExceptions()` excludes devOnly
  - Test `getDevelopmentExceptions()` returns only devOnly
  - Edge case: empty category, unknown directive returns empty array
- **Estimated Effort:** 1-2 hours

### Task 1.2: Create CSP Violations Tests

- **File to Test:** `src/lib/security/csp-violations.ts`
- **Test File Location:** `__tests__/lib/security/csp-violations.test.ts`
- **Current Coverage:** All metrics 0%
- **Key Test Cases:**
  - `addCSPViolation()`: stores in dev mode, respects MAX_STORED_VIOLATIONS (100), newest first
  - `getCSPViolations()`: returns violations in dev, empty in prod, defensive copy
  - `getCSPViolationStats()`: zero stats when empty, counts by directive, counts by blocked URI
  - `clearCSPViolations()`: clears in dev, no-op in prod
  - Edge cases: invalid URLs, malformed violation data
- **Estimated Effort:** 2-3 hours

## Context Files

Read these for requirements and patterns:

- spec: `droidz/specs/023-test-coverage-improvement/spec.md`
- requirements: `droidz/specs/023-test-coverage-improvement/planning/requirements.md`
- tasks: `droidz/specs/023-test-coverage-improvement/tasks.md`

Key files to study:

- `src/lib/security/csp-config.ts` - File to test
- `src/lib/security/csp-violations.ts` - File to test
- `__tests__/lib/security/csp-nonce.test.ts` - Existing security test patterns

## Instructions

1. Read the source files to understand the code structure
2. Study existing test patterns in `__tests__/lib/security/`
3. Create test files following project conventions (Jest, `.test.ts` suffix)
4. Mock `isDevelopment` from `@/config/env.public` where needed
5. Cover all functions and edge cases
6. Run tests: `npm test -- __tests__/lib/security/csp-config.test.ts`
7. Run tests: `npm test -- __tests__/lib/security/csp-violations.test.ts`
8. Verify coverage improved: `npm run test:coverage`
9. Mark tasks complete with [x] in `droidz/specs/023-test-coverage-improvement/tasks.md`

## Standards

- Follow existing test patterns in `__tests__/`
- Use Jest for testing
- Mock external dependencies (env, logger)
- Test both success and error paths
- Cover edge cases (empty arrays, unknown values, invalid data)
