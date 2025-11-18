import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiMiddleware } from '@/lib/api/api-middleware';

describe('api-middleware withValidation via factory', () => {
  const mockValidateApiAuth = jest.fn();
  const mockGetSingleUserInfo = jest.fn();
  const mw = createApiMiddleware({
    validateApiAuth: mockValidateApiAuth,
    getSingleUserInfo: mockGetSingleUserInfo,
    createRequestLogger: () =>
      ({
        requestId: 'rid-factory',
        method: 'POST',
        url: 'http://localhost/val',
        userAgent: 'jest',
      }) as any,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateApiAuth.mockResolvedValue({ isValid: true });
    mockGetSingleUserInfo.mockReturnValue({ userId: 'u1', deviceId: 'd1' });
  });

  it('returns 400 on invalid JSON', async () => {
    const schema = z.object({ a: z.string() });
    const handler = jest.fn(async () =>
      NextResponse.json({
        success: true,
        data: { ok: true },
        meta: { timestamp: new Date().toISOString() },
      })
    );
    const wrapped = mw.withValidation(schema, handler);
    const req = new NextRequest('http://localhost/val', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    }) as any;
    req.json = jest.fn(async () => {
      throw new Error('bad');
    });
    const res = await wrapped(req as any, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(400);
    expect(handler).not.toHaveBeenCalled();
  });

  it('returns 400 on schema validation failure', async () => {
    const schema = z.object({ a: z.string().min(2) });
    const handler = jest.fn(async () =>
      NextResponse.json({
        success: true,
        data: { ok: true },
        meta: { timestamp: new Date().toISOString() },
      })
    );
    const wrapped = mw.withValidation(schema, handler);
    const req = new NextRequest('http://localhost/val', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    }) as any;
    req.json = jest.fn(async () => ({ a: '' }));
    const res = await wrapped(req as any, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(400);
    expect(handler).not.toHaveBeenCalled();
  });
});
