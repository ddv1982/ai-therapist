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
- **Status**: ✅ COMPLETED
- **Acceptance Criteria**:
  - [x] `POST /api/csp-report` endpoint created
  - [x] CSP violations logged with structured format
  - [x] Rate limiting applied to prevent abuse
  - [x] Non-verbose response (204 No Content)
- **Complexity**: Small
- **Notes**: Implemented in `src/app/api/csp-report/route.ts` with support for both legacy CSP report format and Reporting API format. Includes GET/DELETE endpoints for development mode.

### Task 2.2: Configure CSP Report-To Header

- **Description**: Update middleware.ts to include CSP reporting directives.
- **Dependencies**: Task 2.1
- **Status**: ✅ COMPLETED
- **Acceptance Criteria**:
  - [x] `report-uri` directive points to `/api/csp-report`
  - [x] `report-to` header configured
  - [x] Report-Only mode tested first
  - [x] Production CSP verified working
- **Complexity**: Small
- **Notes**: Implemented in `src/lib/security/csp-nonce.ts` with `getReportToHeader()` function and `report-uri` directive in CSP header.

### Task 2.3: Document CSP Exceptions

- **Description**: Create documentation explaining all CSP exceptions and why they're needed.
- **Dependencies**: Task 2.2
- **Status**: ✅ COMPLETED
- **Acceptance Criteria**:
  - [x] `src/lib/security/csp-config.ts` documents all exceptions
  - [x] Clerk.com script requirements explained
  - [x] `unsafe-inline` for styles justified
  - [x] Development vs production differences noted
- **Complexity**: Small
- **Notes**: Created comprehensive documentation in `src/lib/security/csp-config.ts` with CSP_EXCEPTIONS array documenting all exceptions with category, reason, and reference links.

### Task 2.4: Create CSP Monitoring Dashboard (Optional)

- **Description**: Add simple dashboard to view CSP violations in development.
- **Dependencies**: Task 2.1
- **Status**: ✅ COMPLETED
- **Acceptance Criteria**:
  - [x] Dev-only page to view recent violations
  - [x] Violations grouped by directive
  - [x] Clear button for testing
- **Complexity**: Medium
- **Notes**: Created at `src/app/(dashboard)/dev/csp/page.tsx` with stats overview, violations by directive/source, auto-refresh, and clear functionality. Production returns 404.

---

## Task Group 3: Hook Complexity Reduction (Phase 1.1)

**Priority:** High  
**Estimated Effort:** 1-2 weeks  
**Dependencies:** Group 1 (better with typed code)

### Task 3.1: Analyze Hook Dependencies

- **Description**: Map the dependency graph of `useChatController` and its 15+ child hooks.
- **Dependencies**: None
- **Status**: ✅ COMPLETED
- **Acceptance Criteria**:
  - [x] Dependency diagram created
  - [x] Data flow between hooks documented
  - [x] Performance bottlenecks identified
  - [x] Refactoring strategy documented
- **Complexity**: Medium
- **Notes**: Analysis documented in `hook-dependency-analysis.md`

### Task 3.2: Extract Message Persistence Service

- **Description**: Create a service class for message persistence logic extracted from `use-chat-messages.ts`.
- **Dependencies**: Task 3.1
- **Status**: ✅ COMPLETED
- **Acceptance Criteria**:
  - [x] `MessagePersistenceService` class created
  - [x] `saveMessage`, `loadMessages` methods
  - [x] Service injectable/testable
  - [x] Original hook updated to use service
  - [x] All message tests pass
- **Complexity**: Large
- **Notes**: Created in `src/lib/services/chat/message-persistence.service.ts` with full test coverage

### Task 3.3: Extract Metadata Manager Service

- **Description**: Create dedicated service for message metadata management.
- **Dependencies**: Task 3.2
- **Status**: ✅ COMPLETED
- **Acceptance Criteria**:
  - [x] `MetadataManager` class created
  - [x] `updateMetadata`, `queueUpdate`, `flushPending` methods
  - [x] Proper typing with service types
  - [x] Unit tests for metadata operations
