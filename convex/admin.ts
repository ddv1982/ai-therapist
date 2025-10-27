import { mutation } from './_generated/server';
import { v } from 'convex/values';

/**
 * Admin utilities (dev-only): wipe all data.
 * NOTE: This mutation is intended for local/dev use only and should be removed after running.
 */
export const wipeAll = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    // Basic guard to prevent accidental invocation
    if (!token || token.length < 12) {
      throw new Error('Invalid wipe token');
    }

    // 1) Delete all sessions with their messages and reports
    const sessions = await ctx.db.query('sessions').collect();
    let messagesDeleted = 0;
    let reportsDeleted = 0;
    let sessionsDeleted = 0;

    for (const s of sessions) {
      const msgs = await ctx.db
        .query('messages')
        .withIndex('by_session_time', q => q.eq('sessionId', s._id))
        .collect();
      for (const m of msgs) {
        await ctx.db.delete(m._id);
        messagesDeleted++;
      }
      const reps = await ctx.db
        .query('sessionReports')
        .withIndex('by_session', q => q.eq('sessionId', s._id))
        .collect();
      for (const r of reps) {
        await ctx.db.delete(r._id);
        reportsDeleted++;
      }
      await ctx.db.delete(s._id);
      sessionsDeleted++;
    }

    // 2) Delete all users
    const users = await ctx.db.query('users').collect();
    let usersDeleted = 0;
    for (const u of users) {
      await ctx.db.delete(u._id);
      usersDeleted++;
    }

    return {
      usersDeleted,
      sessionsDeleted,
      messagesDeleted,
      reportsDeleted,
    };
  },
});
