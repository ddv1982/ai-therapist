/**
 * Enhanced error handling utilities for therapeutic AI application
 * Builds upon existing api-middleware errorHandlers with comprehensive patterns
 * Maintains backward compatibility while providing standardized error handling
 */

import { NextResponse } from 'next/server';
import { logger, createRequestLogger } from '@/lib/logger';
import { RequestContext } from '@/lib/api-middleware';
import { 
  createServerErrorResponse,
  createValidationErrorResponse,
  createNotFoundErrorResponse,
  createForbiddenErrorResponse,
  ApiResponse
} from '@/lib/api-response';

// ============================================================================
// ERROR TYPES AND INTERFACES
// ============================================================================

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory = 'authentication' | 'validation' | 'database' | 'external_api' | 'permission' | 'business_logic' | 'system';

export interface EnhancedErrorContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  operation?: string;
  additionalContext?: Record<string, unknown>;
  severity?: ErrorSeverity;
  category?: ErrorCategory;
  userMessage?: string;
  shouldRetry?: boolean;
}

export interface ErrorLogEntry {
  error: Error;
  context: EnhancedErrorContext;
  timestamp: Date;
  stackTrace?: string;
  requestDetails?: {
    method?: string;
    url?: string;
    userAgent?: string;
    ip?: string;
  };
}

// ============================================================================
// THERAPEUTIC ERROR PATTERNS
// ============================================================================

/**
 * Standardized error patterns specific to therapeutic AI application
 */
export const TherapeuticErrorPatterns = {
  // Session-related errors
  SESSION_NOT_FOUND: {
    message: 'Session not found or access denied',
    category: 'permission' as ErrorCategory,
    severity: 'medium' as ErrorSeverity,
    userMessage: 'The therapeutic session could not be found. Please start a new session.',
    statusCode: 404,
  },
  
  SESSION_ACCESS_DENIED: {
    message: 'Session access denied for user',
    category: 'permission' as ErrorCategory,
    severity: 'high' as ErrorSeverity,
    userMessage: 'You do not have permission to access this session.',
    statusCode: 403,
  },
  
  // Message-related errors
  MESSAGE_ENCRYPTION_FAILED: {
    message: 'Failed to encrypt therapeutic message',
    category: 'system' as ErrorCategory,
    severity: 'high' as ErrorSeverity,
    userMessage: 'Unable to secure your message. Please try again.',
    statusCode: 500,
  },
  
  MESSAGE_DECRYPTION_FAILED: {
    message: 'Failed to decrypt therapeutic message',
    category: 'system' as ErrorCategory,
    severity: 'high' as ErrorSeverity,
    userMessage: 'Unable to retrieve your message. Please contact support if this persists.',
    statusCode: 500,
  },
  
  // AI/API-related errors
  AI_MODEL_UNAVAILABLE: {
    message: 'Selected AI model is not available',
    category: 'external_api' as ErrorCategory,
    severity: 'medium' as ErrorSeverity,
    userMessage: 'The selected AI model is currently unavailable. Please try a different model.',
    statusCode: 503,
    shouldRetry: true,
  },
  
  AI_RESPONSE_TIMEOUT: {
    message: 'AI response timeout exceeded',
    category: 'external_api' as ErrorCategory,
    severity: 'medium' as ErrorSeverity,
    userMessage: 'The AI is taking longer than usual to respond. Please try again.',
    statusCode: 504,
    shouldRetry: true,
  },
  
  // Authentication errors
  AUTH_TOKEN_INVALID: {
    message: 'Authentication token is invalid or expired',
    category: 'authentication' as ErrorCategory,
    severity: 'high' as ErrorSeverity,
    userMessage: 'Your session has expired. Please log in again.',
    statusCode: 401,
  },
  
  TOTP_VERIFICATION_FAILED: {
    message: 'TOTP verification failed',
    category: 'authentication' as ErrorCategory,
    severity: 'medium' as ErrorSeverity,
    userMessage: 'Authentication code is incorrect. Please try again.',
    statusCode: 401,
  },
  
  // Rate limiting errors
  RATE_LIMIT_EXCEEDED: {
    message: 'Rate limit exceeded for therapeutic sessions',
    category: 'business_logic' as ErrorCategory,
    severity: 'low' as ErrorSeverity,
    userMessage: 'You are sending messages too quickly. Please take a moment and try again.',
    statusCode: 429,
    shouldRetry: true,
  },
} as const;

// ============================================================================
// ERROR CLASSIFICATION UTILITIES
// ============================================================================

/**
 * Classifies an error based on its message and properties
 */
