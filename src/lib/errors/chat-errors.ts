/**
 * Custom error classes for chat and AI-related operations
 *
 * These errors provide specific context and suggested actions for chat failures.
 *
 * Note: This file maintains backward compatibility with existing ApiErrorCode usage
 * while also supporting the new ErrorCode enum from error-codes.ts.
 */

import { ApiErrorCode, getErrorDetails } from '@/lib/api/error-codes';
import { ErrorCode as AppErrorCode, type AppError } from './error-codes';

export interface ChatErrorOptions {
  code: ApiErrorCode;
  userMessage: string;
  details?: string;
  suggestedAction?: string;
  originalError?: Error;
  context?: Record<string, unknown>;
}

/**
 * Base class for all chat-related errors
 */
export class ChatError extends Error {
  public readonly code: ApiErrorCode;
  public readonly userMessage: string;
  public readonly suggestedAction: string;
  public readonly context: Record<string, unknown>;
  public readonly statusCode: number;
  public readonly originalError?: Error;

  constructor(options: ChatErrorOptions) {
    const details = getErrorDetails(options.code);
    const suggestedAction = options.suggestedAction || details.suggestedAction;

    super(options.details || options.userMessage);

    this.name = 'ChatError';
    this.code = options.code;
    this.userMessage = options.userMessage;
    this.suggestedAction = suggestedAction;
    this.statusCode = details.httpStatus;
    this.context = options.context || {};
    this.originalError = options.originalError;

    Object.setPrototypeOf(this, ChatError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      userMessage: this.userMessage,
      suggestedAction: this.suggestedAction,
      statusCode: this.statusCode,
      message: this.message,
      context: this.context,
    };
  }
}

/**
 * Error for message validation failures
 */
export class MessageValidationError extends ChatError {
  constructor(details: string, context?: Record<string, unknown>) {
    super({
      code: ApiErrorCode.VALIDATION_ERROR,
      userMessage: 'Message validation failed',
      details,
      suggestedAction: 'Please check your message format and try again',
      context,
    });
    this.name = 'MessageValidationError';
    Object.setPrototypeOf(this, MessageValidationError.prototype);
  }
}

/**
 * Error for message processing failures
 */
export class MessageProcessingError extends ChatError {
  constructor(details: string, originalError?: Error, context?: Record<string, unknown>) {
    super({
      code: ApiErrorCode.MESSAGE_PROCESSING_FAILED,
      userMessage: 'Failed to process your message',
      details,
      suggestedAction: 'Please try again or contact support if the issue persists',
      originalError,
      context,
    });
    this.name = 'MessageProcessingError';
    Object.setPrototypeOf(this, MessageProcessingError.prototype);
  }
}

/**
 * Error for session-related failures
 */
export class SessionError extends ChatError {
  constructor(
    operation: 'create' | 'fetch' | 'update' | 'delete',
    originalError?: Error,
    context?: Record<string, unknown>
  ) {
    const operationNames = {
      create: 'create session',
      fetch: 'fetch session',
      update: 'update session',
      delete: 'delete session',
    };

    const code =
      operation === 'create'
        ? ApiErrorCode.SESSION_CREATION_FAILED
        : operation === 'delete'
          ? ApiErrorCode.SESSION_DELETION_FAILED
          : ApiErrorCode.INTERNAL_SERVER_ERROR;

    super({
      code,
      userMessage: `Failed to ${operationNames[operation]}`,
      details: `Session ${operation} operation failed`,
      originalError,
      context,
    });
    this.name = 'SessionError';
    Object.setPrototypeOf(this, SessionError.prototype);
  }
}

/**
 * Error for AI service failures
 */
export class AIServiceError extends ChatError {
  constructor(
    details: string,
    isUnavailable: boolean = false,
    originalError?: Error,
    context?: Record<string, unknown>
  ) {
    const code = isUnavailable
      ? ApiErrorCode.AI_SERVICE_UNAVAILABLE
      : ApiErrorCode.AI_SERVICE_ERROR;

    super({
      code,
      userMessage: 'AI service temporarily unavailable',
      details,
      suggestedAction: isUnavailable
        ? 'Please try again in a few moments'
        : 'Please try again or contact support',
      originalError,
      context,
    });
    this.name = 'AIServiceError';
    Object.setPrototypeOf(this, AIServiceError.prototype);
  }
}

/**
 * Error for chat completion failures
 */
export class ChatCompletionError extends ChatError {
  constructor(details: string, originalError?: Error, context?: Record<string, unknown>) {
    super({
      code: ApiErrorCode.CHAT_PROCESSING_FAILED,
      userMessage: 'Failed to generate response',
      details,
      suggestedAction: 'Please try again or contact support if the issue persists',
      originalError,
      context,
    });
    this.name = 'ChatCompletionError';
    Object.setPrototypeOf(this, ChatCompletionError.prototype);
  }
}

/**
 * Error for therapeutic analysis failures
 */
export class TherapeuticAnalysisError extends ChatError {
  constructor(details: string, originalError?: Error, context?: Record<string, unknown>) {
    super({
      code: ApiErrorCode.THERAPEUTIC_ANALYSIS_FAILED,
      userMessage: 'Therapeutic analysis processing failed',
      details,
      suggestedAction: 'Please try again or contact support if the issue persists',
      originalError,
      context,
    });
    this.name = 'TherapeuticAnalysisError';
    Object.setPrototypeOf(this, TherapeuticAnalysisError.prototype);
  }
}

