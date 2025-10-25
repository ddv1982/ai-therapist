import { getServerEnv, reloadServerEnvForTesting } from '@/config/env';
import { publicEnv, reloadPublicEnvForTesting } from '@/config/env.public';
import { setEnv, resetTestEnv } from '../test-utils/env';

describe('environment configuration', () => {
  const REQUIRED_ENV = {
    NEXTAUTH_SECRET: 'test-nextauth-secret-that-is-long-enough',
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY ?? 'test-encryption-key-32-chars-long-for-testing',
  };

  beforeEach(() => {
    Object.entries(REQUIRED_ENV).forEach(([key, value]) => setEnv(key, value));
    reloadServerEnvForTesting();
    reloadPublicEnvForTesting();
  });

  afterEach(() => {
    resetTestEnv();
  });

  it('parses numeric and boolean server env variables', () => {
    setEnv('RATE_LIMIT_BLOCK_MS', '60000');
    setEnv('RATE_LIMIT_DISABLED', 'true');
    const serverEnv = getServerEnv();
    expect(serverEnv.RATE_LIMIT_BLOCK_MS).toBe(60000);
    expect(serverEnv.RATE_LIMIT_DISABLED).toBe(true);
  });

  it('throws when required secrets are missing', () => {
    setEnv('NEXTAUTH_SECRET', undefined);
    expect(() => getServerEnv()).toThrow(/NEXTAUTH_SECRET/);
  });

  it('exposes public env toggles with defaults', () => {
    expect(publicEnv.NEXT_PUBLIC_MARKDOWN_ALLOW_HTTP).toBe(false);
    expect(publicEnv.NEXT_PUBLIC_MARKDOWN_ALLOW_MAILTO).toBe(false);
  });
});
