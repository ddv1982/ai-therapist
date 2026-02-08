import { NextRequest } from 'next/server';

const mockVerifySessionOwnership = jest.fn();
const mockConvexMutation = jest.fn();

jest.mock('@/lib/repositories/session-repository', () => ({
  verifySessionOwnership: (...args: unknown[]) => mockVerifySessionOwnership(...args),
}));

jest.mock('@/lib/convex/http-client', () => ({
  getAuthenticatedConvexClient: () => ({
    mutation: (...args: unknown[]) => mockConvexMutation(...args),
  }),
  anyApi: {
    sessions: {
      update: 'sessions.update',
    },
    users: {
      setCurrentSession: 'users.setCurrentSession',
    },
  },
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
            requestId: 'rid-resume-1',
            principal: { clerkId: 'clerk_test_user' },
            jwtToken: 'jwt_token',
          },
          routeParams?.params ?? Promise.resolve({})
        ),
  };
});

describe('POST /api/sessions/[sessionId]/resume', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resumes a completed session via explicit lifecycle command', async () => {
    mockVerifySessionOwnership.mockResolvedValueOnce({
      valid: true,
      session: {
        _id: 'session_1',
        status: 'completed',
      },
    });

    mockConvexMutation
      .mockResolvedValueOnce({
        _id: 'session_1',
        title: 'Session title',
        status: 'active',
        startedAt: Date.now() - 2000,
        updatedAt: Date.now(),
        endedAt: null,
        messageCount: 9,
      })
      .mockResolvedValueOnce({ ok: true });

    const mod = await import('@/app/api/sessions/[sessionId]/resume/route');
    const response = await mod.POST(
      {
        method: 'POST',
        url: 'http://localhost:4000/api/sessions/session_1/resume',
        headers: new Headers(),
      } as any,
      { params: Promise.resolve({ sessionId: 'session_1' }) } as any
    );

    expect(response.status).toBe(200);
    expect(mockConvexMutation).toHaveBeenNthCalledWith(1, 'sessions.update', {
      sessionId: 'session_1',
      status: 'active',
      endedAt: null,
    });
    expect(mockConvexMutation).toHaveBeenNthCalledWith(2, 'users.setCurrentSession', {
      sessionId: 'session_1',
    });
  });
});
