import {
  withApiMiddleware,
  withAuth,
  withValidation,
  withAuthAndRateLimit,
  withRateLimitUnauthenticated,
} from '@/lib/api/api-middleware';
import { z } from 'zod';

// Use global NextResponse mock from jest.setup.ts
const { NextResponse } = jest.requireMock('next/server');

jest.mock('@/lib/api/api-auth', () => ({
  validateApiAuth: jest.fn(async () => ({ isValid: true })),
}));

jest.mock('@/lib/auth/user-session', () => ({
  getSingleUserInfo: jest.fn(() => ({ userId: 'u1', deviceId: 'd1' })),
}));

jest.mock('@/lib/api/rate-limiter', () => ({
  getRateLimiter: jest.fn(() => ({ checkRateLimit: jest.fn(async () => ({ allowed: true })) })),
}));

describe('api-middleware wrappers', () => {
  it('withApiMiddleware sets standard headers and passes through', async () => {
    const handler = jest.fn(async (_req, _ctx) => NextResponse.json({ success: true }));
    const wrapped = withApiMiddleware(handler);
    const req = {
      headers: new Headers({ 'x-request-id': 'rid-1', 'user-agent': 'jest' }),
      method: 'GET',
      url: 'http://test/api',
    } as any;
    const res = await wrapped(req as any, { params: Promise.resolve({}) } as any);
    expect(handler).toHaveBeenCalled();
    expect((res as any).headers.get('X-Request-Id')).toBeTruthy();
    expect(await (res as any).json()).toEqual({ success: true });
  });

  it('withAuth rejects when auth invalid', async () => {
    const { validateApiAuth } = jest.requireMock('@/lib/api/api-auth') as {
      validateApiAuth: jest.Mock;
    };
    validateApiAuth.mockResolvedValueOnce({ isValid: false, error: 'no-auth' });
    const wrapped = withAuth(async () => NextResponse.json({ ok: true }));
    const req = {
      headers: new Headers({ 'x-request-id': 'rid-2', 'user-agent': 'jest' }),
      method: 'GET',
      url: 'http://t',
    } as any;
    const res = await wrapped(req as any, { params: Promise.resolve({}) } as any);
    expect((res as any).status).toBe(401);
  });

  it('withValidation validates JSON body and forwards parsed data', async () => {
    const schema = z.object({ a: z.string() });
    const handler = jest.fn(async (_req, _ctx, data) => NextResponse.json({ ok: true, data }));
    const wrapped = withValidation(schema, handler);
    const req: any = {
      headers: new Headers({
        'content-type': 'application/json',
        'x-request-id': 'rid-3',
        'user-agent': 'jest',
        host: 'localhost:4000',
      }),
      method: 'POST',
      url: 'http://localhost:4000/test',
      json: jest.fn(async () => ({ a: 'x' })),
    };
    const res = await wrapped(req, { params: Promise.resolve({}) } as any);
    expect((res as any).headers.get('X-Request-Id')).toBe('rid-3');
  });

  it('withRateLimitUnauthenticated returns 429 when limiter denies', async () => {
    const { getRateLimiter } = jest.requireMock('@/lib/api/rate-limiter') as {
      getRateLimiter: jest.Mock;
    };
    getRateLimiter.mockReturnValueOnce({
      checkRateLimit: jest.fn(async () => ({ allowed: false, retryAfter: 3 })),
    });
    const wrapped = withRateLimitUnauthenticated(async () => NextResponse.json({ ok: true }));
    const req = {
      headers: new Headers({ 'x-request-id': 'rid-4', 'user-agent': 'jest' }),
      method: 'GET',
      url: 'http://t',
    } as any;
    const res = await wrapped(req as any, { params: Promise.resolve({}) } as any);
    expect((res as any).status).toBe(429);
    expect((res as any).headers.get('Retry-After')).toBe('3');
  });

  it('withAuthAndRateLimit passes when auth valid and not limited', async () => {
    const wrapped = withAuthAndRateLimit(async () => NextResponse.json({ ok: true }));
    const req: any = {
      headers: new Headers({
        'x-request-id': 'rid-5',
        'user-agent': 'jest',
        host: 'localhost:4000',
      }),
      method: 'GET',
      url: 'http://localhost:4000/t',
    };
    const res = await wrapped(req as any, { params: Promise.resolve({}) } as any);
    expect((res as any).headers.get('X-Request-Id')).toBe('rid-5');
  });
});
