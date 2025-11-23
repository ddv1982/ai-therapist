import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
// Dates are stored as epoch milliseconds (number)
export default defineSchema({
  users: defineTable({
    // Clerk authentication
    clerkId: v.string(), // Clerk user ID for authentication

    // User profile
    email: v.string(),
    name: v.optional(v.string()),
    currentSessionId: v.optional(v.id('sessions')),

    // Cached counts for O(1) performance
    sessionCount: v.optional(v.number()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('email', ['email'])
    .index('by_clerkId', ['clerkId']), // Primary lookup by Clerk ID

  sessions: defineTable({
    userId: v.id('users'),
    title: v.string(),
    messageCount: v.number(),
    startedAt: v.number(),
    endedAt: v.union(v.number(), v.null()),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_user_created', ['userId', 'createdAt']),

  messages: defineTable({
    sessionId: v.id('sessions'),
    role: v.string(),
    content: v.string(),
    modelUsed: v.optional(v.string()),
    metadata: v.optional(v.any()),
    timestamp: v.number(),
    createdAt: v.number(),
  }).index('by_session_time', ['sessionId', 'timestamp']),

  sessionReports: defineTable({
    sessionId: v.id('sessions'),
    reportContent: v.string(),
    keyPoints: v.any(),
    therapeuticInsights: v.any(),
    patternsIdentified: v.any(),
    actionItems: v.any(),
    moodAssessment: v.optional(v.string()),
    progressNotes: v.optional(v.string()),
    cognitiveDistortions: v.optional(v.any()),
    schemaAnalysis: v.optional(v.any()),
    therapeuticFrameworks: v.optional(v.any()),
    recommendations: v.optional(v.any()),
    analysisConfidence: v.optional(v.number()),
    analysisVersion: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_session', ['sessionId'])
    .index('by_session_created', ['sessionId', 'createdAt']), // PERFORMANCE: For sorted queries by session
});
