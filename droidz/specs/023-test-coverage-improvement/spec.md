# Test Coverage Improvement Specification

## 1. Overview

### 1.1 Purpose

This specification documents the plan to increase test coverage from the current levels to 90%+ across all metrics. The goal is to improve code quality, reliability, and maintainability through comprehensive testing.

### 1.2 Current State

| Metric     | Current | Target | Gap    |
| ---------- | ------- | ------ | ------ |
| Statements | 84.45%  | 90%+   | +5.55% |
| Branches   | 76.49%  | 85%+   | +8.51% |
| Functions  | 87.46%  | 90%+   | +2.54% |
| Lines      | 86.59%  | 90%+   | +3.41% |

### 1.3 Success Criteria

1. All files have minimum 80% statement coverage
2. All files have minimum 75% branch coverage
3. Overall coverage reaches 90%+ statements
4. No regression in existing tests
5. All new tests follow project conventions (Jest with `.test.ts[x]` suffix)

---

## 2. Priority 1: Zero Coverage Files (Critical)

These files have 0% coverage and must be addressed first.

### 2.1 Security Module

#### 2.1.1 `src/lib/security/csp-config.ts`

**Current Coverage:** Statements 0%, Branches 100%, Functions 0%, Lines 0%

**File Analysis:**

- Contains CSP exception documentation and utility functions
- Exports: `CSP_EXCEPTION_CATEGORIES`, `CSP_EXCEPTIONS`, `CSP_SUMMARY`
- Functions: `getExceptionsByCategory()`, `getExceptionsByDirective()`, `getProductionExceptions()`, `getDevelopmentExceptions()`

**Test Strategy:**

```typescript
// __tests__/lib/security/csp-config.test.ts
describe('CSP Config', () => {
  describe('CSP_EXCEPTIONS', () => {
    it('has valid structure for all exceptions');
    it('all exceptions have required fields');
    it('devOnly flag is boolean');
  });

  describe('getExceptionsByCategory', () => {
    it('filters exceptions by authentication category');
    it('filters exceptions by captcha category');
    it('filters exceptions by development category');
    it('returns empty array for unknown category');
  });

  describe('getExceptionsByDirective', () => {
    it('filters exceptions by script-src');
    it('filters exceptions by connect-src');
    it('returns empty array for unknown directive');
  });

  describe('getProductionExceptions', () => {
    it('excludes devOnly exceptions');
    it('includes all non-dev exceptions');
  });

  describe('getDevelopmentExceptions', () => {
    it('returns only devOnly exceptions');
  });
});
```

**Estimated Effort:** 1-2 hours

#### 2.1.2 `src/lib/security/csp-violations.ts`

**Current Coverage:** All metrics 0%

**File Analysis:**

- In-memory storage for CSP violations (dev only)
- Functions: `addCSPViolation()`, `getCSPViolations()`, `getCSPViolationStats()`, `clearCSPViolations()`
- Uses `isDevelopment` flag for conditional behavior

**Test Strategy:**

```typescript
// __tests__/lib/security/csp-violations.test.ts
describe('CSP Violations Storage', () => {
  beforeEach(() => clearCSPViolations());

  describe('addCSPViolation', () => {
    it('stores violations in development mode');
    it('limits storage to MAX_STORED_VIOLATIONS (100)');
    it('stores newest violations first');
    it('does nothing in production mode');
  });

  describe('getCSPViolations', () => {
    it('returns stored violations in development');
    it('returns empty array in production');
    it('returns defensive copy (not reference)');
  });

  describe('getCSPViolationStats', () => {
    it('returns zero stats when empty');
    it('counts violations by directive');
    it('counts violations by blocked URI');
    it('counts recent violations (within 1 hour)');
    it('handles URL parsing for blocked URIs');
    it('handles invalid URLs gracefully');
  });

  describe('clearCSPViolations', () => {
    it('clears all violations in development');
    it('does nothing in production');
  });
});
```

**Edge Cases to Cover:**

- URL parsing failures in blocked URIs
- Invalid violation data structures
- Production vs development mode switching

**Estimated Effort:** 2-3 hours

---

### 2.2 Services Module

#### 2.2.1 `src/lib/services/chat/api-client-adapter.ts`

**Current Coverage:** All metrics 0%

**File Analysis:**

- Adapter that wraps `apiClient` to implement `IChatApiClient` interface
- Three methods: `listMessages()`, `postMessage()`, `patchMessageMetadata()`
- Heavy data transformation and null handling

**Test Strategy:**

