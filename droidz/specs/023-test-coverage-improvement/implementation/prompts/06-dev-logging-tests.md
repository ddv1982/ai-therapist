# Implementation: Task Group 6 - Dev Logging Tests

## Task Assignment

### Task 6.1: Improve Dev Logging Tests

- **File to Test:** `src/lib/api/dev-logging.ts`
- **Test File Location:** `__tests__/lib/api/dev-logging.test.ts`
- **Current Coverage:** Statements 59.85%, Branches 64.95%, Functions 50%, Lines 61.6%
- **Target Coverage:** Statements 85%+, Branches 80%+, Functions 90%+
- **Key Test Cases:**
  - Cover remaining ~40% of statements
  - Cover remaining ~35% of branches (conditional logging paths)
  - Cover remaining ~50% of functions
  - Test various log levels and formatting options
  - Test request/response logging
  - Test sensitive data redaction
- **Estimated Effort:** 2 hours

## Context Files

Read these for requirements and patterns:

- spec: `droidz/specs/023-test-coverage-improvement/spec.md`
- requirements: `droidz/specs/023-test-coverage-improvement/planning/requirements.md`
- tasks: `droidz/specs/023-test-coverage-improvement/tasks.md`

Key files to study:

- `src/lib/api/dev-logging.ts` - File to test
- `__tests__/lib/api/dev-logging.test.ts` - Existing tests to extend

## Instructions

1. Run coverage to identify specific uncovered lines:
   ```bash
   npm run test:coverage -- --collectCoverageFrom='src/lib/api/dev-logging.ts'
   ```
2. Read existing tests to understand current coverage
3. Identify uncovered branches and functions
4. Add tests for:
   - Uncovered conditional paths
   - Different log level scenarios
   - Edge cases in formatting
   - Request/response object variations
5. Run tests: `npm test -- __tests__/lib/api/dev-logging.test.ts`
6. Verify coverage improved: `npm run test:coverage`
7. Mark tasks complete with [x] in `droidz/specs/023-test-coverage-improvement/tasks.md`

## Standards

- Extend existing test file, don't replace it
- Follow existing test structure and patterns
- Mock environment variables as needed
- Test all conditional branches
- Verify logging output format
