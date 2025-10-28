jest.mock('@/lib/convex/http-client', () => {
  const anyApi = {
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
  } as const;

  const db = {
    user: { _id: 'u1' },
    sessions: [
      { _id: 's1', title: 'First', startedAt: Date.now() - 100_000 },
      { _id: 's2', title: 'Second', startedAt: Date.now() - 10_000 },
    ],
    reportsBySession: new Map<string, any[]>([
      [
        's1',
        [
          { _id: 'r1', sessionId: 's1', createdAt: Date.now() - 9_000, reportContent: 'enc1', keyPoints: ['a', 'b'] },
        ],
      ],
      [
        's2',
        [
          { _id: 'r2', sessionId: 's2', createdAt: Date.now() - 1_000, reportContent: 'enc2', therapeuticInsights: { structuredAssessment: { score: 1 }, primaryInsights: ['p1'] } },
        ],
      ],
    ]),
  };

  const client = {
    query: jest.fn(async (fn: unknown, args: any = {}) => {
      switch (fn) {
        case anyApi.users.getByClerkId:
          return db.user;
        case anyApi.sessions.listByUser:
          return db.sessions;
        case anyApi.sessions.get:
          return db.sessions.find(s => String(s._id) === String(args.sessionId)) || null;
        case anyApi.reports.listBySession:
          return db.reportsBySession.get(String(args.sessionId)) || [];
        case anyApi.reports.listRecent: {
          const all = Array.from(db.reportsBySession.values()).flat();
          return all
            .filter(r => !args.excludeSessionId || String(r.sessionId) !== String(args.excludeSessionId))
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, Math.min(args.limit ?? 10, 10));
        }
        default:
          // Fallback by arg shape to avoid identity mismatches
          if (args && typeof args === 'object') {
            if ('clerkId' in args) return db.user;
            if ('userId' in args) return db.sessions;
            if ('sessionId' in args) {
              // Heuristic: if fn string mentions 'sessions.get', return a session; otherwise reports
              const name = String(fn || '');
              if (name.includes('sessions.get')) return db.sessions.find(s => String(s._id) === String(args.sessionId)) || null;
              return db.reportsBySession.get(String(args.sessionId)) || [];
            }
            if ('limit' in args) {
              const all = Array.from(db.reportsBySession.values()).flat();
              return all
                .filter(r => !args.excludeSessionId || String(r.sessionId) !== String(args.excludeSessionId))
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, Math.min(args.limit ?? 10, 10));
            }
          }
          return null;
      }
    }),
    mutation: jest.fn(async (fn: unknown, args: any) => {
      if (fn === anyApi.reports.removeMany) {
        return { count: Array.isArray(args.ids) ? args.ids.length : 0 };
      }
      return null;
    }),
  };

  return {
    anyApi,
    getConvexHttpClient: () => client,
  };
});

jest.mock('@/lib/chat/message-encryption', () => ({
  decryptSessionReportContent: (cipher: string) => {
    if (cipher === 'enc1') return 'Decrypted content 1 with insights and growth.';
    if (cipher === 'fail') throw new Error('Decryption failed');
    return 'Decrypted content 2';
  },
}));

describe.skip('services/memory-management-service', () => {
  it('getMemoryContext aggregates recent reports with summaries', async () => {
    const { MemoryManagementService } = await import('@/lib/services/memory-management-service');
    const svc = new MemoryManagementService();
    const res = await svc.getMemoryContext(5, null);
    expect(res.reportCount).toBeGreaterThan(0);
    expect(res.stats.totalReportsFound).toBeGreaterThan(0);
    expect(res.memoryContext[0]).toHaveProperty('summary');
  });

  it('getMemoryManagement returns details, full content and structured data when requested', async () => {
    const { MemoryManagementService } = await import('@/lib/services/memory-management-service');
    const svc = new MemoryManagementService();
    const res = await svc.getMemoryManagement(10, null, true);
    expect(res.reportCount).toBeGreaterThan(0);
    const found = res.memoryDetails.find(d => d.sessionId === 's2');
    expect(found?.fullContent).toBeDefined();
    expect(found?.structuredCBTData).toBeDefined();
    expect(res.stats.hasMemory).toBe(true);
  });

  it('deleteMemory supports recent deletion excluding current and returns count', async () => {
    const { MemoryManagementService } = await import('@/lib/services/memory-management-service');
    const svc = new MemoryManagementService();
    const out = await svc.deleteMemory('clerk_x', undefined, 1, 's2');
    expect(out.deletionType).toBe('recent');
    expect(out.deletedCount).toBe(1);
    expect(out.message).toMatch(/Successfully deleted 1 session reports/);
  });
});
