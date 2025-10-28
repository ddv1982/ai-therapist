import { NextRequest, NextResponse } from 'next/server';
import { buildRateLimit } from '@/lib/api/middleware/builders/rate-limit';
import type { ApiResponse } from '@/lib/api/api-response';
import type { RequestContext } from '@/lib/api/middleware/factory';

const { createSuccessResponse } = jest.requireActual<typeof import('@/lib/api/api-response')>('@/lib/api/api-response');

describe('rate-limit builder', () => {
  const mockContext: RequestContext = {
    requestId: 'rid-123',
    method: 'GET',
    url: '/api/test',
  };

  let mockGetClientIP: jest.Mock;
  let mockCheckRateLimit: jest.Mock;
  let mockGetRateLimiter: jest.Mock;
  let mockWithApiMiddleware: jest.Mock;
  let capturedHandler: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetClientIP = jest.fn(() => '192.168.1.1');
    mockCheckRateLimit = jest.fn(async () => ({ allowed: true }));
    mockGetRateLimiter = jest.fn(() => ({ checkRateLimit: mockCheckRateLimit }));
    
    mockWithApiMiddleware = jest.fn((handler) => {
      capturedHandler = handler;
      return async (request: NextRequest) => {
        return handler(request, mockContext, {});
      };
    });

    // Set test environment to avoid rate limiting issues
    process.env.NODE_ENV = 'test';
    process.env.RATE_LIMIT_DISABLED = 'false';
  });

  afterEach(() => {
    delete process.env.RATE_LIMIT_DISABLED;
  });

  describe('withRateLimitUnauthenticated', () => {
    it('allows request when rate limit not exceeded', async () => {
      mockCheckRateLimit.mockResolvedValueOnce({ allowed: true });

      const deps = {
        withApiMiddleware: mockWithApiMiddleware,
        getClientIPFromRequest: mockGetClientIP,
        getRateLimiter: mockGetRateLimiter,
      };

      const { withRateLimitUnauthenticated } = buildRateLimit(deps);

      const handler = jest.fn(async () =>
        createSuccessResponse({ data: 'ok' }, { requestId: 'rid-123' })
      );

      const wrapped = withRateLimitUnauthenticated(handler);
      const req = { method: 'GET', url: '/api/test' } as NextRequest;

      const response = await capturedHandler(req, mockContext, {});

      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalled();
      expect(mockGetClientIP).toHaveBeenCalledWith(req);
      expect(mockCheckRateLimit).toHaveBeenCalledWith('192.168.1.1', 'api');
    });

    it('returns 429 when rate limit exceeded', async () => {
      mockCheckRateLimit.mockResolvedValueOnce({ allowed: false, retryAfter: 60 });

      const deps = {
        withApiMiddleware: mockWithApiMiddleware,
        getClientIPFromRequest: mockGetClientIP,
        getRateLimiter: mockGetRateLimiter,
      };

      const { withRateLimitUnauthenticated } = buildRateLimit(deps);

      const handler = jest.fn();
      const wrapped = withRateLimitUnauthenticated(handler);
      const req = { method: 'POST', url: '/api/chat' } as NextRequest;

      const response = await capturedHandler(req, mockContext, {});

      expect(response.status).toBe(429);
      expect(handler).not.toHaveBeenCalled();

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error?.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('uses custom bucket option', async () => {
      mockCheckRateLimit.mockResolvedValueOnce({ allowed: true });

      const deps = {
        withApiMiddleware: mockWithApiMiddleware,
        getClientIPFromRequest: mockGetClientIP,
        getRateLimiter: mockGetRateLimiter,
      };

      const { withRateLimitUnauthenticated } = buildRateLimit(deps);

      const handler = jest.fn(async () =>
        createSuccessResponse({ data: 'ok' }, { requestId: 'rid-123' })
      );

      const wrapped = withRateLimitUnauthenticated(handler, { bucket: 'chat' });
      const req = { method: 'POST', url: '/api/chat' } as NextRequest;

      await capturedHandler(req, mockContext, {});

      expect(mockCheckRateLimit).toHaveBeenCalledWith('192.168.1.1', 'chat');
    });

    it('uses default bucket when not specified', async () => {
      mockCheckRateLimit.mockResolvedValueOnce({ allowed: true });

      const deps = {
        withApiMiddleware: mockWithApiMiddleware,
        getClientIPFromRequest: mockGetClientIP,
        getRateLimiter: mockGetRateLimiter,
      };

      const { withRateLimitUnauthenticated } = buildRateLimit(deps);

      const handler = jest.fn(async () =>
        createSuccessResponse({ data: 'ok' }, { requestId: 'rid-123' })
      );

      const wrapped = withRateLimitUnauthenticated(handler, { bucket: 'default' });
      const req = { method: 'GET', url: '/api/test' } as NextRequest;

      await capturedHandler(req, mockContext, {});

      expect(mockCheckRateLimit).toHaveBeenCalledWith('192.168.1.1', 'default');
    });

    it('calculates retryAfter from windowMs when not provided', async () => {
      mockCheckRateLimit.mockResolvedValueOnce({ allowed: false });

      const deps = {
        withApiMiddleware: mockWithApiMiddleware,
        getClientIPFromRequest: mockGetClientIP,
        getRateLimiter: mockGetRateLimiter,
      };

      const { withRateLimitUnauthenticated } = buildRateLimit(deps);

      const handler = jest.fn();
      const wrapped = withRateLimitUnauthenticated(handler, { windowMs: 120000 });
      const req = { method: 'POST', url: '/api/test' } as NextRequest;

      const response = await capturedHandler(req, mockContext, {});

      const retryAfterHeader = response.headers.get('Retry-After');
      expect(retryAfterHeader).toBeDefined();
      expect(Number(retryAfterHeader)).toBeGreaterThan(0);
    });

    it('includes Retry-After header in rate limit response', async () => {
      mockCheckRateLimit.mockResolvedValueOnce({ allowed: false, retryAfter: 120 });

      const deps = {
        withApiMiddleware: mockWithApiMiddleware,
        getClientIPFromRequest: mockGetClientIP,
        getRateLimiter: mockGetRateLimiter,
      };

      const { withRateLimitUnauthenticated } = buildRateLimit(deps);

      const handler = jest.fn();
      const wrapped = withRateLimitUnauthenticated(handler);
      const req = { method: 'GET', url: '/api/test' } as NextRequest;

      const response = await capturedHandler(req, mockContext, {});

      expect(response.headers.get('Retry-After')).toBe('120');
    });

    it('skips rate limiting when disabled in non-production', async () => {
      process.env.RATE_LIMIT_DISABLED = 'true';
      process.env.NODE_ENV = 'development';

      const deps = {
        withApiMiddleware: mockWithApiMiddleware,
        getClientIPFromRequest: mockGetClientIP,
        getRateLimiter: mockGetRateLimiter,
      };

      const { withRateLimitUnauthenticated } = buildRateLimit(deps);

      const handler = jest.fn(async () =>
        createSuccessResponse({ data: 'ok' }, { requestId: 'rid-123' })
      );

      const wrapped = withRateLimitUnauthenticated(handler);
      const req = { method: 'GET', url: '/api/test' } as NextRequest;

      await capturedHandler(req, mockContext, {});

      expect(handler).toHaveBeenCalled();
      expect(mockCheckRateLimit).not.toHaveBeenCalled();
    });

    it('enforces rate limiting in production even when disabled flag set', async () => {
      process.env.RATE_LIMIT_DISABLED = 'true';
      process.env.NODE_ENV = 'production';
      mockCheckRateLimit.mockResolvedValueOnce({ allowed: true });

      const deps = {
        withApiMiddleware: mockWithApiMiddleware,
        getClientIPFromRequest: mockGetClientIP,
        getRateLimiter: mockGetRateLimiter,
      };

      const { withRateLimitUnauthenticated } = buildRateLimit(deps);

      const handler = jest.fn(async () =>
        createSuccessResponse({ data: 'ok' }, { requestId: 'rid-123' })
      );

      const wrapped = withRateLimitUnauthenticated(handler);
      const req = { method: 'GET', url: '/api/test' } as NextRequest;

      await capturedHandler(req, mockContext, {});

      expect(mockCheckRateLimit).toHaveBeenCalled();
    });
  });
});
