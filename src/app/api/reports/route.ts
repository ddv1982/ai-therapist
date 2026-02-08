import { NextRequest } from 'next/server';
import { getAuthenticatedConvexClient, anyApi } from '@/lib/convex/http-client';
import { logger } from '@/lib/utils/logger';
import { withAuth } from '@/lib/api/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/api-response';
import type { ConvexUser, ConvexSessionReport } from '@/types/convex';

// Legacy POST removed; use /api/reports/generate for report generation

export const GET = withAuth(async (_request: NextRequest, context) => {
  try {
    const client = getAuthenticatedConvexClient(context.jwtToken);
    const user = (await client.query(anyApi.users.getByClerkId, {
      clerkId: context.principal.clerkId,
    })) as ConvexUser | null;
    const reports = user
      ? ((await client.query(anyApi.reports.listByUserWithSession, {
          userId: user._id,
        })) as Array<
          ConvexSessionReport & {
            sessionTitle?: string;
            sessionStartedAt?: number;
            sessionEndedAt?: number | null;
          }
        >)
      : [];
    const response = reports.map((r) => ({
      ...r,
      session: r.sessionTitle
        ? {
            id: String(r.sessionId),
            title: r.sessionTitle,
            startedAt: new Date(r.sessionStartedAt ?? r.createdAt),
            endedAt: r.sessionEndedAt ? new Date(r.sessionEndedAt) : null,
          }
        : null,
    }));

    return createSuccessResponse(response, { requestId: context.requestId });
  } catch (error) {
    logger.apiError('/api/reports', error as Error, { ...context });
    return createErrorResponse('Failed to fetch reports', 500, { requestId: context.requestId });
  }
});
