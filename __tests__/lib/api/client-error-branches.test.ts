import { ApiClient } from '@/lib/api/client';

describe('ApiClient error branches', () => {
  const originalFetch = global.fetch;
  const client = new ApiClient('');

  afterEach(() => {
    global.fetch = originalFetch as any;
  });

  it('throws on non-JSON error responses and surfaces text fallback', async () => {
    global.fetch = jest.fn(async () => {
      return {
        ok: false,
        status: 500,
        statusText: 'Server Error',
        headers: { get: (k: string) => (k.toLowerCase() === 'content-type' ? 'text/plain' : null) },
        json: async () => {
          throw new Error('not json');
        },
        text: async () => 'plain-error',
      } as unknown as Response;
    });
    await expect(
      (client as unknown as { request: (p: string) => Promise<unknown> }).request('/x')
    ).rejects.toThrow('plain-error');
  });

  it('throws Error with parsed details on JSON error responses', async () => {
    global.fetch = jest.fn(async () => {
      return {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: {
          get: (k: string) => (k.toLowerCase() === 'content-type' ? 'application/json' : null),
        },
        json: async () => ({ error: { message: 'Authentication required', details: 'No token' } }),
      } as unknown as Response;
    });
    await expect(
      (client as unknown as { request: (p: string) => Promise<unknown> }).request('/y')
    ).rejects.toThrow('No token');
  });

  it('returns parsed JSON on success and preserves provided headers', async () => {
    global.fetch = jest.fn(async (_input, init) => {
      const headers = init?.headers as Headers;
      expect(headers.get('Content-Type')).toBe('application/custom');
      expect(headers.get('X-Request-Id')).toBe('provided-id');
      return {
        ok: true,
        status: 200,
        headers: {
          get: (k: string) => (k.toLowerCase() === 'content-type' ? 'application/json' : null),
        },
        json: async () => ({ success: true }),
      } as unknown as Response;
    });

    const result = await (
      client as unknown as { request: (p: string, init?: RequestInit) => Promise<unknown> }
    ).request('/z', {
      headers: new Headers({ 'Content-Type': 'application/custom', 'X-Request-Id': 'provided-id' }),
    });

    expect(result).toEqual({ success: true });
  });

  it('returns null payload for successful non-JSON response', async () => {
    global.fetch = jest.fn(async (_input, init) => {
      const headers = init?.headers as Headers;
      expect(headers.get('Content-Type')).toBeNull();
      expect(headers.get('X-Request-Id')).toBeTruthy();
      return {
        ok: true,
        status: 200,
        headers: { get: (k: string) => (k.toLowerCase() === 'content-type' ? 'text/plain' : null) },
        text: async () => 'plain-ok',
      } as unknown as Response;
    });

    const result = await (
      client as unknown as { request: (p: string) => Promise<unknown> }
    ).request('/text');
    expect(result).toBeNull();
  });

  it('handles invalid JSON payloads gracefully on success response', async () => {
    global.fetch = jest.fn(async () => {
      return {
        ok: true,
        status: 200,
        headers: {
          get: (k: string) => (k.toLowerCase() === 'content-type' ? 'application/json' : null),
        },
        json: async () => {
          throw new Error('bad json');
        },
      } as unknown as Response;
    });

    const result = await (
      client as unknown as { request: (p: string) => Promise<unknown> }
    ).request('/invalid-json');
    expect(result).toBeNull();
  });

  it('falls back when headers object lacks get method', async () => {
    global.fetch = jest.fn(async () => {
      return {
        ok: true,
        status: 200,
        headers: {},
        text: async () => 'no headers',
      } as unknown as Response;
    });

    const result = await (
      client as unknown as { request: (p: string) => Promise<unknown> }
    ).request('/no-headers');
    expect(result).toBeNull();
  });
});
