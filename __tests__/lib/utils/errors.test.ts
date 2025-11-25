import {
  reportClientError,
  useErrorReporter,
  ErrorMetrics,
  classifyError,
  shouldLogError,
  handleApiError,
  handleMessageError,
  handleSessionError,
  handleAIError,
  handleClientError,
  withErrorHandling,
  enhancedErrorHandlers,
  ServiceCircuitBreaker,
  withAIFallback,
  withRetry,
  withTimeout,
  getCircuitBreakerStatus,
  resetServiceCircuitBreaker,
} from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';

// Mock logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    apiError: jest.fn(),
  },
}));

// Mock config
jest.mock('@/config/env.public', () => ({
  __esModule: true,
  getPublicEnv: () => ({ NODE_ENV: 'development' }),
  isDevelopment: true,
}));

// Mock api-response
// jest.mock('@/lib/api/api-response', () => ({
//   __esModule: true,
//   createServerErrorResponse: jest.fn().mockImplementation(() => ({ status: 500, json: async () => ({}) })),
//   createValidationErrorResponse: jest.fn().mockImplementation(() => ({ status: 400, json: async () => ({}) })),
//   createForbiddenErrorResponse: jest.fn().mockImplementation(() => ({ status: 403, json: async () => ({}) })),
//   createAuthenticationErrorResponse: jest.fn().mockImplementation(() => ({ status: 401, json: async () => ({}) })),
// }));

