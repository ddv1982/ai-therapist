import { z } from 'zod';
import { createApiMiddleware } from '@/lib/api/api-middleware';
import type { ApiMiddlewareDeps } from '@/lib/api/middleware/factory';

jest.mock('@/lib/api/api-auth', () => ({
  validateApiAuth: jest.fn(async () => ({ isValid: true })),
}));

jest.mock('@/lib/api/rate-limiter', () => ({
  getRateLimiter: jest.fn(() => ({ checkRateLimit: jest.fn(async () => ({ allowed: true })) })),
}));

jest.mock('@/lib/auth/user-session', () => ({
  getSingleUserInfo: jest.fn(() => ({ userId: 'u1', deviceId: 'd1' })),
}));

// Use global NextRequest/NextResponse mock from jest.setup.js
const { NextRequest, NextResponse } = jest.requireMock('next/server');

const setNodeEnv = (value?: string) => {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) {
    delete env.NODE_ENV;
  } else {
    env.NODE_ENV = value;
  }
};

let errorHandlers: any;
let apiMwModule: any;
let mw: ReturnType<typeof createApiMiddleware>;

beforeAll(() => {
  jest.isolateModules(() => {
    jest.doMock('@/lib/api/api-auth', () => ({
      validateApiAuth: jest.fn(async () => ({ isValid: true })),
    }));
    jest.doMock('@/lib/api/rate-limiter', () => ({
      getRateLimiter: jest.fn(() => ({ checkRateLimit: jest.fn(async () => ({ allowed: true })) })),
    }));
    jest.doMock('@/lib/auth/user-session', () => ({
      getSingleUserInfo: jest.fn(() => ({ userId: 'u1', deviceId: 'd1' })),
    }));
    apiMwModule = require('@/lib/api/api-middleware');
    errorHandlers = apiMwModule.errorHandlers;
  });
});

