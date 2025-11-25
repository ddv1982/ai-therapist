# Tasks List for AI Therapist Codebase Improvement Plan

**Created:** 2024-11-25  
**Total Estimated Effort:** 10-14 weeks  
**Priority Focus:** Type safety, security, maintainability, then developer experience

---

## Execution Strategy

### Parallel Tracks
Tasks are organized to allow parallel execution where possible:
- **Track A** (Type Safety): Groups 1, 4 → sequential dependency
- **Track B** (Security): Groups 2, 8 → sequential dependency
- **Track A+B Merge**: Group 3 (benefits from both)
- **Track C** (Testing): Group 5 → can start after Group 1
- **Track D** (Performance): Group 6 → independent
- **Track E** (Architecture): Group 7 → after Group 3
- **Track F** (DX): Groups 9, 10, 11 → sequential, depends on architecture work

### Critical Path
1 → 3 → 7 → 9 (Type Safety → Hooks → Features → Documentation)

---

## Task Group 1: TypeScript Strict Mode (Phase 2.1)

**Priority:** Critical  
**Estimated Effort:** 3-5 days  
**Dependencies:** None  
**Parallelizable With:** Group 2

### Task 1.1: Audit Current TypeScript Errors
- **Description**: Run `npx tsc --noImplicitAny` to identify all files with implicit any types and document the scope of work.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] Full list of files with `noImplicitAny` errors generated
  - [ ] Errors categorized by module (lib, features, hooks, etc.)
  - [ ] Estimated effort per module documented
- **Complexity**: Small

### Task 1.2: Define Metadata Type Schemas
- **Description**: Create proper TypeScript interfaces and Zod schemas for all metadata fields currently using `v.any()` in Convex schema.
- **Dependencies**: Task 1.1
- **Acceptance Criteria**:
  - [ ] `MessageMetadata` type defined with all valid fields
  - [ ] `ReportKeyPoint`, `TherapeuticInsight` types created
  - [ ] Zod schemas created that mirror the TypeScript types
  - [ ] Types exported from `src/types/therapy-metadata.ts`
- **Complexity**: Medium

### Task 1.3: Update Convex Schema Validators
- **Description**: Replace all `v.any()` usages in Convex schema with proper typed validators.
- **Dependencies**: Task 1.2
- **Acceptance Criteria**:
  - [ ] Zero `v.any()` in `convex/schema.ts`
  - [ ] `messageMetadataValidator` properly typed
  - [ ] `sessionReports` fields (keyPoints, therapeuticInsights, etc.) typed
  - [ ] All existing tests pass with new validators
- **Complexity**: Medium

### Task 1.4: Fix Implicit Any Errors in Hooks
- **Description**: Add proper type annotations to hooks directory files.
- **Dependencies**: Task 1.2
- **Acceptance Criteria**:
  - [ ] All files in `src/hooks/` pass `noImplicitAny`
  - [ ] Function parameters have explicit types
  - [ ] Return types documented where complex
  - [ ] No `as any` escape hatches added
- **Complexity**: Medium

### Task 1.5: Fix Implicit Any Errors in Features
- **Description**: Add proper type annotations to feature modules.
- **Dependencies**: Task 1.2
- **Acceptance Criteria**:
  - [ ] All files in `src/features/` pass `noImplicitAny`
  - [ ] Component props fully typed
  - [ ] Event handlers properly typed
- **Complexity**: Medium

### Task 1.6: Fix Implicit Any Errors in Lib/Utils
- **Description**: Add proper type annotations to library and utility files.
- **Dependencies**: Task 1.2
- **Acceptance Criteria**:
  - [ ] All files in `src/lib/` pass `noImplicitAny`
  - [ ] API response types complete
  - [ ] Utility function signatures typed
- **Complexity**: Medium

### Task 1.7: Enable noImplicitAny Permanently
- **Description**: Enable `noImplicitAny: true` in tsconfig.json and verify CI passes.
- **Dependencies**: Tasks 1.4, 1.5, 1.6
- **Acceptance Criteria**:
  - [ ] `tsconfig.json` has `noImplicitAny: true`
  - [ ] `npm run build` succeeds
  - [ ] `npx tsc --noEmit` passes
  - [ ] All 1529+ tests pass