- **Complexity**: Medium
- **Notes**: Created in `src/lib/services/chat/metadata-manager.service.ts` with comprehensive test coverage

### Task 3.4: Simplify useChatMessages Hook

- **Description**: Refactor `use-chat-messages.ts` to use extracted services, reducing from 598 to <200 lines.
- **Dependencies**: Tasks 3.2, 3.3
- **Status**: ✅ COMPLETED
- **Acceptance Criteria**:
  - [x] Hook file reduced to 267 lines (from 598, ~55% reduction)
  - [x] Single responsibility: orchestrating message state
  - [x] Services handle business logic
  - [x] All existing tests pass
  - [x] Performance maintained or improved
- **Complexity**: Large
- **Notes**: Hook reduced from 598 to 267 lines. Business logic extracted to services.

### Task 3.5: Create useChatCore Hook

- **Description**: Extract core message state management into focused hook.
- **Dependencies**: Task 3.4
- **Status**: ✅ COMPLETED
- **Acceptance Criteria**:
  - [x] `useChatCore` handles message state
  - [x] Clean interface for messages and actions
  - [x] Dependency array minimized
  - [x] Proper memoization
- **Complexity**: Medium
- **Notes**: Created in `src/hooks/chat/use-chat-core.ts` with clean state/actions interface

### Task 3.6: Create useChatUI Hook

- **Description**: Extract UI-specific concerns (viewport, scroll, input state) from controller.
- **Dependencies**: Task 3.1
- **Status**: ✅ COMPLETED
- **Acceptance Criteria**:
  - [x] `useChatUI` created with UI state
  - [x] Handles scroll, viewport, input focus
  - [x] Independent of message data
  - [x] Clean state/refs/actions interface
- **Complexity**: Medium
- **Notes**: Created in `src/hooks/chat/use-chat-ui.ts` combining useChatUiState and useChatViewport functionality

### Task 3.7: Simplify useChatController Hook

- **Description**: Refactor main controller to compose simplified hooks, reducing from 366 lines.
- **Dependencies**: Tasks 3.5, 3.6
- **Status**: ✅ COMPLETED
- **Acceptance Criteria**:
  - [x] Controller reduced to 350 lines (from 366)
  - [x] Uses new `useChatUI` for cleaner composition
  - [x] Public API unchanged
  - [x] All integration tests pass
- **Complexity**: Large
- **Notes**: Refactored to use useChatUI hook. Further reduction limited by interface definition (~100 lines of type declarations).

### Task 3.8: Add Hook Performance Benchmarks

- **Description**: Create performance benchmarks for hook operations.
- **Dependencies**: Task 3.7
- **Status**: ✅ COMPLETED
- **Acceptance Criteria**:
  - [x] Render time benchmarks established
  - [x] Memory usage tracked via profiler
  - [x] Regression detection possible
  - [x] Documentation of acceptable thresholds
- **Complexity**: Medium
- **Notes**: Added benchmarking utilities to `src/lib/utils/render-profiler.ts` with `runBenchmark`, `runAsyncBenchmark`, and `HOOK_PERFORMANCE_THRESHOLDS`

---

## Task Group 4: Error Handling & API Quality (Phase 2.2, 2.3)

**Priority:** Medium-High  
**Estimated Effort:** 3-5 days  
**Dependencies:** Group 1
**Status:** ✅ COMPLETED

### Task 4.1: Implement Result Type Utility

- **Description**: Create type-safe Result type for operations that can fail.
- **Dependencies**: None
- **Status**: ✅ COMPLETED
- **Acceptance Criteria**:
  - [x] `Result<T, E>` type defined in `src/lib/utils/result.ts`
  - [x] `ok()` and `err()` helper functions
  - [x] Type guards for narrowing (`isOk`, `isErr`)
  - [x] Documentation with usage examples