```typescript
// __tests__/lib/services/chat/api-client-adapter.test.ts

// Mock the apiClient
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    listMessages: jest.fn(),
    postMessage: jest.fn(),
    patchMessageMetadata: jest.fn(),
  },
}));

describe('chatApiClientAdapter', () => {
  describe('listMessages', () => {
    it('transforms successful response correctly');
    it('handles null response gracefully');
    it('handles missing data fields with defaults');
    it('maps timestamp from createdAt when timestamp missing');
    it('handles error responses');
    it('handles modelUsed and metadata fields');
    it('transforms pagination data');
  });

  describe('postMessage', () => {
    it('transforms successful message creation');
    it('handles null response');
    it('maps response fields correctly');
    it('handles error in response');
  });

  describe('patchMessageMetadata', () => {
    it('transforms successful metadata update');
    it('handles partial responses');
    it('handles error responses');
  });
});
```

**Edge Cases:**

- Missing `id`, `timestamp`, `createdAt` fields
- Null `modelUsed` and `metadata`
- Error object variations
- Response with `success: false`

**Estimated Effort:** 2-3 hours

#### 2.2.2 `src/lib/services/chat/index.ts`

**Current Coverage:** Statements 0%, Branches 100%, Functions 100%, Lines 0%

**Analysis:** Barrel export file. May need minimal testing or can be covered indirectly through imports.

**Test Strategy:**

```typescript
// Test via import coverage
import * as chatServices from '@/features/chat/lib';

describe('Chat Services Index', () => {
  it('exports expected modules');
});
```

**Estimated Effort:** 15 minutes

---

### 2.3 Utils Module

#### 2.3.1 `src/lib/utils/hook-error-patterns.ts`

**Current Coverage:** All metrics 0%

**File Analysis:**

- Complex React hook for error handling with Result types
- Exports: `useErrorHandler`, `enhanceError`, `executeWithErrorHandling`, `executeWithErrorHandlingSync`
- Utility functions: `unwrapOrThrow`, `resultToNullable`, `isRecoverableError`, `getErrorRecoveryAction`

**Test Strategy:**

```typescript
// __tests__/lib/utils/hook-error-patterns.test.tsx
import { renderHook, act } from '@testing-library/react';
import {
  useErrorHandler,
  enhanceError,
  executeWithErrorHandling,
  executeWithErrorHandlingSync,
  unwrapOrThrow,
  resultToNullable,
  isRecoverableError,
  getErrorRecoveryAction,
} from '@/lib/utils/hook-error-patterns';

// Mock dependencies
jest.mock('@/hooks/use-toast');
jest.mock('@/lib/utils/logger');
jest.mock('@/lib/utils/errors');

describe('Hook Error Patterns', () => {
  describe('enhanceError', () => {
    it('enhances Error objects with classification');
    it('converts non-Error to Error');
    it('preserves original error');
    it('adds category and severity');
  });

  describe('executeWithErrorHandling', () => {
    it('returns ok result on success');
    it('returns err result on failure');
    it('logs errors with context');
    it('shows toast when enabled');
    it('calls onError callback');
    it('skips toast when showToast is false');
  });

  describe('executeWithErrorHandlingSync', () => {
    it('handles synchronous success');
    it('handles synchronous failure');
  });

  describe('useErrorHandler hook', () => {
    it('provides execute function');
    it('provides executeSync function');
    it('provides handleError function');
    it('provides showSuccess function');
    it('uses default operation name from options');
  });

  describe('Utility functions', () => {
    describe('unwrapOrThrow', () => {
      it('returns data for ok result');
      it('throws for err result');
    });

    describe('resultToNullable', () => {
      it('returns data for ok result');
      it('returns null for err result');
    });

    describe('isRecoverableError', () => {
      it('returns true for retryable errors');
      it('returns true for external_api category');
      it('returns false for non-recoverable');
    });

    describe('getErrorRecoveryAction', () => {
      it('returns login for authentication errors');
      it('returns retry for retryable errors');
      it('returns refresh for system/database errors');
      it('returns contact_support otherwise');
    });
  });
});
```

**Note:** This file uses `'use client'` directive - tests must be in `.test.tsx` format and may need React testing utilities.

**Estimated Effort:** 4-5 hours

---

### 2.4 Validation Schemas

#### 2.4.1 `src/lib/validation/schemas/index.ts`

**Current Coverage:** Statements 0%, Branches 100%, Functions 100%, Lines 0%

**Analysis:** Barrel export file for validation schemas.

**Test Strategy:** Cover via imports or add simple export verification test.

**Estimated Effort:** 15 minutes

#### 2.4.2 `src/lib/validation/schemas/report.schema.ts`

**Current Coverage:** Statements 0%, Branches 100%, Functions 100%, Lines 0%

