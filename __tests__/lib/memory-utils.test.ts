import {
  checkMemoryContext,
  formatMemoryInfo,
  deleteMemory,
  refreshMemoryContext,
  getSessionReportDetail,
  type MemoryContextInfo,
} from '@/features/chat/lib/memory-utils';
import { apiClient } from '@/lib/api/client';
import { deleteMemoryAction } from '@/features/chat/actions/memory-actions';

// Mock apiClient
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    getMemoryReports: jest.fn(),
    deleteMemoryReports: jest.fn(),
  },
}));

// Mock Server Actions
jest.mock('@/features/chat/actions/memory-actions', () => ({
  deleteMemoryAction: jest.fn(),
}));

describe('Memory Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkMemoryContext', () => {
    it('should fetch global memory when sessionId is not provided', async () => {
      const mockResponse = {
        success: true,
        data: {
          memoryContext: [{ sessionTitle: 'Session A', reportDate: '2024-01-01' }],
        },
      };

      (apiClient.getMemoryReports as jest.Mock).mockResolvedValue(mockResponse);

      const result = await checkMemoryContext();

      expect(apiClient.getMemoryReports).toHaveBeenCalledWith(
        expect.objectContaining({
          toString: expect.any(Function),
        })
      );
      // Verify query params manually if needed, or rely on implementation detail
      const callArg = (apiClient.getMemoryReports as jest.Mock).mock.calls[0][0];
      expect(callArg.toString()).toContain('limit=3');

      expect(result).toEqual({
        hasMemory: true,
        reportCount: 1,
        lastReportDate: '2024-01-01',
      });
    });

    it('should fetch and return memory context info', async () => {
      const mockResponse = {
        success: true,
        data: {
          memoryContext: [
            {
              sessionTitle: 'Session 1',
              reportDate: '2024-01-01',
            },
            {
              sessionTitle: 'Session 2',
              reportDate: '2024-01-02',
            },
          ],
        },
      };

      (apiClient.getMemoryReports as jest.Mock).mockResolvedValue(mockResponse);

      const result = await checkMemoryContext('test-session-id');

      const callArg = (apiClient.getMemoryReports as jest.Mock).mock.calls[0][0];
      expect(callArg.toString()).toContain('excludeSessionId=test-session-id');
      expect(callArg.toString()).toContain('limit=3');

      expect(result).toEqual({
        hasMemory: true,
        reportCount: 2,
        lastReportDate: '2024-01-02',
      });
    });

    it('should handle failed fetch gracefully', async () => {
      (apiClient.getMemoryReports as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await checkMemoryContext('test-session-id');

      expect(result).toEqual({
        hasMemory: false,
        reportCount: 0,
      });
    });
  });

  describe('formatMemoryInfo', () => {
    it('should return empty string when no memory', () => {
      const memoryInfo: MemoryContextInfo = {
        hasMemory: false,
        reportCount: 0,
      };

      expect(formatMemoryInfo(memoryInfo)).toBe('');
    });

    it('should format single session correctly', () => {
      const memoryInfo: MemoryContextInfo = {
        hasMemory: true,
        reportCount: 1,
        lastReportDate: '2024-01-01',
      };

      expect(formatMemoryInfo(memoryInfo)).toBe(
        'Using insights from 1 previous session (2024-01-01)'
      );
    });

    it('should format multiple sessions correctly', () => {
      const memoryInfo: MemoryContextInfo = {
        hasMemory: true,
        reportCount: 3,
        lastReportDate: '2024-01-03',
      };

      expect(formatMemoryInfo(memoryInfo)).toBe(
        'Using insights from 3 previous sessions (latest: 2024-01-03)'
      );
    });
  });

  describe('deleteMemory', () => {
    it('should delete all memory', async () => {
      const mockResponse = {
        success: true,
        deletedCount: 5,
        message: 'Successfully deleted 5 session reports',
        deletionType: 'all',
      };

      (deleteMemoryAction as jest.Mock).mockResolvedValue({ success: true, data: mockResponse });

      const result = await deleteMemory({ type: 'all' });

      expect(deleteMemoryAction).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should delete specific sessions', async () => {
      const mockResponse = {
        success: true,
        deletedCount: 2,
        message: 'Successfully deleted specific session reports',
        deletionType: 'specific',
      };

      (deleteMemoryAction as jest.Mock).mockResolvedValue({ success: true, data: mockResponse });

      const result = await deleteMemory({
        type: 'specific',
        sessionIds: ['session-1', 'session-2'],
      });

      expect(deleteMemoryAction).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionIds: ['session-1', 'session-2'],
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle deletion errors', async () => {
      (deleteMemoryAction as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await deleteMemory({ type: 'all' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('Network error');
    });
  });

  describe('refreshMemoryContext', () => {
    it('should refresh memory context after deletion', async () => {
      (apiClient.getMemoryReports as jest.Mock).mockResolvedValue({ success: true, data: {} });
      const result = await refreshMemoryContext('test-session');

      expect(result).toEqual({
        hasMemory: false,
        reportCount: 0,
      });
    });
  });

  describe('getSessionReportDetail', () => {
    it('should fetch full content for specific report', async () => {
      const mockDetailResponse = {
        success: true,
        data: {
          memoryDetails: [
            {
              id: 'report-1',
              sessionId: 'session-1',
              sessionTitle: 'Test Session',
              sessionDate: '2024-01-01',
              reportDate: '2024-01-01',
              contentPreview: 'Preview content...',
              fullContent: 'Complete therapeutic session content with detailed analysis...',
              keyInsights: ['Insight 1', 'Insight 2'],
              hasEncryptedContent: true,
              reportSize: 2048,
            },
          ],
          reportCount: 1,
        },
      };

      (apiClient.getMemoryReports as jest.Mock).mockResolvedValue(mockDetailResponse);

      const result = await getSessionReportDetail('report-1', 'current-session');

      const callArg = (apiClient.getMemoryReports as jest.Mock).mock.calls[0][0];
      expect(callArg.toString()).toContain('manage=true');
      expect(callArg.toString()).toContain('includeFullContent=true');
      expect(callArg.toString()).toContain('excludeSessionId=current-session');

      expect(result).toEqual({
        id: 'report-1',
        sessionId: 'session-1',
        sessionTitle: 'Test Session',
        sessionDate: '2024-01-01',
        reportDate: '2024-01-01',
        fullContent: 'Complete therapeutic session content with detailed analysis...',
        keyInsights: ['Insight 1', 'Insight 2'],
        reportSize: 2048,
        structuredCBTData: undefined,
      });
    });

    it('should fetch full content without session exclusion', async () => {
      const mockDetailResponse = {
        success: true,
        data: {
          memoryDetails: [
            {
              id: 'report-1',
              sessionId: 'session-1',
              sessionTitle: 'Test Session',
              sessionDate: '2024-01-01',
              reportDate: '2024-01-01',
              fullContent: 'Complete content...',
              keyInsights: [],
              hasEncryptedContent: true,
              reportSize: 1024,
            },
          ],
          reportCount: 1,
        },
      };

      (apiClient.getMemoryReports as jest.Mock).mockResolvedValue(mockDetailResponse);

      const result = await getSessionReportDetail('report-1');

      const callArg = (apiClient.getMemoryReports as jest.Mock).mock.calls[0][0];
      expect(callArg.toString()).not.toContain('excludeSessionId');

      expect(result).toBeDefined();
      expect(result?.fullContent).toBe('Complete content...');
    });

    it('should return null when report not found', async () => {
      const mockDetailResponse = {
        success: true,
        data: {
          memoryDetails: [],
          reportCount: 0,
        },
      };

      (apiClient.getMemoryReports as jest.Mock).mockResolvedValue(mockDetailResponse);

      const result = await getSessionReportDetail('nonexistent-report');

      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      (apiClient.getMemoryReports as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await getSessionReportDetail('report-1');

      expect(result).toBeNull();
    });
  });
});