- **Complexity**: Small

---

## Task Group 2: CSP & Security Visibility (Phase 5.1)

**Priority:** High  
**Estimated Effort:** 2-3 days  
**Dependencies:** None  
**Parallelizable With:** Group 1

### Task 2.1: Create CSP Violation Reporting Endpoint
- **Description**: Implement API endpoint to receive and log CSP violation reports.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] `POST /api/csp-report` endpoint created
  - [ ] CSP violations logged with structured format
  - [ ] Rate limiting applied to prevent abuse
  - [ ] Non-verbose response (204 No Content)
- **Complexity**: Small

### Task 2.2: Configure CSP Report-To Header
- **Description**: Update middleware.ts to include CSP reporting directives.
- **Dependencies**: Task 2.1
- **Acceptance Criteria**:
  - [ ] `report-uri` directive points to `/api/csp-report`
  - [ ] `report-to` header configured
  - [ ] Report-Only mode tested first
  - [ ] Production CSP verified working
- **Complexity**: Small

### Task 2.3: Document CSP Exceptions
- **Description**: Create documentation explaining all CSP exceptions and why they're needed.
- **Dependencies**: Task 2.2
- **Acceptance Criteria**:
  - [ ] `src/lib/security/csp-config.ts` documents all exceptions
  - [ ] Clerk.com script requirements explained
  - [ ] `unsafe-inline` for styles justified
  - [ ] Development vs production differences noted
- **Complexity**: Small

### Task 2.4: Create CSP Monitoring Dashboard (Optional)
- **Description**: Add simple dashboard to view CSP violations in development.
- **Dependencies**: Task 2.1
- **Acceptance Criteria**:
  - [ ] Dev-only page to view recent violations
  - [ ] Violations grouped by directive
  - [ ] Clear button for testing
- **Complexity**: Medium

---

## Task Group 3: Hook Complexity Reduction (Phase 1.1)

**Priority:** High  
**Estimated Effort:** 1-2 weeks  
**Dependencies:** Group 1 (better with typed code)

### Task 3.1: Analyze Hook Dependencies
- **Description**: Map the dependency graph of `useChatController` and its 15+ child hooks.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] Dependency diagram created
  - [ ] Data flow between hooks documented
  - [ ] Performance bottlenecks identified
  - [ ] Refactoring strategy documented
- **Complexity**: Medium

### Task 3.2: Extract Message Persistence Service
- **Description**: Create a service class for message persistence logic extracted from `use-chat-messages.ts`.
- **Dependencies**: Task 3.1
- **Acceptance Criteria**:
  - [ ] `MessagePersistenceService` class created
  - [ ] `saveMessage`, `loadMessages`, `deleteMessages` methods
  - [ ] Service injectable/testable
  - [ ] Original hook updated to use service
  - [ ] All message tests pass
- **Complexity**: Large

### Task 3.3: Extract Metadata Manager Service
- **Description**: Create dedicated service for message metadata management.
- **Dependencies**: Task 3.2
- **Acceptance Criteria**:
  - [ ] `MetadataManager` class created
  - [ ] `updateMessageMetadata`, `getMetadata` methods
  - [ ] Proper typing with `MessageMetadata` type
  - [ ] Unit tests for metadata operations
- **Complexity**: Medium

### Task 3.4: Simplify useChatMessages Hook
- **Description**: Refactor `use-chat-messages.ts` to use extracted services, reducing from 598 to <200 lines.
- **Dependencies**: Tasks 3.2, 3.3
- **Acceptance Criteria**:
  - [ ] Hook file under 200 lines
  - [ ] Single responsibility: orchestrating message state
  - [ ] Services handle business logic
  - [ ] All existing tests pass
  - [ ] Performance maintained or improved
- **Complexity**: Large

### Task 3.5: Create useChatCore Hook
- **Description**: Extract core message state management into focused hook.
- **Dependencies**: Task 3.4
- **Acceptance Criteria**:
  - [ ] `useChatCore` handles message state
  - [ ] Clean interface for messages and actions
  - [ ] Dependency array minimized
  - [ ] Proper memoization
- **Complexity**: Medium

