// Re-export types from centralized location
export type { Message, ChatState, ChatSettings, ChatRequest, ChatResponse } from './index';
import type { Message } from './index';

// Component-specific prop types
export interface ChatInterfaceProps {
  sessionId: string;
  initialMessages?: Message[];
}

export interface MessageBubbleProps {
  message: Message;
  isUser: boolean;
  timestamp: Date;
}

export interface TypingIndicatorProps {
  isVisible: boolean;
}