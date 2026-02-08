import { query, mutation, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import type { Doc } from './_generated/dataModel';
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

type SessionReportDoc = Doc<'sessionReports'>;

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
    const { user } = await requireOwnership(ctx, args.sessionId);
    const now = Date.now();
    const id = await ctx.db.insert('sessionReports', {
      ...args,
      userId: user._id,
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
    const limit_clamped = Math.max(0, Math.min(limit, QUERY_LIMITS.MAX_REPORTS_PER_REQUEST));
    if (limit_clamped === 0) return [];

    const filtered: SessionReportDoc[] = [];
    let cursor: string | null = null;
    const batchSize = Math.max(
      25,
      Math.min(QUERY_LIMITS.MAX_REPORTS_PER_REQUEST, limit_clamped * 2)
    );

    while (filtered.length < limit_clamped) {
      const page = await ctx.db
        .query('sessionReports')
        .withIndex('by_user_created', (q) => q.eq('userId', userId))
        .order('desc')
        .paginate({ numItems: batchSize, cursor });

      for (const report of page.page) {
        if (excludeSessionId && report.sessionId === excludeSessionId) continue;
        filtered.push(report);
        if (filtered.length >= limit_clamped) break;
      }

      if (page.isDone) break;
      cursor = page.continueCursor;
    }

    return filtered.slice(0, limit_clamped);
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
    const limit_clamped = Math.max(0, Math.min(limit, QUERY_LIMITS.MAX_REPORTS_PER_REQUEST));
    if (limit_clamped === 0) return [];

    const reports: SessionReportDoc[] = [];
    let cursor: string | null = null;
    const batchSize = Math.max(
      25,
      Math.min(QUERY_LIMITS.MAX_REPORTS_PER_REQUEST, limit_clamped * 2)
    );

    while (reports.length < limit_clamped) {
      const page = await ctx.db
        .query('sessionReports')
        .withIndex('by_user_created', (q) => q.eq('userId', userId))
        .order('desc')
        .paginate({ numItems: batchSize, cursor });

      for (const report of page.page) {
        if (excludeSessionId && report.sessionId === excludeSessionId) continue;
        reports.push(report);
        if (reports.length >= limit_clamped) break;
      }

      if (page.isDone) break;
      cursor = page.continueCursor;
    }

    const sessionIds = [...new Set(reports.map((report) => report.sessionId))];
    const sessions = await Promise.all(sessionIds.map((sessionId) => ctx.db.get(sessionId)));
    const sessionMeta = new Map(
      sessions
        .filter((session): session is NonNullable<typeof session> => Boolean(session))
        .map((session) => [
          session._id,
          {
            sessionTitle: session.title,
            sessionStartedAt: session.startedAt,
            sessionEndedAt: session.endedAt ?? null,
          },
        ])
    );

    return reports.slice(0, limit_clamped).map((report) => ({
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

    const reports: SessionReportDoc[] = [];
    let cursor: string | null = null;

    while (true) {
      const page = await ctx.db
        .query('sessionReports')
        .withIndex('by_user_created', (q) => q.eq('userId', userId))
        .order('desc')
        .paginate({ numItems: QUERY_LIMITS.MAX_REPORTS_PER_REQUEST, cursor });

      for (const report of page.page) {
        if (excludeSessionId && report.sessionId === excludeSessionId) continue;
        reports.push(report);
      }

      if (page.isDone) break;
      cursor = page.continueCursor;
    }

    const sessionIds = [...new Set(reports.map((report) => report.sessionId))];
    const sessions = await Promise.all(sessionIds.map((sessionId) => ctx.db.get(sessionId)));
    const sessionMeta = new Map(
      sessions
        .filter((session): session is NonNullable<typeof session> => Boolean(session))
        .map((session) => [
          session._id,
          {
            sessionTitle: session.title,
            sessionStartedAt: session.startedAt,
            sessionEndedAt: session.endedAt ?? null,
          },
        ])
    );

    return reports.map((report) => ({
      ...report,
      sessionTitle: sessionMeta.get(report.sessionId)?.sessionTitle,
      sessionStartedAt: sessionMeta.get(report.sessionId)?.sessionStartedAt,
      sessionEndedAt: sessionMeta.get(report.sessionId)?.sessionEndedAt,
    }));
  },
});

export const _backfillReportUserIds = internalMutation({
  args: {
    cursor: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, { cursor, batchSize }) => {
    const pageSize = Math.max(1, Math.min(batchSize ?? 200, 500));
    const page = await ctx.db
      .query('sessionReports')
      .order('asc')
      .paginate({ numItems: pageSize, cursor: cursor ?? null });

    let updated = 0;
    let skipped = 0;
    let missingSession = 0;

    for (const report of page.page) {
      if (report.userId) {
        skipped += 1;
        continue;
      }

      const session = await ctx.db.get(report.sessionId);
      if (!session) {
        missingSession += 1;
        continue;
      }

      await ctx.db.patch(report._id, { userId: session.userId });
      updated += 1;
    }

    return {
      scanned: page.page.length,
      updated,
      skipped,
      missingSession,
      continueCursor: page.continueCursor,
      isDone: page.isDone,
    };
  },
});
