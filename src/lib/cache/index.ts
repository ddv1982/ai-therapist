/**
 * Redis Caching System - Main Export
 *
 * Centralized export for all caching utilities, decorators, and implementations
 * for the AI Therapist application.
 */

// Core caching utilities
export { cacheManager, cache } from './cache-utils';
export * as redis from './redis';

// Decorators and higher-order functions
export {
  Cached,
  withCache,
  CacheInvalidate,
  withSessionCache,
  withApiCache,
  withQueryCache,
  warmUpCache,
  BatchCache,
  batchCache,
} from './cache-decorators';

// API-specific caching implementations
export {
  SessionCache,
  MessageCache,
  CBTDataCache,
  ReportCache,
  UserSessionCache,
  AuthConfigCache,
  DeviceCache,
  TherapyPromptCache,
  CacheWarmer,
  CacheHealthMonitor,
  CACHE_TTL,
  CACHE_KEYS,
} from './api-cache';

// Types
export type { CacheOptions, CacheStats, CacheKeyOptions } from './cache-utils';

export type { CacheDecoratorOptions } from './cache-decorators';
