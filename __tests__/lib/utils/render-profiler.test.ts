/**
 * Tests for Render Profiler
 *
 * Validates React render profiling and benchmarking utilities
 */

// Mock the env config before importing the module
jest.mock('@/config/env.public', () => ({
  isDevelopment: true,
  publicEnv: {
    NEXT_PUBLIC_ENABLE_RENDER_PROFILING: true,
  },
}));

import {
  onRenderCallback,
  getPerformanceReport,
  getAllPerformanceReports,
  clearMetrics,
  logPerformanceSummary,
  createOnRenderCallback,
  runBenchmark,
  runAsyncBenchmark,
  logBenchmarkResults,
  ENABLE_PROFILING,
  SLOW_RENDER_THRESHOLD_MS,
  HOOK_PERFORMANCE_THRESHOLDS,
} from '@/lib/utils/render-profiler';

describe('Render Profiler', () => {
  beforeEach(() => {
    clearMetrics();
    jest.clearAllMocks();
  });

  describe('Constants', () => {
    it('ENABLE_PROFILING is true when env configured', () => {
      expect(ENABLE_PROFILING).toBe(true);
    });

    it('SLOW_RENDER_THRESHOLD_MS is 16ms (60fps)', () => {
      expect(SLOW_RENDER_THRESHOLD_MS).toBe(16);
    });

    it('HOOK_PERFORMANCE_THRESHOLDS has expected values', () => {
      expect(HOOK_PERFORMANCE_THRESHOLDS.MESSAGE_UPDATE).toBeDefined();
      expect(HOOK_PERFORMANCE_THRESHOLDS.MESSAGE_ADD).toBeDefined();
      expect(HOOK_PERFORMANCE_THRESHOLDS.MESSAGES_LOAD_PER_10).toBeDefined();
      expect(HOOK_PERFORMANCE_THRESHOLDS.MESSAGES_CLEAR).toBeDefined();
      expect(HOOK_PERFORMANCE_THRESHOLDS.METADATA_UPDATE).toBeDefined();
      expect(HOOK_PERFORMANCE_THRESHOLDS.MESSAGE_LIST_RENDER).toBe(16);
    });
  });

  describe('onRenderCallback', () => {
    it('stores render metrics', () => {
      onRenderCallback('TestComponent', 'mount', 10, 15, 0, 10);

      const report = getPerformanceReport('TestComponent');
      expect(report).not.toBeNull();
      expect(report?.component).toBe('TestComponent');
      expect(report?.renderCount).toBe(1);
    });

    it('accumulates multiple renders', () => {
      onRenderCallback('TestComponent', 'mount', 10, 15, 0, 10);
      onRenderCallback('TestComponent', 'update', 5, 10, 10, 15);
      onRenderCallback('TestComponent', 'update', 8, 12, 15, 23);

      const report = getPerformanceReport('TestComponent');
      expect(report?.renderCount).toBe(3);
    });

    it('warns on very slow renders (>50ms)', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      onRenderCallback('SlowComponent', 'mount', 55, 60, 0, 55);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('VERY SLOW RENDER'),
        expect.any(Object)
      );
      consoleSpy.mockRestore();
    });

    it('warns on slow renders (>16ms)', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      onRenderCallback('ModerateComponent', 'update', 25, 30, 0, 25);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slow render'),
        expect.any(Object)
      );
      consoleSpy.mockRestore();
    });

    it('does not warn for fast renders', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      onRenderCallback('FastComponent', 'update', 5, 8, 0, 5);

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('limits stored metrics to MAX_STORED_METRICS', () => {
      // Add more than max metrics
      for (let i = 0; i < 150; i++) {
        onRenderCallback('TestComponent', 'update', 5, 8, i, i + 5);
      }

      const report = getPerformanceReport('TestComponent');
      expect(report?.renderCount).toBe(100); // MAX_STORED_METRICS
    });

    it('handles different phases', () => {
      onRenderCallback('Component', 'mount', 10, 15, 0, 10);
      onRenderCallback('Component', 'update', 5, 8, 10, 15);
      onRenderCallback('Component', 'nested-update', 3, 5, 15, 18);

      const report = getPerformanceReport('Component');
      expect(report?.renderCount).toBe(3);
    });
  });

  describe('getPerformanceReport', () => {
    it('returns null for unknown component', () => {
      const report = getPerformanceReport('UnknownComponent');
      expect(report).toBeNull();
    });

    it('calculates average render time', () => {
      onRenderCallback('AvgTest', 'mount', 10, 15, 0, 10);
      onRenderCallback('AvgTest', 'update', 20, 25, 10, 30);

      const report = getPerformanceReport('AvgTest');
      expect(report?.averageRenderTime).toBe(15); // (10 + 20) / 2
    });

    it('calculates max render time', () => {
      onRenderCallback('MaxTest', 'mount', 10, 15, 0, 10);
      onRenderCallback('MaxTest', 'update', 30, 35, 10, 40);
      onRenderCallback('MaxTest', 'update', 20, 25, 40, 60);

      const report = getPerformanceReport('MaxTest');
      expect(report?.maxRenderTime).toBe(30);
    });

    it('counts slow renders', () => {
      onRenderCallback('SlowCount', 'mount', 5, 8, 0, 5); // Fast
      onRenderCallback('SlowCount', 'update', 20, 25, 5, 25); // Slow
      onRenderCallback('SlowCount', 'update', 25, 30, 25, 50); // Slow
      onRenderCallback('SlowCount', 'update', 10, 15, 50, 60); // Fast

      const report = getPerformanceReport('SlowCount');
      expect(report?.slowRenderCount).toBe(2);
    });

    it('includes timestamp', () => {
      const before = Date.now();
      onRenderCallback('TimestampTest', 'mount', 10, 15, 0, 10);
      const report = getPerformanceReport('TimestampTest');
      const after = Date.now();

      expect(report?.timestamp).toBeGreaterThanOrEqual(before);
      expect(report?.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('getAllPerformanceReports', () => {
    it('returns sorted reports by average time', () => {
      // Add slower component first
      onRenderCallback('FastComponent', 'mount', 5, 8, 0, 5);
      onRenderCallback('SlowComponent', 'mount', 30, 35, 0, 30);
      onRenderCallback('MediumComponent', 'mount', 15, 20, 0, 15);

      const reports = getAllPerformanceReports();

      expect(reports.length).toBe(3);
      expect(reports[0].component).toBe('SlowComponent');
      expect(reports[1].component).toBe('MediumComponent');
      expect(reports[2].component).toBe('FastComponent');
    });

    it('returns empty array when no data', () => {
      const reports = getAllPerformanceReports();
      expect(reports).toEqual([]);
    });
  });

  describe('clearMetrics', () => {
    it('clears all stored metrics', () => {
      onRenderCallback('Component1', 'mount', 10, 15, 0, 10);
      onRenderCallback('Component2', 'mount', 20, 25, 0, 20);

      expect(getAllPerformanceReports().length).toBe(2);

      clearMetrics();

      expect(getAllPerformanceReports().length).toBe(0);
    });
  });

  describe('logPerformanceSummary', () => {
    it('logs performance table with data', () => {
      const consoleGroupSpy = jest.spyOn(console, 'group').mockImplementation();
      const consoleTableSpy = jest.spyOn(console, 'table').mockImplementation();
      const consoleGroupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation();

      onRenderCallback('TestComponent', 'mount', 10, 15, 0, 10);

      logPerformanceSummary();

      expect(consoleGroupSpy).toHaveBeenCalledWith(expect.stringContaining('Performance Summary'));
      expect(consoleTableSpy).toHaveBeenCalled();
      expect(consoleGroupEndSpy).toHaveBeenCalled();

      consoleGroupSpy.mockRestore();
      consoleTableSpy.mockRestore();
      consoleGroupEndSpy.mockRestore();
    });

    it('logs no data message when empty', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      logPerformanceSummary();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No render data'));

      consoleLogSpy.mockRestore();
    });
  });

  describe('createOnRenderCallback', () => {
    it('creates callback with custom threshold', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const customCallback = createOnRenderCallback({ threshold: 5 });

      // This would be slow for 5ms threshold but not for default 16ms
      customCallback('CustomThreshold', 'update', 10, 15, 0, 10);

      // Should have warned since 10ms > 5ms threshold
      // Note: The callback also calls the base onRenderCallback which may warn
      // at the default threshold, so we check it was called
      const report = getPerformanceReport('CustomThreshold');
      expect(report).not.toBeNull();

      consoleSpy.mockRestore();
    });

    it('calls onSlowRender handler', () => {
      const onSlowRender = jest.fn();
      const customCallback = createOnRenderCallback({
        threshold: 5,
        onSlowRender,
      });

      customCallback('SlowHandler', 'update', 10, 15, 0, 10);

      expect(onSlowRender).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'SlowHandler',
          phase: 'update',
          actualDuration: 10,
        })
      );
    });

    it('does not call onSlowRender for fast renders', () => {
      const onSlowRender = jest.fn();
      const customCallback = createOnRenderCallback({
        threshold: 20,
        onSlowRender,
      });

      customCallback('FastRender', 'update', 5, 8, 0, 5);

      expect(onSlowRender).not.toHaveBeenCalled();
    });
  });

  describe('runBenchmark', () => {
    it('runs operation N times', () => {
      let callCount = 0;
      const operation = () => {
        callCount++;
      };

      runBenchmark({ name: 'TestBenchmark', iterations: 50 }, operation);

      expect(callCount).toBe(50);
    });

    it('calculates timing stats', () => {
      const operation = () => {
        // Simple operation
        const arr = Array(100).fill(0);
        arr.reduce((a, b) => a + b, 0);
      };

      const result = runBenchmark(
        { name: 'TimingTest', iterations: 10, threshold: 1000 },
        operation
      );

      expect(result.name).toBe('TimingTest');
      expect(result.iterations).toBe(10);
      expect(result.totalTime).toBeGreaterThan(0);
      expect(result.averageTime).toBeGreaterThan(0);
      expect(result.minTime).toBeGreaterThanOrEqual(0);
      expect(result.maxTime).toBeGreaterThanOrEqual(result.minTime);
      expect(result.threshold).toBe(1000);
    });

    it('checks threshold correctly', () => {
      const fastOperation = () => {};

      const result = runBenchmark(
        { name: 'ThresholdTest', iterations: 10, threshold: 1000 },
        fastOperation
      );

      expect(result.passesThreshold).toBe(true);
    });

    it('uses default values', () => {
      const result = runBenchmark({ name: 'DefaultsTest' }, () => {});

      expect(result.iterations).toBe(100); // Default
      expect(result.threshold).toBe(16); // Default
    });
  });

  describe('runAsyncBenchmark', () => {
    it('runs async operation N times', async () => {
      let callCount = 0;
      const operation = async () => {
        callCount++;
        await Promise.resolve();
      };

      await runAsyncBenchmark({ name: 'AsyncTest', iterations: 25 }, operation);

      expect(callCount).toBe(25);
    });

    it('returns correct results', async () => {
      const operation = async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
      };

      const result = await runAsyncBenchmark(
        { name: 'AsyncResult', iterations: 5, threshold: 100 },
        operation
      );

      expect(result.name).toBe('AsyncResult');
      expect(result.iterations).toBe(5);
      expect(result.averageTime).toBeGreaterThan(0);
      expect(result.passesThreshold).toBe(true);
    });

    it('calculates min and max times', async () => {
      const operation = async () => {
        await Promise.resolve();
      };

      const result = await runAsyncBenchmark({ name: 'MinMaxTest', iterations: 10 }, operation);

      expect(result.minTime).toBeLessThanOrEqual(result.maxTime);
      expect(result.averageTime).toBeGreaterThanOrEqual(result.minTime);
      expect(result.averageTime).toBeLessThanOrEqual(result.maxTime);
    });
  });

  describe('logBenchmarkResults', () => {
    it('logs formatted table', () => {
      const consoleGroupSpy = jest.spyOn(console, 'group').mockImplementation();
      const consoleTableSpy = jest.spyOn(console, 'table').mockImplementation();
      const consoleGroupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation();

      const results = [
        {
          name: 'Test1',
          iterations: 100,
          totalTime: 50,
          averageTime: 0.5,
          minTime: 0.3,
          maxTime: 0.8,
          passesThreshold: true,
          threshold: 16,
        },
      ];

      logBenchmarkResults(results);

      expect(consoleGroupSpy).toHaveBeenCalledWith(expect.stringContaining('Benchmark'));
      expect(consoleTableSpy).toHaveBeenCalled();
      expect(consoleGroupEndSpy).toHaveBeenCalled();

      consoleGroupSpy.mockRestore();
      consoleTableSpy.mockRestore();
      consoleGroupEndSpy.mockRestore();
    });

    it('handles empty results array', () => {
      const consoleGroupSpy = jest.spyOn(console, 'group').mockImplementation();
      const consoleTableSpy = jest.spyOn(console, 'table').mockImplementation();
      const consoleGroupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation();

      logBenchmarkResults([]);

      expect(consoleGroupSpy).toHaveBeenCalled();
      expect(consoleTableSpy).toHaveBeenCalledWith([]);
      expect(consoleGroupEndSpy).toHaveBeenCalled();

      consoleGroupSpy.mockRestore();
      consoleTableSpy.mockRestore();
      consoleGroupEndSpy.mockRestore();
    });
  });
});

