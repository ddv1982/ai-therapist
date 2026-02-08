import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { QUERY_LIMITS } from './constants';
import { requireOwnership, requireUserAccess } from './lib/errors';
import {
  flexibleKeyPointsValidator,
  flexibleTherapeuticInsightsValidator,
  flexiblePatternsIdentifiedValidator,
  flexibleActionItemsValidator,
  flexibleCognitiveDistortionsValidator,
  schemaAnalysisValidator,
  therapeuticFrameworksValidator,
  recommendationsValidator,
} from './validators';

export const listBySession = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) => {
    await requireOwnership(ctx, sessionId);
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
    keyPoints: flexibleKeyPointsValidator,
    therapeuticInsights: flexibleTherapeuticInsightsValidator,
    patternsIdentified: flexiblePatternsIdentifiedValidator,
    actionItems: flexibleActionItemsValidator,
    moodAssessment: v.optional(v.string()),
    progressNotes: v.optional(v.string()),
    cognitiveDistortions: flexibleCognitiveDistortionsValidator,
    schemaAnalysis: schemaAnalysisValidator,
    therapeuticFrameworks: therapeuticFrameworksValidator,
    recommendations: recommendationsValidator,
    analysisConfidence: v.optional(v.number()),
    analysisVersion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOwnership(ctx, args.sessionId);
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
    let deletedCount = 0;
    for (const id of ids) {
      const report = await ctx.db.get(id);
      if (report) {
        await requireOwnership(ctx, report.sessionId);
        await ctx.db.delete(id);
        deletedCount++;
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
    await requireUserAccess(ctx, userId);
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

    // Fetch only the per-session top-N to avoid loading full report histories.
    // This bounds query volume while preserving globally-correct top-N results.
    const reportPromises = sessionsToQuery.map((session) =>
      ctx.db
        .query('sessionReports')
        .withIndex('by_session_created', (q) => q.eq('sessionId', session._id))
        .order('desc') // Most recent first
        .take(limit_clamped)
    );

    const reportsPerSession = await Promise.all(reportPromises);
    const allUserReports = reportsPerSession.flat();

    // Sort all reports by creation time (descending) and apply limit
    return allUserReports.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit_clamped);
  },
});

export const listRecentWithSession = query({
  args: {
    userId: v.id('users'),
    limit: v.number(),
    excludeSessionId: v.optional(v.id('sessions')),
  },
  handler: async (ctx, { userId, limit, excludeSessionId }) => {
    await requireUserAccess(ctx, userId);

    const userSessions = await ctx.db
      .query('sessions')
      .withIndex('by_user_created', (q) => q.eq('userId', userId))
      .collect();

    const sessionsToQuery = excludeSessionId
      ? userSessions.filter((s) => s._id !== excludeSessionId)
      : userSessions;

    const sessionMeta = new Map(
      sessionsToQuery.map((session) => [
        session._id,
        {
          sessionTitle: session.title,
          sessionStartedAt: session.startedAt,
          sessionEndedAt: session.endedAt ?? null,
        },
      ])
    );

    const limit_clamped = Math.max(0, Math.min(limit, QUERY_LIMITS.MAX_REPORTS_PER_REQUEST));

    const reportPromises = sessionsToQuery.map((session) =>
      ctx.db
        .query('sessionReports')
        .withIndex('by_session_created', (q) => q.eq('sessionId', session._id))
        .order('desc')
        .take(limit_clamped)
    );

    const reportsPerSession = await Promise.all(reportPromises);
    const allUserReports = reportsPerSession.flat();

    return allUserReports
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit_clamped)
      .map((report) => ({
        ...report,
        sessionTitle: sessionMeta.get(report.sessionId)?.sessionTitle,
        sessionStartedAt: sessionMeta.get(report.sessionId)?.sessionStartedAt,
        sessionEndedAt: sessionMeta.get(report.sessionId)?.sessionEndedAt,
      }));
  },
});

export const listByUserWithSession = query({
  args: {
    userId: v.id('users'),
    excludeSessionId: v.optional(v.id('sessions')),
  },
  handler: async (ctx, { userId, excludeSessionId }) => {
    await requireUserAccess(ctx, userId);

    const userSessions = await ctx.db
      .query('sessions')
      .withIndex('by_user_created', (q) => q.eq('userId', userId))
      .collect();

    const sessionsToQuery = excludeSessionId
      ? userSessions.filter((s) => s._id !== excludeSessionId)
      : userSessions;

    const sessionMeta = new Map(
      sessionsToQuery.map((session) => [
        session._id,
        {
          sessionTitle: session.title,
          sessionStartedAt: session.startedAt,
          sessionEndedAt: session.endedAt ?? null,
        },
      ])
    );

    const reportPromises = sessionsToQuery.map((session) =>
      ctx.db
        .query('sessionReports')
        .withIndex('by_session_created', (q) => q.eq('sessionId', session._id))
        .order('desc')
        .collect()
    );

    const reportsPerSession = await Promise.all(reportPromises);
    const allUserReports = reportsPerSession.flat();

    return allUserReports
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((report) => ({
        ...report,
        sessionTitle: sessionMeta.get(report.sessionId)?.sessionTitle,
        sessionStartedAt: sessionMeta.get(report.sessionId)?.sessionStartedAt,
        sessionEndedAt: sessionMeta.get(report.sessionId)?.sessionEndedAt,
      }));
  },
});
