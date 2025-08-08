/**
 * Message Component System - Clean Public API
 */

// Main components
export { Message } from './Message';
export { MessageAvatar } from './MessageAvatar';
export { MessageContent } from './MessageContent';
export { MessageTimestamp } from './MessageTimestamp';

// Types
export type { MessageData, MessageProps } from './Message';

// Re-export design system types for convenience
export type { MessageRole } from '@/lib/design-system/message';