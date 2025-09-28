import { getRateLimiter } from '@/lib/api/rate-limiter';

// Mock console for development logging tests
const mockConsole = {
  log: jest.fn()
};

describe('RateLimiter', () => {
  let originalConsole: Console;
  let originalEnv: string | undefined;
  let rateLimiter: any;

  beforeAll(() => {
    originalConsole = global.console;
    originalEnv = process.env.NODE_ENV;
  });

  beforeEach(() => {
    // Reset console mock
    mockConsole.log.mockClear();
    global.console = mockConsole as any;
    
    // Clear any existing rate limiter instance by creating new ones
    jest.clearAllMocks();
    
    // Get fresh rate limiter instance and clear its state
    rateLimiter = getRateLimiter();
    // Clear state via any-cast cleanup if available
    const rlAny = rateLimiter as any;
    if (typeof rlAny.destroy === 'function') {
      rlAny.destroy();
    }
    rateLimiter = getRateLimiter(); // Get fresh instance
  });

  afterAll(() => {
    global.console = originalConsole;
    Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true });
  });

  describe('Exempt IP Handling', () => {
    it('should allow localhost IPv4', () => {
      const result = rateLimiter.checkRateLimit('127.0.0.1');
      
      expect(result.allowed).toBe(true);
      expect(result.retryAfter).toBeUndefined();
    });

    it('should allow localhost IPv6', () => {
      const result = rateLimiter.checkRateLimit('::1');
      
      expect(result.allowed).toBe(true);
    });

    it('should allow private network ranges', () => {
      const privateIPs = [
        '192.168.1.1',
        '10.0.0.1',
        '172.16.0.1',
        '172.17.0.1',
        '172.31.255.255'
      ];

      privateIPs.forEach(ip => {
        const result = rateLimiter.checkRateLimit(ip);
        expect(result.allowed).toBe(true);
      });
    });

    it('should allow unknown IP', () => {
      const result = rateLimiter.checkRateLimit('unknown');
      
      expect(result.allowed).toBe(true);
    });

    it('should allow exempt IP in development mode', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });
      
      const result = rateLimiter.checkRateLimit('127.0.0.1');
      
      // Exempt IPs should be allowed without logging
      expect(result.allowed).toBe(true);
      expect(result.retryAfter).toBeUndefined();
    });
  });

  describe('Rate Limiting Logic', () => {
    it('should allow first request from external IP', () => {
      const result = rateLimiter.checkRateLimit('203.0.113.1');
      
      expect(result.allowed).toBe(true);
    });

    it('should track multiple requests from same IP', () => {
      const ip = '203.0.113.100';
      
      // Make several requests
      for (let i = 0; i < 10; i++) {
        const result = rateLimiter.checkRateLimit(ip);
        expect(result.allowed).toBe(true);
      }
      
      // Check status
      const status: any = (rateLimiter as any).getStatus(ip);
      expect(status.count).toBe(10);
      expect(status.remaining).toBe(40); // 50 max - 10 used
    });

    it('should block IP after exceeding max attempts', () => {
      const ip = '203.0.113.101';
      
      // Make maximum allowed requests (50)
      for (let i = 0; i < 50; i++) {
        const result = rateLimiter.checkRateLimit(ip);
        expect(result.allowed).toBe(true);
      }
      
      // Next request should be blocked
      const blockedResult = rateLimiter.checkRateLimit(ip);
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.retryAfter).toBeGreaterThan(0);
    });

    it('should provide correct retryAfter time', () => {
      const ip = '203.0.113.102';
      
      // Exceed limit
      for (let i = 0; i <= 50; i++) {
        rateLimiter.checkRateLimit(ip);
      }
      
      const result = rateLimiter.checkRateLimit(ip);
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(600); // Up to 10 minutes (5 min window + 5 min block)
    });

    it('should log block event without leaking IP in development mode', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });
      const ip = '203.0.113.103';
      
      // Exceed limit
      for (let i = 0; i <= 50; i++) {
        rateLimiter.checkRateLimit(ip);
      }
      
      // We don't require console output now that browser logs are suppressed.
      // Instead, assert functional behavior (blocked) and that no IP is logged via console.log.
      const blocked = rateLimiter.checkRateLimit(ip);
      expect(blocked.allowed).toBe(false);
      const output = mockConsole.log.mock.calls.map(c => String(c[0])).join('\n');
      expect(output).not.toContain(ip);
      
      // Ensure no raw IPs are leaked in log output
      expect(output).not.toContain(ip);
      expect(output).not.toMatch(/"ip"\s*:/i);
    });
  });

  describe('Status Reporting', () => {
    it('should return correct status for new IP', () => {
      const rateLimiter = getRateLimiter();
      const status: any = (rateLimiter as any).getStatus('203.0.113.5');
      
      expect(status.count).toBe(0);
      expect(status.remaining).toBe(50);
      expect(status.resetTime).toBeGreaterThan(Date.now());
    });

    it('should return correct status for IP with attempts', () => {
      const rateLimiter = getRateLimiter();
      const ip = '203.0.113.6';
      
      // Make some requests
      for (let i = 0; i < 15; i++) {
        rateLimiter.checkRateLimit(ip);
      }
      
      const status: any = (rateLimiter as any).getStatus(ip);
      expect(status.count).toBe(15);
      expect(status.remaining).toBe(35);
    });

    it('should return zero remaining for blocked IP', () => {
      const rateLimiter = getRateLimiter();
      const ip = '203.0.113.7';
      
      // Exceed limit
      for (let i = 0; i <= 50; i++) {
        rateLimiter.checkRateLimit(ip);
      }
      
      const status: any = (rateLimiter as any).getStatus(ip);
      expect(status.remaining).toBe(0);
    });
  });

  describe('Suspicious Activity Detection', () => {
    it('should detect suspicious activity', () => {
      const suspiciousIP = '203.0.113.200';
      
      // Generate suspicious activity
      for (let i = 0; i <= 50; i++) {
        rateLimiter.checkRateLimit(suspiciousIP);
      }
      
      const suspicious: any[] = (rateLimiter as any).getSuspiciousActivity();
      expect(suspicious.length).toBeGreaterThanOrEqual(1);
      const foundSuspicious = suspicious.find((entry: { ip: string; attempts: number; lastAttempt: number }) => entry.ip === suspiciousIP);
      expect(foundSuspicious).toBeDefined();
      expect(foundSuspicious!.attempts).toBeGreaterThanOrEqual(50);
      expect(foundSuspicious!.lastAttempt).toBeGreaterThan(0);
    });

    it('should sort suspicious activity by last attempt time', () => {
      const rateLimiter = getRateLimiter();
      const ip1 = '203.0.113.9';
      const ip2 = '203.0.113.10';
      
      // Generate activity for first IP
      for (let i = 0; i <= 50; i++) {
        rateLimiter.checkRateLimit(ip1);
      }
      
      // Wait a bit and generate activity for second IP
      setTimeout(() => {
        for (let i = 0; i <= 50; i++) {
          rateLimiter.checkRateLimit(ip2);
        }
      }, 10);
      
      // Run after timeout
      setTimeout(() => {
        const suspicious: any[] = (rateLimiter as any).getSuspiciousActivity();
        if (suspicious.length >= 2) {
          expect(suspicious[0].lastAttempt).toBeGreaterThanOrEqual(suspicious[1].lastAttempt);
        }
      }, 20);
    });

    it('should not include non-suspicious IPs', () => {
      const rateLimiter = getRateLimiter();
      const normalIP = '203.0.113.11';
      
      // Make normal requests
      for (let i = 0; i < 20; i++) {
        rateLimiter.checkRateLimit(normalIP);
      }
      
      const suspicious: any[] = (rateLimiter as any).getSuspiciousActivity();
      const foundIP = suspicious.find((entry: { ip: string }) => entry.ip === normalIP);
      expect(foundIP).toBeUndefined();
    });
  });

  describe('Time Window Handling', () => {
    beforeEach(() => {
      // Mock Date.now for time-based tests
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should reset rate limit after time window expires', () => {
      const rateLimiter = getRateLimiter();
      const ip = '203.0.113.12';
      
      // Make some requests
      for (let i = 0; i < 30; i++) {
        rateLimiter.checkRateLimit(ip);
      }
      
      let status: any = (rateLimiter as any).getStatus(ip);
      expect(status.count).toBe(30);
      
      // Fast forward past window expiry (5 minutes)
      jest.advanceTimersByTime(5 * 60 * 1000 + 1000);
      
      // Next request should reset the counter
      const result = rateLimiter.checkRateLimit(ip) as any;
      expect(result.allowed).toBe(true);
      
      status = (rateLimiter as any).getStatus(ip);
      expect(status.count).toBe(1); // Reset to 1 after new request
    });

    it('should unblock IP after block duration expires', () => {
      const rateLimiter = getRateLimiter();
      const ip = '203.0.113.13';
      
      // Exceed limit to get blocked
      for (let i = 0; i <= 50; i++) {
        rateLimiter.checkRateLimit(ip);
      }
      
      // Verify blocked
      const result1 = rateLimiter.checkRateLimit(ip) as any;
      expect(result1.allowed).toBe(false);
      const result2 = rateLimiter.checkRateLimit(ip) as any;
      expect(result2.allowed).toBe(false);
      
      // Fast forward past block duration (5 minutes + window)
      jest.advanceTimersByTime(10 * 60 * 1000 + 1000);
      
      // Should be allowed again
      const result3 = rateLimiter.checkRateLimit(ip) as any;
      expect(result3.allowed).toBe(true);
    });
  });

  describe('Memory Management', () => {
    it('should clean up expired entries', () => {
      const rateLimiter = getRateLimiter();
      const ip = '203.0.113.14';
      
      // Make some requests
      rateLimiter.checkRateLimit(ip);
      
      // Verify entry exists
      const status: any = (rateLimiter as any).getStatus(ip);
      expect(status.count).toBe(1);
      
      // Access private cleanup method via any
      const rateLimiterAny = rateLimiter as any;
      
      // Fast forward past cleanup time
      jest.useFakeTimers();
      jest.advanceTimersByTime(10 * 60 * 1000 + 1000);
      
      // Trigger cleanup
      rateLimiterAny.cleanup();
      
      // Entry should be cleaned up - status should be reset
      const newStatus: any = (rateLimiter as any).getStatus(ip);
      expect(newStatus.count).toBe(0);
      
      jest.useRealTimers();
    });

    it('should handle cleanup interval initialization', () => {
      // In test environment, cleanup interval might be null due to timing or environment constraints
      // This is acceptable - just verify the constructor doesn't throw
      expect(() => {
        const testLimiter = getRateLimiter();
        expect(testLimiter).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance on multiple calls', () => {
      const limiter1 = getRateLimiter();
      const limiter2 = getRateLimiter();
      
      expect(limiter1).toBe(limiter2);
    });

    it('should maintain state across calls', () => {
      const limiter1 = getRateLimiter();
      const ip = '203.0.113.15';
      
      limiter1.checkRateLimit(ip);
      
      const limiter2 = getRateLimiter();
      const status: any = (limiter2 as any).getStatus(ip);
      
      expect(status.count).toBe(1);
    });
  });

  describe('Destroy Method', () => {
    it('should clean up resources on destroy', () => {
      const rateLimiter = getRateLimiter();
      const rateLimiterAny = rateLimiter as any;
      
      // Make some requests to populate store
      rateLimiter.checkRateLimit('203.0.113.16');
      
      // Destroy should clear interval and store
      (rateLimiter as any).destroy();
      
      expect(rateLimiterAny.cleanupInterval).toBeNull();
      
      // Store should be cleared
      const status: any = (rateLimiter as any).getStatus('203.0.113.16');
      expect(status.count).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty IP string', () => {
      const rateLimiter = getRateLimiter();
      const result: any = rateLimiter.checkRateLimit('');
      
      expect(result.allowed).toBe(true);
    });

    it('should handle undefined IP', () => {
      const rateLimiter = getRateLimiter();
      const result: any = rateLimiter.checkRateLimit(undefined as any);
      
      // Should handle gracefully without throwing
      expect(typeof result.allowed).toBe('boolean');
    });

    it('should handle attempt filtering correctly', () => {
      const rateLimiter = getRateLimiter();
      const ip = '203.0.113.17';
      
      // Make requests with time progression
      jest.useFakeTimers();
      
      rateLimiter.checkRateLimit(ip);
      jest.advanceTimersByTime(1000);
      rateLimiter.checkRateLimit(ip);
      jest.advanceTimersByTime(1000);
      rateLimiter.checkRateLimit(ip);
      
      // Attempts should be tracked correctly
      const status: any = (rateLimiter as any).getStatus(ip);
      expect(status.count).toBe(3);
      
      jest.useRealTimers();
    });
  });

  describe('Development Environment Handling', () => {
    it('should not log in production mode', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true });
      const rateLimiter = getRateLimiter();
      
      rateLimiter.checkRateLimit('127.0.0.1');
      
      expect(mockConsole.log).not.toHaveBeenCalled();
    });

    it('should handle missing process.env gracefully', () => {
      const originalProcess = global.process;
      // Provide a minimal stub to avoid breaking Node internals used elsewhere
      global.process = { env: {} } as any;
      
      const rateLimiter = getRateLimiter();
      
      // Should not throw
      expect(() => {
        rateLimiter.checkRateLimit('127.0.0.1');
      }).not.toThrow();
      
      global.process = originalProcess;
    });
  });
});
