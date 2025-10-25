import { query, mutation, internalMutation } from './_generated/server';
import { v } from 'convex/values';

export const listByUser = query({
  args: { userId: v.id('users'), limit: v.optional(v.number()), offset: v.optional(v.number()) },
  handler: async (ctx, { userId, limit = 50, offset = 0 }) => {
    const limit_clamped = Math.min(limit, 100); // Max 100 items per request
    const offset_clamped = Math.max(offset, 0);

    return await ctx.db
      .query('sessions')
      .withIndex('by_user_created', q => q.eq('userId', userId))
      .order('desc')
      .skip(offset_clamped)
      .take(limit_clamped);
  },
});

export const countByUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('sessions')
      .withIndex('by_user_created', q => q.eq('userId', userId))
      .count();
  },
});

export const getWithMessagesAndReports = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session) return null;
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_session_time', q => q.eq('sessionId', sessionId))
      .order('asc')
      .collect();
    const reports = await ctx.db
      .query('sessionReports')
      .withIndex('by_session', q => q.eq('sessionId', sessionId))
      .collect();
    return { session, messages, reports };
  },
});

export const create = mutation({
  args: {
    userId: v.id('users'),
    title: v.string(),
  },
  handler: async (ctx, { userId, title }) => {
    const now = Date.now();
    const sessionId = await ctx.db.insert('sessions', {
      legacyId: undefined,
      userId,
      title,
      messageCount: 0,
      startedAt: now,
      endedAt: null,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(sessionId);
  },
});

export const update = mutation({
  args: {
    sessionId: v.id('sessions'),
    title: v.optional(v.string()),
    status: v.optional(v.string()),
    endedAt: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, { sessionId, title, status, endedAt }) => {
    const session = await ctx.db.get(sessionId);
    if (!session) throw new Error('Session not found');
    const patch: any = { updatedAt: Date.now() };
    if (typeof title !== 'undefined') patch.title = title;
    if (typeof status !== 'undefined') patch.status = status;
    if (typeof endedAt !== 'undefined') patch.endedAt = endedAt;
    await ctx.db.patch(sessionId, patch);
    return await ctx.db.get(sessionId);
  },
});

export const remove = mutation({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) => {
    // delete messages and reports first
    const msgs = await ctx.db
      .query('messages')
      .withIndex('by_session_time', q => q.eq('sessionId', sessionId))
      .collect();
    for (const m of msgs) await ctx.db.delete(m._id);
    const reports = await ctx.db
      .query('sessionReports')
      .withIndex('by_session', q => q.eq('sessionId', sessionId))
      .collect();
    for (const r of reports) await ctx.db.delete(r._id);
    await ctx.db.delete(sessionId);
    return { ok: true };
  },
});

// Internal helper used by messages to adjust messageCount atomically
export const _incrementMessageCount = internalMutation({
  args: { sessionId: v.id('sessions'), delta: v.number() },
  handler: async (ctx, { sessionId, delta }) => {
    const s = await ctx.db.get(sessionId);
    if (!s) throw new Error('Session not found');
    await ctx.db.patch(sessionId, {
      messageCount: Math.max(0, (s.messageCount ?? 0) + delta),
      updatedAt: Date.now(),
    });
  },
});

export const get = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db.get(sessionId);
  },
});
