import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  createDatabaseErrorResponse,
  createAuthenticationErrorResponse,
  createNotFoundErrorResponse,
  createForbiddenErrorResponse,
  createRateLimitErrorResponse,
  createServerErrorResponse,
  createPaginatedResponse,
  getApiData,
  validateApiResponse,
  isSuccessResponse,
  isErrorResponse,
  addTherapeuticHeaders,
  createSessionResponse,
  createChatCompletionResponse,
} from '@/lib/api/api-response';

// Ensure the global NextResponse mock returns a compatible object
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => {
      const headerMap = new Map(Object.entries((init && init.headers) || {}));
      const headers = {
        _map: headerMap,
        get: (k: string) => headerMap.get(k),
        set: (k: string, v: string) => headerMap.set(k, String(v)),
      } as any;
      const body = JSON.stringify(data);
      return {
        status: (init && init.status) || 200,
        headers,
        body,
        json: async () => data,
        text: async () => body,
        cookies: { set: jest.fn(), delete: jest.fn() },
      } as any;
    },
  },
}));

describe('api-response helpers (with NextResponse mock from setup)', () => {
  it('createSuccessResponse adds requestId to meta and header', async () => {
    const res = createSuccessResponse({ ok: true }, { requestId: 'rid-1' }) as any;
    expect(res.headers.get('X-Request-Id')).toBe('rid-1');
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.meta.requestId).toBe('rid-1');
  });

  it('createErrorResponse includes error details and status', async () => {
    const res = createErrorResponse('Bad', 418, { requestId: 'tea' }) as any;
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.message).toBe('Bad');
    expect(json.meta.requestId).toBe('tea');
  });

  it('shortcut error creators set proper codes', async () => {
    const v = await (createValidationErrorResponse('bad') as any).json();
    expect(v.error.code).toBe('VALIDATION_ERROR');
    const d = await (createDatabaseErrorResponse('write') as any).json();
    expect(d.error.code).toBe('DATABASE_ERROR');
    const a = await (createAuthenticationErrorResponse('auth') as any).json();
    expect(a.error.code).toBe('AUTHENTICATION_ERROR');
    const n = await (createNotFoundErrorResponse('Thing') as any).json();
    expect(n.error.code).toBe('NOT_FOUND');
    const f = await (createForbiddenErrorResponse('no') as any).json();
    expect(f.error.code).toBe('FORBIDDEN');
    const r = await (createRateLimitErrorResponse('rid') as any).json();
    expect(r.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('createServerErrorResponse masks details in production', async () => {
    const prev = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production' });
    const res = createServerErrorResponse(new Error('hidden'), 'rid-x') as any;
    const json = await res.json();
    expect(json.error.details).toBeUndefined();
    Object.defineProperty(process.env, 'NODE_ENV', { value: prev });
  });

  it('createPaginatedResponse computes pagination and includes request id', async () => {
    const res = createPaginatedResponse([1, 2, 3], 2, 3, 10, 'rid-page') as any;
    const json = await res.json();
    expect(json.data.pagination).toMatchObject({ page: 2, limit: 3, total: 10, totalPages: 4, hasNext: true, hasPrev: true });
    expect(json.meta.requestId).toBe('rid-page');
  });

  it('getApiData returns data or throws on error', () => {
    expect(getApiData({ success: true, data: { a: 1 } } as any)).toEqual({ a: 1 });
    expect(() => getApiData({ success: false, error: { message: 'm' } } as any)).toThrow('m');
  });

  it('validateApiResponse validates shapes', () => {
    const ok = validateApiResponse({ success: true, data: { x: 1 }, meta: { timestamp: new Date().toISOString() } });
    expect(ok.valid).toBe(true);
    const bad = validateApiResponse({});
    expect(bad.valid).toBe(false);
    expect(typeof bad.error).toBe('string');
  });

  it('isSuccessResponse and isErrorResponse work correctly', () => {
    expect(isSuccessResponse({ success: true })).toBe(true);
    expect(isErrorResponse({ success: false })).toBe(true);
    expect(isSuccessResponse({} as any)).toBe(false);
    expect(isErrorResponse(null as any)).toBe(false);
  });

  it('addTherapeuticHeaders adds secure headers', async () => {
    const { NextResponse } = jest.requireMock('next/server');
    const base = NextResponse.json({ success: true });
    const res = addTherapeuticHeaders(base as any) as any;
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('X-Therapeutic-Context')).toBe('enabled');
  });

  it('createSessionResponse and createChatCompletionResponse include request id header', async () => {
    const session = await (createSessionResponse({ sessionId: 's1', status: 'active', messageCount: 0 } as any, 'rid-sess') as any);
    expect(session.headers.get('X-Request-Id')).toBe('rid-sess');
    const chat = await (createChatCompletionResponse({ messageId: 'm1', content: 'hi', model: 'gpt' } as any, 'rid-chat') as any);
    expect(chat.headers.get('X-Request-Id')).toBe('rid-chat');
  });
});