### Task 3.6: Create useChatUI Hook
- **Description**: Extract UI-specific concerns (viewport, scroll, input state) from controller.
- **Dependencies**: Task 3.1
- **Acceptance Criteria**:
  - [ ] `useChatUI` created with UI state
  - [ ] Handles scroll, viewport, input focus
  - [ ] Independent of message data
  - [ ] Tests for UI state management
- **Complexity**: Medium

### Task 3.7: Simplify useChatController Hook
- **Description**: Refactor main controller to compose simplified hooks, reducing from 366 lines.
- **Dependencies**: Tasks 3.5, 3.6
- **Acceptance Criteria**:
  - [ ] Controller under 150 lines
  - [ ] Clear composition of `useChatCore`, `useChatUI`, `useChatSessionManager`
  - [ ] Public API unchanged
  - [ ] All integration tests pass
- **Complexity**: Large

### Task 3.8: Add Hook Performance Benchmarks
- **Description**: Create performance benchmarks for hook operations.
- **Dependencies**: Task 3.7
- **Acceptance Criteria**:
  - [ ] Render time benchmarks established
  - [ ] Memory usage tracked
  - [ ] Regression detection possible
  - [ ] Documentation of acceptable thresholds
- **Complexity**: Medium

---

## Task Group 4: Error Handling & API Quality (Phase 2.2, 2.3)

**Priority:** Medium-High  
**Estimated Effort:** 3-5 days  
**Dependencies:** Group 1

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

---

## Task Group 5: Test Coverage Expansion (Phase 3.1, 3.2)

**Priority:** Medium  
**Estimated Effort:** 1 week  
**Dependencies:** Group 1 (typed tests), Group 3 (new services)

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

---

## Task Group 6: Render Optimization (Phase 4.2)

**Priority:** Medium  
**Estimated Effort:** 3-5 days  
**Dependencies:** None (can run in parallel)

### Task 6.1: Profile Chat Component Renders
- **Description**: Use React DevTools Profiler to identify unnecessary re-renders.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] Profile data collected for message list
  - [ ] Re-render causes identified
  - [ ] Baseline render times documented
  - [ ] Optimization targets identified
- **Complexity**: Small

### Task 6.2: Implement Virtual Scrolling for Messages
- **Description**: Add TanStack Virtual for message list to handle large histories.
- **Dependencies**: Task 6.1
- **Acceptance Criteria**:
  - [ ] `@tanstack/react-virtual` integrated
  - [ ] Message list virtualized
  - [ ] Performance verified with 100+ messages
  - [ ] Scroll position maintained correctly
  - [ ] Auto-scroll to bottom working
- **Complexity**: Large

### Task 6.3: Optimize Message Item Rendering
- **Description**: Memoize message components to prevent unnecessary re-renders.
- **Dependencies**: Task 6.1
- **Acceptance Criteria**:
  - [ ] `MessageItem` properly memoized
  - [ ] Comparison function optimized
  - [ ] Render time < 16ms per update
  - [ ] Tests for memo behavior
- **Complexity**: Medium

### Task 6.4: Add Render Performance Monitoring
- **Description**: Implement development-only slow render warnings.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] React Profiler callback in dev mode
  - [ ] Warnings for renders > 16ms
  - [ ] Component identification in warnings
  - [ ] Toggle via environment variable
- **Complexity**: Small

### Task 6.5: Memory Profiling for Long Sessions
- **Description**: Verify memory stability during extended usage.
- **Dependencies**: Task 6.2
- **Acceptance Criteria**:
  - [ ] Memory profiling script created
  - [ ] No memory leaks with 1000+ messages
  - [ ] Cleanup verified on session switch
  - [ ] Performance baseline documented
- **Complexity**: Medium

---

## Task Group 7: Feature Boundaries & Components (Phase 1.2, 1.3)

**Priority:** Medium  
**Estimated Effort:** 1 week  
**Dependencies:** Group 3 (hook refactoring complete)

### Task 7.1: Document Current Module Boundaries
- **Description**: Create documentation of current feature module responsibilities and overlaps.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] Current structure documented
  - [ ] Overlaps between chat and therapy-chat identified
  - [ ] Business logic locations mapped
  - [ ] Circular dependencies detected
