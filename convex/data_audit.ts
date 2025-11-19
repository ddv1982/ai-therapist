/**
 * Data Audit Queries
 * One-time queries to check database health and identify cleanup opportunities
 */

import { query } from './_generated/server';

/**
 * Check for orphaned messages (messages whose sessionId doesn't exist)
 */
export const findOrphanedMessages = query({
  handler: async (ctx) => {
    const messages = await ctx.db.query('messages').collect();
    const orphaned: Array<{
      messageId: string;
      sessionId: string;
      createdAt: string;
    }> = [];
    
    for (const message of messages) {
      const session = await ctx.db.get(message.sessionId);
      if (!session) {
        orphaned.push({
          messageId: message._id,
          sessionId: message.sessionId,
          createdAt: new Date(message.createdAt).toISOString(),
        });
      }
    }
    
    return {
      total: messages.length,
      orphaned: orphaned.length,
      orphanedMessages: orphaned,
    };
  },
});

/**
 * Check for orphaned reports (reports whose sessionId doesn't exist)
 */
export const findOrphanedReports = query({
  handler: async (ctx) => {
    const reports = await ctx.db.query('sessionReports').collect();
    const orphaned: Array<{
      reportId: string;
      sessionId: string;
      createdAt: string;
    }> = [];
    
    for (const report of reports) {
      const session = await ctx.db.get(report.sessionId);
      if (!session) {
        orphaned.push({
          reportId: report._id,
          sessionId: report.sessionId,
          createdAt: new Date(report.createdAt).toISOString(),
        });
      }
    }
    
    return {
      total: reports.length,
      orphaned: orphaned.length,
      orphanedReports: orphaned,
    };
  },
});

/**
 * Check for orphaned sessions (sessions whose userId doesn't exist)
 */
export const findOrphanedSessions = query({
  handler: async (ctx) => {
    const sessions = await ctx.db.query('sessions').collect();
    const orphaned: Array<{
      sessionId: string;
      userId: string;
      title: string;
      createdAt: string;
    }> = [];
    
    for (const session of sessions) {
      const user = await ctx.db.get(session.userId);
      if (!user) {
        orphaned.push({
          sessionId: session._id,
          userId: session.userId,
          title: session.title,
          createdAt: new Date(session.createdAt).toISOString(),
        });
      }
    }
    
    return {
      total: sessions.length,
      orphaned: orphaned.length,
      orphanedSessions: orphaned,
    };
  },
});

/**
 * Analyze legacyId field usage across all tables
 * NOTE: This query is obsolete after legacy fields were removed from schema (2025-11-19)
 * Keeping for reference but will always return 0%
 */
export const analyzeLegacyIds = query({
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect();
    const sessions = await ctx.db.query('sessions').collect();
    const messages = await ctx.db.query('messages').collect();
    const reports = await ctx.db.query('sessionReports').collect();
    
    // Legacy fields have been removed from schema, so these will all be 0
    return {
      users: {
        total: users.length,
        withLegacyId: 0,
        percentage: 0,
      },
      sessions: {
        total: sessions.length,
        withLegacyId: 0,
        percentage: 0,
      },
      messages: {
        total: messages.length,
        withLegacyId: 0,
        percentage: 0,
      },
      reports: {
        total: reports.length,
        withLegacyId: 0,
        percentage: 0,
      },
      summary: {
        anyLegacyData: false,
        recommendation: 'Legacy fields have been removed from schema (2025-11-19)',
      },
    };
  },
});

/**
 * Verify the new compound index exists and is being used
 */
export const verifyIndexes = query({
  handler: async (ctx) => {
    // Query using the new compound index
    const testSessionId = (await ctx.db.query('sessions').first())?._id;
    
    if (!testSessionId) {
      return {
        status: 'no_data',
        message: 'No sessions in database to test index',
      };
    }
    
    // This should use the by_session_created index
    const reportsWithIndex = await ctx.db
      .query('sessionReports')
      .withIndex('by_session_created', (q) => q.eq('sessionId', testSessionId))
      .collect();
    
    return {
      status: 'success',
      message: 'Compound index by_session_created is active and working',
      testSessionId,
      reportsFound: reportsWithIndex.length,
      indexes: {
        by_session: 'exists (original)',
        by_session_created: 'exists (new - for performance)',
      },
    };
  },
});

/**
 * Get overall database statistics
 */
export const getDatabaseStats = query({
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect();
    const sessions = await ctx.db.query('sessions').collect();
    const messages = await ctx.db.query('messages').collect();
    const reports = await ctx.db.query('sessionReports').collect();
    
    return {
      users: users.length,
      sessions: sessions.length,
      messages: messages.length,
      reports: reports.length,
      avgMessagesPerSession: sessions.length > 0 ? Math.round(messages.length / sessions.length) : 0,
      avgReportsPerSession: sessions.length > 0 ? (reports.length / sessions.length).toFixed(2) : 0,
    };
  },
});
