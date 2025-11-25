# Implementation: Task Group 8 - Utility Tests

## Task Assignment

### Task 8.1: Improve Helpers Tests

- **File to Test:** `src/lib/utils/helpers.ts`
- **Test File Location:** `__tests__/lib/utils/helpers.test.ts`
- **Current Coverage:** Statements 88.75%, Branches 68.42%, Functions 86.44%, Lines 90.74%
- **Target Coverage:** Branch coverage 85%+, Function coverage 95%+
- **Key Test Cases:**
  - Cover remaining ~14% of functions
  - Cover remaining ~32% of branches
  - Edge cases for utility functions
  - Null/undefined handling
  - Boundary conditions
- **Estimated Effort:** 1.5 hours

### Task 8.2: Improve Validation Utils Tests

- **File to Test:** `src/lib/utils/validation.ts`
- **Test File Location:** `__tests__/lib/utils/validation.test.ts`
- **Current Coverage:** Statements 84.61%, Branches 66.66%, Functions 80%, Lines 96.29%
- **Target Coverage:** Branch coverage 85%+, Function coverage 95%+
- **Key Test Cases:**
  - Cover remaining ~20% of functions
  - Cover remaining ~33% of branches
  - Edge cases for validation logic
  - Invalid input handling
- **Estimated Effort:** 1 hour

## Context Files

Read these for requirements and patterns:

- spec: `droidz/specs/023-test-coverage-improvement/spec.md`
- requirements: `droidz/specs/023-test-coverage-improvement/planning/requirements.md`
- tasks: `droidz/specs/023-test-coverage-improvement/tasks.md`

Key files to study:

- `src/lib/utils/helpers.ts` - File to test
- `src/lib/utils/validation.ts` - File to test
- `__tests__/lib/utils/helpers.test.ts` - Existing tests to extend
- `__tests__/lib/utils/validation.test.ts` - Existing tests to extend

## Instructions

1. Run coverage to identify specific uncovered lines:
   ```bash
   npm run test:coverage -- --collectCoverageFrom='src/lib/utils/helpers.ts'
   npm run test:coverage -- --collectCoverageFrom='src/lib/utils/validation.ts'
   ```
2. Read existing tests to understand current coverage
3. Identify uncovered branches and functions
4. Add tests for helpers:
   - Uncovered utility functions
   - Edge cases (empty strings, null values, boundary numbers)
   - Branch conditions
5. Add tests for validation:
   - All validation functions
   - Invalid input scenarios
   - Boundary conditions
6. Run tests: `npm test -- __tests__/lib/utils/helpers.test.ts __tests__/lib/utils/validation.test.ts`
7. Verify coverage: `npm run test:coverage`
8. Mark tasks complete with [x] in `droidz/specs/023-test-coverage-improvement/tasks.md`

## Standards

- Extend existing test files, don't replace them
- Follow existing test structure
- Test edge cases thoroughly
- Test with various input types
- Verify error handling
