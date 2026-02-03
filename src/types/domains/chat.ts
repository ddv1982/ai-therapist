/**
 * Chat Domain Types
 * Consolidated types for chat, messages, and streaming functionality
 */

// ============================================================================
// STREAMING TYPES
// ============================================================================
export type StreamingStage = 'blur' | 'stabilizing' | 'revealed';

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
