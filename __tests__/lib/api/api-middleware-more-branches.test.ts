import type { NextRequest } from 'next/server';

jest.mock('@/lib/api/api-auth', () => ({
  validateApiAuth: jest.fn(async () => ({ isValid: true, clerkId: 'clerk_stream' })),
}));

jest.mock('@/lib/auth/user-session', () => ({
  getSingleUserInfo: jest.fn(() => ({
    email: 'stream@test.com',
    name: 'Stream User',
    currentDevice: 'Computer',
  })),
}));

jest.mock('@/lib/api/rate-limiter', () => ({
  getRateLimiter: jest.fn(() => ({
    checkRateLimit: jest.fn(async () => ({ allowed: false, retryAfter: 2 })),
    getStatus: jest.fn(() => ({ count: 2, remaining: 8, resetTime: Date.now() + 1000 })),
  })),
}));

describe('api-middleware more branches', () => {
  function makeRequest(overrides: Partial<NextRequest> = {}): NextRequest {
    return {
      headers: new Headers({
        'x-request-id': 'rid-branch-default',
        'x-forwarded-for': '1.1.1.1',
        'user-agent': 'jest',
        host: 'localhost:4000',
      }),
      method: 'GET',
      url: 'http://localhost:4000/api/test',
      ...overrides,
    } as unknown as NextRequest;
  }

  it('withRateLimitUnauthenticated returns 429 envelope + Retry-After when limited', async () => {
    const mod = require('@/lib/api/api-middleware');
    const handler = jest.fn(
      async () => new Response(JSON.stringify({ ok: true }), { status: 200 })
    );
    const wrapped = mod.withRateLimitUnauthenticated(handler, { bucket: 'api' });
    const req = makeRequest({
      headers: new Headers({
        'x-request-id': 'rid-branch-1',
        'x-forwarded-for': '1.1.1.1',
        'user-agent': 'jest',
      }),
    });
    const res = await wrapped(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('2');
    expect(res.headers.get('X-Request-Id')).toBe('rid-branch-1');
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(body.meta.requestId).toBe('rid-branch-1');
  });
});
