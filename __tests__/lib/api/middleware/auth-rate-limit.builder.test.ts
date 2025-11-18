import { NextRequest } from 'next/server';
import { setEnv, resetTestEnv } from '../../../test-utils/env';
const {
  createAuthenticationErrorResponse: actualCreateAuthenticationErrorResponse,
  createSuccessResponse,
} = jest.requireActual<typeof import('@/lib/api/api-response')>('@/lib/api/api-response');

jest.mock('@/lib/api/middleware/request-utils', () => ({
  setResponseHeaders: jest.fn(),
}));

const { setResponseHeaders } = jest.requireMock('@/lib/api/middleware/request-utils') as {
  setResponseHeaders: jest.Mock;
};

type BuilderFactory =
  typeof import('@/lib/api/middleware/builders/auth-rate-limit').buildAuthAndRateLimit;
type AuthBuilderDeps = Parameters<BuilderFactory>[0];

function makeDeps(overrides: Partial<AuthBuilderDeps> = {}) {
  const baseLogger = { requestId: 'rid-base', method: 'GET', url: '/path', userAgent: 'jest' };
  const validateApiAuth = jest.fn(async () => ({ isValid: true }));
  const getRateLimiter = jest.fn(() => ({
    checkRateLimit: jest.fn(async () => ({ allowed: true })),
  }));
  const getClientIPFromRequest = jest.fn(() => '203.0.113.10');
  const recordEndpointError = jest.fn();
  const recordEndpointSuccess = jest.fn();
  const getSingleUserInfo = jest.fn(() => ({
    userId: 'user-123',
    email: 'user@example.com',
    name: 'Test User',
    currentDevice: 'web',
  }));
  const createAuthenticationErrorResponse = jest.fn((message: string, requestId: string) =>
    actualCreateAuthenticationErrorResponse(message, requestId)
  );

  return {
    toRequestContext: jest.fn(() => ({ ...baseLogger })),
    createRequestLogger: jest.fn(() => ({ ...baseLogger })),
    validateApiAuth,
    getClientIPFromRequest,
    getRateLimiter,
    getSingleUserInfo,
    recordEndpointError,
    recordEndpointSuccess,
    createAuthenticationErrorResponse,
    ...overrides,
  } satisfies AuthBuilderDeps;
}

function loadBuilder(): BuilderFactory {
  let factory: BuilderFactory | undefined;
  jest.isolateModules(() => {
    const mod = jest.requireActual<typeof import('@/lib/api/middleware/builders/auth-rate-limit')>(
      '@/lib/api/middleware/builders/auth-rate-limit'
    );
    factory = mod.buildAuthAndRateLimit;
  });
  return factory!;
}

function makeRequest(url = 'http://localhost/api', method: string = 'GET') {
  return new NextRequest(url, {
    method,
    headers: {
      host: 'localhost:4000',
      'user-agent': 'jest',
      'x-request-id': 'rid-test',
    },
  });
}

