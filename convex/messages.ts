/**
 * Convex Messages Module
 *
 * Provides queries and mutations for managing therapy session messages.
 * Includes optimized pagination, ownership verification, and metadata management.
 *
 * @module convex/messages
 */

import { query, mutation } from './_generated/server';
import type { QueryCtx, MutationCtx } from './_generated/server';
import { v } from 'convex/values';
import { QUERY_LIMITS, PAGINATION_DEFAULTS } from './constants';
import type { Doc } from './_generated/dataModel';

/**
 * Lists messages for a specific therapy session with pagination support.
 * 
 * Fetches messages in chronological order with configurable limit and offset.
 * Automatically verifies session ownership before returning data. Uses manual
 * pagination since Convex doesn't provide native skip/limit operations.
 *
 * @query
 * @param {Object} args - Query arguments
 * @param {Id<'sessions'>} args.sessionId - The session to fetch messages from
 * @param {number} [args.limit] - Maximum number of messages to return (default: QUERY_LIMITS.DEFAULT_LIMIT)
 * @param {number} [args.offset=0] - Number of messages to skip for pagination
 * @returns {Promise<Doc<'messages'>[]>} Array of message documents in chronological order
 * @throws {Error} If user doesn't own the specified session
 *
 * @example
 * ```typescript
 * // Fetch first 50 messages
 * const messages = await api.messages.listBySession({
 *   sessionId: 'session123',
 *   limit: 50,
 *   offset: 0
 * });
 * ```
 */
export const listBySession = query({
  args: {
    sessionId: v.id('sessions'),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, { sessionId, limit = QUERY_LIMITS.DEFAULT_LIMIT, offset = 0 }) => {
    await assertSessionOwnership(ctx, sessionId);
    const limit_clamped = Math.min(limit, QUERY_LIMITS.MAX_MESSAGES_PER_REQUEST);
    const offset_clamped = Math.max(offset, PAGINATION_DEFAULTS.MIN_OFFSET);

    // PERFORMANCE FIX: Use pagination instead of fetching all and slicing
    // Unfortunately Convex doesn't have native skip/limit, so we iterate and collect manually
    const results: Doc<'messages'>[] = [];
    let index = 0;
    
    for await (const message of ctx.db
      .query('messages')
      .withIndex('by_session_time', (q) => q.eq('sessionId', sessionId))
      .order('asc')) {
      
      // Skip items until we reach the offset
      if (index < offset_clamped) {
        index++;
        continue;
      }
      
      results.push(message);
      
      // Stop once we have enough items
      if (results.length >= limit_clamped) {
        break;
      }
      
      index++;
    }

    return results;
  },
});

/**
 * Counts the total number of messages in a therapy session.
 * 
 * Efficiently counts messages without loading full message data into memory.
 * Verifies session ownership before counting.
 *
 * @query
 * @param {Object} args - Query arguments
 * @param {Id<'sessions'>} args.sessionId - The session to count messages for
 * @returns {Promise<number>} Total number of messages in the session
 * @throws {Error} If user doesn't own the specified session
 *
 * @example
 * ```typescript
 * const count = await api.messages.countBySession({
 *   sessionId: 'session123'
 * });
 * console.log(`Session has ${count} messages`);
 * ```
 */
export const countBySession = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) => {
    await assertSessionOwnership(ctx, sessionId);
    // PERFORMANCE FIX: Count without collecting all records
    // Unfortunately Convex doesn't have a native count(), so we iterate and count
    let count = 0;
    for await (const message of ctx.db
      .query('messages')
      .withIndex('by_session_time', (q) => q.eq('sessionId', sessionId))) {
      // Just counting, not using the message data
      void message;
      count++;
    }
    return count;
  },
});

/**
 * Creates a new message in a therapy session.
 * 
 * Inserts a new message with the specified content and metadata, then updates
 * the session's message count and last updated timestamp. Verifies session
 * ownership before creating the message.
 *
 * @mutation
 * @param {Object} args - Mutation arguments
 * @param {Id<'sessions'>} args.sessionId - The session to add the message to
 * @param {string} args.role - Message role ('user' or 'assistant')
 * @param {string} args.content - The message text content
 * @param {string} [args.modelUsed] - ID of the AI model that generated the message
 * @param {any} [args.metadata] - Additional metadata (e.g., tokens, latency, sources)
 * @param {number} [args.timestamp] - Custom timestamp (defaults to current time)
 * @returns {Promise<Doc<'messages'> | null>} The created message document
 * @throws {Error} If user doesn't own the specified session
 *
 * @example
 * ```typescript
 * const message = await api.messages.create({
 *   sessionId: 'session123',
 *   role: 'user',
 *   content: 'I have been feeling anxious lately',
 *   metadata: { sentiment: 0.3 }
 * });
 * ```
 */
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
