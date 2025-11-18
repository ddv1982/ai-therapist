import type { Doc, Id } from '../../convex/_generated/dataModel';

export type UserDoc = Doc<'users'>;
export type SessionDoc = Doc<'sessions'>;
export type MessageDoc = Doc<'messages'>;
export type SessionReportDoc = Doc<'sessionReports'>;

export type SessionId = Id<'sessions'>;
export type UserId = Id<'users'>;

export interface SessionBundle {
  session: SessionDoc;
  messages: MessageDoc[];
  reports: SessionReportDoc[];
}

export interface SessionOwnershipResult {
  valid: boolean;
  session?: SessionDoc | SessionWithMessages;
}

export interface SessionWithMessages extends SessionDoc {
  messages: MessageDoc[];
  reports?: SessionReportDoc[];
}
