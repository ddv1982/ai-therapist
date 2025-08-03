export interface SessionReport {
  id: string;
  sessionId: string;
  keyPoints: string[];
  therapeuticInsights: string[];
  patternsIdentified: string[];
  actionItems: string[];
  moodAssessment?: string;
  progressNotes?: string;
  createdAt: Date;
}

export interface SessionReportProps {
  report: SessionReport;
  session: Session;
}

export interface ReportSummaryProps {
  reports: SessionReport[];
}

export interface GenerateReportRequest {
  sessionId: string;
  messages: Message[];
}

import type { Session } from './session';
import type { Message } from './chat';