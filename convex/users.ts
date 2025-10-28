import { query, mutation, internalMutation } from './_generated/server';
import { v } from 'convex/values';

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
      .withIndex('by_clerkId', q => q.eq('clerkId', identity.subject))
      .unique();
  },
});

/**
 * Get user by Clerk ID
 */
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query('users')
      .withIndex('by_clerkId', q => q.eq('clerkId', clerkId))
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
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerkId', q => q.eq('clerkId', clerkId))
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
        .withIndex('by_clerkId', q => q.eq('clerkId', clerkId))
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
        .withIndex('by_clerkId', q => q.eq('clerkId', clerkId))
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
        .withIndex('by_clerkId', q => q.eq('clerkId', clerkId))
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

// Legacy migrations support
export const getOrCreate = mutation({
  args: { legacyId: v.string(), email: v.string(), name: v.optional(v.string()) },
  handler: async (ctx, { legacyId, email, name }) => {
    const byLegacy = await ctx.db
      .query('users')
      .withIndex('by_legacyId', q => q.eq('legacyId', legacyId))
      .unique();
    if (byLegacy) return byLegacy;
    const byEmail = await ctx.db
      .query('users')
      .withIndex('email', q => q.eq('email', email))
      .unique();
    if (byEmail) return byEmail;
    const now = Date.now();
    const id = await ctx.db.insert('users', {
      legacyId,
      email,
      name,
      clerkId: `legacy_${legacyId}`, // Temporary Clerk ID for legacy users
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(id);
  },
});

export const getByLegacyId = query({
  args: { legacyId: v.string() },
  handler: async (ctx, { legacyId }) => {
    return await ctx.db
      .query('users')
      .withIndex('by_legacyId', q => q.eq('legacyId', legacyId))
      .unique();
  },
});

// Dev-only utilities
// (no dev-only utilities)
