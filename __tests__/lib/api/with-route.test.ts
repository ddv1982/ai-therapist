import {
  withApiMiddleware,
  withAuth,
  withRateLimitUnauthenticated,
} from '@/lib/api/api-middleware';

// Use global NextResponse mock from jest.setup.js
const { NextResponse } = jest.requireMock('next/server');

jest.mock('@/lib/api/api-auth', () => ({
  validateApiAuth: jest.fn(async () => ({ isValid: true })),
}));

jest.mock('@/lib/auth/user-session', () => ({
  getSingleUserInfo: jest.fn(() => ({ userId: 'u1' })),
}));

jest.mock('@/lib/api/rate-limiter', () => ({
  getRateLimiter: jest.fn(() => ({ checkRateLimit: jest.fn(async () => ({ allowed: true })) })),
}));

describe('withApiRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes through without auth/rate limit and adds X-Request-Id', async () => {
    const handler = jest.fn(async (_req: any, _ctx: any) => NextResponse.json({ success: true }));
    const wrapped = withApiMiddleware(handler);
    
    const req = {
      headers: new Headers({ 'x-request-id': 'rid', 'user-agent': 'jest' }),
      method: 'GET',
      url: 'http://test/api',
    } as any;
    
    const res = await wrapped(req, { params: Promise.resolve({}) } as any);
    expect(handler).toHaveBeenCalled();
    expect((res as any).headers.get('X-Request-Id')).toBeTruthy();
  });

  it('enforces auth when enabled', async () => {
    const { validateApiAuth } = jest.requireMock('@/lib/api/api-auth') as {
      validateApiAuth: jest.Mock;
    };
    validateApiAuth.mockResolvedValueOnce({ isValid: false, error: 'nope' });
    
    const wrapped = withAuth(async () => NextResponse.json({ success: true }) as any);
    
    const req = {
      headers: new Headers({ 'x-request-id': 'rid-2', 'user-agent': 'jest' }),
      method: 'GET',
      url: 'http://test',
    } as any;
    
    const res = await wrapped(req, { params: Promise.resolve({}) } as any);
    const json = await (res as any).json();
    expect((res as any).status).toBe(401);
    expect(json.success).toBe(false);
  });

  it('rate limits when bucket denies', async () => {
    const { getRateLimiter } = jest.requireMock('@/lib/api/rate-limiter') as {
      getRateLimiter: jest.Mock;
    };
    getRateLimiter.mockReturnValueOnce({
      checkRateLimit: jest.fn(async () => ({ allowed: false, retryAfter: 5 })),
    });
    
    const wrapped = withRateLimitUnauthenticated(
      async (_req: any, _ctx: any) => NextResponse.json({ success: true }) as any,
      { bucket: 'api' }
    );
    
    const req = {
      headers: new Headers({ 'x-request-id': 'rid-3', 'user-agent': 'jest' }),
      method: 'GET',
      url: 'http://test',
    } as any;
    
    const res = await wrapped(req, { params: Promise.resolve({}) } as any);
    const json = await (res as any).json();
    expect((res as any).status).toBe(429);
    expect(json.success).toBe(false);
    expect((res as any).headers.get('Retry-After')).toBeTruthy();
  });
});
