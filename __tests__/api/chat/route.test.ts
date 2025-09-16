import { NextRequest } from 'next/server';

const browserSearchFactoryMock = jest.fn((options?: unknown) => {
  return { tool: 'browser-search', options };
});

jest.mock('@ai-sdk/groq', () => ({
  groq: {
    tools: {
      browserSearch: (options?: unknown) => browserSearchFactoryMock(options),
    },
  },
}));

const createErrorResponseMock = jest.fn(
  (_message: string, status: number = 400, _options?: unknown) =>
    new Response(null, { status }),
);

jest.mock('@/lib/api/api-response', () => ({
  createErrorResponse: (
    message: string,
    status?: number,
    options?: unknown,
  ) => createErrorResponseMock(message, status, options),
}));

jest.mock('@/ai/providers', () => ({
  languageModels: {
    'openai/gpt-oss-20b': 'mock-model-20b',
    'openai/gpt-oss-120b': 'mock-model-120b',
  },
}));

const streamTextMock = jest.fn();
const toUIMessageStreamResponseMock = jest.fn();

jest.mock('ai', () => ({
  streamText: (...args: unknown[]) => streamTextMock(...args),
}));

jest.mock('@/lib/therapy/therapy-prompts', () => ({
  THERAPY_SYSTEM_PROMPT: 'Mock therapeutic system prompt',
}));

const verifySessionOwnershipMock = jest.fn();

jest.mock('@/lib/database/queries', () => ({
  verifySessionOwnership: (...args: unknown[]) => verifySessionOwnershipMock(...args),
}));

jest.mock('@/lib/chat/message-encryption', () => ({
  encryptMessage: jest.fn(({ role, content, timestamp }) => ({ role, content, timestamp })),
  safeDecryptMessages: jest.fn((messages: Array<{ role: string; content: string; timestamp: Date }>) => messages),
}));

const loggerInfoMock = jest.fn();
const loggerErrorMock = jest.fn();
const loggerApiErrorMock = jest.fn();

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: (...args: unknown[]) => loggerInfoMock(...args),
    error: (...args: unknown[]) => loggerErrorMock(...args),
    warn: jest.fn(),
    apiError: (...args: unknown[]) => loggerApiErrorMock(...args),
  },
}));

jest.mock('@/lib/database/db', () => ({
  prisma: {
    message: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue(undefined),
    },
  },
}));

jest.mock('@/lib/api/api-middleware', () => ({
  withAuthAndRateLimitStreaming:
    (
      handler: (
        req: NextRequest,
        ctx: {
          requestId: string;
          method?: string;
          url?: string;
          userAgent?: string;
          userInfo: { userId: string };
        },
        params?: Promise<Record<string, string>>
      ) => Promise<Response>,
    ) =>
    async (
      req: NextRequest,
      routeParams?: { params: Promise<Record<string, string>> },
    ) =>
      handler(
        req,
        {
          requestId: 'test-request',
          method: req.method || 'POST',
          url: (req as unknown as { nextUrl?: URL }).nextUrl?.toString() || 'http://localhost/api/chat',
          userAgent: req.headers?.get?.('user-agent') || 'jest',
          userInfo: { userId: 'user-1' },
        },
        routeParams?.params,
      ),
}));

jest.mock('@/i18n/request', () => ({
  getApiRequestLocale: () => 'en',
}));

const { POST } = require('@/app/api/chat/route') as {
  POST: typeof import('@/app/api/chat/route').POST;
};

function createRequest(body: unknown): NextRequest {
  return {
    json: jest.fn().mockResolvedValue(body),
    method: 'POST',
    nextUrl: new URL('http://localhost/api/chat'),
    headers: new Headers({ 'content-type': 'application/json', 'user-agent': 'jest' }),
  } as unknown as NextRequest;
}

describe('/api/chat route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    browserSearchFactoryMock.mockImplementation(
      (options?: unknown) => ({ tool: 'browser-search', options }),
    );
    createErrorResponseMock.mockImplementation((_message: string, status: number = 400) => new Response(null, { status }));
    verifySessionOwnershipMock.mockResolvedValue({ valid: false });
    toUIMessageStreamResponseMock.mockReturnValue({
      status: 200,
      headers: new Headers({ 'content-type': 'text/event-stream' }),
    } as Response);
    streamTextMock.mockReturnValue({
      toUIMessageStreamResponse: toUIMessageStreamResponseMock,
    });
  });

  it('streams responses for valid requests', async () => {
    const request = createRequest({
      messages: [
        { id: '1', role: 'user', content: 'Hello' },
        { id: '2', role: 'assistant', content: 'Hi!' },
      ],
      selectedModel: 'openai/gpt-oss-20b',
    });

    const response = await POST(request, { params: Promise.resolve({}) });

    expect(streamTextMock).toHaveBeenCalledTimes(1);
    expect(streamTextMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'mock-model-20b',
        system: 'Mock therapeutic system prompt',
        messages: [
          { id: '1', role: 'user', content: 'Hello' },
          { id: '2', role: 'assistant', content: 'Hi!' },
        ],
      }),
    );
    expect(toUIMessageStreamResponseMock).toHaveBeenCalledWith({ onError: expect.any(Function) });
    expect((response as Response).status).toBe(200);
  });

  it('enables web search tooling when requested', async () => {
    const request = createRequest({
      messages: [{ id: '1', role: 'user', content: 'Need research help' }],
      webSearchEnabled: true,
    });

    await POST(request, { params: Promise.resolve({}) });

    expect(browserSearchFactoryMock).toHaveBeenCalledWith({});
    expect(streamTextMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'mock-model-120b',
        tools: { browser_search: expect.any(Object) },
        toolChoice: 'required',
      }),
    );
  });

  it('rejects invalid payloads', async () => {
    const request = createRequest({ messages: [] });

    const response = await POST(request, { params: Promise.resolve({}) });

    expect(streamTextMock).not.toHaveBeenCalled();
    expect(response).toBeDefined();
    expect(response?.status).toBe(400);
  });

  it('rejects oversized payloads', async () => {
    process.env.CHAT_INPUT_MAX_BYTES = '10';
    const request = createRequest({ messages: [{ id: '1', role: 'user', content: 'This is too long' }] });

    const response = await POST(request, { params: Promise.resolve({}) });

    expect(streamTextMock).not.toHaveBeenCalled();
    expect(response).toBeDefined();
    expect(response?.status).toBe(413);
    delete process.env.CHAT_INPUT_MAX_BYTES;
  });

  it('handles stream errors gracefully', async () => {
    streamTextMock.mockReturnValueOnce({
      toUIMessageStreamResponse: jest.fn().mockImplementation(({ onError: handler }) => {
        expect(typeof handler).toBe('function');
        expect(handler && handler(new Error('stream failure'))).toBe('An error occurred.');
        return { status: 500, headers: new Headers() } as Response;
      }),
    });

    const request = createRequest({ messages: [{ id: '1', role: 'user', content: 'hello' }] });

    const response = await POST(request, { params: Promise.resolve({}) });

    expect(response).toBeDefined();
    expect(response?.status).toBe(500);
    expect(loggerApiErrorMock).not.toHaveBeenCalled();
  });
});
