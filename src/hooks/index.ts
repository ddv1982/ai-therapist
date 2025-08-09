/**
 * Hooks Domain - Master Exports
 * Centralized exports for all custom hooks
 */

// Domain-specific exports
export * as auth from './auth';
export * as therapy from './therapy';

// Direct exports for commonly used hooks
export { useAuth } from './auth/use-auth';
export { useCBTForm } from './therapy/use-cbt-form';

// Backward compatible exports for easier migration
export * from './auth/use-auth';
export * from './therapy/use-cbt-form';