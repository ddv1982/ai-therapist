# Codebase Improvement Plan - Requirements

## Overview

This document outlines areas for improvement identified during a comprehensive code review of the AI Therapist application. The improvements are organized into phases based on priority, complexity, and dependencies.

---

## Phase 1: Code Architecture & Organization (High Priority)

### 1.1 Hook Complexity Reduction
**Current State:**
- `use-chat-controller.ts` (11KB, 320 lines) - orchestrates 15+ hooks
- `use-chat-messages.ts` (20KB, 598 lines) - handles message state, persistence, metadata
- These hooks have grown complex and handle multiple concerns

**Issues:**
- Difficult to test individual concerns
- Hard to reason about data flow
- Performance implications from large dependency arrays

**Improvement Areas:**
- Extract message persistence into separate service
- Create dedicated hooks for metadata management
- Simplify dependency chains between hooks

### 1.2 Feature Module Boundaries
**Current State:**
- `src/features/chat/` - chat UI components
- `src/features/therapy/` - therapy-specific features
- `src/features/therapy-chat/` - overlapping concerns with chat
- `src/lib/chat/` - chat utilities that could be in features

**Issues:**
- Unclear separation between `features/chat` and `features/therapy-chat`
- Business logic scattered between `src/lib` and `src/features`
- Some utilities in `src/lib/chat/` are tightly coupled to features

**Improvement Areas:**
- Define clear module boundaries and responsibilities
- Consider consolidating `therapy-chat` into `chat` or `therapy`
- Move domain-specific utilities closer to their features

### 1.3 Component Organization
**Current State:**
- 48 files in `src/components/ui/`
- Mix of primitive UI components and therapy-specific components
- Therapeutic components spread across `ui/therapeutic-*` files and subdirectories

**Issues:**
- Large UI directory makes discovery difficult
- Naming inconsistency (`therapeutic-button.tsx` vs `therapeutic-cards/`)

**Improvement Areas:**
- Group related components into subdirectories
- Standardize therapeutic component organization
- Consider separating primitives from compound components

---

## Phase 2: Type Safety & Code Quality (High Priority)

### 2.1 TypeScript Strict Mode
**Current State:**
- `"strict": true` but `"noImplicitAny": false`
- Some `v.any()` usage in Convex schema for metadata fields

**Issues:**
- Loose typing reduces IDE assistance and catches fewer bugs
- Metadata fields are untyped, leading to runtime errors

**Improvement Areas:**
- Enable `noImplicitAny: true`
- Define proper types for metadata fields
- Create Zod schemas for runtime validation of metadata

### 2.2 Error Handling Patterns
**Current State:**
- Good error boundary implementation
- Structured error codes in `error-codes.ts` (11KB)
- Some try-catch blocks without proper error typing

**Issues:**
- Inconsistent error handling in hooks
- Some async operations silently fail
- Error recovery strategies unclear

**Improvement Areas:**
- Implement Result types for operations that can fail
- Add error recovery middleware for common failures
- Document error handling patterns

### 2.3 API Response Consistency
**Current State:**
- Well-defined `ApiResponse<T>` type in `api-response.ts`
- Rate limiter with good configuration
- Some inconsistency in how responses are handled client-side

**Issues:**
- Client-side code sometimes bypasses response helpers
- Error extraction patterns vary across files

**Improvement Areas:**
- Create unified API hooks with consistent error handling
- Implement retry logic with exponential backoff
- Add request/response logging in development

---

## Phase 3: Testing & Quality Assurance (Medium Priority)

### 3.1 Test Coverage Analysis
**Current State:**
- 1529 passing tests
- 139 test suites
- Good coverage on lib/therapy (~99%), lib/utils (~89%)
- Lower coverage on repositories (~87%), services (~92%)

**Issues:**
- Some complex paths in `session-repository.ts` untested
- E2E tests limited to 2 main flow specs
- No visual regression testing

**Improvement Areas:**
- Add tests for uncovered paths in repositories
- Expand E2E test coverage for edge cases
- Consider adding visual regression tests with Playwright

### 3.2 Integration Test Gaps
**Current State:**
- Unit tests cover most utilities
- Limited integration tests for full flows
- Convex queries/mutations have basic tests

**Issues:**
- Real Convex interactions not tested
- Auth flow integration not covered
- Complex multi-step flows untested

**Improvement Areas:**
- Add integration tests for critical paths
- Mock Convex for deterministic testing
- Test auth flows with Clerk test utilities

---

## Phase 4: Performance Optimization (Medium Priority)

### 4.1 Bundle Analysis
**Current State:**
- Bundle analyzer configured (`@next/bundle-analyzer`)
- Good code splitting with dynamic imports
- Some large dependencies (recharts, framer-motion)

**Issues:**
- Unknown current bundle sizes
- Potential for tree-shaking improvements
- Some components may be over-bundled

**Improvement Areas:**
- Run bundle analysis and document baseline
- Optimize large dependency imports
- Add bundle size monitoring to CI

### 4.2 Render Optimization
**Current State:**
- Good use of `useMemo` and `useCallback` in hooks
- React 19 with Server Components support
- Some components may re-render unnecessarily

