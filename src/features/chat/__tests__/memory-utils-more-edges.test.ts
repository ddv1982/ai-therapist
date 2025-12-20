import { checkMemoryContext, deleteMemory, getSessionReportDetail } from '@/features/chat/lib/memory-utils';
import { apiClient } from '@/lib/api/client';

// Mock apiClient
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    getMemoryReports: jest.fn(),
    deleteMemoryReports: jest.fn(),
  },
}));

describe('memory-utils more edges', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('checkMemoryContext supports wrapped ApiResponse shape', async () => {
    (apiClient.getMemoryReports as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: { memoryContext: [{ reportDate: '2024-02-02' }, { reportDate: '2024-02-01' }] },
    });
    const res = await checkMemoryContext();
    expect(res).toEqual({ hasMemory: true, reportCount: 2, lastReportDate: '2024-02-02' });
  });

  it('deleteMemory returns normalized failure with non-JSON body', async () => {
    (apiClient.deleteMemoryReports as jest.Mock).mockRejectedValueOnce({
      status: 500,
      body: { error: 'bad json' },
    });
    const res = await deleteMemory({ type: 'all' });
    expect(res.success).toBe(false);
    expect(res.deletedCount).toBe(0);
    expect(res.deletionType).toBe('all');
  });

  it('getSessionReportDetail logs ok but returns null when memoryDetails missing', async () => {
    (apiClient.getMemoryReports as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: { reportCount: 1 },
    });
    const res = await getSessionReportDetail('r1');
    expect(res).toBeNull();
  });

  it('checkMemoryContext returns empty when HTTP not ok', async () => {
    (apiClient.getMemoryReports as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    const res = await checkMemoryContext('s1');
    expect(res).toEqual({ hasMemory: false, reportCount: 0 });
  });
});
