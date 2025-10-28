import { buildWithAuth, buildWithAuthStreaming } from '@/lib/api/middleware/builders/auth';
import { createSuccessResponse } from '@/lib/api/api-response';

jest.mock('@/lib/api/middleware/request-utils', () => {
  const actual = jest.requireActual<typeof import('@/lib/api/middleware/request-utils')>(
    '@/lib/api/middleware/request-utils'
  );
  return {
    ...actual,
    setResponseHeaders: jest.fn(),
  };
});

const { setResponseHeaders } = jest.requireMock('@/lib/api/middleware/request-utils') as {
  setResponseHeaders: jest.Mock;
};

describe('auth builder', () => {
  beforeEach(() => {
    setResponseHeaders.mockClear();
  });

  function createDeps(overrides: Partial<Parameters<typeof buildWithAuth>[0]> = {}) {
    const baseContext = {
      requestId: 'rid-test',
      method: 'GET',
      url: '/auth',
      userAgent: 'jest',
    };

    const withApiMiddleware = jest.fn((handler) => {
      return (request: Request, routeParams: { params: Promise<Record<string, string>> }) =>
        handler(request as any, baseContext as any, routeParams.params);
    });

    return {
      withApiMiddleware,
      validateApiAuth: jest.fn(async () => ({ isValid: true })),
      getSingleUserInfo: jest.fn(() => ({ userId: 'user-1', email: 'user@example.test', name: 'User', currentDevice: 'Computer' })),
      ...overrides,
    } satisfies Parameters<typeof buildWithAuth>[0];
  }

  it('returns 401 response when auth validation fails', async () => {
    const deps = createDeps({
      validateApiAuth: jest.fn(async () => ({ isValid: false, error: 'no-auth' })),
    });

    const withAuth = buildWithAuth(deps);
    const handler = jest.fn();
    const wrapped = withAuth(handler);
    const req = new Request('http://localhost/api');

    const res = await wrapped(req as any, { params: Promise.resolve({}) });

    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
    expect(setResponseHeaders).toHaveBeenCalledTimes(1);
    expect(deps.validateApiAuth).toHaveBeenCalled();
  });

  it('uses fallback user info when getSingleUserInfo throws and infers device type', async () => {
    const deps = createDeps({
      getSingleUserInfo: jest.fn(() => {
        throw new Error('session missing');
      }),
    });

    const withAuth = buildWithAuth(deps);
    const handler = jest.fn(async (_req, ctx) => {
      return createSuccessResponse({ ok: true, userInfo: ctx.userInfo });
    });
    const wrapped = withAuth(handler);

    const req = new Request('http://localhost/api', {
      headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)' },
    });

    const res = await wrapped(req as any, { params: Promise.resolve({}) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data?.userInfo).toEqual({
      userId: 'therapeutic-ai-user',
      email: 'user@therapeutic-ai.local',
      name: 'Therapeutic AI User',
      currentDevice: 'Mobile',
    });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(setResponseHeaders).toHaveBeenCalledTimes(1);
  });

  it('injects clerkId into userInfo when validateApiAuth returns userId', async () => {
    const deps = createDeps({
      validateApiAuth: jest.fn(async () => ({ isValid: true, userId: 'clerk_123' } as any)),
    });

    const withAuth = buildWithAuth(deps);
    const handler = jest.fn(async (_req, ctx) => {
      return createSuccessResponse({ userInfo: ctx.userInfo });
    });
    const wrapped = withAuth(handler);
    const req = new Request('http://localhost/api');

    const res = await wrapped(req as any, { params: Promise.resolve({}) });
    const body = await res.json();
    expect(body.data.userInfo.clerkId).toBe('clerk_123');
    expect(setResponseHeaders).toHaveBeenCalled();
  });

  it('fallback user info infers Computer device from user-agent', async () => {
    const deps = createDeps({
      getSingleUserInfo: jest.fn(() => { throw new Error('no session'); }),
    });
    const withAuth = buildWithAuth(deps);
    const handler = jest.fn(async (_req, ctx) => createSuccessResponse({ device: ctx.userInfo.currentDevice }));
    const wrapped = withAuth(handler);
    const req = new Request('http://localhost/api', {
      headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
    });
    const res = await wrapped(req as any, { params: Promise.resolve({}) });
    const body = await res.json();
    expect(body.data.device).toBe('Computer');
  });

  it('fallback user info infers Tablet device from user-agent', async () => {
    const deps = createDeps({
      getSingleUserInfo: jest.fn(() => { throw new Error('no session'); }),
    });
    const withAuth = buildWithAuth(deps);
    const handler = jest.fn(async (_req, ctx) => createSuccessResponse({ device: ctx.userInfo.currentDevice }));
    const wrapped = withAuth(handler);
    const req = new Request('http://localhost/api', {
      headers: { 'user-agent': 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)' },
    });
    const res = await wrapped(req as any, { params: Promise.resolve({}) });
    const body = await res.json();
    expect(body.data.device).toBe('Tablet');
  });

  describe('withAuthStreaming', () => {
    function createStreamingDeps(overrides: Partial<Parameters<typeof buildWithAuthStreaming>[0]> = {}) {
      return {
        validateApiAuth: jest.fn(async () => ({ isValid: true })),
        getSingleUserInfo: jest.fn(() => ({ userId: 'user-1', email: 'user@example.test', name: 'User', currentDevice: 'Computer' })),
        createRequestLogger: jest.fn(() => ({ requestId: 'rid-stream', method: 'GET', url: '/stream', userAgent: 'jest' })),
        ...overrides,
      } satisfies Parameters<typeof buildWithAuthStreaming>[0];
    }

    it('returns 401 response when auth fails', async () => {
      const deps = createStreamingDeps({
        validateApiAuth: jest.fn(async () => ({ isValid: false, error: 'invalid-token' })),
      });

      const wrapped = buildWithAuthStreaming(deps)(jest.fn());
      const req = new Request('http://localhost/api');

      const res = await wrapped(req as any, { params: Promise.resolve({}) });
      expect(res.status).toBe(401);
      expect(JSON.parse((res as any).body)).toEqual({ error: 'invalid-token' });
      expect(setResponseHeaders).toHaveBeenCalled();
    });

    it('returns 500 when handler throws and records headers', async () => {
      const deps = createStreamingDeps();
      const wrapped = buildWithAuthStreaming(deps)(async () => {
        throw new Error('stream failure');
      });
      const req = new Request('http://localhost/api/stream');

      const res = await wrapped(req as any, { params: Promise.resolve({}) });

      expect(res.status).toBe(500);
      const body = JSON.parse((res as any).body);
      expect(body.error).toBe('stream failure');
      expect(setResponseHeaders).toHaveBeenCalled();
    });

    it('passes through successful handler responses', async () => {
      const deps = createStreamingDeps();
      const wrapped = buildWithAuthStreaming(deps)(async (_req, ctx) => {
        return new Response(JSON.stringify({ ok: true, id: ctx.requestId }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });
      const req = new Request('http://localhost/api/stream');

      const res = await wrapped(req as any, { params: Promise.resolve({}) });

      expect(res.status).toBe(200);
      expect(JSON.parse((res as any).body)).toEqual({ ok: true, id: 'rid-stream' });
      expect(setResponseHeaders).toHaveBeenCalled();
    });

    it('uses fallback request context when createRequestLogger is not provided', async () => {
      const deps = createStreamingDeps({ createRequestLogger: undefined });
      const wrapped = buildWithAuthStreaming(deps)(async (_req, ctx) => {
        return new Response(JSON.stringify({ id: ctx.requestId, ua: ctx.userAgent }), { status: 200 });
      });
      const req: any = new Request('http://localhost/api/stream');
      req.requestId = 'rfallback';
      req.userAgent = 'jest-agent';

      const res = await wrapped(req as any, { params: Promise.resolve({}) });
      const body = JSON.parse((res as any).body);
      expect(body).toEqual({ id: 'rfallback', ua: 'jest-agent' });
    });
  });
});