- **Complexity**: Small

### Task 7.2: Define Target Feature Architecture
- **Description**: Design the target state for feature module organization.
- **Dependencies**: Task 7.1
- **Acceptance Criteria**:
  - [ ] Decision: consolidate vs separate
  - [ ] Target directory structure documented
  - [ ] Module responsibilities clearly defined
  - [ ] Migration path outlined
- **Complexity**: Medium

### Task 7.3: Consolidate or Clarify therapy-chat Module
- **Description**: Either merge `therapy-chat` into appropriate modules or clarify its boundaries.
- **Dependencies**: Task 7.2
- **Acceptance Criteria**:
  - [ ] `therapy-chat` either removed or justified
  - [ ] No overlapping responsibilities
  - [ ] Imports updated throughout
  - [ ] All tests pass
- **Complexity**: Large

### Task 7.4: Reorganize Component Directory
- **Description**: Restructure `src/components/ui/` from 48 flat files to organized subdirectories.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] `primitives/` - base shadcn components
  - [ ] `therapeutic/` - therapy-specific components
  - [ ] `composed/` - compound components
  - [ ] Index files for clean imports
  - [ ] All imports updated
- **Complexity**: Large

### Task 7.5: Standardize Component Naming
- **Description**: Apply consistent naming convention to all components.
- **Dependencies**: Task 7.4
- **Acceptance Criteria**:
  - [ ] PascalCase for component files
  - [ ] Consistent therapeutic component prefix
  - [ ] Directory names match component categories
  - [ ] Documentation updated
- **Complexity**: Medium

### Task 7.6: Create Feature Barrel Exports
- **Description**: Add index.ts files for clean feature imports.
- **Dependencies**: Task 7.3
- **Acceptance Criteria**:
  - [ ] Each feature has `index.ts`
  - [ ] Public API explicitly exported
  - [ ] Internal modules kept private
  - [ ] Import paths simplified
- **Complexity**: Small

---

## Task Group 8: Security Hardening (Phase 5.2, 5.3)

**Priority:** High  
**Estimated Effort:** 3-5 days  
**Dependencies:** Group 2 (CSP monitoring)

### Task 8.1: Create Shared Validation Schemas
- **Description**: Ensure client and server use identical validation schemas.
- **Dependencies**: Group 1 (typed schemas)
- **Acceptance Criteria**:
  - [ ] `src/lib/validation/schemas/` created
  - [ ] Message content schema shared
  - [ ] Metadata schema shared
  - [ ] Session schema shared
  - [ ] Documentation for adding new schemas
- **Complexity**: Medium

### Task 8.2: Align Convex Validators with Zod Schemas
- **Description**: Ensure Convex validators match Zod schemas exactly.
- **Dependencies**: Task 8.1
- **Acceptance Criteria**:
  - [ ] `convex/validators.ts` mirrors Zod schemas
  - [ ] Type tests verify alignment
  - [ ] No validation drift possible
  - [ ] CI check for schema parity
- **Complexity**: Medium

### Task 8.3: Document Input Sanitization Requirements
- **Description**: Create documentation for input handling and sanitization.
- **Dependencies**: Task 8.1
- **Acceptance Criteria**:
  - [ ] Sanitization rules documented
  - [ ] XSS prevention verified
  - [ ] SQL injection N/A (Convex)
  - [ ] Validation points mapped
- **Complexity**: Small

### Task 8.4: Evaluate Distributed Rate Limiting
- **Description**: Assess need for Redis-based rate limiting for horizontal scaling.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] Current rate limiting analyzed
  - [ ] Scaling requirements documented
  - [ ] Redis option evaluated (Upstash)
  - [ ] Decision and rationale documented
- **Complexity**: Medium

### Task 8.5: Add Rate Limit Response Headers
- **Description**: Include rate limit information in API responses.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] `X-RateLimit-Limit` header
  - [ ] `X-RateLimit-Remaining` header
  - [ ] `X-RateLimit-Reset` header
  - [ ] Client can react to limits
- **Complexity**: Small

