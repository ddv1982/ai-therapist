import { ensureUserExists } from '@/lib/repositories/user-repository';

jest.mock('@/lib/convex/http-client', () => ({
  getConvexHttpClient: () => ({ mutation: jest.fn().mockResolvedValue({ ok: true }) }),
  api: { users: { ensureByClerkId: {} } },
}));

jest.mock('@/lib/auth/user-session', () => ({
  getSingleUserInfo: () => ({ userId: 'legacy', email: 'u@test', name: 'U' }),
}));

describe('user-repository.ensureUserExists', () => {
  it('returns true on successful ensure', async () => {
    const ok = await ensureUserExists({ userId: 'legacy', email: 'u@test', name: 'U' } as any);
    expect(ok).toBe(true);
  });

  it('returns false when client throws', async () => {
    jest.resetModules();
    jest.doMock('@/lib/convex/http-client', () => ({
      getConvexHttpClient: () => ({ mutation: jest.fn().mockRejectedValue(new Error('boom')) }),
      api: { users: { ensureByClerkId: {} } },
    }));
    const { ensureUserExists: ensure2 } = await import('@/lib/repositories/user-repository');
    const ok = await ensure2({ userId: 'legacy', email: 'u@test', name: 'U' } as any);
    expect(ok).toBe(false);
  });
});
