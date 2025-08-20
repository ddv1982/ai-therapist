/**
 * API Types
 * Type definitions for API requests, responses, and related functionality
 */

// Re-export common API types from main index
export type { 
  ChatRequest, 
  ChatResponse, 
  CreateSessionRequest,
  UpdateSessionRequest,
  SessionsResponse,
  ApiError
} from './index';

// Rate limiting types
export interface RateLimitStatus {
  allowed: boolean;
  count: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface SuspiciousActivity {
  ip: string;
  attempts: number;
  lastAttempt: number;
}

// API middleware types
export interface RequestContext {
  requestId: string;
  ip: string;
  userAgent: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

// Groq API specific types
export interface GroqCompletionParams {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  stream: boolean;
  tools?: Array<{ type: string }>;
  reasoning_effort?: 'low' | 'medium' | 'high';
}

// Memory and context types
export interface MemoryContext {
  sessionTitle: string;
  sessionDate: string;
  reportDate: string;
  summary: string;
  content: string;
}