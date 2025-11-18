import { checkMemoryContext, getMemoryManagementData, deleteMemory } from '@/lib/chat/memory-utils';

global.fetch = jest.fn();

describe('memory-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkMemoryContext', () => {
    it('returns memory info when reports exist', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            memoryContext: [{ reportDate: '2023-12-01' }, { reportDate: '2023-11-15' }],
          },
        }),
      });

      const result = await checkMemoryContext();

      expect(result.hasMemory).toBe(true);
      expect(result.reportCount).toBe(2);
      expect(result.lastReportDate).toBe('2023-12-01');
    });

    it('excludes session ID when provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { memoryContext: [] } }),
      });

      await checkMemoryContext('session123');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/reports/memory?excludeSessionId=session123&limit=3'
      );
    });

    it('returns no memory when empty array', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { memoryContext: [] } }),
      });

      const result = await checkMemoryContext();

      expect(result.hasMemory).toBe(false);
      expect(result.reportCount).toBe(0);
      expect(result.lastReportDate).toBeUndefined();
    });

    it('handles legacy plain response format', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          memoryContext: [{ reportDate: '2023-11-01' }],
        }),
      });

      const result = await checkMemoryContext();

      expect(result.hasMemory).toBe(true);
      expect(result.reportCount).toBe(1);
    });

    it('returns no memory on fetch error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await checkMemoryContext();

      expect(result.hasMemory).toBe(false);
      expect(result.reportCount).toBe(0);
    });

    it('handles network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await checkMemoryContext();

      expect(result.hasMemory).toBe(false);
      expect(result.reportCount).toBe(0);
    });

    it('sorts reports by date descending', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            memoryContext: [
              { reportDate: '2023-10-15' },
              { reportDate: '2023-12-01' },
              { reportDate: '2023-11-10' },
            ],
          },
        }),
      });

      const result = await checkMemoryContext();

      expect(result.lastReportDate).toBe('2023-12-01');
    });

    it('handles null memoryContext', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { memoryContext: null } }),
      });

      const result = await checkMemoryContext();

      expect(result.hasMemory).toBe(false);
    });
  });

  describe('getMemoryManagementData', () => {
    it('fetches memory management data with defaults', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            memoryDetails: [],
            reportCount: 0,
            stats: {
              hasMemory: false,
              totalReportsFound: 0,
              successfullyProcessed: 0,
              failedDecryptions: 0,
            },
          },
        }),
      });

      const result = await getMemoryManagementData();

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/reports/memory?manage=true');
    });

    it('uses sessionId when provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            memoryDetails: [],
            reportCount: 0,
            stats: {
              hasMemory: false,
              totalReportsFound: 0,
              successfullyProcessed: 0,
              failedDecryptions: 0,
            },
          },
        }),
      });

      await getMemoryManagementData('session123');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/reports/memory?manage=true&excludeSessionId=session123'
      );
    });

    it('returns memory details on success', async () => {
      const mockData = {
        memoryDetails: [
          {
            id: 'r1',
            sessionId: 's1',
            sessionTitle: 'Test',
            sessionDate: '2023-12-01',
            reportDate: '2023-12-01',
            contentPreview: 'Preview...',
            keyInsights: ['insight1'],
            hasEncryptedContent: true,
            reportSize: 100,
          },
        ],
        reportCount: 1,
        stats: {
          hasMemory: true,
          totalReportsFound: 1,
          successfullyProcessed: 1,
          failedDecryptions: 0,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockData }),
      });

      const result = await getMemoryManagementData();

      expect(result.success).toBe(true);
      expect(result.memoryDetails).toHaveLength(1);
      expect(result.reportCount).toBe(1);
    });

    it('returns failure on fetch error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: 'Server error' } }),
      });

      const result = await getMemoryManagementData();

      expect(result.success).toBe(false);
      expect(result.memoryDetails).toEqual([]);
    });

    it('handles network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await getMemoryManagementData();

      expect(result.success).toBe(false);
      expect(result.reportCount).toBe(0);
    });
  });

  describe('deleteMemory', () => {
    it('deletes specific sessions', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          deletedCount: 2,
          message: 'Deleted',
          deletionType: 'specific',
        }),
      });

      const result = await deleteMemory({ type: 'specific', sessionIds: ['s1', 's2'] });

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(2);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/reports/memory?sessionIds=s1%2Cs2',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('deletes recent N reports', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          deletedCount: 3,
          message: 'Deleted',
          deletionType: 'recent',
        }),
      });

      const result = await deleteMemory({ type: 'recent', limit: 3 });

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/reports/memory?limit=3',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('excludes current session when specified', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          deletedCount: 1,
          message: 'Deleted',
          deletionType: 'all-except-current',
        }),
      });

      const result = await deleteMemory({
        type: 'all-except-current',
        sessionId: 'current123',
        limit: 5,
      });

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/reports/memory?excludeSessionId=current123',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('deletes all memory when type is all', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          deletedCount: 10,
          message: 'All deleted',
          deletionType: 'all',
        }),
      });

      const result = await deleteMemory({ type: 'all' });

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/reports/memory?',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('returns failure on DELETE error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: { message: 'Forbidden' } }),
      });

      const result = await deleteMemory({ type: 'recent', limit: 1 });

      expect(result.success).toBe(false);
      expect(result.deletedCount).toBe(0);
    });

    it('handles network errors during deletion', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await deleteMemory({ type: 'specific', sessionIds: ['s1'] });

      expect(result.success).toBe(false);
      expect(result.deletedCount).toBe(0);
    });
  });
});
