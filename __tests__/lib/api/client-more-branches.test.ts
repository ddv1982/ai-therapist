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

  function makeResponse(status: number, body: any, contentType?: string): Response {
    const headers = new Headers();
    if (contentType) headers.set('content-type', contentType);
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers });
  }

  it('returns null for non-JSON error responses', async () => {
    global.fetch = jest.fn(async () => makeResponse(500, 'server error', 'text/plain')) as any;
    const res = await client.listSessions().catch((e) => e);
    expect(res).toBeNull();
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
    global.fetch = jest.fn(async () => new Response(null, { status: 204, headers: new Headers({ 'content-type': 'application/json' }) })) as any;
    const res = await client.listSessions();
    expect(res).toBeNull();
  });
});


