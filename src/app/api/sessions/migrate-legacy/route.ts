import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/api-response';
import { getConvexHttpClient, anyApi } from '@/lib/convex/http-client';
import { UserSessionCache } from '@/lib/cache';

// One-time migration: move sessions from fallback legacy user to the current Clerk user
export const POST = withAuth(async (_req: NextRequest, context) => {
  try {
    const client = getConvexHttpClient();
    const clerkId = context.userInfo.userId;

    // Resolve Convex users: current (by Clerk) and legacy fallback (by legacyId)
    const currentUser = await client.query(anyApi.users.getByClerkId, { clerkId });
    if (!currentUser) {
      return createErrorResponse('Current user not found in Convex', 404, { requestId: context.requestId });
    }

    const legacyId = 'therapeutic-ai-user';
    const legacyUser = await client.query(anyApi.users.getByLegacyId, { legacyId });
    if (!legacyUser) {
      return createSuccessResponse({ migrated: 0, movedSessionIds: [] }, { requestId: context.requestId });
    }

    // Reassign all sessions from legacy to current
    const result = await client.mutation(anyApi.sessions.reassignAllFromUser, {
      fromUserId: legacyUser._id,
      toUserId: currentUser._id,
    });

    const movedSessionIds = (result && (result as { moved?: string[] }).moved) || [];

    // Invalidate user sessions caches
    try {
      await Promise.allSettled([
        UserSessionCache.invalidate(String(currentUser._id)),
        UserSessionCache.invalidate(String(legacyUser._id)),
      ]);
    } catch {}

    return createSuccessResponse({ migrated: movedSessionIds.length, movedSessionIds }, { requestId: context.requestId });
  } catch {
    return createErrorResponse('Migration failed', 500, { requestId: context.requestId });
  }
});
