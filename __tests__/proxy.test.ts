jest.mock('next/server', () => {
  class MockNextResponse extends Response {
    static json(data: unknown, init?: ResponseInit) {
      const headers = new Headers(init?.headers);
      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json');
      }
      return new MockNextResponse(JSON.stringify(data), { ...init, headers });
    }

    static next() {
      return new MockNextResponse(null, { status: 200 });
    }
  }

  return {
    __esModule: true,
    NextResponse: MockNextResponse,
  };
});

jest.mock('@clerk/nextjs/server', () => {
  const toRegex = (pattern: string) =>
    new RegExp(
      `^${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\(\\.\\\*\\\)/g, '.*')}$`
    );

  return {
    clerkMiddleware: (handler: unknown) => handler,
    createRouteMatcher: (patterns: string[]) => {
      const regexes = patterns.map(toRegex);
      return (req: { nextUrl?: { pathname?: string } }) => {
        const pathname = req?.nextUrl?.pathname ?? '';
        return regexes.some((regex) => regex.test(pathname));
      };
    },
  };
});

describe('proxy API auth contract', () => {
  it('returns standardized unauthorized envelope for protected API routes', async () => {
    const mod = await import('@/proxy');
    const req = {
      nextUrl: new URL('http://localhost:4000/api/sessions'),
      headers: new Headers({ 'x-request-id': 'rid-proxy-1' }),
      cookies: { get: jest.fn() },
    } as any;

    const auth = {
      protect: jest.fn(async () => new Response('unauthorized', { status: 401 })),
    };

    const res = (await mod.default(auth as any, req)) as Response;
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHENTICATED');
    expect(body.error.message).toBe('Authentication required');
    expect(body.meta.requestId).toBe('rid-proxy-1');
  });
});
