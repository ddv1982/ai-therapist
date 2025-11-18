import {
  classifyError,
  shouldLogError,
  handleClientError,
  withErrorHandling,
} from '@/lib/utils/error-utils';

describe('error-utils edge branches', () => {
  it('classifyError maps by keywords and defaults to system', () => {
    expect(classifyError(new Error('database constraint'))).toEqual({
      category: 'database',
      severity: 'high',
      isRetryable: false,
    });
    expect(classifyError(new Error('groq api failure'))).toEqual({
      category: 'external_api',
      severity: 'medium',
      isRetryable: true,
    });
    expect(classifyError(new Error('auth token invalid'))).toEqual({
      category: 'authentication',
      severity: 'high',
      isRetryable: false,
    });
    expect(classifyError(new Error('validation required field'))).toEqual({
      category: 'validation',
      severity: 'low',
      isRetryable: false,
    });
    expect(classifyError(new Error('some random error'))).toEqual({
      category: 'system',
      severity: 'medium',
      isRetryable: false,
    });
  });

  it('shouldLogError respects severity and category rules', () => {
    expect(shouldLogError('critical', 'system')).toBe(true);
    expect(shouldLogError('high', 'validation')).toBe(true);
    const original = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = 'production';
    expect(shouldLogError('low', 'validation')).toBe(false);
    (process.env as Record<string, string>).NODE_ENV = 'development';
    expect(shouldLogError('low', 'validation')).toBe(true);
    if (original === undefined) delete (process.env as Record<string, string>).NODE_ENV;
    else (process.env as Record<string, string>).NODE_ENV = original;
  });

  it('handleClientError derives user messages from common keywords', () => {
    const network = handleClientError(new Error('Network unreachable'), { operation: 'fetchData' });
    expect(network.userMessage.toLowerCase()).toContain('network');
    const timeout = handleClientError(new Error('request timeout'), { operation: 'fetchData' });
    expect(timeout.userMessage.toLowerCase()).toContain('timed out');
    const auth = handleClientError(new Error('authentication failed'), { operation: 'fetchData' });
    expect(auth.userMessage.toLowerCase()).toContain('log in');
  });

  it('withErrorHandling wraps async ops and returns fallback error message', async () => {
    const res = await withErrorHandling(
      async () => {
        throw new Error('network down');
      },
      { operationName: 'load' }
    );
    expect(res.error).toBeDefined();
    expect(res.data).toBeUndefined();
  });
});
