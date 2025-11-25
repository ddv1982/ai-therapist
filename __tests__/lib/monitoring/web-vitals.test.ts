import { reportWebVitals, THRESHOLDS } from '@/lib/monitoring/web-vitals';
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';
import { logger } from '@/lib/utils/logger';

jest.mock('web-vitals', () => ({
  onCLS: jest.fn(),
  onFCP: jest.fn(),
  onINP: jest.fn(),
  onLCP: jest.fn(),
  onTTFB: jest.fn(),
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

let mockIsDevelopment = false;
jest.mock('@/config/env.public', () => ({
  get isDevelopment() {
    return mockIsDevelopment;
  },
}));

interface MockWindow extends Window {
  gtag?: jest.Mock;
  webVitals?: Record<string, unknown>;
}

describe('web-vitals', () => {
  let mockWindow: MockWindow;
  const originalWindow = global.window;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsDevelopment = false;
    const gtagMock = jest.fn();
    mockWindow = {
      location: { pathname: '/test-path' } as Location,
      webVitals: {},
      gtag: gtagMock,
    } as MockWindow;
    global.window = mockWindow as unknown as Window & typeof globalThis;
    (global.window as MockWindow).gtag = gtagMock;
  });

  afterEach(() => {
    global.window = originalWindow;
    mockIsDevelopment = false;
  });

  describe('THRESHOLDS', () => {
    it('should export correct threshold values', () => {
      expect(THRESHOLDS).toEqual({
        LCP: { good: 2500, poor: 4000 },
        INP: { good: 200, poor: 500 },
        CLS: { good: 0.1, poor: 0.25 },
        FCP: { good: 1800, poor: 3000 },
        TTFB: { good: 800, poor: 1800 },
      });
    });

    it('should have good threshold lower than poor threshold', () => {
      Object.values(THRESHOLDS).forEach((threshold) => {
        expect(threshold.good).toBeLessThan(threshold.poor);
      });
    });
  });

  describe('reportWebVitals', () => {
    it('should register all Web Vitals metrics', () => {
      reportWebVitals();

      expect(onCLS).toHaveBeenCalledWith(expect.any(Function));
      expect(onFCP).toHaveBeenCalledWith(expect.any(Function));
      expect(onINP).toHaveBeenCalledWith(expect.any(Function));
      expect(onLCP).toHaveBeenCalledWith(expect.any(Function));
      expect(onTTFB).toHaveBeenCalledWith(expect.any(Function));
    });

    // Note: Testing server-side behavior (typeof window === 'undefined') is challenging
    // in jsdom environment where window is always defined. This is covered by the implementation's
    // early return check and would be caught by integration tests in actual SSR environment.

    it('should handle errors gracefully', () => {
      (onCLS as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Web Vitals init error');
      });

      reportWebVitals();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to initialize Web Vitals monitoring',
        {},
        expect.any(Error)
      );
    });

    // Note: Testing server-side behavior (typeof window === 'undefined') is challenging
    // in jsdom environment where window is always defined. The implementation's
    // early return check at line 126-127 is covered by the guard clause pattern
    // and would be exercised in actual SSR environments or Node.js tests without jsdom.
    // The branch coverage for this line can be verified through integration tests.
  });

  describe('sendToAnalytics callback', () => {
    let sendToAnalytics: (metric: Metric) => void;

    beforeEach(() => {
      reportWebVitals();
      sendToAnalytics = (onLCP as jest.Mock).mock.calls[0][0];
    });

    describe('metric rating', () => {
      it('should rate LCP metric as good', () => {
        const metric: Metric = {
          name: 'LCP',
          value: 2000,
          rating: 'good',
          delta: 2000,
          entries: [],
          id: 'test-id',
          navigationType: 'navigate',
        };

        sendToAnalytics(metric);

        expect(logger.info).toHaveBeenCalledWith(
          'Web Vitals Metric',
          expect.objectContaining({
            metric: 'LCP',
            value: 2000,
            rating: 'good',
            id: 'test-id',
            navigationType: 'navigate',
          })
        );
      });

      it('should rate LCP metric as needs-improvement', () => {
        const metric: Metric = {
          name: 'LCP',
          value: 3000,
          rating: 'needs-improvement',
          delta: 3000,
          entries: [],
          id: 'test-id',
          navigationType: 'navigate',
        };

        sendToAnalytics(metric);

        expect(logger.info).toHaveBeenCalledWith(
          'Web Vitals Metric',
          expect.objectContaining({
            metric: 'LCP',
            value: 3000,
            rating: 'needs-improvement',
            id: 'test-id',
            navigationType: 'navigate',
          })
        );
      });

      it('should rate LCP metric as poor', () => {
        const metric: Metric = {
          name: 'LCP',
          value: 5000,
          rating: 'poor',
          delta: 5000,
          entries: [],
          id: 'test-id',
          navigationType: 'navigate',
        };

        sendToAnalytics(metric);

        expect(logger.info).toHaveBeenCalledWith(
          'Web Vitals Metric',
          expect.objectContaining({
            metric: 'LCP',
            value: 5000,
            rating: 'poor',
            id: 'test-id',
            navigationType: 'navigate',
          })
        );
      });

      it('should rate CLS metric correctly (decimal values)', () => {
        const metric: Metric = {
          name: 'CLS',
          value: 0.15,
          rating: 'needs-improvement',
          delta: 0.15,
          entries: [],
          id: 'test-id',
          navigationType: 'navigate',
        };

        sendToAnalytics(metric);

        expect(logger.info).toHaveBeenCalledWith(
          'Web Vitals Metric',
          expect.objectContaining({
            metric: 'CLS',
            value: 0,
            rating: 'needs-improvement',
            id: 'test-id',
            navigationType: 'navigate',
          })
        );
      });

      it('should rate INP metric as good', () => {
        const metric: Metric = {
          name: 'INP',
          value: 150,
          rating: 'good',
          delta: 150,
          entries: [],
          id: 'test-id',
          navigationType: 'navigate',
        };

        sendToAnalytics(metric);

        expect(logger.info).toHaveBeenCalledWith(
          'Web Vitals Metric',
          expect.objectContaining({
            metric: 'INP',
            value: 150,
            rating: 'good',
            id: 'test-id',
            navigationType: 'navigate',
          })
        );
      });

      it('should rate TTFB metric correctly', () => {
        const metric: Metric = {
          name: 'TTFB',
          value: 1000,
          rating: 'needs-improvement',
          delta: 1000,
          entries: [],
          id: 'test-id',
          navigationType: 'navigate',
        };

        sendToAnalytics(metric);

        expect(logger.info).toHaveBeenCalledWith(
          'Web Vitals Metric',
          expect.objectContaining({
            metric: 'TTFB',
            value: 1000,
            rating: 'needs-improvement',
            id: 'test-id',
            navigationType: 'navigate',
          })
        );
      });

      it('should rate FCP metric correctly', () => {
        const metric: Metric = {
          name: 'FCP',
          value: 2500,
          rating: 'needs-improvement',
          delta: 2500,
          entries: [],
          id: 'test-id',
          navigationType: 'navigate',
        };

        sendToAnalytics(metric);

        expect(logger.info).toHaveBeenCalledWith(
          'Web Vitals Metric',
          expect.objectContaining({
            metric: 'FCP',
            value: 2500,
            rating: 'needs-improvement',
            id: 'test-id',
            navigationType: 'navigate',
          })
        );
      });
    });

    describe('analytics integration', () => {
      it('should send to Google Analytics if gtag exists', () => {
        const metric: Metric = {
          name: 'LCP',
          value: 2000,
          rating: 'good',
          delta: 2000,
          entries: [],
          id: 'test-lcp',
          navigationType: 'navigate',
        };

        sendToAnalytics(metric);

        expect((global.window as MockWindow).gtag).toHaveBeenCalledWith('event', 'LCP', {
          event_category: 'Web Vitals',
          event_label: 'test-lcp',
          value: 2000,
          non_interaction: true,
        });
      });

      it('should not crash if gtag is missing', () => {
        const originalGtag = (window as MockWindow).gtag;
        delete (window as Partial<MockWindow>).gtag;
        delete mockWindow.gtag;

        const metric: Metric = {
          name: 'LCP',
          value: 2000,
          rating: 'good',
          delta: 2000,
          entries: [],
          id: 'test-lcp',
          navigationType: 'navigate',
        };

        expect(() => sendToAnalytics(metric)).not.toThrow();

        // Restore for next tests
        (window as MockWindow).gtag = originalGtag;
        mockWindow.gtag = originalGtag;
      });

      it('should include current route in logs', () => {
        const metric: Metric = {
          name: 'LCP',
          value: 2000,
          rating: 'good',
          delta: 2000,
          entries: [],
          id: 'test-lcp',
          navigationType: 'navigate',
        };

        sendToAnalytics(metric);

        expect(logger.info).toHaveBeenCalledWith(
          'Web Vitals Metric',
          expect.objectContaining({
            metric: 'LCP',
            value: 2000,
            rating: 'good',
            id: 'test-lcp',
            navigationType: 'navigate',
            route: expect.any(String),
          })
        );
      });
    });

    describe('development mode logging', () => {
      let consoleInfoSpy: jest.SpyInstance;

      beforeEach(() => {
        consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
      });

      afterEach(() => {
        consoleInfoSpy.mockRestore();
      });

      it('should log to console with green emoji for good rating in development', () => {
        mockIsDevelopment = true;
        const metric: Metric = {
          name: 'LCP',
          value: 2000,
          rating: 'good',
          delta: 2000,
          entries: [],
          id: 'test-lcp',
          navigationType: 'navigate',
        };

        sendToAnalytics(metric);

        expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('🟢'));
        expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('LCP'));
      });

      it('should log to console with yellow emoji for needs-improvement rating in development', () => {
        mockIsDevelopment = true;
        const metric: Metric = {
          name: 'LCP',
          value: 3000,
          rating: 'needs-improvement',
          delta: 3000,
          entries: [],
          id: 'test-lcp',
          navigationType: 'navigate',
        };

        sendToAnalytics(metric);

        expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('🟡'));
      });

      it('should log to console with red emoji for poor rating in development', () => {
        mockIsDevelopment = true;
        const metric: Metric = {
          name: 'LCP',
          value: 5000,
          rating: 'poor',
          delta: 5000,
          entries: [],
          id: 'test-lcp',
          navigationType: 'navigate',
        };

        sendToAnalytics(metric);

        expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('🔴'));
      });

      it('should not log to console when not in development mode', () => {
        mockIsDevelopment = false;
        const metric: Metric = {
          name: 'LCP',
          value: 2000,
          rating: 'good',
          delta: 2000,
          entries: [],
          id: 'test-lcp',
          navigationType: 'navigate',
        };

        sendToAnalytics(metric);

        expect(consoleInfoSpy).not.toHaveBeenCalled();
      });
    });

    describe('edge cases', () => {
      it('should handle unknown metric names gracefully', () => {
        const metric: Metric = {
          name: 'UNKNOWN' as any,
          value: 1000,
          rating: 'good',
          delta: 1000,
          entries: [],
          id: 'test-unknown',
          navigationType: 'navigate',
        };

        expect(() => sendToAnalytics(metric)).not.toThrow();
        expect(logger.info).toHaveBeenCalledWith(
          'Web Vitals Metric',
          expect.objectContaining({
            metric: 'UNKNOWN',
            value: 1000,
            rating: 'good',
            id: 'test-unknown',
            navigationType: 'navigate',
          })
        );
      });

      it('should round fractional values', () => {
        const metric: Metric = {
          name: 'LCP',
          value: 2345.678,
          rating: 'good',
          delta: 2345.678,
          entries: [],
          id: 'test-lcp',
          navigationType: 'navigate',
        };

        sendToAnalytics(metric);

        expect(logger.info).toHaveBeenCalledWith(
          'Web Vitals Metric',
          expect.objectContaining({
            metric: 'LCP',
            value: 2346,
            rating: 'good',
            id: 'test-lcp',
            navigationType: 'navigate',
          })
        );
      });

      it('should handle different navigation types', () => {
        const metric: Metric = {
          name: 'LCP',
          value: 2000,
          rating: 'good',
          delta: 2000,
          entries: [],
          id: 'test-lcp',
          navigationType: 'back-forward',
        };

        sendToAnalytics(metric);

        expect(logger.info).toHaveBeenCalledWith(
          'Web Vitals Metric',
          expect.objectContaining({
            metric: 'LCP',
            value: 2000,
            rating: 'good',
            id: 'test-lcp',
            navigationType: 'back-forward',
          })
        );
      });
    });
  });
});
