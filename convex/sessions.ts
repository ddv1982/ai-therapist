import { query, mutation, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { QUERY_LIMITS } from './constants';
import { requireOwnership, requireUserAccess } from './lib/errors';
import {
  ensureMessageCountShardsInitialized,
  MESSAGE_COUNT_SHARDS,
  getMessageCountForSession,
  getMessageCountsByUser,
} from './lib/message_counts';

/** Paginated query for user sessions. Returns newest first. */
export const listByUserPaginated = query({
  args: {
    userId: v.id('users'),
    numItems: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, { userId, numItems, cursor }) => {
    await requireUserAccess(ctx, userId);
    const numItems_clamped = Math.min(
      numItems ?? QUERY_LIMITS.DEFAULT_LIMIT,
      QUERY_LIMITS.MAX_SESSIONS_PER_REQUEST
    );

    const result = await ctx.db
      .query('sessions')
      .withIndex('by_user_created', (q) => q.eq('userId', userId))
      .order('desc')
      .paginate({
        numItems: numItems_clamped,
        cursor: cursor || null,
      });

    const counts = await getMessageCountsByUser(ctx, userId);
    const page = result.page.map((session) => ({
      ...session,
      messageCount: counts.get(session._id) ?? 0,
    }));

    return {
      page,
      continueCursor: result.continueCursor,
      isDone: result.isDone,
    };
  },
});

/** Get all sessions for a user. Use sparingly - prefer paginated query. */
export const listByUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    await requireUserAccess(ctx, userId);
    const sessions = await ctx.db
      .query('sessions')
      .withIndex('by_user_created', (q) => q.eq('userId', userId))
      .order('desc')
      .collect();

    const counts = await getMessageCountsByUser(ctx, userId);
    return sessions.map((session) => ({
      ...session,
      messageCount: counts.get(session._id) ?? 0,
    }));
  },
});

/** Count sessions for a user. Returns cached count for O(1) performance. */
export const countByUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const user = await requireUserAccess(ctx, userId);
    return user.sessionCount ?? 0;
  },
});

export const getWithMessagesAndReports = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) => {
    const { session } = await requireOwnership(ctx, sessionId);
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_session_time', (q) => q.eq('sessionId', sessionId))
      .order('asc')
      .collect();
    const reports = await ctx.db
      .query('sessionReports')
      .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
      .collect();
    const sessionWithCount = {
      ...session,
      messageCount: messages.length,
    };
    return { session: sessionWithCount, messages, reports };
  },
});

export const create = mutation({
  args: {
    userId: v.id('users'),
    title: v.string(),
  },
  handler: async (ctx, { userId, title }) => {
    const user = await requireUserAccess(ctx, userId);
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

    await ensureMessageCountShardsInitialized(ctx, sessionId, user._id);

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
    await requireOwnership(ctx, sessionId);
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
    const { user } = await requireOwnership(ctx, sessionId);

    const shards = await ctx.db
      .query('messageCountShards')
      .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
      .collect();
    for (const shard of shards) {
      await ctx.db.delete(shard._id);
    }

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

    return { usersUpdated: users.filter((u) => u.sessionCount === undefined).length };
  },
});

/**
 * Migration: Initialize message count shards for existing sessions.
 * Run this once after deploying the sharded counter.
 */
export const _initializeMessageCountShards = internalMutation({
  handler: async (ctx) => {
    const sessions = await ctx.db.query('sessions').collect();
    let sessionsUpdated = 0;

    for (const session of sessions) {
      const existing = await ctx.db
        .query('messageCountShards')
        .withIndex('by_session', (q) => q.eq('sessionId', session._id))
        .first();

      if (existing) continue;

      const messages = await ctx.db
        .query('messages')
        .withIndex('by_session_time', (q) => q.eq('sessionId', session._id))
        .collect();

      const total = messages.length;
      const base = Math.floor(total / MESSAGE_COUNT_SHARDS);
      const remainder = total % MESSAGE_COUNT_SHARDS;
      const now = Date.now();

      for (let shard = 0; shard < MESSAGE_COUNT_SHARDS; shard += 1) {
        const count = base + (shard < remainder ? 1 : 0);
        await ctx.db.insert('messageCountShards', {
          sessionId: session._id,
          userId: session.userId,
          shard,
          count,
          updatedAt: now,
        });
      }

      sessionsUpdated += 1;
    }

    return { sessionsUpdated };
  },
});

export const get = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) => {
    const { session } = await requireOwnership(ctx, sessionId);
    const messageCount = await getMessageCountForSession(ctx, sessionId);
    return { ...session, messageCount };
  },
});
