describe('lib/api/api-auth.validateApiAuth', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('returns isValid=true and clerkId when auth() returns userId', async () => {
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
    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn().mockRejectedValue('string error'),
      getAuth: jest.fn(),
    }));
    const { validateApiAuth } = await import('@/lib/api/api-auth');
    const res = await validateApiAuth();
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('Unknown error');
  });
});
