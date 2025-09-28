/**
 * Enhanced rate limiter with better persistence and security
 * For local network usage with improved memory management
 */

import { createHash } from 'crypto';
import { logger } from '@/lib/utils/logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  attempts: Array<{ timestamp: number }>;
}

interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  blockDuration: number;
}

import { redisManager } from '@/lib/cache/redis-client';

class RedisRateLimiter {
  private prefix = 'rate_limit';

  private getKey(ip: string, bucket: string): string {
    const hashedIp = this.hashIp(ip);
    return `${this.prefix}:${bucket}:${hashedIp}`;
  }

  private hashIp(ip: string): string {
    if (!ip) return 'anonymous';
    try {
      return createHash('sha256').update(ip).digest('hex');
    } catch {
      return 'anonymous';
    }
  }

  async checkRateLimit(ip: string, bucketName: 'default' | 'api' | 'chat' = 'default'): Promise<{ allowed: boolean; retryAfter?: number }> {
    const config = this.getConfigForBucket(bucketName);
    const key = this.getKey(ip, bucketName);

    const result = await redisManager.executeCommand<{ allowed: boolean; retryAfter?: number }>(async (client) => {
      const tx = client.multi();
      tx.incr(key);
      tx.pTTL(key);
      const execResult = await tx.exec();
      const count = Number(execResult?.[0] ?? 0);
      const ttl = Number(execResult?.[1] ?? config.windowMs);

      if (count === 1) {
        await client.pExpire(key, config.windowMs);
      }

      if (count > config.maxAttempts) {
        return { allowed: false, retryAfter: Math.ceil(ttl / 1000) };
      }

      return { allowed: true };
    }, { allowed: true });

    // Ensure non-null return
    return result || { allowed: true };
  }

  private getConfigForBucket(name: string) {
    const blockMs = Number(process.env.RATE_LIMIT_BLOCK_MS || 5 * 60 * 1000);
    const read = (key: string, fallback: number) => {
      const raw = (process.env as Record<string, string | undefined>)[key];
      const parsed = Number(raw);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    };
    if (name === 'chat') {
      const windowMs = read('CHAT_WINDOW_MS', 5 * 60 * 1000);
      const maxAttempts = read('CHAT_MAX_REQS', 120);
      return { windowMs, maxAttempts, blockDuration: blockMs };
    }
    if (name === 'api') {
      const windowMs = read('API_WINDOW_MS', 5 * 60 * 1000);
      const maxAttempts = read('API_MAX_REQS', 300);
      return { windowMs, maxAttempts, blockDuration: blockMs };
    }
    const windowMs = read('RATE_LIMIT_WINDOW_MS', 5 * 60 * 1000);
    const maxAttempts = read('RATE_LIMIT_MAX_REQS', 50);
    return { windowMs, maxAttempts, blockDuration: blockMs };
  }
}

class NetworkRateLimiter {
  private buckets = new Map<string, { store: Map<string, RateLimitEntry>; config: RateLimitConfig }>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  // Safe accessor for environment without using `any`
  private getNodeEnv(): string | undefined {
    try {
      const maybeProcess = (globalThis as unknown as { process?: { env?: { NODE_ENV?: string } } }).process;
      return typeof maybeProcess?.env?.NODE_ENV === 'string' ? maybeProcess.env.NODE_ENV : undefined;
    } catch {
      return undefined;
    }
  }

