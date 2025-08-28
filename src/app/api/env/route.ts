import { NextRequest } from 'next/server';
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
export const GET = async (_request: NextRequest) => {
  const response: EnvironmentResponse = {
    hasGroqApiKey: !!process.env.GROQ_API_KEY,
    environment: process.env.NODE_ENV || 'development'
  };

  return createSuccessResponse(response, { requestId: 'env-request' });
};