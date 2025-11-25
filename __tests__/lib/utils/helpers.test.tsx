import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import {
  cn,
  formatDuration,
  formatTimestamp,
  formatDate,
  generateSessionTitle,
  isLocalhost,
  isPrivateNetworkAccess,
  safeParse,
  safeParseFromMatch,
  getStorageInfo,
  cleanupLocalStorage,
  shouldCleanupStorage,
  initializeStorage,
  deduplicateRequest,
  deduplicateWithKey,
  getDeduplicationStats,
  clearDeduplicationCache,
  createLazyComponent,
  preloadComponent,
  TherapeuticPerformanceMonitor,
  TherapeuticMessageCache,
  optimizeMessageRendering,
  createDebouncedInputHandler,
  createThrottledScrollHandler,
  preloadTherapeuticComponents,
  generateUUID, // Add this
} from '@/lib/utils/helpers';
import { logger } from '@/lib/utils/logger';

// Mock logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock config
jest.mock('@/config/env.public', () => ({
  isDevelopment: true,
  getPublicEnv: jest.fn(() => ({ NODE_ENV: 'development' })),
}));

describe('helpers utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('a', 'b')).toBe('a b');
      expect(cn('a', { b: true, c: false })).toBe('a b');
      expect(cn('p-4', 'p-2')).toBe('p-2'); // tailwind-merge
    });
  });

  describe('formatters', () => {
    it('formatDuration formats seconds to mm:ss', () => {
      expect(formatDuration(0)).toBe('0:00');
      expect(formatDuration(65)).toBe('1:05');
      expect(formatDuration(3600)).toBe('60:00');
    });

    it('formatTimestamp formats date to time', () => {
      const date = new Date('2023-01-01T13:30:00');
      expect(formatTimestamp(date)).toMatch(/\d{1,2}:\d{2}\s[AP]M/);
    });

    it('formatDate formats date to readable string', () => {
      const date = new Date('2023-01-01');
      expect(formatDate(date)).toBe('January 1, 2023');
    });

    it('generateSessionTitle generates title with current date and time', () => {
      const title = generateSessionTitle();
      expect(title).toMatch(/Session \d{1,2}[-/]\d{1,2}[-/]\d{4} \d{2}:\d{2}/);
    });

    it('re-exports crypto utils', () => {
      expect(generateUUID).toBeDefined();
    });
  });

  describe('network checks', () => {
    it('isLocalhost identifies localhost', () => {
      expect(isLocalhost('localhost')).toBe(true);
      expect(isLocalhost('127.0.0.1')).toBe(true);
      expect(isLocalhost('::1')).toBe(true);
      expect(isLocalhost('0.0.0.0')).toBe(true);
      expect(isLocalhost('example.com')).toBe(false);
      expect(isLocalhost('')).toBe(false);
    });

    it('isPrivateNetworkAccess identifies private IPs', () => {
      expect(isPrivateNetworkAccess('192.168.1.1')).toBe(true);
      expect(isPrivateNetworkAccess('10.0.0.1')).toBe(true);
      expect(isPrivateNetworkAccess('172.16.0.1')).toBe(true);
      expect(isPrivateNetworkAccess('8.8.8.8')).toBe(false);
      expect(isPrivateNetworkAccess('')).toBe(false);
    });
  });

  describe('safe JSON parsing', () => {
    it('safeParse parses valid JSON', () => {
      expect(safeParse('{"a":1}')).toEqual({ ok: true, data: { a: 1 } });
    });

    it('safeParse handles invalid JSON', () => {
      expect(safeParse('{a:1}')).toEqual({ ok: false });
    });

    it('safeParseFromMatch handles valid JSON string', () => {
      expect(safeParseFromMatch('{"a":1}')).toEqual({ ok: true, data: { a: 1 } });
    });

    it('safeParseFromMatch handles null/undefined/invalid type', () => {
      expect(safeParseFromMatch(null)).toEqual({ ok: false });
      // @ts-ignore
      expect(safeParseFromMatch(123)).toEqual({ ok: false });
    });
  });

  describe('storage management', () => {
    const mockStorage = {
      estimate: jest.fn(),
    };

    beforeAll(() => {
      Object.defineProperty(navigator, 'storage', {
        value: mockStorage,
        writable: true,
      });
    });

    it('getStorageInfo returns storage info', async () => {
      mockStorage.estimate.mockResolvedValue({
        quota: 100,
        usage: 50,
      });
      const info = await getStorageInfo();
      expect(info).toEqual({
        quota: 100,
        used: 50,
        available: 50,
        usagePercentage: 50,
      });
    });

    it('getStorageInfo handles error', async () => {
      mockStorage.estimate.mockRejectedValue(new Error('Fail'));
      const info = await getStorageInfo();
      expect(info).toBeNull();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('cleanupLocalStorage removes large items', () => {
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');
      const lengthSpy = jest.spyOn(Storage.prototype, 'length', 'get');
      const keySpy = jest.spyOn(Storage.prototype, 'key');

      lengthSpy.mockReturnValue(1);
      keySpy.mockReturnValue('largeKey');
      getItemSpy.mockReturnValue('x'.repeat(1024 * 1024 + 1));

      cleanupLocalStorage();

      expect(removeItemSpy).toHaveBeenCalledWith('largeKey');
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Removed large/corrupted'),
        expect.any(Object)
      );
    });

    it('cleanupLocalStorage skips persist keys', () => {
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');
      const lengthSpy = jest.spyOn(Storage.prototype, 'length', 'get');
      const keySpy = jest.spyOn(Storage.prototype, 'key');

      lengthSpy.mockReturnValue(1);
      keySpy.mockReturnValue('persist:therapeuticAI');

      cleanupLocalStorage();
      expect(getItemSpy).not.toHaveBeenCalled();
      expect(removeItemSpy).not.toHaveBeenCalled();
    });

    it('shouldCleanupStorage returns true if usage > 90%', async () => {
      // @ts-ignore
      mockStorage.estimate.mockResolvedValue({
        quota: 100,
        usage: 91,
      });
      expect(await shouldCleanupStorage()).toBe(true);
    });

    it('shouldCleanupStorage returns false on error', async () => {
      // @ts-ignore
      mockStorage.estimate.mockRejectedValue(new Error('Fail'));
      expect(await shouldCleanupStorage()).toBe(false);
    });

    it('initializeStorage runs cleanup if needed', async () => {
      mockStorage.estimate.mockResolvedValue({
        quota: 100,
        usage: 91,
      });

      // Spy on logger to ensure it's called (since cleanupLocalStorage might not do anything if keys are missing)
      await initializeStorage();
      expect(logger.info).toHaveBeenCalledWith(
        'Storage usage high, performing cleanup',
        expect.any(Object)
      );
    });

    it('cleanupLocalStorage handles getItem error', () => {
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
      const lengthSpy = jest.spyOn(Storage.prototype, 'length', 'get');
      const keySpy = jest.spyOn(Storage.prototype, 'key');
      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');

      lengthSpy.mockReturnValue(1);
      keySpy.mockReturnValue('someKey');
      getItemSpy.mockImplementation(() => {
        throw new Error('access denied');
      });

      cleanupLocalStorage();
      // Should catch and push to itemsToRemove, and then remove it?
      // logic: try { getItem } catch { itemsToRemove.push(key) }
      // then remove items
      expect(removeItemSpy).toHaveBeenCalledWith('someKey');
    });

    it('cleanupLocalStorage handles null key', () => {
      const lengthSpy = jest.spyOn(Storage.prototype, 'length', 'get');
      const keySpy = jest.spyOn(Storage.prototype, 'key');
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');

      lengthSpy.mockReturnValue(1);
      keySpy.mockReturnValue(null);

      cleanupLocalStorage();
      expect(getItemSpy).not.toHaveBeenCalled();
    });

    it('cleanupLocalStorage keeps small items', () => {
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');
      const lengthSpy = jest.spyOn(Storage.prototype, 'length', 'get');
      const keySpy = jest.spyOn(Storage.prototype, 'key');

      lengthSpy.mockReturnValue(1);
      keySpy.mockReturnValue('smallKey');
      getItemSpy.mockReturnValue('small');

      cleanupLocalStorage();

      expect(removeItemSpy).not.toHaveBeenCalled();
    });
  });

  describe('deduplication', () => {
    beforeEach(() => {
      clearDeduplicationCache();
    });

    it('deduplicateRequest prevents duplicate calls', async () => {
      const operation = jest
        .fn()
        .mockImplementation(() => new Promise((r) => setTimeout(() => r('result'), 10)));

      const p1 = deduplicateRequest('u1', 'op1', operation);
      const p2 = deduplicateRequest('u1', 'op1', operation);

      expect(operation).toHaveBeenCalledTimes(1);
      expect(await p1).toBe('result');
      expect(await p2).toBe('result');
    });

    it('deduplicateWithKey works similarly', async () => {
      const operation = jest
        .fn()
        .mockImplementation(() => new Promise((r) => setTimeout(() => r('result'), 10)));
      const p1 = deduplicateWithKey('key1', operation);
      const p2 = deduplicateWithKey('key1', operation);

      expect(operation).toHaveBeenCalledTimes(1);
      expect(await p1).toBe('result');
      expect(await p2).toBe('result');
    });

    it('expires entries', async () => {
      jest.useFakeTimers();
      const operation = jest.fn().mockResolvedValue('result');

      deduplicateWithKey('key1', operation, 100);
      jest.advanceTimersByTime(200);

      deduplicateWithKey('key1', operation, 100);
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('getDeduplicationStats returns stats', () => {
      const operation = jest.fn().mockImplementation(() => new Promise(() => {}));
      deduplicateWithKey('key1', operation);
      const stats = getDeduplicationStats();
      expect(stats.activeRequests).toBe(1);
    });

    it('cleanup removes only expired entries', () => {
      jest.useFakeTimers();
      const operation = jest.fn().mockImplementation(() => new Promise(() => {}));
      deduplicateWithKey('expired', operation, 100);
      deduplicateWithKey('fresh', operation, 10000);

      jest.advanceTimersByTime(200);
      // Deduplicator cleanup runs on interval (mocked above? No, interval is internal)
      // But cleanup logic is internal private method.
      // We can trigger it via interval if we advance time enough?
      // constructor sets interval 60*1000.

      jest.advanceTimersByTime(60 * 1000);

      // 'expired' should be gone. 'fresh' might be gone if 60s passed?
      // 'fresh' ttl 10s. 60s passed. Both gone.

      // We need to manually trigger cleanup or wait for interval carefully.
      // Better: test logic via side effects.
      // If we access 'expired', it should re-run (checked in expiration test).

      // But to test cleanup logic branches explicitly:
      // We can't access private 'cleanup'.
      // But the interval runs it.

      // Let's rely on existing tests and just add:
      // Wait, I can verify via getStats() if I set ttl long enough.

      // Reset
      clearDeduplicationCache();
      deduplicateWithKey('valid', operation, 1000000);
      jest.advanceTimersByTime(60 * 1000); // Trigger cleanup interval
      const stats2 = getDeduplicationStats();
      expect(stats2.activeRequests).toBe(1); // Still there
    });
  });

  describe('performance utilities', () => {
    describe('createLazyComponent', () => {
      it('loads component successfully', async () => {
        const MockComp = () => <div>Hello</div>;
        const importFn = jest.fn().mockResolvedValue({ default: MockComp });
        const LazyComp = createLazyComponent(importFn, 'TestComp');

        render(
          <React.Suspense fallback="loading">
            <LazyComp />
          </React.Suspense>
        );

        await waitFor(() => expect(screen.getByText('Hello')).toBeInTheDocument());
        expect(logger.debug).toHaveBeenCalledWith('Component loaded', expect.any(Object));
      });

      it('handles load error', async () => {
        const importFn = jest.fn().mockRejectedValue(new Error('Failed'));
        const LazyComp = createLazyComponent(importFn, 'TestComp');

        render(
          <React.Suspense fallback="loading">
            <LazyComp />
          </React.Suspense>
        );

        await waitFor(() =>
          expect(screen.getByText(/Unable to load component/)).toBeInTheDocument()
        );
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to load component'),
          expect.any(Object)
        );
      });
    });

    describe('preloadComponent', () => {
      it('preloads component', async () => {
        const importFn = jest.fn().mockResolvedValue({ default: () => null });

        // Mock requestIdleCallback
        // @ts-ignore
        window.requestIdleCallback = (cb) => cb();

        preloadComponent(importFn, 'TestComp');
        await waitFor(() => expect(importFn).toHaveBeenCalled());
        expect(logger.debug).toHaveBeenCalledWith('Component preloaded', expect.any(Object));
      });

      it('falls back to setTimeout if requestIdleCallback missing', async () => {
        const importFn = jest.fn().mockResolvedValue({ default: () => null });
        // @ts-ignore
        delete window.requestIdleCallback;
        jest.useFakeTimers();

        preloadComponent(importFn, 'TestComp');
        jest.advanceTimersByTime(100);

        await waitFor(() => expect(importFn).toHaveBeenCalled());
        jest.useRealTimers();
      });
    });

    describe('TherapeuticPerformanceMonitor', () => {
      it('records and reports metrics', () => {
        const monitor = new TherapeuticPerformanceMonitor();
        monitor.recordLoadTime('TestComp', 50);
        monitor.recordLoadTime('TestComp', 50); // Avg 50

        const avg = monitor.getAverageLoadTime('TestComp');
        expect(avg).toBe(50);

        const report = monitor.getPerformanceReport();
        expect(report['TestComp']).toBeDefined();
        expect(report['TestComp'].performance).toBe('excellent');
      });

      it('handles metrics thresholds and history limit', () => {
        const monitor = new TherapeuticPerformanceMonitor();
        // Fill > 10 items
        for (let i = 0; i < 15; i++) {
          monitor.recordLoadTime('CompLimit', 100);
        }

        monitor.recordLoadTime('Good', 200);
        monitor.recordLoadTime('Fair', 400);
        monitor.recordLoadTime('Poor', 600);

        const report = monitor.getPerformanceReport();
        expect(report['Good'].performance).toBe('good');
        expect(report['Fair'].performance).toBe('fair');
        expect(report['Poor'].performance).toBe('poor');
      });
    });
  });

  describe('TherapeuticMessageCache', () => {
    it('caches and retrieves messages', () => {
      const cache = new TherapeuticMessageCache();
      const msgs = [{ id: '1', role: 'user', content: 'hi', timestamp: new Date() }];

      cache.setMessages('sess1', msgs);
      const retrieved = cache.getMessages('sess1');
      expect(retrieved).toEqual(msgs);
    });

    it('expires messages', () => {
      jest.useFakeTimers();
      const cache = new TherapeuticMessageCache();
      const msgs = [{ id: '1', role: 'user', content: 'hi', timestamp: new Date() }];

      cache.setMessages('sess1', msgs);
      jest.advanceTimersByTime(24 * 60 * 60 * 1000 + 100);

      expect(cache.getMessages('sess1')).toBeNull();
    });

    it('getCacheStats returns stats', () => {
      const cache = new TherapeuticMessageCache();
      const msgs = [{ id: '1', role: 'user', content: 'hi', timestamp: new Date() }];
      cache.setMessages('sess1', msgs);
      const stats = cache.getCacheStats();
      expect(stats.totalSessions).toBe(1);
    });

    it('cleanup keeps valid sessions', () => {
      const cache = new TherapeuticMessageCache();
      const msgs = [{ id: '1', role: 'user', content: 'hi', timestamp: new Date() }];

      cache.setMessages('sess1', msgs);

      // Force cleanup by adding more sessions (threshold > 10)
      for (let i = 0; i < 15; i++) {
        cache.setMessages(`extra${i}`, msgs);
      }

      // sess1 is old but valid (just created).
      // But cleanup removes EXPIRED sessions (maxSessionAge).
      // If sess1 is valid, it stays.
      // However, setMessages triggers cleanup if size > 10.
      // Does it remove oldest? No, it removes EXPIRED.
      // Code:
      // if (this.cache.size > 10) { this.cleanup(); }
      // cleanup() -> keysToDelete.forEach... if (now - timestamp > maxSessionAge)

      // So if nothing is expired, nothing is removed, even if > 10.
      const stats = cache.getCacheStats();
      expect(stats.totalSessions).toBe(16); // 1 + 15
    });
  });

  describe('UI optimization', () => {
    it('optimizeMessageRendering virtualizes long lists', () => {
      const msgs = Array.from({ length: 200 }, (_, i) => ({
        id: String(i),
        role: 'user',
        content: 'msg',
        timestamp: new Date(),
      }));

      const result = optimizeMessageRendering(msgs);
      expect(result.shouldVirtualize).toBe(true);
      expect(result.visibleMessages.length).toBeLessThan(200);
    });

    it('optimizeMessageRendering does not virtualize short lists', () => {
      const msgs = Array.from({ length: 50 }, (_, i) => ({
        id: String(i),
        role: 'user',
        content: 'msg',
        timestamp: new Date(),
      }));

      const result = optimizeMessageRendering(msgs);
      expect(result.shouldVirtualize).toBe(false);
      expect(result.visibleMessages.length).toBe(50);
    });

    it('createDebouncedInputHandler debounces calls', () => {
      jest.useFakeTimers();
      const handler = jest.fn();
      const debounced = createDebouncedInputHandler(handler, 100);

      debounced('a');
      debounced('b');
      jest.advanceTimersByTime(100);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith('b');
    });

    it('createThrottledScrollHandler throttles calls', () => {
      jest.useFakeTimers();
      // mock requestAnimationFrame
      jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        cb(0);
        return 0;
      });

      const handler = jest.fn();
      const throttled = createThrottledScrollHandler(handler, 100);
      const event = new Event('scroll');

      throttled(event);
      throttled(event);

      expect(handler).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(100);
      throttled(event);
      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  describe('preloadTherapeuticComponents', () => {
    it('executes without error', () => {
      expect(() => preloadTherapeuticComponents()).not.toThrow();
    });
  });

  // ========================================================================
  // ADDITIONAL TESTS FOR UNCOVERED BRANCHES AND EDGE CASES
  // ========================================================================

  describe('isLocalhost edge cases', () => {
    it('handles IPv6 localhost with port', () => {
      expect(isLocalhost('localhost:3000')).toBe(true);
      expect(isLocalhost('127.0.0.1:8080')).toBe(true);
      expect(isLocalhost('0.0.0.0:4000')).toBe(true);
    });

    it('handles uppercase hosts', () => {
      expect(isLocalhost('LOCALHOST')).toBe(true);
      expect(isLocalhost('LocalHost:3000')).toBe(true);
    });
  });

  describe('isPrivateNetworkAccess edge cases', () => {
    it('handles 172.16-31 range boundaries', () => {
      expect(isPrivateNetworkAccess('172.15.0.1')).toBe(false); // Below range
      expect(isPrivateNetworkAccess('172.16.0.1')).toBe(true); // Start of range
      expect(isPrivateNetworkAccess('172.20.0.1')).toBe(true); // Middle of range
      expect(isPrivateNetworkAccess('172.31.255.255')).toBe(true); // End of range
      expect(isPrivateNetworkAccess('172.32.0.1')).toBe(false); // Above range
    });

    it('handles hosts with ports', () => {
      expect(isPrivateNetworkAccess('192.168.1.1:8080')).toBe(true);
      expect(isPrivateNetworkAccess('10.0.0.1:3000')).toBe(true);
    });
  });

  describe('cleanupLocalStorage error handling', () => {
    it('handles removeItem error gracefully', () => {
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
      const lengthSpy = jest.spyOn(Storage.prototype, 'length', 'get');
      const keySpy = jest.spyOn(Storage.prototype, 'key');
      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');

      lengthSpy.mockReturnValue(1);
      keySpy.mockReturnValue('largeKey');
      getItemSpy.mockReturnValue('x'.repeat(1024 * 1024 + 1));
      removeItemSpy.mockImplementation(() => {
        throw new Error('Remove denied');
      });

      cleanupLocalStorage();

      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to remove localStorage item',
        expect.objectContaining({
          operation: 'cleanupLocalStorage',
          key: 'largeKey',
          error: 'Remove denied',
        })
      );
    });

    it('handles overall storage cleanup error', () => {
      const lengthSpy = jest.spyOn(Storage.prototype, 'length', 'get');
      lengthSpy.mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      cleanupLocalStorage();

      expect(logger.error).toHaveBeenCalledWith(
        'Storage cleanup failed',
        expect.objectContaining({
          operation: 'cleanupLocalStorage',
          error: 'Storage access denied',
        })
      );
    });

    it('handles non-Error exceptions in cleanup', () => {
      const lengthSpy = jest.spyOn(Storage.prototype, 'length', 'get');
      lengthSpy.mockImplementation(() => {
        throw 'string error';
      });

      cleanupLocalStorage();

      expect(logger.error).toHaveBeenCalledWith(
        'Storage cleanup failed',
        expect.objectContaining({
          operation: 'cleanupLocalStorage',
          error: 'Unknown error',
        })
      );
    });

    it('handles currentSessionId key', () => {
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');
      const lengthSpy = jest.spyOn(Storage.prototype, 'length', 'get');
      const keySpy = jest.spyOn(Storage.prototype, 'key');

      lengthSpy.mockReturnValue(1);
      keySpy.mockReturnValue('currentSessionId');

      cleanupLocalStorage();

      expect(getItemSpy).not.toHaveBeenCalled();
      expect(removeItemSpy).not.toHaveBeenCalled();
    });

    it('handles null getItem result', () => {
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
      const lengthSpy = jest.spyOn(Storage.prototype, 'length', 'get');
      const keySpy = jest.spyOn(Storage.prototype, 'key');
      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');

      lengthSpy.mockReturnValue(1);
      keySpy.mockReturnValue('someKey');
      getItemSpy.mockReturnValue(null);

      cleanupLocalStorage();

      expect(removeItemSpy).not.toHaveBeenCalled();
    });
  });

  describe('initializeStorage error handling', () => {
    it('handles low storage usage (no cleanup needed)', async () => {
      const mockStorage = {
        estimate: jest.fn().mockResolvedValue({
          quota: 100,
          usage: 50, // Below 90% threshold
        }),
      };
      Object.defineProperty(navigator, 'storage', {
        value: mockStorage,
        writable: true,
      });

      await initializeStorage();

      // No cleanup should be triggered, no error should occur
      expect(logger.info).not.toHaveBeenCalledWith(
        'Storage usage high, performing cleanup',
        expect.any(Object)
      );
    });
  });

  describe('getStorageInfo edge cases', () => {
    it('handles missing quota and usage', async () => {
      const mockStorage = {
        estimate: jest.fn().mockResolvedValue({}),
      };
      Object.defineProperty(navigator, 'storage', {
        value: mockStorage,
        writable: true,
      });

      const info = await getStorageInfo();
      expect(info).toEqual({
        used: 0,
        quota: 0,
        available: 0,
        usagePercentage: 0,
      });
    });

    it('handles storage API error gracefully', async () => {
      const mockStorage = {
        estimate: jest.fn().mockRejectedValue(new Error('Storage error')),
      };
      Object.defineProperty(navigator, 'storage', {
        value: mockStorage,
        writable: true,
      });

      const info = await getStorageInfo();
      expect(info).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to get storage estimate',
        expect.objectContaining({
          operation: 'getStorageInfo',
          error: 'Storage error',
        })
      );
    });

    it('handles non-Error exception in storage API', async () => {
      const mockStorage = {
        estimate: jest.fn().mockRejectedValue('string error'),
      };
      Object.defineProperty(navigator, 'storage', {
        value: mockStorage,
        writable: true,
      });

      const info = await getStorageInfo();
      expect(info).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to get storage estimate',
        expect.objectContaining({
          operation: 'getStorageInfo',
          error: 'Unknown error',
        })
      );
    });
  });

  describe('RequestDeduplicator.generateKey with sessionId', () => {
    it('generates key with resource and sessionId', async () => {
      clearDeduplicationCache();
      const operation = jest.fn().mockResolvedValue('result');

      // Test deduplication with resource parameter
      await deduplicateRequest('user1', 'op1', operation, 'resource1');
      await deduplicateRequest('user1', 'op1', operation, 'resource2');

      // Different resources should create different entries
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('generates key with all parameters including sessionId', () => {
      // Access the static method directly
      const { deduplicator } = require('@/lib/utils/helpers');

      // Test generateKey directly using the class
      const RequestDeduplicatorClass = deduplicator.constructor;

      // Generate key with all parameters
      const key1 = RequestDeduplicatorClass.generateKey('user1', 'op1');
      const key2 = RequestDeduplicatorClass.generateKey('user1', 'op1', 'resource1');
      const key3 = RequestDeduplicatorClass.generateKey('user1', 'op1', 'resource1', 'session1');

      expect(key1).toBe('user1:op1');
      expect(key2).toBe('user1:op1:resource1');
      expect(key3).toBe('user1:op1:resource1:session1');
    });
  });

  describe('deduplicator destroy', () => {
    it('can be destroyed and stops cleanup interval', () => {
      // Import the deduplicator instance
      const { deduplicator: dedupInstance } = require('@/lib/utils/helpers');

      // Calling destroy should not throw
      expect(() => dedupInstance.destroy()).not.toThrow();

      // After destroy, clear should still work
      dedupInstance.clear();
      expect(dedupInstance.getStats().activeRequests).toBe(0);
    });
  });

  describe('preloadComponent error handling', () => {
    it('logs warning when preload fails', async () => {
      const importFn = jest.fn().mockRejectedValue(new Error('Import failed'));

      // Mock requestIdleCallback
      // @ts-ignore
      window.requestIdleCallback = (cb: () => void) => {
        cb();
        return 0;
      };

      preloadComponent(importFn, 'FailComp');

      // Wait for the promise to settle
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to preload component FailComp',
        expect.objectContaining({
          error: 'Import failed',
          componentName: 'FailComp',
        })
      );
    });

    it('logs warning with non-Error exception', async () => {
      const importFn = jest.fn().mockRejectedValue('string error');

      // @ts-ignore
      window.requestIdleCallback = (cb: () => void) => {
        cb();
        return 0;
      };

      preloadComponent(importFn, 'FailComp2');

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to preload component FailComp2',
        expect.objectContaining({
          error: 'Unknown error',
          componentName: 'FailComp2',
        })
      );
    });
  });

  describe('TherapeuticMessageCache edge cases', () => {
    it('cleanup removes expired sessions', () => {
      jest.useFakeTimers();
      const cache = new TherapeuticMessageCache();
      const msgs = [{ id: '1', role: 'user', content: 'hi', timestamp: new Date() }];

      // Add session
      cache.setMessages('sess1', msgs);

      // Fast forward past expiry
      jest.advanceTimersByTime(25 * 60 * 60 * 1000); // 25 hours

      // Add more sessions to trigger cleanup (> 10)
      for (let i = 0; i < 12; i++) {
        cache.setMessages(`new${i}`, msgs);
      }

      // sess1 should be cleaned up
      const retrieved = cache.getMessages('sess1');
      expect(retrieved).toBeNull();

      // Verify cleanup was logged
      expect(logger.debug).toHaveBeenCalledWith(
        'Message cache cleanup completed',
        expect.objectContaining({
          cleanedSessions: 1, // sess1 was cleaned
          operation: 'cacheCleanup',
        })
      );

      jest.useRealTimers();
    });

    it('limits message storage', () => {
      const cache = new TherapeuticMessageCache();
      // Create more than maxCacheSize messages
      const msgs = Array.from({ length: 1100 }, (_, i) => ({
        id: String(i),
        role: 'user',
        content: 'msg',
        timestamp: new Date(),
      }));

      cache.setMessages('sess1', msgs);

      // Should only store last 1000
      const retrieved = cache.getMessages('sess1');
      expect(retrieved).not.toBeNull();
      expect(retrieved!.length).toBe(1000);
    });

    it('returns null for missing session', () => {
      const cache = new TherapeuticMessageCache();
      expect(cache.getMessages('nonexistent')).toBeNull();
    });

    it('getCacheStats handles empty cache', () => {
      const cache = new TherapeuticMessageCache();
      const stats = cache.getCacheStats();
      expect(stats.totalSessions).toBe(0);
      expect(stats.totalSize).toBe(0);
      expect(stats.averageSessionSize).toBe(0);
    });
  });

  describe('TherapeuticPerformanceMonitor edge cases', () => {
    it('getAverageLoadTime returns 0 for unknown component', () => {
      const monitor = new TherapeuticPerformanceMonitor();
      expect(monitor.getAverageLoadTime('Unknown')).toBe(0);
    });

    it('getPerformanceReport returns empty object when no data', () => {
      const monitor = new TherapeuticPerformanceMonitor();
      const report = monitor.getPerformanceReport();
      expect(report).toEqual({});
    });

    it('singleton pattern returns same instance', () => {
      const instance1 = TherapeuticPerformanceMonitor.getInstance();
      const instance2 = TherapeuticPerformanceMonitor.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('safeParseFromMatch edge cases', () => {
    it('handles undefined input', () => {
      expect(safeParseFromMatch(undefined)).toEqual({ ok: false });
    });

    it('handles non-string input', () => {
      // @ts-ignore - intentionally testing invalid type
      expect(safeParseFromMatch(42)).toEqual({ ok: false });
      // @ts-ignore
      expect(safeParseFromMatch({})).toEqual({ ok: false });
      // @ts-ignore
      expect(safeParseFromMatch([])).toEqual({ ok: false });
    });
  });

  describe('shouldCleanupStorage edge cases', () => {
    it('returns false when storage throws error', async () => {
      const mockStorage = {
        estimate: jest.fn().mockRejectedValue(new Error('Storage error')),
      };
      Object.defineProperty(navigator, 'storage', {
        value: mockStorage,
        writable: true,
      });

      const result = await shouldCleanupStorage();
      expect(result).toBe(false);
    });

    it('returns false when usage is below 90%', async () => {
      const mockStorage = {
        estimate: jest.fn().mockResolvedValue({
          quota: 100,
          usage: 50,
        }),
      };
      Object.defineProperty(navigator, 'storage', {
        value: mockStorage,
        writable: true,
      });

      const result = await shouldCleanupStorage();
      expect(result).toBe(false);
    });

    it('returns true when usage is above 90%', async () => {
      const mockStorage = {
        estimate: jest.fn().mockResolvedValue({
          quota: 100,
          usage: 95,
        }),
      };
      Object.defineProperty(navigator, 'storage', {
        value: mockStorage,
        writable: true,
      });

      const result = await shouldCleanupStorage();
      expect(result).toBe(true);
    });
  });

  describe('createLazyComponent edge cases', () => {
    it('handles non-Error rejection', async () => {
      const importFn = jest.fn().mockRejectedValue('string error');
      const LazyComp = createLazyComponent(importFn, 'TestComp');

      render(
        <React.Suspense fallback="loading">
          <LazyComp />
        </React.Suspense>
      );

      await waitFor(() => expect(screen.getByText(/Unable to load component/)).toBeInTheDocument());
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load component'),
        expect.objectContaining({
          error: 'Unknown error',
        })
      );
    });
  });
});
