/**
 * Tests for Development Request/Response Logging
 */

import {
  redactSensitiveData,
  redactHeaders,
  isApiLoggingEnabled,
  logRequest,
  logResponse,
  logApiError,
} from '@/lib/api/dev-logging';

// Mock isDevelopment
jest.mock('@/config/env.public', () => ({
  isDevelopment: true,
}));

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
  });
});