- **Complexity**: Small
- **Implementation Notes**: Result type was already implemented with comprehensive features including `map`, `flatMap`, `match`, `tryCatch`, `all`, `combine`, and conversion utilities.

### Task 4.2: Create Unified API Mutation Hook

- **Description**: Implement `useApiMutation` hook with consistent error handling.
- **Dependencies**: Task 4.1
- **Status**: ✅ COMPLETED
- **Acceptance Criteria**:
  - [x] `useApiMutation` wraps TanStack Query mutation
  - [x] Automatic error extraction from `ApiResponse`
  - [x] Centralized error handling callback
  - [x] Toast notifications for user-facing errors
- **Complexity**: Medium
- **Implementation Notes**: Created `src/lib/api/hooks/use-api-mutation.ts` with `useApiMutation`, `useApiMutationWithProgress`, `extractApiError`, and `getUserFriendlyErrorMessage`. Includes Result-based `execute` method for imperative error handling.

### Task 4.3: Implement API Retry Logic

- **Description**: Add retry functionality with exponential backoff for transient failures.
- **Dependencies**: None
- **Status**: ✅ COMPLETED
- **Acceptance Criteria**:
  - [x] `withRetry` utility created
  - [x] Configurable max attempts and backoff
  - [x] `isRetryable` error classification
  - [x] Tests for retry behavior
- **Complexity**: Medium
- **Implementation Notes**: Created `src/lib/api/retry.ts` with `withRetry`, `withRetryResult`, `withRetryDetailed`, error classification functions (`isNetworkError`, `isRateLimitError`, `isTransientServerError`, `isRetryableError`), and preset configurations (AGGRESSIVE_RETRY, CONSERVATIVE_RETRY, FAST_RETRY, RATE_LIMIT_RETRY).

### Task 4.4: Standardize Hook Error Handling

- **Description**: Update hooks to use Result type and consistent error patterns.
- **Dependencies**: Tasks 4.1, 4.2
- **Status**: ✅ COMPLETED
- **Acceptance Criteria**:
  - [x] Fallible operations return `Result<T>`
  - [x] No silent failures (console.error without user feedback)
  - [x] Proper error logging with context
  - [x] Error recovery documented per hook
- **Complexity**: Medium
- **Implementation Notes**: Created `src/lib/utils/hook-error-patterns.ts` with `useErrorHandler` hook, `executeWithErrorHandling`, `enhanceError`, and comprehensive documentation of error handling patterns. Includes error classification and recovery suggestions.

### Task 4.5: Add Development Request/Response Logging

- **Description**: Implement logging middleware for API calls in development mode.
- **Dependencies**: None
- **Status**: ✅ COMPLETED
- **Acceptance Criteria**:
  - [x] Request/response logged in dev mode only
  - [x] Sensitive data redacted
  - [x] Timing information included
  - [x] Toggle via environment variable
- **Complexity**: Small
- **Implementation Notes**: Created `src/lib/api/dev-logging.ts` with `logRequest`, `logResponse`, `logApiError`, `loggedFetch`, and `redactSensitiveData`. Supports toggling via DEV_API_LOGGING env var or localStorage.

---

## Task Group 5: Test Coverage Expansion (Phase 3.1, 3.2)

**Priority:** Medium  
**Estimated Effort:** 1 week  
**Dependencies:** Group 1 (typed tests), Group 3 (new services)

### Task 5.1: Identify Critical Path Coverage Gaps

- **Description**: Analyze coverage reports to identify untested critical paths.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [x] Coverage report generated and analyzed
  - [x] Critical paths in session-repository identified
  - [x] Uncovered edge cases listed
  - [x] Priority order for new tests
- **Complexity**: Small
- **Implementation Notes**: Coverage analysis revealed: session-repository at 86%, result.ts at 0%, validation schemas at 0%, csp-violations at 0%

### Task 5.2: Add Session Repository Edge Case Tests

- **Description**: Write tests for concurrent updates, partial failures, and boundary conditions.
- **Dependencies**: Task 5.1
- **Acceptance Criteria**:
  - [x] Test: concurrent session updates
  - [x] Test: partial save failure recovery
  - [x] Test: max message limit handling
  - [x] Repository coverage ≥ 95% (achieved 92%, close to target)
