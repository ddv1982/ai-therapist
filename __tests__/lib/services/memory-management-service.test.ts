import { MemoryManagementService } from '@/lib/services/memory-management-service';

// Mock Convex HTTP client
const mockQuery = jest.fn();
const mockMutation = jest.fn();
jest.mock('@/lib/convex/http-client', () => ({
  getConvexHttpClient: () => ({
    query: mockQuery,
    mutation: mockMutation,
  }),
  anyApi: {
    reports: {
      listRecent: 'reports.listRecent',
      listBySession: 'reports.listBySession',
      removeMany: 'reports.removeMany',
    },
    sessions: {
      get: 'sessions.get',
      listByUser: 'sessions.listByUser',
    },
    users: {
      getByClerkId: 'users.getByClerkId',
    },
  },
}));

// Mock decryption
jest.mock('@/lib/chat/message-encryption', () => ({
  decryptSessionReportContent: (content: string) => {
    if (content === 'encrypted_fail') throw new Error('Decryption failed');
    return `Decrypted: ${content}`;
  },
}));

describe('MemoryManagementService', () => {
  let service: MemoryManagementService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MemoryManagementService();
  });

  describe('getMemoryContext', () => {
    it('returns empty context when no reports found', async () => {
      mockQuery.mockResolvedValue([]);
      
      const result = await service.getMemoryContext(5, null);
      
      expect(result.memoryContext).toEqual([]);
      expect(result.reportCount).toBe(0);
      expect(result.stats.totalReportsFound).toBe(0);
      expect(result.stats.successfullyDecrypted).toBe(0);
      expect(result.stats.failedDecryptions).toBe(0);
    });

    it('processes reports with structured data', async () => {
      mockQuery
        .mockResolvedValueOnce([
          {
            _id: 'report1',
            sessionId: 'session1',
            reportContent: 'content1',
            keyPoints: ['point1', 'point2'],
            therapeuticInsights: { primaryInsights: ['insight1'] },
            patternsIdentified: ['pattern1'],
            createdAt: 1000000,
          },
        ])
        .mockResolvedValueOnce({
          _id: 'session1',
          title: 'Test Session',
          startedAt: 500000,
        });
      
      const result = await service.getMemoryContext(5, null);
      
      expect(result.memoryContext).toHaveLength(1);
      expect(result.memoryContext[0].sessionTitle).toBe('Test Session');
      expect(result.memoryContext[0].summary).toContain('Key insights');
      expect(result.stats.successfullyDecrypted).toBe(1);
    });

    it('handles decryption failures gracefully', async () => {
      mockQuery
        .mockResolvedValueOnce([
          {
            _id: 'report1',
            sessionId: 'session1',
            reportContent: 'encrypted_fail',
            createdAt: 1000000,
          },
        ]);
      
      const result = await service.getMemoryContext(5, null);
      
      expect(result.memoryContext).toHaveLength(0);
      expect(result.stats.failedDecryptions).toBe(1);
    });

    it('limits results to specified limit', async () => {
      mockQuery.mockResolvedValue([]);
      
      await service.getMemoryContext(3, null);
      
      expect(mockQuery).toHaveBeenCalledWith('reports.listRecent', {
        limit: 3,
        excludeSessionId: undefined,
      });
    });

    it('caps limit at 10', async () => {
      mockQuery.mockResolvedValue([]);
      
      await service.getMemoryContext(50, null);
      
      expect(mockQuery).toHaveBeenCalledWith('reports.listRecent', {
        limit: 10,
        excludeSessionId: undefined,
      });
    });

    it('excludes session when provided', async () => {
      mockQuery.mockResolvedValue([]);
      
      await service.getMemoryContext(5, 'exclude123');
      
      expect(mockQuery).toHaveBeenCalledWith('reports.listRecent', {
        limit: 5,
        excludeSessionId: 'exclude123',
      });
    });
  });

  describe('getMemoryManagement', () => {
    it('returns detailed report information', async () => {
      mockQuery
        .mockResolvedValueOnce([
          {
            _id: 'report1',
            sessionId: 'session1',
            reportContent: 'content1',
            keyPoints: ['point1'],
            createdAt: 1000000,
          },
        ])
        .mockResolvedValueOnce({
          _id: 'session1',
          title: 'Test Session',
          startedAt: 500000,
        });
      
      const result = await service.getMemoryManagement(5, null, false);
      
      expect(result.memoryDetails).toHaveLength(1);
      expect(result.memoryDetails[0].contentPreview).toContain('Decrypted');
      expect(result.stats.hasMemory).toBe(true);
    });

    it('includes full content when requested', async () => {
      mockQuery
        .mockResolvedValueOnce([
          {
            _id: 'report1',
            sessionId: 'session1',
            reportContent: 'content1',
            createdAt: 1000000,
          },
        ])
        .mockResolvedValueOnce({ _id: 'session1', title: 'Test', startedAt: 500000 });
      
      const result = await service.getMemoryManagement(5, null, true);
      
      expect(result.memoryDetails[0].fullContent).toBeDefined();
    });

    it('handles decryption failures in management mode', async () => {
      mockQuery
        .mockResolvedValueOnce([
          {
            _id: 'report1',
            sessionId: 'session1',
            reportContent: 'encrypted_fail',
            createdAt: 1000000,
          },
        ])
        .mockResolvedValueOnce({ _id: 'session1', title: 'Test', startedAt: 500000 });
      
      const result = await service.getMemoryManagement(5, null, false);
      
      expect(result.memoryDetails[0].hasEncryptedContent).toBe(false);
      expect(result.stats.failedDecryptions).toBe(1);
    });
  });

  describe('deleteMemory', () => {
    it('deletes specific sessions', async () => {
      mockQuery
        .mockResolvedValueOnce({ _id: 'user1' }) // getByClerkId
        .mockResolvedValueOnce([{ _id: 'session1' }]) // listByUser
        .mockResolvedValueOnce([
          { _id: 'report1', sessionId: 'session1' },
          { _id: 'report2', sessionId: 'session2' },
        ]);
      mockMutation.mockResolvedValue({ count: 1 });
      
      const result = await service.deleteMemory('clerk123', ['session1']);
      
      expect(result.deletedCount).toBe(1);
      expect(result.deletionType).toBe('specific');
      expect(mockMutation).toHaveBeenCalledWith('reports.removeMany', {
        ids: ['report1'],
      });
    });

    it('deletes recent N reports', async () => {
      mockQuery
        .mockResolvedValueOnce({ _id: 'user1' }) // getByClerkId
        .mockResolvedValueOnce([{ _id: 'session1' }]) // listByUser
        .mockResolvedValueOnce([
          { _id: 'report1', sessionId: 'session1', createdAt: 3000 },
          { _id: 'report2', sessionId: 'session1', createdAt: 2000 },
          { _id: 'report3', sessionId: 'session1', createdAt: 1000 },
        ]);
      mockMutation.mockResolvedValue({ count: 2 });
      
      const result = await service.deleteMemory('clerk123', undefined, 2);
      
      expect(result.deletedCount).toBe(2);
      expect(result.deletionType).toBe('recent');
      expect(mockMutation).toHaveBeenCalledWith('reports.removeMany', {
        ids: ['report1', 'report2'],
      });
    });

    it('deletes all except current session', async () => {
      mockQuery
        .mockResolvedValueOnce({ _id: 'user1' }) // getByClerkId
        .mockResolvedValueOnce([{ _id: 'session1' }]) // listByUser
        .mockResolvedValueOnce([
          { _id: 'report1', sessionId: 'session1' },
          { _id: 'report2', sessionId: 'session2' },
        ]);
      mockMutation.mockResolvedValue({ count: 1 });
      
      const result = await service.deleteMemory('clerk123', undefined, undefined, 'session2');
      
      expect(result.deletedCount).toBe(1);
      expect(result.deletionType).toBe('all-except-current');
    });

    it('deletes all memory', async () => {
      mockQuery
        .mockResolvedValueOnce({ _id: 'user1' }) // getByClerkId
        .mockResolvedValueOnce([{ _id: 'session1' }]) // listByUser
        .mockResolvedValueOnce([
          { _id: 'report1', sessionId: 'session1' },
          { _id: 'report2', sessionId: 'session2' },
        ]);
      mockMutation.mockResolvedValue({ count: 2 });
      
      const result = await service.deleteMemory('clerk123');
      
      expect(result.deletedCount).toBe(2);
      expect(result.deletionType).toBe('all');
    });

    it('throws error when user not found', async () => {
      mockQuery.mockResolvedValueOnce(null); // getByClerkId returns null
      
      await expect(service.deleteMemory('invalid')).rejects.toThrow('User not found');
    });

    it('handles zero reports to delete', async () => {
      mockQuery
        .mockResolvedValueOnce({ _id: 'user123' }) // getByClerkId
        .mockResolvedValueOnce([]) // listByUser returns empty
        .mockResolvedValueOnce([]); // listBySession returns empty
      
      const result = await service.deleteMemory('clerk123');
      
      expect(result.deletedCount).toBe(0);
      expect(mockMutation).not.toHaveBeenCalled();
    });
  });

  describe('createTherapeuticSummary', () => {
    it('creates summary from structured data', async () => {
      mockQuery
        .mockResolvedValueOnce([
          {
            _id: 'report1',
            sessionId: 'session1',
            reportContent: 'content1',
            keyPoints: ['point1', 'point2', 'point3', 'point4'],
            therapeuticInsights: {
              primaryInsights: ['insight1', 'insight2'],
              growthAreas: ['growth1', 'growth2'],
            },
            patternsIdentified: ['pattern1', 'pattern2'],
            createdAt: 1000000,
          },
        ])
        .mockResolvedValueOnce({ _id: 'session1', title: 'Test', startedAt: 500000 });
      
      const result = await service.getMemoryContext(5, null);
      
      expect(result.memoryContext[0].summary).toContain('Key insights');
      expect(result.memoryContext[0].summary).toContain('Therapeutic focus');
      expect(result.memoryContext[0].summary).toContain('Growth areas');
      expect(result.memoryContext[0].summary).toContain('Patterns identified');
    });

    it('falls back to content truncation when no structured data', async () => {
      const longContent = 'x'.repeat(1000);
      mockQuery
        .mockResolvedValueOnce([
          {
            _id: 'report1',
            sessionId: 'session1',
            reportContent: longContent,
            createdAt: 1000000,
          },
        ])
        .mockResolvedValueOnce({ _id: 'session1', title: 'Test', startedAt: 500000 });
      
      const result = await service.getMemoryContext(5, null);
      
      expect(result.memoryContext[0].summary.length).toBeLessThanOrEqual(510); // 500 + '...'
    });
  });
});
