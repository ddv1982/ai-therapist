import { query, mutation, internalMutation } from './_generated/server';
import type { QueryCtx, MutationCtx } from './_generated/server';
import { v } from 'convex/values';
import { QUERY_LIMITS } from './constants';
import type { Doc } from './_generated/dataModel';

/** Paginated query for user sessions. Returns newest first. */
export const listByUserPaginated = query({
  args: {
    userId: v.id('users'),
    numItems: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, { userId, numItems, cursor }) => {
    const user = await requireUser(ctx);
    if (user._id !== userId) {
      throw new Error('Session access denied');
    }
    const numItems_clamped = Math.min(numItems ?? QUERY_LIMITS.DEFAULT_LIMIT, QUERY_LIMITS.MAX_SESSIONS_PER_REQUEST);
    
    const result = await ctx.db
      .query('sessions')
      .withIndex('by_user_created', (q) => q.eq('userId', userId))
      .order('desc')
      .paginate({
        numItems: numItems_clamped,
        cursor: cursor || null,
      });

    return {
      page: result.page,
      continueCursor: result.continueCursor,
      isDone: result.isDone,
    };
  },
});

/** Get all sessions for a user. Use sparingly - prefer paginated query. */
export const listByUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const user = await requireUser(ctx);
    if (user._id !== userId) {
      throw new Error('Session access denied');
    }
    return await ctx.db
      .query('sessions')
      .withIndex('by_user_created', (q) => q.eq('userId', userId))
      .order('desc')
      .collect();
  },
});

/** Count sessions for a user. Returns cached count for O(1) performance. */
export const countByUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const user = await requireUser(ctx);
    if (user._id !== userId) {
      throw new Error('Session access denied');
    }
    return user.sessionCount ?? 0;
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
    
    // Update user's cached session count
    await ctx.db.patch(user._id, {
      sessionCount: (user.sessionCount ?? 0) + 1,
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
    const { user } = await requireSessionOwnership(ctx, sessionId);
    
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
    
    // Update user's cached session count
    await ctx.db.patch(user._id, {
      sessionCount: Math.max(0, (user.sessionCount ?? 1) - 1),
      updatedAt: Date.now(),
    });
    
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

/**
 * Migration: Initialize sessionCount for existing users.
 * Run this once after deploying the schema change.
 */
export const _initializeSessionCounts = internalMutation({
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect();
    
    for (const user of users) {
      if (user.sessionCount !== undefined) continue; // Already initialized
      
      // Count sessions for this user
      const sessions = await ctx.db
        .query('sessions')
        .withIndex('by_user_created', (q) => q.eq('userId', user._id))
        .collect();
      
      await ctx.db.patch(user._id, {
        sessionCount: sessions.length,
      });
    }
    
    return { usersUpdated: users.filter(u => u.sessionCount === undefined).length };
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
