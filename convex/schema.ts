import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
// Dates are stored as epoch milliseconds (number)
export default defineSchema({
  users: defineTable({
    legacyId: v.optional(v.string()),
    email: v.string(),
    name: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('email', ['email'])
    .index('by_legacyId', ['legacyId']),

  sessions: defineTable({
    legacyId: v.optional(v.string()),
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
    legacyId: v.optional(v.string()),
    sessionId: v.id('sessions'),
    role: v.string(),
    content: v.string(),
    modelUsed: v.optional(v.string()),
    metadata: v.optional(v.any()),
    timestamp: v.number(),
    createdAt: v.number(),
  }).index('by_session_time', ['sessionId', 'timestamp']),

  sessionReports: defineTable({
    legacyId: v.optional(v.string()),
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
  }).index('by_session', ['sessionId']),

  authConfigs: defineTable({
    legacyId: v.optional(v.string()),
    secret: v.string(),
    backupCodes: v.string(),
    isSetup: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  trustedDevices: defineTable({
    legacyId: v.optional(v.string()),
    deviceId: v.string(),
    name: v.string(),
    fingerprint: v.string(),
    ipAddress: v.string(),
    userAgent: v.string(),
    lastSeen: v.number(),
    trustedAt: v.number(),
    createdAt: v.number(),
  })
    .index('by_deviceId', ['deviceId'])
    .index('by_fingerprint', ['fingerprint']),

  authSessions: defineTable({
    legacyId: v.optional(v.string()),
    sessionToken: v.string(),
    deviceId: v.id('trustedDevices'),
    ipAddress: v.string(),
    expiresAt: v.number(),
    lastActivity: v.number(),
    createdAt: v.number(),
  })
    .index('by_device_expires', ['deviceId', 'expiresAt'])
    .index('by_expires', ['expiresAt'])
    .index('by_sessionToken', ['sessionToken']),
});
