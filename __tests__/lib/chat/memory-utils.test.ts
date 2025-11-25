import { checkMemoryContext, getMemoryManagementData, deleteMemory } from '@/lib/chat/memory-utils';
import { apiClient } from '@/lib/api/client';

jest.mock('@/lib/api/client', () => ({
  apiClient: {
    getMemoryReports: jest.fn(),
    deleteMemoryReports: jest.fn(),
  },
}));

describe('memory-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkMemoryContext', () => {
    it('returns memory info when reports exist', async () => {
      (apiClient.getMemoryReports as jest.Mock).mockResolvedValueOnce({
        data: {
          memoryContext: [{ reportDate: '2023-12-01' }, { reportDate: '2023-11-15' }],
        },
      });

      const result = await checkMemoryContext();

      expect(result.hasMemory).toBe(true);
      expect(result.reportCount).toBe(2);
      expect(result.lastReportDate).toBe('2023-12-01');
    });

    it('excludes session ID when provided', async () => {
      (apiClient.getMemoryReports as jest.Mock).mockResolvedValueOnce({
        data: { memoryContext: [] },
      });

      await checkMemoryContext('session123');

      expect(apiClient.getMemoryReports).toHaveBeenCalledWith(expect.any(URLSearchParams));
      const params = (apiClient.getMemoryReports as jest.Mock).mock.calls[0][0] as URLSearchParams;
      expect(params.get('excludeSessionId')).toBe('session123');
      expect(params.get('limit')).toBe('3');
    });

    it('returns no memory when empty array', async () => {
      (apiClient.getMemoryReports as jest.Mock).mockResolvedValueOnce({
        data: { memoryContext: [] },
      });

      const result = await checkMemoryContext();

      expect(result.hasMemory).toBe(false);
      expect(result.reportCount).toBe(0);
      expect(result.lastReportDate).toBeUndefined();
    });

    it('handles legacy plain response format', async () => {
      (apiClient.getMemoryReports as jest.Mock).mockResolvedValueOnce({
        memoryContext: [{ reportDate: '2023-11-01' }],
      });

      const result = await checkMemoryContext();

      expect(result.hasMemory).toBe(true);
      expect(result.reportCount).toBe(1);
    });

    it('returns no memory on fetch error', async () => {
      const error = new Error('Server error') as any;
      error.status = 500;
      (apiClient.getMemoryReports as jest.Mock).mockRejectedValueOnce(error);

      const result = await checkMemoryContext();

      expect(result.hasMemory).toBe(false);
      expect(result.reportCount).toBe(0);
    });

    it('handles network errors gracefully', async () => {
      (apiClient.getMemoryReports as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await checkMemoryContext();

      expect(result.hasMemory).toBe(false);
      expect(result.reportCount).toBe(0);
    });

    it('sorts reports by date descending', async () => {
      (apiClient.getMemoryReports as jest.Mock).mockResolvedValueOnce({
        data: {
          memoryContext: [
            { reportDate: '2023-10-15' },
            { reportDate: '2023-12-01' },
            { reportDate: '2023-11-10' },
          ],
        },
      });

      const result = await checkMemoryContext();

      expect(result.lastReportDate).toBe('2023-12-01');
    });

    it('handles null memoryContext', async () => {
      (apiClient.getMemoryReports as jest.Mock).mockResolvedValueOnce({
        data: { memoryContext: null },
      });

      const result = await checkMemoryContext();

      expect(result.hasMemory).toBe(false);
    });
  });

  describe('getMemoryManagementData', () => {
    it('fetches memory management data with defaults', async () => {
      (apiClient.getMemoryReports as jest.Mock).mockResolvedValueOnce({
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
      });

      const result = await getMemoryManagementData();

      expect(result.success).toBe(true);
      expect(apiClient.getMemoryReports).toHaveBeenCalledWith(expect.any(URLSearchParams));
      const params = (apiClient.getMemoryReports as jest.Mock).mock.calls[0][0] as URLSearchParams;
      expect(params.get('manage')).toBe('true');
    });

    it('uses sessionId when provided', async () => {
      (apiClient.getMemoryReports as jest.Mock).mockResolvedValueOnce({
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
      });

      await getMemoryManagementData('session123');

      expect(apiClient.getMemoryReports).toHaveBeenCalledWith(expect.any(URLSearchParams));
      const params = (apiClient.getMemoryReports as jest.Mock).mock.calls[0][0] as URLSearchParams;
      expect(params.get('manage')).toBe('true');
      expect(params.get('excludeSessionId')).toBe('session123');
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

      (apiClient.getMemoryReports as jest.Mock).mockResolvedValueOnce({ data: mockData });

      const result = await getMemoryManagementData();

      expect(result.success).toBe(true);
      expect(result.memoryDetails).toHaveLength(1);
      expect(result.reportCount).toBe(1);
    });

    it('returns failure on fetch error', async () => {
      const error = new Error('Server error') as any;
      error.status = 500;
      error.body = { error: { message: 'Server error' } };
      (apiClient.getMemoryReports as jest.Mock).mockRejectedValueOnce(error);

      const result = await getMemoryManagementData();

      expect(result.success).toBe(false);
      expect(result.memoryDetails).toEqual([]);
    });

    it('handles network errors', async () => {
      (apiClient.getMemoryReports as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await getMemoryManagementData();

      expect(result.success).toBe(false);
      expect(result.reportCount).toBe(0);
    });
  });

  describe('deleteMemory', () => {
    it('deletes specific sessions', async () => {
      (apiClient.deleteMemoryReports as jest.Mock).mockResolvedValueOnce({
        success: true,
        deletedCount: 2,
        message: 'Deleted',
        deletionType: 'specific',
      });

      const result = await deleteMemory({ type: 'specific', sessionIds: ['s1', 's2'] });

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(2);
      expect(apiClient.deleteMemoryReports).toHaveBeenCalledWith(expect.any(URLSearchParams));
      const params = (apiClient.deleteMemoryReports as jest.Mock).mock
        .calls[0][0] as URLSearchParams;
      expect(params.get('sessionIds')).toBe('s1,s2');
    });

    it('deletes recent N reports', async () => {
      (apiClient.deleteMemoryReports as jest.Mock).mockResolvedValueOnce({
        success: true,
        deletedCount: 3,
        message: 'Deleted',
        deletionType: 'recent',
      });

      const result = await deleteMemory({ type: 'recent', limit: 3 });

      expect(result.success).toBe(true);
      expect(apiClient.deleteMemoryReports).toHaveBeenCalledWith(expect.any(URLSearchParams));
      const params = (apiClient.deleteMemoryReports as jest.Mock).mock
        .calls[0][0] as URLSearchParams;
      expect(params.get('limit')).toBe('3');
    });

    it('excludes current session when specified', async () => {
      (apiClient.deleteMemoryReports as jest.Mock).mockResolvedValueOnce({
        success: true,
        deletedCount: 1,
        message: 'Deleted',
        deletionType: 'all-except-current',
      });

      const result = await deleteMemory({
        type: 'all-except-current',
        sessionId: 'current123',
        limit: 5,
      });

      expect(result.success).toBe(true);
      expect(apiClient.deleteMemoryReports).toHaveBeenCalledWith(expect.any(URLSearchParams));
      const params = (apiClient.deleteMemoryReports as jest.Mock).mock
        .calls[0][0] as URLSearchParams;
      expect(params.get('excludeSessionId')).toBe('current123');
    });

    it('deletes all memory when type is all', async () => {
      (apiClient.deleteMemoryReports as jest.Mock).mockResolvedValueOnce({
        success: true,
        deletedCount: 10,
        message: 'All deleted',
        deletionType: 'all',
      });

      const result = await deleteMemory({ type: 'all' });

      expect(result.success).toBe(true);
      expect(apiClient.deleteMemoryReports).toHaveBeenCalledWith(expect.any(URLSearchParams));
    });

    it('returns failure on DELETE error', async () => {
      const error = new Error('Forbidden') as any;
      error.status = 403;
      error.body = { error: { message: 'Forbidden' } };
      (apiClient.deleteMemoryReports as jest.Mock).mockRejectedValueOnce(error);

      const result = await deleteMemory({ type: 'recent', limit: 1 });

      expect(result.success).toBe(false);
      expect(result.deletedCount).toBe(0);
    });

    it('handles network errors during deletion', async () => {
      (apiClient.deleteMemoryReports as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await deleteMemory({ type: 'specific', sessionIds: ['s1'] });

      expect(result.success).toBe(false);
      expect(result.deletedCount).toBe(0);
    });
  });
});
