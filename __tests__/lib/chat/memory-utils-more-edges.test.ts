import { checkMemoryContext, deleteMemory, getSessionReportDetail } from '@/lib/chat/memory-utils';

describe('memory-utils more edges', () => {
  const originalFetch = global.fetch;
  beforeEach(() => {
    global.fetch = jest.fn();
  });
  afterEach(() => {
    global.fetch = originalFetch as any;
  });

  it('checkMemoryContext supports wrapped ApiResponse shape', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { memoryContext: [{ reportDate: '2024-02-02' }, { reportDate: '2024-02-01' }] } }),
    } as Response);
    const res = await checkMemoryContext();
    expect(res).toEqual({ hasMemory: true, reportCount: 2, lastReportDate: '2024-02-02' });
  });

  it('deleteMemory returns normalized failure with non-JSON body', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => { throw new Error('bad json'); },
    } as any);
    const res = await deleteMemory({ type: 'all' });
    expect(res.success).toBe(false);
    expect(res.deletedCount).toBe(0);
    expect(res.deletionType).toBe('all');
  });

  it('getSessionReportDetail logs ok but returns null when memoryDetails missing', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { reportCount: 1 } }),
    } as Response);
    const res = await getSessionReportDetail('r1');
    expect(res).toBeNull();
  });

  it('checkMemoryContext returns empty when HTTP not ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false } as any);
    const res = await checkMemoryContext('s1');
    expect(res).toEqual({ hasMemory: false, reportCount: 0 });
  });
});


