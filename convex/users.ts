import { query, mutation, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { requireAuthentication, requireOwnership } from './lib/errors';

/**
 * Get current authenticated user
 * Uses Clerk ID from auth context
 */
export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique();
  },
});

/**
 * Get user by Clerk ID
 * Note: This is public because API routes need to look up users
 * The API routes themselves handle authentication
 */
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    // No auth check - this is used by API routes that handle their own auth
    return await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
      .unique();
  },
});

/**
 * Ensure user exists by Clerk ID (public)
 * Creates the user if not found, otherwise returns existing.
 */
export const ensureByClerkId = mutation({
  args: { clerkId: v.string(), email: v.string(), name: v.optional(v.string()) },
  handler: async (ctx, { clerkId, email, name }) => {
    const normalizedEmail = email.trim();
    const normalizedName = typeof name === 'string' ? name.trim() || undefined : undefined;
    if (!normalizedEmail) {
      throw new Error('Email is required to create or update a user');
    }

    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
      .unique();
    if (existing) {
      const patch: Partial<{
        email: string;
        name: string | undefined;
        updatedAt: number;
      }> = {};

      if (existing.email !== normalizedEmail) {
        patch.email = normalizedEmail;
      }

      if (normalizedName && normalizedName !== existing.name) {
        patch.name = normalizedName;
      }

      if (Object.keys(patch).length > 0) {
        patch.updatedAt = Date.now();
        await ctx.db.patch(existing._id, patch);
        return await ctx.db.get(existing._id);
      }

      return existing;
    }

    const now = Date.now();
    const id = await ctx.db.insert('users', {
      clerkId,
      email: normalizedEmail,
      name: normalizedName,
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(id);
  },
});

export const setCurrentSession = mutation({
  args: { sessionId: v.union(v.id('sessions'), v.null()) },
  handler: async (ctx, { sessionId }) => {
    const user = await requireAuthentication(ctx);

    if (sessionId) {
      // Verify session ownership
      await requireOwnership(ctx, sessionId);
    }

    await ctx.db.patch(user._id, {
      currentSessionId: sessionId ?? undefined,
      updatedAt: Date.now(),
    });

    return { success: true, sessionId: sessionId ?? null } as const;
  },
});

/**
 * Internal mutation: Create user from Clerk webhook
 * Only callable from server-side actions/webhooks
 */
export const internal = {
  createFromClerk: internalMutation({
    args: { clerkId: v.string(), email: v.string(), name: v.optional(v.string()) },
    handler: async (ctx, { clerkId, email, name }) => {
      const existing = await ctx.db
        .query('users')
        .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
        .unique();

      if (existing) return existing;

      const now = Date.now();
      const id = await ctx.db.insert('users', {
        clerkId,
        email,
        name,
        createdAt: now,
        updatedAt: now,
      });

      return await ctx.db.get(id);
    },
  }),

  /**
   * Internal mutation: Update user from Clerk webhook
   */
  updateFromClerk: internalMutation({
    args: { clerkId: v.string(), email: v.string(), name: v.optional(v.string()) },
    handler: async (ctx, { clerkId, email, name }) => {
      const user = await ctx.db
        .query('users')
        .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
        .unique();

      if (!user) {
        // If user doesn't exist, create them
        const now = Date.now();
        const id = await ctx.db.insert('users', {
          clerkId,
          email,
          name,
          createdAt: now,
          updatedAt: now,
        });
        return await ctx.db.get(id);
      }

      // Update existing user
      await ctx.db.patch(user._id, {
        email,
        name,
        updatedAt: Date.now(),
      });

      return await ctx.db.get(user._id);
    },
  }),

  /**
   * Internal mutation: Soft delete user from Clerk webhook
   * Keeps therapeutic data but prevents future access
   */
  deleteFromClerk: internalMutation({
    args: { clerkId: v.string() },
    handler: async (ctx, { clerkId }) => {
      const user = await ctx.db
        .query('users')
        .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
        .unique();

      if (!user) return;

      // For now, we don't fully delete - keep data for compliance
      // In future, could implement soft delete flag
      await ctx.db.patch(user._id, {
        updatedAt: Date.now(),
      });
    },
  }),
};
