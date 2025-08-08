import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';

/**
 * Standardized API response types for consistent therapeutic AI application responses
 */

// Base response interface
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: string;
    suggestedAction?: string;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

// Success response helper
export function createSuccessResponse<T>(
  data: T,
  meta?: Partial<ApiResponse['meta']>
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  });
}

// Error response helper
export function createErrorResponse(
  message: string,
  status: number = 400,
  options: {
    code?: string;
    details?: string;
    suggestedAction?: string;
    requestId?: string;
  } = {}
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code: options.code,
        details: options.details,
        suggestedAction: options.suggestedAction,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: options.requestId,
      },
    },
    { status }
  );
}

// Validation error response helper
export function createValidationErrorResponse(
  validationError: string,
  requestId?: string
): NextResponse<ApiResponse> {
  return createErrorResponse(
    'Validation failed',
    400,
    {
      code: 'VALIDATION_ERROR',
      details: validationError,
      suggestedAction: 'Please check your input data and try again',
      requestId,
    }
  );
}

// Database error response helper
export function createDatabaseErrorResponse(
  operation: string,
  requestId?: string
): NextResponse<ApiResponse> {
  return createErrorResponse(
    'Database operation failed',
    500,
    {
      code: 'DATABASE_ERROR',
      details: `Failed to ${operation}`,
      suggestedAction: 'Please try again later or contact support if the issue persists',
      requestId,
    }
  );
}

// Authentication error response helper
export function createAuthenticationErrorResponse(
  authError: string,
  requestId?: string
): NextResponse<ApiResponse> {
  return createErrorResponse(
    'Authentication required',
    401,
    {
      code: 'AUTHENTICATION_ERROR',
      details: authError,
      suggestedAction: 'Please verify your authentication and try again',
      requestId,
    }
  );
}

// Not found error response helper
export function createNotFoundErrorResponse(
  resource: string,
  requestId?: string
): NextResponse<ApiResponse> {
  return createErrorResponse(
    `${resource} not found`,
    404,
    {
      code: 'NOT_FOUND',
      details: `The requested ${resource.toLowerCase()} does not exist or you don't have access to it`,
      suggestedAction: 'Please check the resource identifier and try again',
      requestId,
    }
  );
}

// Rate limit error response helper
export function createRateLimitErrorResponse(
  requestId?: string
): NextResponse<ApiResponse> {
  return createErrorResponse(
    'Rate limit exceeded',
    429,
    {
      code: 'RATE_LIMIT_EXCEEDED',
      details: 'Too many requests made in a short period',
      suggestedAction: 'Please wait a moment before making another request',
      requestId,
    }
  );
}

// Server error response helper
export function createServerErrorResponse(
  error: Error,
  requestId?: string,
  context?: Record<string, unknown>
): NextResponse<ApiResponse> {
  // Log the error for debugging
  logger.apiError('Server error', error, { requestId, ...context });
  
  return createErrorResponse(
    'Internal server error',
    500,
    {
      code: 'INTERNAL_SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      suggestedAction: 'Please try again later or contact support if the issue persists',
      requestId,
    }
  );
}

// Type guards for response validation
export function isSuccessResponse<T>(response: unknown): response is ApiResponse<T> {
  if (!response || typeof response !== 'object' || response === null) {
    return false;
  }
  if (!('success' in response)) {
    return false;
  }
  return (response as { success: boolean }).success === true;
}

export function isErrorResponse(response: unknown): response is ApiResponse {
  if (!response || typeof response !== 'object' || response === null) {
    return false;
  }
  if (!('success' in response)) {
    return false;
  }
  return (response as { success: boolean }).success === false;
}

// Response validation schema
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    details: z.string().optional(),
    suggestedAction: z.string().optional(),
  }).optional(),
  meta: z.object({
    timestamp: z.string(),
    requestId: z.string().optional(),
  }).optional(),
});

// Helper to validate API response format
export function validateApiResponse(response: unknown): {
  valid: boolean;
  error?: string;
} {
  try {
    apiResponseSchema.parse(response);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', '),
      };
    }
    return { valid: false, error: 'Unknown validation error' };
  }
}

// Standardized pagination response
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function createPaginatedResponse<T>(
  items: T[],
  page: number,
  limit: number,
  total: number
): NextResponse<ApiResponse<PaginatedResponse<T>>> {
  const totalPages = Math.ceil(total / limit);
  
  return createSuccessResponse({
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
}
// ============================================================================
// THERAPEUTIC-SPECIFIC RESPONSE UTILITIES
// ============================================================================

/**
 * Specialized response for therapeutic session operations
 */
export interface TherapeuticSessionResponse {
  sessionId: string;
  status: 'active' | 'completed' | 'paused';
  messageCount: number;
  duration?: number;
  insights?: string[];
  nextSuggestedAction?: string;
}

export function createSessionResponse(
  sessionData: TherapeuticSessionResponse,
  requestId?: string
): NextResponse<ApiResponse<TherapeuticSessionResponse>> {
  return createSuccessResponse(sessionData, {
    requestId,
    timestamp: new Date().toISOString()
  });
}

/**
 * Specialized response for AI chat completions
 */
export interface ChatCompletionResponse {
  messageId: string;
  content: string;
  model: string;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  processingTime?: number;
  therapeuticContext?: {
    moodDetected?: string;
    emotionalSupport?: boolean;
    riskAssessment?: 'low' | 'medium' | 'high';
  };
}

export function createChatCompletionResponse(
  completionData: ChatCompletionResponse,
  requestId?: string
): NextResponse<ApiResponse<ChatCompletionResponse>> {
  return createSuccessResponse(completionData, {
    requestId,
    timestamp: new Date().toISOString()
  });
}

/**
 * Add therapeutic safety headers to any response
 */
export function addTherapeuticHeaders<T>(
  response: NextResponse<ApiResponse<T>>
): NextResponse<ApiResponse<T>> {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Therapeutic-Context', 'enabled');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}
