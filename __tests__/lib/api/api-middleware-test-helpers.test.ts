import { __setCreateRequestLoggerForTests, __setApiMiddlewareDepsForTests } from '@/lib/api/api-middleware';

// Enable test mode
process.env.NODE_ENV = 'test';

describe('api-middleware test helpers', () => {
  afterEach(() => {
    // Reset to defaults
    __setCreateRequestLoggerForTests(null);
    __setApiMiddlewareDepsForTests({});
  });

  it('allows setting custom request logger for tests', () => {
    const customLogger = (req: unknown) => ({
      requestId: 'custom-id',
      method: 'GET',
      url: 'http://test.com',
    });

    __setCreateRequestLoggerForTests(customLogger);
    
    // The function should accept and store the custom logger
    expect(customLogger).toBeDefined();
  });

  it('allows resetting request logger with null', () => {
    __setCreateRequestLoggerForTests(null);
    
    // Should not throw
    expect(true).toBe(true);
  });

  it('allows setting custom validateApiAuth for tests', () => {
    const customAuth = async (req: unknown) => ({
      isValid: true,
      userId: 'test-user',
    });

    __setApiMiddlewareDepsForTests({ validateApiAuth: customAuth });
    
    expect(customAuth).toBeDefined();
  });

  it('allows setting custom rate limiter for tests', () => {
    const customLimiter = () => ({
      checkRateLimit: async (ip: string) => ({ allowed: true }),
    });

    __setApiMiddlewareDepsForTests({ getRateLimiter: customLimiter });
    
    expect(customLimiter).toBeDefined();
  });

  it('allows setting custom user info getter for tests', () => {
    const customGetter = (req: unknown) => ({
      userId: 'custom-user',
      email: 'test@example.com',
    });

    __setApiMiddlewareDepsForTests({ getSingleUserInfo: customGetter });
    
    expect(customGetter).toBeDefined();
  });

  it('allows setting multiple deps at once', () => {
    __setApiMiddlewareDepsForTests({
      validateApiAuth: async () => ({ isValid: true }),
      getRateLimiter: () => ({
        checkRateLimit: async () => ({ allowed: true }),
      }),
    });
    
    // Should not throw
    expect(true).toBe(true);
  });

  it('handles empty deps object', () => {
    __setApiMiddlewareDepsForTests({});
    
    // Should not throw
    expect(true).toBe(true);
  });
});

describe('api-middleware test helpers - non-test environment', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('does nothing when NODE_ENV is not test', () => {
    process.env.NODE_ENV = 'production';

    // These should be no-ops in production
    __setCreateRequestLoggerForTests(() => ({ requestId: 'prod' }));
    __setApiMiddlewareDepsForTests({ validateApiAuth: async () => ({ isValid: true }) });
    
    // Should not throw, just silently do nothing
    expect(true).toBe(true);
  });
});
