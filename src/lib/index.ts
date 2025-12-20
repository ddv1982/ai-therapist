/**
 * Library Domain - Essential Exports
 * Common utilities and functions
 */

// Essential utilities
export { cn } from './utils/helpers';
export { logger } from './utils/logger';

// Therapy utilities
export { buildMemoryEnhancedPrompt } from '@/features/therapy/lib/therapy-prompts';

// Database
// (Prisma removed; using Convex)