describe('api-middleware branches', () => {
  function stubRequestContext() { /* context injected globally via __setCreateRequestLoggerForTests */ }
  function makeReq(url: string, method: string, headers: Record<string, string>, bodyJson?: any) {
    const hdrs = new Headers(headers as any);
    const req: any = {
      headers: hdrs,
      method,
      url,
      cookies: { get: jest.fn(() => undefined) },
    };
    if (bodyJson !== undefined) {
      req.json = jest.fn(async () => bodyJson);
    }
    return req;
  }
beforeEach(() => {
  mw = createApiMiddleware({
    createRequestLogger: () => ({ requestId: 'rid-test', method: 'GET', url: 'http://localhost/test', userAgent: 'jest' }) as any,
    validateApiAuth: async () => ({ isValid: true }) as any,
    getRateLimiter: () => ({ checkRateLimit: async () => ({ allowed: true }) }) as any,
  });
});

it('withAuthAndRateLimit returns 401 when auth invalid', async () => {
  stubRequestContext();
  const local = createApiMiddleware({
    createRequestLogger: () => ({ requestId: 'rid-test', method: 'GET', url: 'http://localhost/test', userAgent: 'jest' }) as any,
    validateApiAuth: async () => ({ isValid: false, error: 'no-auth' }),
    getRateLimiter: () => ({ checkRateLimit: async () => ({ allowed: true }) }) as any,
  });
  const wrapped401 = local.withAuthAndRateLimit(async () => NextResponse.json({ ok: true }));
  const req: any = { headers: new Headers({ 'x-request-id': 'rid-x', 'user-agent': 'jest', host: 'localhost:4000' }), method: 'GET', url: 'http://localhost:4000/x' };
  const res = await wrapped401(req, { params: Promise.resolve({}) } as any);
  expect(res.status).toBe(401);
});

it('withAuthAndRateLimit returns 429 when API limiter denies', async () => {
  stubRequestContext();
  const local = createApiMiddleware({
    createRequestLogger: () => ({ requestId: 'rid-test', method: 'GET', url: 'http://localhost/test', userAgent: 'jest' }) as any,
    validateApiAuth: async () => ({ isValid: true }),
    getRateLimiter: () => ({ checkRateLimit: async () => ({ allowed: false, retryAfter: 7 }) }) as any,
  });
  const wrapped429 = local.withAuthAndRateLimit(async () => NextResponse.json({ ok: true }));
  const req = makeReq('http://localhost:4000/y', 'GET', { 'x-request-id': 'rid-y', 'user-agent': 'jest', host: 'localhost:4000' });
  const res = await wrapped429(req, { params: Promise.resolve({}) } as any);
  apiMwModule.__setApiMiddlewareDepsForTests?.({
    validateApiAuth: async () => ({ isValid: true }),
    getRateLimiter: () => ({ checkRateLimit: async () => ({ allowed: true }) })
  });
  expect(res.status).toBe(429);
  expect(res.headers.get('Retry-After')).toBe('7');
  expect(res.headers.get('Server-Timing')).toContain('total;dur=');
});

  it('withAuthAndRateLimit wraps handler errors with 500', async () => {
    stubRequestContext();
    const wrapped = mw.withAuthAndRateLimit(async () => { throw new Error('boom'); });
    const req: any = { headers: new Headers({ 'x-request-id': 'rid-z', 'user-agent': 'jest', host: 'localhost:4000' }), method: 'GET', url: 'http://localhost:4000/z' };
    const res = await wrapped(req, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(500);
    expect(res.headers.get('X-Request-Id')).toBeTruthy();
  });

  it('withRateLimitUnauthenticated returns 200 when allowed and sets request id', async () => {
    stubRequestContext();
    const handler = jest.fn(async (_req: any, _ctx: any) => NextResponse.json({ ok: true }));
  const wrapped = mw.withRateLimitUnauthenticated(handler, { bucket: 'api' });
    const req = makeReq('http://localhost:4000/free', 'GET', { 'x-request-id': 'rid-free', 'user-agent': 'jest', host: 'localhost:4000' });
    const res = await wrapped(req, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Request-Id')).toBe('rid-test');
  });

  it('withRateLimitUnauthenticated returns 429 when limited and sets Retry-After', async () => {
    // Use factory for deterministic limiter
    const mw = createApiMiddleware({
      getRateLimiter: () => ({ checkRateLimit: async () => ({ allowed: false, retryAfter: 5 }) }) as any,
      createRequestLogger: () => ({ requestId: 'rid-test', method: 'GET', url: 'http://localhost:4000/limited', userAgent: 'jest' }) as any,
    });
    const handler = jest.fn(async (_req: any, _ctx: any) => NextResponse.json({ ok: true }));
    const wrapped = mw.withRateLimitUnauthenticated(handler, { bucket: 'api' });
    const req = makeReq('http://localhost:4000/limited', 'GET', { 'x-forwarded-for': '2.2.2.2', 'x-request-id': 'rid-lim', 'user-agent': 'jest', host: 'localhost:4000' });
    const res = await wrapped(req as any, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('5');
  });

  it('withRateLimitUnauthenticated uses fallback Retry-After when limiter omits it', async () => {
    stubRequestContext();
    process.env.RATE_LIMIT_DISABLED = 'false';
    apiMwModule.__setApiMiddlewareDepsForTests?.({
      getRateLimiter: () => ({ checkRateLimit: async () => ({ allowed: false }) })
    });
    const handler = jest.fn(async (_req: any, _ctx: any) => NextResponse.json({ ok: true }));
    // windowMs = 2000 => fallback Retry-After should be 2
  const local = createApiMiddleware({
    createRequestLogger: () => ({ requestId: 'rid-test', method: 'GET', url: 'http://localhost/test', userAgent: 'jest' }) as any,
    validateApiAuth: async () => ({ isValid: true }),
    getRateLimiter: () => ({ checkRateLimit: async () => ({ allowed: false }) }) as any,
  });
  const wrapped = local.withRateLimitUnauthenticated(handler, { bucket: 'api', windowMs: 2000 });
    const req = makeReq('http://localhost:4000/fallback', 'GET', { 'x-forwarded-for': '2.2.2.2', 'x-request-id': 'rid-fb', 'user-agent': 'jest', host: 'localhost:4000' });
    const res = await wrapped(req as any, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('2');
  });

  it('withAuthAndRateLimit passes through when RATE_LIMIT_DISABLED=true and sets headers', async () => {
    stubRequestContext();
    const original = process.env.RATE_LIMIT_DISABLED;
    process.env.RATE_LIMIT_DISABLED = 'true';
    const handler = jest.fn(async () => NextResponse.json({ ok: true }));
  const wrapped = mw.withAuthAndRateLimit(handler);
    const req = makeReq('http://localhost:4000/pass', 'GET', { 'x-request-id': 'rid-ok', 'user-agent': 'jest', host: 'localhost:4000' });
    const res = await wrapped(req as any, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Request-Id')).toBe('rid-test');
    expect(res.headers.get('Server-Timing')).toContain('total;dur=');
    if (original === undefined) delete process.env.RATE_LIMIT_DISABLED; else process.env.RATE_LIMIT_DISABLED = original;
  });

  it('withApiMiddleware sets headers on successful handler', async () => {
    stubRequestContext();
  const wrapped = mw.withApiMiddleware(async (_req: any, _ctx: any) => NextResponse.json({ ok: true }));
    const req = makeReq('http://localhost:4000/basic', 'GET', { 'x-request-id': 'rid-basic', 'user-agent': 'jest', host: 'localhost:4000' });
    const res = await wrapped(req as any, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Request-Id')).toBe('rid-test');
    expect(res.headers.get('Server-Timing')).toContain('total;dur=');
  });

  it('withAuth returns 200 when authorized', async () => {
    stubRequestContext();
  const wrapped = mw.withAuth(async () => NextResponse.json({ ok: true }));
    const req = makeReq('http://localhost:4000/auth', 'GET', { 'x-request-id': 'rid-auth', 'user-agent': 'jest', host: 'localhost:4000' });
    const res = await wrapped(req as any, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Request-Id')).toBe('rid-test');
  });

  it('withApiMiddleware wraps handler throw with 500 and sets headers', async () => {
    stubRequestContext();
  const wrapped = mw.withApiMiddleware(async () => { throw new Error('boom'); });
    const req = makeReq('http://localhost:4000/err', 'GET', { 'x-request-id': 'rid-err', 'user-agent': 'jest', host: 'localhost:4000' });
    const res = await wrapped(req as any, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(500);
    expect(res.headers.get('X-Request-Id')).toBe('rid-test');
    expect(res.headers.get('Server-Timing')).toContain('total;dur=');
  });

  it('withAuthAndRateLimit returns 200 when allowed (rate limiting enabled)', async () => {
    stubRequestContext();
    const original = process.env.RATE_LIMIT_DISABLED;
    process.env.RATE_LIMIT_DISABLED = 'false';
    const handler = jest.fn(async () => NextResponse.json({ ok: true }));
  const wrapped = mw.withAuthAndRateLimit(handler);
    const req = makeReq('http://localhost:4000/ok', 'GET', { 'x-request-id': 'rid-ok2', 'user-agent': 'jest', host: 'localhost:4000' });
    const res = await wrapped(req as any, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalled();
    if (original === undefined) delete process.env.RATE_LIMIT_DISABLED; else process.env.RATE_LIMIT_DISABLED = original;
  });

  it('withAuthStreaming returns 401 when unauthorized', async () => {
    stubRequestContext();
    const handler = jest.fn(async () => new Response('ok', { status: 200 }));
  const local = createApiMiddleware({
    createRequestLogger: () => ({ requestId: 'rid-test', method: 'GET', url: 'http://localhost/test', userAgent: 'jest' }) as any,
    validateApiAuth: async () => ({ isValid: false, error: 'no-auth' }),
  });
  const wrapped = local.withAuthStreaming(handler);
    const req = new NextRequest('http://localhost:4000/str', { method: 'GET', headers: { 'x-request-id': 'rid-str', 'user-agent': 'jest', host: 'localhost:4000' } });
    const res = await wrapped(req as any, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it('withValidation returns 400 on invalid JSON', async () => {
    stubRequestContext();
    const schema = z.object({ a: z.string() });
    const wrapped = mw.withValidation(schema, async () => NextResponse.json({ success: true, data: { ok: true }, meta: { timestamp: new Date().toISOString() } }));
    const req = new NextRequest('http://localhost:4000/val', { method: 'POST', headers: { 'content-type': 'application/json', 'x-request-id': 'rid-iv', 'user-agent': 'jest', host: 'localhost:4000' } });
    (req as any).json = jest.fn(async () => { throw new Error('bad'); });
    const res = await wrapped(req as any, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(400);
  });

  it('withValidation returns 400 on schema validation failure', async () => {
    stubRequestContext();
    const schema = z.object({ a: z.string().min(2) });
    const wrapped = mw.withValidation(schema, async () => NextResponse.json({ success: true, data: { ok: true }, meta: { timestamp: new Date().toISOString() } }));
    const req = new NextRequest('http://localhost:4000/val', { method: 'POST', headers: { 'content-type': 'application/json', 'x-request-id': 'rid-vf', 'user-agent': 'jest', host: 'localhost:4000' } });
    (req as any).json = jest.fn(async () => ({ a: '' }));
    const res = await wrapped(req as any, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(400);
  });

  it('errorHandlers maps DB constraint errors to 400', async () => {
    const ctx: any = { requestId: 'rid-db' };
    const unique = errorHandlers.handleDatabaseError(new Error('UNIQUE constraint failed: items.id'), 'create', ctx) as any;
    expect(unique.status).toBe(400);
    const foreign = errorHandlers.handleDatabaseError(new Error('FOREIGN KEY constraint failed'), 'link', ctx) as any;
    expect(foreign.status).toBe(400);
    const generic = errorHandlers.handleDatabaseError(new Error('other'), 'op', ctx) as any;
    expect(generic.status).toBe(500);
  });

it('withAuthAndRateLimitStreaming returns 429 on concurrency limit', async () => {
  stubRequestContext();
  const originalEnv = process.env.NODE_ENV;
  const originalConc = process.env.CHAT_MAX_CONCURRENCY;
  setNodeEnv('production');
  process.env.CHAT_MAX_CONCURRENCY = '1';
  apiMwModule.__setApiMiddlewareDepsForTests?.({
    validateApiAuth: async () => ({ isValid: true }),
    getRateLimiter: () => ({ checkRateLimit: async () => ({ allowed: true }) })
  });

  // Create a handler that holds the response open to simulate concurrent request
  let resolveHandler: ((value: Response) => void) | null = null;
  const handler = jest.fn(async () => {
    return new Promise<Response>((resolve) => {
      resolveHandler = resolve;
      // Don't resolve immediately - keep the request "in-flight"
      setTimeout(() => resolve(new Response('ok', { status: 200 })), 100);
    });
  });

  const wrappedStream = apiMwModule.withAuthAndRateLimitStreaming(handler, { maxConcurrent: 1 });
  process.env.RATE_LIMIT_DISABLED = 'false';

  // First request: should succeed and be "in-flight"
  const req1 = new NextRequest('http://localhost:4000/stream', { method: 'GET', headers: { 'user-agent': 'jest', host: 'localhost:4000', 'x-forwarded-for': '1.1.1.1' } });
  const firstPromise = wrappedStream(req1 as any, { params: Promise.resolve({}) } as any);

  // Give first request a moment to increment the counter
  await new Promise(resolve => setTimeout(resolve, 10));

  // Second request: should fail with 429 since we're at max concurrency
  const req2 = new NextRequest('http://localhost:4000/stream', { method: 'GET', headers: { 'user-agent': 'jest', host: 'localhost:4000', 'x-forwarded-for': '1.1.1.1' } });
  const res = await wrappedStream(req2 as any, { params: Promise.resolve({}) } as any);
  expect(res.status).toBe(429);

  // Wait for first request to complete
  const res1 = await firstPromise;
  expect(res1.status).toBe(200);

  setNodeEnv(originalEnv);
  if (originalConc === undefined) {
    delete process.env.CHAT_MAX_CONCURRENCY;
  } else {
    process.env.CHAT_MAX_CONCURRENCY = originalConc;
  }
});

it('does not rebuild overrides when test-only setter is invoked outside test env', () => {
  const originalEnv = process.env.NODE_ENV;
  setNodeEnv('production');

  jest.resetModules();
  jest.isolateModules(() => {
    const factorySpy = jest.fn(() => ({
      withApiMiddleware: jest.fn((h) => h),
      withAuth: jest.fn((h) => h),
      withValidation: jest.fn(() => jest.fn()),
      withValidationAndParams: jest.fn(() => jest.fn()),
      withRateLimitUnauthenticated: jest.fn((h) => h),
      withAuthAndRateLimit: jest.fn((h) => h),
      withAuthStreaming: jest.fn((h) => h),
      withAuthAndRateLimitStreaming: jest.fn((h) => h),
    }));

    jest.doMock('@/lib/api/middleware/factory', () => ({
      createApiMiddleware: factorySpy,
    }));

    const apiMiddlewareModule = require('@/lib/api/api-middleware');
    expect(factorySpy).toHaveBeenCalledTimes(1);
    apiMiddlewareModule.__setCreateRequestLoggerForTests(() => ({ requestId: 'noop' }));
    expect(factorySpy).toHaveBeenCalledTimes(1);
  });

  setNodeEnv(originalEnv);
});

it('rebuilds overrides with supplied dependencies in test env', () => {
  const originalEnv = process.env.NODE_ENV;
  setNodeEnv('test');

  jest.resetModules();
  jest.isolateModules(() => {
    const factorySpy = jest.fn(() => ({
      withApiMiddleware: jest.fn((h) => h),
      withAuth: jest.fn((h) => h),
      withValidation: jest.fn(() => jest.fn()),
      withValidationAndParams: jest.fn(() => jest.fn()),
      withRateLimitUnauthenticated: jest.fn((h) => h),
      withAuthAndRateLimit: jest.fn((h) => h),
      withAuthStreaming: jest.fn((h) => h),
      withAuthAndRateLimitStreaming: jest.fn((h) => h),
    }));

    jest.doMock('@/lib/api/middleware/factory', () => ({
      createApiMiddleware: factorySpy,
    }));

    const apiMiddlewareModule = require('@/lib/api/api-middleware');
    expect(factorySpy).toHaveBeenCalledTimes(1);

    const validateApiAuth = jest.fn(async () => ({ isValid: true }));
    const getRateLimiter = jest.fn(() => ({ checkRateLimit: jest.fn(async () => ({ allowed: true })) }));
    const getSingleUserInfo = jest.fn(() => ({
      userId: 'tester',
      email: 'tester@example.test',
      name: 'Test User',
      currentDevice: 'Computer',
    }));

    apiMiddlewareModule.__setApiMiddlewareDepsForTests({ validateApiAuth, getRateLimiter, getSingleUserInfo });

    expect(factorySpy).toHaveBeenCalledTimes(2);
    expect(factorySpy.mock.calls[1]).toBeDefined();
    const [overrides] = factorySpy.mock.calls[1] as unknown as [ApiMiddlewareDeps];
    expect(overrides.validateApiAuth).toBe(validateApiAuth);
    expect(overrides.getRateLimiter).toBe(getRateLimiter);
    expect(overrides.getSingleUserInfo).toBe(getSingleUserInfo);
  });

  setNodeEnv(originalEnv);
});
});

