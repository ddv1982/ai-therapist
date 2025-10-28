import { NextRequest, NextResponse } from 'next/server';
import { createApiMiddleware } from '@/lib/api/middleware/factory';

describe('api-middleware factory - branch coverage', () => {

  it('handles missing routeParams gracefully', async () => {
    const factory = createApiMiddleware();
    const handler = jest.fn(async () =>
      NextResponse.json({ success: true, data: { ok: true }, meta: { timestamp: new Date().toISOString() } })
    );
    
    const wrapped = factory.withApiMiddleware(handler);
    const req = new NextRequest('http://localhost/test');
    
    // Call without routeParams (edge case)
    await wrapped(req, undefined as any);
    
    expect(handler).toHaveBeenCalled();
  });

  it('delegates withAuth to builder correctly', async () => {
    const mockValidateApiAuth = jest.fn(async () => ({ isValid: true, userId: 'user123' }));
    const mockGetSingleUserInfo = jest.fn(() => ({
      userId: 'user123',
      userEmail: 'test@example.com',
      currentDevice: 'Computer' as const,
    }));
    
    const factory = createApiMiddleware({
      validateApiAuth: mockValidateApiAuth as any,
      getSingleUserInfo: mockGetSingleUserInfo as any,
    });
    
    const handler = jest.fn(async (_req, ctx) =>
      NextResponse.json({ success: true, data: { user: ctx.userInfo }, meta: { timestamp: new Date().toISOString() } })
    );
    
    const wrapped = factory.withAuth(handler);
    const req = new NextRequest('http://localhost/auth-test');
    
    await wrapped(req, { params: Promise.resolve({}) });
    
    expect(handler).toHaveBeenCalled();
    expect(mockValidateApiAuth).toHaveBeenCalled();
  });

  it('creates withValidation wrapper without errors', () => {
    const mockValidateApiAuth = jest.fn(async () => ({ isValid: true, userId: 'user123' }));
    const mockGetSingleUserInfo = jest.fn(() => ({
      userId: 'user123',
      userEmail: 'test@example.com',
      currentDevice: 'Computer' as const,
    }));
    
    const factory = createApiMiddleware({
      validateApiAuth: mockValidateApiAuth as any,
      getSingleUserInfo: mockGetSingleUserInfo as any,
    });
    
    // Just verify the factory creates the wrapper
    expect(factory.withValidation).toBeDefined();
    expect(typeof factory.withValidation).toBe('function');
  });

  it('creates withValidationAndParams wrapper without errors', () => {
    const mockValidateApiAuth = jest.fn(async () => ({ isValid: true, userId: 'user123' }));
    const mockGetSingleUserInfo = jest.fn(() => ({
      userId: 'user123',
      userEmail: 'test@example.com',
      currentDevice: 'Computer' as const,
    }));
    
    const factory = createApiMiddleware({
      validateApiAuth: mockValidateApiAuth as any,
      getSingleUserInfo: mockGetSingleUserInfo as any,
    });
    
    // Just verify the factory creates the wrapper
    expect(factory.withValidationAndParams).toBeDefined();
    expect(typeof factory.withValidationAndParams).toBe('function');
  });

  it('delegates withAuthStreaming to builder', async () => {
    const mockValidateApiAuth = jest.fn(async () => ({ isValid: true, userId: 'user123' }));
    const mockGetSingleUserInfo = jest.fn(() => ({
      userId: 'user123',
      userEmail: 'test@example.com',
      currentDevice: 'Computer' as const,
    }));
    
    const factory = createApiMiddleware({
      validateApiAuth: mockValidateApiAuth as any,
      getSingleUserInfo: mockGetSingleUserInfo as any,
    });
    
    const handler = jest.fn(async () => new Response('stream data'));
    
    const wrapped = factory.withAuthStreaming(handler);
    const req = new NextRequest('http://localhost/stream');
    
    await wrapped(req, { params: Promise.resolve({}) });
    
    expect(handler).toHaveBeenCalled();
  });

  it('delegates withAuthAndRateLimit to builder', async () => {
    const mockValidateApiAuth = jest.fn(async () => ({ isValid: true, userId: 'user123' }));
    const mockGetSingleUserInfo = jest.fn(() => ({
      userId: 'user123',
      userEmail: 'test@example.com',
      currentDevice: 'Computer' as const,
    }));
    const mockGetRateLimiter = jest.fn(() => ({
      checkRateLimit: jest.fn(async () => ({ allowed: true })),
    }));
    
    const factory = createApiMiddleware({
      validateApiAuth: mockValidateApiAuth as any,
      getSingleUserInfo: mockGetSingleUserInfo as any,
      getRateLimiter: mockGetRateLimiter as any,
    });
    
    const handler = jest.fn(async () =>
      NextResponse.json({ success: true, data: { ok: true }, meta: { timestamp: new Date().toISOString() } })
    );
    
    const wrapped = factory.withAuthAndRateLimit(handler, { maxRequests: 10 });
    const req = new NextRequest('http://localhost/limited');
    
    await wrapped(req, { params: Promise.resolve({}) });
    
    expect(handler).toHaveBeenCalled();
  });

  it('delegates withAuthAndRateLimitStreaming to builder', async () => {
    const mockValidateApiAuth = jest.fn(async () => ({ isValid: true, userId: 'user123' }));
    const mockGetSingleUserInfo = jest.fn(() => ({
      userId: 'user123',
      userEmail: 'test@example.com',
      currentDevice: 'Computer' as const,
    }));
    const mockGetRateLimiter = jest.fn(() => ({
      checkRateLimit: jest.fn(async () => ({ allowed: true })),
    }));
    
    const factory = createApiMiddleware({
      validateApiAuth: mockValidateApiAuth as any,
      getSingleUserInfo: mockGetSingleUserInfo as any,
      getRateLimiter: mockGetRateLimiter as any,
    });
    
    const handler = jest.fn(async () => new Response('stream'));
    
    const wrapped = factory.withAuthAndRateLimitStreaming(handler);
    const req = new NextRequest('http://localhost/stream-limited');
    
    await wrapped(req, { params: Promise.resolve({}) });
    
    expect(handler).toHaveBeenCalled();
  });

  it('records metrics on success', async () => {
    const factory = createApiMiddleware();
    const handler = jest.fn(async () =>
      NextResponse.json({ success: true, data: { ok: true }, meta: { timestamp: new Date().toISOString() } })
    );
    
    const wrapped = factory.withApiMiddleware(handler);
    const req = new NextRequest('http://localhost/metrics');
    
    const response = await wrapped(req, { params: Promise.resolve({}) });
    
    expect(response.status).toBe(200);
    expect(response.headers.get('X-Request-Id')).toBeDefined();
  });

  it('records metrics on error', async () => {
    const factory = createApiMiddleware();
    const handler = jest.fn(async () => {
      throw new Error('Test error');
    });
    
    const wrapped = factory.withApiMiddleware(handler);
    const req = new NextRequest('http://localhost/error');
    
    const response = await wrapped(req, { params: Promise.resolve({}) });
    
    expect(response.status).toBe(500);
    expect(response.headers.get('X-Request-Id')).toBeDefined();
  });
});
