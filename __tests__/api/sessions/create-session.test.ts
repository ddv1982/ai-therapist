import { NextRequest } from 'next/server';

const mockGetTrustedClerkProfile = jest.fn();
const mockConvexQuery = jest.fn();
const mockConvexMutation = jest.fn();
const mockDeduplicateRequest = jest.fn();
const mockSessionCacheSet = jest.fn();

jest.mock('@/lib/auth/clerk-profile', () => ({
  getTrustedClerkProfile: (...args: unknown[]) => mockGetTrustedClerkProfile(...args),
}));

jest.mock('@/lib/cache', () => ({
  SessionCache: {
    set: (...args: unknown[]) => mockSessionCacheSet(...args),
  },
}));

jest.mock('@/lib/utils/helpers', () => ({
  deduplicateRequest: (...args: unknown[]) => mockDeduplicateRequest(...args),
}));

jest.mock('@/lib/convex/http-client', () => ({
  getAuthenticatedConvexClient: () => ({
    query: (...args: unknown[]) => mockConvexQuery(...args),
    mutation: (...args: unknown[]) => mockConvexMutation(...args),
  }),
  anyApi: {
    users: {
      getByClerkId: 'users.getByClerkId',
      ensureByClerkId: 'users.ensureByClerkId',
    },
    sessions: {
      create: 'sessions.create',
    },
  },
}));

jest.mock('@/lib/api/api-middleware', () => {
  const actual = jest.requireActual('@/lib/api/api-middleware');
  return {
    ...actual,
    withValidation: (_schema: unknown, handler: any) => async (req: any, routeParams?: any) => {
      const body = typeof req?.json === 'function' ? await req.json() : {};
      const ctx = {
        requestId: 'test-request-id',
        principal: { clerkId: 'clerk_test_user' },
        jwtToken: 'mock_jwt_token',
      };
      return handler(req, ctx, body, routeParams?.params);
    },
  };
});

function createPostReq(body: Record<string, unknown>): NextRequest {
  return {
    method: 'POST',
    url: 'http://localhost:4000/api/sessions',
    nextUrl: new URL('http://localhost:4000/api/sessions'),
    headers: new Headers({ 'content-type': 'application/json', 'user-agent': 'jest' }),
    json: jest.fn().mockResolvedValue(body),
  } as any as NextRequest;
}

describe('POST /api/sessions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeduplicateRequest.mockImplementation(
      async (_userId: string, _operation: string, action: () => Promise<unknown>) => action()
    );
    mockSessionCacheSet.mockResolvedValue(true);
  });

  it('creates a session for an existing user without requiring Clerk profile lookup', async () => {
    mockConvexQuery.mockResolvedValueOnce({
      _id: 'user_existing',
      clerkId: 'clerk_test_user',
      email: 'existing@test.com',
      name: 'Existing',
    });
    mockConvexMutation.mockResolvedValueOnce({
      _id: 'session_1',
      userId: 'user_existing',
      title: 'Session title',
      status: 'active',
      startedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      endedAt: null,
      messageCount: 0,
    });

    const mod = await import('@/app/api/sessions/route');
    const res = await mod.POST(
      createPostReq({ title: 'Session title' }) as any,
      {
        params: Promise.resolve({}),
      } as any
    );

    expect(res.status).toBe(200);
    expect(mockGetTrustedClerkProfile).not.toHaveBeenCalled();
    expect(mockConvexMutation).toHaveBeenCalledWith('sessions.create', {
      userId: 'user_existing',
      title: 'Session title',
    });
  });

  it('returns 503 when user does not exist and trusted Clerk profile cannot be resolved', async () => {
    mockConvexQuery.mockResolvedValueOnce(null);
    mockGetTrustedClerkProfile.mockResolvedValueOnce(null);

    const mod = await import('@/app/api/sessions/route');
    const res = await mod.POST(
      createPostReq({ title: 'Session title' }) as any,
      {
        params: Promise.resolve({}),
      } as any
    );

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(mockConvexMutation).not.toHaveBeenCalledWith('users.ensureByClerkId', expect.anything());
  });

  it('creates missing user from trusted Clerk profile before creating session', async () => {
    mockConvexQuery.mockResolvedValueOnce(null);
    mockGetTrustedClerkProfile.mockResolvedValueOnce({
      email: 'newuser@test.com',
      name: 'New User',
    });
    mockConvexMutation
      .mockResolvedValueOnce({
        _id: 'user_new',
        clerkId: 'clerk_test_user',
        email: 'newuser@test.com',
        name: 'New User',
      })
      .mockResolvedValueOnce({
        _id: 'session_2',
        userId: 'user_new',
        title: 'Session title',
        status: 'active',
        startedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        endedAt: null,
        messageCount: 0,
      });

    const mod = await import('@/app/api/sessions/route');
    const res = await mod.POST(
      createPostReq({ title: 'Session title' }) as any,
      {
        params: Promise.resolve({}),
      } as any
    );

    expect(res.status).toBe(200);
    expect(mockConvexMutation).toHaveBeenNthCalledWith(1, 'users.ensureByClerkId', {
      clerkId: 'clerk_test_user',
      email: 'newuser@test.com',
      name: 'New User',
    });
    expect(mockConvexMutation).toHaveBeenNthCalledWith(2, 'sessions.create', {
      userId: 'user_new',
      title: 'Session title',
    });
  });
});