**Issues:**
- Chat message list could benefit from virtualization
- Large message histories may cause performance issues
- Memory context updates trigger broad re-renders

**Improvement Areas:**
- Implement virtual scrolling for message list
- Profile and optimize re-renders in chat page
- Consider React Compiler when stable

### 4.3 Data Fetching Patterns
**Current State:**
- Convex for real-time data
- TanStack Query available but not heavily used
- Manual cache management in some places

**Issues:**
- Duplicate data fetching logic
- Cache invalidation patterns inconsistent
- Session data fetched multiple times

**Improvement Areas:**
- Consolidate data fetching with TanStack Query
- Implement proper cache invalidation strategy
- Add prefetching for common navigation paths

---

## Phase 5: Security Hardening (High Priority)

### 5.1 CSP Refinement
**Current State:**
- Good CSP implementation with nonce
- Security headers properly configured
- Some `unsafe-inline` fallbacks still present

**Issues:**
- Development mode allows `unsafe-eval`
- Some third-party scripts require broad permissions
- CSP violations not monitored

**Improvement Areas:**
- Add CSP violation reporting endpoint
- Reduce third-party script permissions
- Document required CSP exceptions

### 5.2 Input Validation
**Current State:**
- Zod v4 for schema validation
- API middleware validates requests
- Convex functions validate arguments

**Issues:**
- Client-side validation not always aligned with server
- Some metadata fields accept any shape
- No input sanitization documentation

**Improvement Areas:**
- Shared validation schemas between client/server
- Stricter metadata type definitions
- Document sanitization requirements

### 5.3 Rate Limiting Review
**Current State:**
- In-memory rate limiter with configurable buckets
- Different limits for chat vs API
- Block duration on limit exceeded

**Issues:**
- In-memory limiter doesn't scale horizontally
- No rate limit headers in responses
- Abuse detection limited

**Improvement Areas:**
- Consider distributed rate limiting (Redis)
- Add rate limit headers to responses
- Implement progressive penalties

---

## Phase 6: Developer Experience (Low Priority)

### 6.1 Documentation
**Current State:**
- AGENTS.md with good guidelines
- README exists but not checked
- API documented in `docs/api.yaml`
- Test README comprehensive

**Issues:**
- Architecture documentation missing
- Component documentation sparse
- Development setup could be clearer

**Improvement Areas:**
- Add architecture decision records (ADRs)
- Document component usage patterns
- Create development setup guide

### 6.2 Tooling Improvements
**Current State:**
- ESLint with good rule set
- Prettier configured
- TypeScript strict-ish mode

**Issues:**
- No pre-commit hooks visible
- Bundle size not monitored in CI
- No automated dependency updates

**Improvement Areas:**
- Add Husky pre-commit hooks
- Implement bundle size CI checks
- Configure Dependabot or Renovate

### 6.3 Logging & Observability
**Current State:**
- Structured logger in place
- Performance metrics collection
- Web vitals tracking

**Issues:**
- No centralized log aggregation
- Telemetry configuration unclear
- Debug logging verbose in development

**Improvement Areas:**
- Add log filtering by level
- Document telemetry configuration
- Consider error tracking service (Sentry)

---

## Phase 7: Infrastructure & DevOps (Low Priority)

### 7.1 CI/CD Pipeline
**Current State:**
- QA smoke and full commands available
- Playwright for E2E
- Jest for unit tests

**Issues:**
- CI configuration not visible in repo
- Deployment process undocumented
- No staging environment mentioned

**Improvement Areas:**
- Add GitHub Actions workflow
- Document deployment process
- Consider preview deployments

### 7.2 Environment Management
**Current State:**
- Good env configuration with validation
- Public/private env separation
- Setup scripts available

**Issues:**
- Multiple env files can get out of sync
- Secret rotation not documented
- Environment parity unclear

**Improvement Areas:**
- Single source of truth for env schema
- Document secret rotation procedure
- Add environment parity validation

---

## Summary: Recommended Priority Order

1. **Phase 2.1**: Enable `noImplicitAny` - Quick win for type safety
2. **Phase 5.1**: CSP monitoring - Security visibility
3. **Phase 1.1**: Hook complexity - Foundation for maintainability
4. **Phase 3.1**: Test coverage gaps - Quality assurance
5. **Phase 4.2**: Render optimization - User experience
6. **Phase 1.2**: Feature boundaries - Architecture clarity
7. **Phase 6.1**: Documentation - Team scalability
8. **Phase 7.1**: CI/CD - Deployment reliability

---

## Notes from Code Review

### Strengths Observed
- Clean ESLint configuration with meaningful rules
- Good use of design system tokens
- Well-structured Convex schema with indexes
- Comprehensive error code system
- Good security headers implementation
- High test coverage overall (1529 tests passing)
- TypeScript used throughout
- Good separation of concerns in most areas

### Areas of Concern
- Large hook files that handle multiple concerns
- Some `v.any()` in Convex schema
- Overlapping feature modules
- In-memory rate limiting won't scale
- No visible CI/CD configuration

### Technical Debt Indicators
- `noImplicitAny: false` allows loose typing
- Some components over 400 lines
- Metadata fields loosely typed
- Manual cache management patterns
