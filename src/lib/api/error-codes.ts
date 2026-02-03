/**
 * Centralized error code definitions for API responses
 *
 * All error codes are strings that uniquely identify error types.
 * They should be paired with appropriate HTTP status codes and user-friendly messages.
 *
 * Naming convention: SNAKE_CASE, grouped by error category
 */

export enum ApiErrorCode {
  // 400 - Client Errors: Validation and Request Issues
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_REQUEST_FORMAT = 'INVALID_REQUEST_FORMAT',

  // 401 - Authentication Errors
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // 403 - Authorization Errors
  FORBIDDEN = 'FORBIDDEN',
  ACCESS_DENIED = 'ACCESS_DENIED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // 404 - Not Found Errors
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  MESSAGE_NOT_FOUND = 'MESSAGE_NOT_FOUND',
  REPORT_NOT_FOUND = 'REPORT_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',

  // 429 - Rate Limit
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // 500 - Server Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_QUERY_FAILED = 'DATABASE_QUERY_FAILED',
  DATABASE_WRITE_FAILED = 'DATABASE_WRITE_FAILED',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',
  DECRYPTION_ERROR = 'DECRYPTION_ERROR',

  // Specific Feature Errors
  REPORT_GENERATION_FAILED = 'REPORT_GENERATION_FAILED',
  ANALYSIS_PROCESSING_FAILED = 'ANALYSIS_PROCESSING_FAILED',
  CHAT_PROCESSING_FAILED = 'CHAT_PROCESSING_FAILED',
  MESSAGE_PROCESSING_FAILED = 'MESSAGE_PROCESSING_FAILED',
  SESSION_CREATION_FAILED = 'SESSION_CREATION_FAILED',
  SESSION_DELETION_FAILED = 'SESSION_DELETION_FAILED',
  MEMORY_RETRIEVAL_FAILED = 'MEMORY_RETRIEVAL_FAILED',
  MEMORY_DELETION_FAILED = 'MEMORY_DELETION_FAILED',

  // Therapeutic-specific Errors
  INVALID_THERAPEUTIC_CONTEXT = 'INVALID_THERAPEUTIC_CONTEXT',
  CBT_DATA_PARSING_FAILED = 'CBT_DATA_PARSING_FAILED',
  THERAPEUTIC_ANALYSIS_FAILED = 'THERAPEUTIC_ANALYSIS_FAILED',
}

/**
 * Descriptions and recommendations for each error code
 * Used for documentation and error recovery guidance
 */
const ErrorCodeDescriptions: Record<
  ApiErrorCode,
  {
    description: string;
    suggestedAction: string;
    httpStatus: number;
  }
