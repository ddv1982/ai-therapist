# Implementation: Task Group 4 - Validation Schema Tests

## Task Assignment

### Task 4.1: Create Report Schema Tests

- **File to Test:** `src/lib/validation/schemas/report.schema.ts`
- **Test File Location:** `__tests__/lib/validation/schemas/report.schema.test.ts`
- **Current Coverage:** Statements 0%, Lines 0%
- **Key Test Cases:**
  - `severityLevelSchema`: accepts low/moderate/high, rejects invalid
  - `keyPointSchema`: valid structure, topic max length, relevance enum
  - `therapeuticInsightSchema`: valid insight, confidence range 0-100
  - `patternIdentifiedSchema`: valid pattern, frequency 0-10, severity enum
  - `actionItemSchema`: valid item, priority enum, optional timeframe
  - `cognitiveDistortionSchema`: valid distortion, optional examples
  - `schemaAnalysisSchema`: valid analysis, all optional fields
  - `reportGenerationSchema`: valid request, min 1 message, max 1000 messages
  - `sessionReportSchema`: complete valid report, nested validation
- **Estimated Effort:** 3-4 hours

### Task 4.2: Create Session Schema Tests

- **File to Test:** `src/lib/validation/schemas/session.schema.ts`
- **Test File Location:** `__tests__/lib/validation/schemas/session.schema.test.ts`
- **Current Coverage:** Statements 0%, Functions 0%, Lines 0%
- **Key Test Cases:**
  - `sessionStatusSchema`: accepts active/completed, rejects invalid
  - `sessionTitleSchema`: valid title, trims whitespace, empty rejection, max 200 chars
  - `createSessionSchema`: valid creation, requires title
  - `updateSessionSchema`: partial updates, requires at least one field, endedAt validation
  - `sessionIdSchema`: valid ID, rejects empty
  - `sessionSchema`: complete valid session, timestamps as positive integers
- **Estimated Effort:** 2-3 hours

### Task 4.3: Create Validation Schemas Index Test

- **File to Test:** `src/lib/validation/schemas/index.ts`
- **Test File Location:** `__tests__/lib/validation/schemas/index.test.ts`
- **Current Coverage:** Statements 0%, Lines 0%
- **Key Test Cases:**
  - Verify all expected schema exports
- **Estimated Effort:** 15 minutes

### Task 4.4: Create API Hooks Index Test

- **File to Test:** `src/lib/api/hooks/index.ts`
- **Test File Location:** `__tests__/lib/api/hooks/index.test.ts`
- **Current Coverage:** Statements 0%, Lines 0%
- **Key Test Cases:**
  - Verify all expected hook exports
- **Estimated Effort:** 15 minutes

## Context Files

Read these for requirements and patterns:

- spec: `droidz/specs/023-test-coverage-improvement/spec.md`
- requirements: `droidz/specs/023-test-coverage-improvement/planning/requirements.md`
- tasks: `droidz/specs/023-test-coverage-improvement/tasks.md`

Key files to study:

- `src/lib/validation/schemas/report.schema.ts` - File to test
- `src/lib/validation/schemas/session.schema.ts` - File to test
- `__tests__/lib/validation/schemas/message.schema.test.ts` - Existing schema test patterns

## Instructions

1. Read the source files to understand all schema exports
2. Study existing schema test patterns in `__tests__/lib/validation/`
3. Use Zod's `safeParse()` method for testing
4. Test valid inputs return `success: true`
5. Test invalid inputs return `success: false` with correct error messages
6. Test boundary conditions (min, max, ranges)
7. Test transform behaviors (trim, etc.)
8. Run tests: `npm test -- __tests__/lib/validation/schemas/`
9. Verify coverage: `npm run test:coverage`
10. Mark tasks complete with [x] in `droidz/specs/023-test-coverage-improvement/tasks.md`

## Standards

- Use `schema.safeParse()` for validation testing
- Test both valid and invalid inputs
- Verify error messages contain expected text
- Test all boundary conditions
- Test optional fields with undefined/null
