/**
 * Authentication Middleware Test Suite
 * Tests all functions in auth-middleware.ts for complete coverage
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  checkAuth,
  createAuthResponse,
  createLogoutResponse,
  getClientIP,
  authMiddleware,
  AuthResult
} from '@/lib/auth/auth-middleware';

// Mock the external dependencies
jest.mock('@/lib/auth/device-fingerprint', () => ({
  verifyAuthSession: jest.fn(),
}));

jest.mock('@/lib/auth/totp-service', () => ({
  isTOTPSetup: jest.fn(),
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    redirect: jest.fn((url) => ({
      url: url.toString(),
      type: 'redirect',
      cookies: {
        set: jest.fn(),
        delete: jest.fn(),
      },
    })),
    json: jest.fn((data) => ({
      data,
      type: 'json',
      cookies: {
        set: jest.fn(),
        delete: jest.fn(),
      },
    })),
    next: jest.fn(() => ({ type: 'next' })),
  },
}));

const mockVerifyAuthSession = require('@/lib/auth/device-fingerprint').verifyAuthSession;
const mockIsTOTPSetup = require('@/lib/auth/totp-service').isTOTPSetup;
const mockNextResponse = NextResponse as jest.Mocked<typeof NextResponse>;

// Helper to create mock NextRequest
function createMockRequest(
  pathname: string = '/',
  cookies: Record<string, string> = {},
  headers: Record<string, string> = {},
  ip?: string
): NextRequest {
  return {
    nextUrl: { pathname },
    url: `https://example.com${pathname}`,
    cookies: {
      get: (name: string) => cookies[name] ? { value: cookies[name] } : undefined,
    },
    headers: {
      get: (name: string) => headers[name] || null,
    },
    ip,
  } as any as NextRequest;
}

describe('Authentication Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset environment variables
    delete process.env.BYPASS_AUTH;
    process.env.NODE_ENV = 'test';
  });

  describe('checkAuth', () => {
    describe('Development Bypass', () => {
      it('should allow bypass in development with BYPASS_AUTH=true', async () => {
        process.env.NODE_ENV = 'development';
        process.env.BYPASS_AUTH = 'true';

        const request = createMockRequest('/');
        const result = await checkAuth(request);

        expect(result).toEqual({
          isAuthenticated: true,
          needsSetup: false,
          needsVerification: false,
        });
        expect(mockIsTOTPSetup).not.toHaveBeenCalled();
      });

      it('should not allow bypass in production even with BYPASS_AUTH=true', async () => {
        process.env.NODE_ENV = 'production';
        process.env.BYPASS_AUTH = 'true';
        mockIsTOTPSetup.mockResolvedValue(true);

        const request = createMockRequest('/');
        const result = await checkAuth(request);

        expect(result.isAuthenticated).toBe(false);
        expect(mockIsTOTPSetup).toHaveBeenCalled();
      });

      it('should not allow bypass in development without BYPASS_AUTH', async () => {
        process.env.NODE_ENV = 'development';
        // BYPASS_AUTH not set
        mockIsTOTPSetup.mockResolvedValue(true);

        const request = createMockRequest('/');
        const result = await checkAuth(request);

        expect(result.isAuthenticated).toBe(false);
        expect(mockIsTOTPSetup).toHaveBeenCalled();
      });

      it('should not allow bypass in development with BYPASS_AUTH=false', async () => {
        process.env.NODE_ENV = 'development';
        process.env.BYPASS_AUTH = 'false';
        mockIsTOTPSetup.mockResolvedValue(true);

        const request = createMockRequest('/');
        const result = await checkAuth(request);

        expect(result.isAuthenticated).toBe(false);
        expect(mockIsTOTPSetup).toHaveBeenCalled();
      });
    });

    describe('TOTP Setup Required', () => {
      beforeEach(() => {
        mockIsTOTPSetup.mockResolvedValue(false);
      });

      it('should allow access to setup page when TOTP not configured', async () => {
        const request = createMockRequest('/auth/setup');
        const result = await checkAuth(request);

        expect(result).toEqual({
          isAuthenticated: false,
          needsSetup: true,
          needsVerification: false,
        });
      });

      it('should allow access to setup API when TOTP not configured', async () => {
        const request = createMockRequest('/api/auth/setup/generate');
        const result = await checkAuth(request);

        expect(result).toEqual({
          isAuthenticated: false,
          needsSetup: true,
          needsVerification: false,
        });
      });

      it('should redirect to setup from other pages when TOTP not configured', async () => {
        const request = createMockRequest('/dashboard');
        const result = await checkAuth(request);

        expect(result.isAuthenticated).toBe(false);
        expect(result.needsSetup).toBe(true);
        expect(result.needsVerification).toBe(false);
        expect(result.response).toBeDefined();
        expect(mockNextResponse.redirect).toHaveBeenCalledWith(
          new URL('/auth/setup', 'https://example.com/dashboard')
        );
      });

      it('should redirect to setup from root path when TOTP not configured', async () => {
        const request = createMockRequest('/');
        const result = await checkAuth(request);

        expect(result.response).toBeDefined();
        expect(mockNextResponse.redirect).toHaveBeenCalledWith(
          new URL('/auth/setup', 'https://example.com/')
        );
      });
    });

    describe('Valid Session', () => {
      beforeEach(() => {
        mockIsTOTPSetup.mockResolvedValue(true);
      });

      it('should authenticate with valid session token', async () => {
        const sessionToken = 'valid-session-token';
        mockVerifyAuthSession.mockResolvedValue({
          deviceId: 'device-123',
          name: 'Test Device',
          lastSeen: new Date(),
        });

        const request = createMockRequest('/', { 'auth-session-token': sessionToken });
        const result = await checkAuth(request);

        expect(result).toEqual({
          isAuthenticated: true,
          needsSetup: false,
          needsVerification: false,
        });
        expect(mockVerifyAuthSession).toHaveBeenCalledWith(sessionToken);
      });

      it('should reject invalid session token', async () => {
        const sessionToken = 'invalid-session-token';
        mockVerifyAuthSession.mockResolvedValue(null);

        const request = createMockRequest('/', { 'auth-session-token': sessionToken });
        const result = await checkAuth(request);

        expect(result.isAuthenticated).toBe(false);
        expect(result.needsVerification).toBe(true);
        expect(result.response).toBeDefined();
        expect(mockNextResponse.redirect).toHaveBeenCalledWith(
          new URL('/auth/verify', 'https://example.com/')
        );
      });

      it('should handle session verification errors gracefully', async () => {
        const sessionToken = 'error-session-token';
        mockVerifyAuthSession.mockRejectedValue(new Error('Session verification failed'));

        const request = createMockRequest('/', { 'auth-session-token': sessionToken });
        
        await expect(checkAuth(request)).rejects.toThrow('Session verification failed');
      });
    });

    describe('No Session Token', () => {
      beforeEach(() => {
        mockIsTOTPSetup.mockResolvedValue(true);
      });

      it('should allow access to verify page when no session', async () => {
        const request = createMockRequest('/auth/verify');
        const result = await checkAuth(request);

        expect(result).toEqual({
          isAuthenticated: false,
          needsSetup: false,
          needsVerification: true,
        });
      });

      it('should allow access to verify API when no session', async () => {
        const request = createMockRequest('/api/auth/verify');
        const result = await checkAuth(request);

        expect(result).toEqual({
          isAuthenticated: false,
          needsSetup: false,
          needsVerification: true,
        });
      });

      it('should redirect to verify from other pages when no session', async () => {
        const request = createMockRequest('/dashboard');
        const result = await checkAuth(request);

        expect(result.isAuthenticated).toBe(false);
        expect(result.needsVerification).toBe(true);
        expect(result.response).toBeDefined();
        expect(mockNextResponse.redirect).toHaveBeenCalledWith(
          new URL('/auth/verify', 'https://example.com/dashboard')
        );
      });
    });

    describe('Edge Cases', () => {
      it('should handle missing pathname gracefully', async () => {
        mockIsTOTPSetup.mockResolvedValue(true);
        const request = { 
          ...createMockRequest('/'), 
          nextUrl: { pathname: undefined },
          cookies: { get: () => undefined },
        } as any;

        const result = await checkAuth(request);

        expect(result.isAuthenticated).toBe(false);
        expect(result.needsVerification).toBe(true);
      });

      it('should handle TOTP setup check errors', async () => {
        mockIsTOTPSetup.mockRejectedValue(new Error('Database error'));

        const request = createMockRequest('/');
        
        await expect(checkAuth(request)).rejects.toThrow('Database error');
      });

      it('should handle empty session token', async () => {
        mockIsTOTPSetup.mockResolvedValue(true);
        const request = createMockRequest('/', { 'auth-session-token': '' });

        const result = await checkAuth(request);

        expect(result.isAuthenticated).toBe(false);
        expect(result.needsVerification).toBe(true);
        expect(mockVerifyAuthSession).not.toHaveBeenCalled();
      });
    });
  });

  describe('createAuthResponse', () => {
    it('should create JSON response with session cookie by default', () => {
      const sessionToken = 'test-session-token';
      const response = createAuthResponse(sessionToken);

      expect(mockNextResponse.json).toHaveBeenCalledWith({ success: true });
      expect(response.cookies.set).toHaveBeenCalledWith('auth-session-token', sessionToken, {
        httpOnly: true,
        secure: false, // test environment
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      });
    });

    it('should create redirect response when redirect URL provided', () => {
      const sessionToken = 'test-session-token';
      const redirectUrl = '/dashboard';
      
      const response = createAuthResponse(sessionToken, redirectUrl);

      expect(mockNextResponse.redirect).toHaveBeenCalledWith(
        new URL(redirectUrl, 'http://localhost:3000')
      );
      expect(response.cookies.set).toHaveBeenCalledWith('auth-session-token', sessionToken, expect.any(Object));
    });

    it('should use NEXTAUTH_URL when provided', () => {
      process.env.NEXTAUTH_URL = 'https://myapp.com';
      const sessionToken = 'test-session-token';
      const redirectUrl = '/dashboard';
      
      const response = createAuthResponse(sessionToken, redirectUrl);

      expect(mockNextResponse.redirect).toHaveBeenCalledWith(
        new URL(redirectUrl, 'https://myapp.com')
      );
      
      delete process.env.NEXTAUTH_URL;
    });

    it('should set secure cookie in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const sessionToken = 'test-session-token';
      const response = createAuthResponse(sessionToken);

      expect(response.cookies.set).toHaveBeenCalledWith('auth-session-token', sessionToken, {
        httpOnly: true,
        secure: true, // production environment
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle long session tokens', () => {
      const longSessionToken = 'a'.repeat(1000);
      const response = createAuthResponse(longSessionToken);

      expect(response.cookies.set).toHaveBeenCalledWith('auth-session-token', longSessionToken, expect.any(Object));
    });

    it('should handle special characters in session token', () => {
      const specialToken = 'token-with-special-chars_123.456+789=';
      const response = createAuthResponse(specialToken);

      expect(response.cookies.set).toHaveBeenCalledWith('auth-session-token', specialToken, expect.any(Object));
    });
  });

  describe('createLogoutResponse', () => {
    it('should create JSON response and delete session cookie by default', () => {
      const response = createLogoutResponse();

      expect(mockNextResponse.json).toHaveBeenCalledWith({ success: true });
      expect(response.cookies.delete).toHaveBeenCalledWith('auth-session-token');
    });

    it('should create redirect response when redirect URL provided', () => {
      const redirectUrl = '/';
      
      const response = createLogoutResponse(redirectUrl);

      expect(mockNextResponse.redirect).toHaveBeenCalledWith(
        new URL(redirectUrl, 'http://localhost:3000')
      );
      expect(response.cookies.delete).toHaveBeenCalledWith('auth-session-token');
    });

    it('should use NEXTAUTH_URL for logout redirect when provided', () => {
      process.env.NEXTAUTH_URL = 'https://myapp.com';
      const redirectUrl = '/login';
      
      const response = createLogoutResponse(redirectUrl);

      expect(mockNextResponse.redirect).toHaveBeenCalledWith(
        new URL(redirectUrl, 'https://myapp.com')
      );
      
      delete process.env.NEXTAUTH_URL;
    });

    it('should handle root redirect URL', () => {
      const response = createLogoutResponse('/');

      expect(mockNextResponse.redirect).toHaveBeenCalledWith(
        new URL('/', 'http://localhost:3000')
      );
      expect(response.cookies.delete).toHaveBeenCalledWith('auth-session-token');
    });

    it('should handle complex redirect URLs', () => {
      const redirectUrl = '/login?message=logged-out&return=/dashboard';
      
      const response = createLogoutResponse(redirectUrl);

      expect(mockNextResponse.redirect).toHaveBeenCalledWith(
        new URL(redirectUrl, 'http://localhost:3000')
      );
    });
  });

  describe('getClientIP', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = createMockRequest('/', {}, {
        'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1'
      });

      const ip = getClientIP(request);

      expect(ip).toBe('192.168.1.1');
    });

    it('should handle single IP in x-forwarded-for', () => {
      const request = createMockRequest('/', {}, {
        'x-forwarded-for': '203.0.113.1'
      });

      const ip = getClientIP(request);

      expect(ip).toBe('203.0.113.1');
    });

    it('should extract IP from x-real-ip header when x-forwarded-for not present', () => {
      const request = createMockRequest('/', {}, {
        'x-real-ip': '198.51.100.1'
      });

      const ip = getClientIP(request);

      expect(ip).toBe('198.51.100.1');
    });

    it('should prefer x-forwarded-for over x-real-ip', () => {
      const request = createMockRequest('/', {}, {
        'x-forwarded-for': '192.168.1.1',
        'x-real-ip': '10.0.0.1'
      });

      const ip = getClientIP(request);

      expect(ip).toBe('192.168.1.1');
    });

    it('should use request.ip when headers not present', () => {
      const request = createMockRequest('/', {}, {}, '127.0.0.1');

      const ip = getClientIP(request);

      expect(ip).toBe('127.0.0.1');
    });

    it('should return "unknown" when no IP information available', () => {
      const request = createMockRequest('/', {}, {});

      const ip = getClientIP(request);

      expect(ip).toBe('unknown');
    });

    it('should trim whitespace from forwarded IP', () => {
      const request = createMockRequest('/', {}, {
        'x-forwarded-for': '  192.168.1.1  , 10.0.0.1'
      });

      const ip = getClientIP(request);

      expect(ip).toBe('192.168.1.1');
    });

    it('should handle IPv6 addresses', () => {
      const request = createMockRequest('/', {}, {
        'x-forwarded-for': '2001:db8::1, ::1'
      });

      const ip = getClientIP(request);

      expect(ip).toBe('2001:db8::1');
    });

    it('should handle malformed forwarded header gracefully', () => {
      const request = createMockRequest('/', {}, {
        'x-forwarded-for': ''
      });

      const ip = getClientIP(request);

      expect(ip).toBe('unknown');
    });
  });

  describe('authMiddleware', () => {
    beforeEach(() => {
      mockIsTOTPSetup.mockResolvedValue(true);
    });

    it('should continue to route when authenticated', async () => {
      mockVerifyAuthSession.mockResolvedValue({ deviceId: 'device-123' });
      const request = createMockRequest('/', { 'auth-session-token': 'valid-token' });

      const response = await authMiddleware(request);

      expect(response).toEqual({ type: 'next' });
      expect(mockNextResponse.next).toHaveBeenCalled();
    });

    it('should return redirect response from checkAuth', async () => {
      mockIsTOTPSetup.mockResolvedValue(false);
      const request = createMockRequest('/dashboard');

      const response = await authMiddleware(request);

      expect(response).toBeDefined();
      expect(response.type).toBe('redirect');
      expect(mockNextResponse.redirect).toHaveBeenCalledWith(
        new URL('/auth/setup', 'https://example.com/dashboard')
      );
    });

    it('should return redirect response when session invalid', async () => {
      mockVerifyAuthSession.mockResolvedValue(null);
      const request = createMockRequest('/dashboard');

      const response = await authMiddleware(request);

      expect(response).toBeDefined();
      expect(response.type).toBe('redirect');
    });

    it('should handle authentication errors gracefully', async () => {
      mockIsTOTPSetup.mockRejectedValue(new Error('Auth check failed'));
      const request = createMockRequest('/');

      await expect(authMiddleware(request)).rejects.toThrow('Auth check failed');
    });

    it('should redirect to verify as fallback', async () => {
      // Mock checkAuth to return unauthenticated without response
      jest.doMock('@/lib/auth/auth-middleware', () => ({
        ...jest.requireActual('@/lib/auth/auth-middleware'),
        checkAuth: jest.fn().mockResolvedValue({
          isAuthenticated: false,
          needsSetup: false,
          needsVerification: true,
          // No response provided
        }),
      }));

      const request = createMockRequest('/');
      const response = await authMiddleware(request);

      expect(mockNextResponse.redirect).toHaveBeenCalledWith(
        new URL('/auth/verify', 'https://example.com/')
      );
    });

    it('should handle bypass mode correctly', async () => {
      process.env.NODE_ENV = 'development';
      process.env.BYPASS_AUTH = 'true';

      const request = createMockRequest('/dashboard');
      const response = await authMiddleware(request);

      expect(response).toEqual({ type: 'next' });
      expect(mockIsTOTPSetup).not.toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete authentication flow', async () => {
      // Setup TOTP configured
      mockIsTOTPSetup.mockResolvedValue(true);
      
      // No session token
      const request = createMockRequest('/dashboard');
      
      // Should redirect to verify
      const authResult = await checkAuth(request);
      expect(authResult.needsVerification).toBe(true);
      expect(authResult.response).toBeDefined();
      
      // Create auth response with session
      const authResponse = createAuthResponse('new-session-token', '/dashboard');
      expect(authResponse.cookies.set).toHaveBeenCalledWith('auth-session-token', 'new-session-token', expect.any(Object));
    });

    it('should handle TOTP setup flow', async () => {
      // TOTP not configured
      mockIsTOTPSetup.mockResolvedValue(false);
      
      const request = createMockRequest('/');
      const authResult = await checkAuth(request);
      
      expect(authResult.needsSetup).toBe(true);
      expect(authResult.response).toBeDefined();
    });

    it('should handle session invalidation and logout', async () => {
      mockIsTOTPSetup.mockResolvedValue(true);
      mockVerifyAuthSession.mockResolvedValue(null); // Invalid session
      
      const request = createMockRequest('/', { 'auth-session-token': 'expired-token' });
      const authResult = await checkAuth(request);
      
      expect(authResult.needsVerification).toBe(true);
      
      // Create logout response
      const logoutResponse = createLogoutResponse('/');
      expect(logoutResponse.cookies.delete).toHaveBeenCalledWith('auth-session-token');
    });

    it('should handle different environments correctly', async () => {
      const scenarios = [
        { env: 'development', bypass: 'true', shouldBypass: true },
        { env: 'development', bypass: 'false', shouldBypass: false },
        { env: 'production', bypass: 'true', shouldBypass: false },
        { env: 'test', bypass: 'true', shouldBypass: false },
      ];

      for (const scenario of scenarios) {
        jest.clearAllMocks();
        process.env.NODE_ENV = scenario.env;
        process.env.BYPASS_AUTH = scenario.bypass;
        mockIsTOTPSetup.mockResolvedValue(true);

        const request = createMockRequest('/');
        const result = await checkAuth(request);

        if (scenario.shouldBypass) {
          expect(result.isAuthenticated).toBe(true);
          expect(mockIsTOTPSetup).not.toHaveBeenCalled();
        } else {
          expect(mockIsTOTPSetup).toHaveBeenCalled();
        }
      }
    });

    it('should handle various IP extraction scenarios', () => {
      const scenarios = [
        {
          headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
          ip: undefined,
          expected: '192.168.1.1'
        },
        {
          headers: { 'x-real-ip': '10.0.0.1' },
          ip: undefined,
          expected: '10.0.0.1'
        },
        {
          headers: {},
          ip: '127.0.0.1',
          expected: '127.0.0.1'
        },
        {
          headers: {},
          ip: undefined,
          expected: 'unknown'
        }
      ];

      scenarios.forEach(({ headers, ip, expected }) => {
        const request = createMockRequest('/', {}, headers, ip);
        const result = getClientIP(request);
        expect(result).toBe(expected);
      });
    });
  });
});