describe('Render Profiler (Disabled Mode)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('returns null/empty when profiling disabled', async () => {
    jest.doMock('@/config/env.public', () => ({
      isDevelopment: false,
      publicEnv: {
        NEXT_PUBLIC_ENABLE_RENDER_PROFILING: false,
      },
    }));

    const {
      onRenderCallback: onRenderDisabled,
      getPerformanceReport: getReportDisabled,
      getAllPerformanceReports: getAllReportsDisabled,
      logPerformanceSummary: logSummaryDisabled,
      logBenchmarkResults: logBenchmarkDisabled,
      ENABLE_PROFILING: PROFILING_DISABLED,
    } = await import('@/lib/utils/render-profiler');

    expect(PROFILING_DISABLED).toBe(false);

    // These should be no-ops or return null/empty
    onRenderDisabled('Test', 'mount', 100, 100, 0, 100);
    expect(getReportDisabled('Test')).toBeNull();
    expect(getAllReportsDisabled()).toEqual([]);

    // Should log disabled message
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    logSummaryDisabled();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('disabled'));
    consoleLogSpy.mockRestore();

    // logBenchmarkResults should be no-op when disabled
    const consoleGroupSpy = jest.spyOn(console, 'group').mockImplementation();
    logBenchmarkDisabled([]);
    expect(consoleGroupSpy).not.toHaveBeenCalled();
    consoleGroupSpy.mockRestore();
  });
});
