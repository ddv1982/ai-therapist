import type { Message } from './index';

// Component-specific prop types for chat components
export interface ChatInterfaceProps {
  sessionId: string;
  initialMessages?: Message[];
}


export interface TypingIndicatorProps {
  isVisible: boolean;
}