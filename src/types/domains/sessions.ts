/**
 * Sessions Domain Types
 * Consolidated types for session management and API operations
 */

// ============================================================================
// API TYPES - SESSIONS (Auto-generated from OpenAPI)
// ============================================================================

export interface Session {
  /**
   * Format: uuid
   * @description Unique session identifier
   * @example 123e4567-e89b-12d3-a456-426614174000
   */
  id: string;
  /**
   * @description Canonical authenticated user identifier (Clerk user ID)
   * @example user_2xYzAbCdEfGhIjKl
   */
  userId: string;
  /**
   * @description Human-readable session title
   * @example Managing Work Stress
   */
  title: string;
  /**
   * @description Current session status
   * @enum {string}
   */
  status: 'active' | 'completed';
  /**
   * Format: date-time
   * @description When the session was started
   */
  startedAt?: string;
  /**
   * Format: date-time
   * @description When the session was completed
   */
  endedAt?: string | null;
  /**
   * Format: date-time
   * @description Database creation timestamp
   */
  createdAt?: string;
  /**
   * Format: date-time
   * @description Database update timestamp
   */
  updatedAt?: string;
  _count?: {
    /**
     * @description Number of messages in this session
     * @example 12
     */
    messages?: number;
  };
}