/**
 * Error for encryption/decryption failures
 */
export class EncryptionError extends ChatError {
  constructor(
    operation: 'encrypt' | 'decrypt',
    originalError?: Error,
    context?: Record<string, unknown>
  ) {
    const code =
      operation === 'encrypt' ? ApiErrorCode.ENCRYPTION_ERROR : ApiErrorCode.DECRYPTION_ERROR;

    super({
      code,
      userMessage: `Data ${operation}ion failed`,
      details: `Unable to ${operation} data securely`,
      suggestedAction: 'Please try again or contact support if the issue persists',
      originalError,
      context,
    });
    this.name = 'EncryptionError';
    Object.setPrototypeOf(this, EncryptionError.prototype);
  }
}

/**
 * Error for database operation failures
 */
export class DatabaseOperationError extends ChatError {
  constructor(
    operation: 'read' | 'write' | 'query',
    originalError?: Error,
    context?: Record<string, unknown>
  ) {
    const code =
      operation === 'write'
        ? ApiErrorCode.DATABASE_WRITE_FAILED
        : operation === 'query'
          ? ApiErrorCode.DATABASE_QUERY_FAILED
          : ApiErrorCode.DATABASE_ERROR;

    super({
      code,
      userMessage: 'Database operation failed',
      details: `Database ${operation} operation encountered an error`,
      suggestedAction: 'Please try again later or contact support',
      originalError,
      context,
    });
    this.name = 'DatabaseOperationError';
    Object.setPrototypeOf(this, DatabaseOperationError.prototype);
  }
}

/**
 * Error for memory management failures
 */
export class MemoryManagementError extends ChatError {
  constructor(
    operation: 'retrieve' | 'delete',
    originalError?: Error,
    context?: Record<string, unknown>
  ) {
    const code =
      operation === 'retrieve'
        ? ApiErrorCode.MEMORY_RETRIEVAL_FAILED
        : ApiErrorCode.MEMORY_DELETION_FAILED;

    super({
      code,
      userMessage: `Failed to ${operation} therapeutic memory`,
      details: `Memory ${operation} operation failed`,
      suggestedAction: 'Please try again or contact support if the issue persists',
      originalError,
      context,
    });
    this.name = 'MemoryManagementError';
    Object.setPrototypeOf(this, MemoryManagementError.prototype);
  }
}

/**
 * Type guard to check if an error is a ChatError
 */
export function isChatError(error: unknown): error is ChatError {
  return error instanceof ChatError;
}

/**
 * Extract ChatError details for API response
 */
export function getChatErrorResponse(error: unknown) {
  if (isChatError(error)) {
    return {
      message: error.userMessage,
      code: error.code,
      details: error.message,
      suggestedAction: error.suggestedAction,
      statusCode: error.statusCode,
    };
  }

  // Fallback for non-ChatError exceptions
  return {
    message: 'An unexpected error occurred',
    code: ApiErrorCode.INTERNAL_SERVER_ERROR,
    details: error instanceof Error ? error.message : 'Unknown error',
    suggestedAction: 'Please try again or contact support if the issue persists',
    statusCode: 500,
  };
}

/**
 * Maps ApiErrorCode to the new AppErrorCode for consistent error handling.
 * Provides backward compatibility during migration.
 */
export function mapApiErrorCodeToAppErrorCode(code: ApiErrorCode): AppErrorCode {
  const mapping: Partial<Record<ApiErrorCode, AppErrorCode>> = {
    [ApiErrorCode.AUTHENTICATION_ERROR]: AppErrorCode.UNAUTHENTICATED,
    [ApiErrorCode.UNAUTHORIZED]: AppErrorCode.UNAUTHENTICATED,
    [ApiErrorCode.SESSION_EXPIRED]: AppErrorCode.SESSION_EXPIRED,
    [ApiErrorCode.FORBIDDEN]: AppErrorCode.FORBIDDEN,
    [ApiErrorCode.ACCESS_DENIED]: AppErrorCode.FORBIDDEN,
    [ApiErrorCode.VALIDATION_ERROR]: AppErrorCode.VALIDATION_ERROR,
    [ApiErrorCode.INVALID_INPUT]: AppErrorCode.INVALID_INPUT,
    [ApiErrorCode.NOT_FOUND]: AppErrorCode.NOT_FOUND,
    [ApiErrorCode.RESOURCE_NOT_FOUND]: AppErrorCode.NOT_FOUND,
    [ApiErrorCode.INTERNAL_SERVER_ERROR]: AppErrorCode.INTERNAL_ERROR,
    [ApiErrorCode.AI_SERVICE_UNAVAILABLE]: AppErrorCode.SERVICE_UNAVAILABLE,
    [ApiErrorCode.RATE_LIMIT_EXCEEDED]: AppErrorCode.RATE_LIMITED,
  };

  return mapping[code] ?? AppErrorCode.INTERNAL_ERROR;
}

/**
 * Converts a ChatError to an AppError for use with the new error system.
 */
export function chatErrorToAppError(error: ChatError): AppError {
  return {
    code: mapApiErrorCodeToAppErrorCode(error.code),
    message: error.userMessage,
    details: error.message,
  };
}