  constructor() {
    // Clean up expired entries every 5 minutes (only if setInterval is available)
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 5 * 60 * 1000);
    }
    // Initialize default buckets
    this.ensureBucket('default');
    this.ensureBucket('api');
    this.ensureBucket('chat');
  }

  private getConfigForBucket(name: string): RateLimitConfig {
    const blockMs = Number(process.env.RATE_LIMIT_BLOCK_MS || 5 * 60 * 1000);
    if (name === 'chat') {
      const windowMs = Number(process.env.CHAT_WINDOW_MS || 5 * 60 * 1000);
      const maxAttempts = Number(process.env.CHAT_MAX_REQS || 120);
      return { windowMs, maxAttempts, blockDuration: blockMs };
    }
    if (name === 'api') {
      const windowMs = Number(process.env.API_WINDOW_MS || 5 * 60 * 1000);
      const maxAttempts = Number(process.env.API_MAX_REQS || 300);
      return { windowMs, maxAttempts, blockDuration: blockMs };
    }
    // Default bucket matches legacy behavior: 50 in 5 minutes
    const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 5 * 60 * 1000);
    const maxAttempts = Number(process.env.RATE_LIMIT_MAX_REQS || 50);
    return { windowMs, maxAttempts, blockDuration: blockMs };
  }

  private ensureBucket(name: string): void {
    if (!this.buckets.has(name)) {
      this.buckets.set(name, { store: new Map<string, RateLimitEntry>(), config: this.getConfigForBucket(name) });
    } else {
      const bucket = this.buckets.get(name)!;
      bucket.config = this.getConfigForBucket(name);
    }
  }

  private fingerprintIp(ip: string): string {
    if (!ip) {
      return 'anonymous';
    }
    try {
      return createHash('sha256').update(ip).digest('hex');
    } catch {
      return 'anonymous';
    }
  }

  private formatLegacyIpField(fingerprint: string): string {
    if (!fingerprint || fingerprint === 'anonymous') {
      return 'hashed:anonymous';
    }
    return `hashed:${fingerprint.slice(0, 12)}`;
  }

  /**
   * Check if IP should be exempt from rate limiting
   */
  private isExemptIP(ip: string): boolean {
    // Do not exempt in production (guard process/env for tests that null process)
    const nodeEnv = this.getNodeEnv();
    if (nodeEnv === 'production') {
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
  checkRateLimit(ip: string, bucketName: 'default' | 'api' | 'chat' = 'default'): { allowed: boolean; retryAfter?: number } {
    this.ensureBucket(bucketName);
    const bucket = this.buckets.get(bucketName)!;
    // Always allow exempt IPs (localhost, private networks)
    if (this.isExemptIP(ip)) {
      if (this.getNodeEnv() === 'development') {
        logger.debug('Rate limiter allowing exempt IP', { operation: 'checkRateLimit', bucket: bucketName });
      }
      return { allowed: true };
    }
    const now = Date.now();
    const storageKey = this.fingerprintIp(ip);
    const entry = bucket.store.get(storageKey);

    // No previous attempts
    if (!entry || now > entry.resetTime) {
      bucket.store.set(storageKey, {
        count: 1,
        resetTime: now + bucket.config.windowMs,
        attempts: [{ timestamp: now }]
      });
      return { allowed: true };
    }

    // Check if currently blocked
    if (entry.count >= bucket.config.maxAttempts) {
      const blockExpiry = entry.resetTime + bucket.config.blockDuration;
      if (now < blockExpiry) {
        if (this.getNodeEnv() === 'development') {
          logger.warn('Rate limiter blocking IP', { 
            // do not include raw IP to respect no-IP logging policy
            attempts: entry.count, 
            maxAttempts: bucket.config.maxAttempts,
            retryInSeconds: Math.ceil((blockExpiry - now) / 1000),
            operation: 'checkRateLimit',
            bucket: bucketName
          });
        }
        return { 
          allowed: false, 
          retryAfter: Math.ceil((blockExpiry - now) / 1000) 
        };
      }
      // Block expired, reset
      bucket.store.set(storageKey, {
        count: 1,
        resetTime: now + bucket.config.windowMs,
        attempts: [{ timestamp: now }]
      });
      return { allowed: true };
    }

    // Increment count
    entry.count++;
    entry.attempts.push({ timestamp: now });
    
    // Keep only recent attempts for analysis
    entry.attempts = entry.attempts.filter(
      attempt => attempt.timestamp > now - bucket.config.windowMs
    );

    return { allowed: entry.count <= bucket.config.maxAttempts };
  }

  /**
   * Get current rate limit status for IP
   */
  getStatus(ip: string, bucketName: 'default' | 'api' | 'chat' = 'default'): { count: number; remaining: number; resetTime: number } {
    this.ensureBucket(bucketName);
    const bucket = this.buckets.get(bucketName)!;
    const entry = bucket.store.get(this.fingerprintIp(ip));
    const now = Date.now();

    if (!entry || now > entry.resetTime) {
      return {
        count: 0,
        remaining: bucket.config.maxAttempts,
        resetTime: now + bucket.config.windowMs
      };
    }

    return {
      count: entry.count,
      remaining: Math.max(0, bucket.config.maxAttempts - entry.count),
      resetTime: entry.resetTime
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    this.buckets.forEach((bucket, bucketName) => {
      const toDelete: string[] = [];
      bucket.store.forEach((entry, ip) => {
        if (now > entry.resetTime + bucket.config.blockDuration) {
          toDelete.push(ip);
        }
      });
      toDelete.forEach(ip => bucket.store.delete(ip));
      if (typeof console !== 'undefined' && this.getNodeEnv() === 'development') {
        logger.debug('Rate limiter cleanup completed', { cleanedEntries: toDelete.length, operation: 'cleanup', bucket: bucketName });
      }
    });
  }

  /**
   * Get suspicious activity report
   */
  getSuspiciousActivity(): Array<{ fingerprint: string; ip: string; attempts: number; lastAttempt: number }> {
    const suspicious: Array<{ fingerprint: string; ip: string; attempts: number; lastAttempt: number }> = [];
    // Aggregate across all buckets
    this.buckets.forEach((bucket) => {
      bucket.store.forEach((entry, ip) => {
        if (entry.count >= bucket.config.maxAttempts) {
          const lastAttempt = Math.max(...entry.attempts.map(a => a.timestamp));
          suspicious.push({ fingerprint: ip, ip: this.formatLegacyIpField(ip), attempts: entry.count, lastAttempt });
        }
      });
    });
    return suspicious.sort((a, b) => b.lastAttempt - a.lastAttempt);
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    if (this.cleanupInterval && typeof clearInterval !== 'undefined') {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.buckets.forEach((bucket) => {
      bucket.store.clear();
    });
  }
}

// Singleton instance
let rateLimiter: NetworkRateLimiter | RedisRateLimiter | null = null;

export function getRateLimiter(): NetworkRateLimiter | RedisRateLimiter {
  if (!rateLimiter) {
    if (typeof process !== 'undefined' && process.env?.RATE_LIMIT_USE_REDIS === 'true') {
      rateLimiter = new RedisRateLimiter();
    } else {
      rateLimiter = new NetworkRateLimiter();
    }
  }
  return rateLimiter;
}

// Note: Process cleanup is handled automatically by runtime