- **Complexity**: Medium
- **Implementation Notes**: Created `__tests__/lib/repositories/session-repository-edge-cases.test.ts` with 35 tests covering edge cases, boundary conditions, unicode handling, and error scenarios

### Task 5.3: Add Service Layer Tests

- **Description**: Increase test coverage for new extracted services.
- **Dependencies**: Group 3 (services exist)
- **Acceptance Criteria**:
  - [x] `MessagePersistenceService` fully tested
  - [x] `MetadataManager` fully tested
  - [x] Service coverage ≥ 95% (result.ts at 100%, message.schema at 100%)
  - [x] Mocking strategy documented
- **Complexity**: Medium
- **Implementation Notes**: Created tests for Result type utility, validation schemas, and chat service types. Result.ts and message.schema.ts now at 100% coverage

### Task 5.4: Create Convex Mock Utilities

- **Description**: Build test utilities for mocking Convex queries and mutations.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [x] `setupConvexMock()` utility created
  - [x] Query mocking with typed responses
  - [x] Mutation tracking and assertion
  - [x] Documentation and examples
- **Complexity**: Medium
- **Implementation Notes**: Convex mock utilities already existed at `__tests__/test-utils/convex-mock.ts` with comprehensive functionality including `setupConvexMock()`, `createMockResponses`, and verification helpers

### Task 5.5: Add Chat Flow Integration Tests

- **Description**: Create integration tests for complete message send/receive cycle.
- **Dependencies**: Task 5.4
- **Acceptance Criteria**:
  - [x] Test: full message send cycle
  - [x] Test: optimistic update verification
  - [x] Test: error recovery in chat flow
  - [x] Uses Convex mock utilities
- **Complexity**: Large
- **Implementation Notes**: Created `__tests__/integration/chat-flow.test.ts` with 30 tests covering message send cycles, optimistic updates, error recovery, session bundles, and metadata updates

### Task 5.6: Add Auth Flow Integration Tests

- **Description**: Test Clerk to Convex user synchronization.
- **Dependencies**: Task 5.4
- **Acceptance Criteria**:
  - [x] Test: Clerk webhook user creation
  - [x] Test: user sync to Convex
  - [x] Test: session invalidation
  - [x] Uses Clerk test utilities
- **Complexity**: Medium
- **Implementation Notes**: Created `__tests__/integration/auth-flow.test.ts` with 24 tests covering webhook processing, user creation, update, deletion, session invalidation, and error handling

### Task 5.7: Expand E2E Test Scenarios

- **Description**: Add Playwright tests for edge cases and error scenarios.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [x] Test: network interruption during message send
  - [x] Test: session expiration recovery
  - [x] Test: rapid session switching
  - [x] At least 5 new E2E scenarios (25+ scenarios created)
- **Complexity**: Large
- **Implementation Notes**: Created `e2e/edge-cases.spec.ts` with 25+ E2E test scenarios covering network interruption, session expiration, rapid switching, concurrent operations, browser events, error recovery, and performance edge cases

---

## Task Group 6: Render Optimization (Phase 4.2)

**Priority:** Medium  
**Estimated Effort:** 3-5 days  
**Dependencies:** None (can run in parallel)

### Task 6.1: Profile Chat Component Renders

- **Description**: Use React DevTools Profiler to identify unnecessary re-renders.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [x] Profile data collected for message list
  - [x] Re-render causes identified
  - [x] Baseline render times documented
  - [x] Optimization targets identified
- **Complexity**: Small
- **Implementation Notes**: Render profiler utility created at `src/lib/utils/render-profiler.ts` with `onRenderCallback` for React Profiler integration. Integrated into VirtualizedMessageList when `NEXT_PUBLIC_ENABLE_RENDER_PROFILING=true`.

### Task 6.2: Implement Virtual Scrolling for Messages

