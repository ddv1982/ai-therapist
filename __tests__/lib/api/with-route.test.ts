// Use global NextResponse mock from jest.setup.js

import { withApiRoute } from '@/lib/api/with-route';

// Ensure global NextResponse mock attaches headers correctly in this suite
const { NextResponse } = jest.requireMock('next/server');
NextResponse.json = (data: any, init?: any) => {
  const headerMap = new Map(Object.entries((init && init.headers) || {}));
  const headers = {
    get: (k: string) => headerMap.get(k),
    set: (k: string, v: string) => headerMap.set(k, String(v)),
    entries: () => headerMap.entries(),
  } as any;
  const body = JSON.stringify(data);
  return {
    status: (init && init.status) || 200,
    headers,
    body,
    json: async () => data,
    text: async () => body,
    cookies: { set: jest.fn(), delete: jest.fn() },
  } as any;
};

jest.mock('@/lib/api/logging', () => ({
  createRequestContext: jest.fn(() => ({ requestId: 'rid', method: 'GET', url: 'http://t', userAgent: 'ua' })),
}));

jest.mock('@/lib/api/auth', () => ({
  authenticateRequest: jest.fn(async () => ({ isAuthenticated: true, userInfo: { id: 'u1' } })),
}));

jest.mock('@/lib/api/rate-limiter', () => ({
  getRateLimiter: jest.fn(() => ({ checkRateLimit: jest.fn(async () => ({ allowed: true })) })),
}));

describe('withApiRoute', () => {
  it('passes through without auth/rate limit and adds X-Request-Id', async () => {
    const { NextResponse } = jest.requireMock('next/server');
    const handler = jest.fn(async () => NextResponse.json({ success: true }));
    const wrapped = withApiRoute(handler);
    // Provide x-request-id in the request headers so middleware can propagate it
    const req = new Request('http://test') as any;
    req.headers = new Map([['x-request-id', 'rid']]);
    const res = await wrapped(req);
    expect(handler).toHaveBeenCalled();
    expect((res as any).headers.get('X-Request-Id')).toBe('rid');
  });

  it('enforces auth when enabled', async () => {
    const { authenticateRequest } = jest.requireMock('@/lib/api/auth') as { authenticateRequest: jest.Mock };
    authenticateRequest.mockResolvedValueOnce({ isAuthenticated: false, error: 'nope' });
    const { NextResponse } = jest.requireMock('next/server');
    const wrapped = withApiRoute(async () => NextResponse.json({ success: true }) as any, { auth: true });
    const res = await wrapped(new Request('http://test') as any);
    const json = await (res as any).json();
    expect((res as any).status).toBe(401);
    expect(json.success).toBe(false);
  });

  it('rate limits when bucket denies', async () => {
    const { getRateLimiter } = jest.requireMock('@/lib/api/rate-limiter') as { getRateLimiter: jest.Mock };
    getRateLimiter.mockReturnValueOnce({ checkRateLimit: jest.fn(async () => ({ allowed: false, retryAfter: 5 })) });
    const { NextResponse } = jest.requireMock('next/server');
    const wrapped = withApiRoute(async () => NextResponse.json({ success: true }) as any, { rateLimitBucket: 'api' });
    const res = await wrapped(new Request('http://test') as any);
    expect((res as any).status).toBe(429);
    expect((res as any).headers.get('Retry-After')).toBe('5');
  });
});


