import { NextRequest } from 'next/server';

const mockVerifySessionOwnership = jest.fn();
const mockDeduplicateRequest = jest.fn();
const mockGenerateReport = jest.fn();
const mockApiError = jest.fn();

jest.mock('@/lib/repositories/session-repository', () => ({
  verifySessionOwnership: (...args: unknown[]) => mockVerifySessionOwnership(...args),
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    validationError: jest.fn(),
    apiError: (...args: unknown[]) => mockApiError(...args),
  },
}));

jest.mock('@/i18n/request', () => ({
  getApiRequestLocale: () => 'en',
}));

jest.mock('@/features/therapy/lib/report-generation-service', () => ({
  ReportGenerationService: jest.fn().mockImplementation(() => ({
    generateReport: (...args: unknown[]) => mockGenerateReport(...args),
  })),
}));

jest.mock('@/lib/utils/helpers', () => {
  const actual = jest.requireActual('@/lib/utils/helpers');
  return {
    ...actual,
    deduplicateRequest: (...args: unknown[]) => mockDeduplicateRequest(...args),
  };
});

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
            requestId: 'rid-report-context-1',
            principal: { clerkId: 'clerk_test_user' },
            jwtToken: 'jwt_token',
          },
          routeParams?.params ?? Promise.resolve({})
        ),
  };
});

function createPostReq(url: string, body: unknown): NextRequest {
  return {
    method: 'POST',
    url,
    nextUrl: new URL(url),
    headers: new Headers({ 'content-type': 'application/json', 'user-agent': 'jest' }),
    json: async () => body,
  } as any as NextRequest;
}

describe('POST /api/reports/generate-context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { ReportGenerationService } = jest.requireMock(
      '@/features/therapy/lib/report-generation-service'
    ) as {
      ReportGenerationService: jest.Mock;
    };
    ReportGenerationService.mockImplementation(() => ({
      generateReport: (...args: unknown[]) => mockGenerateReport(...args),
    }));
    const { getAuthenticatedConvexClient } = jest.requireMock('@/lib/convex/http-client') as {
      getAuthenticatedConvexClient: jest.Mock;
    };
    getAuthenticatedConvexClient.mockReturnValue({});
    mockDeduplicateRequest.mockImplementation(
      async (
        _userId: string,
        _operation: string,
        operation: () => Promise<unknown>,
        _resource?: string,
        _ttlMs?: number
      ) => operation()
    );
    mockGenerateReport.mockResolvedValue({
      reportContent: 'analysis',
      modelUsed: 'openai/gpt-oss-120b',
      modelDisplayName: 'GPT OSS 120B',
      cbtDataSource: 'parsed',
      cbtDataAvailable: true,
    });
  });

  it('accepts contextual messages and returns success envelope', async () => {
    mockVerifySessionOwnership.mockResolvedValueOnce({ valid: true });

    const mod = await import('@/app/api/reports/generate-context/route');
    const res = await mod.POST(
      createPostReq('http://localhost:4000/api/reports/generate-context', {
        sessionId: 'sess-1',
        contextualMessages: [
          { role: 'user', content: 'summary card' },
          { role: 'assistant', content: 'cbt insight' },
        ],
      }) as any,
      { params: Promise.resolve({}) } as any
    );
    if (res.status === 500) {
      const lastCall = mockApiError.mock.calls[mockApiError.mock.calls.length - 1];
      const maybeError = lastCall?.[1];
      throw maybeError instanceof Error ? maybeError : new Error(String(maybeError));
    }

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockGenerateReport).toHaveBeenCalledWith(
      'sess-1',
      [
        { role: 'user', content: 'summary card' },
        { role: 'assistant', content: 'cbt insight' },
      ],
      expect.any(String)
    );
  });

  it('honors valid model overrides', async () => {
    mockVerifySessionOwnership.mockResolvedValueOnce({ valid: true });

    const mod = await import('@/app/api/reports/generate-context/route');
    const res = await mod.POST(
      createPostReq('http://localhost:4000/api/reports/generate-context', {
        sessionId: 'sess-1',
        contextualMessages: [{ role: 'user', content: 'summary card' }],
        model: 'openai/gpt-oss-20b',
      }) as any,
      { params: Promise.resolve({}) } as any
    );
    if (res.status === 500) {
      const lastCall = mockApiError.mock.calls[mockApiError.mock.calls.length - 1];
      const maybeError = lastCall?.[1];
      throw maybeError instanceof Error ? maybeError : new Error(String(maybeError));
    }

    expect(res.status).toBe(200);
    const { ReportGenerationService } = jest.requireMock(
      '@/features/therapy/lib/report-generation-service'
    ) as {
      ReportGenerationService: jest.Mock;
    };
    expect(ReportGenerationService).toHaveBeenCalledWith(
      expect.anything(),
      'openai/gpt-oss-20b',
      expect.anything()
    );
  });

  it('rejects invalid model overrides with 400 envelope', async () => {
    const mod = await import('@/app/api/reports/generate-context/route');
    const res = await mod.POST(
      createPostReq('http://localhost:4000/api/reports/generate-context', {
        sessionId: 'sess-1',
        contextualMessages: [{ role: 'user', content: 'summary card' }],
        model: 'not-a-real-model',
      }) as any,
      { params: Promise.resolve({}) } as any
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_MODEL');
    expect(mockVerifySessionOwnership).not.toHaveBeenCalled();
    expect(mockDeduplicateRequest).not.toHaveBeenCalled();
  });
});
