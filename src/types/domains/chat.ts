/**
 * Chat Domain Types
 * Consolidated types for chat, messages, and streaming functionality
 */

import type { MessageData } from '@/features/chat/messages/message';

// ============================================================================
// CHAT COMPONENT TYPES
// ============================================================================

export interface ChatInterfaceProps {
  sessionId: string;
  initialMessages?: MessageData[];
}

export interface TypingIndicatorProps {
  isVisible: boolean;
}

// ============================================================================
// STREAMING TYPES
// ============================================================================

export type StreamingStage = 'blur' | 'stabilizing' | 'revealed';

export interface StreamingState {
  stage: StreamingStage;
  isStreamingComplete: boolean;
  hasComplexContent: boolean;
}

export interface StreamingConfig {
  enableAnimations: boolean;
  respectMotionPreferences: boolean;
  mobileOptimized: boolean;
}

// ============================================================================
// API TYPES - CHAT (Auto-generated from OpenAPI)
// ============================================================================

export interface ChatMessage {
  /**
   * Format: uuid
   * @description Unique identifier for the message
   * @example msg-123e4567-e89b-12d3-a456-426614174000
   */
  id?: string;
  /**
   * @description The role of the message sender
   * @enum {string}
   */
  role: 'user' | 'assistant';
  /**
   * @description The message content
   * @example I'm struggling with anxiety and need some guidance
   */
  content: string;
  /**
   * Format: date-time
   * @description When the message was created
   */
  timestamp?: string;
  /**
   * Format: date-time
   * @description Database creation timestamp
   */
  createdAt?: string;
}

export interface NewMessage {
  /**
   * @description The role of the message sender
   * @enum {string}
   */
  role: 'user' | 'assistant';
  /** @description The message content */
  content: string;
  /** @description Optional model identifier used for assistant messages */
  modelUsed?: string;
}

export interface ChatRequest {
  /** @description Array of conversation messages */
  messages: {
    /** @enum {string} */
    role?: 'user' | 'assistant';
    content?: string;
  }[];
  /**
   * Format: uuid
   * @description Optional session ID for context
   */
  sessionId?: string;
  /**
   * @description AI model to use
   * @example openai/gpt-oss-120b
   */
  model?: string;
  /** @description Groq API key (if not set in environment) */
  apiKey?: string;
  /**
   * @description Response creativity (0=focused, 2=creative)
   * @example 0.7
   */
  temperature?: number;
  /**
   * @description Maximum response length
   * @example 2000
   */
  maxTokens?: number;
  /**
   * @description Nucleus sampling parameter
   * @example 0.9
   */
  topP?: number;
}

export interface ModelConfig {
  /**
   * @description Model identifier used in API calls
   * @example openai/gpt-oss-120b
   */
  id: string;
  /**
   * @description Human-readable model name
   * @example GPT OSS 120B
   */
  name: string;
  /**
   * @description Model provider/company
   * @example OpenAI
   */
  provider: string;
  /**
   * @description Maximum tokens supported by the model
   * @example 32000
   */
  maxTokens: number;
  /**
   * @description Model category/stability level
   * @example featured
   * @enum {string}
   */
  category: 'featured' | 'production' | 'preview';
}

export interface ApiError {
  /**
   * @description Error message
   * @example Validation failed
   */
  error: string;
  /**
   * @description Detailed error information
   * @example Invalid email address format
   */
  details?: string;
  /**
   * @description Error code for programmatic handling
   * @example VALIDATION_ERROR
   */
  code?: string;
  /**
   * @description Suggested action to resolve the error
   * @example Please check your input and try again
   */
  suggestedAction?: string;
}

// ============================================================================
// API TYPES - MESSAGES (Auto-generated from OpenAPI)
// ============================================================================

export interface MessageListResponse {
  /** @example true */
  success?: boolean;
  data?: {
    items?: ChatMessage[];
    pagination?: {
      page?: number;
      limit?: number;
      total?: number;
      totalPages?: number;
      hasNext?: boolean;
      hasPrev?: boolean;
    };
  };
}
