import { NextRequest } from 'next/server';
import { MemoryManagementService } from '@/features/chat/lib/memory-management-service';

jest.mock('@/lib/convex/http-client', () => ({
  getAuthenticatedConvexClient: jest.fn(() => ({})),
}));

jest.mock('@/lib/api/api-middleware', () => {
  const actual = jest.requireActual('@/lib/api/api-middleware');
  return {
    ...actual,
    withAuth:
      (handler: any) =>
      async (req: NextRequest, routeParams?: { params?: Promise<Record<string, string>> }) =>
        handler(
          req,
          {
            requestId: 'rid-memory-1',
            principal: { clerkId: 'clerk_test_user' },
            jwtToken: 'jwt_token',
          },
          routeParams?.params ?? Promise.resolve({})
        ),
  };
});

function createReq(method: 'GET' | 'DELETE', url: string): NextRequest {
  return {
    method,
    url,
    nextUrl: new URL(url),
    headers: new Headers({ 'user-agent': 'jest' }),
  } as any as NextRequest;
}

describe('/api/reports/memory contract', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('GET returns standard memory-context envelope', async () => {
    const getMemoryContextSpy = jest
      .spyOn(MemoryManagementService.prototype, 'getMemoryContext')
      .mockResolvedValueOnce({
        memoryContext: [
          {
            sessionTitle: 'Session 1',
            sessionDate: '2025-01-01',
            reportDate: '2025-01-02',
            content: 'content',
            summary: 'summary',
          },
        ],
        reportCount: 1,
        stats: {
          totalReportsFound: 1,
          successfullyDecrypted: 1,
          failedDecryptions: 0,
        },
      });

    const mod = await import('@/app/api/reports/memory/route');
    const res = await mod.GET(
      createReq('GET', 'http://localhost:4000/api/reports/memory') as any,
      {
        params: Promise.resolve({}),
      } as any
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.memoryContext).toHaveLength(1);
    expect(body.data.reportCount).toBe(1);
    expect(body.meta.requestId).toBe('rid-memory-1');
    expect(getMemoryContextSpy).toHaveBeenCalledWith('clerk_test_user', 5, null);
  });

  it('GET manage=true returns management envelope', async () => {
    const getMemoryManagementSpy = jest
      .spyOn(MemoryManagementService.prototype, 'getMemoryManagement')
      .mockResolvedValueOnce({
        memoryDetails: [
          {
            id: 'report1',
            sessionId: 'session1',
            sessionTitle: 'Session 1',
            sessionDate: '2025-01-01',
            reportDate: '2025-01-02',
            contentPreview: 'preview',
            keyInsights: [],
            hasEncryptedContent: true,
            reportSize: 42,
          },
        ],
        reportCount: 1,
        stats: {
          totalReportsFound: 1,
          successfullyProcessed: 1,
          failedDecryptions: 0,
          hasMemory: true,
        },
      });

    const mod = await import('@/app/api/reports/memory/route');
    const res = await mod.GET(
      createReq('GET', 'http://localhost:4000/api/reports/memory?manage=true&limit=3') as any,
      {
        params: Promise.resolve({}),
      } as any
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.memoryDetails).toHaveLength(1);
    expect(body.data.stats.hasMemory).toBe(true);
    expect(getMemoryManagementSpy).toHaveBeenCalledWith('clerk_test_user', 3, null, false);
  });

  it('GET returns standardized 400 envelope when limit is invalid', async () => {
    const getMemoryContextSpy = jest.spyOn(MemoryManagementService.prototype, 'getMemoryContext');
    const getMemoryManagementSpy = jest.spyOn(
      MemoryManagementService.prototype,
      'getMemoryManagement'
    );

    const mod = await import('@/app/api/reports/memory/route');
    const res = await mod.GET(
      createReq('GET', 'http://localhost:4000/api/reports/memory?limit=abc') as any,
      {
        params: Promise.resolve({}),
      } as any
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_INPUT');
    expect(body.error.message).toBe('Invalid limit query parameter');
    expect(body.meta.requestId).toBe('rid-memory-1');
    expect(getMemoryContextSpy).not.toHaveBeenCalled();
    expect(getMemoryManagementSpy).not.toHaveBeenCalled();
  });

  it('DELETE returns typed deletion payload envelope', async () => {
    const deleteMemorySpy = jest
      .spyOn(MemoryManagementService.prototype, 'deleteMemory')
      .mockResolvedValueOnce({
        deletedCount: 2,
        message: 'Deleted 2 reports',
        deletionType: 'recent',
      });

    const mod = await import('@/app/api/reports/memory/route');
    const res = await mod.DELETE(
      createReq('DELETE', 'http://localhost:4000/api/reports/memory?limit=2') as any,
      {
        params: Promise.resolve({}),
      } as any
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.deletedCount).toBe(2);
    expect(body.data.deletionType).toBe('recent');
    expect(deleteMemorySpy).toHaveBeenCalledWith('clerk_test_user', undefined, 2, null);
  });

  it('DELETE returns standardized 400 envelope when limit is invalid', async () => {
    const deleteMemorySpy = jest.spyOn(MemoryManagementService.prototype, 'deleteMemory');

    const mod = await import('@/app/api/reports/memory/route');
    const res = await mod.DELETE(
      createReq('DELETE', 'http://localhost:4000/api/reports/memory?limit=0') as any,
      {
        params: Promise.resolve({}),
      } as any
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_INPUT');
    expect(body.meta.requestId).toBe('rid-memory-1');
    expect(deleteMemorySpy).not.toHaveBeenCalled();
  });
});
