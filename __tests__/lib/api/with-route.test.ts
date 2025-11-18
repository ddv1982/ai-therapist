// Use global NextResponse mock from jest.setup.js

// Defer importing api-middleware until after mocks are set up

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

jest.mock('@/lib/api/api-auth', () => ({
  validateApiAuth: jest.fn(async () => ({ isValid: true })),
}));
jest.mock('@/lib/auth/user-session', () => ({
  getSingleUserInfo: jest.fn(() => ({ userId: 'u1' })),
}));

describe('withApiRoute', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('passes through without auth/rate limit and adds X-Request-Id', async () => {
    const { NextResponse } = jest.requireMock('next/server');
    const handler = jest.fn(async (_req: any, _ctx: any) => NextResponse.json({ success: true }));
    let wrapped: any;
    jest.isolateModules(() => {
      const api = require('@/lib/api/api-middleware');
      api.__setApiMiddlewareDepsForTests({
        validateApiAuth: async () => ({ isValid: true }),
        getRateLimiter: () => ({ checkRateLimit: async () => ({ allowed: true }) }),
        getSingleUserInfo: () => ({ userId: 'u1' }),
      });
      wrapped = api.withApiMiddleware(handler);
    });
    // Provide x-request-id in the request headers so middleware can propagate it
    const req = new Request('http://test') as any;
    const headers = new Map([['x-request-id', 'rid']]);
    (req as any).headers = { get: (k: string) => headers.get(k) || null };
    const res = await wrapped(req, { params: Promise.resolve({}) } as any);
    expect(handler).toHaveBeenCalled();
    expect((res as any).headers.get('X-Request-Id')).toBeTruthy();
  });

  it('enforces auth when enabled', async () => {
    const { validateApiAuth } = jest.requireMock('@/lib/api/api-auth') as {
      validateApiAuth: jest.Mock;
    };
    validateApiAuth.mockResolvedValueOnce({ isValid: false, error: 'nope' });
    const { NextResponse } = jest.requireMock('next/server');
    let wrapped: any;
    jest.isolateModules(() => {
      const api = require('@/lib/api/api-middleware');
      api.__setApiMiddlewareDepsForTests({
        getRateLimiter: () => ({ checkRateLimit: async () => ({ allowed: true }) }),
        getSingleUserInfo: () => ({ userId: 'u1' }),
      });
      wrapped = api.withAuth(async () => NextResponse.json({ success: true }) as any);
    });
    const res = await wrapped(
      new Request('http://test') as any,
      { params: Promise.resolve({}) } as any
    );
    const json = await (res as any).json();
    expect((res as any).status).toBe(401);
    expect(json.success).toBe(false);
  });

  it('rate limits when bucket denies', async () => {
    const { NextResponse } = jest.requireMock('next/server');
    let wrapped: any;
    jest.isolateModules(() => {
      const api = require('@/lib/api/api-middleware');
      api.__setApiMiddlewareDepsForTests({
        validateApiAuth: async () => ({ isValid: true }),
        getRateLimiter: () => ({ checkRateLimit: async () => ({ allowed: false, retryAfter: 5 }) }),
        getSingleUserInfo: () => ({ userId: 'u1' }),
      });
      wrapped = api.withRateLimitUnauthenticated(
        async (_req: any, _ctx: any) => NextResponse.json({ success: true }) as any,
        { bucket: 'api' }
      );
    });
    const res = await wrapped(
      new Request('http://test') as any,
      { params: Promise.resolve({}) } as any
    );
    // Standardized response JSON
    const json = await (res as any).json();
    expect((res as any).status).toBe(429);
    expect(json.success).toBe(false);
    expect((res as any).headers.get('Retry-After')).toBeTruthy();
  });
});