**File Analysis:**

- Zod schemas for report validation
- Multiple schemas: `keyPointSchema`, `therapeuticInsightSchema`, `patternIdentifiedSchema`, `actionItemSchema`, `cognitiveDistortionSchema`, `schemaAnalysisSchema`, `therapeuticFrameworkApplicationSchema`, `recommendationSchema`, `reportGenerationSchema`, `sessionReportSchema`

**Test Strategy:**

```typescript
// __tests__/lib/validation/schemas/report.schema.test.ts
describe('Report Validation Schemas', () => {
  describe('severityLevelSchema', () => {
    it('accepts low, moderate, high');
    it('rejects invalid values');
  });

  describe('keyPointSchema', () => {
    it('accepts valid key point');
    it('rejects missing topic');
    it('rejects topic exceeding max length');
    it('validates relevance enum');
  });

  describe('therapeuticInsightSchema', () => {
    it('accepts valid insight');
    it('validates confidence range 0-100');
  });

  describe('patternIdentifiedSchema', () => {
    it('accepts valid pattern');
    it('validates frequency range 0-10');
    it('validates severity enum');
  });

  describe('actionItemSchema', () => {
    it('accepts valid action item');
    it('validates priority enum');
    it('handles optional timeframe');
  });

  describe('cognitiveDistortionSchema', () => {
    it('accepts valid distortion');
    it('handles optional examples');
    it('validates therapeuticPriority');
  });

  describe('schemaAnalysisSchema', () => {
    it('accepts valid analysis');
    it('handles all optional fields');
    it('validates copingStrategies structure');
  });

  describe('reportGenerationSchema', () => {
    it('accepts valid generation request');
    it('requires at least one message');
    it('limits messages to 1000');
    it('validates reportStyle enum');
  });

  describe('sessionReportSchema', () => {
    it('accepts complete valid report');
    it('validates nested schemas');
  });
});
```

**Estimated Effort:** 3-4 hours

#### 2.4.3 `src/lib/validation/schemas/session.schema.ts`

**Current Coverage:** Statements 0%, Branches 100%, Functions 0%, Lines 0%

**File Analysis:**

- Zod schemas for session validation
- Schemas: `sessionStatusSchema`, `sessionTitleSchema`, `createSessionSchema`, `updateSessionSchema`, `sessionIdSchema`, `sessionSchema`

**Test Strategy:**

```typescript
// __tests__/lib/validation/schemas/session.schema.test.ts
describe('Session Validation Schemas', () => {
  describe('sessionStatusSchema', () => {
    it('accepts active and completed');
    it('rejects invalid status');
  });

  describe('sessionTitleSchema', () => {
    it('accepts valid title');
    it('trims whitespace');
    it('rejects empty title');
    it('rejects title exceeding 200 chars');
  });

  describe('createSessionSchema', () => {
    it('accepts valid creation input');
    it('requires title');
  });

  describe('updateSessionSchema', () => {
    it('accepts partial updates');
    it('requires at least one field');
    it('validates endedAt as positive int or null');
  });

  describe('sessionIdSchema', () => {
    it('accepts valid ID');
    it('rejects empty ID');
  });

  describe('sessionSchema', () => {
    it('accepts complete valid session');
    it('validates all timestamps as positive integers');
    it('validates messageCount as non-negative');
  });
});
```

**Estimated Effort:** 2-3 hours

---

### 2.5 API Module

#### 2.5.1 `src/lib/api/hooks/index.ts`

**Current Coverage:** Statements 0%, Branches 100%, Functions 100%, Lines 0%

**Analysis:** Barrel export file for API hooks.

**Test Strategy:** Cover via imports or add simple export verification test.

**Estimated Effort:** 15 minutes

---

## 3. Priority 2: Very Low Coverage Files (<50%)

### 3.1 `src/lib/utils/render-profiler.ts`

**Current Coverage:** Statements 7.69%, Branches 2.5%, Functions 0%, Lines 8.98%

**File Analysis:**

- React profiler utility for performance monitoring
- Functions: `onRenderCallback`, `getPerformanceReport`, `getAllPerformanceReports`, `clearMetrics`, `logPerformanceSummary`, `createOnRenderCallback`
- Benchmark utilities: `runBenchmark`, `runAsyncBenchmark`, `logBenchmarkResults`

**Test Strategy:**

