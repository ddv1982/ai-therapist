/**
 * Centralized error code system for consistent error handling
 * across Convex functions and Next.js API responses.
 *
 * This file provides:
 * - ErrorCode const object with all error types
 * - ErrorCode type for type safety
 * - AppError interface for structured errors
 * - createAppError() helper function
 */

/**
 * Error codes as const object for both runtime and type safety.
 * Use these codes consistently across Convex functions and API responses.
 */
export const ErrorCode = {
  // Authentication errors (401)
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Authorization errors (403)
  FORBIDDEN: 'FORBIDDEN',

  // Client errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Not found errors (404)
  NOT_FOUND: 'NOT_FOUND',

  // Conflict errors (409)
  CONFLICT: 'CONFLICT',

  // Server errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',

  // Service availability errors (503)
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Rate limiting errors (429)
  RATE_LIMITED: 'RATE_LIMITED',
} as const;

/**
 * Type for error codes - union of all ErrorCode values.
 */
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Structured application error interface.
 * Use this interface for consistent error representation.
 */
export interface AppError {
  /** Error code from ErrorCode enum */
  code: ErrorCode;
  /** Human-readable error message */
  message: string;
  /** Optional additional details for debugging (never expose sensitive data) */
  details?: string;
}

/**
 * HTTP status codes mapped to error codes.
 */
export const ErrorCodeToHttpStatus: Record<ErrorCode, number> = {
  [ErrorCode.UNAUTHENTICATED]: 401,
  [ErrorCode.SESSION_EXPIRED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.RATE_LIMITED]: 429,
};

/**
 * Default user-friendly messages for each error code.
 */
export const ErrorCodeToMessage: Record<ErrorCode, string> = {
  [ErrorCode.UNAUTHENTICATED]: 'Authentication required',
  [ErrorCode.SESSION_EXPIRED]: 'Session has expired',
  [ErrorCode.FORBIDDEN]: 'Access denied',
  [ErrorCode.VALIDATION_ERROR]: 'Invalid input',
  [ErrorCode.INVALID_INPUT]: 'Invalid input provided',
  [ErrorCode.NOT_FOUND]: 'Resource not found',
  [ErrorCode.CONFLICT]: 'Resource conflict',
  [ErrorCode.INTERNAL_ERROR]: 'Something went wrong',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
  [ErrorCode.RATE_LIMITED]: 'Too many requests',
};

/**
 * Creates a structured AppError with consistent formatting.
 *
 * @param code - Error code from ErrorCode enum
 * @param message - Optional custom message (defaults to standard message for code)
 * @param details - Optional details for debugging (never include sensitive data)
 * @returns AppError object
 *
 * @example
 * ```ts
 * // With default message
 * const error = createAppError(ErrorCode.UNAUTHENTICATED);
 * // { code: 'UNAUTHENTICATED', message: 'Authentication required' }
 *
 * // With custom message
 * const error = createAppError(ErrorCode.NOT_FOUND, 'Session not found');
 * // { code: 'NOT_FOUND', message: 'Session not found' }
 *
 * // With details
 * const error = createAppError(ErrorCode.VALIDATION_ERROR, 'Invalid email', 'Email format is incorrect');
 * // { code: 'VALIDATION_ERROR', message: 'Invalid email', details: 'Email format is incorrect' }
 * ```
 */
export function createAppError(code: ErrorCode, message?: string, details?: string): AppError {
  return {
    code,
    message: message ?? ErrorCodeToMessage[code],
    ...(details !== undefined && { details }),
  };
}

/**
 * Gets the HTTP status code for an error code.
 *
 * @param code - Error code from ErrorCode enum
 * @returns HTTP status code
 */
export function getHttpStatusForErrorCode(code: ErrorCode): number {
  return ErrorCodeToHttpStatus[code] ?? 500;
}

/**
 * Type guard to check if a string is a valid ErrorCode.
 *
 * @param value - Value to check
 * @returns True if value is a valid ErrorCode
 */
export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && Object.values(ErrorCode).includes(value as ErrorCode);
}
