import { NextRequest } from 'next/server';

const mockConvexQuery = jest.fn();
const mockConvexMutation = jest.fn();

jest.mock('@/lib/convex/http-client', () => ({
  getAuthenticatedConvexClient: () => ({
    query: (...args: unknown[]) => mockConvexQuery(...args),
    mutation: (...args: unknown[]) => mockConvexMutation(...args),
  }),
  anyApi: {
    users: {
      getByClerkId: 'users.getByClerkId',
      setCurrentSession: 'users.setCurrentSession',
    },
    sessions: {
      get: 'sessions.get',
      listByUser: 'sessions.listByUser',
    },
  },
}));

jest.mock('@/lib/api/api-middleware', () => {
  const actual = jest.requireActual('@/lib/api/api-middleware');
  return {
    ...actual,
    withAuth: (handler: any) => async (req: NextRequest, routeParams?: any) =>
      handler(
        req,
        {
          requestId: 'rid-current-1',
          principal: { clerkId: 'clerk_test_user' },
          jwtToken: 'jwt_token',
        },
        routeParams?.params ?? Promise.resolve({})
      ),
    withValidation:
      (_schema: unknown, handler: any) => async (req: NextRequest, routeParams?: any) => {
        const body = typeof req?.json === 'function' ? await req.json() : {};
        return handler(
          req,
          {
            requestId: 'rid-current-1',
            principal: { clerkId: 'clerk_test_user' },
            jwtToken: 'jwt_token',
          },
          body,
          routeParams?.params ?? Promise.resolve({})
        );
      },
  };
});

function createPostReq(body: Record<string, unknown>): NextRequest {
  return {
    method: 'POST',
    url: 'http://localhost:4000/api/sessions/current',
    headers: new Headers({ 'content-type': 'application/json' }),
    json: jest.fn().mockResolvedValue(body),
  } as any as NextRequest;
}

function createGetReq(): NextRequest {
  return {
    method: 'GET',
    url: 'http://localhost:4000/api/sessions/current',
    headers: new Headers(),
  } as any as NextRequest;
}

describe('POST /api/sessions/current', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates current session pointer without mutating session lifecycle status', async () => {
    mockConvexQuery
      .mockResolvedValueOnce({ _id: 'user_1', clerkId: 'clerk_test_user' })
      .mockResolvedValueOnce({
        _id: 'session_1',
        title: 'Session title',
        status: 'completed',
        startedAt: Date.now() - 1000,
        updatedAt: Date.now(),
        endedAt: Date.now(),
        messageCount: 4,
      });
    mockConvexMutation.mockResolvedValueOnce({ ok: true });

    const mod = await import('@/app/api/sessions/current/route');
    const response = await mod.POST(
      createPostReq({ sessionId: 'session_1' }) as any,
      {
        params: Promise.resolve({}),
      } as any
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.session).toEqual(
      expect.objectContaining({
        id: 'session_1',
        userId: 'clerk_test_user',
        title: 'Session title',
        status: 'completed',
      })
    );
    expect(body.data.session).not.toHaveProperty('_id');
    expect(body.data.session).toHaveProperty('_count.messages', 4);
    expect(mockConvexMutation).toHaveBeenCalledWith('users.setCurrentSession', {
      sessionId: 'session_1',
    });
    expect(mockConvexMutation).not.toHaveBeenCalledWith('sessions.update', expect.anything());
  });

  it('returns current session using documented Session shape', async () => {
    mockConvexQuery
      .mockResolvedValueOnce({
        _id: 'user_1',
        clerkId: 'clerk_test_user',
        currentSessionId: 'session_1',
      })
      .mockResolvedValueOnce({
        _id: 'session_1',
        title: 'Session title',
        status: 'active',
        startedAt: Date.now() - 2000,
        updatedAt: Date.now(),
        createdAt: Date.now() - 3000,
        endedAt: null,
        messageCount: 3,
      });

    const mod = await import('@/app/api/sessions/current/route');
    const response = await mod.GET(
      createGetReq() as any,
      {
        params: Promise.resolve({}),
      } as any
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.currentSession).toEqual(
      expect.objectContaining({
        id: 'session_1',
        userId: 'clerk_test_user',
        title: 'Session title',
        status: 'active',
      })
    );
    expect(body.data.currentSession).toHaveProperty('_count.messages', 3);
    expect(body.data.currentSession).not.toHaveProperty('messageCount');
  });
});