export function classifyError(error: Error | unknown): {
  category: ErrorCategory;
  severity: ErrorSeverity;
  isRetryable: boolean;
} {
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  
  // Database errors
  if (errorMessage.includes('database') || errorMessage.includes('sqlite') || errorMessage.includes('prisma')) {
    return { category: 'database', severity: 'high', isRetryable: false };
  }
  
  // External API errors
  if (errorMessage.includes('groq') || errorMessage.includes('api') || errorMessage.includes('fetch')) {
    return { category: 'external_api', severity: 'medium', isRetryable: true };
  }
  
  // Authentication errors
  if (errorMessage.includes('auth') || errorMessage.includes('token') || errorMessage.includes('unauthorized')) {
    return { category: 'authentication', severity: 'high', isRetryable: false };
  }
  
  // Validation errors
  if (errorMessage.includes('validation') || errorMessage.includes('invalid') || errorMessage.includes('required')) {
    return { category: 'validation', severity: 'low', isRetryable: false };
  }
  
  // Default classification
  return { category: 'system', severity: 'medium', isRetryable: false };
}

/**
 * Determines if an error should be logged based on its severity and category
 */
export function shouldLogError(severity: ErrorSeverity, category: ErrorCategory): boolean {
  // Always log critical and high severity errors
  if (severity === 'critical' || severity === 'high') return true;
  
  // Log medium severity for system and database errors
  if (severity === 'medium' && (category === 'system' || category === 'database')) return true;
  
  // Skip low severity validation errors unless in development
  if (severity === 'low' && category === 'validation') {
    return process.env.NODE_ENV === 'development';
  }
  
  return true;
}

// ============================================================================
// ENHANCED ERROR HANDLERS
// ============================================================================

/**
 * Comprehensive error handler for API routes
 */
export function handleApiError(
  error: Error | unknown,
  context: EnhancedErrorContext = {}
): NextResponse<ApiResponse<never>> {
  const actualError = error instanceof Error ? error : new Error(String(error));
  const classification = classifyError(actualError);
  
  const enhancedContext: EnhancedErrorContext = {
    ...context,
    category: context.category || classification.category,
    severity: context.severity || classification.severity,
    shouldRetry: context.shouldRetry ?? classification.isRetryable,
  };
  
  // Log error if appropriate
  if (shouldLogError(enhancedContext.severity!, enhancedContext.category!)) {
    const logEntry: ErrorLogEntry = {
      error: actualError,
      context: enhancedContext,
      timestamp: new Date(),
      stackTrace: actualError.stack,
    };
    
    logger.error(`API Error [${enhancedContext.category}/${enhancedContext.severity}]`, {
      ...logEntry,
      errorMessage: actualError.message,
      operation: enhancedContext.operation || 'unknown',
    });
  }
  
  // Return appropriate response based on category
  switch (enhancedContext.category) {
    case 'authentication':
      return createServerErrorResponse(
        actualError, 
        context.requestId,
        { 
          userMessage: enhancedContext.userMessage || 'Authentication required',
          shouldRetry: enhancedContext.shouldRetry || false,
        }
      );
      
    case 'validation':
      return createValidationErrorResponse(
        enhancedContext.userMessage || actualError.message,
        context.requestId
      );
      
    case 'permission':
      return createForbiddenErrorResponse(
        enhancedContext.userMessage || 'Access denied',
        context.requestId
      );
      
    default:
      return createServerErrorResponse(
        actualError,
        context.requestId,
        {
          category: enhancedContext.category,
          severity: enhancedContext.severity,
          shouldRetry: enhancedContext.shouldRetry,
          userMessage: enhancedContext.userMessage,
        }
      );
  }
}

/**
 * Specialized error handler for therapeutic message operations
 */
export function handleMessageError(
  error: Error | unknown,
  operation: 'create' | 'retrieve' | 'encrypt' | 'decrypt',
  context: Partial<EnhancedErrorContext> = {}
): NextResponse<ApiResponse<never>> {
  const enhancedContext: EnhancedErrorContext = {
    ...context,
    operation: `message_${operation}`,
    category: 'system',
    severity: 'high',
  };
  
  // Map operation to specific error patterns
  if (operation === 'encrypt' || operation === 'decrypt') {
    const pattern = operation === 'encrypt' 
      ? TherapeuticErrorPatterns.MESSAGE_ENCRYPTION_FAILED
      : TherapeuticErrorPatterns.MESSAGE_DECRYPTION_FAILED;
      
    enhancedContext.userMessage = pattern.userMessage;
    enhancedContext.severity = pattern.severity;
  }
  
  return handleApiError(error, enhancedContext);
}

/**
 * Specialized error handler for session operations
 */
