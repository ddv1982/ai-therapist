import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { QUERY_LIMITS, PAGINATION_DEFAULTS } from './constants';
import type { Doc, Id } from './_generated/dataModel';
import type { QueryCtx, MutationCtx } from './_generated/server';

/**
 * Helper function to get and verify authenticated user
 * Throws if user is not authenticated
 */
async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error('Unauthorized: Authentication required');
  }

  const user = await ctx.db
    .query('users')
    .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
    .unique();

  if (!user) {
    throw new Error('Unauthorized: User not found');
  }

  return user;
}

/**
 * Helper function to verify session ownership
 * Throws if the session doesn't belong to the authenticated user
 */
async function verifySessionOwnership(
  ctx: QueryCtx | MutationCtx,
  sessionId: Id<'sessions'>,
  userId: Id<'users'>
) {
  const session = await ctx.db.get(sessionId);
  
  if (!session) {
    throw new Error('Session not found');
  }

  if (session.userId !== userId) {
    throw new Error('Forbidden: You do not have access to this session');
  }

  return session;
}

/**
 * Helper function to verify message ownership (via session ownership)
 * Throws if the message doesn't belong to a session owned by the authenticated user
 */
async function verifyMessageOwnership(
  ctx: QueryCtx | MutationCtx,
  messageId: Id<'messages'>,
  userId: Id<'users'>
) {
  const message = await ctx.db.get(messageId);
  
  if (!message) {
    throw new Error('Message not found');
  }

  await verifySessionOwnership(ctx, message.sessionId, userId);

  return message;
}

export const listBySession = query({
  args: {
    sessionId: v.id('sessions'),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, { sessionId, limit = QUERY_LIMITS.DEFAULT_LIMIT, offset = 0 }) => {
    // Verify authentication
    const authenticatedUser = await getAuthenticatedUser(ctx);
    
    // Verify session ownership
    await verifySessionOwnership(ctx, sessionId, authenticatedUser._id);

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

export const countBySession = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, { sessionId }) => {
    // Verify authentication
    const authenticatedUser = await getAuthenticatedUser(ctx);
    
    // Verify session ownership
    await verifySessionOwnership(ctx, sessionId, authenticatedUser._id);

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
    // Verify authentication
    const authenticatedUser = await getAuthenticatedUser(ctx);
    
    // Verify session ownership
    const session = await verifySessionOwnership(ctx, sessionId, authenticatedUser._id);
    
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
    // Verify authentication
    const authenticatedUser = await getAuthenticatedUser(ctx);
    
    // Verify message ownership
    await verifyMessageOwnership(ctx, messageId, authenticatedUser._id);
    
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
    // Verify authentication
    const authenticatedUser = await getAuthenticatedUser(ctx);
    
    const message = await ctx.db.get(messageId);
    // CONSISTENCY: Silently succeed if message doesn't exist (idempotent delete)
    if (!message) {
      return { ok: true, deleted: false };
    }
    
    // Verify message ownership before deleting
    await verifySessionOwnership(ctx, message.sessionId, authenticatedUser._id);
    
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
    // Verify authentication
    const authenticatedUser = await getAuthenticatedUser(ctx);
    
    // Verify message ownership
    const message = await verifyMessageOwnership(ctx, messageId, authenticatedUser._id);
    
    return message;
  },
});

/**
 * Internal query for server-side API calls
 * Does not require Clerk authentication (API routes handle auth)
 * Use this ONLY from authenticated API routes
 */
export const listBySessionInternal = query({
  args: {
    sessionId: v.id('sessions'),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, { sessionId, limit = QUERY_LIMITS.DEFAULT_LIMIT, offset = 0 }) => {
    // No auth check - caller must verify authorization
    const limit_clamped = Math.min(limit, QUERY_LIMITS.MAX_MESSAGES_PER_REQUEST);
    const offset_clamped = Math.max(offset, PAGINATION_DEFAULTS.MIN_OFFSET);

    const results: Doc<'messages'>[] = [];
    let index = 0;
    
    for await (const message of ctx.db
      .query('messages')
      .withIndex('by_session_time', (q) => q.eq('sessionId', sessionId))
      .order('asc')) {
      
      if (index < offset_clamped) {
        index++;
        continue;
      }
      
      results.push(message);
      
      if (results.length >= limit_clamped) {
        break;
      }
      
      index++;
    }

    return results;
  },
});
