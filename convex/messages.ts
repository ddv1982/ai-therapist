import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const listBySession = query({
  args: { sessionId: v.id('sessions'), limit: v.optional(v.number()), offset: v.optional(v.number()) },
  handler: async (ctx, { sessionId, limit = 50, offset = 0 }) => {
    const limit_clamped = Math.min(limit, 200); // Max 200 messages per request (messages can be long)
    const offset_clamped = Math.max(offset, 0);

    const all = await ctx.db
      .query('messages')
      .withIndex('by_session_time', q => q.eq('sessionId', sessionId))
      .order('asc')
      .collect();

    return all.slice(offset_clamped, offset_clamped + limit_clamped);
  },
});

export const countBySession = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) => {
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_session_time', q => q.eq('sessionId', sessionId))
      .collect();
    return messages.length;
  },
});

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
    const session = await ctx.db.get(sessionId);
    if (!session) throw new Error('Session not found');
    const now = Date.now();
    const id = await ctx.db.insert('messages', {
      legacyId: undefined,
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
    if (!message) return { ok: true };
    const session = await ctx.db.get(message.sessionId);
    await ctx.db.delete(messageId);
    if (session) {
      await ctx.db.patch(session._id, {
        messageCount: Math.max(0, (session.messageCount ?? 0) - 1),
        updatedAt: Date.now(),
      });
    }
    return { ok: true };
  },
});

export const getById = query({
  args: { messageId: v.id('messages') },
  handler: async (ctx, { messageId }) => {
    return await ctx.db.get(messageId);
  },
});
