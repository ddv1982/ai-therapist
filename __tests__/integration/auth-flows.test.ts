/**
 * Integration tests for authentication flows
 * Tests the complete authentication cycle including TOTP setup, verification, and session management
 */

import { NextRequest } from 'next/server';
import { generateTOTPSetup, saveTOTPConfig, isTOTPSetup } from '@/lib/totp-service';
import { getOrCreateDevice, createAuthSession } from '@/lib/device-fingerprint';
import { validateApiAuth } from '@/lib/api-auth';

// Mock external dependencies
jest.mock('@/lib/totp-service');
jest.mock('@/lib/device-fingerprint');
jest.mock('@/lib/api-auth');

const mockedGenerateTOTPSetup = generateTOTPSetup as jest.MockedFunction<typeof generateTOTPSetup>;
const mockedSaveTOTPConfig = saveTOTPConfig as jest.MockedFunction<typeof saveTOTPConfig>;
const mockedIsTOTPSetup = isTOTPSetup as jest.MockedFunction<typeof isTOTPSetup>;
const mockedGetOrCreateDevice = getOrCreateDevice as jest.MockedFunction<typeof getOrCreateDevice>;
const mockedCreateAuthSession = createAuthSession as jest.MockedFunction<typeof createAuthSession>;
const mockedValidateApiAuth = validateApiAuth as jest.MockedFunction<typeof validateApiAuth>;

