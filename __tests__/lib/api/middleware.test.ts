import { NextRequest, NextResponse } from 'next/server';
import {
  withApiMiddleware,
  withAuth,
  withValidation,
  withRateLimitUnauthenticated,
  withAuthAndRateLimit,
  withAuthStreaming,
  withAuthAndRateLimitStreaming,
  type AuthenticatedRequestContext,
} from '@/lib/api/middleware';
import { z } from 'zod';
import { validateApiAuth } from '@/lib/api/api-auth';
import { getSingleUserInfo } from '@/lib/auth/user-session';
import { getRateLimiter } from '@/lib/api/rate-limiter';
import { logger } from '@/lib/utils/logger';
import * as metrics from '@/lib/metrics/metrics';
import { env } from '@/config/env';

// Robust local mocks for Next.js server objects
const mockJsonFn = jest.fn();

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
    NextRequest: jest.fn((url, init) => {
      const headers = new Headers(init?.headers || {});
      const method = init?.method || 'GET';
      return {
        url,
        method,
        headers,
        nextUrl: new URL(url),
        json: async () => mockJsonFn(),
      };
    }),
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
    CHAT_WINDOW_MS: 60000,
    RATE_LIMIT_WINDOW_MS: 60000,
    CHAT_MAX_CONCURRENCY: 2,
    CHAT_MAX_REQS: 5,
    CHAT_CLEANUP_INTERVAL_MS: 1000,
  },
}));

describe('Middleware Tests', () => {
  let req: NextRequest;
  let mockHandler: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJsonFn.mockResolvedValue({});
    
    req = new NextRequest('http://localhost:3000/api/test', {
      method: 'GET',
      headers: {
        'x-request-id': 'req-123',
        'user-agent': 'TestAgent',
      },
    });
    // Force properties if mock fails
    Object.assign(req, {
       url: 'http://localhost:3000/api/test',
       method: 'GET',
       nextUrl: new URL('http://localhost:3000/api/test'),
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
        error: 'Invalid token' 
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

      let capturedContext: AuthenticatedRequestContext | undefined;
      const capturingHandler = jest.fn(async (r, ctx) => {
        capturedContext = ctx;
        return NextResponse.json({ ok: true });
      });

      const wrapped = withAuth(capturingHandler);
      await wrapped(req, { params: Promise.resolve({}) });

      expect(capturedContext?.userInfo.userId).toBe('therapeutic-ai-user');
    });
    
    it('should merge clerkId if present in authResult', async () => {
       (validateApiAuth as jest.Mock).mockResolvedValue({ 
        isValid: true, 
        userId: 'clerk_123'
      });
      
      let capturedContext: AuthenticatedRequestContext | undefined;
      const capturingHandler = jest.fn(async (r, ctx) => {
        capturedContext = ctx;
        return NextResponse.json({ ok: true });
      });

      const wrapped = withAuth(capturingHandler);
      await wrapped(req, { params: Promise.resolve({}) });

      expect((capturedContext?.userInfo as any).clerkId).toBe('clerk_123');
    });
  });

  describe('withValidation', () => {
    const schema = z.object({
      name: z.string(),
    });

    it('should validate body for POST requests', async () => {
      const postReq = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });
      Object.assign(postReq, {
         url: 'http://localhost:3000/api/test',
         method: 'POST',
         nextUrl: new URL('http://localhost:3000/api/test'),
      });
      
      mockJsonFn.mockResolvedValueOnce({ name: 'Test' });
      
      const wrapped = withValidation(schema, mockHandler);
      await wrapped(postReq, { params: Promise.resolve({}) });
      
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should return 400 for invalid JSON (parse error)', async () => {
      const postReq = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });
      Object.assign(postReq, {
         url: 'http://localhost:3000/api/test',
         method: 'POST',
         nextUrl: new URL('http://localhost:3000/api/test'),
      });
      mockJsonFn.mockRejectedValueOnce(new Error('Invalid JSON'));

      const wrapped = withValidation(schema, mockHandler);
      const res = await wrapped(postReq, { params: Promise.resolve({}) });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.message).toContain('Invalid JSON');
    });

    it('should return 400 for schema validation failure', async () => {
      const postReq = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });
      Object.assign(postReq, {
         url: 'http://localhost:3000/api/test',
         method: 'POST',
         nextUrl: new URL('http://localhost:3000/api/test'),
      });
      mockJsonFn.mockResolvedValueOnce({ name: 123 });

      const wrapped = withValidation(schema, mockHandler);
      const res = await wrapped(postReq, { params: Promise.resolve({}) });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.message).toContain('Expected string, received number');
    });

    it('should validate search params for GET requests', async () => {
      const getReq = new NextRequest('http://localhost:3000/api/test?name=Test', {
        method: 'GET',
      });
      Object.assign(getReq, {
         url: 'http://localhost:3000/api/test?name=Test',
         method: 'GET',
         nextUrl: new URL('http://localhost:3000/api/test?name=Test'),
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
          retryAfter: 10 
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
       (getSingleUserInfo as jest.Mock).mockImplementation(() => { throw new Error('No session'); });
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
});
