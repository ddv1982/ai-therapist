/**
 * Consolidated Helper Utilities
 *
 * A comprehensive collection of utility functions for common operations
 * including classnames, formatters, dates, JSON parsing, storage, deduplication,
 * and performance optimizations.
 *
 * @module helpers
 */

import React, { lazy, ComponentType, LazyExoticComponent } from 'react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { logger } from '@/lib/utils/logger';
import { isDevelopment } from '@/config/env.public';

// ============================================================================
// CLASSNAMES AND FORMATTERS
// ============================================================================

/**
 * Combines and merges Tailwind CSS class names intelligently.
 *
 * Uses clsx for conditional classes and tailwind-merge to resolve
 * conflicting Tailwind utilities, ensuring the last class takes precedence.
 *
 * @param {...ClassValue} inputs - Class names, objects, or arrays to merge
 * @returns {string} Merged and deduplicated class string
 *
 * @example
 * ```tsx
 * // Basic usage
 * cn('px-4', 'py-2', 'bg-blue-500')
 * // => 'px-4 py-2 bg-blue-500'
 *
 * // Conditional classes
 * cn('btn', isActive && 'btn-active', isDisabled && 'btn-disabled')
 *
 * // Overriding Tailwind classes (last wins)
 * cn('px-4 py-2', 'px-6')
 * // => 'py-2 px-6'
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function generateSessionTitle(): string {
  const now = new Date();
  return `Session ${now.toLocaleDateString()} ${now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export {
  generateSecureUUID as generateUUID,
  generateSecureRandomString,
  generateSecureHex,
  generateRequestId,
  generateSessionToken,
} from '@/lib/auth/crypto-secure';

export function isLocalhost(host: string): boolean {
  if (!host) return false;

  // Special case for IPv6 localhost, as split(':') would break it
  if (host === '::1') return true;

  const cleanHost = host.toLowerCase().split(':')[0];

  return (
    cleanHost === 'localhost' ||
    cleanHost === '127.0.0.1' ||
    cleanHost === '::1' ||
    cleanHost === '0.0.0.0'
  );
}

export function isPrivateNetworkAccess(host: string): boolean {
  if (!host) return false;
  const cleanHost = host.toLowerCase().split(':')[0];
  return (
    /192\.168\.\d+\.\d+/.test(cleanHost) ||
    /10\.\d+\.\d+\.\d+/.test(cleanHost) ||
    /172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+/.test(cleanHost)
  );
}

// ============================================================================
// SAFE JSON PARSING
// ============================================================================

export type SafeParseResult<T> = { ok: true; data: T } | { ok: false };

export function safeParse<T = unknown>(text: string): SafeParseResult<T> {
  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    return { ok: false };
  }
}

export function safeParseFromMatch<T = unknown>(
  match: string | undefined | null
): SafeParseResult<T> {
  if (!match || typeof match !== 'string') return { ok: false };
  return safeParse<T>(match);
}

// ============================================================================
// STORAGE MANAGEMENT
// ============================================================================

export interface StorageInfo {
  used: number;
  quota: number;
  available: number;
  usagePercentage: number;
}

export async function getStorageInfo(): Promise<StorageInfo | null> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const used = estimate.usage || 0;
      const available = quota - used;
      const usagePercentage = quota > 0 ? (used / quota) * 100 : 0;

      return {
        used,
        quota,
        available,
        usagePercentage,
      };
    }
  } catch (error) {
    logger.warn('Failed to get storage estimate', {
      operation: 'getStorageInfo',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  return null;
}

export function cleanupLocalStorage(): void {
  try {
    const itemsToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (key === 'persist:therapeuticAI' || key === 'currentSessionId') {
        continue;
      }

      try {
        const item = localStorage.getItem(key);
        if (!item) continue;

        if (item.length > 1024 * 1024) {
          itemsToRemove.push(key);
        }
      } catch {
        itemsToRemove.push(key);
      }
    }

    itemsToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
        logger.info('Removed large/corrupted localStorage item', {
          operation: 'cleanupLocalStorage',
          key,
        });
      } catch (error) {
        logger.warn('Failed to remove localStorage item', {
          operation: 'cleanupLocalStorage',
          key,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  } catch (error) {
    logger.error('Storage cleanup failed', {
      operation: 'cleanupLocalStorage',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function shouldCleanupStorage(): Promise<boolean> {
  try {
    const info = await getStorageInfo();
    return info ? info.usagePercentage > 90 : false;
  } catch {
    return false;
  }
}

export async function initializeStorage(): Promise<void> {
  try {
    if (await shouldCleanupStorage()) {
      logger.info('Storage usage high, performing cleanup', {
        operation: 'initializeStorage',
      });
      cleanupLocalStorage();
    }
  } catch (error) {
    logger.error('Storage initialization failed', {
      operation: 'initializeStorage',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// ============================================================================
// REQUEST DEDUPLICATION
// ============================================================================

interface DeduplicationEntry {
  promise: Promise<unknown>;
  timestamp: number;
  ttl: number;
}

class RequestDeduplicator {
  private entries = new Map<string, DeduplicationEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  static generateKey(
    userId: string,
    operation: string,
    resource?: string,
    sessionId?: string
  ): string {
    const parts = [userId, operation];
    if (resource) parts.push(resource);
    if (sessionId) parts.push(sessionId);
    return parts.join(':');
  }

  deduplicate<T>(key: string, operation: () => Promise<T>, ttlMs: number = 5000): Promise<T> {
    const now = Date.now();
    const existing = this.entries.get(key);

    if (existing && now < existing.timestamp + existing.ttl) {
      return existing.promise as Promise<T>;
    }

    const promise = operation().finally(() => {
      this.entries.delete(key);
    });

    this.entries.set(key, {
      promise,
      timestamp: now,
      ttl: ttlMs,
    });

    return promise;
  }

  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    this.entries.forEach((entry, key) => {
      if (now > entry.timestamp + entry.ttl) {
        toDelete.push(key);
      }
    });

    toDelete.forEach((key) => this.entries.delete(key));
  }

  getStats(): { activeRequests: number; totalKeys: number } {
    return {
      activeRequests: this.entries.size,
      totalKeys: this.entries.size,
    };
  }

  clear(): void {
    this.entries.clear();
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.entries.clear();
  }
}

const deduplicator = new RequestDeduplicator();

export function deduplicateRequest<T>(
  userId: string,
  operation: string,
  asyncOperation: () => Promise<T>,
  resource?: string,
  ttlMs: number = 5000
): Promise<T> {
  const key = RequestDeduplicator.generateKey(userId, operation, resource);
  return deduplicator.deduplicate(key, asyncOperation, ttlMs);
}

export function deduplicateWithKey<T>(
  key: string,
  asyncOperation: () => Promise<T>,
  ttlMs: number = 5000
): Promise<T> {
  return deduplicator.deduplicate(key, asyncOperation, ttlMs);
}

export function getDeduplicationStats() {
  return deduplicator.getStats();
}

export function clearDeduplicationCache() {
  deduplicator.clear();
}

export { deduplicator };

// ============================================================================
// PERFORMANCE UTILITIES - DYNAMIC COMPONENT LOADING
// ============================================================================

export function createLazyComponent<T = object>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  componentName: string
): LazyExoticComponent<ComponentType<T>> {
  return lazy(async () => {
    const startTime = performance.now();

    try {
      const component = await importFn();
      const loadTime = performance.now() - startTime;

      if (isDevelopment) {
        logger.debug('Component loaded', {
          componentName,
          loadTime: Math.round(loadTime),
          operation: 'lazyLoading',
        });
      }

      return component;
    } catch (error) {
      logger.error(`Failed to load component ${componentName}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        componentName,
        loadTime: performance.now() - startTime,
      });

      // Return a fallback component using createElement to avoid JSX in .ts file
      return {
        default: (() =>
          React.createElement(
            'div',
            { className: 'text-muted-foreground p-4 text-center' },
            React.createElement('p', null, 'Unable to load component. Please refresh the page.')
          )) as ComponentType<T>,
      };
    }
  });
}

export function preloadComponent<T = Record<string, unknown>>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  componentName: string
): void {
  const preload = () => {
    importFn()
      .then(() => {
        if (isDevelopment) {
          logger.debug('Component preloaded', {
            componentName,
            operation: 'preloading',
          });
        }
      })
      .catch((error) => {
        logger.warn(`Failed to preload component ${componentName}`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          componentName,
        });
      });
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(preload);
  } else {
    setTimeout(preload, 100);
  }
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export class TherapeuticPerformanceMonitor {
  private static instance: TherapeuticPerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): TherapeuticPerformanceMonitor {
    if (!TherapeuticPerformanceMonitor.instance) {
      TherapeuticPerformanceMonitor.instance = new TherapeuticPerformanceMonitor();
    }
    return TherapeuticPerformanceMonitor.instance;
  }

  recordLoadTime(componentName: string, loadTime: number): void {
    if (!this.metrics.has(componentName)) {
      this.metrics.set(componentName, []);
    }

    const times = this.metrics.get(componentName)!;
    times.push(loadTime);

    if (times.length > 10) {
      times.shift();
    }
  }

  getAverageLoadTime(componentName: string): number {
    const times = this.metrics.get(componentName);
    if (!times || times.length === 0) return 0;

    const sum = times.reduce((acc, time) => acc + time, 0);
    return sum / times.length;
  }

  getPerformanceReport(): Record<
    string,
    {
      averageLoadTime: number;
      measurements: number;
      performance: 'excellent' | 'good' | 'fair' | 'poor';
    }
  > {
    const report: Record<
      string,
      {
        averageLoadTime: number;
        measurements: number;
        performance: 'excellent' | 'good' | 'fair' | 'poor';
      }
    > = {};

    this.metrics.forEach((times, componentName) => {
      const averageLoadTime = this.getAverageLoadTime(componentName);

      let performance: 'excellent' | 'good' | 'fair' | 'poor';
      if (averageLoadTime < 100) performance = 'excellent';
      else if (averageLoadTime < 250) performance = 'good';
      else if (averageLoadTime < 500) performance = 'fair';
      else performance = 'poor';

      report[componentName] = {
        averageLoadTime: Math.round(averageLoadTime),
        measurements: times.length,
        performance,
      };
    });

    return report;
  }
}

// ============================================================================
// MESSAGE CACHE FOR MEMORY OPTIMIZATION
// ============================================================================

interface MessageLike {
  id: string;
  role: string;
  content: string;
  timestamp: Date;
}

interface CacheEntry {
  messages: MessageLike[];
  timestamp: number;
  size: number;
}

export class TherapeuticMessageCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxCacheSize = 1000;
  private maxSessionAge = 24 * 60 * 60 * 1000;

  setMessages(sessionId: string, messages: MessageLike[]): void {
    const limitedMessages = messages.slice(-this.maxCacheSize);

    this.cache.set(sessionId, {
      messages: limitedMessages,
      timestamp: Date.now(),
      size: JSON.stringify(limitedMessages).length,
    });

    if (this.cache.size > 10) {
      this.cleanup();
    }
  }

  getMessages(sessionId: string): MessageLike[] | null {
    const cached = this.cache.get(sessionId);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.maxSessionAge) {
      this.cache.delete(sessionId);
      return null;
    }

    return cached.messages;
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((value, key) => {
      if (now - value.timestamp > this.maxSessionAge) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));

    if (isDevelopment) {
      logger.debug('Message cache cleanup completed', {
        cleanedSessions: keysToDelete.length,
        operation: 'cacheCleanup',
      });
    }
  }

  getCacheStats(): {
    totalSessions: number;
    totalSize: number;
    averageSessionSize: number;
  } {
    let totalSize = 0;
    let sessionCount = 0;

    this.cache.forEach((value) => {
      totalSize += value.size;
      sessionCount++;
    });

    return {
      totalSessions: sessionCount,
      totalSize: Math.round(totalSize / 1024),
      averageSessionSize: sessionCount > 0 ? Math.round(totalSize / sessionCount / 1024) : 0,
    };
  }
}

// ============================================================================
// THERAPEUTIC UI OPTIMIZATION
// ============================================================================

export function optimizeMessageRendering(messages: MessageLike[]): {
  visibleMessages: MessageLike[];
  totalCount: number;
  shouldVirtualize: boolean;
} {
  const VIRTUALIZATION_THRESHOLD = 100;
  const INITIAL_VISIBLE_COUNT = 50;

  const shouldVirtualize = messages.length > VIRTUALIZATION_THRESHOLD;

  if (shouldVirtualize) {
    const visibleMessages = messages.slice(-INITIAL_VISIBLE_COUNT);

    return {
      visibleMessages,
      totalCount: messages.length,
      shouldVirtualize: true,
    };
  }

  return {
    visibleMessages: messages,
    totalCount: messages.length,
    shouldVirtualize: false,
  };
}

export function createDebouncedInputHandler(
  handler: (value: string) => void,
  delay: number = 300
): (value: string) => void {
  let timeoutId: NodeJS.Timeout;

  return (value: string) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => handler(value), delay);
  };
}

export function createThrottledScrollHandler(
  handler: (event: Event) => void,
  delay: number = 100
): (event: Event) => void {
  let isThrottled = false;

  return (event: Event) => {
    if (isThrottled) return;

    isThrottled = true;
    requestAnimationFrame(() => {
      handler(event);
      setTimeout(() => {
        isThrottled = false;
      }, delay);
    });
  };
}

// ============================================================================
// SINGLETON EXPORTS
// ============================================================================

export const performanceMonitor = TherapeuticPerformanceMonitor.getInstance();
export const messageCache = new TherapeuticMessageCache();

export const preloadTherapeuticComponents = () => {
  // Settings panel removed - models are now automatically selected
};

if (isDevelopment) {
  const g = globalThis as unknown as { __THERA_PERF_REPORTER_SET__?: boolean };
  if (!g.__THERA_PERF_REPORTER_SET__) {
    g.__THERA_PERF_REPORTER_SET__ = true;
    setInterval(() => {
      const report = performanceMonitor.getPerformanceReport();
      const cacheStats = messageCache.getCacheStats();

      if (Object.keys(report).length > 0) {
        logger.debug('Therapeutic app performance report', {
          performanceReport: report,
          cacheStatistics: cacheStats,
          operation: 'performanceReporting',
        });
      }
    }, 30000);
  }
}