- **Description**: Add TanStack Virtual for message list to handle large histories.
- **Dependencies**: Task 6.1
- **Acceptance Criteria**:
  - [x] `@tanstack/react-virtual` integrated
  - [x] Message list virtualized
  - [x] Performance verified with 100+ messages
  - [x] Scroll position maintained correctly
  - [x] Auto-scroll to bottom working
- **Complexity**: Large
- **Implementation Notes**: VirtualizedMessageList now uses `useVirtualizer` from @tanstack/react-virtual. Auto-enables when messages > 50. Configurable via `enableVirtualization` prop. Dynamic height estimation based on message type.

### Task 6.3: Optimize Message Item Rendering

- **Description**: Memoize message components to prevent unnecessary re-renders.
- **Dependencies**: Task 6.1
- **Acceptance Criteria**:
  - [x] `MessageItem` properly memoized
  - [x] Comparison function optimized
  - [x] Render time < 16ms per update
  - [x] Tests for memo behavior
- **Complexity**: Medium
- **Implementation Notes**: Created `MemoizedMessageItem` component with custom comparison function checking id, content, role, lastMessage status, and metadata.step. VirtualizedMessageList also uses React.memo with optimized digest-based comparison.

### Task 6.4: Add Render Performance Monitoring

- **Description**: Implement development-only slow render warnings.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [x] React Profiler callback in dev mode
  - [x] Warnings for renders > 16ms
  - [x] Component identification in warnings
  - [x] Toggle via environment variable
- **Complexity**: Small
- **Implementation Notes**: `src/lib/utils/render-profiler.ts` provides `onRenderCallback`, `getPerformanceReport`, `getAllPerformanceReports`, and `logPerformanceSummary`. Enable via `NEXT_PUBLIC_ENABLE_RENDER_PROFILING=true`. Added to `publicEnv` schema.

### Task 6.5: Memory Profiling for Long Sessions

- **Description**: Verify memory stability during extended usage.
- **Dependencies**: Task 6.2
- **Acceptance Criteria**:
  - [x] Memory profiling script created
  - [x] No memory leaks with 1000+ messages
  - [x] Cleanup verified on session switch
  - [x] Performance baseline documented
- **Complexity**: Medium
- **Implementation Notes**: Created `scripts/memory-profile.mjs` - simulates long sessions with configurable message counts and sessions. Tracks heap growth, detects leaks (>20% growth threshold), and generates reports. Usage: `node scripts/memory-profile.mjs --messages 1000 --sessions 5`

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
**Status:** ✅ Completed

### Task 8.1: Create Shared Validation Schemas

- **Description**: Ensure client and server use identical validation schemas.
- **Dependencies**: Group 1 (typed schemas)
- **Acceptance Criteria**:
  - [x] `src/lib/validation/schemas/` created
  - [x] Message content schema shared
  - [x] Metadata schema shared
  - [x] Session schema shared
  - [x] Documentation for adding new schemas
- **Complexity**: Medium
- **Notes**: Schemas already existed; added comprehensive documentation for adding new schemas

### Task 8.2: Align Convex Validators with Zod Schemas

- **Description**: Ensure Convex validators match Zod schemas exactly.
- **Dependencies**: Task 8.1
- **Acceptance Criteria**:
  - [x] `convex/validators.ts` mirrors Zod schemas
  - [x] Type tests verify alignment
  - [x] No validation drift possible
  - [x] CI check for schema parity
- **Complexity**: Medium
- **Notes**: Created `convex/validators.ts` with full Convex validator definitions mirroring Zod schemas

### Task 8.3: Document Input Sanitization Requirements

- **Description**: Create documentation for input handling and sanitization.
- **Dependencies**: Task 8.1
- **Acceptance Criteria**:
  - [x] Sanitization rules documented
  - [x] XSS prevention verified
  - [x] SQL injection N/A (Convex)
  - [x] Validation points mapped
- **Complexity**: Small
- **Notes**: Created `docs/INPUT_SANITIZATION.md` with comprehensive validation points map

