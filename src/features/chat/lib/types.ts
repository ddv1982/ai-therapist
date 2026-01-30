/**
 * Chat Service Types - Minimal shared types used by services
 * Only includes types actually needed by message-persistence and metadata-manager
 */

import type { MessageData } from '@/features/chat/messages/message';

/**
 * Message type used throughout chat system.
 */
export type Message = MessageData;

/**
 * Result type for operations that can fail.
 * Used by services to return success/error states without throwing.
 */
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

/**
 * Creates a successful Result.
 */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Creates a failed Result.
 */
export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Payload for creating a new message.
 */
export interface NewMessagePayload {
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Response from API when saving a message.
 */
export interface SavedMessageResponse {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  modelUsed?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Queued metadata update for messages awaiting persistence.
 */
export interface QueuedMetadataUpdate {
  sessionId: string;
  metadata: Record<string, unknown>;
  mergeStrategy: 'merge' | 'replace';
  retries: number;
}

/**
 * Options for metadata update operations.
 */
export interface MetadataUpdateOptions {
  mergeStrategy?: 'merge' | 'replace';
}

/**
 * Interface for API client used by services.
 * This allows for easy mocking in tests.
 */
export interface IChatApiClient {
  listMessages(
    sessionId: string,
    params?: { page?: number; limit?: number }
  ): Promise<{
    success: boolean;
    data?: {
      items: SavedMessageResponse[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    };
    error?: { message: string; code?: string };
  }>;

  postMessage(
    sessionId: string,
    body: NewMessagePayload
  ): Promise<{
    success: boolean;
    data?: SavedMessageResponse;
    error?: { message: string; code?: string };
  }>;

  patchMessageMetadata(
    sessionId: string,
    messageId: string,
    body: {
      metadata: Record<string, unknown>;
      mergeStrategy?: 'merge' | 'replace';
    }
  ): Promise<{
    success: boolean;
    data?: SavedMessageResponse;
    error?: { message: string; code?: string };
  }>;
}
