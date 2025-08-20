import type { MessageData } from '@/features/chat/messages/message';

// Component-specific prop types for chat components
export interface ChatInterfaceProps {
  sessionId: string;
  initialMessages?: MessageData[];
}


export interface TypingIndicatorProps {
  isVisible: boolean;
}