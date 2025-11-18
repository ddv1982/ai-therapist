import { ApiClient } from '@/lib/api/client';

describe('ApiClient branches', () => {
  const originalFetch = global.fetch as unknown as jest.Mock;
  beforeEach(() => {
    (global.fetch as unknown as jest.Mock) = jest.fn();
  });
  afterEach(() => {
    (global.fetch as unknown as jest.Mock) = originalFetch;
    jest.clearAllMocks();
  });

  it('throws for non-JSON error responses', async () => {
    const client = new ApiClient('');
    (global.fetch as unknown as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      headers: { get: () => 'text/plain' },
      json: async () => {
        throw new Error('not json');
      },
      text: async () => 'error-body',
    });
    await expect(client.listSessions()).rejects.toThrow('error-body');
  });

  it('throws error with status from JSON error body', async () => {
    const client = new ApiClient('');
    (global.fetch as unknown as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: { get: () => 'application/json' },
      json: async () => ({ error: { message: 'auth', details: 'nope' } }),
    });
    await expect(client.getCurrentSession()).rejects.toMatchObject({ status: 401 });
  });
});
