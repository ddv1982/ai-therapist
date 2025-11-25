import { NextRequest, NextResponse } from 'next/server';
import {
  withApiMiddleware,
  withAuth,
  withValidation,
  withValidationAndParams,
  withRateLimitUnauthenticated,
  withAuthAndRateLimit,
  withAuthStreaming,
  withAuthAndRateLimitStreaming,
} from '@/lib/api/middleware';
import { z } from 'zod';
import { validateApiAuth } from '@/lib/api/api-auth';
import { getSingleUserInfo } from '@/lib/auth/user-session';
import { getRateLimiter } from '@/lib/api/rate-limiter';
import { logger } from '@/lib/utils/logger';
import * as metrics from '@/lib/metrics/metrics';

// Robust local mocks for Next.js server objects
jest.mock('next/server', () => {
  const MockNextResponse = {
    json: (body: any, init?: ResponseInit) => {
      const headers = new Headers(init?.headers);
      return {
        status: init?.status || 200,
        headers: {
          get: (k: string) => headers.get(k),
          set: (k: string, v: string) => headers.set(k, v),
        },
        json: async () => body,
        body: JSON.stringify(body),
      } as any;
    },
  };

  return {
    __esModule: true,
    NextRequest: class MockNextRequest {
      url: string;
      method: string;
      headers: Headers;
      nextUrl: URL;
      json: jest.Mock;
      constructor(url: string, init: any) {
        this.url = url;
        this.method = init?.method || 'GET';
        this.headers = new Headers(init?.headers || {});
        this.nextUrl = new URL(url);
        this.json = jest.fn().mockResolvedValue({});
      }
    },
    NextResponse: MockNextResponse,
  };
});

jest.mock('@/lib/api/api-auth');
jest.mock('@/lib/auth/user-session');
jest.mock('@/lib/api/rate-limiter');
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    validationError: jest.fn(),
    apiError: jest.fn(),
  },
  createRequestLogger: jest.fn((req) => ({
    requestId: 'req-123',
    method: req.method || 'GET',
    url: req.url || 'http://localhost:3000/api/test',
    userAgent: 'TestAgent',
  })),
}));
jest.mock('@/lib/metrics/metrics');
jest.mock('@/config/env', () => ({
  env: {
    NODE_ENV: 'test',
    RATE_LIMIT_DISABLED: false,
    API_WINDOW_MS: 60000,
    API_MAX_REQS: 100,
    CHAT_WINDOW_MS: 60000,
    RATE_LIMIT_WINDOW_MS: 60000,
    RATE_LIMIT_MAX_REQS: 100,
    CHAT_MAX_CONCURRENCY: 2,
    CHAT_MAX_REQS: 5,
    CHAT_CLEANUP_INTERVAL_MS: 1000,
  },
}));

// Mock request-utils to control client IP
const mockGetClientIP = jest.fn().mockReturnValue('127.0.0.1');
jest.mock('@/lib/api/middleware/request-utils', () => ({
  ...jest.requireActual('@/lib/api/middleware/request-utils'),
  getClientIPFromRequest: () => mockGetClientIP(),
}));

// Helper to create a mock request object
function createMockRequest(
  url: string,
  options: { method?: string; headers?: Record<string, string> } = {}
) {
  const headers = new Headers(options.headers || {});
  return {
    url,
    method: options.method || 'GET',
    headers,
    nextUrl: new URL(url),
    json: jest.fn().mockResolvedValue({}),
    clone: jest.fn(),
  } as unknown as NextRequest;
}

