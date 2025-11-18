import {
  createDebouncedInputHandler,
  createThrottledScrollHandler,
  performanceMonitor,
  messageCache,
  optimizeMessageRendering,
} from '@/lib/utils/helpers';

describe('performance-utils', () => {
  jest.useFakeTimers();
  const originalRAF = global.requestAnimationFrame;
  beforeEach(() => {
    (global as any).requestAnimationFrame = jest.fn((cb) => {
      cb();
      return 1 as any;
    });
  });
  afterEach(() => {
    (global as any).requestAnimationFrame = originalRAF;
  });

  it('debounced handler delays execution', () => {
    const fn = jest.fn();
    const debounced = createDebouncedInputHandler(fn, 200);
    debounced('a');
    debounced('b');
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(199);
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledWith('b');
  });

  it('throttled scroll handler limits frequency', () => {
    const fn = jest.fn();
    const throttled = createThrottledScrollHandler(fn, 50);
    const evt = new Event('scroll');
    throttled(evt);
    throttled(evt);
    expect(fn).toHaveBeenCalledTimes(1);
    // RAF was invoked synchronously by our mock
    jest.advanceTimersByTime(51);
    throttled(evt);
    // RAF mock runs synchronously
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('optimizeMessageRendering virtualizes above threshold', () => {
    const many = Array.from({ length: 120 }, (_, i) => ({
      id: String(i),
      role: 'user',
      content: 'x',
      timestamp: new Date(),
    }));
    const res = optimizeMessageRendering(many as any);
    expect(res.shouldVirtualize).toBe(true);
    expect(res.visibleMessages.length).toBe(50);
    const few = many.slice(0, 10);
    const res2 = optimizeMessageRendering(few as any);
    expect(res2.shouldVirtualize).toBe(false);
    expect(res2.visibleMessages.length).toBe(10);
  });

  it('messageCache stores, retrieves, and cleans up stale sessions', () => {
    const session = 's1';
    const msgs = Array.from({ length: 5 }, (_, i) => ({
      id: String(i),
      role: 'user',
      content: 'x',
      timestamp: new Date(),
    }));
    messageCache.setMessages(session, msgs as any);
    expect(messageCache.getMessages(session)?.length).toBe(5);
    // Force staleness and cleanup
    (messageCache as any).maxSessionAge = -1;
    expect(messageCache.getMessages(session)).toBeNull();
  });

  it('performanceMonitor records and reports averages', () => {
    performanceMonitor.recordLoadTime('Comp', 50);
    performanceMonitor.recordLoadTime('Comp', 150);
    const report = performanceMonitor.getPerformanceReport();
    expect(report['Comp']).toBeDefined();
    expect(report['Comp'].measurements).toBeGreaterThan(0);
  });
});
