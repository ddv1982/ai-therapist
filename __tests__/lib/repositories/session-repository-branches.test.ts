import {
  verifySessionOwnership,
  getUserSessions,
  getSessionWithMessages,
} from '@/lib/repositories/session-repository';

const mockQuery = jest.fn();
jest.mock('@/lib/convex/http-client', () => ({
  getConvexHttpClient: () => ({ query: mockQuery }),
  api: {
    sessions: {
      getWithMessagesAndReports: 'sessions.getWithMessagesAndReports',
      listByUser: 'sessions.listByUser',
      countByUser: 'sessions.countByUser',
    },
    users: {
      getByClerkId: 'users.getByClerkId',
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

describe('session-repository - branch coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifySessionOwnership', () => {
    it('returns invalid when session not found', async () => {
      mockQuery.mockResolvedValue(null);

      const result = await verifySessionOwnership('session123', 'clerk123');

      expect(result.valid).toBe(false);
      expect(result.session).toBeUndefined();
    });

    it('returns invalid when user not found', async () => {
      mockQuery
        .mockResolvedValueOnce({
          session: { _id: 'session123', userId: 'user123' },
          messages: [],
          reports: [],
        })
        .mockResolvedValueOnce(null); // user not found

      const result = await verifySessionOwnership('session123', 'clerk123');

      expect(result.valid).toBe(false);
    });

    it('returns invalid when userId mismatch', async () => {
      mockQuery
        .mockResolvedValueOnce({
          session: { _id: 'session123', userId: 'user123' },
          messages: [],
          reports: [],
        })
        .mockResolvedValueOnce({ _id: 'user456' }); // different user

      const result = await verifySessionOwnership('session123', 'clerk123');

      expect(result.valid).toBe(false);
    });

    it('returns session without messages by default', async () => {
      mockQuery
        .mockResolvedValueOnce({
          session: { _id: 'session123', userId: 'user123' },
          messages: [{ _id: 'msg1', content: 'test' }],
          reports: [],
        })
        .mockResolvedValueOnce({ _id: 'user123' });

      const result = await verifySessionOwnership('session123', 'clerk123');

      expect(result.valid).toBe(true);
      expect(result.session).toBeDefined();
      expect('messages' in (result.session || {})).toBe(false);
    });

    it('includes messages when requested', async () => {
      mockQuery
        .mockResolvedValueOnce({
          session: { _id: 'session123', userId: 'user123' },
          messages: [{ _id: 'msg1', content: 'test' }],
          reports: [],
        })
        .mockResolvedValueOnce({ _id: 'user123' });

      const result = await verifySessionOwnership('session123', 'clerk123', {
        includeMessages: true,
      });

      expect(result.valid).toBe(true);
      expect(result.session).toBeDefined();
      expect('messages' in (result.session || {})).toBe(true);
    });

    it('returns invalid on query error', async () => {
      mockQuery.mockRejectedValue(new Error('Query failed'));

      const result = await verifySessionOwnership('session123', 'clerk123');

      expect(result.valid).toBe(false);
    });

    it('handles invalid sessionId', async () => {
      const result = await verifySessionOwnership('', 'clerk123');

      expect(result.valid).toBe(false);
    });
  });

  describe('getUserSessions', () => {
    it('returns empty list when user not found', async () => {
      mockQuery.mockResolvedValue(null);

      const result = await getUserSessions('clerk123');

      expect(result.items).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.hasMore).toBe(false);
    });

    it('uses default pagination when not provided', async () => {
      mockQuery
        .mockResolvedValueOnce({ _id: 'user123' })
        .mockResolvedValueOnce([{ _id: 'session1', userId: 'user123' }])
        .mockResolvedValueOnce(1);

      const result = await getUserSessions('clerk123');

      expect(result.pagination.limit).toBe(50);
      expect(result.pagination.offset).toBe(0);
    });

    it('caps limit at 100', async () => {
      mockQuery
        .mockResolvedValueOnce({ _id: 'user123' })
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(0);

      const result = await getUserSessions('clerk123', { limit: 500 });

      expect(result.pagination.limit).toBe(100);
    });

    it('sets hasMore to true when more items exist', async () => {
      mockQuery
        .mockResolvedValueOnce({ _id: 'user123' })
        .mockResolvedValueOnce([
          { _id: 'session1', userId: 'user123' },
          { _id: 'session2', userId: 'user123' },
        ])
        .mockResolvedValueOnce(5);

      const result = await getUserSessions('clerk123', { limit: 2, offset: 0 });

      expect(result.pagination.hasMore).toBe(true);
    });

    it('sets hasMore to false when at end', async () => {
      mockQuery
        .mockResolvedValueOnce({ _id: 'user123' })
        .mockResolvedValueOnce([{ _id: 'session1', userId: 'user123' }])
        .mockResolvedValueOnce(1);

      const result = await getUserSessions('clerk123', { limit: 10, offset: 0 });

      expect(result.pagination.hasMore).toBe(false);
    });

    it('handles custom offset', async () => {
      mockQuery
        .mockResolvedValueOnce({ _id: 'user123' })
        .mockResolvedValueOnce([{ _id: 'session2', userId: 'user123' }])
        .mockResolvedValueOnce(5);

      const result = await getUserSessions('clerk123', { offset: 10 });

      expect(result.pagination.offset).toBe(10);
    });
  });

  describe('getSessionWithMessages', () => {
    it('returns null when user not found', async () => {
      mockQuery.mockResolvedValue(null);

      const result = await getSessionWithMessages('session123', 'clerk123');

      expect(result).toBeNull();
    });

    it('returns null when session not found', async () => {
      mockQuery.mockResolvedValueOnce({ _id: 'user123' }).mockResolvedValueOnce(null);

      const result = await getSessionWithMessages('session123', 'clerk123');

      expect(result).toBeNull();
    });

    it('returns null when userId mismatch', async () => {
      mockQuery.mockResolvedValueOnce({ _id: 'user123' }).mockResolvedValueOnce({
        session: { _id: 'session123', userId: 'user456' },
        messages: [],
        reports: [],
      });

      const result = await getSessionWithMessages('session123', 'clerk123');

      expect(result).toBeNull();
    });

    it('returns session with messages on success', async () => {
      mockQuery.mockResolvedValueOnce({ _id: 'user123' }).mockResolvedValueOnce({
        session: { _id: 'session123', userId: 'user123', title: 'Test' },
        messages: [{ _id: 'msg1', content: 'test' }],
        reports: [{ _id: 'report1' }],
      });

      const result = await getSessionWithMessages('session123', 'clerk123');

      expect(result).not.toBeNull();
      expect(result?._id).toBe('session123');
      expect(result?.messages).toHaveLength(1);
      expect(result?.reports).toHaveLength(1);
    });
  });

  describe('assertion helpers', () => {
    it('throws on invalid user payload without _id', async () => {
      mockQuery
        .mockResolvedValueOnce({
          session: { _id: 'session123', userId: 'user123' },
          messages: [],
          reports: [],
        })
        .mockResolvedValueOnce({ invalid: true }); // missing _id

      const result = await verifySessionOwnership('session123', 'clerk123');

      expect(result.valid).toBe(false);
    });

    it('throws on non-object user payload', async () => {
      mockQuery
        .mockResolvedValueOnce({
          session: { _id: 'session123', userId: 'user123' },
          messages: [],
          reports: [],
        })
        .mockResolvedValueOnce('invalid'); // not an object

      const result = await verifySessionOwnership('session123', 'clerk123');

      expect(result.valid).toBe(false);
    });

    it('throws on invalid session payload', async () => {
      mockQuery.mockResolvedValueOnce({
        session: { invalid: true }, // missing _id and userId
        messages: [],
        reports: [],
      });

      const result = await verifySessionOwnership('session123', 'clerk123');

      expect(result.valid).toBe(false);
    });

    it('throws on non-array messages', async () => {
      mockQuery
        .mockResolvedValueOnce({
          session: { _id: 'session123', userId: 'user123' },
          messages: 'invalid', // not an array
          reports: [],
        })
        .mockResolvedValueOnce({ _id: 'user123' });

      const result = await verifySessionOwnership('session123', 'clerk123');

      expect(result.valid).toBe(false);
    });

    it('throws on invalid message in array', async () => {
      mockQuery
        .mockResolvedValueOnce({
          session: { _id: 'session123', userId: 'user123' },
          messages: [{ invalid: true }], // missing _id
          reports: [],
        })
        .mockResolvedValueOnce({ _id: 'user123' });

      const result = await verifySessionOwnership('session123', 'clerk123');

      expect(result.valid).toBe(false);
    });

    it('throws on non-array reports', async () => {
      mockQuery
        .mockResolvedValueOnce({
          session: { _id: 'session123', userId: 'user123' },
          messages: [],
          reports: 'invalid', // not an array
        })
        .mockResolvedValueOnce({ _id: 'user123' });

      const result = await verifySessionOwnership('session123', 'clerk123');

      expect(result.valid).toBe(false);
    });

    it('throws on non-object bundle', async () => {
      mockQuery.mockResolvedValueOnce('invalid'); // not an object

      const result = await verifySessionOwnership('session123', 'clerk123');

      expect(result.valid).toBe(false);
    });

    it('handles non-Error exceptions', async () => {
      mockQuery.mockRejectedValue('string error');

      const result = await verifySessionOwnership('session123', 'clerk123');

      expect(result.valid).toBe(false);
    });
  });
});
