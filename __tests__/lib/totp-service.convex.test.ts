/**
 * TOTP Service Integration Tests (Convex Backend)
 * These tests verify TOTP functionality with the Convex HTTP client
 * Note: Full integration tests for backup codes and encryption are covered
 * by security test suite in __tests__/security/auth-security.test.ts
 */

import { jest } from '@jest/globals';

// Mock the Convex HTTP client before importing totp-service
const mockClient = {
  query: jest.fn(),
  mutation: jest.fn(),
} as any;

jest.mock('@/lib/convex/httpClient', () => {
  const getAuthConfigRef = Symbol('auth.getAuthConfig');
  const upsertAuthConfigRef = Symbol('auth.upsertAuthConfig');
  const resetAuthConfigRef = Symbol('auth.resetAuthConfig');

  let authConfigState: any = null;

  const client = {
    query: jest.fn(async (ref: symbol, args?: any) => {
      if (ref === getAuthConfigRef) {
        return authConfigState;
      }
      throw new Error(`Unexpected query ref`);
    }),
    mutation: jest.fn(async (ref: symbol, args?: any) => {
      if (ref === upsertAuthConfigRef) {
        authConfigState = args;
        return authConfigState;
      }
      if (ref === resetAuthConfigRef) {
        authConfigState = null;
        return null;
      }
      throw new Error(`Unexpected mutation ref`);
    }),
  };

  return {
    getConvexHttpClient: () => client,
    anyApi: {
      auth: {
        getAuthConfig: getAuthConfigRef,
        upsertAuthConfig: upsertAuthConfigRef,
        resetAuthConfig: resetAuthConfigRef,
      },
    },
  };
});

describe('TOTP Service (Convex) - Unit Tests', () => {
  it('should export all required functions', async () => {
    const totpService = await import('@/lib/auth/totp-service');

    expect(typeof totpService.generateTOTPSetup).toBe('function');
    expect(typeof totpService.saveTOTPConfig).toBe('function');
    expect(typeof totpService.verifyTOTPToken).toBe('function');
    expect(typeof totpService.verifyBackupCode).toBe('function');
    expect(typeof totpService.isTOTPSetup).toBe('function');
    expect(typeof totpService.getUnusedBackupCodesCount).toBe('function');
    expect(typeof totpService.regenerateBackupCodes).toBe('function');
    expect(typeof totpService.performTOTPHealthCheck).toBe('function');
  });

  it('should have proper TypeScript interfaces', async () => {
    const totpService = await import('@/lib/auth/totp-service');

    // This verifies that the module exports the expected types
    const setup = await totpService.generateTOTPSetup();
    expect(setup).toHaveProperty('secret');
    expect(setup).toHaveProperty('qrCodeUrl');
    expect(setup).toHaveProperty('backupCodes');
    expect(setup).toHaveProperty('manualEntryKey');
  });
});
