import { validateApiAuth } from '@/lib/api/api-auth';

jest.mock('@/lib/utils/utils', () => ({
  ...(jest.requireActual('@/lib/utils/utils') as Record<string, unknown>),
  isLocalhost: jest.fn((host: string) => !!host && (host.includes('localhost') || host === '127.0.0.1'))
}));

jest.mock('@/lib/auth/totp-service', () => ({
  isTOTPSetup: jest.fn(),
}));

jest.mock('@/lib/auth/device-fingerprint', () => ({
  verifyAuthSession: jest.fn(),
}));

const { isTOTPSetup } = jest.requireMock('@/lib/auth/totp-service') as { isTOTPSetup: jest.Mock };
const { verifyAuthSession } = jest.requireMock('@/lib/auth/device-fingerprint') as { verifyAuthSession: jest.Mock };

function makeRequest(url: string, headers: Record<string, string> = {}) {
  return {
    url,
    method: 'GET',
    headers: new Headers(headers),
    cookies: {
      get: (key: string) => {
        const cookieHeader = headers.cookie || '';
        const map = new Map(cookieHeader.split(/;\s*/).filter(Boolean).map((p) => p.split('=')) as any);
        const value = map.get(key);
        return value ? { name: key, value } : undefined;
      }
    },
    nextUrl: { pathname: new URL(url).pathname },
    json: jest.fn(),
    text: jest.fn(),
    clone: jest.fn(),
  } as any;
}

describe('validateApiAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isTOTPSetup.mockResolvedValue(true);
  });

  it('allows localhost without further checks', async () => {
    verifyAuthSession.mockResolvedValue({ deviceId: 'd1', name: 'n', fingerprint: 'f' });
    const req = makeRequest('http://localhost:3000/api', { host: 'localhost', 'x-forwarded-host': 'localhost', cookie: 'auth-session-token=good' });
    const res = await validateApiAuth(req);
    expect(res.isValid).toBe(true);
  });

  it('denies when TOTP not setup and not localhost', async () => {
    isTOTPSetup.mockResolvedValue(false);
    const req = makeRequest('https://example.com/api', { host: 'example.com' });
    const res = await validateApiAuth(req);
    expect(res.isValid).toBe(false);
    expect(res.error).toBeDefined();
  });

  it('denies when missing session token', async () => {
    isTOTPSetup.mockResolvedValue(true);
    const req = makeRequest('https://example.com/api', { host: 'example.com' });
    const res = await validateApiAuth(req);
    expect(res.isValid).toBe(false);
    expect(res.error).toMatch(/No authentication token/);
  });

  it('denies when verifyAuthSession fails', async () => {
    isTOTPSetup.mockResolvedValue(true);
    verifyAuthSession.mockResolvedValue(null);
    const req = makeRequest('https://example.com/api', { host: 'example.com', cookie: 'auth-session-token=bad' });
    const res = await validateApiAuth(req);
    expect(res.isValid).toBe(false);
    expect(res.error).toMatch(/Invalid or expired/);
  });

  it('allows when verifyAuthSession succeeds', async () => {
    isTOTPSetup.mockResolvedValue(true);
    verifyAuthSession.mockResolvedValue({ deviceId: 'd1', name: 'n', fingerprint: 'f' });
    const req = makeRequest('https://example.com/api', { host: 'example.com', cookie: 'auth-session-token=good' });
    const res = await validateApiAuth(req);
    expect(res.isValid).toBe(true);
    expect(res.deviceInfo).toMatchObject({ deviceId: 'd1' });
  });
});


