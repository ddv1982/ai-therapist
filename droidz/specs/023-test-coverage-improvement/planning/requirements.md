# Test Coverage Improvement

## Current State

**Overall Coverage:** Statements 84.45%, Branches 76.49%, Functions 87.46%, Lines 86.59%
**Threshold:** 70% (PASSED)
**Goal:** Increase to 90%+ across all metrics

## Critical Coverage Gaps (Below 70%)

### Priority 1: Zero Coverage Files

| File                                           | Stmts | Branch | Funcs | Lines |
| ---------------------------------------------- | ----- | ------ | ----- | ----- |
| `src/lib/security/csp-config.ts`               | 0%    | 100%   | 0%    | 0%    |
| `src/lib/security/csp-violations.ts`           | 0%    | 0%     | 0%    | 0%    |
| `src/lib/services/chat/api-client-adapter.ts`  | 0%    | 0%     | 0%    | 0%    |
| `src/lib/services/chat/index.ts`               | 0%    | 100%   | 100%  | 0%    |
| `src/lib/utils/hook-error-patterns.ts`         | 0%    | 0%     | 0%    | 0%    |
| `src/lib/api/hooks/index.ts`                   | 0%    | 100%   | 100%  | 0%    |
| `src/lib/validation/schemas/index.ts`          | 0%    | 100%   | 100%  | 0%    |
| `src/lib/validation/schemas/report.schema.ts`  | 0%    | 100%   | 100%  | 0%    |
| `src/lib/validation/schemas/session.schema.ts` | 0%    | 100%   | 0%    | 0%    |

### Priority 2: Very Low Coverage (<50%)

| File                                       | Stmts  | Branch | Funcs | Lines  |
| ------------------------------------------ | ------ | ------ | ----- | ------ |
| `src/lib/utils/render-profiler.ts`         | 7.69%  | 2.5%   | 0%    | 8.98%  |
| `src/lib/api/middleware/error-handlers.ts` | 40%    | 0%     | 0%    | 33.33% |
| `src/lib/therapy/analysis-schema.ts`       | 53.33% | 100%   | 100%  | 100%   |

### Priority 3: Low Coverage (50-70%)

| File                               | Stmts  | Branch | Funcs  | Lines  |
| ---------------------------------- | ------ | ------ | ------ | ------ |
| `src/lib/api/dev-logging.ts`       | 59.85% | 64.95% | 50%    | 61.6%  |
| `src/lib/api/retry.ts`             | 78.72% | 63.82% | 100%   | 82.78% |
| `src/lib/astronomy/moon.ts`        | 82.5%  | 58.82% | 100%   | 90.9%  |
| `src/lib/monitoring/web-vitals.ts` | 90.9%  | 68.18% | 100%   | 90%    |
| `src/lib/api/middleware.ts`        | 79.08% | 66.49% | 66.66% | 79.53% |
| `src/lib/utils/helpers.ts`         | 88.75% | 68.42% | 86.44% | 90.74% |
| `src/lib/utils/validation.ts`      | 84.61% | 66.66% | 80%    | 96.29% |

## Requirements

### Target Metrics

- **Statements:** 90%+ (currently 84.45%)
- **Branches:** 85%+ (currently 76.49%)
- **Functions:** 90%+ (currently 87.46%)
- **Lines:** 90%+ (currently 86.59%)

### Constraints

- Tests must be meaningful, not just for coverage
- No mocking of business logic
- Focus on edge cases and error paths
- Maintain existing test patterns and conventions

### Test Categories Needed

1. **Unit tests** for utility functions and services
2. **Integration tests** for API middleware
3. **Edge case tests** for error handling paths

## Affected Files Summary

### Security Module (0% → 80%+)

- `csp-config.ts` - CSP configuration exports
- `csp-violations.ts` - Violation tracking and storage

### Services Module (73% → 90%+)

- `api-client-adapter.ts` - API client wrapper
- `index.ts` barrel exports

### Utils Module (69% → 90%+)

- `hook-error-patterns.ts` - Error pattern utilities
- `render-profiler.ts` - React profiler utilities

### Validation Schemas (18% → 90%+)

- `index.ts` - Schema exports
- `report.schema.ts` - Report validation
- `session.schema.ts` - Session validation

### API Module (81% → 90%+)

- `dev-logging.ts` - Development logging
- `retry.ts` - Retry logic
- `middleware.ts` - Request middleware
- `error-handlers.ts` - Error handling

## Success Criteria

1. All files have minimum 80% statement coverage
2. All files have minimum 75% branch coverage
3. Overall coverage reaches 90%+ statements
4. No regression in existing tests
5. All new tests follow project conventions
