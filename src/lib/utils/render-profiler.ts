/**
 * Render Performance Monitoring Utility
 *
 * Development-only utility for detecting slow renders and providing
 * performance insights for React components.
 *
 * Usage:
 * - Enable by setting NEXT_PUBLIC_ENABLE_RENDER_PROFILING=true in your .env.local
 * - Wrap components with React Profiler and use onRenderCallback
 * - Check console for warnings about slow renders (> 16ms)
 *
 * Example:
 * ```tsx
 * import { Profiler } from 'react';
 * import { onRenderCallback } from '@/lib/utils/render-profiler';
 *
 * <Profiler id="MessageList" onRender={onRenderCallback}>
 *   <MessageList messages={messages} />
 * </Profiler>
 * ```
 *
 * API:
 * - onRenderCallback: React Profiler callback that logs slow renders
 * - getPerformanceReport(id): Get metrics for a specific component
 * - getAllPerformanceReports(): Get all collected metrics
 * - logPerformanceSummary(): Print summary table to console
 * - clearMetrics(): Reset all collected data
 */

import { isDevelopment, publicEnv } from '@/config/env.public';
import { logger } from '@/lib/utils/logger';

// Only enable in development when explicitly opted in
const ENABLE_PROFILING = isDevelopment && publicEnv.NEXT_PUBLIC_ENABLE_RENDER_PROFILING;

// Threshold for slow render warnings (60fps = 16.67ms per frame)
const SLOW_RENDER_THRESHOLD_MS = 16;

// Threshold for very slow renders
const VERY_SLOW_RENDER_THRESHOLD_MS = 50;

interface RenderMetrics {
  id: string;
  phase: 'mount' | 'update' | 'nested-update';
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
}

interface PerformanceReport {
  component: string;
  averageRenderTime: number;
  maxRenderTime: number;
  renderCount: number;
  slowRenderCount: number;
  timestamp: number;
}

// Store metrics for analysis
const metricsStore = new Map<string, RenderMetrics[]>();
const MAX_STORED_METRICS = 100;

/**
 * React Profiler onRender callback for performance monitoring
 *
 * @example
 * ```tsx
 * <Profiler id="MessageList" onRender={onRenderCallback}>
 *   <MessageList messages={messages} />
 * </Profiler>
 * ```
 */
export function onRenderCallback(
  id: string,
  phase: 'mount' | 'update' | 'nested-update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
): void {
  if (!ENABLE_PROFILING) return;

  const metrics: RenderMetrics = {
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
  };

  // Store metrics
  const stored = metricsStore.get(id) ?? [];
  stored.push(metrics);
  if (stored.length > MAX_STORED_METRICS) {
    stored.shift();
  }
  metricsStore.set(id, stored);

  // Warn about slow renders
  if (actualDuration > VERY_SLOW_RENDER_THRESHOLD_MS) {
    logger.warn('Render profiler: very slow render detected', {
      component: id,
      phase,
      actualDurationMs: Number(actualDuration.toFixed(2)),
      baseDurationMs: Number(baseDuration.toFixed(2)),
      recommendation: 'Consider memoizing this component or breaking it into smaller parts',
    });
  } else if (actualDuration > SLOW_RENDER_THRESHOLD_MS) {
    logger.warn('Render profiler: slow render detected', {
      component: id,
      phase,
      actualDurationMs: Number(actualDuration.toFixed(2)),
      baseDurationMs: Number(baseDuration.toFixed(2)),
    });
  }
}

/**
 * Get performance report for a specific component
 */
export function getPerformanceReport(componentId: string): PerformanceReport | null {
  if (!ENABLE_PROFILING) return null;

  const metrics = metricsStore.get(componentId);
  if (!metrics || metrics.length === 0) return null;

  const renderTimes = metrics.map((m) => m.actualDuration);
  const avgTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
  const maxTime = Math.max(...renderTimes);
  const slowRenders = renderTimes.filter((t) => t > SLOW_RENDER_THRESHOLD_MS).length;

  return {
    component: componentId,
    averageRenderTime: avgTime,
    maxRenderTime: maxTime,
    renderCount: metrics.length,
    slowRenderCount: slowRenders,
    timestamp: Date.now(),
  };
}

/**
 * Get all stored performance reports
 */
export function getAllPerformanceReports(): PerformanceReport[] {
  if (!ENABLE_PROFILING) return [];

  const reports: PerformanceReport[] = [];
  for (const componentId of metricsStore.keys()) {
    const report = getPerformanceReport(componentId);
    if (report) {
      reports.push(report);
    }
  }

  return reports.sort((a, b) => b.averageRenderTime - a.averageRenderTime);
}

/**
 * Clear all stored metrics
 */
export function clearMetrics(): void {
  metricsStore.clear();
}

/**
 * Print a summary of all render performance to console
 */
export function logPerformanceSummary(): void {
  if (!ENABLE_PROFILING) {
    logger.info('Render profiler is disabled', {
      hint: 'Set NEXT_PUBLIC_ENABLE_RENDER_PROFILING=true to enable',
    });
    return;
  }

  const reports = getAllPerformanceReports();
  if (reports.length === 0) {
    logger.info('Render profiler has no data yet');
    return;
  }

  logger.info('Render profiler summary', {
    reports: reports.map((r) => ({
      component: r.component,
      averageRenderMs: Number(r.averageRenderTime.toFixed(2)),
      maxRenderMs: Number(r.maxRenderTime.toFixed(2)),
      renderCount: r.renderCount,
      slowRenders: r.slowRenderCount,
    })),
  });
}

