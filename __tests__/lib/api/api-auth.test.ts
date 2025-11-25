describe('lib/api/api-auth.validateApiAuth', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('returns isValid=true and clerkId when auth() returns userId', async () => {
    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn().mockResolvedValue({
        userId: 'clerk_user_1',
        getToken: jest.fn().mockResolvedValue('mock_jwt_token'),
      }),
      getAuth: jest.fn(),
    }));
    const { validateApiAuth } = await import('@/lib/api/api-auth');
    const res = await validateApiAuth();
    expect(res.isValid).toBe(true);
    expect(res.clerkId).toBe('clerk_user_1');
    expect(res.jwtToken).toBe('mock_jwt_token');
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
      auth: jest.fn().mockResolvedValue({
        userId: 'fallback',
        getToken: jest.fn().mockResolvedValue('fallback_token'),
      }),
      getAuth: jest.fn(() => ({
        userId: 'request_user',
        getToken: jest.fn().mockResolvedValue('request_jwt_token'),
      })),
    }));
    const { validateApiAuth } = await import('@/lib/api/api-auth');
    const res = await validateApiAuth({} as any);
    expect(res.isValid).toBe(true);
    expect(res.clerkId).toBe('request_user');
    expect(res.jwtToken).toBe('request_jwt_token');
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