describe('errors utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('reportClientError', () => {
    it('uses sendBeacon if available', () => {
      const sendBeacon = jest.fn();
      Object.defineProperty(navigator, 'sendBeacon', {
        value: sendBeacon,
        writable: true,
        configurable: true,
      });

      reportClientError({ message: 'test error' });
      expect(sendBeacon).toHaveBeenCalledWith('/api/errors', expect.any(Object));
    });

    it('uses fetch if sendBeacon not available', () => {
      // @ts-ignore
      delete navigator.sendBeacon;
      global.fetch = jest.fn();

      reportClientError({ message: 'test error' });
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/errors',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('test error'),
        })
      );
    });

    it('uses requestIdleCallback if available', () => {
      // @ts-ignore
      delete navigator.sendBeacon;
      global.fetch = jest.fn();
      // @ts-ignore
      window.requestIdleCallback = (cb) => cb();

      reportClientError({ message: 'test error' });
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('useErrorReporter', () => {
    it('returns a function that reports errors', () => {
      const reporter = useErrorReporter();
      // @ts-ignore
      delete navigator.sendBeacon;
      global.fetch = jest.fn();

      reporter(new Error('hook error'));
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/errors',
        expect.objectContaining({
          body: expect.stringContaining('hook error'),
        })
      );
    });
  });

  describe('ErrorMetrics', () => {
    it('recordError logs in development', () => {
      ErrorMetrics.recordError('system', 'high', 'test');
      expect(logger.debug).toHaveBeenCalled();
    });

    it('getErrorStats returns stats structure', () => {
      const stats = ErrorMetrics.getErrorStats();
      expect(stats.totalErrors).toBe(0);
      expect(stats.errorsByCategory.system).toBe(0);
    });
  });

  describe('classifyError', () => {
    it('classifies database errors', () => {
      expect(classifyError(new Error('database connection failed'))).toEqual({
        category: 'database',
        severity: 'high',
        isRetryable: false,
      });
    });

    it('classifies api errors', () => {
      expect(classifyError(new Error('fetch failed'))).toEqual({
        category: 'external_api',
        severity: 'medium',
        isRetryable: true,
      });
    });

    it('classifies auth errors', () => {
      expect(classifyError(new Error('unauthorized access'))).toEqual({
        category: 'authentication',
        severity: 'high',
        isRetryable: false,
      });
    });

    it('classifies validation errors', () => {
      expect(classifyError(new Error('invalid input'))).toEqual({
        category: 'validation',
        severity: 'low',
        isRetryable: false,
      });
    });

    it('defaults to system error', () => {
      expect(classifyError(new Error('unknown error'))).toEqual({
        category: 'system',
        severity: 'medium',
        isRetryable: false,
      });
    });
  });

  describe('shouldLogError', () => {
    it('returns true for high/critical', () => {
      expect(shouldLogError('high', 'system')).toBe(true);
      expect(shouldLogError('critical', 'system')).toBe(true);
    });

    it('returns true for medium system/db errors', () => {
      expect(shouldLogError('medium', 'system')).toBe(true);
      expect(shouldLogError('medium', 'database')).toBe(true);
    });

    it('returns based on env for low validation errors', () => {
      // Assuming dev env mock
      expect(shouldLogError('low', 'validation')).toBe(true);
    });
  });

  describe('handleApiError', () => {
    it('handles authentication error', () => {
      const response = handleApiError(new Error('auth error'), { category: 'authentication' });
      expect(response).toBeDefined();
      expect(response.status).toBe(401);
    });

    it('handles validation error', () => {
      const response = handleApiError(new Error('val error'), { category: 'validation' });
      expect(response.status).toBe(400);
    });

    it('handles permission error', () => {
      const response = handleApiError(new Error('perm error'), { category: 'permission' });
      expect(response.status).toBe(403);
    });

    it('handles default system error', () => {
      const response = handleApiError(new Error('sys error'));
      expect(response.status).toBe(500);
    });

    it('logs error if severity is high', () => {
      handleApiError(new Error('crit error'), { severity: 'high', category: 'system' });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('specialized error handlers', () => {
    it('handleMessageError sets correct context', () => {
      handleMessageError(new Error('fail'), 'encrypt');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('system/high'),
        expect.any(Object)
      );
    });

    it('handleSessionError handles not found', () => {
      handleSessionError(new Error('Session not found'), 'retrieve');
      expect(logger.error).toHaveBeenCalled();
    });

    it('handleAIError sets context for unavailable model', () => {
      handleAIError(new Error('model not available'));
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('external_api/medium'),
        expect.any(Object)
      );
    });
  });

  describe('client side error utilities', () => {
    it('handleClientError returns user message', () => {
      const result = handleClientError(new Error('network error'), { operation: 'test' });
      expect(result.userMessage).toContain('Network');
    });

    it('withErrorHandling catches and reports', async () => {
      const onError = jest.fn();
      const result = await withErrorHandling(
        async () => {
          throw new Error('oops');
        },
        {
          operationName: 'test',
          onError,
        }
      );

      expect(result.error).toBeDefined();
      expect(onError).toHaveBeenCalled();
    });

    it('withErrorHandling returns data on success', async () => {
      const result = await withErrorHandling(async () => 'success', {
        operationName: 'test',
      });
      expect(result.data).toBe('success');
    });
  });

  describe('enhancedErrorHandlers', () => {
    it('handleDatabaseError delegates correctly', () => {
      enhancedErrorHandlers.handleDatabaseError(new Error('db'), 'op', {});
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('database/high'),
        expect.any(Object)
      );
    });
  });

  describe('ServiceCircuitBreaker', () => {
    let breaker: ServiceCircuitBreaker;

    beforeEach(() => {
      breaker = new ServiceCircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 100,
      });
    });

    it('executes successful operation', async () => {
      const result = await breaker.executeWithBreaker('svc', async () => 'ok');
      expect(result).toBe('ok');
      const status = breaker.getAllStatuses().find((s) => s.name === 'svc');
      expect(status?.consecutiveFailures).toBe(0);
    });

    it('opens circuit after failures', async () => {
      const op = async () => {
        throw new Error('fail');
      };

      await expect(breaker.executeWithBreaker('svc', op)).rejects.toThrow();
      await expect(breaker.executeWithBreaker('svc', op)).rejects.toThrow();

      // Should be open now
      await expect(breaker.executeWithBreaker('svc', op)).rejects.toThrow(/circuit open/);
    });

    it('uses fallback when circuit is open', async () => {
      const op = async () => {
        throw new Error('fail');
      };
      const fallback = jest.fn().mockReturnValue('fallback');

      await expect(breaker.executeWithBreaker('svc', op)).rejects.toThrow();
      await expect(breaker.executeWithBreaker('svc', op)).rejects.toThrow();

      const result = await breaker.executeWithBreaker('svc', op, fallback);
      expect(result).toBe('fallback');
    });

    it('resets after timeout', async () => {
      jest.useFakeTimers();
      const breaker = new ServiceCircuitBreaker({
        failureThreshold: 1,
        resetTimeout: 100,
      });

      const op = jest.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValue('ok');

      // Fail once -> open
      await expect(breaker.executeWithBreaker('svc', op)).rejects.toThrow();

      // Check open
      await expect(breaker.executeWithBreaker('svc', op)).rejects.toThrow(/circuit open/);

      // Wait
      jest.setSystemTime(Date.now() + 150);

      // Should retry
      const result = await breaker.executeWithBreaker('svc', op);
      expect(result).toBe('ok');
    });
  });

  describe('utility wrappers', () => {
    it('withAIFallback uses circuit breaker', async () => {
      const result = await withAIFallback(async () => 'ok', 'fallback');
      expect(result).toBe('ok');
    });

    it('withRetry retries operation', async () => {
      const op = jest.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValue('ok');

      const result = await withRetry(op, 3, 10);
      expect(result).toBe('ok');
      expect(op).toHaveBeenCalledTimes(2);
    });

    it('withRetry fails after max retries', async () => {
      const op = jest.fn().mockRejectedValue(new Error('fail'));
      await expect(withRetry(op, 2, 10)).rejects.toThrow('fail');
      expect(op).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it('withTimeout resolves if fast enough', async () => {
      const op = async () => 'ok';
      await expect(withTimeout(op, 1000)).resolves.toBe('ok');
    });

    it('withTimeout rejects if too slow', async () => {
      const op = () => new Promise((r) => setTimeout(r, 200));
      await expect(withTimeout(op, 100)).rejects.toThrow('Operation timed out');
    });
  });

  describe('circuit breaker global utils', () => {
    it('getCircuitBreakerStatus returns status', () => {
      const status = getCircuitBreakerStatus();
      expect(status.services).toBeDefined();
      expect(status.summary).toBeDefined();
    });

    it('resetServiceCircuitBreaker resets service', () => {
      resetServiceCircuitBreaker('test-svc');
      const status = getCircuitBreakerStatus().services.find((s) => s.name === 'test-svc');
      expect(status?.consecutiveFailures).toBe(0);
    });
  });
});
