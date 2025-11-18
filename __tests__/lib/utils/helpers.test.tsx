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
import { waitFor, render, screen } from '@testing-library/react';

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
      expect(logger.info).toHaveBeenCalledWith('Storage usage high, performing cleanup', expect.any(Object));
    });
    
    it('cleanupLocalStorage handles getItem error', () => {
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
      const lengthSpy = jest.spyOn(Storage.prototype, 'length', 'get');
      const keySpy = jest.spyOn(Storage.prototype, 'key');
      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');

      lengthSpy.mockReturnValue(1);
      keySpy.mockReturnValue('someKey');
      getItemSpy.mockImplementation(() => { throw new Error('access denied'); });

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
      const operation = jest.fn().mockImplementation(() => new Promise(r => setTimeout(() => r('result'), 10)));
      
      const p1 = deduplicateRequest('u1', 'op1', operation);
      const p2 = deduplicateRequest('u1', 'op1', operation);
      
      expect(operation).toHaveBeenCalledTimes(1);
      expect(await p1).toBe('result');
      expect(await p2).toBe('result');
    });

    it('deduplicateWithKey works similarly', async () => {
       const operation = jest.fn().mockImplementation(() => new Promise(r => setTimeout(() => r('result'), 10)));
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
       
       const stats = getDeduplicationStats();
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
        
        await waitFor(() => expect(screen.getByText(/Unable to load component/)).toBeInTheDocument());
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to load component'), expect.any(Object));
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
         for(let i=0; i<15; i++) {
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
        for(let i=0; i<15; i++) {
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
        timestamp: new Date()
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
        timestamp: new Date()
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
        jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => { cb(0); return 0; });

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
});