describe('auth rate limit builder', () => {
  afterEach(() => {
    resetTestEnv();
    setResponseHeaders.mockClear();
  });

  it('records success when rate limiting is disabled', async () => {
    setEnv('RATE_LIMIT_DISABLED', 'true');
    setEnv('NODE_ENV', 'development');

    const buildAuth = loadBuilder();
    const deps = makeDeps();
    const { withAuthAndRateLimit } = buildAuth(deps);
    let handlerInvocations = 0;
    const handler = async () => {
      handlerInvocations += 1;
      return createSuccessResponse({ ok: true });
    };

    const res = await withAuthAndRateLimit(handler as any)(makeRequest(), {
      params: Promise.resolve({}),
    } as any);

    expect(res.status).toBe(200);
    expect(handlerInvocations).toBe(1);
    expect(deps.recordEndpointSuccess).not.toHaveBeenCalled();
    expect(deps.recordEndpointError).not.toHaveBeenCalled();
  });

  it('returns 401 when authentication fails', async () => {
    setEnv('RATE_LIMIT_DISABLED', 'false');
    setEnv('NODE_ENV', 'test');

    const deps = makeDeps({
      validateApiAuth: jest.fn(async () => ({ isValid: false, error: 'bad-token' })),
    });
    const buildAuth = loadBuilder();
    const { withAuthAndRateLimit } = buildAuth(deps);
    const handler = jest.fn();

    const res = await withAuthAndRateLimit(handler as any)(makeRequest(), {
      params: Promise.resolve({}),
    } as any);

    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
    expect(deps.recordEndpointError).not.toHaveBeenCalled();
    expect(deps.recordEndpointSuccess).not.toHaveBeenCalled();
  });

  it('falls back to window-based Retry-After and records error when limiter denies without retryAfter', async () => {
    setEnv('RATE_LIMIT_DISABLED', 'false');
    setEnv('NODE_ENV', 'test');

    const limitedDeps = makeDeps({
      getRateLimiter: jest.fn(() => ({
        checkRateLimit: jest.fn(async () => ({ allowed: false })),
      })),
    });

    const buildAuth = loadBuilder();
    const { withAuthAndRateLimit } = buildAuth(limitedDeps);
    let handlerInvocations = 0;
    const handler = async () => {
      handlerInvocations += 1;
      return createSuccessResponse({ ok: true });
    };

    const res = await withAuthAndRateLimit(handler as any)(makeRequest(), {
      params: Promise.resolve({}),
    } as any);

    expect(handlerInvocations).toBe(0);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('300');
    expect(setResponseHeaders).toHaveBeenCalled();
    expect(limitedDeps.recordEndpointError).not.toHaveBeenCalled();
  });

  it('handles streaming failures by decrementing counters and recording errors', async () => {
    setEnv('RATE_LIMIT_DISABLED', 'false');
    setEnv('NODE_ENV', 'test');
    setEnv('CHAT_MAX_CONCURRENCY', '1');

    const deps = makeDeps();
    const buildAuth = loadBuilder();
    const { withAuthAndRateLimitStreaming } = buildAuth(deps);

    const failingHandler = async () => {
      throw new Error('stream fail');
    };
    const streaming = withAuthAndRateLimitStreaming(failingHandler as any, {
      maxConcurrent: 1,
      maxRequests: 2,
      windowMs: 5000,
    });
    const req = makeRequest('http://localhost/api/stream', 'GET');

    const failure = await streaming(req, { params: Promise.resolve({}) } as any);
    expect(failure.status).toBe(500);
    expect(deps.recordEndpointError).toHaveBeenCalledWith('GET', '/path');

    let successInvocations = 0;
    const succeedingHandler = async () => {
      successInvocations += 1;
      return createSuccessResponse({ ok: true });
    };
    const streamingSuccess = withAuthAndRateLimitStreaming(succeedingHandler as any, {
      maxConcurrent: 1,
      maxRequests: 2,
      windowMs: 5000,
    });
    const success = await streamingSuccess(req, { params: Promise.resolve({}) } as any);

    expect(success.status).toBe(200);
    expect(successInvocations).toBe(1);
    expect(deps.recordEndpointSuccess).toHaveBeenCalledWith('GET', '/path');
  });

  it('streaming limiter returns 429 when global rate limit disallows request', async () => {
    setEnv('RATE_LIMIT_DISABLED', 'false');
    setEnv('NODE_ENV', 'test');

    const deps = makeDeps({
      getRateLimiter: jest.fn(() => ({
        checkRateLimit: jest.fn(async (_ip: string, bucket?: string) =>
          bucket === 'chat' ? { allowed: false, retryAfter: 9 } : { allowed: true }
        ),
      })),
    });

    const buildAuth = loadBuilder();
    const { withAuthAndRateLimitStreaming } = buildAuth(deps);
    const handler = jest.fn(async () => new Response('ok', { status: 200 }));
    const streaming = withAuthAndRateLimitStreaming(handler as any, {
      maxConcurrent: 2,
      maxRequests: 5,
      windowMs: 10000,
    });
    const req = makeRequest('http://localhost/api/stream', 'GET');

    const res = await streaming(req, { params: Promise.resolve({}) } as any);

    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('9');
    expect(handler).not.toHaveBeenCalled();
    expect(deps.recordEndpointError).toHaveBeenCalledWith('GET', '/path');
  });
});
