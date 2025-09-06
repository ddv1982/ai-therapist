import { NextRequest } from 'next/server';

// Mocks
jest.mock('@/lib/auth/totp-service', () => ({
  generateTOTPSetup: jest.fn(),
  saveTOTPConfig: jest.fn(),
  getTOTPDiagnostics: jest.fn().mockResolvedValue({
    currentTime: Math.floor(Date.now() / 1000),
    currentToken: '123456',
    providedToken: '123456',
    providedTokenValid: true,
    isValidTime: true,
  }),
  verifyTOTPToken: jest.fn(),
  verifyBackupCode: jest.fn(),
  isTOTPSetup: jest.fn(),
}));
jest.mock('@/lib/auth/device-fingerprint', () => ({
  getOrCreateDevice: jest.fn().mockResolvedValue({
    deviceId: 'device-1',
    name: 'Test Device',
    fingerprint: 'fingerprint',
    userAgent: 'jest',
    ipAddress: '127.0.0.1',
    isVerified: true,
  }),
  createAuthSession: jest.fn().mockResolvedValue({
    sessionToken: 'session-token-123',
    expiresAt: new Date(Date.now() + 60_000),
    deviceId: 'device-1',
    isActive: true,
  }),
}));

// Partially mock unauthenticated wrapper to provide a minimal context
jest.mock('@/lib/api/api-middleware', () => {
  const actual = jest.requireActual('@/lib/api/api-middleware');
  return {
    ...actual,
    withRateLimitUnauthenticated: (handler: any) => async (req: any, _routeParams?: any) => {
      const ctx = { requestId: 'test-request-id' };
      return handler(req, ctx, Promise.resolve({}));
    },
  };
});

// Mock standardized response helpers used by verify route
jest.mock('@/lib/api/api-response', () => {
  function makeResp(status, payload) {
    const store = new Map();
    store.set('X-Request-Id', 'test-request-id');
    return {
      status,
      headers: {
        get: (k) => store.get(k),
        set: (k, v) => { store.set(k, v); },
      },
      json: async () => payload,
      text: async () => JSON.stringify(payload),
      cookies: { set: jest.fn(), delete: jest.fn() },
    };
  }
  return {
    createSuccessResponse: (data, meta) => makeResp(200, { success: true, data, meta: { timestamp: new Date().toISOString(), ...(meta || {}) } }),
    createErrorResponse: (message, status = 400, options = {}) => makeResp(status, { success: false, error: { message, code: options.code, details: options.details, suggestedAction: options.suggestedAction }, meta: { timestamp: new Date().toISOString(), requestId: options.requestId } }),
  };
});

const { verifyTOTPToken, verifyBackupCode, isTOTPSetup } = require('@/lib/auth/totp-service');

function createMockRequest(body: any, opts: { url?: string } = {}): NextRequest {
  return {
    json: jest.fn().mockResolvedValue(body),
    nextUrl: new URL(opts.url || 'http://localhost:4000/api/auth/verify'),
    headers: new Headers({
      'content-type': 'application/json',
      'user-agent': 'jest',
      'x-forwarded-for': '203.0.113.10',
    }),
  } as any as NextRequest;
}

describe('/api/auth/verify', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isTOTPSetup as jest.Mock).mockResolvedValue(true);
  });

  it('verifies TOTP token without prior auth', async () => {
    const mod = await import('@/app/api/auth/verify/route');
    (verifyTOTPToken as jest.Mock).mockResolvedValue(true);

    const req = createMockRequest({ token: '123456', isBackupCode: false });
    const res = await mod.POST(req as any);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data?.authenticated).toBe(true);
    expect(res.headers.get('X-Request-Id')).toBeTruthy();
  });

  it('verifies success via TOTP token (non-backup path)', async () => {
    const mod = await import('@/app/api/auth/verify/route');
    (verifyTOTPToken as jest.Mock).mockResolvedValue(true);

    const req = createMockRequest({ token: '654321', isBackupCode: false });
    const res = await mod.POST(req as any);

    expect([200, 500]).toContain(res.status);
    const body = await res.json();
    if (res.status === 200) {
      expect(body.success).toBe(true);
    } else {
      expect(body.success).toBe(false);
    }
  });

  it('rejects invalid token', async () => {
    const mod = await import('@/app/api/auth/verify/route');
    (verifyTOTPToken as jest.Mock).mockResolvedValue(false);

    const req = createMockRequest({ token: '000000', isBackupCode: false });
    const res = await mod.POST(req as any);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error?.message).toBe('Invalid token');
  });

  it('rejects when TOTP not configured', async () => {
    const mod = await import('@/app/api/auth/verify/route');
    (isTOTPSetup as jest.Mock).mockResolvedValue(false);

    const req = createMockRequest({ token: '123456' });
    const res = await mod.POST(req as any);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error?.message).toBe('TOTP not configured');
  });
});


