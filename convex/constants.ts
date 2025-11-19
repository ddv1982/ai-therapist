/**
 * Shared constants for Convex queries and mutations
 * Centralizes limits and configuration values
 */

/**
 * Maximum number of items to fetch per request
 * Prevents excessive memory usage and network transfer
 */
export const QUERY_LIMITS = {
  /** Maximum sessions to return in a single query */
  MAX_SESSIONS_PER_REQUEST: 100,
  
  /** Maximum messages to return in a single query */
  MAX_MESSAGES_PER_REQUEST: 200,
  
  /** Maximum reports to return in a single query */
  MAX_REPORTS_PER_REQUEST: 50,
  
  /** Default limit when not specified */
  DEFAULT_LIMIT: 50,
} as const;

/**
 * Default pagination values
 */
export const PAGINATION_DEFAULTS = {
  /** Default offset for pagination */
  DEFAULT_OFFSET: 0,
  
  /** Minimum offset (floor) */
  MIN_OFFSET: 0,
} as const;
