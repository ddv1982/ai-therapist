import { ApiClient } from '@/lib/api/client';

describe('ApiClient', () => {
  let fetchMock: jest.Mock;
  let client: ApiClient;

  beforeEach(() => {
    fetchMock = jest.fn();
    (global as any).fetch = fetchMock;
    jest.useFakeTimers();
    client = new ApiClient('');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function makeResponse(body: any, init: Partial<Response> = {}) {
    return {
      json: jest.fn(async () => body),
      ok: (init as any).ok ?? true,
      status: (init as any).status ?? 200,
      headers: new Headers({ 'content-type': 'application/json' }),
    } as unknown as Response;
  }

  it('sets default headers and X-Request-Id', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse({ success: true }));
    await client.listSessions();
    const init = fetchMock.mock.calls[0][1];
    const headers = new Headers(init.headers);
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('X-Request-Id')).toBeTruthy();
  });

  it('parses JSON response; returns null for non-JSON', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse({ hello: 'world' }));
    const data = await client.getSessionStatus();
    expect(data).toEqual({ hello: 'world' });

    // non-json
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/plain' }),
      json: jest.fn(async () => { throw new Error('no json'); }),
      text: jest.fn(async () => 'noop'),
    } as any);
    const data2 = await client.getSessionStatus();
    expect(data2).toBeNull();
  });

  it('passes through body for POST requests', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse({ ok: true }));
    await client.createSession({ title: 'New' } as any);
    const init = fetchMock.mock.calls[0][1];
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ title: 'New' }));
  });

  it('aborts on timeout', async () => {
    fetchMock.mockImplementationOnce((_url: string, init: any) => new Promise((_, reject) => {
      const signal: AbortSignal | undefined = init?.signal;
      if (signal) {
        signal.addEventListener('abort', () => reject(new Error('Aborted')));
      }
    }));
    const promise = (client as any).request('/slow', {}, 10);
    jest.advanceTimersByTime(15);
    await expect(promise).rejects.toThrow('Aborted');
  });
});


