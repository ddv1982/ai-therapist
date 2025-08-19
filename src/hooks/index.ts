/**
 * Hooks Domain - Master Exports
 * Centralized exports for all custom hooks
 */

// Domain-specific exports
export * as auth from './auth';
export * as therapy from './therapy';

// Direct exports for commonly used hooks
export { useAuth } from './auth/use-auth';

// CBT DATA MANAGEMENT (Modern Architecture)
export { useCBTDataManager } from './therapy/use-cbt-data-manager';

// Backward compatible exports for easier migration
export * from './auth/use-auth';

// Legacy hooks removed - modernization complete