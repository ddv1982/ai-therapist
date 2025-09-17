import { withApiRoute } from '@/lib/api/with-route';
import { createSuccessResponse } from '@/lib/api/api-response';

/**
 * Environment configuration response
 */
interface EnvironmentResponse {
  hasGroqApiKey: boolean;
  environment: string;
}

/**
 * GET /api/env - Returns environment configuration
 * 
 * @returns {EnvironmentResponse} Environment configuration details
 */
export const GET = withApiRoute(async (_request, context) => {
  const response: EnvironmentResponse = {
    hasGroqApiKey: !!process.env.GROQ_API_KEY,
    environment: process.env.NODE_ENV || 'development'
  };

  return createSuccessResponse(response, { requestId: context.requestId });
});