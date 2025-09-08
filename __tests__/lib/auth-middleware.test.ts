/**
 * Authentication Middleware Test Suite
 * Simplified tests focusing on business logic
 */

// Mock dependencies first
jest.mock('@/lib/auth/device-fingerprint', () => ({
  verifyAuthSession: jest.fn(),
}));

jest.mock('@/lib/auth/totp-service', () => ({
  isTOTPSetup: jest.fn(),
}));

// Simple NextResponse mock
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    redirect: jest.fn(() => ({ type: 'redirect', cookies: { set: jest.fn(), delete: jest.fn() } })),
    json: jest.fn(() => ({ type: 'json', cookies: { set: jest.fn(), delete: jest.fn() } })),
    next: jest.fn(() => ({ type: 'next', cookies: { set: jest.fn(), delete: jest.fn() } })),
  },
}));

import { NextRequest } from 'next/server';
import { checkAuth, getClientIP, authMiddleware } from '@/lib/auth/auth-middleware';

import { verifyAuthSession } from '@/lib/auth/device-fingerprint';
import { isTOTPSetup } from '@/lib/auth/totp-service';

const mockVerifyAuthSession = verifyAuthSession as jest.Mock;
const mockIsTOTPSetup = isTOTPSetup as jest.Mock;

// Helper to create mock NextRequest
function createMockRequest(pathname: string = '/', cookies: Record<string, string> = {}, headers: Record<string, string> = {}): NextRequest {
  return {
    nextUrl: { pathname },
    url: `https://example.com${pathname}`,
    cookies: { get: (name: string) => cookies[name] ? { value: cookies[name] } : undefined },
    headers: { get: (name: string) => headers[name] || null },
  } as any as NextRequest;
}

describe('Authentication Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.BYPASS_AUTH;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', writable: true });
  });

  describe('checkAuth', () => {
    it('should allow bypass in development', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });
      process.env.BYPASS_AUTH = 'true';

      const request = createMockRequest('/');
      const result = await checkAuth(request);

      expect(result.isAuthenticated).toBe(true);
      expect(result.needsSetup).toBe(false);
      expect(result.needsVerification).toBe(false);
    });

    it('should require setup when TOTP not configured', async () => {
      mockIsTOTPSetup.mockResolvedValue(false);

      const request = createMockRequest('/dashboard');
      const result = await checkAuth(request);

      expect(result.isAuthenticated).toBe(false);
      expect(result.needsSetup).toBe(true);
    });

    it('should authenticate with valid session', async () => {
      mockIsTOTPSetup.mockResolvedValue(true);
      mockVerifyAuthSession.mockResolvedValue({ deviceId: 'device-123' });

      const request = createMockRequest('/', { 'auth-session-token': 'valid-token' });
      const result = await checkAuth(request);

      expect(result.isAuthenticated).toBe(true);
    });

    it('should reject invalid session', async () => {
      mockIsTOTPSetup.mockResolvedValue(true);
      mockVerifyAuthSession.mockResolvedValue(null);

      const request = createMockRequest('/', { 'auth-session-token': 'invalid-token' });
      const result = await checkAuth(request);

      expect(result.isAuthenticated).toBe(false);
      expect(result.needsVerification).toBe(true);
    });
  });

  describe('getClientIP', () => {
    it('should extract IP from x-forwarded-for', () => {
      const request = createMockRequest('/', {}, { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' });
      expect(getClientIP(request)).toBe('192.168.1.1');
    });

    it('should use x-real-ip when forwarded-for not present', () => {
      const request = createMockRequest('/', {}, { 'x-real-ip': '198.51.100.1' });
      expect(getClientIP(request)).toBe('198.51.100.1');
    });

    it('should return unknown when no IP available', () => {
      const request = createMockRequest('/', {}, {});
      expect(getClientIP(request)).toBe('unknown');
    });
  });

  describe('authMiddleware', () => {
    it('should handle authenticated requests', async () => {
      mockIsTOTPSetup.mockResolvedValue(true);
      mockVerifyAuthSession.mockResolvedValue({ deviceId: 'device-123' });

      const request = createMockRequest('/', { 'auth-session-token': 'valid-token' });
      
      // Test that the middleware doesn't throw and processes the request
      await expect(authMiddleware(request)).resolves.not.toThrow();
    });

    it('should handle bypass mode without errors', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });
      process.env.BYPASS_AUTH = 'true';

      const request = createMockRequest('/dashboard');
      
      // Test that bypass mode processes without throwing errors
      await expect(authMiddleware(request)).resolves.not.toThrow();
    });
  });
});
