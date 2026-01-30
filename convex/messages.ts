import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { QUERY_LIMITS } from './constants';
import { messageMetadataValidator } from './validators';
import { requireOwnership, ConvexAppError, ErrorCode } from './lib/errors';
import { getMessageCountForSession, incrementMessageCount } from './lib/message_counts';

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
    await requireOwnership(ctx, sessionId);
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
    await requireOwnership(ctx, sessionId);
    return await ctx.db
      .query('messages')
      .withIndex('by_session_time', (q) => q.eq('sessionId', sessionId))
      .order('asc')
      .collect();
  },
});

/** Count messages in a session. Returns cached count for O(1) performance. */
export const countBySession = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) => {
    await requireOwnership(ctx, sessionId);
    return await getMessageCountForSession(ctx, sessionId);
  },
});

/** Create a new message and update session count. */
export const create = mutation({
  args: {
    sessionId: v.id('sessions'),
    role: v.string(),
    content: v.string(),
    modelUsed: v.optional(v.string()),
    metadata: messageMetadataValidator,
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, { sessionId, role, content, modelUsed, metadata, timestamp }) => {
    const { session } = await requireOwnership(ctx, sessionId);
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
    await incrementMessageCount(ctx, {
      sessionId,
      userId: session.userId,
      delta: 1,
    });
    return await ctx.db.get(id);
  },
});

export const update = mutation({
  args: {
    messageId: v.id('messages'),
    content: v.optional(v.string()),
    metadata: messageMetadataValidator,
    modelUsed: v.optional(v.string()),
  },
  handler: async (ctx, { messageId, content, metadata, modelUsed }) => {
    const message = await ctx.db.get(messageId);
    if (!message) throw new ConvexAppError(ErrorCode.NOT_FOUND, 'Message not found');
    await requireOwnership(ctx, message.sessionId);
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

    await requireOwnership(ctx, message.sessionId);

    const session = await ctx.db.get(message.sessionId);
    await ctx.db.delete(messageId);

    // Update session message count if session still exists
    if (session) {
      await incrementMessageCount(ctx, {
        sessionId: session._id,
        userId: session.userId,
        delta: -1,
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
    await requireOwnership(ctx, message.sessionId);
    return message;
  },
});
