import {
  withApiMiddleware,
  withAuth,
  withValidation,
  withAuthAndRateLimit,
  withAuthAndRateLimitStreaming,
  withRateLimitUnauthenticated,
} from '@/lib/api/api-middleware';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

// Use global NextResponse mock from jest.setup.ts
const { NextResponse } = jest.requireMock('next/server');

jest.mock('@/lib/api/api-auth', () => ({
  validateApiAuth: jest.fn(async () => ({ isValid: true, clerkId: 'u1' })),
}));

jest.mock('@/lib/auth/user-session', () => ({
  getSingleUserInfo: jest.fn(() => ({
    email: 'user@example.com',
    name: 'User',
    currentDevice: 'Computer',
  })),
}));

jest.mock('@/lib/api/rate-limiter', () => ({
  getRateLimiter: jest.fn(() => ({
    checkRateLimit: jest.fn(async () => ({ allowed: true })),
    getStatus: jest.fn(() => ({ count: 1, remaining: 9, resetTime: Date.now() + 1000 })),
  })),
}));

describe('api-middleware wrappers', () => {
  beforeEach(() => {
    const { validateApiAuth } = jest.requireMock('@/lib/api/api-auth') as {
      validateApiAuth: jest.Mock;
    };
    validateApiAuth.mockResolvedValue({ isValid: true, clerkId: 'u1' });

    const { getSingleUserInfo } = jest.requireMock('@/lib/auth/user-session') as {
      getSingleUserInfo: jest.Mock;
    };
    getSingleUserInfo.mockReturnValue({
      email: 'user@example.com',
      name: 'User',
      currentDevice: 'Computer',
    });

    const { getRateLimiter } = jest.requireMock('@/lib/api/rate-limiter') as {
      getRateLimiter: jest.Mock;
    };
    getRateLimiter.mockReturnValue({
      checkRateLimit: jest.fn(async () => ({ allowed: true })),
      getStatus: jest.fn(() => ({ count: 1, remaining: 9, resetTime: Date.now() + 1000 })),
    });
  });

  function makeRequest(overrides: Partial<NextRequest> = {}): NextRequest {
    return {
      headers: new Headers({
        'x-request-id': 'rid-default',
        'user-agent': 'jest',
        host: 'localhost:4000',
      }),
      method: 'GET',
      url: 'http://localhost:4000/api/test',
      ...overrides,
    } as unknown as NextRequest;
  }

  it('withApiMiddleware sets standard headers and passes through', async () => {
    const handler = jest.fn(async (_req, _ctx) => NextResponse.json({ success: true }));
    const wrapped = withApiMiddleware(handler);
    const req = makeRequest({
      headers: new Headers({ 'x-request-id': 'rid-1', 'user-agent': 'jest' }),
      url: 'http://localhost:4000/api/test',
    });
    const res = await wrapped(req as any, { params: Promise.resolve({}) } as any);
    expect(handler).toHaveBeenCalled();
    expect((res as any).headers.get('X-Request-Id')).toBeTruthy();
    expect(await (res as any).json()).toEqual({ success: true });
  });

  it('withAuth rejects when auth invalid with standard envelope + request id header', async () => {
    const { validateApiAuth } = jest.requireMock('@/lib/api/api-auth') as {
      validateApiAuth: jest.Mock;
    };
    validateApiAuth.mockResolvedValueOnce({ isValid: false, error: 'no-auth' });
    const wrapped = withAuth(async () => NextResponse.json({ ok: true }));
    const req = makeRequest({
      headers: new Headers({ 'x-request-id': 'rid-2', 'user-agent': 'jest' }),
    });
    const res = await wrapped(req as any, { params: Promise.resolve({}) } as any);
    expect((res as any).status).toBe(401);
    expect((res as any).headers.get('X-Request-Id')).toBe('rid-2');
    const body = await (res as any).json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHENTICATED');
    expect(body.meta.requestId).toBe('rid-2');
    expect(body.meta.timestamp).toBeTruthy();
  });

  it('withValidation validates JSON body and forwards parsed data', async () => {
    const schema = z.object({ a: z.string() });
    const handler = jest.fn(async (_req, _ctx, data) => NextResponse.json({ ok: true, data }));
    const wrapped = withValidation(schema, handler);
    const req = makeRequest({
      headers: new Headers({
        'content-type': 'application/json',
        'x-request-id': 'rid-3',
        'user-agent': 'jest',
        host: 'localhost:4000',
      }),
      method: 'POST' as NextRequest['method'],
      url: 'http://localhost:4000/api/test',
      json: jest.fn(async () => ({ a: 'x' })),
    });
    const res = await wrapped(req, { params: Promise.resolve({}) } as any);
    expect((res as any).headers.get('X-Request-Id')).toBe('rid-3');
  });

  it('withValidation returns 400 envelope + request id when query validation fails', async () => {
    const schema = z.object({ a: z.string() });
    const wrapped = withValidation(schema, async () => NextResponse.json({ ok: true }));
    const req = makeRequest({
      headers: new Headers({
        'x-request-id': 'rid-3b',
        'user-agent': 'jest',
      }),
      method: 'GET' as NextRequest['method'],
      url: 'http://localhost:4000/api/test',
    });
    const res = await wrapped(req, { params: Promise.resolve({}) } as any);
    expect((res as any).status).toBe(400);
    expect((res as any).headers.get('X-Request-Id')).toBe('rid-3b');
    const body = await (res as any).json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toBeTruthy();
    expect(body.meta.requestId).toBe('rid-3b');
  });

  it('withRateLimitUnauthenticated returns 429 when limiter denies', async () => {
    const { getRateLimiter } = jest.requireMock('@/lib/api/rate-limiter') as {
      getRateLimiter: jest.Mock;
    };
    getRateLimiter.mockReturnValueOnce({
      checkRateLimit: jest.fn(async () => ({ allowed: false, retryAfter: 3 })),
    });
    const wrapped = withRateLimitUnauthenticated(async () => NextResponse.json({ ok: true }));
    const req = makeRequest({
      headers: new Headers({ 'x-request-id': 'rid-4', 'user-agent': 'jest' }),
    });
    const res = await wrapped(req as any, { params: Promise.resolve({}) } as any);
    expect((res as any).status).toBe(429);
    expect((res as any).headers.get('Retry-After')).toBe('3');
    expect((res as any).headers.get('X-Request-Id')).toBe('rid-4');
    const body = await (res as any).json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(body.meta.requestId).toBe('rid-4');
    expect(body.meta.timestamp).toBeTruthy();
  });

  it('withRateLimitUnauthenticated sets rate-limit headers on allowed responses', async () => {
    const { getRateLimiter } = jest.requireMock('@/lib/api/rate-limiter') as {
      getRateLimiter: jest.Mock;
    };
    getRateLimiter.mockReturnValueOnce({
      checkRateLimit: jest.fn(async () => ({ allowed: true })),
      getStatus: jest.fn(() => ({ count: 1, remaining: 9, resetTime: Date.now() + 1000 })),
    });
    const wrapped = withRateLimitUnauthenticated(async () => NextResponse.json({ ok: true }));
    const req = makeRequest({
      headers: new Headers({ 'x-request-id': 'rid-4b', 'user-agent': 'jest' }),
    });
    const res = await wrapped(req as any, { params: Promise.resolve({}) } as any);
    expect((res as any).status).toBe(200);
    expect((res as any).headers.get('X-RateLimit-Limit')).toBeTruthy();
    expect((res as any).headers.get('X-RateLimit-Remaining')).toBeTruthy();
    expect((res as any).headers.get('X-RateLimit-Reset')).toBeTruthy();
  });

  it('withAuthAndRateLimit passes when auth valid and not limited', async () => {
    const wrapped = withAuthAndRateLimit(async () => NextResponse.json({ ok: true }));
    const req = makeRequest({
      headers: new Headers({
        'x-request-id': 'rid-5',
        'user-agent': 'jest',
        host: 'localhost:4000',
      }),
      method: 'GET' as NextRequest['method'],
      url: 'http://localhost:4000/api/test',
    });
    const res = await wrapped(req as any, { params: Promise.resolve({}) } as any);
    expect((res as any).headers.get('X-Request-Id')).toBe('rid-5');
  });

  it('withAuthAndRateLimit returns 401 envelope + request-id when auth invalid', async () => {
    const { validateApiAuth } = jest.requireMock('@/lib/api/api-auth') as {
      validateApiAuth: jest.Mock;
    };
    validateApiAuth.mockResolvedValueOnce({ isValid: false, error: 'missing auth' });
    const wrapped = withAuthAndRateLimit(async () => NextResponse.json({ ok: true }));
    const req = makeRequest({
      headers: new Headers({ 'x-request-id': 'rid-5b', 'user-agent': 'jest' }),
    });
    const res = await wrapped(req as any, { params: Promise.resolve({}) } as any);
    expect((res as any).status).toBe(401);
    expect((res as any).headers.get('X-Request-Id')).toBe('rid-5b');
    const body = await (res as any).json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHENTICATED');
    expect(body.meta.requestId).toBe('rid-5b');
  });

  it('withAuthAndRateLimitStreaming returns standardized envelope for early auth failure', async () => {
    const { validateApiAuth } = jest.requireMock('@/lib/api/api-auth') as {
      validateApiAuth: jest.Mock;
    };
    validateApiAuth.mockResolvedValueOnce({ isValid: false, error: 'bad-token' });

    const wrapped = withAuthAndRateLimitStreaming(async () => new Response('ok'));
    const req = makeRequest({
      headers: new Headers({ 'x-request-id': 'rid-stream-1', 'user-agent': 'jest' }),
    });
    const res = await wrapped(req as any, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(401);
    expect(res.headers.get('X-Request-Id')).toBe('rid-stream-1');
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHENTICATED');
    expect(body.meta.requestId).toBe('rid-stream-1');
  });
});
