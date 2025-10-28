import { NextRequest, NextResponse } from 'next/server';
import { createApiMiddleware } from '@/lib/api/api-middleware';

describe('api-middleware factory - rate limit unauthenticated', () => {
  it('returns 429 with Retry-After when limiter denies', async () => {
    const mw = createApiMiddleware({
      getRateLimiter: () => ({
        checkRateLimit: async () => ({ allowed: false, retryAfter: 9 }),
      }) as any,
      createRequestLogger: (_req: unknown) => ({
        requestId: 'rid-factory-rl',
        method: 'GET',
        url: 'http://localhost/rl',
        userAgent: 'jest',
      }) as any,
    });

    const wrapped = mw.withRateLimitUnauthenticated(async () => NextResponse.json({ success: true, data: { ok: true }, meta: { timestamp: new Date().toISOString() } }), { bucket: 'api' });
    const req = new NextRequest('http://localhost/rl', { method: 'GET', headers: { 'user-agent': 'jest', 'x-forwarded-for': '9.9.9.9' } });
    const res = await wrapped(req as any, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('9');
    expect(res.headers.get('X-Request-Id')).toBe('rid-factory-rl');
  });

  it('bypasses limiter when RATE_LIMIT_DISABLED=true in non-production', async () => {
    const original = process.env.RATE_LIMIT_DISABLED;
    process.env.RATE_LIMIT_DISABLED = 'true';
    try {
      const mw = createApiMiddleware({
        getRateLimiter: () => ({
          checkRateLimit: async () => { throw new Error('should not be called'); },
        }) as any,
        createRequestLogger: (_req: unknown) => ({
          requestId: 'rid-factory-rl',
          method: 'GET',
          url: 'http://localhost/rl',
          userAgent: 'jest',
        }) as any,
      });

      const wrapped = mw.withRateLimitUnauthenticated(async () => NextResponse.json({ success: true, data: { ok: true }, meta: { timestamp: new Date().toISOString() } }), { bucket: 'api' });
      const req = new NextRequest('http://localhost/rl', { method: 'GET', headers: { 'user-agent': 'jest', 'x-forwarded-for': '9.9.9.9' } });
      const res = await wrapped(req as any, { params: Promise.resolve({}) } as any);
      expect(res.status).toBe(200);
      expect(res.headers.get('X-Request-Id')).toBe('rid-factory-rl');
    } finally {
      process.env.RATE_LIMIT_DISABLED = original;
    }
  });
});


