import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/api-response';
import { logger } from '@/lib/utils/logger';

export const POST = async (request: NextRequest) => {
  try {
    const errorData = await request.json();

    logger.error('Client error report', {
      clientErrorData: errorData,
      apiEndpoint: '/api/errors',
      userAgent: request.headers.get('user-agent') || undefined
    });

    return createSuccessResponse(
      { message: 'Error logged successfully' },
      { requestId: 'error-report' }
    );
  } catch (error) {
    logger.error('Failed to log client error', { error: (error as Error).message });
    return createErrorResponse('Failed to log error', 500, { requestId: 'error-report' });
  }
};

export const GET = async (_request: NextRequest) => {
  return createSuccessResponse(
    {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      env: process.env.NODE_ENV
    },
    { requestId: 'system-info' }
  );
};