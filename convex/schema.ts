import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
// Validators are used in defineTable schema definition below
// Using flexible validators to support both string arrays and structured objects
import {
  messageMetadataValidator,
  flexibleKeyPointsValidator,
  flexibleTherapeuticInsightsValidator,
  flexiblePatternsIdentifiedValidator,
  flexibleActionItemsValidator,
  flexibleCognitiveDistortionsValidator,
  schemaAnalysisValidator,
  therapeuticFrameworksValidator,
  recommendationsValidator,
} from './validators';
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
    metadata: messageMetadataValidator,
    timestamp: v.number(),
    createdAt: v.number(),
  }).index('by_session_time', ['sessionId', 'timestamp']),

  messageCountShards: defineTable({
    sessionId: v.id('sessions'),
    userId: v.id('users'),
    shard: v.number(),
    count: v.number(),
    updatedAt: v.number(),
  })
    .index('by_session_shard', ['sessionId', 'shard'])
    .index('by_session', ['sessionId'])
    .index('by_user', ['userId']),

  sessionReports: defineTable({
    // Stage 1: optional for migration safety; backfill makes this effectively required.
    userId: v.optional(v.id('users')),
    sessionId: v.id('sessions'),
    reportContent: v.string(),
    keyPoints: flexibleKeyPointsValidator,
    therapeuticInsights: flexibleTherapeuticInsightsValidator,
    patternsIdentified: flexiblePatternsIdentifiedValidator,
    actionItems: flexibleActionItemsValidator,
    moodAssessment: v.optional(v.string()),
    progressNotes: v.optional(v.string()),
    cognitiveDistortions: flexibleCognitiveDistortionsValidator,
    schemaAnalysis: schemaAnalysisValidator,
    therapeuticFrameworks: therapeuticFrameworksValidator,
    recommendations: recommendationsValidator,
    analysisConfidence: v.optional(v.number()),
    analysisVersion: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_session', ['sessionId'])
    .index('by_session_created', ['sessionId', 'createdAt']) // PERFORMANCE: For sorted queries by session
    .index('by_user_created', ['userId', 'createdAt']),
});
