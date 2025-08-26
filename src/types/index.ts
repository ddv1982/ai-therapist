/**
 * Types - Essential Re-exports
 * Core types without circular dependencies
 */

// Message types from their actual location
export type { MessageData as Message } from '@/features/chat/messages/message';
export type { MessageRole } from '@/lib/design-system/message';
export type { ApiResponse } from '@/lib/api/api-response';

// Session types
import type { Session as SessionType } from '@/lib/chat/session-reducer';
export type Session = SessionType;

// Basic types that don't create circular deps
export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}

// Chat and API request/response types
export interface ChatRequest {
  message: string;
  sessionId?: string;
}

export interface ChatResponse {
  message: string;
  sessionId: string;
}

export interface CreateSessionRequest {
  title?: string;
}

export interface UpdateSessionRequest {
  title?: string;
}

export interface SessionsResponse {
  sessions: Session[];
}

// UI Configuration types
export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  temperature: number;
  topP: number;
}

export interface ChatSettings {
  model: string; // Model ID
  maxTokens: number;
  temperature: number;
  topP: number;
  systemPrompt?: string;
  webSearchEnabled: boolean; // Add websearch toggle
}

// Component prop types
export interface SessionControlsProps {
  sessionId?: string;
  onStartSession: () => void | Promise<void>;
  onEndSession: () => void | Promise<void>;
  sessionDuration: number;
  status: string;
}