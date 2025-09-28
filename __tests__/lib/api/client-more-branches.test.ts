import { ApiClient } from '@/lib/api/client';

describe('ApiClient more branches', () => {
  const client = new ApiClient('');
  const originalFetch = global.fetch;
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    global.fetch = originalFetch as any;
    jest.useRealTimers();
  });

  function makeResponse(status: number, body: any, contentType?: string) {
    const headers = {
      get: (key: string) => {
        if (!contentType) return null;
        return key.toLowerCase() === 'content-type' ? contentType : null;
      }
    };
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
      headers,
      async text() {
        if (typeof body === 'string') return body;
        if (body === null || body === undefined) return '';
        return JSON.stringify(body);
      },
      async json() {
        if (body === null || body === undefined || body === '') {
          return null;
        }
        if (typeof body === 'string') {
          return JSON.parse(body);
        }
        return body;
      },
    } as unknown as Response;
  }

  it('throws for non-JSON error responses', async () => {
    global.fetch = jest.fn(async () => makeResponse(500, 'server error', 'text/plain')) as any;
    await expect(client.listSessions()).rejects.toThrow('server error');
  });

  it('throws error with status for JSON error responses', async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      headers: { get: (k: string) => (k.toLowerCase() === 'content-type' ? 'application/json' : null) },
      json: async () => ({ error: { message: 'bad' } }),
    })) as any;
    await expect(client.listSessions()).rejects.toMatchObject({ message: 'bad', status: 400 });
  });

  it('parses empty JSON OK as null', async () => {
    global.fetch = jest.fn(async () => makeResponse(204, null, 'application/json')) as any;
    const res = await client.listSessions();
    expect(res).toBeNull();
  });
});


