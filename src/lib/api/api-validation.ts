/**
 * Enhanced API Validation Utilities
 * Provides comprehensive request/response validation for API endpoints
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createValidationErrorResponse, ApiResponse } from './api-response';

/**
 * Common validation schemas for API requests
 */
export const commonSchemas = {
  // UUID validation
  uuid: z.string().uuid('Invalid UUID format'),
  
  // Pagination parameters
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
  
  // Therapeutic session identifiers
  sessionId: z.string().uuid('Invalid session ID format'),
  
  // User input validation
  userMessage: z.object({
    content: z.string().min(1, 'Message content cannot be empty').max(50000, 'Message too long'),
    role: z.enum(['user', 'assistant']),
    sessionId: z.string().uuid('Invalid session ID'),
  }),
  
  // AI model selection
  modelSelection: z.object({
    model: z.enum(['openai/gpt-oss-20b', 'openai/gpt-oss-120b']).default('openai/gpt-oss-20b'),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(131000).optional(),
  }),
} as const;

/**
 * Query parameter validation helper
 */
export function validateQueryParams<T extends z.ZodRawShape>(
  request: NextRequest,
  schema: z.ZodObject<T>
): { success: true; data: z.infer<z.ZodObject<T>> } | { success: false; error: string } {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    
    const result = schema.safeParse(params);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return {
        success: false,
        error: result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')
      };
    }
  } catch {
    return { success: false, error: 'Invalid query parameters' };
  }
}

/**
 * Request body validation helper
 */
export async function validateRequestBody<T extends z.ZodRawShape>(
  request: NextRequest,
  schema: z.ZodObject<T>
): Promise<{ success: true; data: z.infer<z.ZodObject<T>> } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return {
        success: false,
        error: result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')
      };
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { success: false, error: 'Invalid JSON in request body' };
    }
    return { success: false, error: 'Request body validation failed' };
  }
}

/**
 * Response validation middleware
 * Validates API responses match the standardized format
 */
export function validateApiResponse<T>(
  response: unknown
): response is ApiResponse<T> {
  const responseSchema = z.object({
    success: z.boolean(),
    data: z.unknown().optional(),
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

  try {
    responseSchema.parse(response);
    return true;
  } catch {
    return false;
  }
}

/**
 * Enhanced middleware wrapper with comprehensive validation
 */
export function withRequestValidation<TBody extends z.ZodRawShape, TQuery extends z.ZodRawShape>(
  bodySchema?: z.ZodObject<TBody>,
  querySchema?: z.ZodObject<TQuery>
) {
  return function <TResponse>(
    handler: (
      request: NextRequest,
      context: {
        requestId: string;
        body?: z.infer<z.ZodObject<TBody>>;
        query?: z.infer<z.ZodObject<TQuery>>;
      }
    ) => Promise<Response | ApiResponse<TResponse>>
  ) {
    return async (request: NextRequest) => {
      const requestId = crypto.randomUUID();

      try {
        // Validate query parameters if schema provided
        let queryData: z.infer<z.ZodObject<TQuery>> | undefined;
        if (querySchema) {
          const queryResult = validateQueryParams(request, querySchema);
          if (!queryResult.success) {
            return createValidationErrorResponse(queryResult.error, requestId);
          }
          queryData = queryResult.data;
        }

        // Validate request body if schema provided
        let bodyData: z.infer<z.ZodObject<TBody>> | undefined;
        if (bodySchema && (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')) {
          const bodyResult = await validateRequestBody(request, bodySchema);
          if (!bodyResult.success) {
            return createValidationErrorResponse(bodyResult.error, requestId);
          }
          bodyData = bodyResult.data;
        }

        // Call the handler with validated data
        return await handler(request, {
          requestId,
          body: bodyData,
          query: queryData,
        });
      } catch (error) {
        return createValidationErrorResponse(
          error instanceof Error ? error.message : 'Request validation failed',
          requestId
        );
      }
    };
  };
}

/**
 * Therapeutic-specific validation schemas
 */
export const therapeuticSchemas = {
  // CBT session data
  cbtSession: z.object({
    situation: z.string().min(1).max(2000),
    emotions: z.record(z.string(), z.number().min(0).max(10)),
    thoughts: z.array(z.object({
      content: z.string().min(1),
      credibility: z.number().min(0).max(10),
    })),
    coreBeliefs: z.string().max(1000),
  }),
  
  // Session report generation
  reportGeneration: z.object({
    sessionId: z.string().uuid(),
    includeInsights: z.boolean().default(true),
    includeSuggestions: z.boolean().default(true),
    format: z.enum(['summary', 'detailed']).default('summary'),
  }),
  
  // Memory management
  memoryManagement: z.object({
    operation: z.enum(['create', 'update', 'delete', 'archive']),
    memoryId: z.string().uuid().optional(),
    content: z.string().max(10000).optional(),
    importance: z.enum(['low', 'medium', 'high']).default('medium'),
  }),
} as const;

/**
 * Rate limiting validation
 */
export function validateRateLimit(
  _request: NextRequest,
  _limits: {
    windowMs: number;
    maxRequests: number;
  }
): boolean {
  // This would integrate with your rate limiting system
  // For now, return true (no rate limiting)
  return true;
}

/**
 * Content safety validation for therapeutic context
 */
export function validateTherapeuticContent(content: string): {
  safe: boolean;
  concerns?: string[];
  riskLevel: 'low' | 'medium' | 'high';
} {
  const concerns: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';

  // Basic safety checks for therapeutic content
  const harmIndicators = [
    /self.{0,10}harm/i,
    /suicide|suicidal/i,
    /kill.{0,10}myself/i,
    /end.{0,10}it.{0,10}all/i,
  ];

  const crisisIndicators = [
    /can't.{0,10}go.{0,10}on/i,
    /nothing.{0,10}left/i,
    /better.{0,10}off.{0,10}dead/i,
  ];

  for (const indicator of harmIndicators) {
    if (indicator.test(content)) {
      concerns.push('Potential self-harm content detected');
      riskLevel = 'high';
      break;
    }
  }

  for (const indicator of crisisIndicators) {
    if (indicator.test(content)) {
      concerns.push('Crisis language detected');
      riskLevel = riskLevel === 'high' ? 'high' : 'medium';
    }
  }

  return {
    safe: concerns.length === 0,
    concerns: concerns.length > 0 ? concerns : undefined,
    riskLevel,
  };
}

const validationUtils = {
  commonSchemas,
  therapeuticSchemas,
  validateQueryParams,
  validateRequestBody,
  validateApiResponse,
  withRequestValidation,
  validateRateLimit,
  validateTherapeuticContent,
};

export default validationUtils;