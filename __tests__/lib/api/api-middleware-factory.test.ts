import { NextRequest, NextResponse } from 'next/server';
import { createApiMiddleware } from '@/lib/api/api-middleware';

describe('api-middleware factory', () => {
  it('withAuth via factory returns 401 when unauthorized', async () => {
    const mw = createApiMiddleware({
      validateApiAuth: async () => ({ isValid: false, error: 'no-auth' }),
      createRequestLogger: (_req: unknown) => ({
        requestId: 'rid-factory',
        method: 'GET',
        url: 'http://localhost/factory',
        userAgent: 'jest',
      }) as any,
    });

    const wrapped = mw.withAuth(async () => NextResponse.json({ success: true, data: { ok: true }, meta: { timestamp: new Date().toISOString() } }));
    const req = new NextRequest('http://localhost/factory', { method: 'GET', headers: { 'user-agent': 'jest' } });
    const res = await wrapped(req as any, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(401);
    expect(res.headers.get('X-Request-Id')).toBe('rid-factory');
  });
});


