import { query, mutation, internalMutation } from './_generated/server';
import type { QueryCtx, MutationCtx } from './_generated/server';
import { v } from 'convex/values';
import { QUERY_LIMITS, PAGINATION_DEFAULTS } from './constants';
import type { Doc } from './_generated/dataModel';

export const listByUser = query({
  args: { userId: v.id('users'), limit: v.optional(v.number()), offset: v.optional(v.number()) },
  handler: async (ctx, { userId, limit, offset }) => {
    const user = await requireUser(ctx);
    if (user._id !== userId) {
      throw new Error('Session access denied');
    }
    const limitValue = Math.min(limit ?? QUERY_LIMITS.DEFAULT_LIMIT, QUERY_LIMITS.MAX_SESSIONS_PER_REQUEST);
    const offsetValue = Math.max(offset ?? PAGINATION_DEFAULTS.DEFAULT_OFFSET, PAGINATION_DEFAULTS.MIN_OFFSET);

    // PERFORMANCE FIX: Use pagination instead of fetching all and slicing
    // Unfortunately Convex doesn't have native skip/limit, so we iterate and collect manually
    const results: Doc<'sessions'>[] = [];
    let index = 0;
    
    for await (const session of ctx.db
      .query('sessions')
      .withIndex('by_user_created', (q) => q.eq('userId', userId))
      .order('desc')) {
      
      // Skip items until we reach the offset
      if (index < offsetValue) {
        index++;
        continue;
      }
      
      results.push(session);
      
      // Stop once we have enough items
      if (results.length >= limitValue) {
        break;
      }
      
      index++;
    }

    return results;
  },
});

export const countByUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const user = await requireUser(ctx);
    if (user._id !== userId) {
      throw new Error('Session access denied');
    }
    // PERFORMANCE FIX: Count without collecting all records
    // Unfortunately Convex doesn't have a native count(), so we iterate and count
    let count = 0;
    for await (const session of ctx.db
      .query('sessions')
      .withIndex('by_user_created', (q) => q.eq('userId', userId))) {
      // Just counting, not using the session data
      void session;
      count++;
    }
    return count;
  },
});

export const getWithMessagesAndReports = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) => {
    const { session } = await requireSessionOwnership(ctx, sessionId);
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_session_time', (q) => q.eq('sessionId', sessionId))
      .order('asc')
      .collect();
    const reports = await ctx.db
      .query('sessionReports')
      .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
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
    const user = await requireUser(ctx);
    if (user._id !== userId) {
      throw new Error('Session access denied');
    }
    const now = Date.now();
    const sessionId = await ctx.db.insert('sessions', {
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
    await requireSessionOwnership(ctx, sessionId);
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
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
    await requireSessionOwnership(ctx, sessionId);
    
    const msgs = await ctx.db
      .query('messages')
      .withIndex('by_session_time', (q) => q.eq('sessionId', sessionId))
      .collect();
    for (const m of msgs) {
      await ctx.db.delete(m._id);
    }
    
    const reports = await ctx.db
      .query('sessionReports')
      .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
      .collect();
    for (const r of reports) {
      await ctx.db.delete(r._id);
    }
    
    await ctx.db.delete(sessionId);
    
    return { ok: true, deleted: true };
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
    const { session } = await requireSessionOwnership(ctx, sessionId);
    return session;
  },
});

type AnyCtx = QueryCtx | MutationCtx;

async function requireUser(ctx: AnyCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error('Unauthorized: Authentication required');
  }
  const user = await ctx.db
    .query('users')
    .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
    .unique();
  if (!user) {
    throw new Error('Unauthorized: User record not found');
  }
  return user;
}

async function requireSessionOwnership(ctx: AnyCtx, sessionId: Doc<'sessions'>['_id']) {
  const user = await requireUser(ctx);
  const session = await ctx.db.get(sessionId);
  if (!session || session.userId !== user._id) {
    throw new Error('Session not found or access denied');
  }
  return { user, session };
}
