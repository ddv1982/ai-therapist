# Implementation: Task Group 9 - Domain-Specific Tests

## Task Assignment

### Task 9.1: Improve Moon Calculations Tests

- **File to Test:** `src/lib/astronomy/moon.ts`
- **Test File Location:** `__tests__/lib/astronomy/moon.test.ts`
- **Current Coverage:** Statements 82.5%, Branches 58.82%, Functions 100%, Lines 90.9%
- **Target Coverage:** Branch coverage 80%+
- **Key Test Cases:**
  - Cover remaining ~41% of branches
  - Moon phase calculation edge cases
  - Date boundary conditions
  - Different moon phases throughout the month
  - Leap year handling
- **Estimated Effort:** 1.5 hours

### Task 9.2: Improve Web Vitals Tests

- **File to Test:** `src/lib/monitoring/web-vitals.ts`
- **Test File Location:** `__tests__/lib/monitoring/web-vitals.test.ts`
- **Current Coverage:** Statements 90.9%, Branches 68.18%, Functions 100%, Lines 90%
- **Target Coverage:** Branch coverage 85%+
- **Key Test Cases:**
  - Cover remaining ~32% of branches
  - Error handling branches
  - Edge cases in vitals reporting
  - Different metric types (CLS, FCP, LCP, TTFB, INP)
- **Estimated Effort:** 1 hour

## Context Files

Read these for requirements and patterns:

- spec: `droidz/specs/023-test-coverage-improvement/spec.md`
- requirements: `droidz/specs/023-test-coverage-improvement/planning/requirements.md`
- tasks: `droidz/specs/023-test-coverage-improvement/tasks.md`

Key files to study:

- `src/lib/astronomy/moon.ts` - File to test
- `src/lib/monitoring/web-vitals.ts` - File to test
- `__tests__/lib/astronomy/moon.test.ts` - Existing tests to extend
- `__tests__/lib/monitoring/web-vitals.test.ts` - Existing tests to extend

## Instructions

1. Run coverage to identify specific uncovered lines:
   ```bash
   npm run test:coverage -- --collectCoverageFrom='src/lib/astronomy/moon.ts'
   npm run test:coverage -- --collectCoverageFrom='src/lib/monitoring/web-vitals.ts'
   ```
2. Read existing tests to understand current coverage
3. Identify uncovered branches
4. Add tests for moon calculations:
   - Various dates throughout a lunar cycle
   - Edge cases at month boundaries
   - New moon, full moon, quarter phases
5. Add tests for web vitals:
   - All metric types
   - Error scenarios
   - Missing/invalid data handling
6. Run tests: `npm test -- __tests__/lib/astronomy/moon.test.ts __tests__/lib/monitoring/web-vitals.test.ts`
7. Verify coverage: `npm run test:coverage`
8. Mark tasks complete with [x] in `droidz/specs/023-test-coverage-improvement/tasks.md`

## Standards

- Extend existing test files, don't replace them
- Follow existing test structure
- Use fixed dates for deterministic moon tests
- Mock browser APIs for web vitals tests
- Test all conditional branches
