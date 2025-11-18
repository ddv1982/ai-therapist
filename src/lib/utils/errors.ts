/**
 * Consolidated error handling utilities for therapeutic AI application
 * Includes error reporting, API error handlers, and graceful degradation patterns
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';
import { RequestContext } from '../api/api-middleware';
import {
  createServerErrorResponse,
  createValidationErrorResponse,
  createForbiddenErrorResponse,
  createAuthenticationErrorResponse,
  ApiResponse,
} from '@/lib/api/api-response';
import { getPublicEnv } from '@/config/env.public';

const runtimeIsDevelopment = () => getPublicEnv().NODE_ENV === 'development';

// ============================================================================
// CLIENT ERROR REPORTING
// ============================================================================

export interface ClientErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp?: string;
  userAgent?: string;
  url?: string;
}

export function reportClientError(data: ClientErrorReport) {
  try {
    const payload = JSON.stringify({
      error: data.message,
      stack: data.stack,
      componentStack: data.componentStack,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : data.userAgent,
      url: typeof window !== 'undefined' ? window.location.href : data.url,
      timestamp: new Date().toISOString(),
    });

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/errors', blob);
      return;
    }

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => {
        void fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        });
      });
      return;
    }

    void fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    });
  } catch {}
}

export function useErrorReporter() {
  return (error: Error, componentStack?: string) => {
    reportClientError({ message: error.message, stack: error.stack, componentStack });
  };
}

// ============================================================================
// ERROR TYPES AND INTERFACES
// ============================================================================

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory =
  | 'authentication'
  | 'validation'
  | 'database'
  | 'external_api'
  | 'permission'
  | 'business_logic'
  | 'system';

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
  timestamp: string;
  stackTrace?: string;
  requestDetails?: {
    method?: string;
    url?: string;
    userAgent?: string;
    ip?: string;
  };
}

// ============================================================================
// ERROR REPORTING AND METRICS
// ============================================================================

export const ErrorMetrics = {
  recordError: (
    _category: ErrorCategory,
    _severity: ErrorSeverity,
    _operation: string,
    _additionalData?: Record<string, unknown>
  ) => {
    if (runtimeIsDevelopment()) {
      logger.debug('Error metric recorded', { metricType: 'errorTracking' });
    }
  },
  getErrorStats: () => {
    return {
      totalErrors: 0,
      errorsByCategory: {
        authentication: 0,
        validation: 0,
        database: 0,
        external_api: 0,
        permission: 0,
        business_logic: 0,
        system: 0,
      } as Record<ErrorCategory, number>,
      errorsBySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      } as Record<ErrorSeverity, number>,
      errorsByOperation: {},
    };
  },
};

function recordErrorMetricProxy(
  _category: ErrorCategory,
  _severity: ErrorSeverity,
  _operation: string,
  _additionalData?: Record<string, unknown>
) {
  // no-op
}

// ============================================================================
// THERAPEUTIC ERROR PATTERNS
// ============================================================================

export const TherapeuticErrorPatterns = {
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

export function classifyError(error: Error | unknown): {
  category: ErrorCategory;
  severity: ErrorSeverity;
  isRetryable: boolean;
} {
  const errorMessage =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (errorMessage.includes('database') || errorMessage.includes('sqlite')) {
    return { category: 'database', severity: 'high', isRetryable: false };
  }

  if (
    errorMessage.includes('groq') ||
    errorMessage.includes('api') ||
    errorMessage.includes('fetch')
  ) {
    return { category: 'external_api', severity: 'medium', isRetryable: true };
  }

  if (
    errorMessage.includes('auth') ||
    errorMessage.includes('token') ||
    errorMessage.includes('unauthorized')
  ) {
    return { category: 'authentication', severity: 'high', isRetryable: false };
  }

  if (
    errorMessage.includes('validation') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('required')
  ) {
    return { category: 'validation', severity: 'low', isRetryable: false };
  }

  return { category: 'system', severity: 'medium', isRetryable: false };
}

export function shouldLogError(severity: ErrorSeverity, category: ErrorCategory): boolean {
  if (severity === 'critical' || severity === 'high') return true;
  if (severity === 'medium' && (category === 'system' || category === 'database')) return true;
  if (severity === 'low' && category === 'validation') {
    return runtimeIsDevelopment();
  }
  return true;
}

// ============================================================================
// ENHANCED ERROR HANDLERS
// ============================================================================

export function handleApiError(
  error: Error | unknown,
  context: EnhancedErrorContext = {}
): NextResponse<ApiResponse> {
  const actualError = error instanceof Error ? error : new Error(String(error));
  const classification = classifyError(actualError);

  const enhancedContext: EnhancedErrorContext = {
    ...context,
    category: context.category || classification.category,
    severity: context.severity || classification.severity,
    shouldRetry: context.shouldRetry ?? classification.isRetryable,
  };

  if (shouldLogError(enhancedContext.severity!, enhancedContext.category!)) {
    const logEntry: ErrorLogEntry = {
      error: actualError,
      context: enhancedContext,
      timestamp: new Date().toISOString(),
      stackTrace: actualError.stack,
    };

    logger.error(`API Error [${enhancedContext.category}/${enhancedContext.severity}]`, {
      ...logEntry,
      errorMessage: actualError.message,
      operation: enhancedContext.operation || 'unknown',
    });

    recordErrorMetricProxy(
      enhancedContext.category!,
      enhancedContext.severity!,
      enhancedContext.operation || 'unknown',
      { requestId: context.requestId }
    );
  }

  switch (enhancedContext.category) {
    case 'authentication':
      return createAuthenticationErrorResponse(
        enhancedContext.userMessage || actualError.message || 'Authentication required',
        context.requestId
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
      return createServerErrorResponse(actualError, context.requestId, {
        category: enhancedContext.category,
        severity: enhancedContext.severity,
        shouldRetry: enhancedContext.shouldRetry,
        userMessage: enhancedContext.userMessage,
      });
  }
}

export function handleMessageError(
  error: Error | unknown,
  operation: 'create' | 'retrieve' | 'encrypt' | 'decrypt',
  context: Partial<EnhancedErrorContext> = {}
): NextResponse<ApiResponse> {
  const enhancedContext: EnhancedErrorContext = {
    ...context,
    operation: `message_${operation}`,
    category: 'system',
    severity: 'high',
  };

  if (operation === 'encrypt' || operation === 'decrypt') {
    const pattern =
      operation === 'encrypt'
        ? TherapeuticErrorPatterns.MESSAGE_ENCRYPTION_FAILED
        : TherapeuticErrorPatterns.MESSAGE_DECRYPTION_FAILED;

    enhancedContext.userMessage = pattern.userMessage;
    enhancedContext.severity = pattern.severity;
  }

  return handleApiError(error, enhancedContext);
}

export function handleSessionError(
  error: Error | unknown,
  operation: 'create' | 'retrieve' | 'update' | 'delete' | 'access_check',
  context: Partial<EnhancedErrorContext> = {}
): NextResponse<ApiResponse> {
  const enhancedContext: EnhancedErrorContext = {
    ...context,
    operation: `session_${operation}`,
    category: 'permission',
    severity: 'medium',
  };

  const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
  if (errorMessage.includes('not found') || errorMessage.includes('access denied')) {
    enhancedContext.userMessage = TherapeuticErrorPatterns.SESSION_NOT_FOUND.userMessage;
  }

  return handleApiError(error, enhancedContext);
}

export function handleAIError(
  error: Error | unknown,
  context: Partial<EnhancedErrorContext> = {}
): NextResponse<ApiResponse> {
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';

  const enhancedContext: EnhancedErrorContext = {
    ...context,
    category: 'external_api',
    severity: 'medium',
    shouldRetry: true,
  };

  if (errorMessage.includes('model_not_found') || errorMessage.includes('model not available')) {
    enhancedContext.userMessage = TherapeuticErrorPatterns.AI_MODEL_UNAVAILABLE.userMessage;
  } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    enhancedContext.userMessage = TherapeuticErrorPatterns.AI_RESPONSE_TIMEOUT.userMessage;
    enhancedContext.severity = 'low';
  } else {
    enhancedContext.userMessage =
      'The AI service is temporarily unavailable. Please try again in a moment.';
  }

  return handleApiError(error, enhancedContext);
}

// ============================================================================
// CLIENT-SIDE ERROR UTILITIES
// ============================================================================

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
  const lower = errorMessage.toLowerCase();

  let userMessage = context.fallbackMessage || 'An unexpected error occurred. Please try again.';

  const isNetworkIssue =
    lower.includes('network') ||
    lower.includes('failed to fetch') ||
    lower.includes('fetch') ||
    lower.includes('unreachable') ||
    lower.includes('econn') ||
    lower.includes('net::err') ||
    lower.includes('offline');

  if (isNetworkIssue) {
    userMessage = 'Network connection issue. Please check your internet connection.';
  } else if (lower.includes('timeout') || lower.includes('timed out')) {
    userMessage = 'The request timed out. Please try again.';
  } else if (
    lower.includes('authentication') ||
    lower.includes('unauthorized') ||
    lower.includes('forbidden')
  ) {
    userMessage = 'Please log in again to continue.';
  }

  if (runtimeIsDevelopment()) {
    logger.error('Client error encountered', {
      operation: context.operation,
      errorMessage,
      category: classification.category,
      severity: classification.severity,
      errorContext: context,
    });
  }

  return {
    userMessage,
    shouldRetry: classification.isRetryable,
    category: classification.category,
  };
}

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

  handleAuthError: (error: Error, context: RequestContext | Partial<EnhancedErrorContext>) => {
    return handleApiError(error, {
      ...context,
      category: 'authentication',
      severity: 'high',
    });
  },
};

// ============================================================================
// GRACEFUL DEGRADATION & CIRCUIT BREAKER
// ============================================================================

export interface ServiceStatus {
  name: string;
  available: boolean;
  lastChecked: number;
  consecutiveFailures: number;
  lastError?: string;
}

interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitorWindow: number;
}

export class ServiceCircuitBreaker {
  private services = new Map<string, ServiceStatus>();
  private options: CircuitBreakerOptions;

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = {
      failureThreshold: 3,
      resetTimeout: 60000,
      monitorWindow: 300000,
      ...options,
    };
  }

  async executeWithBreaker<T>(
    serviceName: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T> | T
  ): Promise<T> {
    const status = this.getServiceStatus(serviceName);
    const now = Date.now();

    if (!status.available) {
      if (now - status.lastChecked > this.options.resetTimeout) {
        logger.info(`Attempting to reset circuit breaker for ${serviceName}`, {
          lastChecked: new Date(status.lastChecked).toISOString(),
          consecutiveFailures: status.consecutiveFailures,
        });
        try {
          const result = await operation();
          this.recordSuccess(serviceName);
          return result;
        } catch (error) {
          this.recordFailure(serviceName, error);
          if (fallback) {
            logger.warn(`${serviceName} still failing, using fallback`, {
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            return await this.executeFallback(fallback);
          }
          throw error;
        }
      } else {
        if (fallback) {
          logger.info(`Circuit open for ${serviceName}, using fallback immediately`);
          return await this.executeFallback(fallback);
        } else {
          throw new Error(`Service ${serviceName} is currently unavailable (circuit open)`);
        }
      }
    }

    try {
      const result = await operation();
      this.recordSuccess(serviceName);
      return result;
    } catch (error) {
      this.recordFailure(serviceName, error);

      if (fallback) {
        logger.warn(`${serviceName} failed, using fallback`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          consecutiveFailures: status.consecutiveFailures + 1,
        });
        return await this.executeFallback(fallback);
      }

      throw error;
    }
  }

  private async executeFallback<T>(fallback: () => Promise<T> | T): Promise<T> {
    try {
      return await fallback();
    } catch (fallbackError) {
      logger.error('Fallback operation also failed', {
        error: fallbackError instanceof Error ? fallbackError.message : 'Unknown fallback error',
      });
      throw fallbackError;
    }
  }

  private recordSuccess(serviceName: string): void {
    this.services.set(serviceName, {
      name: serviceName,
      available: true,
      lastChecked: Date.now(),
      consecutiveFailures: 0,
    });
  }

  private recordFailure(serviceName: string, error: unknown): void {
    const current = this.getServiceStatus(serviceName);
    const newFailures = current.consecutiveFailures + 1;

    this.services.set(serviceName, {
      name: serviceName,
      available: newFailures < this.options.failureThreshold,
      lastChecked: Date.now(),
      consecutiveFailures: newFailures,
      lastError: error instanceof Error ? error.message : 'Unknown error',
    });

    if (newFailures >= this.options.failureThreshold) {
      logger.warn(`Circuit breaker opened for ${serviceName}`, {
        consecutiveFailures: newFailures,
        threshold: this.options.failureThreshold,
        resetTimeout: this.options.resetTimeout,
      });
    }
  }

  private getServiceStatus(serviceName: string): ServiceStatus {
    return (
      this.services.get(serviceName) || {
        name: serviceName,
        available: true,
        lastChecked: 0,
        consecutiveFailures: 0,
      }
    );
  }

  getAllStatuses(): ServiceStatus[] {
    return Array.from(this.services.values());
  }

  resetService(serviceName: string): void {
    this.services.set(serviceName, {
      name: serviceName,
      available: true,
      lastChecked: Date.now(),
      consecutiveFailures: 0,
    });
    logger.info(`Manually reset circuit breaker for ${serviceName}`);
  }

  getHealthSummary(): { healthy: number; degraded: number; total: number } {
    const statuses = this.getAllStatuses();
    const healthy = statuses.filter((s) => s.available).length;
    const degraded = statuses.filter((s) => !s.available).length;

    return {
      healthy,
      degraded,
      total: statuses.length,
    };
  }
}

export const circuitBreaker = new ServiceCircuitBreaker();

export async function withAIFallback<T>(
  operation: () => Promise<T>,
  fallbackResponse: T,
  serviceName = 'ai-service'
): Promise<T> {
  return circuitBreaker.executeWithBreaker(serviceName, operation, () => fallbackResponse);
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        break;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      logger.debug(
        `Retry attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${delay}ms`,
        {
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    }),
  ]);
}

export function getCircuitBreakerStatus() {
  return {
    services: circuitBreaker.getAllStatuses(),
    summary: circuitBreaker.getHealthSummary(),
  };
}

export function resetServiceCircuitBreaker(serviceName: string) {
  circuitBreaker.resetService(serviceName);
}
