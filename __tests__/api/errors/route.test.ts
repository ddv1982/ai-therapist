import { NextRequest } from 'next/server';

function createReq(method: 'GET' | 'POST', body?: any): NextRequest {
  const headers = new Headers({
    'content-type': 'application/json',
    'user-agent': 'jest',
  });
  if (method === 'POST') {
    return {
      json: jest.fn().mockResolvedValue(body),
      method,
      url: 'http://localhost:4000/api/errors',
      nextUrl: new URL('http://localhost:4000/api/errors'),
      headers,
    } as any as NextRequest;
  }
  return {
    method,
    url: 'http://localhost:4000/api/errors',
    nextUrl: new URL('http://localhost:4000/api/errors'),
    headers,
  } as any as NextRequest;
}

// Partially mock API middleware to pass-through with a minimal context
jest.mock('@/lib/api/api-middleware', () => {
  const actual = jest.requireActual('@/lib/api/api-middleware');
  return {
    ...actual,
    withApiMiddleware: (handler: any) => async (req: any, routeParams?: any) => {
      const ctx = { requestId: 'test-request-id' };
      const params = routeParams?.params ?? Promise.resolve({});
      return handler(req, ctx, params);
    },
  };
});

// Mock standardized response helpers to simple test-friendly objects
jest.mock('@/lib/api/api-response', () => {
  function makeResp(status: number, payload: unknown) {
    const store = new Map();
    store.set('X-Request-Id', 'test-request-id');
    return {
      status,
      headers: {
        get: (k: string) => store.get(k),
        set: (k: string, v: unknown) => { store.set(k, v); },
      },
      json: async () => payload,
      text: async () => JSON.stringify(payload),
      cookies: { set: jest.fn(), delete: jest.fn() },
    };
  }
  return {
    createSuccessResponse: (data: unknown, meta?: Record<string, unknown>) => makeResp(200, { success: true, data, meta: { timestamp: new Date().toISOString(), ...(meta || {}) } }),
    createErrorResponse: (message: string, status = 400, options: { code?: string; details?: string; suggestedAction?: string; requestId?: string } = {}) => makeResp(status, { success: false, error: { message, code: options.code, details: options.details, suggestedAction: options.suggestedAction }, meta: { timestamp: new Date().toISOString(), requestId: options.requestId } }),
  };
});

describe('/api/errors standardized responses and headers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Use real middleware (no mocking)

  it('GET returns standardized ApiResponse and sets X-Request-Id', async () => {
    const mod = await import('@/app/api/errors/route');
    const res = await mod.GET(createReq('GET') as any, { params: Promise.resolve({}) });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.meta?.timestamp).toBeTruthy();
    expect(res.headers.get('X-Request-Id')).toBeTruthy();
  });

  it('POST returns standardized success and X-Request-Id', async () => {
    const mod = await import('@/app/api/errors/route');
    const res = await mod.POST(createReq('POST', { message: 'client error' }) as any, { params: Promise.resolve({}) });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data?.message).toBe('Error logged successfully');
    expect(res.headers.get('X-Request-Id')).toBeTruthy();
  });
});
