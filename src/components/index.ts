/**
 * Components Domain - Master Exports
 * Centralized exports for all component domains
 */

// Domain-specific exports
export * as auth from './auth';
export * as chat from './chat';
export * as therapy from './therapy';
export * as messages from './messages';
export * as ui from './ui';
export * as providers from './providers';

// Direct exports for commonly used components
export * from './messages';
export * from './providers';

// UI components (flattened for convenience)
export * from './ui/primitives';
export * from './ui/enhanced';
export * from './ui/layout';

// Backward compatible exports for easier migration
// Auth components
export * from './auth/auth-guard';
export * from './auth/security-settings';

// Chat components
export * from './chat/chat-interface';
export * from './chat/chat-settings';
export * from './chat/session-controls';
export * from './chat/session-sidebar';

// Message components
export * from './messages/message';
export * from './messages/message-avatar';
export * from './messages/message-content';
export * from './messages/message-timestamp';

// Provider components
export * from './providers/theme-provider';

// Layout exports for backward compatibility
export { ErrorBoundary } from './ui/layout/error-boundary';