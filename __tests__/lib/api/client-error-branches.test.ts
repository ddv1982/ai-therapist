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
        json: async () => { throw new Error('not json'); },
        text: async () => 'plain-error',
      } as unknown as Response;
    });
    await expect((client as unknown as { request: (p: string) => Promise<unknown> }).request('/x')).rejects.toThrow('plain-error');
  });

  it('throws Error with parsed details on JSON error responses', async () => {
    global.fetch = jest.fn(async () => {
      return {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: { get: (k: string) => (k.toLowerCase() === 'content-type' ? 'application/json' : null) },
        json: async () => ({ error: { message: 'Authentication required', details: 'No token' } }),
      } as unknown as Response;
    });
    await expect((client as unknown as { request: (p: string) => Promise<unknown> }).request('/y')).rejects.toThrow('No token');
  });
});


