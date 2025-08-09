/**
 * Library Domain - Master Exports
 * Centralized exports for all library domains
 * 
 * Usage:
 * - Domain-specific: import { authMiddleware } from '@/lib/auth'
 * - Cross-domain: import { utils, auth, api } from '@/lib'
 */

// Re-export all domains as namespaces for organized imports
export * as auth from './auth';
export * as api from './api'; 
export * as chat from './chat';
export * as therapy from './therapy';
export * as ui from './ui';
export * as database from './database';
export * as utils from './utils';

// Common direct exports for frequently used utilities
export { cn } from './utils/utils';
export { logger } from './utils/logger';
export { validateApiAuth } from './api/api-auth';
export { buildMemoryEnhancedPrompt } from './therapy/therapy-prompts';

// Backward compatible exports for easier migration
// Auth domain
export * from './auth/auth-middleware';
export * from './auth/device-fingerprint';
export * from './auth/user-session';

// API domain
export * from './api/api-auth';
export * from './api/groq-client';
export * from './api/rate-limiter';

// Chat domain
export * from './chat/session-reducer';
export * from './chat/memory-utils';
export * from './chat/message-encryption';

// Therapy domain
export * from './therapy/therapy-prompts';
export * from './therapy/cbt-template';

// UI domain
export * from './ui/design-tokens';
export * from './ui/markdown-processor';

// Database domain
export * from './database/db';

// Utils domain
export * from './utils/utils';
export * from './utils/validation';
export * from './utils/error-utils';
export * from './utils/logger';