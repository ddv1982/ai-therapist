/**
 * Hooks Domain - Essential Exports
 * Centralized exports for commonly used hooks
 */

// SIMPLIFIED HOOKS (Phase 3 Refactoring)
export * from './use-session';
export * from './use-cbt';
export * from './use-chat-integration';
export * from './use-notifications';

// CBT DATA MANAGEMENT (Modern Architecture)
export { useCBTDataManager } from './therapy/use-cbt-data-manager';

// Chat hooks
export { useChatMessages } from './use-chat-messages';