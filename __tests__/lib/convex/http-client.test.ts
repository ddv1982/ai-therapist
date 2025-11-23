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

  describe('Basic Configuration', () => {
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

  describe('Authenticated Client', () => {
    beforeEach(() => {
      process.env.CONVEX_URL = 'http://127.0.0.1:3210';
      reloadServerEnvForTesting();
    });

    it('creates authenticated client with valid token', async () => {
      const mod = await import('@/lib/convex/http-client');
      const token = 'valid-jwt-token-123';
      const client = mod.getConvexHttpClientWithAuth(token);
      expect(client).toBeTruthy();
      expect(typeof client).toBe('object');
    });

    it('throws error when token is missing for authenticated client', async () => {
      const mod = await import('@/lib/convex/http-client');
      expect(() => mod.getAuthenticatedConvexClient(undefined)).toThrow(
        /authentication token is missing/i
      );
    });

    it('throws error when token is not a string', async () => {
      const mod = await import('@/lib/convex/http-client');
      expect(() => mod.getAuthenticatedConvexClient(123 as any)).toThrow(
        /authentication token is missing/i
      );
    });

    it('throws error when token is empty string', async () => {
      const mod = await import('@/lib/convex/http-client');
      expect(() => mod.getAuthenticatedConvexClient('')).toThrow(
        /authentication token is missing/i
      );
    });

    it('creates different clients with different tokens', async () => {
      const mod = await import('@/lib/convex/http-client');
      const client1 = mod.getConvexHttpClientWithAuth('token-1');
      const client2 = mod.getConvexHttpClientWithAuth('token-2');
      // Different auth clients should be different instances
      expect(client1).not.toBe(client2);
    });

    it('throws when URL not configured for authenticated client', async () => {
      delete process.env.CONVEX_URL;
      delete process.env.NEXT_PUBLIC_CONVEX_URL;
      reloadServerEnvForTesting();
      jest.resetModules();
      const mod = await import('@/lib/convex/http-client');
      expect(() => mod.getConvexHttpClientWithAuth('valid-token')).toThrow(
        /Convex URL not configured/i
      );
    });
  });

  describe('Error Handling - URL Configuration', () => {
    it('handles malformed URL gracefully', async () => {
      process.env.CONVEX_URL = 'not-a-valid-url';
      reloadServerEnvForTesting();
      jest.resetModules();
      // Malformed URL will fail env validation at module import time
      await expect(import('@/lib/convex/http-client')).rejects.toThrow(/Invalid URL/i);
    });

    it('handles URL with special characters', async () => {
      process.env.CONVEX_URL = 'http://127.0.0.1:3210?token=abc%20def&foo=bar';
      reloadServerEnvForTesting();
      jest.resetModules();
      const mod = await import('@/lib/convex/http-client');
      const client = mod.getConvexHttpClient();
      expect(client).toBeTruthy();
      expect(typeof client).toBe('object');
    });

    it('handles empty string URL', async () => {
      process.env.CONVEX_URL = '';
      process.env.NEXT_PUBLIC_CONVEX_URL = '';
      reloadServerEnvForTesting();
      jest.resetModules();
      const mod = await import('@/lib/convex/http-client');
      expect(() => mod.getConvexHttpClient()).toThrow(/Convex URL not configured/i);
    });

    it('handles whitespace-only URL', async () => {
      process.env.CONVEX_URL = '   ';
      reloadServerEnvForTesting();
      jest.resetModules();
      // Whitespace URL will fail env validation at module import time
      await expect(import('@/lib/convex/http-client')).rejects.toThrow(/Invalid URL/i);
    });
  });

  describe('Error Handling - Network Scenarios', () => {
    beforeEach(() => {
      process.env.CONVEX_URL = 'http://127.0.0.1:3210';
      reloadServerEnvForTesting();
    });

    it('client initialization does not throw on network errors', async () => {
      const mod = await import('@/lib/convex/http-client');
      // Client creation should succeed even if network is unavailable
      // Actual network errors occur when making requests
      expect(() => mod.getConvexHttpClient()).not.toThrow();
    });

    it('handles initialization with unreachable host', async () => {
      process.env.CONVEX_URL = 'http://unreachable-host-12345.invalid:9999';
      reloadServerEnvForTesting();
      jest.resetModules();
      const mod = await import('@/lib/convex/http-client');
      // Client should be created successfully; network errors happen at request time
      const client = mod.getConvexHttpClient();
      expect(client).toBeTruthy();
      expect(typeof client).toBe('object');
    });
  });

  describe('Error Handling - Authentication Errors', () => {
    beforeEach(() => {
      process.env.CONVEX_URL = 'http://127.0.0.1:3210';
      reloadServerEnvForTesting();
    });

    it('handles null token gracefully', async () => {
      const mod = await import('@/lib/convex/http-client');
      expect(() => mod.getAuthenticatedConvexClient(null as any)).toThrow(
        /authentication token is missing/i
      );
    });

    it('handles undefined token gracefully', async () => {
      const mod = await import('@/lib/convex/http-client');
      expect(() => mod.getAuthenticatedConvexClient(undefined)).toThrow(
        /authentication token is missing/i
      );
    });

    it('handles object instead of token', async () => {
      const mod = await import('@/lib/convex/http-client');
      expect(() => mod.getAuthenticatedConvexClient({ token: 'abc' } as any)).toThrow(
        /authentication token is missing/i
      );
    });

    it('handles array instead of token', async () => {
      const mod = await import('@/lib/convex/http-client');
      expect(() => mod.getAuthenticatedConvexClient(['token'] as any)).toThrow(
        /authentication token is missing/i
      );
    });

    it('accepts valid JWT-like token format', async () => {
      const mod = await import('@/lib/convex/http-client');
      const validJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc123';
      expect(() => mod.getAuthenticatedConvexClient(validJWT)).not.toThrow();
    });
  });

  describe('Error Handling - Rate Limiting', () => {
    beforeEach(() => {
      process.env.CONVEX_URL = 'http://127.0.0.1:3210';
      reloadServerEnvForTesting();
    });

    it('creates client successfully regardless of potential rate limits', async () => {
      const mod = await import('@/lib/convex/http-client');
      // Rate limiting would occur at request time, not client creation
      const client = mod.getConvexHttpClient();
      expect(client).toBeTruthy();
      expect(typeof client).toBe('object');
    });
  });

  describe('Error Handling - Timeout Scenarios', () => {
    beforeEach(() => {
      process.env.CONVEX_URL = 'http://127.0.0.1:3210';
      reloadServerEnvForTesting();
    });

    it('client initialization completes immediately without timeout', async () => {
      const mod = await import('@/lib/convex/http-client');
      const startTime = Date.now();
      const client = mod.getConvexHttpClient();
      const duration = Date.now() - startTime;
      
      expect(client).toBeTruthy();
      expect(typeof client).toBe('object');
      // Client creation should be instant (< 100ms)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Error Handling - Cache Behavior', () => {
    beforeEach(() => {
      process.env.CONVEX_URL = 'http://127.0.0.1:3210';
      reloadServerEnvForTesting();
    });

    it('cache persists across multiple calls', async () => {
      const mod = await import('@/lib/convex/http-client');
      const clients = Array.from({ length: 10 }, () => mod.getConvexHttpClient());
      const firstClient = clients[0];
      
      // All clients should be the same cached instance
      clients.forEach(client => {
        expect(client).toBe(firstClient);
      });
    });

    it('cache is invalidated on module reload', async () => {
      const mod1 = await import('@/lib/convex/http-client');
      const client1 = mod1.getConvexHttpClient();
      
      jest.resetModules();
      
      const mod2 = await import('@/lib/convex/http-client');
      const client2 = mod2.getConvexHttpClient();
      
      // After module reload, should get a new instance
      expect(client2).not.toBe(client1);
    });
  });
});
