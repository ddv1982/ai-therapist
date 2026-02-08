import type { ConvexHttpClient } from 'convex/browser';
import {
  getSessionWithMessages,
  getUserSessions,
  verifySessionOwnership,
  type PaginationOptions,
} from '@/lib/repositories/session-repository';

export const sessionRepository = {
  verifyOwnership: (
    sessionId: string,
    clerkId: string,
    options?: { includeMessages?: boolean },
    client?: ConvexHttpClient
  ) => verifySessionOwnership(sessionId, clerkId, options, client),
  listByUser: (clerkId: string, options?: PaginationOptions, client?: ConvexHttpClient) =>
    getUserSessions(clerkId, options, client),
  getWithMessages: (sessionId: string, clerkId: string, client?: ConvexHttpClient) =>
    getSessionWithMessages(sessionId, clerkId, client),
};
