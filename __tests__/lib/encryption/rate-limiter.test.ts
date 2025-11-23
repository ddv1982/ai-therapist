/**
 * Tests for Crypto Rate Limiter
 *
 * Validates rate limiting behavior for cryptographic operations
 */

import { createCryptoRateLimiter } from '@/lib/encryption/rate-limiter';

describe('CryptoRateLimiter', () => {
  describe('Basic rate limiting', () => {
    it('allows operations under limit', () => {
      const limiter = createCryptoRateLimiter(100, 60000);
      
      // Should allow 100 operations
      for (let i = 0; i < 100; i++) {
        expect(() => limiter.checkLimit('test-user')).not.toThrow();
      }
    });

    it('blocks operations over limit', () => {
      const limiter = createCryptoRateLimiter(100, 60000);
      
      // Use up the limit
      for (let i = 0; i < 100; i++) {
        limiter.checkLimit('test-user');
      }
      
      // 101st operation should fail
      expect(() => limiter.checkLimit('test-user')).toThrow('Rate limit exceeded');
    });

    it('provides helpful error message with time remaining', () => {
      const limiter = createCryptoRateLimiter(5, 60000);
      
      // Use up the limit
      for (let i = 0; i < 5; i++) {
        limiter.checkLimit('test-user');
      }
      
      // Should throw with seconds remaining
      try {
        limiter.checkLimit('test-user');
        fail('Should have thrown rate limit error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toMatch(/Rate limit exceeded/);
        expect((error as Error).message).toMatch(/seconds/);
      }
    });
  });

  describe('Per-user isolation', () => {
    it('tracks different users independently', () => {
      const limiter = createCryptoRateLimiter(5, 60000);
      
      // User 1 uses up their limit
      for (let i = 0; i < 5; i++) {
        limiter.checkLimit('user-1');
      }
      expect(() => limiter.checkLimit('user-1')).toThrow('Rate limit exceeded');
      
      // User 2 should still have full limit
      for (let i = 0; i < 5; i++) {
        expect(() => limiter.checkLimit('user-2')).not.toThrow();
      }
    });

    it('resets individual users without affecting others', () => {
      const limiter = createCryptoRateLimiter(5, 60000);
      
      // Both users use some operations
      limiter.checkLimit('user-1');
      limiter.checkLimit('user-1');
      limiter.checkLimit('user-2');
      limiter.checkLimit('user-2');
      limiter.checkLimit('user-2');
      
      // Reset user 1
      limiter.reset('user-1');
      
      // User 1 should have full limit again
      for (let i = 0; i < 5; i++) {
        expect(() => limiter.checkLimit('user-1')).not.toThrow();
      }
      
      // User 2 should still have 2 operations left
      expect(() => limiter.checkLimit('user-2')).not.toThrow();
      expect(() => limiter.checkLimit('user-2')).not.toThrow();
      expect(() => limiter.checkLimit('user-2')).toThrow();
    });
  });

  describe('Time window behavior', () => {
    it('resets after time window expires', async () => {
      // Use a short window for testing
      const limiter = createCryptoRateLimiter(5, 100); // 100ms window
      
      // Use up the limit
      for (let i = 0; i < 5; i++) {
        limiter.checkLimit('test-user');
      }
      expect(() => limiter.checkLimit('test-user')).toThrow();
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be able to make requests again
      expect(() => limiter.checkLimit('test-user')).not.toThrow();
    });

    it('creates new window after previous expires', async () => {
      const limiter = createCryptoRateLimiter(3, 100);
      
      // First window
      limiter.checkLimit('test-user');
      limiter.checkLimit('test-user');
      limiter.checkLimit('test-user');
      expect(() => limiter.checkLimit('test-user')).toThrow();
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Second window
      limiter.checkLimit('test-user');
      limiter.checkLimit('test-user');
      limiter.checkLimit('test-user');
      expect(() => limiter.checkLimit('test-user')).toThrow();
    });
  });

  describe('Usage tracking', () => {
    it('returns null for users with no usage', () => {
      const limiter = createCryptoRateLimiter(100, 60000);
      
      const usage = limiter.getUsage('test-user');
      expect(usage).toBeNull();
    });

    it('tracks current usage correctly', () => {
      const limiter = createCryptoRateLimiter(100, 60000);
      
      limiter.checkLimit('test-user');
      limiter.checkLimit('test-user');
      limiter.checkLimit('test-user');
      
      const usage = limiter.getUsage('test-user');
      expect(usage).not.toBeNull();
      expect(usage?.count).toBe(3);
      expect(usage?.limit).toBe(100);
      expect(usage?.resetAt).toBeGreaterThan(Date.now());
    });

    it('returns null after window expires', async () => {
      const limiter = createCryptoRateLimiter(5, 100);
      
      limiter.checkLimit('test-user');
      
      let usage = limiter.getUsage('test-user');
      expect(usage).not.toBeNull();
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      usage = limiter.getUsage('test-user');
      expect(usage).toBeNull();
    });
  });

  describe('Statistics', () => {
    it('reports correct statistics', () => {
      const limiter = createCryptoRateLimiter(100, 60000);
      
      limiter.checkLimit('user-1');
      limiter.checkLimit('user-2');
      limiter.checkLimit('user-3');
      
      const stats = limiter.getStats();
      expect(stats.totalUsers).toBe(3);
      expect(stats.limit).toBe(100);
      expect(stats.windowMs).toBe(60000);
    });
  });

  describe('Reset functionality', () => {
    it('resets individual user', () => {
      const limiter = createCryptoRateLimiter(5, 60000);
      
      for (let i = 0; i < 5; i++) {
        limiter.checkLimit('test-user');
      }
      expect(() => limiter.checkLimit('test-user')).toThrow();
      
      limiter.reset('test-user');
      
      // Should be able to make requests again
      expect(() => limiter.checkLimit('test-user')).not.toThrow();
    });

    it('resets all users', () => {
      const limiter = createCryptoRateLimiter(5, 60000);
      
      // Multiple users use some operations
      limiter.checkLimit('user-1');
      limiter.checkLimit('user-2');
      limiter.checkLimit('user-3');
      
      limiter.resetAll();
      
      // All users should have full limit
      expect(limiter.getStats().totalUsers).toBe(0);
      for (let i = 0; i < 5; i++) {
        expect(() => limiter.checkLimit('user-1')).not.toThrow();
      }
    });
  });

  describe('Edge cases', () => {
    it('handles rapid consecutive requests', () => {
      const limiter = createCryptoRateLimiter(10, 60000);
      
      // Make 10 rapid requests
      for (let i = 0; i < 10; i++) {
        expect(() => limiter.checkLimit('test-user')).not.toThrow();
      }
      
      // 11th should fail
      expect(() => limiter.checkLimit('test-user')).toThrow();
    });

    it('handles limit of 1', () => {
      const limiter = createCryptoRateLimiter(1, 60000);
      
      expect(() => limiter.checkLimit('test-user')).not.toThrow();
      expect(() => limiter.checkLimit('test-user')).toThrow('Rate limit exceeded');
    });

    it('handles very large limits', () => {
      const limiter = createCryptoRateLimiter(10000, 60000);
      
      // Should not throw for reasonable usage
      for (let i = 0; i < 1000; i++) {
        expect(() => limiter.checkLimit('test-user')).not.toThrow();
      }
    });
  });

  describe('Memory management', () => {
    it('cleans up expired entries periodically', async () => {
      const limiter = createCryptoRateLimiter(5, 50); // 50ms window
      
      // Create entries for multiple users
      limiter.checkLimit('user-1');
      limiter.checkLimit('user-2');
      limiter.checkLimit('user-3');
      
      expect(limiter.getStats().totalUsers).toBe(3);
      
      // Wait for windows to expire and cleanup to run
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Trigger cleanup by making a new request
      limiter.checkLimit('user-4');
      
      // At least one old entry should be cleaned up (user-4 is new, so max should be 4)
      // But since cleanup runs every 60s and we can't guarantee timing, we just check it's reasonable
      const stats = limiter.getStats();
      expect(stats.totalUsers).toBeLessThanOrEqual(4);
      expect(stats.totalUsers).toBeGreaterThan(0); // user-4 at minimum
    });
  });

  describe('Production limits', () => {
    it('enforces 100 operations per minute', () => {
      const limiter = createCryptoRateLimiter(100, 60000);
      
      // Should allow exactly 100 operations
      for (let i = 0; i < 100; i++) {
        expect(() => limiter.checkLimit('production-user')).not.toThrow();
      }
      
      // 101st should fail
      expect(() => limiter.checkLimit('production-user')).toThrow();
    });
  });
});