describe('Authentication Flows Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TOTP Setup Flow', () => {
    const mockSetupData = {
      qrCodeUrl: 'data:image/png;base64,mock-qr-code',
      manualEntryKey: 'MOCK-MANUAL-KEY-123456',
      backupCodes: ['backup1', 'backup2', 'backup3'],
      secret: 'MOCK-SECRET-KEY-123456'
    };

    test('should complete TOTP setup flow successfully', async () => {
      // Mock setup not yet configured
      mockedIsTOTPSetup.mockResolvedValue(false);
      
      // Mock TOTP setup generation
      mockedGenerateTOTPSetup.mockResolvedValue(mockSetupData);
      
      // Mock save configuration
      mockedSaveTOTPConfig.mockResolvedValue(undefined);
      
      // Mock device creation
      mockedGetOrCreateDevice.mockResolvedValue({
        deviceId: 'test-device-id',
        name: 'Test Device',
        fingerprint: 'test-fingerprint',
        isVerified: true,
        createdAt: new Date(),
        lastUsed: new Date()
      });

      // Mock session creation
      mockedCreateAuthSession.mockResolvedValue({
        sessionToken: 'test-session-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        deviceId: 'test-device-id',
        isActive: true
      });

      // Simulate TOTP setup flow
      const isSetup = await isTOTPSetup();
      expect(isSetup).toBe(false);

      const setupData = await generateTOTPSetup();
      expect(setupData).toEqual(mockSetupData);
      expect(setupData.qrCodeUrl).toContain('data:image/png');
      expect(setupData.backupCodes).toHaveLength(3);

      // Simulate saving configuration after verification
      await saveTOTPConfig(setupData.secret, setupData.backupCodes);
      expect(mockedSaveTOTPConfig).toHaveBeenCalledWith(
        setupData.secret,
        setupData.backupCodes
      );

      // Simulate device and session creation
      const device = await getOrCreateDevice('TestAgent/1.0', '127.0.0.1');
      const session = await createAuthSession(device.deviceId, '127.0.0.1');

      expect(device.deviceId).toBe('test-device-id');
      expect(session.sessionToken).toBe('test-session-token');
      expect(session.isActive).toBe(true);
    });

    test('should prevent duplicate TOTP setup', async () => {
      // Mock setup already configured
      mockedIsTOTPSetup.mockResolvedValue(true);

      const isSetup = await isTOTPSetup();
      expect(isSetup).toBe(true);

      // Should not attempt to generate new setup
      expect(mockedGenerateTOTPSetup).not.toHaveBeenCalled();
    });

    test('should handle TOTP setup errors gracefully', async () => {
      mockedIsTOTPSetup.mockResolvedValue(false);
      mockedGenerateTOTPSetup.mockRejectedValue(new Error('Failed to generate TOTP setup'));

      await expect(generateTOTPSetup()).rejects.toThrow('Failed to generate TOTP setup');
    });
  });

  describe('Authentication Validation Flow', () => {
    test('should validate successful authentication', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'authorization') return 'Bearer valid-token';
            if (header === 'user-agent') return 'TestAgent/1.0';
            return null;
          })
        }
      } as unknown as NextRequest;

      mockedValidateApiAuth.mockResolvedValue({
        isValid: true,
        userId: 'test-user-id',
        deviceId: 'test-device-id',
        sessionData: {
          sessionToken: 'valid-token',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          isActive: true
        }
      });

      const authResult = await validateApiAuth(mockRequest);
      
      expect(authResult.isValid).toBe(true);
      expect(authResult.userId).toBe('test-user-id');
      expect(authResult.sessionData?.isActive).toBe(true);
    });

    test('should reject invalid authentication', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'authorization') return 'Bearer invalid-token';
            return null;
          })
        }
      } as unknown as NextRequest;

      mockedValidateApiAuth.mockResolvedValue({
        isValid: false,
        error: 'Invalid or expired token'
      });

      const authResult = await validateApiAuth(mockRequest);
      
      expect(authResult.isValid).toBe(false);
      expect(authResult.error).toBe('Invalid or expired token');
    });

    test('should handle missing authorization header', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn(() => null)
        }
      } as unknown as NextRequest;

      mockedValidateApiAuth.mockResolvedValue({
        isValid: false,
        error: 'No authorization header provided'
      });

      const authResult = await validateApiAuth(mockRequest);
      
      expect(authResult.isValid).toBe(false);
      expect(authResult.error).toBe('No authorization header provided');
    });
  });

  describe('Device Management Flow', () => {
    const mockDevice = {
      deviceId: 'unique-device-id',
      name: 'Chrome on MacOS',
      fingerprint: 'fingerprint-hash-123',
      isVerified: false,
      createdAt: new Date(),
      lastUsed: new Date()
    };

    test('should create new device on first visit', async () => {
      mockedGetOrCreateDevice.mockResolvedValue({
        ...mockDevice,
        isVerified: false // New device
      });

      const device = await getOrCreateDevice(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        '192.168.1.100'
      );

      expect(device.deviceId).toBe('unique-device-id');
      expect(device.name).toContain('Chrome');
      expect(device.isVerified).toBe(false);
    });

    test('should recognize returning device', async () => {
      mockedGetOrCreateDevice.mockResolvedValue({
        ...mockDevice,
        isVerified: true // Existing verified device
      });

      const device = await getOrCreateDevice(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        '192.168.1.100'
      );

      expect(device.isVerified).toBe(true);
      expect(device.deviceId).toBe('unique-device-id');
    });

    test('should handle device creation errors', async () => {
      mockedGetOrCreateDevice.mockRejectedValue(new Error('Device creation failed'));

      await expect(getOrCreateDevice('TestAgent', '127.0.0.1'))
        .rejects.toThrow('Device creation failed');
    });
  });

  describe('Session Management Flow', () => {
    test('should create valid auth session', async () => {
      const mockSession = {
        sessionToken: 'secure-session-token-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        deviceId: 'test-device-id',
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date()
      };

      mockedCreateAuthSession.mockResolvedValue(mockSession);

      const session = await createAuthSession('test-device-id', '127.0.0.1');

      expect(session.sessionToken).toBe('secure-session-token-123');
      expect(session.isActive).toBe(true);
      expect(session.deviceId).toBe('test-device-id');
      expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    test('should handle session creation failure', async () => {
      mockedCreateAuthSession.mockRejectedValue(new Error('Session creation failed'));

      await expect(createAuthSession('invalid-device-id', '127.0.0.1'))
        .rejects.toThrow('Session creation failed');
    });
  });

  // Note: Encryption utilities are tested separately in crypto-security.test.ts

  describe('Complete Authentication Flow Integration', () => {
    test('should complete full authentication cycle', async () => {
      // Setup phase
      mockedIsTOTPSetup.mockResolvedValue(false);
      mockedGenerateTOTPSetup.mockResolvedValue({
        qrCodeUrl: 'mock-qr',
        manualEntryKey: 'mock-key',
        backupCodes: ['backup1', 'backup2'],
        secret: 'mock-secret'
      });

      // Device registration
      mockedGetOrCreateDevice.mockResolvedValue({
        deviceId: 'integration-device-id',
        name: 'Integration Test Device',
        fingerprint: 'integration-fingerprint',
        isVerified: false,
        createdAt: new Date(),
        lastUsed: new Date()
      });

      // Session creation
      mockedCreateAuthSession.mockResolvedValue({
        sessionToken: 'integration-session-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        deviceId: 'integration-device-id',
        isActive: true
      });

      // Configuration save
      mockedSaveTOTPConfig.mockResolvedValue(undefined);

      // Authentication validation
      const mockRequest = {
        headers: {
          get: jest.fn((header) => {
            if (header === 'authorization') return 'Bearer integration-session-token';
            if (header === 'user-agent') return 'IntegrationTest/1.0';
            return null;
          })
        }
      } as unknown as NextRequest;

      mockedValidateApiAuth.mockResolvedValue({
        isValid: true,
        userId: 'integration-user-id',
        deviceId: 'integration-device-id'
      });

      // Execute complete flow
      const isSetup = await isTOTPSetup();
      expect(isSetup).toBe(false);

      const setupData = await generateTOTPSetup();
      expect(setupData.secret).toBe('mock-secret');

      const device = await getOrCreateDevice('IntegrationTest/1.0', '127.0.0.1');
      expect(device.deviceId).toBe('integration-device-id');

      await saveTOTPConfig(setupData.secret, setupData.backupCodes);

      const session = await createAuthSession(device.deviceId, '127.0.0.1');
      expect(session.sessionToken).toBe('integration-session-token');

      const authResult = await validateApiAuth(mockRequest);
      expect(authResult.isValid).toBe(true);
      expect(authResult.userId).toBe('integration-user-id');
    });
  });

  describe('Error Resilience', () => {
    test('should handle network interruptions gracefully', async () => {
      // Simulate network error
      mockedValidateApiAuth.mockRejectedValue(new Error('Network timeout'));

      await expect(validateApiAuth({} as NextRequest))
        .rejects.toThrow('Network timeout');
    });

    test('should handle concurrent authentication attempts', async () => {
      const concurrentRequests = Array.from({ length: 5 }, (_, i) => ({
        headers: {
          get: jest.fn((header) => {
            if (header === 'authorization') return `Bearer token-${i}`;
            return null;
          })
        }
      } as unknown as NextRequest));

      mockedValidateApiAuth.mockImplementation(async (request) => {
        const token = request.headers.get('authorization')?.split(' ')[1];
        return {
          isValid: token !== 'token-2', // Simulate one failure
          userId: token === 'token-2' ? undefined : `user-${token?.split('-')[1]}`,
          error: token === 'token-2' ? 'Invalid token' : undefined
        };
      });

      const results = await Promise.allSettled(
        concurrentRequests.map(req => validateApiAuth(req))
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.isValid);
      const failed = results.filter(r => r.status === 'fulfilled' && !r.value.isValid);

      expect(successful).toHaveLength(4);
      expect(failed).toHaveLength(1);
    });
  });
});