/**
 * Convex database entity types
 * These types represent the structure of data returned from Convex queries/mutations
 */

export interface ConvexUser {
  _id: string;
  email: string;
  name?: string;
  currentSessionId?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface ConvexSession {
  _id: string;
  userId: string;
  title: string;
  messageCount: number;
  startedAt: number;
  endedAt?: number | null;
  status: string;
  createdAt: number;
  updatedAt: number;
}

export interface ConvexMessage {
  _id: string;
  sessionId: string;
  role: string;
  content: string;
  modelUsed?: string;
  metadata?: unknown;
  timestamp: number;
  createdAt: number;
}

export interface ConvexSessionReport {
  _id: string;
  sessionId: string;
  reportContent: string;
  keyPoints?: unknown;
  therapeuticInsights?: unknown;
  patternsIdentified?: unknown;
  actionItems?: unknown;
  moodAssessment?: string;
  progressNotes?: string;
  cognitiveDistortions?: unknown;
  schemaAnalysis?: unknown;
  therapeuticFrameworks?: unknown;
  recommendations?: unknown;
  analysisConfidence?: number;
  analysisVersion?: string;
  createdAt: number;
}

// Helper type for session with both messages and reports
export interface ConvexSessionWithMessagesAndReports extends ConvexSession {
  messages?: ConvexMessage[];
  reports?: ConvexSessionReport[];
}

// Helper type for full session bundle
export interface ConvexSessionBundle {
  session: ConvexSession | null;
  messages: ConvexMessage[];
  reports: ConvexSessionReport[];
}
