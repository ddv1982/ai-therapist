import { reloadServerEnvForTesting } from '@/config/env';

describe('lib/convex/http-client', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('uses CONVEX_URL when set and caches client', async () => {
    process.env.CONVEX_URL = 'http://127.0.0.1:3210';
    reloadServerEnvForTesting();
    const mod = await import('@/lib/convex/http-client');
    const c1 = mod.getConvexHttpClient();
    const c2 = mod.getConvexHttpClient();
    expect(c1).toBe(c2);
  });

  it('falls back to NEXT_PUBLIC_CONVEX_URL when CONVEX_URL is missing', async () => {
    delete process.env.CONVEX_URL;
    process.env.NEXT_PUBLIC_CONVEX_URL = 'http://127.0.0.1:3210';
    reloadServerEnvForTesting();
    const mod = await import('@/lib/convex/http-client');
    expect(() => mod.getConvexHttpClient()).not.toThrow();
  });

  it('throws when neither URL is configured', async () => {
    delete process.env.CONVEX_URL;
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
    reloadServerEnvForTesting();
    const mod = await import('@/lib/convex/http-client');
    expect(() => mod.getConvexHttpClient()).toThrow(/Convex URL not configured/i);
  });

  it('strips query parameters from URL', async () => {
    process.env.CONVEX_URL = 'http://127.0.0.1:3210?token=abc123';
    reloadServerEnvForTesting();
    jest.resetModules();
    const mod = await import('@/lib/convex/http-client');
    expect(() => mod.getConvexHttpClient()).not.toThrow();
  });

  it('returns cached client on subsequent calls', async () => {
    process.env.CONVEX_URL = 'http://127.0.0.1:3210';
    reloadServerEnvForTesting();
    jest.resetModules();
    const mod = await import('@/lib/convex/http-client');
    const client1 = mod.getConvexHttpClient();
    const client2 = mod.getConvexHttpClient();
    expect(client1).toBe(client2);
  });
});
