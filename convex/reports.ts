import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const listBySession = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) => {
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
    const now = Date.now();
    const id = await ctx.db.insert('sessionReports', {
      legacyId: undefined,
      ...args,
      createdAt: now,
    });
    return await ctx.db.get(id);
  },
});

export const removeMany = mutation({
  args: { ids: v.array(v.id('sessionReports')) },
  handler: async (ctx, { ids }) => {
    for (const id of ids) await ctx.db.delete(id);
    return { ok: true, count: ids.length };
  },
});

export const listRecent = query({
  args: {
    userId: v.id('users'),
    limit: v.number(),
    excludeSessionId: v.optional(v.id('sessions')),
  },
  handler: async (ctx, { userId, limit, excludeSessionId }) => {
    // Get all sessions for this user first
    const userSessions = await ctx.db
      .query('sessions')
      .withIndex('by_user_created', (q) => q.eq('userId', userId))
      .collect();

    const sessionIds = new Set(userSessions.map((s) => s._id));

    // Filter reports to only those belonging to user's sessions
    const allReports = await ctx.db.query('sessionReports').collect();
    const userReports = allReports.filter(
      (r) => sessionIds.has(r.sessionId) && (!excludeSessionId || r.sessionId !== excludeSessionId)
    );

    return userReports
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, Math.max(0, Math.min(limit, 50)));
  },
});
