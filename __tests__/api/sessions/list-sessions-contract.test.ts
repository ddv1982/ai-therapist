import { NextRequest } from 'next/server';

const mockGetUserSessions = jest.fn();

jest.mock('@/lib/repositories/session-repository', () => ({
  getUserSessions: (...args: unknown[]) => mockGetUserSessions(...args),
}));

jest.mock('@/lib/convex/http-client', () => ({
  getAuthenticatedConvexClient: jest.fn(() => ({})),
  anyApi: {},
}));

jest.mock('@/lib/api/api-middleware', () => {
  const actual = jest.requireActual('@/lib/api/api-middleware');
  return {
    ...actual,
    withAuth:
      (handler: any) =>
      async (req: NextRequest, routeParams?: { params?: Promise<Record<string, string>> }) =>
        handler(
          req,
          {
            requestId: 'rid-sessions-1',
            principal: { clerkId: 'clerk_test_user' },
            jwtToken: 'jwt_token',
          },
          routeParams?.params ?? Promise.resolve({})
        ),
  };
});

function createGetReq(url: string): NextRequest {
  return {
    method: 'GET',
    url,
    nextUrl: new URL(url),
    headers: new Headers({ 'user-agent': 'jest' }),
  } as any as NextRequest;
}

describe('GET /api/sessions contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns cursor-paginated envelope with items and pagination fields', async () => {
    mockGetUserSessions.mockResolvedValueOnce({
      items: [
        {
          _id: 'session_1',
          userId: 'user_1',
          title: 'Session title',
          status: 'active',
          startedAt: 1000,
          updatedAt: 2000,
          endedAt: null,
          messageCount: 3,
        },
      ],
      pagination: {
        limit: 20,
        total: 42,
        hasMore: true,
        nextCursor: 'cursor_2',
      },
    });

    const mod = await import('@/app/api/sessions/route');
    const res = await mod.GET(
      createGetReq('http://localhost:4000/api/sessions?limit=20') as any,
      {
        params: Promise.resolve({}),
      } as any
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.items).toHaveLength(1);
    expect(body.data.items[0].id).toBe('session_1');
    expect(body.data.pagination).toEqual({
      limit: 20,
      total: 42,
      hasMore: true,
      nextCursor: 'cursor_2',
    });
  });

  it('returns standardized 400 envelope when offset is provided', async () => {
    const mod = await import('@/app/api/sessions/route');
    const res = await mod.GET(
      createGetReq('http://localhost:4000/api/sessions?offset=10') as any,
      {
        params: Promise.resolve({}),
      } as any
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_INPUT');
    expect(body.meta.requestId).toBe('rid-sessions-1');
    expect(body.meta.timestamp).toBeTruthy();
    expect(mockGetUserSessions).not.toHaveBeenCalled();
  });

  it('returns standardized 400 envelope when limit is invalid', async () => {
    const mod = await import('@/app/api/sessions/route');
    const res = await mod.GET(
      createGetReq('http://localhost:4000/api/sessions?limit=abc') as any,
      {
        params: Promise.resolve({}),
      } as any
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_INPUT');
    expect(body.error.message).toBe('Invalid limit query parameter');
    expect(body.meta.requestId).toBe('rid-sessions-1');
    expect(mockGetUserSessions).not.toHaveBeenCalled();
  });
});