```typescript
// __tests__/lib/utils/render-profiler.test.ts

// Mock env to enable profiling
jest.mock('@/config/env.public', () => ({
  isDevelopment: true,
  publicEnv: { NEXT_PUBLIC_ENABLE_RENDER_PROFILING: true },
}));

describe('Render Profiler', () => {
  beforeEach(() => clearMetrics());

  describe('onRenderCallback', () => {
    it('stores render metrics');
    it('warns on very slow renders (>50ms)');
    it('warns on slow renders (>16ms)');
    it('does nothing when profiling disabled');
    it('limits stored metrics to MAX_STORED_METRICS');
  });

  describe('getPerformanceReport', () => {
    it('returns null when profiling disabled');
    it('returns null for unknown component');
    it('calculates average render time');
    it('calculates max render time');
    it('counts slow renders');
  });

  describe('getAllPerformanceReports', () => {
    it('returns sorted reports by average time');
    it('returns empty array when disabled');
  });

  describe('logPerformanceSummary', () => {
    it('logs disabled message when profiling off');
    it('logs no data message when empty');
    it('logs performance table with data');
  });

  describe('createOnRenderCallback', () => {
    it('creates callback with custom threshold');
    it('calls onSlowRender handler');
  });

  describe('Benchmark utilities', () => {
    describe('runBenchmark', () => {
      it('runs operation N times');
      it('calculates timing stats');
      it('checks threshold');
    });

    describe('runAsyncBenchmark', () => {
      it('runs async operation N times');
      it('returns correct results');
    });

    describe('logBenchmarkResults', () => {
      it('does nothing when profiling disabled');
      it('logs formatted table');
    });
  });
});
```

**Challenge:** Console logging - may need to spy on console methods.

**Estimated Effort:** 4-5 hours

### 3.2 `src/lib/api/middleware/error-handlers.ts`

**Current Coverage:** Statements 40%, Branches 0%, Functions 0%, Lines 33.33%

**File Analysis:**

- Single export: `errorHandlers.handleDatabaseError()`
- Handles UNIQUE constraint and FOREIGN KEY constraint errors
- Falls back to generic server error

**Test Strategy:**

```typescript
// __tests__/lib/api/middleware/error-handlers.test.ts
import { errorHandlers } from '@/lib/api/middleware/error-handlers';

jest.mock('@/lib/api/api-response');
jest.mock('@/lib/utils/logger');

describe('Error Handlers', () => {
  describe('handleDatabaseError', () => {
    const mockContext = { requestId: 'req-123' };

    it('returns validation error for UNIQUE constraint');
    it('returns validation error for FOREIGN KEY constraint');
    it('returns server error for unknown database errors');
    it('logs database error');
  });
});
```

**Estimated Effort:** 1 hour

---

## 4. Priority 3: Low Coverage Files (50-70% Branch Coverage)

### 4.1 `src/lib/api/dev-logging.ts`

**Current Coverage:** Statements 59.85%, Branches 64.95%, Functions 50%, Lines 61.6%

**Gaps to Cover:**

- Uncovered branches in conditional logging
- Functions with 50% coverage

**Estimated Effort:** 2 hours

### 4.2 `src/lib/api/retry.ts`

**Current Coverage:** Statements 78.72%, Branches 63.82%, Functions 100%, Lines 82.78%

**Gaps to Cover:**

- Branch coverage for retry conditions
- Edge cases in retry logic

**Estimated Effort:** 2 hours

### 4.3 `src/lib/astronomy/moon.ts`

**Current Coverage:** Statements 82.5%, Branches 58.82%, Functions 100%, Lines 90.9%

**Gaps to Cover:**

- Branch conditions for moon phase calculations
- Edge cases around date boundaries

**Estimated Effort:** 1.5 hours

### 4.4 `src/lib/monitoring/web-vitals.ts`

**Current Coverage:** Statements 90.9%, Branches 68.18%, Functions 100%, Lines 90%

**Gaps to Cover:**

- Edge cases in web vitals reporting
- Error handling branches

**Estimated Effort:** 1 hour

### 4.5 `src/lib/api/middleware.ts`

**Current Coverage:** Statements 79.08%, Branches 66.49%, Functions 66.66%, Lines 79.53%

**Gaps to Cover:**

- Additional middleware branches
- Error handling paths
- Function coverage gaps

**Estimated Effort:** 2-3 hours

### 4.6 `src/lib/utils/helpers.ts`

**Current Coverage:** Statements 88.75%, Branches 68.42%, Functions 86.44%, Lines 90.74%

**Gaps to Cover:**

- Additional branch conditions
- Remaining uncovered functions

**Estimated Effort:** 1.5 hours

### 4.7 `src/lib/utils/validation.ts`

**Current Coverage:** Statements 84.61%, Branches 66.66%, Functions 80%, Lines 96.29%

**Gaps to Cover:**

