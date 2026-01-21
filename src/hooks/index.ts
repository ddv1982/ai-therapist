/**
 * Hooks Domain - Essential Exports
 * Centralized exports for commonly used hooks
 */

// CBT DATA MANAGEMENT (Modern Architecture)
export { useCBTDataManager } from './therapy/use-cbt-data-manager';

// Chat hooks
export { useTherapyChat } from './chat/use-therapy-chat';
export { useMemoryContext } from './use-memory-context';
export { useSelectSession } from './use-select-session';
export { useChatSessions } from './chat/use-chat-sessions';
export { useChatViewport } from './chat/use-chat-viewport';

// Form utility hooks
export { useDraftSaving } from './use-draft-saving';
export type { UseDraftSavingOptions, UseDraftSavingReturn } from './use-draft-saving';

// Accessibility hooks (WCAG 2.1 AA compliance)
export { useFocusTrap, useFocusReturn } from './use-focus-trap';
