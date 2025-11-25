# Implementation: Task Group 5 - Render Profiler Tests

## Task Assignment

### Task 5.1: Create Render Profiler Tests

- **File to Test:** `src/lib/utils/render-profiler.ts`
- **Test File Location:** `__tests__/lib/utils/render-profiler.test.ts`
- **Current Coverage:** Statements 7.69%, Branches 2.5%, Functions 0%, Lines 8.98%
- **Key Test Cases:**
  - `onRenderCallback()`: stores metrics, warns on slow renders (>50ms, >16ms), no-op when disabled
  - `getPerformanceReport()`: null when disabled, null for unknown component, calculates avg/max
  - `getAllPerformanceReports()`: sorted by average time, empty when disabled
  - `logPerformanceSummary()`: logs disabled message, no data message, performance table
  - `createOnRenderCallback()`: custom threshold, calls onSlowRender handler
  - `runBenchmark()`: runs N times, calculates timing stats, checks threshold
  - `runAsyncBenchmark()`: async operation N times, returns correct results
  - `logBenchmarkResults()`: no-op when disabled, logs formatted table
- **Estimated Effort:** 4-5 hours

## Context Files

Read these for requirements and patterns:

- spec: `droidz/specs/023-test-coverage-improvement/spec.md`
- requirements: `droidz/specs/023-test-coverage-improvement/planning/requirements.md`
- tasks: `droidz/specs/023-test-coverage-improvement/tasks.md`

Key files to study:

- `src/lib/utils/render-profiler.ts` - File to test
- `__tests__/lib/utils/` - Existing utility test patterns

## Instructions

1. Read the source file to understand all exports
2. Mock environment configuration:
   ```typescript
   jest.mock('@/config/env.public', () => ({
     isDevelopment: true,
     publicEnv: { NEXT_PUBLIC_ENABLE_RENDER_PROFILING: true },
   }));
   ```
3. Spy on console methods for logging verification:
   ```typescript
   jest.spyOn(console, 'warn').mockImplementation(() => {});
   jest.spyOn(console, 'table').mockImplementation(() => {});
   ```
4. Test with profiling enabled and disabled
5. Clear metrics between tests with `clearMetrics()`
6. Test timing calculations with controlled inputs
7. Run tests: `npm test -- __tests__/lib/utils/render-profiler.test.ts`
8. Verify coverage: `npm run test:coverage`
9. Mark tasks complete with [x] in `droidz/specs/023-test-coverage-improvement/tasks.md`

## Standards

- Mock environment variables for profiling toggle
- Use jest.spyOn for console method verification
- Clear state between tests (beforeEach)
- Test both enabled and disabled states
- Verify timing calculations are accurate
