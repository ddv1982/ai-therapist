import { query, mutation } from './_generated/server';
import type { QueryCtx, MutationCtx } from './_generated/server';
import { v } from 'convex/values';
import { QUERY_LIMITS } from './constants';
import type { Doc } from './_generated/dataModel';

/**
 * Paginated query for session messages. Uses cursor-based pagination for O(limit) performance.
 * Recommended for infinite scroll and lazy loading patterns.
 */
export const listBySessionPaginated = query({
  args: {
    sessionId: v.id('sessions'),
    numItems: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, numItems = QUERY_LIMITS.DEFAULT_LIMIT, cursor }) => {
    await assertSessionOwnership(ctx, sessionId);
    const numItems_clamped = Math.min(numItems, QUERY_LIMITS.MAX_MESSAGES_PER_REQUEST);

    const result = await ctx.db
      .query('messages')
      .withIndex('by_session_time', (q) => q.eq('sessionId', sessionId))
      .order('asc')
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

/**
 * Get all messages for a session. Use sparingly - prefer paginated query for large sessions.
 */
export const listBySession = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) => {
    await assertSessionOwnership(ctx, sessionId);
    return await ctx.db
      .query('messages')
      .withIndex('by_session_time', (q) => q.eq('sessionId', sessionId))
      .order('asc')
      .collect();
  },
});

/** Count messages in a session. */
export const countBySession = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) => {
    await assertSessionOwnership(ctx, sessionId);
    let count = 0;
    for await (const message of ctx.db
      .query('messages')
      .withIndex('by_session_time', (q) => q.eq('sessionId', sessionId))) {
      void message;
      count++;
    }
    return count;
  },
});

/** Create a new message and update session count. */
export const create = mutation({
  args: {
    sessionId: v.id('sessions'),
    role: v.string(),
    content: v.string(),
    modelUsed: v.optional(v.string()),
    metadata: v.optional(v.any()),
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, { sessionId, role, content, modelUsed, metadata, timestamp }) => {
    const { session } = await assertSessionOwnership(ctx, sessionId);
    const now = Date.now();
    const id = await ctx.db.insert('messages', {
      sessionId,
      role,
      content,
      modelUsed,
      metadata,
      timestamp: timestamp ?? now,
      createdAt: now,
    });
    await ctx.db.patch(sessionId, {
      messageCount: (session.messageCount ?? 0) + 1,
      updatedAt: now,
    });
    return await ctx.db.get(id);
  },
});

export const update = mutation({
  args: {
    messageId: v.id('messages'),
    content: v.optional(v.string()),
    metadata: v.optional(v.any()),
    modelUsed: v.optional(v.string()),
  },
  handler: async (ctx, { messageId, content, metadata, modelUsed }) => {
    const message = await ctx.db.get(messageId);
    if (!message) throw new Error('Message not found');
    await assertSessionOwnership(ctx, message.sessionId);
    const patch: Record<string, unknown> = {};
    if (typeof content !== 'undefined') patch.content = content;
    if (typeof metadata !== 'undefined') patch.metadata = metadata;
    if (typeof modelUsed !== 'undefined') patch.modelUsed = modelUsed;
    await ctx.db.patch(messageId, patch);
    return await ctx.db.get(messageId);
  },
});

export const remove = mutation({
  args: { messageId: v.id('messages') },
  handler: async (ctx, { messageId }) => {
    const message = await ctx.db.get(messageId);
    // CONSISTENCY: Silently succeed if message doesn't exist (idempotent delete)
    if (!message) {
      return { ok: true, deleted: false };
    }

    await assertSessionOwnership(ctx, message.sessionId);
    
    const session = await ctx.db.get(message.sessionId);
    await ctx.db.delete(messageId);
    
    // Update session message count if session still exists
    if (session) {
      await ctx.db.patch(session._id, {
        messageCount: Math.max(0, (session.messageCount ?? 0) - 1),
        updatedAt: Date.now(),
      });
    }
    
    return { ok: true, deleted: true };
  },
});

export const getById = query({
  args: { messageId: v.id('messages') },
  handler: async (ctx, { messageId }) => {
    const message = await ctx.db.get(messageId);
    if (!message) return null;
    await assertSessionOwnership(ctx, message.sessionId);
    return message;
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

async function assertSessionOwnership(ctx: AnyCtx, sessionId: Doc<'sessions'>['_id']) {
  const user = await requireUser(ctx);
  const session = await ctx.db.get(sessionId);
  if (!session || session.userId !== user._id) {
    throw new Error('Session not found or access denied');
  }
  return { user, session };
}
