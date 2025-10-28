import { NextRequest } from 'next/server';

// Mock API middleware to inject auth context with Clerk ID and bypass rate limits
jest.mock('@/lib/api/api-middleware', () => {
  const actual = jest.requireActual('@/lib/api/api-middleware');
  const withApiMiddleware = (handler: any) => async (req: any, routeParams?: any) => {
    const ctx = { requestId: 'test-request-id' };
    const params = routeParams?.params ?? Promise.resolve({});
    return handler(req, ctx, params);
  };
  const withAuth = (handler: any) => async (req: any, routeParams?: any) => {
    const ctx = {
      requestId: 'test-request-id',
      userInfo: { userId: 'legacy-user', clerkId: 'clerk_test_user', email: 't@example.com', name: 'T' },
    };
    const params = routeParams?.params ?? Promise.resolve({});
    return handler(req, ctx, params);
  };
  return { ...actual, withApiMiddleware, withAuth };
});

// Mock Convex HTTP client and session repository utilities
jest.mock('@/lib/convex/http-client', () => {
  return {
    getConvexHttpClient: () => ({
      mutation: jest.fn().mockResolvedValue({ ok: true }),
    }),
    anyApi: { sessions: { remove: {} } },
  };
});

jest.mock('@/lib/repositories/session-repository', () => ({
  __esModule: true,
  verifySessionOwnership: jest.fn(),
  getSessionWithMessages: jest.fn(),
}));

function createDeleteReq(url: string): NextRequest {
  const headers = new Headers({ 'user-agent': 'jest' });
  return {
    method: 'DELETE',
    url,
    nextUrl: new URL(url),
    headers,
  } as any as NextRequest;
}

describe('DELETE /api/sessions/[sessionId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 when ownership is valid and deletion succeeds', async () => {
    const { verifySessionOwnership } = await import('@/lib/repositories/session-repository');
    (verifySessionOwnership as jest.Mock).mockResolvedValueOnce({ valid: true });
    
    const mod = await import('@/app/api/sessions/[sessionId]/route');
    const res = await mod.DELETE(createDeleteReq('http://localhost:4000/api/sessions/s_test') as any, {
      params: Promise.resolve({ sessionId: 's_test' }),
    } as any);
    
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body?.success).toBe(true);
  });

  it('returns 404 when ownership is invalid', async () => {
    const { verifySessionOwnership } = await import('@/lib/repositories/session-repository');
    (verifySessionOwnership as jest.Mock).mockResolvedValueOnce({ valid: false });
    
    const mod = await import('@/app/api/sessions/[sessionId]/route');
    const res = await mod.DELETE(createDeleteReq('http://localhost:4000/api/sessions/s_no') as any, {
      params: Promise.resolve({ sessionId: 's_no' }),
    } as any);
    
    expect(res.status).toBe(404);
  });
});
