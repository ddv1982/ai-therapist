# Code Review Action Plan - AI Therapist Application

**Generated**: October 25, 2025
**Overall Codebase Grade**: B+ (Good with notable areas for improvement)
**Estimated Total Effort**: 11-15 days across all phases

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Phase 1: Critical Fixes (3-5 days)](#phase-1-critical-fixes)
3. [Phase 2: High Priority Improvements (3-4 days)](#phase-2-high-priority-improvements)
4. [Phase 3: Medium Priority Enhancements (2-3 days)](#phase-3-medium-priority-enhancements)
5. [Phase 4: Polish & Long-term (2-3 days)](#phase-4-polish--long-term)
6. [Success Metrics](#success-metrics)
7. [Risk Assessment](#risk-assessment)

---

## Executive Summary

### Current State
- ✅ 769 passing tests (100% pass rate)
- ✅ Strong security implementation (AES-256-GCM, TOTP, HIPAA compliance)
- ✅ Modern tech stack (Next.js 15, AI SDK 5, Convex)
- ❌ Type safety issues from Convex migration (10+ `as any` casts)
- ❌ Large API route files (400+ lines)
- ❌ Missing database query pagination

### Success Definition
After completing all phases:
- ✅ 0 instances of `as any` in database layer
- ✅ All environment variables validated and centralized
- ✅ All database queries paginated with limits
- ✅ API routes refactored to <250 lines each
- ✅ Error handling specific and actionable
- ✅ 85%+ test coverage on critical security code
- ✅ Bundle size reduced by 15-20%
- ✅ All recommendations from code review addressed

---

## Phase 1: Critical Fixes (3-5 days)

**Priority**: MUST DO BEFORE NEXT RELEASE
**Impact**: Prevents runtime errors, improves type safety
**Testing Impact**: Full test suite must pass

### Task 1.1: Fix Convex Type Safety Issues
**File**: `/src/lib/database/queries.ts`
**Effort**: 2-3 days
**Complexity**: Medium

**Current Issues**:
- Line 9: `const bundle = await client.query(anyApi.sessions.getWithMessagesAndReports, ...)` returns `any`
- Line 12: `sessionId: sessionId as any` unsafe type assertion
- Line 14: `as any` cast on query result
- Lines 48-50: Multiple `as any[]` returns
- Line 57: Generic return type `Promise<any>`

**Solution**:
1. Import generated Convex types from `convex/_generated/dataModel`
2. Define proper TypeScript interfaces for query results
3. Create type-safe query wrappers with runtime validation
4. Add JSDoc documentation for each query function

**Steps**:
- [x] Create `/src/types/database.ts` with query result interfaces
- [x] Update `/src/lib/database/queries.ts` to use proper types
- [x] Add type guards for runtime validation
- [x] Update all callers to use typed results
- [x] Run targeted tests (`npm run test -- queries`) to verify no regressions<sup>†</sup>
- [x] Add 3-5 new tests for type safety (4 added in `__tests__/lib/database/queries.test.ts`)

**Success Criteria**:
- [x] 0 instances of `as any` in queries.ts
- [x] All functions have explicit return types
- [ ] TypeScript strict mode passes without errors<sup>††</sup>
- [ ] All existing tests still pass<sup>†</sup>
- [x] New unit tests for type guards (3+ tests)

<sup>†</sup> Full test suite not executed in this iteration; focused run of the new database query tests is passing.

<sup>††</sup> `npx tsc --noEmit` currently fails on pre-existing Convex import type issues outside `queries.ts`; see console output captured during validation.

**Example Implementation**:
```typescript
// ✅ BEFORE (broken type safety):
export async function getUserSessions(userLegacyId: string) {
  const sessions = await client.query(anyApi.sessions.listByUser, { userId });
  return sessions as any[];
}

// ✅ AFTER (type-safe):
import { Doc } from '../../convex/_generated/dataModel';

interface SessionQueryResult {
  _id: string;
  _creationTime: number;
  userId: string;
  title: string;
  createdAt: Date;
  messages?: Doc<'messages'>[];
}

export async function getUserSessions(userLegacyId: string): Promise<SessionQueryResult[]> {
  const sessions = await client.query(anyApi.sessions.listByUser, { userId });

  // Runtime validation
  if (!Array.isArray(sessions)) {
    throw new Error('Expected array of sessions');
  }

  return sessions.map(validateSessionResult);
}

function validateSessionResult(session: unknown): SessionQueryResult {
  if (!session || typeof session !== 'object') {
    throw new Error('Invalid session object');
  }
  // ... validation logic
}
```

---

### Task 1.2: Centralize Environment Variables
**File**: Create `/src/config/env.ts`
**Effort**: 1 day
**Complexity**: Low

**Current Issues**:
- 49 direct `process.env` accesses scattered across codebase
- No validation of required environment variables
- No type safety for env vars
- Missing error messages when vars are absent

**Solution**:
1. Create centralized env config with zod validation
2. Add startup check to validate all required variables
3. Replace all `process.env` references with imports from config
4. Document all environment variables

**Steps**:
- [x] Create `/src/config/env.ts` with zod schema
- [x] Add environment variable validation on app startup
- [x] Create `/src/config/env.defaults.ts` with default values
- [x] Find all `process.env` references: `grep -r "process.env" src/`
- [x] Replace with `import { env } from '@/config/env'`
- [x] Update `.env.local.example` documentation
- [x] Add tests for env validation

**Success Criteria**:
- [x] Single source of truth for all env variables
- [x] All env vars validated with zod
- [x] App fails fast if required vars missing
- [x] 0 direct `process.env` references outside of config
- [x] TypeScript knows all available env variables
- [x] Updated documentation in CLAUDE.md

**Example Implementation**:
```typescript
// src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // Required in all environments
  NEXTAUTH_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().length(64),

  // Conditionally required
  GROQ_API_KEY: z.string().optional(),
  CONVEX_URL: z.string().url().optional(),

  // Flags
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DEBUG: z.string().transform(v => v === 'true').default('false'),
});

type Environment = z.infer<typeof envSchema>;

let cachedEnv: Environment | null = null;

export function getEnv(): Environment {
  if (cachedEnv) return cachedEnv;

  try {
    cachedEnv = envSchema.parse(process.env);
    return cachedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Invalid environment variables:');
      error.errors.forEach(err => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw new Error('Failed to validate environment variables');
  }
}

export const env = getEnv();
```

---

### Task 1.3: Add Query Result Limits & Pagination
**Files**:
- `/src/lib/database/queries.ts` (all query functions)
- `/convex/sessions.ts` (Convex schema)

**Effort**: 1-2 days
**Complexity**: Low-Medium

**Current Issues**:
- `getUserSessions()` returns unlimited sessions
- `getSessionMessages()` returns unlimited messages
- `getSessionReports()` returns unlimited reports
- No offset/limit parameters
- UI components may freeze loading large datasets

**Solution**:
1. Add pagination parameters to all list queries
2. Set sensible default limits (50 items)
3. Update API endpoints to accept limit/offset
4. Update UI components to use pagination
5. Add cursor-based pagination for better UX

**Steps**:
- [ ] Add `limit` and `offset` parameters to `/src/lib/database/queries.ts`
- [ ] Update Convex queries to support pagination
- [ ] Update API routes `/api/sessions` and `/api/messages` with pagination
- [ ] Add pagination support to Redux state
- [ ] Update chat interface to load messages in batches
- [ ] Add infinite scroll or "load more" button
- [ ] Add tests for pagination (3+ tests)

**Success Criteria**:
- [ ] All list queries have default limits (50-100 items)
- [ ] Pagination info returned with results (page, total, hasNext)
- [ ] API endpoints support offset/limit query parameters
- [ ] UI loads data progressively
- [ ] Memory usage reduced for large datasets
- [ ] All tests pass

**Example Implementation**:
```typescript
// ✅ BEFORE (problematic):
export async function getUserSessions(userLegacyId: string) {
  return await client.query(anyApi.sessions.listByUser, { userId });
}

// ✅ AFTER (paginated):
interface PaginationOptions {
  limit?: number;
  offset?: number;
}

interface PaginatedResult<T> {
  items: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export async function getUserSessions(
  userLegacyId: string,
  options: PaginationOptions = {}
): Promise<PaginatedResult<SessionQueryResult>> {
  const limit = Math.min(options.limit ?? 50, 100); // Max 100
  const offset = options.offset ?? 0;

  const [items, total] = await Promise.all([
    client.query(anyApi.sessions.listByUser, {
      userId,
      limit: limit + 1, // Fetch 1 extra to determine hasMore
      offset
    }),
    client.query(anyApi.sessions.countByUser, { userId })
  ]);

  const hasMore = items.length > limit;
  return {
    items: items.slice(0, limit),
    pagination: {
      limit,
      offset,
      total,
      hasMore
    }
  };
}
```

---

## Phase 2: High Priority Improvements (3-4 days)

**Priority**: SHOULD DO NEXT SPRINT
**Impact**: Improves maintainability, error handling, test coverage
**Testing Impact**: Additional test suites required

### Task 2.1: Refactor Large API Routes
**Files**:
- `/src/app/api/reports/generate/route.ts` (446 lines → target: <250)
- `/src/app/api/reports/memory/route.ts` (465 lines → target: <250)

**Effort**: 2-3 days
**Complexity**: Medium

**Current Issues**:
- Line count exceeds best practices (target: <300 lines)
- Complex business logic mixed with HTTP handling
- Hard to test individual functions
- Difficult to understand data flow

**Solution**:
1. Extract business logic into service layer `/src/lib/services/`
2. Keep routes focused on HTTP concerns only
3. Create composable utility functions
4. Improve testability with dependency injection

**Steps**:
- [ ] Create `/src/lib/services/report-generation-service.ts`
- [ ] Extract `generateSessionReport()` logic
- [ ] Create `/src/lib/services/memory-management-service.ts`
- [ ] Refactor `/src/app/api/reports/generate/route.ts` to use services
- [ ] Refactor `/src/app/api/reports/memory/route.ts` to use services
- [ ] Add service layer tests (10+ tests)
- [ ] Ensure all existing tests still pass

**Success Criteria**:
- [ ] Both route files <250 lines
- [ ] Business logic in dedicated service files
- [ ] Services are unit testable
- [ ] Functions have clear responsibilities
- [ ] Error handling improved with granular messages
- [ ] 10+ new tests for service layer

**Example Structure**:
```
src/
├── app/api/reports/generate/route.ts (100 lines - HTTP only)
├── app/api/reports/memory/route.ts (100 lines - HTTP only)
└── lib/services/
    ├── report-generation-service.ts (150 lines - business logic)
    ├── memory-management-service.ts (150 lines - business logic)
    └── __tests__/
        ├── report-generation-service.test.ts
        └── memory-management-service.test.ts
```

---

### Task 2.2: Improve Error Handling Granularity
**File**: `/src/app/api/chat/route.ts`
**Effort**: 1-2 days
**Complexity**: Low-Medium

**Current Issues**:
- Line 180-183: Generic "Failed to process request" message
- Lost error context for debugging
- No distinction between client errors and server errors
- Difficult to handle specific error types

**Solution**:
1. Create error classification system
2. Define specific error types for different failure modes
3. Return detailed error responses (while hiding sensitive info)
4. Add structured logging with error context

**Steps**:
- [ ] Create `/src/lib/errors/chat-errors.ts` with custom error classes
- [ ] Create `/src/lib/errors/error-classifier.ts`
- [ ] Update error handling in `/src/app/api/chat/route.ts`
- [ ] Add specific error messages for user feedback
- [ ] Add structured logging for debugging
- [ ] Add tests for error handling (5+ tests)

**Success Criteria**:
- [ ] Specific error messages for different failure modes
- [ ] Users get helpful error information
- [ ] Developers get detailed debugging logs
- [ ] No sensitive information exposed
- [ ] All error paths tested
- [ ] Error codes documented

**Example Implementation**:
```typescript
// src/lib/errors/chat-errors.ts
export class ChatError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public suggestedAction?: string
  ) {
    super(message);
    this.name = 'ChatError';
  }
}

export class AIServiceError extends ChatError {
  constructor(message: string = 'AI service temporarily unavailable') {
    super('AI_SERVICE_ERROR', 503, message, 'Try again in a few moments');
  }
}

export class ValidationError extends ChatError {
  constructor(message: string) {
    super('VALIDATION_ERROR', 400, message, 'Check your input and try again');
  }
}

// src/app/api/chat/route.ts
} catch (error) {
  if (error instanceof ValidationError) {
    return createErrorResponse(error.message, error.statusCode, {
      code: error.code,
      suggestedAction: error.suggestedAction,
      requestId: context.requestId
    });
  }

  if (error instanceof AIServiceError) {
    return createErrorResponse(error.message, error.statusCode, {
      code: error.code,
      suggestedAction: error.suggestedAction,
      requestId: context.requestId
    });
  }

  // Fallback for unexpected errors
  logger.error('/api/chat - Unexpected error', error as Error);
  return createErrorResponse(
    'An unexpected error occurred',
    500,
    { requestId: context.requestId }
  );
}
```

---

### Task 2.3: Expand Test Coverage for Security Code
**Files**:
- `/src/lib/auth/crypto-utils.ts` (currently excluded from coverage)
- `/src/lib/chat/message-encryption.ts` (currently excluded from coverage)

**Effort**: 1.5 days
**Complexity**: Medium

**Current Issues**:
- `jest.config.js` excludes encryption utilities from coverage
- HIPAA-critical code not tested
- No validation that encryption works correctly
- Potential for security vulnerabilities

**Solution**:
1. Remove exclusions from jest.config.js for crypto code
2. Write comprehensive tests for encryption/decryption
3. Test key generation and validation
4. Test error cases and edge conditions
5. Add integration tests for encrypted message flow

**Steps**:
- [ ] Create `/src/lib/auth/__tests__/crypto-utils.test.ts`
- [ ] Create `/src/lib/chat/__tests__/message-encryption.test.ts`
- [ ] Update `jest.config.js` to include crypto code in coverage
- [ ] Add tests for key generation (3+ tests)
- [ ] Add tests for encryption/decryption round-trip (5+ tests)
- [ ] Add tests for error handling (3+ tests)
- [ ] Ensure 100% line coverage for crypto utilities

**Success Criteria**:
- [ ] 15+ new tests for encryption utilities
- [ ] 100% line coverage for crypto-utils.ts
- [ ] 100% line coverage for message-encryption.ts
- [ ] All edge cases tested
- [ ] Error handling verified
- [ ] Test coverage report shows 85%+ overall

---

### Task 2.4: Implement Structured Error Codes API
**File**: `/src/lib/api/error-codes.ts` (new)
**Effort**: 1 day
**Complexity**: Low

**Current Issues**:
- No centralized error code definitions
- Error codes scattered across codebase
- Inconsistent error code format
- Hard to document all possible errors

**Solution**:
1. Create centralized error code registry
2. Define all possible error codes with descriptions
3. Use enum for type safety
4. Document error codes for API consumers

**Steps**:
- [ ] Create `/src/lib/api/error-codes.ts` with error code enum
- [ ] Document each error code with description
- [ ] Update all API routes to use centralized codes
- [ ] Create API documentation page listing error codes
- [ ] Add tests for error code usage (3+ tests)

**Example Implementation**:
```typescript
// src/lib/api/error-codes.ts
export enum ApiErrorCode {
  // Validation errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  // Authentication errors (401)
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // Authorization errors (403)
  FORBIDDEN = 'FORBIDDEN',

  // Not found errors (404)
  NOT_FOUND = 'NOT_FOUND',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',

  // Rate limit errors (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server errors (500)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
}

export const ErrorCodeDescriptions: Record<ApiErrorCode, string> = {
  [ApiErrorCode.VALIDATION_ERROR]: 'Request data failed validation',
  [ApiErrorCode.AI_SERVICE_ERROR]: 'AI service temporarily unavailable',
  // ... more descriptions
};
```

---

## Phase 3: Medium Priority Enhancements (2-3 days)

**Priority**: NICE TO HAVE NEXT QUARTER
**Impact**: Performance, user experience, maintainability
**Testing Impact**: Performance benchmarks

### Task 3.1: Implement Code Splitting for Heavy Features
**Files**:
- `/src/app/(dashboard)/page.tsx`
- `/src/features/therapy/cbt/` (all CBT components)

**Effort**: 1.5 days
**Complexity**: Low-Medium

**Current Issues**:
- All features bundled together
- Large initial JavaScript payload
- Slower time to interactive
- CBT components loaded even if user doesn't use them

**Solution**:
1. Use dynamic imports for heavy feature modules
2. Route-based code splitting
3. Component-level lazy loading with Suspense
4. Add loading skeletons for better UX

**Steps**:
- [ ] Identify heavy components/features using webpack-bundle-analyzer
- [ ] Create `/src/components/lazy-boundary.tsx` for Suspense boundaries
- [ ] Update CBT feature imports to use dynamic imports
- [ ] Add loading skeletons for lazy components
- [ ] Measure bundle size reduction
- [ ] Test lazy loading works correctly

**Success Criteria**:
- [ ] Initial bundle size reduced by 15-20%
- [ ] All heavy features lazy loaded
- [ ] Smooth loading with skeletons/spinners
- [ ] No breaking functionality
- [ ] Performance metrics improved (Lighthouse score)

**Example Implementation**:
```typescript
// ✅ BEFORE (all loaded upfront):
import { CBTDiary } from '@/features/therapy/cbt/cbt-diary';
import { CBTAssessment } from '@/features/therapy/cbt/cbt-assessment';

// ✅ AFTER (lazy loaded):
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const CBTDiary = dynamic(
  () => import('@/features/therapy/cbt/cbt-diary').then(mod => ({ default: mod.CBTDiary })),
  {
    loading: () => <CBTSkeleton />,
    ssr: false,
  }
);

const CBTAssessment = dynamic(
  () => import('@/features/therapy/cbt/cbt-assessment').then(mod => ({ default: mod.CBTAssessment })),
  {
    loading: () => <CBTSkeleton />,
    ssr: false,
  }
);
```

---

### Task 3.2: Simplify Complex useEffect Dependencies
**File**: `/src/features/auth/components/auth-guard.tsx`
**Effort**: 1 day
**Complexity**: Low

**Current Issues**:
- 4 useEffect hooks with complex dependencies
- Hard to understand when effects run
- Risk of stale closures
- Difficult to debug state issues

**Solution**:
1. Consolidate multiple effects where possible
2. Use useReducer for complex state
3. Simplify dependency arrays
4. Add clear comments explaining effect logic

**Steps**:
- [ ] Analyze current useEffect hooks and dependencies
- [ ] Create useReducer pattern for auth state
- [ ] Consolidate related effects
- [ ] Simplify dependency arrays
- [ ] Add explanatory comments
- [ ] Test that auth flow still works correctly

**Success Criteria**:
- [ ] Maximum 2 useEffect hooks
- [ ] Simple, clear dependency arrays
- [ ] Easier to understand state transitions
- [ ] No stale closure issues
- [ ] All auth tests pass

---

### Task 3.3: Add Response Validation for AI Responses
**File**: `/src/lib/chat/response-validator.ts` (new)
**Effort**: 1 day
**Complexity**: Medium

**Current Issues**:
- AI responses not validated before storage
- Could store malformed/corrupted data
- No defense against prompt injection
- No verification that response matches expected format

**Solution**:
1. Create response validation schema
2. Validate format, length, and content
3. Add safety checks for prompt injection
4. Log validation failures for monitoring

**Steps**:
- [ ] Create `/src/lib/chat/response-validator.ts`
- [ ] Define validation schema for responses
- [ ] Add content validation (length, format)
- [ ] Add safety checks for suspicious content
- [ ] Integrate into chat API route
- [ ] Add tests for validator (5+ tests)

**Success Criteria**:
- [ ] All AI responses validated before storage
- [ ] Invalid responses rejected with meaningful errors
- [ ] No malformed data in database
- [ ] Prompt injection attempts logged
- [ ] Tests verify validation logic

---

## Phase 4: Polish & Long-term (2-3 days)

**Priority**: FUTURE ENHANCEMENT
**Impact**: Observability, scalability, developer experience
**Testing Impact**: Integration and monitoring tests

### Task 4.1: Add Performance Monitoring
**Files**: Create new monitoring infrastructure
**Effort**: 1.5 days
**Complexity**: Low-Medium

**Current Issues**:
- No metrics on API performance
- No visibility into streaming response times
- Hard to identify bottlenecks
- No alerts for degradation

**Solution**:
1. Add performance metrics collection
2. Monitor API response times
3. Track streaming message processing time
4. Add alerting for performance degradation

**Steps**:
- [ ] Create `/src/lib/monitoring/performance-metrics.ts`
- [ ] Add timing instrumentation to API routes
- [ ] Track database query performance
- [ ] Monitor AI response latency
- [ ] Create dashboard/reporting
- [ ] Set up alerting thresholds

**Success Criteria**:
- [ ] All API endpoints have latency metrics
- [ ] Performance data logged and exportable
- [ ] Slow endpoint detection automated
- [ ] Dashboard showing performance trends
- [ ] Alerting configured for degradation

---

### Task 4.2: Implement E2E Tests with Playwright
**File**: `/e2e/` directory
**Effort**: 2 days
**Complexity**: Medium

**Current Issues**:
- E2E tests removed due to authentication complexity
- No test coverage for critical user flows
- Manual testing required for releases
- Risk of regressions in deployment

**Solution**:
1. Restore Playwright E2E tests with proper auth mocking
2. Test critical user paths
3. Set up CI/CD integration
4. Add visual regression testing

**Steps**:
- [ ] Create `/e2e/` directory structure
- [ ] Write tests for authentication flows
- [ ] Test chat message creation and streaming
- [ ] Test session management
- [ ] Test report generation
- [ ] Add to CI/CD pipeline

**Success Criteria**:
- [ ] 10+ E2E tests covering critical paths
- [ ] All tests pass consistently
- [ ] Tests run in CI/CD before deploy
- [ ] ~80% critical path coverage

---

### Task 4.3: Update Documentation
**Files**:
- `/CLAUDE.md` (architecture docs)
- `/docs/API.md` (API reference)
- New `/docs/ERROR_CODES.md`
- New `/docs/IMPLEMENTATION_GUIDE.md`

**Effort**: 1 day
**Complexity**: Low

**Current Issues**:
- Convex migration not documented
- Error codes not centrally documented
- No implementation guide for new developers
- Missing troubleshooting section

**Solution**:
1. Document Convex architecture and type patterns
2. Create comprehensive error code reference
3. Add implementation guide for new features
4. Document all environment variables
5. Add troubleshooting section

**Steps**:
- [ ] Update `/CLAUDE.md` with Convex patterns
- [ ] Create `/docs/ERROR_CODES.md`
- [ ] Create `/docs/IMPLEMENTATION_GUIDE.md`
- [ ] Update `/docs/ENVIRONMENT_VARIABLES.md`
- [ ] Add troubleshooting FAQ

**Success Criteria**:
- [ ] All architecture decisions documented
- [ ] New developers can set up in <30 minutes
- [ ] All error codes explained
- [ ] Common issues and solutions listed

---

### Task 4.4: Security Audit Follow-up
**File**: Create `/docs/SECURITY_CHECKLIST.md`
**Effort**: 1 day
**Complexity**: Low-Medium

**Current Issues**:
- No formal security checklist
- No regular security audit schedule
- No dependency scanning
- No OWASP Top 10 checklist

**Solution**:
1. Create security checklist based on code review findings
2. Set up automated dependency scanning
3. Schedule regular security audits
4. Document security best practices

**Steps**:
- [ ] Create `/docs/SECURITY_CHECKLIST.md`
- [ ] Add npm audit to CI/CD
- [ ] Set up Dependabot alerts
- [ ] Schedule quarterly security reviews
- [ ] Document incident response procedure

**Success Criteria**:
- [ ] Security checklist with all items
- [ ] Automated vulnerability scanning
- [ ] Clear security policies documented
- [ ] No high-severity vulnerabilities

---

## Success Metrics

### Code Quality Metrics
- [ ] TypeScript strict mode passes with 0 errors
- [ ] ESLint passes with 0 warnings
- [ ] Test coverage: 85%+ overall, 100% for security code
- [ ] All API route files: <250 lines
- [ ] Cyclomatic complexity: <10 for all functions
- [ ] 0 instances of `as any` in typed layers

### Performance Metrics
- [ ] Initial bundle size reduced by 15-20%
- [ ] API response time P95: <500ms
- [ ] Streaming response time: <2000ms for typical responses
- [ ] Lighthouse score: >90 on desktop
- [ ] Time to interactive: <3 seconds

### Security Metrics
- [ ] 0 high/critical vulnerabilities in dependencies
- [ ] 100% encryption coverage for sensitive data
- [ ] 0 direct `process.env` references outside config
- [ ] All error codes centralized and documented
- [ ] Security test coverage: 100%

### Test Metrics
- [ ] Maintain 100% test pass rate (769+ tests)
- [ ] Add 30+ new tests (phases 1-2)
- [ ] Add 10+ E2E tests (phase 4)
- [ ] Test execution time: <60 seconds

### Documentation Metrics
- [ ] All APIs documented with error codes
- [ ] Architecture decisions documented
- [ ] Implementation guide complete
- [ ] Security policies documented

---

## Risk Assessment

### Low Risk Items (proceed confidently)
- ✅ Environment variable centralization (Task 1.2)
- ✅ Error code centralization (Task 2.4)
- ✅ Component code splitting (Task 3.1)
- ✅ useEffect simplification (Task 3.2)
- ✅ Documentation updates (Task 4.3)

### Medium Risk Items (test thoroughly)
- ⚠️ Convex type safety fixes (Task 1.1)
  - **Mitigation**: Run full test suite after changes, test in dev environment first
- ⚠️ API route refactoring (Task 2.1)
  - **Mitigation**: Extract services incrementally, maintain API signatures
- ⚠️ Query pagination (Task 1.3)
  - **Mitigation**: Add feature flag for gradual rollout, test with large datasets

### High Risk Items (require careful planning)
- 🔴 Test coverage expansion (Task 2.3)
  - **Mitigation**: Start with non-production code paths, validate encryption works
- 🔴 E2E test restoration (Task 4.2)
  - **Mitigation**: Use test database, mock authentication, validate CI/CD integration

### Rollout Strategy
1. **Phase 1** (Critical): Must complete before production deployment
2. **Phase 2** (High Priority): Complete within next sprint
3. **Phase 3** (Medium): Complete within next quarter
4. **Phase 4** (Polish): Ongoing improvements based on priority

### Testing Strategy
- All code changes must pass existing test suite
- New tests required for each phase
- Performance benchmarks before/after for optimization tasks
- Security validation for any auth/encryption changes
- Manual QA testing for high-risk changes

---

## Dependencies Between Tasks

```
Task 1.1 (Type Safety) ─┐
                        ├─→ Task 1.2 (Env Vars) ─┐
Task 1.2 (Env Vars) ───┘                         ├─→ Task 2.1 (API Refactor)
                                                  │
Task 1.3 (Pagination) ─┐                         │
                       ├─→ Task 2.2 (Error Handling)
                       │
Task 2.1 (API Refactor)─┤
                       ├─→ Task 2.3 (Test Coverage)
                       │
Task 2.4 (Error Codes) ┘

Task 3.1 (Code Splitting) ─┐
Task 3.2 (useEffect) ────┬──┤ (independent, can run parallel)
Task 3.3 (Response Val) ─┘  └─→ Task 4.2 (E2E Tests)

Task 4.1-4.4: Can run anytime, independent of other phases
```

---

## Quick Start Checklist

- [ ] Read this plan document
- [ ] Create branch: `git checkout -b code-review-fixes`
- [ ] Start with Task 1.1 (Convex type safety)
- [ ] Run tests after each task: `npm run test`
- [ ] Create PR after each phase
- [ ] Review with team before production deployment

---

## Glossary

- **Cyclomatic Complexity**: Number of decision points in code (higher = more complex)
- **Type Safety**: TypeScript correctly preventing runtime type errors
- **Pagination**: Breaking large result sets into smaller chunks
- **Code Splitting**: Breaking bundle into smaller pieces loaded on demand
- **E2E Tests**: End-to-end tests simulating real user workflows
- **HIPAA**: Health Insurance Portability and Accountability Act

---

## Contact & Questions

For questions about specific tasks, implementation details, or technical challenges:
1. Check the "Example Implementation" section in each task
2. Review CLAUDE.md for architecture context
3. Consult code review findings for detailed issue descriptions
4. Run tests frequently to catch issues early

---

**Document Version**: 1.0
**Last Updated**: October 25, 2025
**Status**: Ready for implementation
