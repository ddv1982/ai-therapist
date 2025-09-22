import { NextRequest, NextResponse } from 'next/server';

jest.mock('@/lib/api/rate-limiter', () => ({
  getRateLimiter: () => ({ checkRateLimit: async () => ({ allowed: false, retryAfter: 2 }) })
}));

describe('api-middleware more branches', () => {
  it('withRateLimitUnauthenticated returns 429 when limited', async () => {
    const mod = require('@/lib/api/api-middleware');
    process.env.RATE_LIMIT_DISABLED = 'false';
    const handler = jest.fn(async (_req: any, _ctx: any) => NextResponse.json({ ok: true }));
    const wrapped = mod.withRateLimitUnauthenticated(handler, { bucket: 'api' });
    const req = { headers: new Headers({ 'x-forwarded-for': '1.1.1.1' }) } as unknown as NextRequest;
    const res = await wrapped(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(429);
  });
});


