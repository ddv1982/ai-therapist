# Implementation: Task Group 5 - Test Coverage Expansion

## Task Assignment

### Task 5.1: Identify Critical Path Coverage Gaps
- **Description**: Analyze coverage reports to identify untested critical paths.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] Coverage report generated and analyzed
  - [ ] Critical paths in session-repository identified
  - [ ] Uncovered edge cases listed
  - [ ] Priority order for new tests
- **Complexity**: Small

### Task 5.2: Add Session Repository Edge Case Tests
- **Description**: Write tests for concurrent updates, partial failures, and boundary conditions.
- **Dependencies**: Task 5.1
- **Acceptance Criteria**:
  - [ ] Test: concurrent session updates
  - [ ] Test: partial save failure recovery
  - [ ] Test: max message limit handling
  - [ ] Repository coverage ≥ 95%
- **Complexity**: Medium

### Task 5.3: Add Service Layer Tests
- **Description**: Increase test coverage for new extracted services.
- **Dependencies**: Group 3 (services exist)
- **Acceptance Criteria**:
  - [ ] `MessagePersistenceService` fully tested
  - [ ] `MetadataManager` fully tested
  - [ ] Service coverage ≥ 95%
  - [ ] Mocking strategy documented
- **Complexity**: Medium

### Task 5.4: Create Convex Mock Utilities
- **Description**: Build test utilities for mocking Convex queries and mutations.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] `setupConvexMock()` utility created
  - [ ] Query mocking with typed responses
  - [ ] Mutation tracking and assertion
  - [ ] Documentation and examples
- **Complexity**: Medium

### Task 5.5: Add Chat Flow Integration Tests
- **Description**: Create integration tests for complete message send/receive cycle.
- **Dependencies**: Task 5.4
- **Acceptance Criteria**:
  - [ ] Test: full message send cycle
  - [ ] Test: optimistic update verification
  - [ ] Test: error recovery in chat flow
  - [ ] Uses Convex mock utilities
- **Complexity**: Large

### Task 5.6: Add Auth Flow Integration Tests
- **Description**: Test Clerk to Convex user synchronization.
- **Dependencies**: Task 5.4
- **Acceptance Criteria**:
  - [ ] Test: Clerk webhook user creation
  - [ ] Test: user sync to Convex
  - [ ] Test: session invalidation
  - [ ] Uses Clerk test utilities
- **Complexity**: Medium

### Task 5.7: Expand E2E Test Scenarios
- **Description**: Add Playwright tests for edge cases and error scenarios.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] Test: network interruption during message send
  - [ ] Test: session expiration recovery
  - [ ] Test: rapid session switching
  - [ ] At least 5 new E2E scenarios
- **Complexity**: Large

## Context Files

Read these for requirements and patterns:
- spec: `droidz/specs/022-codebase-improvement-plan/spec.md`
- requirements: `droidz/specs/022-codebase-improvement-plan/planning/requirements.md`
- tasks: `droidz/specs/022-codebase-improvement-plan/tasks.md`

Key files to study:
- `__tests__/` - Existing test structure
- `__tests__/lib/repositories/` - Repository tests
- `e2e/` - Playwright E2E tests
- `jest.config.js` - Jest configuration

## Instructions

1. Read spec and requirements for testing context
2. Run `npm run test:coverage` to analyze current gaps
3. Study existing test patterns in `__tests__/`
4. Create mock utilities in `__tests__/test-utils/`
5. Write tests following existing conventions
6. Run tests: `npm run test`
7. Run E2E: `npm run test:e2e`
8. Mark tasks complete with [x] in `droidz/specs/022-codebase-improvement-plan/tasks.md`

## Standards

- Follow existing test patterns in `__tests__/`
- Use Jest for unit/integration tests
- Use Playwright for E2E tests
- Mock external services (Convex, Clerk)
- Aim for meaningful coverage, not just line coverage
- Document test strategies in comments
