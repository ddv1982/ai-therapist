import type { SessionDoc, SessionBundle } from '@/types/database';
import type { Doc, Id } from '../../../convex/_generated/dataModel';

jest.mock('@/lib/convex/http-client', () => ({
  getConvexHttpClient: jest.fn(),
  api: {
    sessions: {
      getWithMessagesAndReports: 'sessions.getWithMessagesAndReports',
      listByUser: 'sessions.listByUser',
      countByUser: 'sessions.countByUser',
    },
    users: {
      getByClerkId: 'users.getByClerkId',
      ensureByClerkId: 'users.ensureByClerkId',
    },
  },
  anyApi: {
    sessions: {
      listByUser: 'sessions.listByUser',
      countByUser: 'sessions.countByUser',
    },
    users: {
      getByClerkId: 'users.getByClerkId',
    },
  },
}));

const mockQuery = jest.fn();
const mockMutation = jest.fn();

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    databaseError: jest.fn(),
  },
}));

const { logger } = jest.requireMock('@/lib/utils/logger') as {
  logger: { databaseError: jest.Mock };
};

const mockDatabaseError = logger.databaseError;

function buildSessionDoc(overrides: Partial<SessionDoc> = {}): SessionDoc {
  return {
    _id: 'session_1' as Id<'sessions'>,
    _creationTime: Date.now(),
    userId: 'user_1' as Id<'users'>,
    title: 'Session Title',
    messageCount: 2,
    startedAt: Date.now(),
    endedAt: null,
    status: 'active',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

function buildUserDoc(): Doc<'users'> {
  return {
    _id: 'user_1' as Id<'users'>,
    _creationTime: Date.now(),
    clerkId: 'clerk_test_user',
    email: 'user@example.com',
    name: 'User',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function buildBundle(overrides: Partial<SessionBundle> = {}): SessionBundle {
  const session = buildSessionDoc();
  return {
    session,
    messages: [
      {
        _id: 'message_1' as Id<'messages'>,
        _creationTime: Date.now(),
        sessionId: session._id,
        role: 'user',
        content: 'Hello',
        modelUsed: 'gpt',
        metadata: { source: 'test' },
        timestamp: Date.now(),
        createdAt: Date.now(),
      },
    ],
    reports: [
      {
        _id: 'report_1' as Id<'sessionReports'>,
        _creationTime: Date.now(),
        sessionId: session._id,
        reportContent: 'Report content',
        keyPoints: [],
        therapeuticInsights: [],
        patternsIdentified: [],
        actionItems: [],
        moodAssessment: 'positive',
        progressNotes: 'doing better',
        cognitiveDistortions: [],
        schemaAnalysis: [],
        therapeuticFrameworks: [],
        recommendations: [],
        analysisConfidence: 0.8,
        analysisVersion: '1.0',
        createdAt: Date.now(),
      },
    ],
    ...overrides,
  };
}

describe('database queries type safety', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockMutation.mockReset();
    mockDatabaseError.mockReset();
    const { getConvexHttpClient } = require('@/lib/convex/http-client');
    if (!jest.isMockFunction(getConvexHttpClient)) {
      throw new Error('getConvexHttpClient is not mocked');
    }
    (getConvexHttpClient as jest.Mock).mockReturnValue({
      query: mockQuery,
      mutation: mockMutation,
    });
  });

  it('returns a typed session bundle when verifying ownership with messages included', async () => {
    const bundle = buildBundle();
    mockQuery.mockResolvedValueOnce(bundle).mockResolvedValueOnce(buildUserDoc());

    const result = await queries.verifySessionOwnership(
      bundle.session._id as string,
      'clerk_test_user',
      {
        includeMessages: true,
      }
    );

    expect(mockQuery).toHaveBeenCalledTimes(2);
    expect(mockQuery.mock.calls[0][1]).toEqual({
      sessionId: bundle.session._id as unknown as string,
    });
    expect(mockQuery.mock.calls[1][1]).toEqual({ clerkId: 'clerk_test_user' });
    expect(result.valid).toBe(true);
    expect(result.session).toBeDefined();
    if (!result.session || !('messages' in result.session)) {
      throw new Error('Expected session to contain relational data');
    }
    expect(result.session.messages).toHaveLength(1);
    expect(result.session.reports).toHaveLength(1);
  });

  it('logs and returns invalid when bundle validation fails', async () => {
    const invalidBundle = { session: null, messages: [], reports: [] };
    mockQuery.mockResolvedValueOnce(invalidBundle).mockResolvedValueOnce(buildUserDoc());

    const result = await queries.verifySessionOwnership('session_1', 'clerk_test_user', {
      includeMessages: true,
    });

    expect(result.valid).toBe(false);
    expect(mockDatabaseError).toHaveBeenCalledWith(
      'verify session ownership',
      expect.any(Error),
      expect.objectContaining({
        sessionId: 'session_1',
        userId: 'clerk_test_user',
      })
    );
  });

  it('returns null when requesting session with mismatched ownership', async () => {
    const bundle = buildBundle();
    const otherUser = buildUserDoc();
    mockQuery.mockResolvedValueOnce(otherUser).mockResolvedValueOnce({
      ...bundle,
      session: buildSessionDoc({ userId: 'user_2' as Id<'users'> }),
    });

    const result = await queries.getSessionWithMessages(
      bundle.session._id as string,
      otherUser.clerkId ?? ''
    );

    expect(result).toBeNull();
  });

  it('returns typed sessions list with pagination', async () => {
    const user = buildUserDoc();
    const session = buildSessionDoc();
    mockQuery
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce([session]) // listByUser result
      .mockResolvedValueOnce(1); // countByUser result

    const result = await queries.getUserSessions(user.clerkId ?? '');

    expect(result.items).toHaveLength(1);
    expect(result.items[0]._id).toBe(session._id);
    expect(result.pagination).toEqual({
      limit: 50,
      offset: 0,
      total: 1,
      hasMore: false,
    });
  });
});
let queries: typeof import('@/lib/repositories/session-repository');

beforeAll(async () => {
  queries = await import('@/lib/repositories/session-repository');
});
