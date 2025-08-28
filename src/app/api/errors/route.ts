import { withApiMiddleware } from '@/lib/api/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/api-response';
import { logger } from '@/lib/utils/logger';

export const POST = withApiMiddleware(async (request, context) => {
  try {
    const errorData = await request.json();

    logger.error('Client error report', {
      ...context,
      clientErrorData: errorData,
      apiEndpoint: '/api/errors'
    });

    return createSuccessResponse(
      { message: 'Error logged successfully' },
      { requestId: context.requestId }
    );
  } catch (error) {
    logger.apiError('/api/errors', error as Error, context);
    return createErrorResponse('Failed to log error', 500, { requestId: context.requestId });
  }
});

export const GET = withApiMiddleware(async (_request, context) => {
  return createSuccessResponse(
    {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      env: process.env.NODE_ENV
    },
    { requestId: context.requestId }
  );
});