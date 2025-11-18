describe('lib/api/api-auth.validateApiAuth', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('returns isValid=true and clerkId when auth() returns userId', async () => {
    jest.doMock('@/config/env', () => ({
      env: { BYPASS_AUTH: false },
    }));
    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn().mockResolvedValue({ userId: 'clerk_user_1' }),
      getAuth: jest.fn(),
    }));
    const { validateApiAuth } = await import('@/lib/api/api-auth');
    const res = await validateApiAuth();
    expect(res.isValid).toBe(true);
    expect(res.clerkId).toBe('clerk_user_1');
  });

  it('returns isValid=false when no userId present', async () => {
    jest.doMock('@/config/env', () => ({
      env: { BYPASS_AUTH: false },
    }));
    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn().mockResolvedValue({ userId: null }),
      getAuth: jest.fn(),
    }));
    const { validateApiAuth } = await import('@/lib/api/api-auth');
    const res = await validateApiAuth();
    expect(res.isValid).toBe(false);
    expect(res.error).toMatch(/unauthorized/i);
  });

  it('uses request-bound getAuth(request) when provided', async () => {
    jest.doMock('@/config/env', () => ({
      env: { BYPASS_AUTH: false },
    }));
    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn().mockResolvedValue({ userId: 'fallback' }),
      getAuth: jest.fn(() => ({ userId: 'request_user' })),
    }));
    const { validateApiAuth } = await import('@/lib/api/api-auth');
    const res = await validateApiAuth({} as any);
    expect(res.isValid).toBe(true);
    expect(res.clerkId).toBe('request_user');
  });

  it('handles non-Error exceptions', async () => {
    jest.doMock('@/config/env', () => ({
      env: { BYPASS_AUTH: false },
    }));
    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn().mockRejectedValue('string error'),
      getAuth: jest.fn(),
    }));
    const { validateApiAuth } = await import('@/lib/api/api-auth');
    const res = await validateApiAuth();
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('Unknown error');
  });

  it('bypasses auth when BYPASS_AUTH=true', async () => {
    jest.doMock('@/config/env', () => ({
      env: { BYPASS_AUTH: true },
    }));
    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn().mockResolvedValue({ userId: null }),
      getAuth: jest.fn(),
    }));
    const { validateApiAuth } = await import('@/lib/api/api-auth');
    const res = await validateApiAuth();
    expect(res.isValid).toBe(true);
    expect(res.clerkId).toBe('dev-user');
    expect(res.userId).toBe('dev-user');
  });
});
