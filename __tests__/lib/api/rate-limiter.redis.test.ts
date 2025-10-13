import type { RedisClientType } from '@/lib/cache/redis-client';

const originalEnv = { ...process.env };

function mockRedisExecute(count: number, ttl: number) {
  const fakeTx = {
    incr: jest.fn(),
    pTTL: jest.fn(),
    exec: jest.fn().mockResolvedValue([count, ttl]),
  };

  const fakeClient = {
    multi: jest.fn(() => fakeTx),
    pExpire: jest.fn(),
  } as unknown as RedisClientType<Record<string, never>, Record<string, never>, Record<string, never>>;

  const executeCommand = jest.fn(async (command: (client: typeof fakeClient) => Promise<unknown>, fallback?: unknown) => {
    const result = await command(fakeClient);
    return (result as unknown) ?? fallback ?? null;
  });

  jest.doMock('@/lib/cache/redis-client', () => ({
    redisManager: { executeCommand },
  }));

  return { executeCommand, fakeTx, fakeClient };
}

describe('Redis rate limiter TTL handling', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it('falls back to configured window when Redis TTL is negative', async () => {
    jest.resetModules();
    process.env.RATE_LIMIT_USE_REDIS = 'true';
    process.env.API_MAX_REQS = '5';
    process.env.API_WINDOW_MS = '60000';

    const { executeCommand } = mockRedisExecute(6, -1);

    const { getRateLimiter } = await import('@/lib/api/rate-limiter');
    const limiter = getRateLimiter();

    const result = await limiter.checkRateLimit('1.2.3.4', 'api');

    expect(executeCommand).toHaveBeenCalled();
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBe(60);
  });

  it('ensures retryAfter is at least 1 second when TTL is zero', async () => {
    jest.resetModules();
    process.env.RATE_LIMIT_USE_REDIS = 'true';
    process.env.API_MAX_REQS = '5';
    process.env.API_WINDOW_MS = '30000';

    const { executeCommand } = mockRedisExecute(10, 0);

    const { getRateLimiter } = await import('@/lib/api/rate-limiter');
    const limiter = getRateLimiter();

    const result = await limiter.checkRateLimit('9.9.9.9', 'api');

    expect(executeCommand).toHaveBeenCalled();
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBe(30);
  });
});