### Task 8.6: Implement Progressive Rate Limiting (If Needed)
- **Description**: Add escalating penalties for repeated limit violations.
- **Dependencies**: Task 8.4
- **Acceptance Criteria**:
  - [ ] Progressive block durations
  - [ ] Abuse detection logging
  - [ ] Recovery path documented
  - [ ] Tests for penalty escalation
- **Complexity**: Medium

---

## Task Group 9: Documentation (Phase 6.1)

**Priority:** Low-Medium  
**Estimated Effort:** 3-5 days  
**Dependencies:** Groups 3, 7 (architecture stable)

### Task 9.1: Create Architecture Decision Records Template
- **Description**: Establish ADR format and create initial ADRs for key decisions.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] `docs/adr/` directory created
  - [ ] ADR template documented
  - [ ] ADR-001: Convex Backend
  - [ ] ADR-002: Clerk Authentication
  - [ ] ADR-003: Component Architecture
- **Complexity**: Medium

### Task 9.2: Write Development Setup Guide
- **Description**: Create comprehensive guide for new developer onboarding.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] `docs/DEVELOPMENT.md` created
  - [ ] Prerequisites listed
  - [ ] Step-by-step setup
  - [ ] Common issues and solutions
  - [ ] Onboarding time < 1 hour
- **Complexity**: Medium

### Task 9.3: Document Component Usage Patterns
- **Description**: Create documentation for therapeutic component library.
- **Dependencies**: Task 7.4 (components organized)
- **Acceptance Criteria**:
  - [ ] Component catalog documented
  - [ ] Props and usage examples
  - [ ] Accessibility notes
  - [ ] When to use which component
- **Complexity**: Medium

### Task 9.4: Create Architecture Overview Diagram
- **Description**: Visual documentation of system architecture.
- **Dependencies**: Task 7.2 (architecture defined)
- **Acceptance Criteria**:
  - [ ] High-level architecture diagram
  - [ ] Data flow diagram
  - [ ] Component hierarchy
  - [ ] Stored in `docs/architecture/`
- **Complexity**: Small

---

## Task Group 10: Tooling & Developer Experience (Phase 6.2, 6.3)

**Priority:** Low  
**Estimated Effort:** 2-3 days  
**Dependencies:** None (can run in parallel)

### Task 10.1: Add Husky Pre-commit Hooks
- **Description**: Install and configure Husky for pre-commit validation.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] Husky installed and initialized
  - [ ] Pre-commit hook runs lint-staged
  - [ ] TypeScript check on commit
  - [ ] Can be bypassed with `--no-verify`
- **Complexity**: Small

### Task 10.2: Configure lint-staged
- **Description**: Set up lint-staged for efficient pre-commit checks.
- **Dependencies**: Task 10.1
- **Acceptance Criteria**:
  - [ ] TypeScript files: ESLint + Prettier
  - [ ] JSON/MD files: Prettier
  - [ ] Only staged files checked
  - [ ] Fast execution (< 10s)
- **Complexity**: Small

### Task 10.3: Configure Dependabot
- **Description**: Set up automated dependency updates.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] `.github/dependabot.yml` created
  - [ ] Weekly update schedule
  - [ ] Minor/patch grouped
  - [ ] Major updates separate
- **Complexity**: Small

### Task 10.4: Add Log Level Filtering
- **Description**: Make logging configurable by environment variable.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] `LOG_LEVEL` environment variable
  - [ ] Levels: debug, info, warn, error
  - [ ] Development defaults to debug
  - [ ] Production defaults to info
- **Complexity**: Small

### Task 10.5: Evaluate Error Tracking Service
- **Description**: Assess Sentry or similar for production error tracking.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] Options evaluated (Sentry, LogRocket, etc.)
  - [ ] Privacy implications documented
  - [ ] Cost analysis
  - [ ] Decision documented
- **Complexity**: Small

---

## Task Group 11: CI/CD Pipeline (Phase 7.1, 7.2)

**Priority:** Low  
**Estimated Effort:** 3-5 days  
**Dependencies:** Groups 9, 10 (tooling ready)

### Task 11.1: Create GitHub Actions Workflow
- **Description**: Implement CI pipeline for automated testing and building.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] `.github/workflows/ci.yml` created
  - [ ] Runs on push to main and PRs
  - [ ] Lint and type check job
  - [ ] Unit test job with coverage
  - [ ] Build verification job