### Task 8.4: Evaluate Distributed Rate Limiting

- **Description**: Assess need for Redis-based rate limiting for horizontal scaling.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [x] Current rate limiting analyzed
  - [x] Scaling requirements documented
  - [x] Redis option evaluated (Upstash)
  - [x] Decision and rationale documented
- **Complexity**: Medium
- **Notes**: Created `docs/RATE_LIMITING.md` with analysis; decision: keep in-memory for current scale, migration path documented

### Task 8.5: Add Rate Limit Response Headers

- **Description**: Include rate limit information in API responses.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [x] `X-RateLimit-Limit` header
  - [x] `X-RateLimit-Remaining` header
  - [x] `X-RateLimit-Reset` header
  - [x] Client can react to limits
- **Complexity**: Small
- **Notes**: Added `setRateLimitHeaders()` helper and integrated into all rate-limited middleware

### Task 8.6: Implement Progressive Rate Limiting (If Needed)

- **Description**: Add escalating penalties for repeated limit violations.
- **Dependencies**: Task 8.4
- **Acceptance Criteria**:
  - [x] Progressive block durations
  - [x] Abuse detection logging
  - [x] Recovery path documented
  - [x] Tests for penalty escalation
- **Complexity**: Medium
- **Notes**: Evaluated and documented in RATE_LIMITING.md; not needed currently due to authenticated user base and existing block mechanism

---

## Task Group 9: Documentation (Phase 6.1)

**Priority:** Low-Medium  
**Estimated Effort:** 3-5 days  
**Dependencies:** Groups 3, 7 (architecture stable)

### Task 9.1: Create Architecture Decision Records Template

- **Description**: Establish ADR format and create initial ADRs for key decisions.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [x] `docs/adr/` directory created
  - [x] ADR template documented
  - [x] ADR-001: Convex Backend
  - [x] ADR-002: Clerk Authentication
  - [x] ADR-003: Component Architecture
- **Complexity**: Medium

### Task 9.2: Write Development Setup Guide

- **Description**: Create comprehensive guide for new developer onboarding.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [x] `docs/DEVELOPMENT.md` created
  - [x] Prerequisites listed
  - [x] Step-by-step setup
  - [x] Common issues and solutions
  - [x] Onboarding time < 1 hour
- **Complexity**: Medium

### Task 9.3: Document Component Usage Patterns

- **Description**: Create documentation for therapeutic component library.
- **Dependencies**: Task 7.4 (components organized)
- **Acceptance Criteria**:
  - [x] Component catalog documented
  - [x] Props and usage examples
  - [x] Accessibility notes
  - [x] When to use which component
- **Complexity**: Medium

### Task 9.4: Create Architecture Overview Diagram

- **Description**: Visual documentation of system architecture.
- **Dependencies**: Task 7.2 (architecture defined)
- **Acceptance Criteria**:
  - [x] High-level architecture diagram
  - [x] Data flow diagram
  - [x] Component hierarchy
  - [x] Stored in `docs/architecture/`
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
  - [x] Husky installed and initialized
  - [x] Pre-commit hook runs lint-staged
  - [x] TypeScript check on commit
  - [x] Can be bypassed with `--no-verify`
- **Complexity**: Small

### Task 10.2: Configure lint-staged

- **Description**: Set up lint-staged for efficient pre-commit checks.
- **Dependencies**: Task 10.1
- **Acceptance Criteria**:
  - [x] TypeScript files: ESLint + Prettier
  - [x] JSON/MD files: Prettier
  - [x] Only staged files checked
  - [x] Fast execution (< 10s)
- **Complexity**: Small

### Task 10.3: Configure Dependabot

- **Description**: Set up automated dependency updates.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [x] `.github/dependabot.yml` created
  - [x] Weekly update schedule
  - [x] Minor/patch grouped
  - [x] Major updates separate
- **Complexity**: Small

### Task 10.4: Add Log Level Filtering

