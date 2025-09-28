import { ApiClient } from '@/lib/api/client';

describe('ApiClient timeout/abort and content-type fallbacks', () => {
  const originalFetch = global.fetch;
  const client = new ApiClient('');

  afterEach(() => {
    global.fetch = originalFetch as any;
  });

  it('aborts on timeout and throws', async () => {
    // Simulate fetch that listens to AbortSignal and rejects on abort
    global.fetch = jest.fn((url: string, init?: any) => {
      void url;
      return new Promise((_resolve, reject) => {
        const signal: AbortSignal | undefined = init?.signal;
        if (signal) {
          signal.addEventListener('abort', () => reject(new Error('Aborted')));
        }
      });
    }) as any;
    await expect((client as unknown as { request: (p: string, init?: RequestInit, t?: number) => Promise<unknown> }).request('/slow', {}, 1)).rejects.toBeInstanceOf(Error);
  }, 2000);

  it('throws on non-JSON error content-type', async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      headers: { get: (k: string) => (k.toLowerCase() === 'content-type' ? 'text/plain' : null) },
      json: async () => { throw new Error('not json'); },
      text: async () => 'fail',
    })) as any;
    await expect((client as unknown as { request: (p: string) => Promise<unknown> }).request('/x')).rejects.toThrow('fail');
  });
});


