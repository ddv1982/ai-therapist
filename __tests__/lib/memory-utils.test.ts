/**
 * Tests for memory utilities functions
 */

import {
  checkMemoryContext,
  formatMemoryInfo,
  deleteMemory,
  refreshMemoryContext,
  getSessionReportDetail,
  type MemoryContextInfo
} from '@/lib/chat/memory-utils';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Memory Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkMemoryContext', () => {
    it('should return no memory when sessionId is not provided', async () => {
      const result = await checkMemoryContext();

      expect(result).toEqual({
        hasMemory: false,
        reportCount: 0,
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fetch and return memory context info', async () => {
      const mockResponse = {
        success: true,
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
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await checkMemoryContext('test-session-id');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/reports/memory?excludeSessionId=test-session-id&limit=3'
      );

      expect(result).toEqual({
        hasMemory: true,
        reportCount: 2,
        lastReportDate: '2024-01-02',
      });
    });

    it('should handle failed fetch gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

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

      expect(formatMemoryInfo(memoryInfo)).toBe('Using insights from 1 previous session (2024-01-01)');
    });

    it('should format multiple sessions correctly', () => {
      const memoryInfo: MemoryContextInfo = {
        hasMemory: true,
        reportCount: 3,
        lastReportDate: '2024-01-03',
      };

      expect(formatMemoryInfo(memoryInfo)).toBe('Using insights from 3 previous sessions (latest: 2024-01-03)');
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await deleteMemory({ type: 'all' });

      expect(mockFetch).toHaveBeenCalledWith('/api/reports/memory?', {
        method: 'DELETE',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should delete specific sessions', async () => {
      const mockResponse = {
        success: true,
        deletedCount: 2,
        message: 'Successfully deleted specific session reports',
        deletionType: 'specific',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await deleteMemory({
        type: 'specific',
        sessionIds: ['session-1', 'session-2'],
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/reports/memory?sessionIds=session-1%2Csession-2',
        { method: 'DELETE' }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle deletion errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await deleteMemory({ type: 'all' });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
    });
  });

  describe('refreshMemoryContext', () => {
    it('should refresh memory context after deletion', async () => {
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
        memoryDetails: [{
          id: 'report-1',
          sessionId: 'session-1',
          sessionTitle: 'Test Session',
          sessionDate: '2024-01-01',
          reportDate: '2024-01-01',
          contentPreview: 'Preview content...',
          fullContent: 'Complete therapeutic session content with detailed analysis...',
          keyInsights: ['Insight 1', 'Insight 2'],
          hasEncryptedContent: true,
          reportSize: 2048
        }],
        reportCount: 1,
        stats: { totalReportsFound: 1, successfullyProcessed: 1, failedDecryptions: 0, hasMemory: true }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDetailResponse),
      } as Response);

      const result = await getSessionReportDetail('report-1', 'current-session');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/reports/memory/manage?excludeSessionId=current-session&includeFullContent=true'
      );

      expect(result).toEqual({
        id: 'report-1',
        sessionId: 'session-1',
        sessionTitle: 'Test Session',
        sessionDate: '2024-01-01',
        reportDate: '2024-01-01',
        fullContent: 'Complete therapeutic session content with detailed analysis...',
        keyInsights: ['Insight 1', 'Insight 2'],
        reportSize: 2048
      });
    });

    it('should fetch full content without session exclusion', async () => {
      const mockDetailResponse = {
        success: true,
        memoryDetails: [{
          id: 'report-1',
          sessionId: 'session-1',
          sessionTitle: 'Test Session',
          sessionDate: '2024-01-01',
          reportDate: '2024-01-01',
          fullContent: 'Complete content...',
          keyInsights: [],
          hasEncryptedContent: true,
          reportSize: 1024
        }],
        reportCount: 1,
        stats: { totalReportsFound: 1, successfullyProcessed: 1, failedDecryptions: 0, hasMemory: true }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDetailResponse),
      } as Response);

      const result = await getSessionReportDetail('report-1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/reports/memory/manage?includeFullContent=true'
      );

      expect(result).toBeDefined();
      expect(result?.fullContent).toBe('Complete content...');
    });

    it('should return null when report not found', async () => {
      const mockDetailResponse = {
        success: true,
        memoryDetails: [],
        reportCount: 0,
        stats: { totalReportsFound: 0, successfullyProcessed: 0, failedDecryptions: 0, hasMemory: false }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDetailResponse),
      } as Response);

      const result = await getSessionReportDetail('nonexistent-report');

      expect(result).toBeNull();
    });

    it('should return null when full content is missing', async () => {
      const mockDetailResponse = {
        success: true,
        memoryDetails: [{
          id: 'report-1',
          sessionId: 'session-1',
          sessionTitle: 'Test Session',
          sessionDate: '2024-01-01',
          reportDate: '2024-01-01',
          contentPreview: 'Preview only...',
          // fullContent is missing
          keyInsights: [],
          hasEncryptedContent: false,
          reportSize: 1024
        }],
        reportCount: 1,
        stats: { totalReportsFound: 1, successfullyProcessed: 0, failedDecryptions: 1, hasMemory: true }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDetailResponse),
      } as Response);

      const result = await getSessionReportDetail('report-1');

      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getSessionReportDetail('report-1');

      expect(result).toBeNull();
    });

    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const result = await getSessionReportDetail('report-1');

      expect(result).toBeNull();
    });
  });
});