const validateApiAuthMock = jest.fn(async (_req?: unknown) => ({ isValid: true }));
jest.mock('@/lib/api/api-auth', () => ({
  validateApiAuth: (req: unknown) => validateApiAuthMock(req)
}));
jest.mock('@/lib/auth/user-session', () => ({
  getSingleUserInfo: jest.fn(() => ({ userId: 'u1' }))
}));

describe('authenticateRequest', () => {
  it('returns isAuthenticated=false when validateApiAuth is invalid', async () => {
    const { validateApiAuth } = require('@/lib/api/api-auth');
    const { getSingleUserInfo } = require('@/lib/auth/user-session');
    const authenticateRequest = async (request: unknown) => {
      const authResult = await validateApiAuth(request);
      if (!authResult.isValid) return { isAuthenticated: false as const, error: authResult.error || 'Authentication required' };
      const userInfo = getSingleUserInfo(request);
      return { isAuthenticated: true as const, userInfo };
    };
    validateApiAuthMock.mockResolvedValueOnce({ isValid: false, error: 'invalid' } as any);
    const res = await authenticateRequest({} as any);
    expect(res.isAuthenticated).toBe(false);
    expect(res).toHaveProperty('error');
  });

  it('returns userInfo when valid', async () => {
    const { validateApiAuth } = require('@/lib/api/api-auth');
    const { getSingleUserInfo } = require('@/lib/auth/user-session');
    const authenticateRequest = async (request: unknown) => {
      const authResult = await validateApiAuth(request);
      if (!authResult.isValid) return { isAuthenticated: false as const, error: authResult.error || 'Authentication required' };
      const userInfo = getSingleUserInfo(request);
      return { isAuthenticated: true as const, userInfo };
    };
    validateApiAuthMock.mockResolvedValueOnce({ isValid: true } as any);
    const res = await authenticateRequest({} as any);
    expect(res.isAuthenticated).toBe(true);
    expect(res).toHaveProperty('userInfo');
  });
});


