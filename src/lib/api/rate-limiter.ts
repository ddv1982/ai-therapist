/**
 * Enhanced rate limiter with better persistence and security
 * For local network usage with improved memory management
 */

import { logger } from '@/lib/utils/logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  attempts: Array<{ timestamp: number; ip: string }>;
}

interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  blockDuration: number;
}

class NetworkRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  private readonly config: RateLimitConfig = {
    windowMs: 5 * 60 * 1000, // 5 minutes - shorter window for better UX
    maxAttempts: 50, // Much higher limit for therapeutic single-user context
    blockDuration: 5 * 60 * 1000, // 5 minutes for blocked IPs - shorter recovery time
  };

  constructor() {
    // Clean up expired entries every 5 minutes (only if setInterval is available)
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Check if IP should be exempt from rate limiting
   */
  private isExemptIP(ip: string): boolean {
    // Do not exempt in production
    if (process?.env?.NODE_ENV === 'production') {
      return false;
    }
    // Handle undefined or null IP
    if (!ip) {
      return false;
    }
    
    // Allow localhost and private network ranges for development
    const exemptIPs = [
      'localhost',
      '127.0.0.1',
      '::1',
      'unknown',
      '192.168.',
      '10.0.',
      '172.16.',
      '172.17.',
      '172.18.',
      '172.19.',
      '172.20.',
      '172.21.',
      '172.22.',
      '172.23.',
      '172.24.',
      '172.25.',
      '172.26.',
      '172.27.',
      '172.28.',
      '172.29.',
      '172.30.',
      '172.31.'
    ];
    
    return exemptIPs.some(exemptIP => ip.includes(exemptIP));
  }

  /**
   * Check if IP is allowed to make a request
   */
  checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
    // Always allow exempt IPs (localhost, private networks)
    if (this.isExemptIP(ip)) {
      if (process?.env?.NODE_ENV === 'development') {
        logger.debug('Rate limiter allowing exempt IP', { ip, operation: 'checkRateLimit' });
      }
      return { allowed: true };
    }
    const now = Date.now();
    const entry = this.store.get(ip);

    // No previous attempts
    if (!entry || now > entry.resetTime) {
      this.store.set(ip, {
        count: 1,
        resetTime: now + this.config.windowMs,
        attempts: [{ timestamp: now, ip }]
      });
      return { allowed: true };
    }

    // Check if currently blocked
    if (entry.count >= this.config.maxAttempts) {
      const blockExpiry = entry.resetTime + this.config.blockDuration;
      if (now < blockExpiry) {
        if (process?.env?.NODE_ENV === 'development') {
          logger.warn('Rate limiter blocking IP', { 
            // do not include raw IP to respect no-IP logging policy
            attempts: entry.count, 
            maxAttempts: this.config.maxAttempts,
            retryInSeconds: Math.ceil((blockExpiry - now) / 1000),
            operation: 'checkRateLimit'
          });
        }
        return { 
          allowed: false, 
          retryAfter: Math.ceil((blockExpiry - now) / 1000) 
        };
      }
      // Block expired, reset
      this.store.set(ip, {
        count: 1,
        resetTime: now + this.config.windowMs,
        attempts: [{ timestamp: now, ip }]
      });
      return { allowed: true };
    }

    // Increment count
    entry.count++;
    entry.attempts.push({ timestamp: now, ip });
    
    // Keep only recent attempts for analysis
    entry.attempts = entry.attempts.filter(
      attempt => attempt.timestamp > now - this.config.windowMs
    );

    return { allowed: entry.count <= this.config.maxAttempts };
  }

  /**
   * Get current rate limit status for IP
   */
  getStatus(ip: string): { count: number; remaining: number; resetTime: number } {
    const entry = this.store.get(ip);
    const now = Date.now();

    if (!entry || now > entry.resetTime) {
      return {
        count: 0,
        remaining: this.config.maxAttempts,
        resetTime: now + this.config.windowMs
      };
    }

    return {
      count: entry.count,
      remaining: Math.max(0, this.config.maxAttempts - entry.count),
      resetTime: entry.resetTime
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [ip, entry] of Array.from(this.store.entries())) {
      // Remove entries that are fully expired (including block time)
      if (now > entry.resetTime + this.config.blockDuration) {
        toDelete.push(ip);
      }
    }

    toDelete.forEach(ip => this.store.delete(ip));
    
    // Optional logging in development
    if (typeof console !== 'undefined' && process?.env?.NODE_ENV === 'development') {
      logger.debug('Rate limiter cleanup completed', { 
        cleanedEntries: toDelete.length,
        operation: 'cleanup'
      });
    }
  }

  /**
   * Get suspicious activity report
   */
  getSuspiciousActivity(): Array<{ ip: string; attempts: number; lastAttempt: number }> {
    const suspicious: Array<{ ip: string; attempts: number; lastAttempt: number }> = [];

    for (const [ip, entry] of Array.from(this.store.entries())) {
      if (entry.count >= this.config.maxAttempts) {
        const lastAttempt = Math.max(...entry.attempts.map(a => a.timestamp));
        suspicious.push({
          ip,
          attempts: entry.count,
          lastAttempt
        });
      }
    }

    return suspicious.sort((a: { lastAttempt: number }, b: { lastAttempt: number }) => b.lastAttempt - a.lastAttempt);
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    if (this.cleanupInterval && typeof clearInterval !== 'undefined') {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// Singleton instance
let rateLimiter: NetworkRateLimiter | null = null;

export function getRateLimiter(): NetworkRateLimiter {
  if (!rateLimiter) {
    rateLimiter = new NetworkRateLimiter();
  }
  return rateLimiter;
}

// Note: Process cleanup is handled automatically by runtime