> = {
  // Validation Errors (400)
  [ApiErrorCode.VALIDATION_ERROR]: {
    description: 'Request data failed validation',
    suggestedAction: 'Please check your input data and try again',
    httpStatus: 400,
  },
  [ApiErrorCode.INVALID_INPUT]: {
    description: 'One or more input values are invalid',
    suggestedAction: 'Please verify all input values match the expected format',
    httpStatus: 400,
  },
  [ApiErrorCode.MISSING_REQUIRED_FIELD]: {
    description: 'Required field is missing from request',
    suggestedAction: 'Please provide all required fields and try again',
    httpStatus: 400,
  },
  [ApiErrorCode.INVALID_REQUEST_FORMAT]: {
    description: 'Request format is invalid or malformed',
    suggestedAction: 'Please ensure your request follows the correct format',
    httpStatus: 400,
  },

  // Authentication Errors (401)
  [ApiErrorCode.AUTHENTICATION_ERROR]: {
    description: 'Authentication is required but missing or invalid',
    suggestedAction: 'Please verify your authentication credentials and try again',
    httpStatus: 401,
  },
  [ApiErrorCode.UNAUTHORIZED]: {
    description: 'Request is unauthorized',
    suggestedAction: 'Please authenticate and try again',
    httpStatus: 401,
  },
  [ApiErrorCode.TOKEN_EXPIRED]: {
    description: 'Authentication token has expired',
    suggestedAction: 'Please refresh your authentication and try again',
    httpStatus: 401,
  },
  [ApiErrorCode.INVALID_CREDENTIALS]: {
    description: 'Provided credentials are invalid',
    suggestedAction: 'Please verify your credentials and try again',
    httpStatus: 401,
  },
  [ApiErrorCode.SESSION_EXPIRED]: {
    description: 'User session has expired',
    suggestedAction: 'Please log in again to continue',
    httpStatus: 401,
  },

  // Authorization Errors (403)
  [ApiErrorCode.FORBIDDEN]: {
    description: 'Access to this resource is forbidden',
    suggestedAction: 'Please verify your permissions and try again',
    httpStatus: 403,
  },
  [ApiErrorCode.ACCESS_DENIED]: {
    description: 'You do not have permission to access this resource',
    suggestedAction: 'Please contact an administrator if you believe this is an error',
    httpStatus: 403,
  },
  [ApiErrorCode.INSUFFICIENT_PERMISSIONS]: {
    description: 'Your account does not have sufficient permissions for this operation',
    suggestedAction: 'Please contact an administrator to request access',
    httpStatus: 403,
  },

  // Not Found Errors (404)
  [ApiErrorCode.NOT_FOUND]: {
    description: 'Requested resource was not found',
    suggestedAction: 'Please verify the resource identifier and try again',
    httpStatus: 404,
  },
  [ApiErrorCode.RESOURCE_NOT_FOUND]: {
    description: 'The requested resource does not exist',
    suggestedAction: 'Please check the resource identifier and try again',
    httpStatus: 404,
  },
  [ApiErrorCode.SESSION_NOT_FOUND]: {
    description: 'The requested session was not found',
    suggestedAction: 'Please verify the session ID and try again',
    httpStatus: 404,
  },
  [ApiErrorCode.MESSAGE_NOT_FOUND]: {
    description: 'The requested message was not found',
    suggestedAction: 'Please verify the message ID and try again',
    httpStatus: 404,
  },
  [ApiErrorCode.REPORT_NOT_FOUND]: {
    description: 'The requested report was not found',
    suggestedAction: 'Please verify the report ID and try again',
    httpStatus: 404,
  },
  [ApiErrorCode.USER_NOT_FOUND]: {
    description: 'The requested user was not found',
    suggestedAction: 'Please verify the user ID and try again',
    httpStatus: 404,
  },

  // Rate Limiting (429)
  [ApiErrorCode.RATE_LIMIT_EXCEEDED]: {
    description: 'Too many requests made in a short period',
    suggestedAction: 'Please wait a moment before making another request',
    httpStatus: 429,
  },
  [ApiErrorCode.TOO_MANY_REQUESTS]: {
    description: 'Request limit has been exceeded',
    suggestedAction: 'Please try again later',
    httpStatus: 429,
  },

  // Server Errors (500)
  [ApiErrorCode.INTERNAL_SERVER_ERROR]: {
    description: 'An unexpected server error occurred',
    suggestedAction: 'Please try again later or contact support if the issue persists',
    httpStatus: 500,
  },
  [ApiErrorCode.DATABASE_ERROR]: {
    description: 'Database operation failed',
    suggestedAction: 'Please try again later or contact support if the issue persists',
    httpStatus: 500,
  },
  [ApiErrorCode.DATABASE_QUERY_FAILED]: {
    description: 'Database query execution failed',
    suggestedAction: 'Please try again later or contact support if the issue persists',
    httpStatus: 500,
  },
  [ApiErrorCode.DATABASE_WRITE_FAILED]: {
    description: 'Failed to write data to database',
    suggestedAction: 'Please try again later or contact support if the issue persists',
    httpStatus: 500,
  },
  [ApiErrorCode.AI_SERVICE_ERROR]: {
    description: 'AI service encountered an error',
    suggestedAction: 'Please try again in a moment',
    httpStatus: 500,
  },
  [ApiErrorCode.AI_SERVICE_UNAVAILABLE]: {
    description: 'AI service is temporarily unavailable',
    suggestedAction: 'Please try again shortly',
    httpStatus: 503,
  },
  [ApiErrorCode.ENCRYPTION_ERROR]: {
    description: 'Data encryption failed',
    suggestedAction: 'Please try again or contact support if the issue persists',
    httpStatus: 500,
  },
  [ApiErrorCode.DECRYPTION_ERROR]: {
    description: 'Data decryption failed',
    suggestedAction: 'Please try again or contact support if the issue persists',
    httpStatus: 500,
  },

  // Feature-specific Errors (500)
  [ApiErrorCode.REPORT_GENERATION_FAILED]: {
    description: 'Failed to generate therapeutic report',
    suggestedAction: 'Please try again or contact support if the issue persists',
    httpStatus: 500,
  },
  [ApiErrorCode.ANALYSIS_PROCESSING_FAILED]: {
    description: 'Failed to process analysis data',
    suggestedAction: 'Please try again or contact support if the issue persists',
    httpStatus: 500,
  },
  [ApiErrorCode.CHAT_PROCESSING_FAILED]: {
    description: 'Failed to process chat message',
    suggestedAction: 'Please try again or contact support if the issue persists',
    httpStatus: 500,
  },
  [ApiErrorCode.MESSAGE_PROCESSING_FAILED]: {
    description: 'Failed to process message',
    suggestedAction: 'Please try again or contact support if the issue persists',
    httpStatus: 500,
  },
  [ApiErrorCode.SESSION_CREATION_FAILED]: {
    description: 'Failed to create new session',
    suggestedAction: 'Please try again or contact support if the issue persists',
    httpStatus: 500,
  },
  [ApiErrorCode.SESSION_DELETION_FAILED]: {
    description: 'Failed to delete session',
    suggestedAction: 'Please try again or contact support if the issue persists',
    httpStatus: 500,
  },
  [ApiErrorCode.MEMORY_RETRIEVAL_FAILED]: {
    description: 'Failed to retrieve therapeutic memory',
    suggestedAction: 'Please try again or contact support if the issue persists',
    httpStatus: 500,
  },
  [ApiErrorCode.MEMORY_DELETION_FAILED]: {
    description: 'Failed to delete therapeutic memory',
    suggestedAction: 'Please try again or contact support if the issue persists',
    httpStatus: 500,
  },

  // Therapeutic-specific Errors (500)
  [ApiErrorCode.INVALID_THERAPEUTIC_CONTEXT]: {
    description: 'Therapeutic context validation failed',
    suggestedAction: 'Please provide valid therapeutic context and try again',
    httpStatus: 400,
  },
  [ApiErrorCode.CBT_DATA_PARSING_FAILED]: {
    description: 'Failed to parse cognitive behavioral therapy data',
    suggestedAction: 'Please verify your CBT data format and try again',
    httpStatus: 400,
  },
  [ApiErrorCode.THERAPEUTIC_ANALYSIS_FAILED]: {
    description: 'Therapeutic analysis processing failed',
    suggestedAction: 'Please try again or contact support if the issue persists',
    httpStatus: 500,
  },
};

/**
 * Helper function to get error details by code
 */
export function getErrorDetails(code: ApiErrorCode) {
  return (
    ErrorCodeDescriptions[code] || {
      description: 'An unknown error occurred',
      suggestedAction: 'Please try again or contact support',
      httpStatus: 500,
    }
  );
}

/**
 * Helper function to check if code is a client error (4xx)
 */
export function isClientError(code: ApiErrorCode): boolean {
  const status = getErrorDetails(code).httpStatus;
  return status >= 400 && status < 500;
}

/**
 * Helper function to check if code is a server error (5xx)
 */
export function isServerError(code: ApiErrorCode): boolean {
  const status = getErrorDetails(code).httpStatus;
  return status >= 500;
}

/**
 * Get HTTP status code for error code
 */
export function getHttpStatus(code: ApiErrorCode): number {
  return getErrorDetails(code).httpStatus;
}
