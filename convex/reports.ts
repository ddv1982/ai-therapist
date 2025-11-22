import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { QUERY_LIMITS } from './constants';
import type { Id } from './_generated/dataModel';
import type { QueryCtx, MutationCtx } from './_generated/server';

/**
 * Helper function to get and verify authenticated user
 * Throws if user is not authenticated
 */
async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error('Unauthorized: Authentication required');
  }

  const user = await ctx.db
    .query('users')
    .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
    .unique();

  if (!user) {
    throw new Error('Unauthorized: User not found');
  }

  return user;
}

/**
 * Helper function to verify session ownership
 * Throws if the session doesn't belong to the authenticated user
 */
async function verifySessionOwnership(
  ctx: QueryCtx | MutationCtx,
  sessionId: Id<'sessions'>,
  userId: Id<'users'>
) {
  const session = await ctx.db.get(sessionId);
  
  if (!session) {
    throw new Error('Session not found');
  }

  if (session.userId !== userId) {
    throw new Error('Forbidden: You do not have access to this session');
  }

  return session;
}

/**
 * Helper function to verify report ownership (via session ownership)
 * Throws if the report doesn't belong to a session owned by the authenticated user
 * 
 * Note: Currently unused but kept for future report-specific queries (e.g., reports.getById)
 */
async function verifyReportOwnership(
  ctx: QueryCtx | MutationCtx,
  reportId: Id<'sessionReports'>,
  userId: Id<'users'>
) {
  const report = await ctx.db.get(reportId);
  
  if (!report) {
    throw new Error('Report not found');
  }

  await verifySessionOwnership(ctx, report.sessionId, userId);

  return report;
}

// Mark as used to avoid linting errors - will be needed when report queries are added
void verifyReportOwnership;

export const listBySession = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) => {
    // Verify authentication
    const authenticatedUser = await getAuthenticatedUser(ctx);
    
    // Verify session ownership
    await verifySessionOwnership(ctx, sessionId, authenticatedUser._id);

    return await ctx.db
      .query('sessionReports')
      .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
      .collect();
  },
});

export const create = mutation({
  args: {
    sessionId: v.id('sessions'),
    reportContent: v.string(),
    keyPoints: v.any(),
    therapeuticInsights: v.any(),
    patternsIdentified: v.any(),
    actionItems: v.any(),
    moodAssessment: v.optional(v.string()),
    progressNotes: v.optional(v.string()),
    cognitiveDistortions: v.optional(v.any()),
    schemaAnalysis: v.optional(v.any()),
    therapeuticFrameworks: v.optional(v.any()),
    recommendations: v.optional(v.any()),
    analysisConfidence: v.optional(v.number()),
    analysisVersion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify authentication
    const authenticatedUser = await getAuthenticatedUser(ctx);
    
    // Verify session ownership
    await verifySessionOwnership(ctx, args.sessionId, authenticatedUser._id);

    const now = Date.now();
    const id = await ctx.db.insert('sessionReports', {
      ...args,
      createdAt: now,
    });
    return await ctx.db.get(id);
  },
});

export const removeMany = mutation({
  args: { ids: v.array(v.id('sessionReports')) },
  handler: async (ctx, { ids }) => {
    // Verify authentication
    const authenticatedUser = await getAuthenticatedUser(ctx);

    let deletedCount = 0;
    for (const id of ids) {
      const report = await ctx.db.get(id);
      if (report) {
        // Verify report ownership before deleting
        try {
          await verifySessionOwnership(ctx, report.sessionId, authenticatedUser._id);
          await ctx.db.delete(id);
          deletedCount++;
        } catch {
          // Skip reports that user doesn't own
          // This prevents partial failures from breaking the entire batch operation
          continue;
        }
      }
    }
    return { ok: true, count: deletedCount, requested: ids.length };
  },
});

export const listRecent = query({
  args: {
    userId: v.id('users'),
    limit: v.number(),
    excludeSessionId: v.optional(v.id('sessions')),
  },
  handler: async (ctx, { userId, limit, excludeSessionId }) => {
    // Verify authentication
    const authenticatedUser = await getAuthenticatedUser(ctx);
    
    // Ensure user can only list their own reports
    if (authenticatedUser._id !== userId) {
      throw new Error('Forbidden: You can only access your own reports');
    }

    // PERFORMANCE FIX: Use indexed queries instead of full table scan
    // Get user's sessions (indexed query - efficient)
    const userSessions = await ctx.db
      .query('sessions')
      .withIndex('by_user_created', (q) => q.eq('userId', userId))
      .collect();

    const sessionsToQuery = excludeSessionId
      ? userSessions.filter((s) => s._id !== excludeSessionId)
      : userSessions;

    const limit_clamped = Math.max(0, Math.min(limit, QUERY_LIMITS.MAX_REPORTS_PER_REQUEST));

    // Fetch reports for each session using indexed queries (not full table scan!)
    // Use the new compound index 'by_session_created' for sorted results
    const reportPromises = sessionsToQuery.map((session) =>
      ctx.db
        .query('sessionReports')
        .withIndex('by_session_created', (q) => q.eq('sessionId', session._id))
        .order('desc') // Most recent first
        .collect()
    );

    const reportsPerSession = await Promise.all(reportPromises);
    const allUserReports = reportsPerSession.flat();

    // Sort all reports by creation time (descending) and apply limit
    return allUserReports
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit_clamped);
  },
});

/**
 * Internal query for server-side API calls
 * Does not require Clerk authentication (API routes handle auth)
 * Use this ONLY from authenticated API routes
 */
export const listBySessionInternal = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) => {
    // No auth check - caller must verify authorization
    return await ctx.db
      .query('sessionReports')
      .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
      .collect();
  },
});
