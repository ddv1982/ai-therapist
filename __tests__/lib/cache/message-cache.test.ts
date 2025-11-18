import { cache } from '@/lib/cache/cache-utils';
import { CACHE_KEYS, MessageCache } from '@/lib/cache/api-cache';
import type { MessageData } from '@/lib/cache/api-cache';

jest.mock('@/lib/cache/cache-utils', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    invalidatePattern: jest.fn(),
  },
}));

describe('MessageCache', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('includes page and limit in cache key when provided', async () => {
    (cache.get as jest.Mock).mockResolvedValue(null);
    const sessionId = 'session-1';
    const page = 2;
    const limit = 25;

    await MessageCache.get(sessionId, page, limit);

    expect(cache.get).toHaveBeenCalledWith(
      CACHE_KEYS.MESSAGES(sessionId, page, limit),
      {},
      expect.objectContaining({ prefix: 'therapist' })
    );
  });

  it('falls back to session-scoped key when page/limit omitted', async () => {
    (cache.get as jest.Mock).mockResolvedValue(null);
    const sessionId = 'session-2';

    await MessageCache.get(sessionId);

    expect(cache.get).toHaveBeenCalledWith(
      CACHE_KEYS.MESSAGES(sessionId, undefined, undefined),
      {},
      expect.any(Object)
    );
  });

  it('persists entries with page/limit combination', async () => {
    (cache.set as jest.Mock).mockResolvedValue(true);
    const data: MessageData[] = [];
    await MessageCache.set('session-3', data, 3, 10);

    expect(cache.set).toHaveBeenCalledWith(
      CACHE_KEYS.MESSAGES('session-3', 3, 10),
      data,
      {},
      expect.objectContaining({ prefix: 'therapist' })
    );
  });
});
