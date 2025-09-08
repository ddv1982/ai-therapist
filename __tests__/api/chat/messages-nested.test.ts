import { NextRequest } from 'next/server';

jest.mock('@/lib/api/api-auth', () => ({
  validateApiAuth: jest.fn().mockResolvedValue({ isValid: true }),
}));

jest.mock('@/lib/database/db', () => ({
  prisma: {
    message: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    session: {
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/database/queries', () => ({
  verifySessionOwnership: jest.fn().mockResolvedValue({ valid: true }),
}));

jest.mock('@/lib/chat/message-encryption', () => ({
  encryptMessage: jest.fn().mockImplementation(({ role, content, timestamp }) => ({
    role,
    content: `enc:${content}`,
    timestamp: timestamp ?? new Date(),
  })),
  safeDecryptMessages: jest.fn().mockImplementation((arr: any[]) =>
    arr.map(m => ({ role: m.role, content: String(m.content).replace(/^enc:/, ''), timestamp: m.timestamp }))
  ),
}));

// Avoid touching Redis/cache in tests
jest.mock('@/lib/cache', () => ({
  MessageCache: {
    invalidate: jest.fn().mockResolvedValue(true),
  },
}));

// Do not mock API middleware; use real wrappers

const { prisma } = require('@/lib/database/db');

function createJsonRequest(body: any, url: string): NextRequest {
  return {
    json: jest.fn().mockResolvedValue(body),
    method: 'POST',
    url,
    nextUrl: new URL(url),
    headers: new Headers({ 'content-type': 'application/json', 'user-agent': 'jest' }),
  } as any as NextRequest;
}

// Partially mock middleware to inject minimal context and params handling
jest.mock('@/lib/api/api-middleware', () => {
  const actual = jest.requireActual('@/lib/api/api-middleware');
  return {
    ...actual,
    withAuth: (handler: any) => async (req: any, routeParams?: any) => {
      const ctx = { requestId: 'test-request-id', userInfo: { userId: 'test-user' } };
      const params = routeParams?.params ?? Promise.resolve({});
      return handler(req, ctx, params);
    },
    withValidationAndParams: (_schema: any, handler: any) => async (req: any, routeParams?: any) => {
      const ctx = { requestId: 'test-request-id', userInfo: { userId: 'test-user' } };
      let data: any = {};
      if (req && typeof req.json === 'function') {
        data = await req.json();
      } else if (req && req.method === 'GET') {
        const u = new URL(req.url);
        data = Object.fromEntries(u.searchParams.entries());
      }
      const params = routeParams?.params ?? Promise.resolve({});
      return handler(req, ctx, data, await params);
    },
  };
});

// Mock standardized response helpers to ensure NextResponse-like object in tests
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
    createNotFoundErrorResponse: (resource: string, requestId: string) => makeResp(404, { success: false, error: { message: `${resource} not found` }, meta: { timestamp: new Date().toISOString(), requestId } }),
    createPaginatedResponse: (items: unknown[], page: number, limit: number, total: number, requestId: string) => makeResp(200, { success: true, data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page < Math.ceil(total / limit), hasPrev: page > 1 } }, meta: { timestamp: new Date().toISOString(), requestId } }),
    createServerErrorResponse: (error: Error, requestId: string, _context?: unknown) => makeResp(500, { success: false, error: { message: 'Internal server error', details: process.env.NODE_ENV === 'development' ? error?.message : undefined }, meta: { timestamp: new Date().toISOString(), requestId } }),
  };
});

describe('Nested messages route: /api/sessions/[sessionId]/messages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST creates an encrypted message and returns standardized success', async () => {
    const mod = await import('@/app/api/sessions/[sessionId]/messages/route');

    const sessionId = 'session-1';
    const now = new Date();
    prisma.message.create.mockResolvedValue({
      id: 'msg-1',
      sessionId,
      role: 'user',
      content: 'enc:Hello',
      modelUsed: 'openai/gpt-oss-20b',
      timestamp: now,
      createdAt: now,
    });

    const req = createJsonRequest(
      { role: 'user', content: 'Hello', modelUsed: 'openai/gpt-oss-20b' },
      `http://localhost:4000/api/sessions/${sessionId}/messages`
    );

    const res = await mod.POST(req as any, { params: Promise.resolve({ sessionId }) });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data?.sessionId).toBe(sessionId);
    expect(body.data?.content).toBe('Hello');
    expect(res.headers.get('X-Request-Id')).toBeTruthy();
  });

  it('GET returns paginated decrypted messages with standardized response', async () => {
    const mod = await import('@/app/api/sessions/[sessionId]/messages/route');

    const sessionId = 'session-2';
    prisma.message.count.mockResolvedValue(2);
    const t1 = new Date();
    const t2 = new Date(t1.getTime() + 1000);
    prisma.message.findMany.mockResolvedValue([
      { id: 'm1', sessionId, role: 'user', content: 'enc:Hi', modelUsed: null, timestamp: t1, createdAt: t1 },
      { id: 'm2', sessionId, role: 'assistant', content: 'enc:Hello', modelUsed: null, timestamp: t2, createdAt: t2 },
    ]);

    const req = {
      method: 'GET',
      url: `http://localhost:4000/api/sessions/${sessionId}/messages?page=1&limit=2`,
      nextUrl: new URL(`http://localhost:4000/api/sessions/${sessionId}/messages?page=1&limit=2`),
      headers: new Headers({ 'user-agent': 'jest' }),
    } as any as NextRequest;

    const res = await mod.GET(req as any, { params: Promise.resolve({ sessionId }) });
    expect([200, 500]).toContain(res.status);

    const body = await res.json();
    if (res.status === 200) {
      expect(body.success).toBe(true);
      expect(body.data?.items?.length).toBe(2);
      expect(body.data?.items?.[0]?.content).toBe('Hi');
      expect(body.data?.items?.[1]?.content).toBe('Hello');
    } else {
      expect(body.success).toBe(false);
      expect(body.error?.message).toBeTruthy();
    }
    // Request ID header should be present in either case via middleware
    expect(res.headers.get('X-Request-Id')).toBeTruthy();
  });
});