- Branch conditions in validation
- Functions with missing coverage

**Estimated Effort:** 1 hour

---

## 5. Test Implementation Guidelines

### 5.1 Project Test Conventions

Based on analysis of existing tests:

1. **File Location:** Tests in `__tests__/` mirroring `src/` structure
2. **File Naming:** `.test.ts` for utilities, `.test.tsx` for React components
3. **Test Structure:**

   ```typescript
   describe('ModuleName', () => {
     beforeEach(() => {
       jest.clearAllMocks();
     });

     describe('functionName', () => {
       it('describes expected behavior');
     });
   });
   ```

### 5.2 Mocking Patterns

**Logger Mocking:**

```typescript
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));
```

**Environment Mocking:**

```typescript
jest.mock('@/config/env.public', () => ({
  isDevelopment: true,
  publicEnv: { FEATURE_FLAG: true },
}));
```

**API Client Mocking:**

```typescript
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    methodName: jest.fn(),
  },
}));
```

### 5.3 Testing React Hooks

```typescript
import { renderHook, act } from '@testing-library/react';

const { result } = renderHook(() => useMyHook());

await act(async () => {
  await result.current.asyncMethod();
});

expect(result.current.state).toBe(expected);
```

### 5.4 Testing Zod Schemas

```typescript
describe('schemaName', () => {
  it('accepts valid input', () => {
    const result = schema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects invalid input', () => {
    const result = schema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('expected');
    }
  });
});
```

---

## 6. Implementation Plan

### 6.1 Phase 1: Zero Coverage Files (Days 1-3)

| Day | Files                                    | Est. Hours |
| --- | ---------------------------------------- | ---------- |
| 1   | csp-config.ts, csp-violations.ts         | 4-5        |
| 2   | api-client-adapter.ts, error-handlers.ts | 3-4        |
| 3   | hook-error-patterns.ts                   | 4-5        |

### 6.2 Phase 2: Validation Schemas (Day 4)

| File              | Est. Hours |
| ----------------- | ---------- |
| report.schema.ts  | 3-4        |
| session.schema.ts | 2-3        |
| Barrel exports    | 0.5        |

### 6.3 Phase 3: Low Coverage Files (Days 5-6)

| Day | Files                                              | Est. Hours |
| --- | -------------------------------------------------- | ---------- |
| 5   | render-profiler.ts, dev-logging.ts                 | 6-7        |
| 6   | retry.ts, middleware.ts, helpers.ts, validation.ts | 8-9        |

### 6.4 Phase 4: Final Coverage & Review (Day 7)

- Run full coverage report
- Address any remaining gaps
- Review test quality
- Ensure no regressions

---

## 7. Verification Steps

### 7.1 Running Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- __tests__/lib/security/csp-config.test.ts
```

### 7.2 Coverage Verification

```bash
# Generate coverage report
npm run test:coverage

# Check specific metrics
# Statement coverage: 90%+
# Branch coverage: 85%+
# Function coverage: 90%+
# Line coverage: 90%+
```

### 7.3 Quality Checklist

- [ ] All tests pass
- [ ] Coverage thresholds met
- [ ] No mocking of business logic
- [ ] Edge cases covered
- [ ] Error paths tested
- [ ] Tests follow project conventions
- [ ] No console warnings/errors

---

## 8. Risk Assessment

### 8.1 Technical Risks

| Risk                       | Mitigation                                   |
| -------------------------- | -------------------------------------------- |
| Complex async testing      | Use act() and waitFor() from testing-library |
| Environment-dependent code | Proper mocking of isDevelopment              |
| React hook testing         | Use renderHook from testing-library          |
| Console logging in tests   | Spy on console methods                       |

### 8.2 Time Risks

| Risk                       | Mitigation                      |
| -------------------------- | ------------------------------- |
| Underestimated complexity  | Built-in buffer in estimates    |
| Dependencies between files | Prioritized by isolation level  |
| Flaky tests                | Follow existing stable patterns |

---

## 9. Appendix

### 9.1 File Dependencies

```
csp-config.ts <- No dependencies (can test first)
csp-violations.ts <- config/env.public
api-client-adapter.ts <- lib/api/client, types
hook-error-patterns.ts <- hooks/use-toast, utils/*, errors
render-profiler.ts <- config/env.public
```

### 9.2 Estimated Total Effort

- **Priority 1 (Zero Coverage):** 16-20 hours
- **Priority 2 (Very Low Coverage):** 5-6 hours
- **Priority 3 (Low Branch Coverage):** 10-12 hours
- **Buffer & Review:** 4-6 hours
- **Total:** 35-44 hours (5-7 working days)
