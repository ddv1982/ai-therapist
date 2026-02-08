import { ensureUserExists } from '@/lib/repositories/user-repository';

const mockMutation = jest.fn().mockResolvedValue({ ok: true });

jest.mock('@/lib/convex/http-client', () => ({
  getConvexHttpClient: () => ({ mutation: mockMutation }),
  api: { users: { ensureByClerkId: {} } },
}));

jest.mock('@/lib/auth/user-session', () => ({
  getSingleUserInfo: () => ({ email: 'u@test', name: 'U', currentDevice: 'Computer' }),
}));

describe('user-repository.ensureUserExists', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true on successful ensure', async () => {
    const ok = await ensureUserExists({
      clerkId: 'clerk_legacy',
      email: 'u@test',
      name: 'U',
    } as any);
    expect(ok).toBe(true);
    expect(mockMutation).toHaveBeenCalledWith(
      {},
      {
        clerkId: 'clerk_legacy',
        email: 'u@test',
        name: 'U',
      }
    );
  });

  it('returns false when client throws', async () => {
    jest.resetModules();
    jest.doMock('@/lib/convex/http-client', () => ({
      getConvexHttpClient: () => ({ mutation: jest.fn().mockRejectedValue(new Error('boom')) }),
      api: { users: { ensureByClerkId: {} } },
    }));
    const { ensureUserExists: ensure2 } = await import('@/lib/repositories/user-repository');
    const ok = await ensure2({ clerkId: 'clerk_legacy', email: 'u@test', name: 'U' } as any);
    expect(ok).toBe(false);
  });
});
