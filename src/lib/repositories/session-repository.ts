/**
 * Session Repository
 *
 * Data access layer for session-related Convex operations.
 * Encapsulates all session queries and mutations from the frontend.
 */

import { getConvexHttpClient, api } from '@/lib/convex/http-client';
import { logger } from '@/lib/utils/logger';
import type {
  SessionBundle,
  SessionOwnershipResult,
  SessionWithMessages,
  SessionDoc,
  SessionId,
  UserDoc,
} from '@/types/database';

type VerifySessionOptions = { includeMessages?: boolean };

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

/**
 * Verify that a session belongs to the authenticated user
 */
export async function verifySessionOwnership(
  sessionId: string,
  clerkId: string,
  options: VerifySessionOptions = {}
): Promise<SessionOwnershipResult> {
  try {
    const client = getConvexHttpClient();
    const bundle = await client.query(api.sessions.getWithMessagesAndReports, {
      sessionId: assertSessionId(sessionId),
    });
    if (!bundle) return { valid: false };

    const user = await client.query(api.users.getByClerkId, { clerkId });
    const userDoc = user ? assertUserDoc(user) : null;
    if (!userDoc || bundle.session.userId !== userDoc._id) {
      return { valid: false };
    }

    const safeBundle = assertSessionBundle(bundle);
    if (!options.includeMessages) {
      return { valid: true, session: safeBundle.session };
    }

    return {
      valid: true,
      session: withMessages(safeBundle),
    };
  } catch (error) {
    logger.databaseError('verify session ownership', toError(error), {
      sessionId,
      userId: clerkId,
    });
    return { valid: false };
  }
}

/**
 * Get paginated list of sessions for a user
 */
export async function getUserSessions(
  clerkId: string,
  options: PaginationOptions = {}
): Promise<PaginatedResult<SessionDoc>> {
  const client = getConvexHttpClient();
  const user = await client.query(api.users.getByClerkId, { clerkId });
  const userDoc = user ? assertUserDoc(user) : null;
  if (!userDoc) return {
    items: [],
    pagination: {
      limit: options.limit ?? 50,
      offset: options.offset ?? 0,
      total: 0,
      hasMore: false,
    },
  };

  const limit = Math.min(options.limit ?? 50, 100);
  const offset = options.offset ?? 0;

  const [sessions, total] = await Promise.all([
    client.query(api.sessions.listByUser, { userId: userDoc._id, limit, offset }),
    client.query(api.sessions.countByUser, { userId: userDoc._id }),
  ]);

  const items = assertSessionArray(sessions);
  const hasMore = offset + items.length < total;

  return {
    items,
    pagination: {
      limit,
      offset,
      total,
      hasMore,
    },
  };
}

/**
 * Get a session with all its messages
 */
export async function getSessionWithMessages(
  sessionId: string,
  clerkId: string
): Promise<SessionWithMessages | null> {
  const client = getConvexHttpClient();
  const user = await client.query(api.users.getByClerkId, { clerkId });
  const userDoc = user ? assertUserDoc(user) : null;
  if (!userDoc) return null;

  const bundle = await client.query(api.sessions.getWithMessagesAndReports, {
    sessionId: assertSessionId(sessionId),
  });
  if (!bundle) return null;

  const safeBundle = assertSessionBundle(bundle);
  if (safeBundle.session.userId !== userDoc._id) return null;

  return withMessages(safeBundle);
}

// ============================================================================
// Helper Functions
// ============================================================================

function assertSessionId(value: string): SessionId {
  if (!value || typeof value !== 'string') {
    throw new Error('Invalid session id provided');
  }
  return value as SessionId;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function assertUserDoc(value: unknown): UserDoc {
  if (!isRecord(value)) {
    throw new Error('Invalid user payload received');
  }
  if (typeof value._id !== 'string') {
    throw new Error('User payload missing _id');
  }
  return value as UserDoc;
}

function assertSessionDoc(value: unknown, context: string): SessionDoc {
  if (!isRecord(value)) {
    throw new Error(`${context} payload was not an object`);
  }
  if (typeof value._id !== 'string') {
    throw new Error(`${context} payload missing _id`);
  }
  if (typeof value.userId !== 'string') {
    throw new Error(`${context} payload missing userId`);
  }
  return value as SessionDoc;
}

function assertMessageArray(value: unknown): SessionBundle['messages'] {
  if (!Array.isArray(value)) {
    throw new Error('Messages payload must be an array');
  }
  return value.map(item => {
    if (!isRecord(item) || typeof item._id !== 'string') {
      throw new Error('Invalid message payload');
    }
    return item as SessionBundle['messages'][number];
  });
}

function assertReportArray(value: unknown): SessionBundle['reports'] {
  if (!Array.isArray(value)) {
    throw new Error('Reports payload must be an array');
  }
  return value.map(item => {
    if (!isRecord(item) || typeof item._id !== 'string') {
      throw new Error('Invalid report payload');
    }
    return item as SessionBundle['reports'][number];
  });
}

function assertSessionBundle(value: unknown): SessionBundle {
  if (!isRecord(value)) {
    throw new Error('Session bundle payload must be an object');
  }
  const session = assertSessionDoc(value.session, 'Session');
  const messages = assertMessageArray(value.messages ?? []);
  const reports = assertReportArray(value.reports ?? []);
  return { session, messages, reports };
}

function assertSessionArray(value: unknown): SessionDoc[] {
  if (!Array.isArray(value)) {
    throw new Error('Expected sessions to be an array');
  }
  return value.map(item => assertSessionDoc(item, 'Session'));
}

function withMessages(bundle: SessionBundle): SessionWithMessages {
  return {
    ...bundle.session,
    messages: bundle.messages,
    reports: bundle.reports,
  };
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
