import { NextRequest } from 'next/server';
import { getConvexHttpClient, anyApi } from '@/lib/convex/httpClient';
import { logger } from '@/lib/utils/logger';
import { withAuth } from '@/lib/api/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/api-response';

// Legacy POST removed; use /api/reports/generate for report generation

export const GET = withAuth(async (_request: NextRequest, context) => {
  try {
    const client = getConvexHttpClient();
    // Fetch all sessions for mapping
    // Note: We don't have a direct list-all; fetch reports then fetch sessions by id
    const user = await client.query(anyApi.users.getByLegacyId, { legacyId: context.userInfo.userId });
    const sessions = user ? await client.query(anyApi.sessions.listByUser, { userId: user._id }) : [];
    const sessionMap = new Map<string, any>((Array.isArray(sessions) ? sessions : []).map((s: any) => [String(s._id), s]));
    // Collect all reports for user's sessions
    const reports: any[] = [];
    for (const s of (Array.isArray(sessions) ? sessions : [])) {
      const rs = await client.query(anyApi.reports.listBySession, { sessionId: (s as any)._id });
      for (const r of (rs as any[])) {
        reports.push({ ...r, session: sessionMap.get(String(s._id)) });
      }
    }
    reports.sort((a, b) => b.createdAt - a.createdAt);
    const response = reports.map(r => ({
      ...r,
      session: r.session ? {
        id: String(r.session._id),
        title: r.session.title,
        startedAt: new Date(r.session.startedAt),
        endedAt: r.session.endedAt ? new Date(r.session.endedAt) : null,
      } : null,
    }));

    return createSuccessResponse(response, { requestId: context.requestId });
  } catch (error) {
    logger.apiError('/api/reports', error as Error, { ...context });
    return createErrorResponse('Failed to fetch reports', 500, { requestId: context.requestId });
  }
});
