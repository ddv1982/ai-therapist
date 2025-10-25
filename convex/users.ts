import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

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
