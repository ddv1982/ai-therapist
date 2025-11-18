import { NextRequest } from 'next/server';
import { getConvexHttpClient, anyApi } from '@/lib/convex/http-client';
import { logger } from '@/lib/utils/logger';
import { withAuth } from '@/lib/api/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/api-response';
import type { ConvexUser, ConvexSession, ConvexSessionReport } from '@/types/convex';

// Legacy POST removed; use /api/reports/generate for report generation

export const GET = withAuth(async (_request: NextRequest, context) => {
  try {
    const client = getConvexHttpClient();
    // Fetch all sessions for mapping
    // Note: We don't have a direct list-all; fetch reports then fetch sessions by id
    const user = (await client.query(anyApi.users.getByClerkId, {
      clerkId: (context.userInfo as { clerkId?: string }).clerkId ?? '',
    })) as ConvexUser | null;
    const sessions = user
      ? ((await client.query(anyApi.sessions.listByUser, { userId: user._id })) as ConvexSession[])
      : [];
    const sessionMap = new Map<string, ConvexSession>(
      (Array.isArray(sessions) ? sessions : []).map((s) => [s._id, s])
    );
    // Collect all reports for user's sessions
    const reports: Array<ConvexSessionReport & { session?: ConvexSession }> = [];
    for (const s of Array.isArray(sessions) ? sessions : []) {
      const rs = (await client.query(anyApi.reports.listBySession, {
        sessionId: s._id,
      })) as ConvexSessionReport[];
      for (const r of rs) {
        reports.push({ ...r, session: sessionMap.get(s._id) });
      }
    }
    reports.sort((a, b) => b.createdAt - a.createdAt);
    const response = reports.map((r) => ({
      ...r,
      session: r.session
        ? {
            id: r.session._id,
            title: r.session.title,
            startedAt: new Date(r.session.startedAt),
            endedAt: r.session.endedAt ? new Date(r.session.endedAt) : null,
          }
        : null,
    }));

    return createSuccessResponse(response, { requestId: context.requestId });
  } catch (error) {
    logger.apiError('/api/reports', error as Error, { ...context });
    return createErrorResponse('Failed to fetch reports', 500, { requestId: context.requestId });
  }
});