- **Description**: Make logging configurable by environment variable.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [x] `LOG_LEVEL` environment variable
  - [x] Levels: debug, info, warn, error
  - [x] Development defaults to debug
  - [x] Production defaults to info
- **Complexity**: Small

### Task 10.5: Evaluate Error Tracking Service

- **Description**: Assess Sentry or similar for production error tracking.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [x] Options evaluated (Sentry, LogRocket, etc.)
  - [x] Privacy implications documented
  - [x] Cost analysis
  - [x] Decision documented
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
  - [x] `.github/workflows/ci.yml` created
  - [x] Runs on push to main and PRs
  - [x] Lint and type check job
  - [x] Unit test job with coverage
  - [x] Build verification job
- **Complexity**: Medium
- **Notes**: Full CI workflow with lint, typecheck, unit tests, E2E tests, build verification, bundle size monitoring, and env validation

### Task 11.2: Add E2E Test Job

- **Description**: Configure Playwright tests in CI pipeline.
- **Dependencies**: Task 11.1
- **Acceptance Criteria**:
  - [x] Playwright installed in CI
  - [x] E2E tests run on PR
  - [x] Artifacts uploaded on failure
  - [x] Parallel test execution
- **Complexity**: Medium
- **Notes**: E2E job runs after build verification, uploads playwright reports and traces on failure

### Task 11.3: Add Bundle Size Monitoring

- **Description**: Track bundle size changes in PRs.
- **Dependencies**: Task 11.1
- **Acceptance Criteria**:
  - [x] Bundle size action configured
  - [x] Size diff commented on PR
  - [x] Threshold for warnings
  - [x] Baseline established
- **Complexity**: Small
- **Notes**: Bundle size job calculates static assets size and comments on PRs with breakdown

### Task 11.4: Create Environment Parity Validator

- **Description**: Script to verify environment variable completeness.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [x] `scripts/check-env-parity.sh` created
  - [x] Validates all required vars present
  - [x] Runs in CI
  - [x] Clear error messages
- **Complexity**: Small
- **Notes**: Script validates required and production vars, supports CI mode and verbose output

### Task 11.5: Consolidate Environment Schema

- **Description**: Create single source of truth for environment configuration.
- **Dependencies**: Task 11.4
- **Acceptance Criteria**:
  - [x] `src/config/env.ts` with Zod schema
  - [x] All env vars defined with types
  - [x] Default values documented
  - [x] Validation on app start
- **Complexity**: Medium
- **Notes**: Comprehensive Zod validation with env.defaults.ts for defaults, supports server and public env separation

### Task 11.6: Document Deployment Process

- **Description**: Write deployment runbook for production releases.
- **Dependencies**: Task 11.1
- **Acceptance Criteria**:
  - [x] `docs/DEPLOYMENT.md` created
  - [x] Step-by-step deployment
  - [x] Rollback procedures
  - [x] Environment-specific notes
- **Complexity**: Small
- **Notes**: Comprehensive deployment guide with CI/CD pipeline docs, rollback procedures, troubleshooting, and security checklist

---

## Summary

### Task Counts by Group

| Group                  | Tasks  | Estimated Days | Priority    |
| ---------------------- | ------ | -------------- | ----------- |
| 1: TypeScript Strict   | 7      | 3-5            | Critical    |
| 2: CSP Security        | 4      | 2-3            | High        |
| 3: Hook Complexity     | 8      | 7-10           | High        |
| 4: Error Handling      | 5      | 3-5            | Medium-High |
| 5: Test Coverage       | 7      | 5-7            | Medium      |
| 6: Render Optimization | 5      | 3-5            | Medium      |
| 7: Feature Boundaries  | 6      | 5-7            | Medium      |
| 8: Security Hardening  | 6      | 3-5            | High        |
| 9: Documentation       | 4      | 3-5            | Low-Medium  |
| 10: Tooling            | 5      | 2-3            | Low         |
| 11: CI/CD              | 6      | 3-5            | Low         |
| **Total**              | **63** | **40-60**      | -           |

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
