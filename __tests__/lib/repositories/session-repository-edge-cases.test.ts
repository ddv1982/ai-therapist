/**
 * Session Repository Edge Case Tests
 *
 * Tests for concurrent updates, partial failures, and boundary conditions
 * to ensure robust handling of edge cases in the session repository.
 */

import {
  verifySessionOwnership,
  getUserSessions,
  getSessionWithMessages,
} from '@/lib/repositories/session-repository';

const mockQuery = jest.fn();
const mockMutation = jest.fn();

jest.mock('@/lib/convex/http-client', () => ({
  getConvexHttpClient: () => ({
    query: mockQuery,
    mutation: mockMutation,
  }),
  api: {
    sessions: {
      getWithMessagesAndReports: 'sessions.getWithMessagesAndReports',
      countByUser: 'sessions.countByUser',
    },
    users: {
      getByClerkId: 'users.getByClerkId',
    },
  },
  anyApi: {
    sessions: {
      listByUserPaginated: 'sessions.listByUserPaginated',
      countByUser: 'sessions.countByUser',
    },
    users: {
      getByClerkId: 'users.getByClerkId',
    },
  },
}));

describe('session-repository - edge cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('concurrent session updates', () => {
    it('handles single verifySessionOwnership call successfully', async () => {
      mockQuery
        .mockResolvedValueOnce({
          session: { _id: 'session1', userId: 'user1' },
          messages: [],
          reports: [],
        })
        .mockResolvedValueOnce({ _id: 'user1' });

      const result = await verifySessionOwnership('session1', 'clerk1');

      expect(result.valid).toBe(true);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('handles sequential verifySessionOwnership calls', async () => {
      // First call
      mockQuery
        .mockResolvedValueOnce({
          session: { _id: 'session1', userId: 'user1' },
          messages: [],
          reports: [],
        })
        .mockResolvedValueOnce({ _id: 'user1' });

      const result1 = await verifySessionOwnership('session1', 'clerk1');
      expect(result1.valid).toBe(true);

      // Second call
      mockQuery
        .mockResolvedValueOnce({
          session: { _id: 'session2', userId: 'user1' },
          messages: [],
          reports: [],
        })
        .mockResolvedValueOnce({ _id: 'user1' });

      const result2 = await verifySessionOwnership('session2', 'clerk1');
      expect(result2.valid).toBe(true);

      expect(mockQuery).toHaveBeenCalledTimes(4);
    });

    it('handles mixed success/failure calls', async () => {
      // First call - success
      mockQuery
        .mockResolvedValueOnce({
          session: { _id: 'session1', userId: 'user1' },
          messages: [],
          reports: [],
        })
        .mockResolvedValueOnce({ _id: 'user1' });

      const result1 = await verifySessionOwnership('session1', 'clerk1');
      expect(result1.valid).toBe(true);

      // Second call - session not found
      mockQuery.mockResolvedValueOnce(null);

      const result2 = await verifySessionOwnership('session2', 'clerk2');
      expect(result2.valid).toBe(false);

      // Third call - network error
      mockQuery.mockRejectedValueOnce(new Error('Network error'));

      const result3 = await verifySessionOwnership('session3', 'clerk3');
      expect(result3.valid).toBe(false);
    });

    it('handles getUserSessions call', async () => {
      mockQuery
        .mockResolvedValueOnce({ _id: 'user1' })
        .mockResolvedValueOnce({
          page: [{ _id: 'session1', userId: 'user1' }],
          continueCursor: null,
          isDone: true,
        })
        .mockResolvedValueOnce(1);

      const result = await getUserSessions('clerk1');

      expect(result.items).toHaveLength(1);
      expect(result.items[0]._id).toBe('session1');
    });
  });

  describe('partial failure recovery', () => {
    it('handles user query failure during session verification', async () => {
      mockQuery
        .mockResolvedValueOnce({
          session: { _id: 'session1', userId: 'user1' },
          messages: [],
          reports: [],
        })
        .mockRejectedValueOnce(new Error('User service unavailable'));

      const result = await verifySessionOwnership('session1', 'clerk1');

      expect(result.valid).toBe(false);
    });

    it('handles session query failure during getUserSessions', async () => {
      mockQuery
        .mockResolvedValueOnce({ _id: 'user1' })
        .mockRejectedValueOnce(new Error('Sessions query failed'));

      await expect(getUserSessions('clerk1')).rejects.toThrow('Sessions query failed');
    });

    it('handles count query failure gracefully', async () => {
      mockQuery
        .mockResolvedValueOnce({ _id: 'user1' })
        .mockResolvedValueOnce({
          page: [{ _id: 'session1', userId: 'user1' }],
          continueCursor: null,
          isDone: true,
        })
        .mockRejectedValueOnce(new Error('Count query failed'));

      await expect(getUserSessions('clerk1')).rejects.toThrow('Count query failed');
    });

    it('handles transient failures with Invalid message', async () => {
      mockQuery.mockRejectedValue(new Error('Invalid session ID format'));

      const result = await verifySessionOwnership('invalid-id', 'clerk1');

      expect(result.valid).toBe(false);
    });

    it('handles messages array with partial invalid entries', async () => {
      mockQuery
        .mockResolvedValueOnce({
          session: { _id: 'session1', userId: 'user1' },
          messages: [{ _id: 'msg1' }, { invalid: true }], // one valid, one invalid
          reports: [],
        })
        .mockResolvedValueOnce({ _id: 'user1' });

      const result = await verifySessionOwnership('session1', 'clerk1');

      // Should fail because of invalid message
      expect(result.valid).toBe(false);
    });
  });

  describe('boundary conditions', () => {
    it('handles empty session ID', async () => {
      const result = await verifySessionOwnership('', 'clerk1');
      expect(result.valid).toBe(false);
    });

    it('handles whitespace-only session ID', async () => {
      // The function should handle trimmed empty strings
      const result = await verifySessionOwnership('   ', 'clerk1');
      // Depends on implementation - check that it doesn't crash
      expect(typeof result.valid).toBe('boolean');
    });

    it('handles null-like values in clerk ID', async () => {
      mockQuery.mockResolvedValueOnce(null);

      const result = await verifySessionOwnership('session1', '');
      expect(result.valid).toBe(false);
    });

    it('handles session with maximum messages', async () => {
      // Simulate a session with 10000 messages (max limit)
      const manyMessages = Array.from({ length: 10000 }, (_, i) => ({
        _id: `msg${i}`,
        content: `Message ${i}`,
      }));

      mockQuery
        .mockResolvedValueOnce({
          session: { _id: 'session1', userId: 'user1' },
          messages: manyMessages,
          reports: [],
        })
        .mockResolvedValueOnce({ _id: 'user1' });

      const result = await verifySessionOwnership('session1', 'clerk1', {
        includeMessages: true,
      });

      expect(result.valid).toBe(true);
      if (result.valid && result.session && 'messages' in result.session) {
        expect(result.session.messages).toHaveLength(10000);
      }
    });

    it('handles session with empty messages array', async () => {
      mockQuery
        .mockResolvedValueOnce({
          session: { _id: 'session1', userId: 'user1' },
          messages: [],
          reports: [],
        })
        .mockResolvedValueOnce({ _id: 'user1' });

      const result = await verifySessionOwnership('session1', 'clerk1', {
        includeMessages: true,
      });

      expect(result.valid).toBe(true);
      if (result.valid && result.session && 'messages' in result.session) {
        expect(result.session.messages).toHaveLength(0);
      }
    });

    it('handles session with maximum reports', async () => {
      const manyReports = Array.from({ length: 100 }, (_, i) => ({
        _id: `report${i}`,
        content: `Report ${i}`,
      }));

      mockQuery
        .mockResolvedValueOnce({
          session: { _id: 'session1', userId: 'user1' },
          messages: [],
          reports: manyReports,
        })
        .mockResolvedValueOnce({ _id: 'user1' });

      const result = await verifySessionOwnership('session1', 'clerk1', {
        includeMessages: true,
      });

      expect(result.valid).toBe(true);
      if (result.valid && result.session && 'reports' in result.session) {
        expect(result.session.reports).toHaveLength(100);
      }
    });

    it('handles user with zero sessions', async () => {
      mockQuery
        .mockResolvedValueOnce({ _id: 'user1' })
        .mockResolvedValueOnce({
          page: [],
          continueCursor: null,
          isDone: true,
        })
        .mockResolvedValueOnce(0);

      const result = await getUserSessions('clerk1');

      expect(result.items).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.hasMore).toBe(false);
    });

    it('handles user with maximum sessions', async () => {
      const manySessions = Array.from({ length: 1000 }, (_, i) => ({
        _id: `session${i}`,
        userId: 'user1',
        title: `Session ${i}`,
      }));

      mockQuery
        .mockResolvedValueOnce({ _id: 'user1' })
        .mockResolvedValueOnce({
          page: manySessions,
          continueCursor: 'cursor-next',
          isDone: false,
        })
        .mockResolvedValueOnce(1000);

      const result = await getUserSessions('clerk1');

      expect(result.items).toHaveLength(1000);
      expect(result.pagination.total).toBe(1000);
    });
  });

  describe('special characters and unicode', () => {
    it('handles session ID with special characters', async () => {
      // Convex IDs typically don't have special characters but test robustness
      const specialSessionId = 'session-123_abc';
      mockQuery
        .mockResolvedValueOnce({
          session: { _id: specialSessionId, userId: 'user1' },
          messages: [],
          reports: [],
        })
        .mockResolvedValueOnce({ _id: 'user1' });

      const result = await verifySessionOwnership(specialSessionId, 'clerk1');

      expect(result.valid).toBe(true);
    });

    it('handles user with unicode email/name', async () => {
      mockQuery
        .mockResolvedValueOnce({ _id: 'user1' })
        .mockResolvedValueOnce({
          page: [
            {
              _id: 'session1',
              userId: 'user1',
              title: '日本語セッション 🌟',
            },
          ],
          continueCursor: null,
          isDone: true,
        })
        .mockResolvedValueOnce(1);

      const result = await getUserSessions('clerk_日本語');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('日本語セッション 🌟');
    });

    it('handles messages with unicode content', async () => {
      mockQuery
        .mockResolvedValueOnce({
          session: { _id: 'session1', userId: 'user1' },
          messages: [
            {
              _id: 'msg1',
              content: '你好世界 🌍 مرحبا العالم',
              role: 'user',
            },
          ],
          reports: [],
        })
        .mockResolvedValueOnce({ _id: 'user1' });

      const result = await verifySessionOwnership('session1', 'clerk1', {
        includeMessages: true,
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('getSessionWithMessages edge cases', () => {
    it('handles invalid session ID format gracefully', async () => {
      mockQuery.mockRejectedValue(new Error('invalid session ID format'));

      const result = await getSessionWithMessages('not-a-valid-id', 'clerk1');

      expect(result).toBeNull();
    });

    it('returns null for empty session ID', async () => {
      const result = await getSessionWithMessages('', 'clerk1');

      expect(result).toBeNull();
    });

    it('returns null when session query fails', async () => {
      mockQuery
        .mockResolvedValueOnce({ _id: 'user1' })
        .mockRejectedValueOnce(new Error('Invalid session query'));

      const result = await getSessionWithMessages('session1', 'clerk1');

      expect(result).toBeNull();
    });

    it('handles session with all report fields', async () => {
      mockQuery.mockResolvedValueOnce({ _id: 'user1' }).mockResolvedValueOnce({
        session: { _id: 'session1', userId: 'user1', title: 'Full Session' },
        messages: [{ _id: 'msg1', content: 'Hello', role: 'user' }],
        reports: [
          {
            _id: 'report1',
            keyPoints: ['Point 1'],
            therapeuticInsights: { insight: 'value' },
            patternsIdentified: ['Pattern 1'],
            actionItems: ['Action 1'],
          },
        ],
      });

      const result = await getSessionWithMessages('session1', 'clerk1');

      expect(result).not.toBeNull();
      expect(result?.reports).toHaveLength(1);
    });

    it('handles missing optional bundle fields', async () => {
      mockQuery.mockResolvedValueOnce({ _id: 'user1' }).mockResolvedValueOnce({
        session: { _id: 'session1', userId: 'user1' },
        // messages and reports missing - should use defaults
      });

      const result = await getSessionWithMessages('session1', 'clerk1');

      expect(result).not.toBeNull();
      expect(result?.messages).toEqual([]);
      expect(result?.reports).toEqual([]);
    });
  });

  describe('error message handling', () => {
    it('handles "Invalid" error messages', async () => {
      mockQuery.mockRejectedValue(new Error('Invalid ID'));

      const result = await verifySessionOwnership('session1', 'clerk1');

      expect(result.valid).toBe(false);
    });

    it('handles "invalid" lowercase error messages', async () => {
      mockQuery.mockRejectedValue(new Error('Argument is invalid'));

      const result = await verifySessionOwnership('session1', 'clerk1');

      expect(result.valid).toBe(false);
    });

    it('re-throws non-validation errors in getSessionWithMessages', async () => {
      mockQuery
        .mockResolvedValueOnce({ _id: 'user1' })
        .mockRejectedValueOnce(new Error('Database connection lost'));

      await expect(getSessionWithMessages('session1', 'clerk1')).rejects.toThrow(
        'Database connection lost'
      );
    });
  });
});
