import { NextRequest } from 'next/server';
import { prisma } from '@/lib/database/db';
import { logger } from '@/lib/utils/logger';
import { withAuthAndRateLimit } from '@/lib/api/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/api-response';

// Legacy POST removed; use /api/reports/generate for report generation

export const GET = withAuthAndRateLimit(async (_request: NextRequest, context) => {
  try {
    const reports = await prisma.sessionReport.findMany({
      include: {
        session: {
          select: {
            id: true,
            title: true,
            startedAt: true,
            endedAt: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return createSuccessResponse(reports, { requestId: context.requestId });
  } catch (error) {
    logger.apiError('/api/reports', error as Error, { ...context });
    return createErrorResponse('Failed to fetch reports', 500, { requestId: context.requestId });
  }
});
