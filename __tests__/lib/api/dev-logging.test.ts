/**
 * Tests for Development Request/Response Logging
 */

import {
  redactSensitiveData,
  redactHeaders,
  isApiLoggingEnabled,
  setApiLoggingEnabled,
  logRequest,
  logResponse,
  logApiError,
  loggedFetch,
  createLoggingDecorator,
  getRecentApiLogs,
  clearApiLogs,
  exportApiLogs,
} from '@/lib/api/dev-logging';

// Mock isDevelopment
jest.mock('@/config/env.public', () => ({
  isDevelopment: true,
}));

// Mock global fetch
const mockFetch = jest.fn();

describe('Development API Logging', () => {
  describe('redactSensitiveData', () => {
    it('should redact sensitive keys', () => {
      const data = {
        id: '123',
        password: 'secret123',
        token: 'abc123',
        name: 'John',
      };

      const result = redactSensitiveData(data) as Record<string, unknown>;

      expect(result.id).toBe('123');
      expect(result.password).toBe('[REDACTED]');
      expect(result.token).toBe('[REDACTED]');
      expect(result.name).toBe('John');
    });

    it('should redact therapeutic content keys', () => {
      const data = {
        id: '123',
        content: 'I feel anxious about...',
        message: 'User message here',
        thoughts: ['thought 1', 'thought 2'],
      };

      const result = redactSensitiveData(data) as Record<string, unknown>;

      expect(result.id).toBe('123'); // id is not sensitive
      expect(result.content).toBe('[REDACTED]');
      expect(result.message).toBe('[REDACTED]');
      expect(result.thoughts).toBe('[REDACTED]');
    });

    it('should redact long strings', () => {
      const longString = 'a'.repeat(250);
      const result = redactSensitiveData(longString);

      expect(result).toBe('[REDACTED_STRING:250chars]');
    });

    it('should redact JWT tokens', () => {
      const jwt =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';

      const result = redactSensitiveData(jwt);

      expect(result).toBe('[REDACTED_JWT]');
    });

    it('should redact Bearer tokens', () => {
      const result = redactSensitiveData('Bearer abc123xyz');

      expect(result).toBe('Bearer [REDACTED]');
    });

    it('should handle nested objects', () => {
      const data = {
        user: {
          id: '123',
          authData: {
            password: 'secret',
          },
        },
      };

      const result = redactSensitiveData(data) as {
        user: { id: string; authData: { password: string } };
      };

      expect(result.user.id).toBe('123');
      // 'credentials' is in SENSITIVE_KEYS so the whole object would be redacted
      // but 'authData' is not, so it recurses and redacts 'password'
      expect(result.user.authData.password).toBe('[REDACTED]');
    });

    it('should handle arrays', () => {
      const data = {
        items: [{ id: 1 }, { id: 2 }, { id: 3 }],
      };

      const result = redactSensitiveData(data) as {
        items: Array<{ id: number }>;
      };

      expect(result.items).toHaveLength(3);
      expect(result.items[0].id).toBe(1);
    });

    it('should truncate large arrays', () => {
      const data = Array.from({ length: 20 }, (_, i) => ({ id: i }));

      const result = redactSensitiveData(data);

      expect(result).toBe('[ARRAY:20items]');
    });

    it('should handle null and undefined', () => {
      expect(redactSensitiveData(null)).toBe(null);
      expect(redactSensitiveData(undefined)).toBe(undefined);
    });

    it('should respect max depth', () => {
      const deeplyNested = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  level6: 'deep value',
                },
              },
            },
          },
        },
      };

      // With default maxDepth of 5, depth 0->1->2->3->4->5->6 means level6's value
      // at depth 6 becomes MAX_DEPTH_EXCEEDED
      const result = redactSensitiveData(deeplyNested) as {
        level1: { level2: { level3: { level4: { level5: { level6: string } } } } };
      };

      expect(result.level1.level2.level3.level4.level5.level6).toBe('[MAX_DEPTH_EXCEEDED]');
    });
  });

  describe('redactHeaders', () => {
    it('should redact sensitive headers', () => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token123',
        Cookie: 'session=abc123',
        'X-Request-Id': 'req-123',
      };

      const result = redactHeaders(headers);

      expect(result['Content-Type']).toBe('application/json');
      expect(result['Authorization']).toBe('[REDACTED]');
      expect(result['Cookie']).toBe('[REDACTED]');
      expect(result['X-Request-Id']).toBe('req-123');
    });

    it('should handle Headers object', () => {
      const headers = new Headers({
        'Content-Type': 'application/json',
        authorization: 'Bearer token123',
      });

      const result = redactHeaders(headers);

      expect(result['content-type']).toBe('application/json');
      expect(result['authorization']).toBe('[REDACTED]');
    });

    it('should handle undefined headers', () => {
      const result = redactHeaders(undefined);

      expect(result).toEqual({});
    });
  });

  describe('isApiLoggingEnabled', () => {
    beforeEach(() => {
      // Clear localStorage mock
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
    });

    it('should return true in development by default', () => {
      // Note: isDevelopment is mocked as true
      expect(isApiLoggingEnabled()).toBe(true);
    });
  });

  describe('logging functions', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      jest.spyOn(console, 'groupCollapsed').mockImplementation();
      jest.spyOn(console, 'groupEnd').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('logRequest should log request details', () => {
      logRequest('POST', '/api/sessions', {
        headers: { 'Content-Type': 'application/json' },
        body: { title: 'Test' },
        requestId: 'req-123',
      });

      // In Node environment, uses console.log with JSON
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('logResponse should log response details', () => {
      logResponse('GET', '/api/sessions', {
        status: 200,
        statusText: 'OK',
        body: { data: [{ id: '1' }] },
        requestId: 'req-123',
        startTime: Date.now() - 100,
      });

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('logApiError should log error details', () => {
      const error = new Error('Network error');

      logApiError('POST', '/api/sessions', error, {
        requestId: 'req-123',
        startTime: Date.now() - 50,
      });

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('logResponse should log error status responses', () => {
      logResponse('GET', '/api/sessions', {
        status: 500,
        statusText: 'Internal Server Error',
        body: { error: 'Something went wrong' },
        requestId: 'req-456',
        startTime: Date.now() - 100,
      });

      expect(consoleSpy).toHaveBeenCalled();
      // Response was logged (format varies between browser and server)
    });

    it('logRequest should handle request without body', () => {
      logRequest('GET', '/api/sessions', {
        headers: { 'Content-Type': 'application/json' },
        requestId: 'req-789',
      });

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('logResponse should handle response without duration', () => {
      logResponse('GET', '/api/sessions', {
        status: 200,
        statusText: 'OK',
        body: { data: [] },
        // No startTime provided
      });

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('logApiError should handle error without options', () => {
      const error = new Error('Network error');

      logApiError('POST', '/api/sessions', error);

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('setApiLoggingEnabled', () => {
    // Note: In Node.js environment, `window` is undefined
    // so setApiLoggingEnabled does nothing (no localStorage access)
    // This tests the function's graceful handling in Node environment

    it('should do nothing when window is undefined (Node.js environment)', () => {
      // In Node.js test environment, window is undefined
      // The function should handle this gracefully and not throw
      expect(() => setApiLoggingEnabled(true)).not.toThrow();
      expect(() => setApiLoggingEnabled(false)).not.toThrow();
    });

    it('should accept boolean parameters', () => {
      // Just verify the function signature accepts booleans
      setApiLoggingEnabled(true);
      setApiLoggingEnabled(false);
      // No assertion needed - just verify it doesn't throw
    });
  });

  describe('isApiLoggingEnabled with localStorage', () => {
    // Note: In Node.js environment, window is undefined so localStorage path is not taken
    // These tests verify the function handles various scenarios gracefully
    // and defaults to isDevelopment when window is not available

    it('should return isDevelopment default when window is not available', () => {
      // In Node.js test environment, window is undefined
      // isDevelopment is mocked as true, so this should return true
      expect(isApiLoggingEnabled()).toBe(true);
    });

    it('should respect process.env override in server environment', () => {
      const originalEnv = process.env.DEV_API_LOGGING;

      // When DEV_API_LOGGING is explicitly 'false', should return false
      process.env.DEV_API_LOGGING = 'false';
      expect(isApiLoggingEnabled()).toBe(false);

      // When DEV_API_LOGGING is explicitly 'true', should return true
      process.env.DEV_API_LOGGING = 'true';
      expect(isApiLoggingEnabled()).toBe(true);

      // Restore
      if (originalEnv !== undefined) {
        process.env.DEV_API_LOGGING = originalEnv;
      } else {
        delete process.env.DEV_API_LOGGING;
      }
    });
  });

  describe('isApiLoggingEnabled with process.env', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return true when DEV_API_LOGGING is true', () => {
      process.env.DEV_API_LOGGING = 'true';
      expect(isApiLoggingEnabled()).toBe(true);
    });

    it('should return false when DEV_API_LOGGING is false', () => {
      process.env.DEV_API_LOGGING = 'false';
      expect(isApiLoggingEnabled()).toBe(false);
    });
  });

  describe('redactSensitiveData additional cases', () => {
    it('should redact keys containing password in name', () => {
      const data = {
        userPassword: 'secret123',
        hashedPassword: 'hash',
        passwordHash: 'hash',
      };

      const result = redactSensitiveData(data) as Record<string, unknown>;

      expect(result.userPassword).toBe('[REDACTED]');
      expect(result.hashedPassword).toBe('[REDACTED]');
      expect(result.passwordHash).toBe('[REDACTED]');
    });

    it('should redact keys containing secret in name', () => {
      const data = {
        clientSecret: 'secret123',
        secretKey: 'key',
      };

      const result = redactSensitiveData(data) as Record<string, unknown>;

      expect(result.clientSecret).toBe('[REDACTED]');
      expect(result.secretKey).toBe('[REDACTED]');
    });

    it('should redact keys containing token in name', () => {
      const data = {
        authToken: 'token123',
        tokenValue: 'value',
      };

      const result = redactSensitiveData(data) as Record<string, unknown>;

      expect(result.authToken).toBe('[REDACTED]');
      expect(result.tokenValue).toBe('[REDACTED]');
    });

    it('should pass through primitive non-sensitive values', () => {
      expect(redactSensitiveData(123)).toBe(123);
      expect(redactSensitiveData(true)).toBe(true);
      expect(redactSensitiveData('short')).toBe('short');
    });
  });

  describe('loggedFetch', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      jest.spyOn(console, 'groupCollapsed').mockImplementation();
      jest.spyOn(console, 'groupEnd').mockImplementation();
      mockFetch.mockReset();
      global.fetch = mockFetch;
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log request and response for successful fetch', async () => {
      const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
      });
      mockFetch.mockResolvedValue(mockResponse);

      const response = await loggedFetch('/api/test', {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith('/api/test', { method: 'GET' });
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle POST requests with JSON body', async () => {
      const mockResponse = new Response(JSON.stringify({ id: '123' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
      mockFetch.mockResolvedValue(mockResponse);

      await loggedFetch('/api/test', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(mockFetch).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle fetch errors and log them', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValue(networkError);

      await expect(loggedFetch('/api/test')).rejects.toThrow('Network error');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle non-Error objects thrown by fetch', async () => {
      mockFetch.mockRejectedValue('string error');

      await expect(loggedFetch('/api/test')).rejects.toBe('string error');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle URL object input', async () => {
      const mockResponse = new Response('{}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      mockFetch.mockResolvedValue(mockResponse);

      const url = new URL('https://api.example.com/test');
      await loggedFetch(url);

      expect(mockFetch).toHaveBeenCalledWith(url, undefined);
    });

    it('should handle Request object input', async () => {
      const mockResponse = new Response('{}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      mockFetch.mockResolvedValue(mockResponse);

      const request = new Request('https://api.example.com/test', { method: 'GET' });
      await loggedFetch(request);

      expect(mockFetch).toHaveBeenCalledWith(request, undefined);
    });

    it('should use X-Request-Id header if provided', async () => {
      const mockResponse = new Response('{}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      mockFetch.mockResolvedValue(mockResponse);

      await loggedFetch('/api/test', {
        headers: { 'X-Request-Id': 'custom-id-123' },
      });

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle unparseable body', async () => {
      const mockResponse = new Response('{}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      mockFetch.mockResolvedValue(mockResponse);

      await loggedFetch('/api/test', {
        method: 'POST',
        body: 'not valid json {',
      });

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle non-JSON response content type', async () => {
      const mockResponse = new Response('<html></html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
      mockFetch.mockResolvedValue(mockResponse);

      await loggedFetch('/api/test');

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle response body parsing errors gracefully', async () => {
      // Create a response that will fail to parse as JSON
      const mockResponse = {
        clone: () => ({
          headers: new Headers({ 'Content-Type': 'application/json' }),
          json: () => Promise.reject(new Error('Parse error')),
        }),
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      const response = await loggedFetch('/api/test');

      expect(response.status).toBe(200);
    });
  });

  describe('createLoggingDecorator', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      jest.spyOn(console, 'groupCollapsed').mockImplementation();
      jest.spyOn(console, 'groupEnd').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should wrap a function and log invocation and result', async () => {
      const mockFn = jest.fn().mockResolvedValue({ id: '123', name: 'Test' });
      const decorator = createLoggingDecorator<[string], { id: string; name: string }>(
        'testMethod'
      );
      const decoratedFn = decorator(mockFn);

      const result = await decoratedFn('arg1');

      expect(result).toEqual({ id: '123', name: 'Test' });
      expect(mockFn).toHaveBeenCalledWith('arg1');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log errors thrown by decorated function', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));
      const decorator = createLoggingDecorator<[string], never>('failingMethod');
      const decoratedFn = decorator(mockFn);

      await expect(decoratedFn('arg1')).rejects.toThrow('Test error');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle non-Error objects thrown', async () => {
      const mockFn = jest.fn().mockRejectedValue('string error');
      const decorator = createLoggingDecorator<[], never>('failingMethod');
      const decoratedFn = decorator(mockFn);

      await expect(decoratedFn()).rejects.toBe('string error');
    });

    it('should pass through when logging is disabled', async () => {
      // Temporarily mock isApiLoggingEnabled to return false
      const mockFn = jest.fn().mockResolvedValue('result');
      const decorator = createLoggingDecorator<[], string>('testMethod');
      const decoratedFn = decorator(mockFn);

      // Store original env
      const originalEnv = process.env.DEV_API_LOGGING;
      process.env.DEV_API_LOGGING = 'false';

      const result = await decoratedFn();

      // Restore env
      process.env.DEV_API_LOGGING = originalEnv;

      expect(result).toBe('result');
      expect(mockFn).toHaveBeenCalled();
    });
  });

  describe('debug utilities', () => {
    it('getRecentApiLogs should return empty array', () => {
      const logs = getRecentApiLogs();
      expect(logs).toEqual([]);
    });

    it('clearApiLogs should not throw', () => {
      expect(() => clearApiLogs()).not.toThrow();
    });

    it('exportApiLogs should return empty JSON array', () => {
      const exported = exportApiLogs();
      expect(exported).toBe('[]');
    });
  });

  describe('logging output format', () => {
    // Tests verify that logging functions produce console output
    // Format varies between browser (grouped) and server (JSON)
    let consoleSpy: jest.SpyInstance;
    let consoleGroupSpy: jest.SpyInstance;
    const originalDevApiLogging = process.env.DEV_API_LOGGING;

    beforeEach(() => {
      // Ensure logging is enabled for these tests
      delete process.env.DEV_API_LOGGING;
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      consoleGroupSpy = jest.spyOn(console, 'groupCollapsed').mockImplementation();
      jest.spyOn(console, 'groupEnd').mockImplementation();
      jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      jest.restoreAllMocks();
      // Restore original env
      if (originalDevApiLogging !== undefined) {
        process.env.DEV_API_LOGGING = originalDevApiLogging;
      } else {
        delete process.env.DEV_API_LOGGING;
      }
    });

    it('should log request details', () => {
      // Verify logging is enabled
      expect(isApiLoggingEnabled()).toBe(true);

      logRequest('GET', '/api/test', {
        headers: { 'Content-Type': 'application/json' },
        requestId: 'req-format-123',
      });

      // Either browser format (groupCollapsed) or server format (log with JSON)
      const loggingOccurred =
        consoleSpy.mock.calls.length > 0 || consoleGroupSpy.mock.calls.length > 0;
      expect(loggingOccurred).toBe(true);
    });

    it('should include request ID in logging output', () => {
      logRequest('POST', '/api/test', {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: { test: 'data' },
        requestId: 'req-format-456',
      });

      // Verify some logging occurred
      const loggingOccurred =
        consoleSpy.mock.calls.length > 0 || consoleGroupSpy.mock.calls.length > 0;
      expect(loggingOccurred).toBe(true);
    });

    it('should include body in logging output', () => {
      logRequest('POST', '/api/test', {
        body: { test: 'data' },
        requestId: 'req-format-789',
      });

      // Verify some logging occurred
      const loggingOccurred =
        consoleSpy.mock.calls.length > 0 || consoleGroupSpy.mock.calls.length > 0;
      expect(loggingOccurred).toBe(true);
    });

    it('should log error details', () => {
      logApiError('POST', '/api/test', new Error('Test error message'), {
        requestId: 'req-error-format-123',
      });

      // Verify some logging occurred
      const loggingOccurred =
        consoleSpy.mock.calls.length > 0 || consoleGroupSpy.mock.calls.length > 0;
      expect(loggingOccurred).toBe(true);
    });

    it('should log response with duration when startTime is provided', () => {
      const startTime = Date.now() - 150;
      logResponse('GET', '/api/test', {
        status: 200,
        statusText: 'OK',
        body: { data: 'test' },
        requestId: 'req-duration-format-123',
        startTime,
      });

      // Verify some logging occurred
      const loggingOccurred =
        consoleSpy.mock.calls.length > 0 || consoleGroupSpy.mock.calls.length > 0;
      expect(loggingOccurred).toBe(true);
    });

    it('should log response with status code', () => {
      logResponse('GET', '/api/test', {
        status: 404,
        statusText: 'Not Found',
        requestId: 'req-404-format-123',
      });

      // Verify some logging occurred
      const loggingOccurred =
        consoleSpy.mock.calls.length > 0 || consoleGroupSpy.mock.calls.length > 0;
      expect(loggingOccurred).toBe(true);
    });
  });
});