- **Complexity**: Medium

### Task 11.2: Add E2E Test Job
- **Description**: Configure Playwright tests in CI pipeline.
- **Dependencies**: Task 11.1
- **Acceptance Criteria**:
  - [ ] Playwright installed in CI
  - [ ] E2E tests run on PR
  - [ ] Artifacts uploaded on failure
  - [ ] Parallel test execution
- **Complexity**: Medium

### Task 11.3: Add Bundle Size Monitoring
- **Description**: Track bundle size changes in PRs.
- **Dependencies**: Task 11.1
- **Acceptance Criteria**:
  - [ ] Bundle size action configured
  - [ ] Size diff commented on PR
  - [ ] Threshold for warnings
  - [ ] Baseline established
- **Complexity**: Small

### Task 11.4: Create Environment Parity Validator
- **Description**: Script to verify environment variable completeness.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] `scripts/check-env-parity.sh` created
  - [ ] Validates all required vars present
  - [ ] Runs in CI
  - [ ] Clear error messages
- **Complexity**: Small

### Task 11.5: Consolidate Environment Schema
- **Description**: Create single source of truth for environment configuration.
- **Dependencies**: Task 11.4
- **Acceptance Criteria**:
  - [ ] `src/config/env.ts` with Zod schema
  - [ ] All env vars defined with types
  - [ ] Default values documented
  - [ ] Validation on app start
- **Complexity**: Medium

### Task 11.6: Document Deployment Process
- **Description**: Write deployment runbook for production releases.
- **Dependencies**: Task 11.1
- **Acceptance Criteria**:
  - [ ] `docs/DEPLOYMENT.md` created
  - [ ] Step-by-step deployment
  - [ ] Rollback procedures
  - [ ] Environment-specific notes
- **Complexity**: Small

---

## Summary

### Task Counts by Group

| Group | Tasks | Estimated Days | Priority |
|-------|-------|----------------|----------|
| 1: TypeScript Strict | 7 | 3-5 | Critical |
| 2: CSP Security | 4 | 2-3 | High |
| 3: Hook Complexity | 8 | 7-10 | High |
| 4: Error Handling | 5 | 3-5 | Medium-High |
| 5: Test Coverage | 7 | 5-7 | Medium |
| 6: Render Optimization | 5 | 3-5 | Medium |
| 7: Feature Boundaries | 6 | 5-7 | Medium |
| 8: Security Hardening | 6 | 3-5 | High |
| 9: Documentation | 4 | 3-5 | Low-Medium |
| 10: Tooling | 5 | 2-3 | Low |
| 11: CI/CD | 6 | 3-5 | Low |
| **Total** | **63** | **40-60** | - |

### Parallelization Opportunities

```
Week 1-2:  [Group 1: TypeScript] ─────────────────┐
           [Group 2: CSP] ────────────────────────┼─→ Merge
                                                  │
Week 3-4:  [Group 3: Hooks] ──────────────────────┘
           [Group 6: Render] (parallel) ──────────────────────────┐
                                                                  │
Week 5-6:  [Group 4: Errors] ─────────────────────────────────────┤
           [Group 5: Tests] ──────────────────────────────────────┤
                                                                  │
Week 7-8:  [Group 7: Features] ───────────────────────────────────┤
           [Group 8: Security] ───────────────────────────────────┘
                                                                  
Week 9-10: [Group 9: Docs] ───────────────────────────────────────┐
           [Group 10: Tooling] (parallel) ────────────────────────┤
           [Group 11: CI/CD] ─────────────────────────────────────┘
```

### Risk Mitigation Checklist

- [ ] Feature branch per task group
- [ ] PR review required for merge
- [ ] All tests pass before merge
- [ ] Rollback plan documented
- [ ] CSP monitoring active before major changes
- [ ] Performance benchmarks established early

### Dependencies to Install (Optional)

```json
{
  "devDependencies": {
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0"
  },
  "dependencies": {
    "@tanstack/react-virtual": "^3.0.0",
    "@upstash/redis": "^1.0.0"
  }
}
```

Note: `@sentry/nextjs` pending evaluation in Task 10.5.
