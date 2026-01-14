import type { NextRequest } from 'next/server';
import {
  getTokenWithRetry,
  isTransientError,
  type AuthObjectWithGetToken,
} from '@/lib/api/api-auth';

describe('lib/api/api-auth.isTransientError', () => {
  it('returns true for Bad Gateway errors', () => {
    expect(isTransientError(new Error('Bad Gateway'))).toBe(true);
    expect(isTransientError(new Error('502 Bad Gateway from upstream'))).toBe(true);
  });

  it('returns true for Service Unavailable errors', () => {
    expect(isTransientError(new Error('Service Unavailable'))).toBe(true);
    expect(isTransientError(new Error('503 Service Unavailable'))).toBe(true);
  });

  it('returns true for network errors', () => {
    expect(isTransientError(new Error('ECONNRESET'))).toBe(true);
    expect(isTransientError(new Error('fetch failed'))).toBe(true);
  });

  it('returns false for non-transient errors', () => {
    expect(isTransientError(new Error('Invalid token'))).toBe(false);
    expect(isTransientError(new Error('Unauthorized'))).toBe(false);
    expect(isTransientError(new Error('Rate limit exceeded'))).toBe(false);
  });
});

describe('lib/api/api-auth.getTokenWithRetry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns token on first success', async () => {
    const mockAuthObj: AuthObjectWithGetToken = {
      getToken: jest.fn().mockResolvedValue('test_token'),
    };

    const tokenPromise = getTokenWithRetry(mockAuthObj, 'convex');
    jest.runAllTimers();
    const token = await tokenPromise;

    expect(token).toBe('test_token');
    expect(mockAuthObj.getToken).toHaveBeenCalledTimes(1);
    expect(mockAuthObj.getToken).toHaveBeenCalledWith({ template: 'convex' });
  });

  it('retries on transient errors and succeeds', async () => {
    const mockAuthObj: AuthObjectWithGetToken = {
      getToken: jest
        .fn()
        .mockRejectedValueOnce(new Error('Bad Gateway'))
        .mockResolvedValueOnce('retry_token'),
    };

    const tokenPromise = getTokenWithRetry(mockAuthObj, 'convex');
    await jest.runAllTimersAsync();
    const token = await tokenPromise;

    expect(token).toBe('retry_token');
    expect(mockAuthObj.getToken).toHaveBeenCalledTimes(2);
  });

  it('throws immediately on non-transient errors', async () => {
    const mockAuthObj: AuthObjectWithGetToken = {
      getToken: jest.fn().mockRejectedValue(new Error('Invalid token')),
    };

    await expect(getTokenWithRetry(mockAuthObj, 'convex')).rejects.toThrow('Invalid token');
    expect(mockAuthObj.getToken).toHaveBeenCalledTimes(1);
  });

  it('throws after max retries exhausted on transient errors', async () => {
    jest.useRealTimers();

    const mockAuthObj: AuthObjectWithGetToken = {
      getToken: jest.fn().mockRejectedValue(new Error('Bad Gateway')),
    };

    await expect(getTokenWithRetry(mockAuthObj, 'convex', 2)).rejects.toThrow('Bad Gateway');
    expect(mockAuthObj.getToken).toHaveBeenCalledTimes(2);
  });

  it('returns null if getToken returns null', async () => {
    const mockAuthObj: AuthObjectWithGetToken = {
      getToken: jest.fn().mockResolvedValue(null),
    };

    const token = await getTokenWithRetry(mockAuthObj, 'convex');
    expect(token).toBeNull();
  });
});

describe('lib/api/api-auth.validateApiAuth', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('returns isValid=true and clerkId when auth() returns userId', async () => {
    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn().mockResolvedValue({
        userId: 'clerk_user_1',
        getToken: jest.fn().mockResolvedValue('mock_jwt_token'),
      }),
      getAuth: jest.fn(),
    }));
    const { validateApiAuth } = await import('@/lib/api/api-auth');
    const res = await validateApiAuth();
    expect(res.isValid).toBe(true);
    expect(res.clerkId).toBe('clerk_user_1');
    expect(res.jwtToken).toBe('mock_jwt_token');
  });

  it('returns isValid=false when no userId present', async () => {
    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn().mockResolvedValue({ userId: null }),
      getAuth: jest.fn(),
    }));
    const { validateApiAuth } = await import('@/lib/api/api-auth');
    const res = await validateApiAuth();
    expect(res.isValid).toBe(false);
    expect(res.error).toMatch(/unauthorized/i);
  });

  it('uses request-bound getAuth(request) when provided', async () => {
    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn().mockResolvedValue({
        userId: 'fallback',
        getToken: jest.fn().mockResolvedValue('fallback_token'),
      }),
      getAuth: jest.fn(() => ({
        userId: 'request_user',
        getToken: jest.fn().mockResolvedValue('request_jwt_token'),
      })),
    }));
    const { validateApiAuth } = await import('@/lib/api/api-auth');
    const res = await validateApiAuth({} as unknown as NextRequest);
    expect(res.isValid).toBe(true);
    expect(res.clerkId).toBe('request_user');
    expect(res.jwtToken).toBe('request_jwt_token');
  });

  it('handles non-Error exceptions', async () => {
    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn().mockRejectedValue('string error'),
      getAuth: jest.fn(),
    }));
    const { validateApiAuth } = await import('@/lib/api/api-auth');
    const res = await validateApiAuth();
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('Unknown error');
  });
});
