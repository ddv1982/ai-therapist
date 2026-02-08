import { NextRequest } from 'next/server';

jest.mock('@/lib/api/api-middleware', () => ({
  withAuthAndRateLimitStreaming:
    (handler: any) =>
    async (req: NextRequest, routeParams?: { params?: Promise<Record<string, string>> }) =>
      handler(
        req,
        {
          requestId: 'rid-chat-1',
          principal: { clerkId: 'clerk_test_user' },
          jwtToken: 'jwt_token',
        },
        routeParams?.params ?? Promise.resolve({})
      ),
}));

jest.mock('@/lib/convex/http-client', () => ({
  getAuthenticatedConvexClient: jest.fn(() => ({ query: jest.fn(), mutation: jest.fn() })),
  anyApi: {
    messages: { listBySession: 'messages.listBySession' },
  },
}));

describe('POST /api/chat error envelope', () => {
  it('returns standardized ApiResponse when content-type is invalid', async () => {
    const mod = await import('@/app/api/chat/route');
    const req = {
      method: 'POST',
      url: 'http://localhost:4000/api/chat',
      headers: new Headers({}),
    } as any as NextRequest;

    const res = await mod.POST(req, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(415);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_INPUT');
    expect(body.error.message).toBe('Content-Type must be application/json');
    expect(body.meta.requestId).toBe('rid-chat-1');
    expect(body.meta.timestamp).toBeTruthy();
  });
});