/**
 * Create a wrapped onRender callback with custom threshold
 */
export function createOnRenderCallback(options?: {
  threshold?: number;
  onSlowRender?: (metrics: RenderMetrics) => void;
}) {
  const threshold = options?.threshold ?? SLOW_RENDER_THRESHOLD_MS;

  return function customOnRenderCallback(
    id: string,
    phase: 'mount' | 'update' | 'nested-update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ): void {
    // Store metrics using the base callback
    onRenderCallback(id, phase, actualDuration, baseDuration, startTime, commitTime);

    // Custom slow render handler
    if (actualDuration > threshold && options?.onSlowRender) {
      options.onSlowRender({
        id,
        phase,
        actualDuration,
        baseDuration,
        startTime,
        commitTime,
      });
    }
  };
}

// Export for use in development tools
export { ENABLE_PROFILING, SLOW_RENDER_THRESHOLD_MS };

// ============================================================================
// HOOK BENCHMARKING UTILITIES
// ============================================================================

/**
 * Benchmark configuration for hook operations.
 */
export interface BenchmarkConfig {
  /** Name of the operation being benchmarked */
  name: string;
  /** Number of iterations to run (default: 100) */
  iterations?: number;
  /** Acceptable threshold in milliseconds (default: 16ms for 60fps) */
  threshold?: number;
}

/**
 * Benchmark result from running a hook operation.
 */
export interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  passesThreshold: boolean;
  threshold: number;
}

/**
 * Runs a benchmark for a synchronous operation.
 *
 * @param config - Benchmark configuration
 * @param operation - The operation to benchmark
 * @returns Benchmark results
 *
 * @example
 * ```ts
 * const result = runBenchmark(
 *   { name: 'updateMessage', iterations: 1000, threshold: 1 },
 *   () => updateMessage('msg-1', { content: 'Updated' })
 * );
 * console.log(`Average time: ${result.averageTime}ms`);
 * ```
 */
export function runBenchmark(config: BenchmarkConfig, operation: () => void): BenchmarkResult {
  const { name, iterations = 100, threshold = 16 } = config;
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    operation();
    const end = performance.now();
    times.push(end - start);
  }

  const totalTime = times.reduce((a, b) => a + b, 0);
  const averageTime = totalTime / iterations;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  return {
    name,
    iterations,
    totalTime,
    averageTime,
    minTime,
    maxTime,
    passesThreshold: averageTime <= threshold,
    threshold,
  };
}

/**
 * Runs a benchmark for an asynchronous operation.
 *
 * @param config - Benchmark configuration
 * @param operation - The async operation to benchmark
 * @returns Promise resolving to benchmark results
 */
export async function runAsyncBenchmark(
  config: BenchmarkConfig,
  operation: () => Promise<void>
): Promise<BenchmarkResult> {
  const { name, iterations = 100, threshold = 16 } = config;
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await operation();
    const end = performance.now();
    times.push(end - start);
  }

  const totalTime = times.reduce((a, b) => a + b, 0);
  const averageTime = totalTime / iterations;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  return {
    name,
    iterations,
    totalTime,
    averageTime,
    minTime,
    maxTime,
    passesThreshold: averageTime <= threshold,
    threshold,
  };
}

/**
 * Logs benchmark results to console in a formatted table.
 *
 * @param results - Array of benchmark results to display
 */
export function logBenchmarkResults(results: BenchmarkResult[]): void {
  if (!ENABLE_PROFILING) return;

  // eslint-disable-next-line no-console -- Profiler intentionally logs to console
  console.group('[Benchmark] Results');
  // eslint-disable-next-line no-console -- Profiler intentionally logs to console
  console.table(
    results.map((r) => ({
      Operation: r.name,
      Iterations: r.iterations,
      'Avg (ms)': r.averageTime.toFixed(3),
      'Min (ms)': r.minTime.toFixed(3),
      'Max (ms)': r.maxTime.toFixed(3),
      'Threshold (ms)': r.threshold,
      Passes: r.passesThreshold ? '✅' : '❌',
    }))
  );
  // eslint-disable-next-line no-console -- Profiler intentionally logs to console
  console.groupEnd();
}

/**
 * Acceptable performance thresholds for hook operations.
 * These values are based on 60fps rendering requirements.
 */
export const HOOK_PERFORMANCE_THRESHOLDS = {
  /** Time for a single message update */
  MESSAGE_UPDATE: 1,
  /** Time for adding a message */
  MESSAGE_ADD: 2,
  /** Time for loading messages (per 10 messages) */
  MESSAGES_LOAD_PER_10: 5,
  /** Time for clearing messages */
  MESSAGES_CLEAR: 1,
  /** Time for metadata update */
  METADATA_UPDATE: 2,
  /** Total render time for message list */
  MESSAGE_LIST_RENDER: 16,
} as const;