export function handleSessionError(
  error: Error | unknown,
  operation: 'create' | 'retrieve' | 'update' | 'delete' | 'access_check',
  context: Partial<EnhancedErrorContext> = {}
): NextResponse<ApiResponse<never>> {
  const enhancedContext: EnhancedErrorContext = {
    ...context,
    operation: `session_${operation}`,
    category: 'permission',
    severity: 'medium',
  };
  
  // Check if this is an access denied scenario
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
  if (errorMessage.includes('not found') || errorMessage.includes('access denied')) {
    enhancedContext.userMessage = TherapeuticErrorPatterns.SESSION_NOT_FOUND.userMessage;
  }
  
  return handleApiError(error, enhancedContext);
}

/**
 * Specialized error handler for AI/external API operations
 */
export function handleAIError(
  error: Error | unknown,
  context: Partial<EnhancedErrorContext> = {}
): NextResponse<ApiResponse<never>> {
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
  
  const enhancedContext: EnhancedErrorContext = {
    ...context,
    category: 'external_api',
    severity: 'medium',
    shouldRetry: true,
  };
  
  // Map specific AI error patterns
  if (errorMessage.includes('model_not_found') || errorMessage.includes('model not available')) {
    enhancedContext.userMessage = TherapeuticErrorPatterns.AI_MODEL_UNAVAILABLE.userMessage;
  } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    enhancedContext.userMessage = TherapeuticErrorPatterns.AI_RESPONSE_TIMEOUT.userMessage;
    enhancedContext.severity = 'low';
  } else {
    enhancedContext.userMessage = 'The AI service is temporarily unavailable. Please try again in a moment.';
  }
  
  return handleApiError(error, enhancedContext);
}

// ============================================================================
// CLIENT-SIDE ERROR UTILITIES
// ============================================================================

/**
 * Standardized error handling for client-side operations
 */
export function handleClientError(
  error: Error | unknown,
  context: {
    operation: string;
    showToast?: boolean;
    fallbackMessage?: string;
    onRetry?: () => void;
  }
): {
  userMessage: string;
  shouldRetry: boolean;
  category: ErrorCategory;
} {
  const classification = classifyError(error);
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Determine user-friendly message
  let userMessage = context.fallbackMessage || 'An unexpected error occurred. Please try again.';
  
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    userMessage = 'Network connection issue. Please check your internet connection.';
  } else if (errorMessage.includes('timeout')) {
    userMessage = 'The request timed out. Please try again.';
  } else if (errorMessage.includes('authentication')) {
    userMessage = 'Please log in again to continue.';
  }
  
  // Log client errors if in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`Client Error [${context.operation}]:`, {
      error: errorMessage,
      category: classification.category,
      severity: classification.severity,
      context
    });
  }
  
  return {
    userMessage,
    shouldRetry: classification.isRetryable,
    category: classification.category,
  };
}

/**
 * Async error boundary wrapper for client operations
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: {
    operationName: string;
    onError?: (error: Error) => void;
    fallbackMessage?: string;
  }
): Promise<{ data?: T; error?: string }> {
  try {
    const data = await operation();
    return { data };
  } catch (error) {
    const result = handleClientError(error, {
      operation: context.operationName,
      fallbackMessage: context.fallbackMessage,
    });
    
    if (context.onError) {
      context.onError(error as Error);
    }
    
    return { error: result.userMessage };
  }
}

// ============================================================================
// BACKWARD COMPATIBILITY
// ============================================================================

/**
 * Legacy error handler wrapper for backward compatibility
 * Maintains existing API while adding enhanced functionality
 */
export const enhancedErrorHandlers = {
  handleDatabaseError: (
    error: Error, 
    operation: string, 
    context: RequestContext | Partial<EnhancedErrorContext>
  ) => {
    return handleApiError(error, {
      ...context,
      operation,
      category: 'database',
      severity: 'high',
    });
  },
  
  handleValidationError: (
    error: Error,
    context: RequestContext | Partial<EnhancedErrorContext>
  ) => {
    return handleApiError(error, {
      ...context,
      category: 'validation',
      severity: 'low',
    });
  },
  
  handleAuthError: (
    error: Error,
    context: RequestContext | Partial<EnhancedErrorContext>
  ) => {
    return handleApiError(error, {
      ...context,
      category: 'authentication',
      severity: 'high',
    });
  },
};

// ============================================================================
// ERROR REPORTING AND METRICS
// ============================================================================

/**
 * Error metrics collection for monitoring
 */
export const ErrorMetrics = {
  recordError: (
    category: ErrorCategory,
    severity: ErrorSeverity,
    operation: string,
    additionalData?: Record<string, unknown>
  ) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Error Metric:', {
        category,
        severity,
        operation,
        timestamp: new Date().toISOString(),
        ...additionalData,
      });
    }
    
    // TODO: Implement actual metrics collection (e.g., send to monitoring service)
  },
  
  getErrorStats: () => {
    // TODO: Implement error statistics collection
    return {
      totalErrors: 0,
      errorsByCategory: {},
      errorsBySeverity: {},
    };
  },
};