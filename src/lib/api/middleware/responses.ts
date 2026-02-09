import { NextResponse } from 'next/server';
import { createErrorResponse, type ApiResponse } from '@/lib/api/api-response';

export function createRateLimitResponse<T>(
  requestId: string,
  details: string,
  retryAfter: string
): NextResponse<ApiResponse<T>> {
  const response = createErrorResponse('Rate limit exceeded', 429, {
    code: 'RATE_LIMIT_EXCEEDED',
    details,
    suggestedAction: 'Please wait a moment before making another request',
    requestId,
  }) as NextResponse<ApiResponse<T>>;
  response.headers.set('Retry-After', retryAfter);
  return response;
}