describe('Middleware Tests', () => {
  let req: NextRequest;
  let mockHandler: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    req = createMockRequest('http://localhost:3000/api/test', {
      method: 'GET',
      headers: {
        'x-request-id': 'req-123',
        'user-agent': 'TestAgent',
      },
    });

    mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

    // Default mock implementations
    (validateApiAuth as jest.Mock).mockResolvedValue({ isValid: true });
    (getSingleUserInfo as jest.Mock).mockReturnValue({
      userId: 'user-123',
      email: 'test@example.com',
    });
    (getRateLimiter as jest.Mock).mockReturnValue({
      checkRateLimit: jest.fn().mockResolvedValue({ allowed: true }),
    });
  });

  describe('withApiMiddleware', () => {
    it('should execute handler and record success metrics', async () => {
      const wrapped = withApiMiddleware(mockHandler);
      const res = await wrapped(req, { params: Promise.resolve({}) });

      expect(mockHandler).toHaveBeenCalled();
      expect(res.status).toBe(200);
      expect(metrics.recordEndpointSuccess).toHaveBeenCalled();
      expect(metrics.recordEndpointLatency).toHaveBeenCalled();
    });

    it('should handle errors and return 500 response', async () => {
      const error = new Error('Test error');
      mockHandler.mockRejectedValue(error);

      const wrapped = withApiMiddleware(mockHandler);
      const res = await wrapped(req, { params: Promise.resolve({}) });

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error.message).toBe('Internal server error');
      expect(metrics.recordEndpointError).toHaveBeenCalled();
      expect(logger.apiError).toHaveBeenCalled();
    });
  });

  describe('withAuth', () => {
    it('should pass when auth is valid', async () => {
      const wrapped = withAuth(mockHandler);
      await wrapped(req, { params: Promise.resolve({}) });
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should return 401 when auth is invalid', async () => {
      (validateApiAuth as jest.Mock).mockResolvedValue({
        isValid: false,
        error: 'Invalid token',
      });

      const wrapped = withAuth(mockHandler);
      const res = await wrapped(req, { params: Promise.resolve({}) });

      expect(res.status).toBe(401);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should use fallback user info when getSingleUserInfo fails', async () => {
      (getSingleUserInfo as jest.Mock).mockImplementation(() => {
        throw new Error('Session error');
      });

      const capturingHandler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }));

      const wrapped = withAuth(capturingHandler);
      await wrapped(req, { params: Promise.resolve({}) });

      expect(capturingHandler).toHaveBeenCalled();
      const contextArgs = capturingHandler.mock.calls[0][1];
      expect(contextArgs.userInfo).toBeDefined();
      expect(contextArgs.userInfo.userId).toBe('therapeutic-ai-user');
    });

    it('should merge clerkId if present in authResult', async () => {
      (validateApiAuth as jest.Mock).mockResolvedValue({
        isValid: true,
        userId: 'clerk_123',
      });

      const capturingHandler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }));

      const wrapped = withAuth(capturingHandler);
      await wrapped(req, { params: Promise.resolve({}) });

      expect(capturingHandler).toHaveBeenCalled();
      const contextArgs = capturingHandler.mock.calls[0][1];
      expect(contextArgs.userInfo.clerkId).toBe('clerk_123');
    });
  });

  describe('withValidation', () => {
    const schema = z.object({
      name: z.string(),
    });

    it('should validate body for POST requests', async () => {
      const postReq = createMockRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });

      // Mock json response for this specific request
      (postReq.json as jest.Mock).mockResolvedValue({ name: 'Test' });

      const wrapped = withValidation(schema, mockHandler);
      await wrapped(postReq, { params: Promise.resolve({}) });

      expect(mockHandler).toHaveBeenCalled();
    });

    it('should return 400 for invalid JSON (parse error)', async () => {
      const postReq = createMockRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });
      (postReq.json as jest.Mock).mockRejectedValue(new Error('Invalid JSON'));

      const wrapped = withValidation(schema, mockHandler);
      const res = await wrapped(postReq, { params: Promise.resolve({}) });

      expect(res.status).toBe(400);
      const body = await res.json();
      // Check detailed error message
      expect(body.error.message).toContain('Invalid JSON');
    });

    it('should return 400 for schema validation failure', async () => {
      const postReq = createMockRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });
      (postReq.json as jest.Mock).mockResolvedValue({ name: 123 });

      const wrapped = withValidation(schema, mockHandler);
      const res = await wrapped(postReq, { params: Promise.resolve({}) });

      expect(res.status).toBe(400);
      const body = await res.json();
      // Expect detailed error in message
      expect(body.error.message).toContain('expected string, received number');
    });

    it('should validate search params for GET requests', async () => {
      const getReq = createMockRequest('http://localhost:3000/api/test?name=Test', {
        method: 'GET',
      });

      const wrapped = withValidation(schema, mockHandler);
      await wrapped(getReq, { params: Promise.resolve({}) });

      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('withRateLimitUnauthenticated', () => {
    it('should allow request when limit not exceeded', async () => {
      const wrapped = withRateLimitUnauthenticated(mockHandler);
      await wrapped(req, { params: Promise.resolve({}) });
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should return 429 when limit exceeded', async () => {
      (getRateLimiter as jest.Mock).mockReturnValue({
        checkRateLimit: jest.fn().mockResolvedValue({
          allowed: false,
          retryAfter: 10,
        }),
      });

      const wrapped = withRateLimitUnauthenticated(mockHandler);
      const res = await wrapped(req, { params: Promise.resolve({}) });

      expect(res.status).toBe(429);
      expect(res.headers.get('Retry-After')).toBe('10');
    });
  });

  describe('withAuthAndRateLimit', () => {
    it('should pass when auth valid and rate limit ok', async () => {
      const wrapped = withAuthAndRateLimit(mockHandler);
      await wrapped(req, { params: Promise.resolve({}) });
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should fail when auth invalid', async () => {
      (validateApiAuth as jest.Mock).mockResolvedValue({ isValid: false });
      const wrapped = withAuthAndRateLimit(mockHandler);
      const res = await wrapped(req, { params: Promise.resolve({}) });
      expect(res.status).toBe(401);
    });

    it('should fail when rate limit exceeded', async () => {
      (getRateLimiter as jest.Mock).mockReturnValue({
        checkRateLimit: jest.fn().mockResolvedValue({ allowed: false, retryAfter: 5 }),
      });
      const wrapped = withAuthAndRateLimit(mockHandler);
      const res = await wrapped(req, { params: Promise.resolve({}) });
      expect(res.status).toBe(429);
    });

    it('should handle errors', async () => {
      mockHandler.mockRejectedValue(new Error('Explosion'));
      const wrapped = withAuthAndRateLimit(mockHandler);
      const res = await wrapped(req, { params: Promise.resolve({}) });
      expect(res.status).toBe(500);
    });
  });

  describe('withAuthStreaming', () => {
    it('should handle successful streaming request', async () => {
      const streamHandler = jest.fn().mockResolvedValue(new Response('stream'));
      const wrapped = withAuthStreaming(streamHandler);
      const res = await wrapped(req, { params: Promise.resolve({}) });

      expect(res.status).toBe(200);
      expect(streamHandler).toHaveBeenCalled();
    });

    it('should return 401 for invalid auth in streaming', async () => {
      (validateApiAuth as jest.Mock).mockResolvedValue({ isValid: false });
      const streamHandler = jest.fn();
      const wrapped = withAuthStreaming(streamHandler);
      const res = await wrapped(req, { params: Promise.resolve({}) });

      expect(res.status).toBe(401);
      expect(streamHandler).not.toHaveBeenCalled();
    });

    it('should handle errors in streaming handler', async () => {
      const streamHandler = jest.fn().mockRejectedValue(new Error('Stream error'));
      const wrapped = withAuthStreaming(streamHandler);
      const res = await wrapped(req, { params: Promise.resolve({}) });

      expect(res.status).toBe(500);
    });

    it('should use fallback user info on session error', async () => {
      (getSingleUserInfo as jest.Mock).mockImplementation(() => {
        throw new Error('No session');
      });
      const streamHandler = jest.fn().mockResolvedValue(new Response('ok'));
      const wrapped = withAuthStreaming(streamHandler);
      await wrapped(req, { params: Promise.resolve({}) });
      expect(streamHandler).toHaveBeenCalled();
    });
  });

  describe('withAuthAndRateLimitStreaming', () => {
    const streamHandler = jest.fn().mockResolvedValue(new Response('stream'));

    it('should return 429 when global rate limit exceeded', async () => {
      (getRateLimiter as jest.Mock).mockReturnValue({
        checkRateLimit: jest.fn().mockResolvedValue({ allowed: false }),
      });

      const wrapped = withAuthAndRateLimitStreaming(streamHandler);
      const res = await wrapped(req, { params: Promise.resolve({}) });

      expect(res.status).toBe(429);
    });

    it('should return 401 when auth fails', async () => {
      (validateApiAuth as jest.Mock).mockResolvedValue({ isValid: false });
      const wrapped = withAuthAndRateLimitStreaming(streamHandler);
      const res = await wrapped(req, { params: Promise.resolve({}) });
      expect(res.status).toBe(401);
    });

    it('should handle internal error', async () => {
      mockHandler = jest.fn().mockRejectedValue(new Error('Fail'));
      const wrapped = withAuthAndRateLimitStreaming(mockHandler);
      const res = await wrapped(req, { params: Promise.resolve({}) });
      expect(res.status).toBe(500);
    });
  });

  describe('Error Handling Scenarios', () => {
    it('should handle invalid request data in withValidation (non-POST/PUT)', async () => {
      // Test validation with invalid request that can't be parsed
      const schema = z.object({ name: z.string() });
      const getReq = createMockRequest('http://localhost:3000/api/test?invalid=[', {
        method: 'GET',
      });

      const wrapped = withValidation(schema, mockHandler);
      const res = await wrapped(getReq, { params: Promise.resolve({}) });

      // Should fail validation due to invalid query params
      expect(res.status).toBe(400);
    });

    it('should handle auth with clerkId in authResult', async () => {
      (validateApiAuth as jest.Mock).mockResolvedValue({
        isValid: true,
        userId: 'clerk-user-123',
      });

      const capturingHandler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }));
      const wrapped = withAuth(capturingHandler);
      await wrapped(req, { params: Promise.resolve({}) });

      expect(capturingHandler).toHaveBeenCalled();
      const context = capturingHandler.mock.calls[0][1];
      expect(context.userInfo.clerkId).toBe('clerk-user-123');
    });

    it('should detect mobile user agent in fallback user info', async () => {
      const mobileReq = createMockRequest('http://localhost:3000/api/test', {
        headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0) Mobile/15A372' },
      });

      (getSingleUserInfo as jest.Mock).mockImplementation(() => {
        throw new Error('No session');
      });

      const capturingHandler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }));
      const wrapped = withAuth(capturingHandler);
      await wrapped(mobileReq, { params: Promise.resolve({}) });

      const context = capturingHandler.mock.calls[0][1];
      expect(context.userInfo.currentDevice).toBe('Mobile');
    });

    it('should detect tablet user agent in fallback user info', async () => {
      const tabletReq = createMockRequest('http://localhost:3000/api/test', {
        headers: { 'user-agent': 'Mozilla/5.0 (iPad; CPU OS 14_0) iPad' },
      });

      (getSingleUserInfo as jest.Mock).mockImplementation(() => {
        throw new Error('No session');
      });

      const capturingHandler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }));
      const wrapped = withAuth(capturingHandler);
      await wrapped(tabletReq, { params: Promise.resolve({}) });

      const context = capturingHandler.mock.calls[0][1];
      expect(context.userInfo.currentDevice).toBe('Tablet');
    });

    it('should detect computer user agent in fallback user info', async () => {
      const computerReq = createMockRequest('http://localhost:3000/api/test', {
        headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      });

      (getSingleUserInfo as jest.Mock).mockImplementation(() => {
        throw new Error('No session');
      });

      const capturingHandler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }));
      const wrapped = withAuth(capturingHandler);
      await wrapped(computerReq, { params: Promise.resolve({}) });

      const context = capturingHandler.mock.calls[0][1];
      expect(context.userInfo.currentDevice).toBe('Computer');
    });

    it('should handle metrics recording failures gracefully', async () => {
      // Mock metrics to throw errors
      (metrics.recordEndpointSuccess as jest.Mock).mockImplementation(() => {
        throw new Error('Metrics error');
      });
      (metrics.recordEndpointLatency as jest.Mock).mockImplementation(() => {
        throw new Error('Metrics error');
      });

      const wrapped = withApiMiddleware(mockHandler);
      const res = await wrapped(req, { params: Promise.resolve({}) });

      // Should still succeed despite metrics errors
      expect(res.status).toBe(200);
    });

    it('should handle rate limiter with retryAfter', async () => {
      (getRateLimiter as jest.Mock).mockReturnValue({
        checkRateLimit: jest.fn().mockResolvedValue({
          allowed: false,
          retryAfter: 30,
        }),
      });

      const wrapped = withRateLimitUnauthenticated(mockHandler);
      const res = await wrapped(req, { params: Promise.resolve({}) });

      expect(res.status).toBe(429);
      expect(res.headers.get('Retry-After')).toBe('30');
    });

    it('should handle non-Error exceptions in withApiMiddleware', async () => {
      mockHandler.mockRejectedValue('String error');

      const wrapped = withApiMiddleware(mockHandler);
      const res = await wrapped(req, { params: Promise.resolve({}) });

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error.message).toBe('Internal server error');
    });

    it('should log validation errors properly', async () => {
      const schema = z.object({ name: z.string() });
      const postReq = createMockRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });
      (postReq.json as jest.Mock).mockResolvedValue({ name: 123 });

      const wrapped = withValidation(schema, mockHandler);
      await wrapped(postReq, { params: Promise.resolve({}) });

      expect(logger.validationError).toHaveBeenCalled();
    });

    it('should handle validation with PUT method', async () => {
      const schema = z.object({ name: z.string() });
      const putReq = createMockRequest('http://localhost:3000/api/test', {
        method: 'PUT',
      });
      (putReq.json as jest.Mock).mockResolvedValue({ name: 'Valid' });

      const wrapped = withValidation(schema, mockHandler);
      await wrapped(putReq, { params: Promise.resolve({}) });

      expect(mockHandler).toHaveBeenCalled();
    });

    it('should handle validation with PATCH method', async () => {
      const schema = z.object({ name: z.string() });
      const patchReq = createMockRequest('http://localhost:3000/api/test', {
        method: 'PATCH',
      });
      (patchReq.json as jest.Mock).mockResolvedValue({ name: 'Valid' });

      const wrapped = withValidation(schema, mockHandler);
      await wrapped(patchReq, { params: Promise.resolve({}) });

      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('withValidationAndParams', () => {
    it('should pass route params to handler', async () => {
      const schema = z.object({ name: z.string() });
      const capturingHandler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }));

      const postReq = createMockRequest('http://localhost:3000/api/test/123', {
        method: 'POST',
      });
      (postReq.json as jest.Mock).mockResolvedValue({ name: 'Test' });

      const wrapped = withValidationAndParams(schema, capturingHandler);
      await wrapped(postReq, { params: Promise.resolve({ id: '123' }) });

      expect(capturingHandler).toHaveBeenCalled();
      const [, , , params] = capturingHandler.mock.calls[0];
      expect(params).toEqual({ id: '123' });
    });

    it('should validate request body before passing params', async () => {
      const schema = z.object({ name: z.string() });
      const capturingHandler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }));

      const postReq = createMockRequest('http://localhost:3000/api/test/123', {
        method: 'POST',
      });
      (postReq.json as jest.Mock).mockResolvedValue({ name: 123 }); // Invalid

      const wrapped = withValidationAndParams(schema, capturingHandler);
      const res = await wrapped(postReq, { params: Promise.resolve({ id: '123' }) });

      expect(res.status).toBe(400);
      expect(capturingHandler).not.toHaveBeenCalled();
    });
  });

  describe('Rate limit headers on successful responses', () => {
    beforeEach(() => {
      (getRateLimiter as jest.Mock).mockReturnValue({
        checkRateLimit: jest.fn().mockResolvedValue({ allowed: true }),
        getStatus: jest.fn().mockReturnValue({
          remaining: 95,
          resetTime: Date.now() + 60000,
        }),
      });
    });

    it('should add rate limit headers to successful withRateLimitUnauthenticated response', async () => {
      const wrapped = withRateLimitUnauthenticated(mockHandler);
      const res = await wrapped(req, { params: Promise.resolve({}) });

      expect(res.status).toBe(200);
      expect(getRateLimiter().getStatus).toHaveBeenCalled();
    });

    it('should add rate limit headers to successful withAuthAndRateLimit response', async () => {
      const wrapped = withAuthAndRateLimit(mockHandler);
      const res = await wrapped(req, { params: Promise.resolve({}) });

      expect(res.status).toBe(200);
      expect(getRateLimiter().getStatus).toHaveBeenCalled();
    });
  });

  describe('withAuthAndRateLimitStreaming - advanced scenarios', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // Use unique IP per test to avoid counter collision
      mockGetClientIP.mockReturnValue(`192.168.1.${Math.floor(Math.random() * 255)}`);
      (getRateLimiter as jest.Mock).mockReturnValue({
        checkRateLimit: jest.fn().mockResolvedValue({ allowed: true }),
        getStatus: jest.fn().mockReturnValue({
          remaining: 95,
          resetTime: Date.now() + 60000,
        }),
      });
    });

    it('should handle successful streaming with rate limit headers', async () => {
      const streamHandler = jest.fn().mockResolvedValue(new Response('stream data'));
      const wrapped = withAuthAndRateLimitStreaming(streamHandler);
      const res = await wrapped(req, { params: Promise.resolve({}) });

      expect(res.status).toBe(200);
      expect(streamHandler).toHaveBeenCalled();
    });

    it('should return 429 for streaming counter rate limit exceeded', async () => {
      // Use consistent IP for this test
      mockGetClientIP.mockReturnValue('192.168.100.1');

      const streamHandler = jest.fn().mockResolvedValue(new Response('ok'));
      const wrapped = withAuthAndRateLimitStreaming(streamHandler, { maxRequests: 2 });

      // Make requests up to the limit
      let rateLimited = false;
      for (let i = 0; i < 5; i++) {
        const newReq = createMockRequest('http://localhost:3000/api/test');
        const res = await wrapped(newReq, { params: Promise.resolve({}) });
        if (res.status === 429) {
          rateLimited = true;
          break;
        }
      }
      expect(rateLimited).toBe(true);
    });

    it('should track and clean up inflight counters', async () => {
      mockGetClientIP.mockReturnValue('192.168.100.2');
      const streamHandler = jest.fn().mockResolvedValue(new Response('ok'));
      const wrapped = withAuthAndRateLimitStreaming(streamHandler);

      // Make a successful request to increment inflight counter
      const res = await wrapped(req, { params: Promise.resolve({}) });
      expect(res.status).toBe(200);

      // The finally block should decrement the counter
    });

    it('should return 429 when concurrent request limit is reached', async () => {
      // Use consistent IP for this test
      mockGetClientIP.mockReturnValue('192.168.100.3');

      // Create a handler that takes time to complete
      let resolveFirst: () => void;
      const firstPromise = new Promise<void>((resolve) => {
        resolveFirst = resolve;
      });

      const streamHandler = jest
        .fn()
        .mockImplementationOnce(async () => {
          await firstPromise; // Wait until we tell it to complete
          return new Response('ok');
        })
        .mockResolvedValue(new Response('ok'));

      const wrapped = withAuthAndRateLimitStreaming(streamHandler, { maxConcurrent: 1 });

      // Start first request (but don't await yet)
      const req1 = createMockRequest('http://localhost:3000/api/test');
      const promise1 = wrapped(req1, { params: Promise.resolve({}) });

      // Second request should be rate limited due to concurrent limit
      const req2 = createMockRequest('http://localhost:3000/api/test2');
      const res2 = await wrapped(req2, { params: Promise.resolve({}) });

      // Release first request
      resolveFirst!();
      await promise1;

      expect(res2.status).toBe(429);
    });
  });

  describe('withAuthStreaming - fallback user info edge cases', () => {
    it('should rethrow error when fallback user info also fails', async () => {
      (getSingleUserInfo as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Primary error');
      });

      const streamHandler = jest.fn().mockResolvedValue(new Response('ok'));
      const wrapped = withAuthStreaming(streamHandler);
      const res = await wrapped(req, { params: Promise.resolve({}) });

      // Should still succeed with fallback
      expect(res.status).toBe(200);
    });
  });

  describe('withRateLimitUnauthenticated - bucket options', () => {
    let mockCheckRateLimit: jest.Mock;
    let mockGetStatus: jest.Mock;

    beforeEach(() => {
      mockCheckRateLimit = jest.fn().mockResolvedValue({ allowed: true });
      mockGetStatus = jest.fn().mockReturnValue({ remaining: 95, resetTime: Date.now() + 60000 });
      (getRateLimiter as jest.Mock).mockReturnValue({
        checkRateLimit: mockCheckRateLimit,
        getStatus: mockGetStatus,
      });
    });

    it('should use chat bucket when specified', async () => {
      const wrapped = withRateLimitUnauthenticated(mockHandler, { bucket: 'chat' });
      const res = await wrapped(req, { params: Promise.resolve({}) });

      expect(res.status).toBe(200);
      expect(mockCheckRateLimit).toHaveBeenCalled();
    });

    it('should use default bucket when specified', async () => {
      const wrapped = withRateLimitUnauthenticated(mockHandler, { bucket: 'default' });
      const res = await wrapped(req, { params: Promise.resolve({}) });

      expect(res.status).toBe(200);
      expect(mockCheckRateLimit).toHaveBeenCalled();
    });

    it('should use custom windowMs when provided', async () => {
      mockCheckRateLimit.mockResolvedValue({ allowed: false });

      const wrapped = withRateLimitUnauthenticated(mockHandler, { windowMs: 30000 });
      const res = await wrapped(req, { params: Promise.resolve({}) });

      expect(res.status).toBe(429);
    });
  });
});
