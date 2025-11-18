/**
 * Message Component System - Clean Public API
 */

// Main components
export { Message } from './message';
export { MessageAvatar } from './message-avatar';
export { MessageContent } from './message-content';
export { MessageTimestamp } from './message-timestamp';

// Types
export type { MessageData, MessageProps } from './message';

// Re-export design system types for convenience
export type { MessageRole } from '@/lib/ui/design-system/message';
