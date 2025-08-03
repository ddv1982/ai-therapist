export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  createdAt: Date;
}

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