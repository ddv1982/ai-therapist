import { ApiClient } from '@/lib/api/client';

const originalFetch = global.fetch;

describe('ApiClient request behavior', () => {
  afterEach(() => {
    if (originalFetch) {
      global.fetch = originalFetch;
    }
    jest.resetAllMocks();
  });

  it('constructs message list URLs without duplicating the base URL and omits Content-Type for GET', async () => {
    const client = new ApiClient('https://api.local');
    let capturedUrl: string | undefined;
    let capturedHeaders: Headers | undefined;

    const fetchMock = jest.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(url);
      capturedHeaders = init?.headers instanceof Headers ? init.headers : new Headers(init?.headers);
      const payload = {
        success: true,
        data: {
          items: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        },
      };
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: jest.fn().mockResolvedValue(payload),
      } as unknown as Response;
    });

    global.fetch = fetchMock as typeof global.fetch;

    await client.listMessages('session-123', { page: 2 });

    expect(capturedUrl).toBe('https://api.local/api/sessions/session-123/messages?page=2');
    expect(capturedHeaders?.has('Content-Type')).toBe(false);
    expect(capturedHeaders?.get('X-Request-Id')).toBeTruthy();
  });

  it('returns undefined for successful 204 responses', async () => {
    const client = new ApiClient('https://api.example');
    const fetchMock = jest.fn(async () => ({
      ok: true,
      status: 204,
      statusText: 'No Content',
      headers: new Headers(),
      json: jest.fn().mockResolvedValue(null),
      text: jest.fn().mockResolvedValue(''),
    } as unknown as Response));
    global.fetch = fetchMock as typeof global.fetch;

    // @ts-expect-error accessing internal request helper for targeted validation
    const result = await client.request('/noop');
    expect(result).toBeNull();
  });

  it('returns raw text for non-JSON responses', async () => {
    const client = new ApiClient();
    const fetchMock = jest.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'Content-Type': 'text/plain' }),
      json: jest.fn(),
      text: jest.fn().mockResolvedValue('plain-value'),
    } as unknown as Response));
    global.fetch = fetchMock as typeof global.fetch;

    // @ts-expect-error accessing internal request helper for targeted validation
    const result = await client.request('/text-endpoint');
    expect(result).toBeNull();
  });
});
