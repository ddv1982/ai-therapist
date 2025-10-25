import { withApiMiddleware } from '@/lib/api/api-middleware';
import { createSuccessResponse } from '@/lib/api/api-response';
import { env } from '@/config/env';

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
export const GET = withApiMiddleware(async (_request, context) => {
  const response: EnvironmentResponse = {
    hasGroqApiKey: Boolean(env.GROQ_API_KEY),
    environment: env.NODE_ENV,
  };

  return createSuccessResponse(response, { requestId: context.requestId });
});
