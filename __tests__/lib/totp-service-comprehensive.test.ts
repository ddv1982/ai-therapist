/**
 * Comprehensive TOTP Service Test Suite
 * Tests all functions in totp-service.ts with complete coverage
 */

import {
  generateTOTPSetup,
  saveTOTPConfig,
  getTOTPDiagnostics,
  verifyTOTPToken,
  verifyBackupCode,
  isTOTPSetup,
  getUnusedBackupCodesCount,
  regenerateBackupCodes,
  TOTPSetupData,
  BackupCode
} from '@/lib/totp-service';
import { prisma } from '@/lib/db';
import { encryptSensitiveData, encryptBackupCodes } from '@/lib/crypto-utils';
import speakeasy from 'speakeasy';

// Mock the external dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    authConfig: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('@/lib/crypto-utils', () => ({
  encryptSensitiveData: jest.fn(),
  decryptSensitiveData: jest.fn(),
  encryptBackupCodes: jest.fn(),
  decryptBackupCodes: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock QRCode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockqrcode'),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockEncryptSensitiveData = encryptSensitiveData as jest.MockedFunction<typeof encryptSensitiveData>;
const mockEncryptBackupCodes = encryptBackupCodes as jest.MockedFunction<typeof encryptBackupCodes>;

describe('TOTP Service Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    mockEncryptSensitiveData.mockReturnValue('encrypted-secret');
    mockEncryptBackupCodes.mockReturnValue('encrypted-backup-codes');
  });

  describe('generateTOTPSetup', () => {
    it('should generate complete TOTP setup data', async () => {
      const setupData = await generateTOTPSetup();

      expect(setupData).toHaveProperty('secret');
      expect(setupData).toHaveProperty('qrCodeUrl');
      expect(setupData).toHaveProperty('backupCodes');
      expect(setupData).toHaveProperty('manualEntryKey');

      // Verify structure
      expect(typeof setupData.secret).toBe('string');
      expect(setupData.secret.length).toBeGreaterThan(20);
      expect(setupData.qrCodeUrl).toBe('data:image/png;base64,mockqrcode');
      expect(Array.isArray(setupData.backupCodes)).toBe(true);
      expect(setupData.backupCodes).toHaveLength(10);
      expect(setupData.manualEntryKey).toBe(setupData.secret);

      // Verify backup codes format
      setupData.backupCodes.forEach(code => {
        expect(code).toMatch(/^[A-Z0-9]{8}$/);
      });
    });

    it('should generate unique secrets on each call', async () => {
      const setup1 = await generateTOTPSetup();
      const setup2 = await generateTOTPSetup();

      expect(setup1.secret).not.toBe(setup2.secret);
      expect(setup1.backupCodes).not.toEqual(setup2.backupCodes);
    });

    it('should generate proper TOTP secret format', async () => {
      const setupData = await generateTOTPSetup();
      
      // Should be valid base32
      expect(setupData.secret).toMatch(/^[A-Z2-7]+$/);
      expect(setupData.secret.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe('saveTOTPConfig', () => {
    it('should save new TOTP config when none exists', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue(null);
      
      const secret = 'JBSWY3DPEHPK3PXP';
      const backupCodes = ['ABC12345', 'DEF67890'];

      await saveTOTPConfig(secret, backupCodes);

      expect(mockEncryptSensitiveData).toHaveBeenCalledWith(secret);
      expect(mockEncryptBackupCodes).toHaveBeenCalledWith([
        { code: 'ABC12345', used: false },
        { code: 'DEF67890', used: false }
      ]);

      expect(mockPrisma.authConfig.create).toHaveBeenCalledWith({
        data: {
          secret: 'encrypted-secret',
          backupCodes: 'encrypted-backup-codes',
          isSetup: true,
        },
      });
    });

    it('should replace existing TOTP config', async () => {
      const existingConfig = { id: '123', secret: 'old', backupCodes: 'old', isSetup: true };
      mockPrisma.authConfig.findFirst.mockResolvedValue(existingConfig);

      const secret = 'JBSWY3DPEHPK3PXP';
      const backupCodes = ['NEW12345'];

      await saveTOTPConfig(secret, backupCodes);

      expect(mockPrisma.authConfig.delete).toHaveBeenCalledWith({
        where: { id: '123' }
      });

      expect(mockPrisma.authConfig.create).toHaveBeenCalledWith({
        data: {
          secret: 'encrypted-secret',
          backupCodes: 'encrypted-backup-codes',
          isSetup: true,
        },
      });
    });

    it('should handle multiple backup codes correctly', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue(null);
      
      const backupCodes = Array.from({ length: 10 }, (_, i) => `CODE${i.toString().padStart(4, '0')}`);

      await saveTOTPConfig('testsecret', backupCodes);

      const expectedBackupData = backupCodes.map(code => ({ code, used: false }));
      expect(mockEncryptBackupCodes).toHaveBeenCalledWith(expectedBackupData);
    });
  });

  describe('isTOTPSetup', () => {
    it('should return true when TOTP is set up', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue({
        id: '123',
        secret: 'encrypted',
        backupCodes: 'encrypted',
        isSetup: true
      });

      const result = await isTOTPSetup();
      expect(result).toBe(true);
    });

    it('should return false when no config exists', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue(null);

      const result = await isTOTPSetup();
      expect(result).toBe(false);
    });

    it('should return false when config exists but not set up', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue({
        id: '123',
        secret: 'encrypted',
        backupCodes: 'encrypted',
        isSetup: false
      });

      const result = await isTOTPSetup();
      expect(result).toBe(false);
    });
  });

  describe('getTOTPDiagnostics', () => {
    beforeEach(() => {
      const { decryptSensitiveData } = require('@/lib/crypto-utils');
      decryptSensitiveData.mockReturnValue('JBSWY3DPEHPK3PXP');
    });

    it('should return diagnostics when TOTP is configured', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue({
        id: '123',
        secret: 'encrypted-secret',
        backupCodes: 'encrypted-codes',
        isSetup: true
      });

      const result = await getTOTPDiagnostics();

      expect(result).toHaveProperty('currentTime');
      expect(result).toHaveProperty('currentToken');
      expect(result).toHaveProperty('isValidTime', true);
      expect(typeof result.currentTime).toBe('number');
      expect(result.currentToken).toMatch(/^\d{6}$/);
    });

    it('should validate provided token when given', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue({
        id: '123',
        secret: 'encrypted-secret',
        backupCodes: 'encrypted-codes',
        isSetup: true
      });

      const currentTime = Math.floor(Date.now() / 1000);
      const validToken = speakeasy.totp({
        secret: 'JBSWY3DPEHPK3PXP',
        encoding: 'base32',
        time: currentTime,
      });

      const result = await getTOTPDiagnostics(validToken);

      expect(result.providedToken).toBe(validToken);
      expect(result.providedTokenValid).toBe(true);
    });

    it('should throw error when TOTP not configured', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue(null);

      await expect(getTOTPDiagnostics()).rejects.toThrow('TOTP not configured');
    });

    it('should handle invalid provided tokens', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue({
        id: '123',
        secret: 'encrypted-secret',
        backupCodes: 'encrypted-codes',
        isSetup: true
      });

      const result = await getTOTPDiagnostics('000000');

      expect(result.providedToken).toBe('000000');
      expect(result.providedTokenValid).toBe(false);
    });
  });

  describe('verifyTOTPToken', () => {
    beforeEach(() => {
      const { decryptSensitiveData } = require('@/lib/crypto-utils');
      decryptSensitiveData.mockReturnValue('JBSWY3DPEHPK3PXP');
    });

    it('should verify valid TOTP token', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue({
        id: '123',
        secret: 'encrypted-secret',
        backupCodes: 'encrypted-codes',
        isSetup: true
      });

      const currentTime = Math.floor(Date.now() / 1000);
      const validToken = speakeasy.totp({
        secret: 'JBSWY3DPEHPK3PXP',
        encoding: 'base32',
        time: currentTime,
      });

      const result = await verifyTOTPToken(validToken);
      expect(result).toBe(true);
    });

    it('should reject invalid TOTP token', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue({
        id: '123',
        secret: 'encrypted-secret',
        backupCodes: 'encrypted-codes',
        isSetup: true
      });

      const result = await verifyTOTPToken('000000');
      expect(result).toBe(false);
    });

    it('should return false when TOTP not set up', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue(null);

      const result = await verifyTOTPToken('123456');
      expect(result).toBe(false);
    });

    it('should handle token with whitespace', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue({
        id: '123',
        secret: 'encrypted-secret',
        backupCodes: 'encrypted-codes',
        isSetup: true
      });

      const currentTime = Math.floor(Date.now() / 1000);
      const validToken = speakeasy.totp({
        secret: 'JBSWY3DPEHPK3PXP',
        encoding: 'base32',
        time: currentTime,
      });

      const result = await verifyTOTPToken(` ${validToken} `);
      expect(result).toBe(true);
    });

    it('should reject malformed tokens', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue({
        id: '123',
        secret: 'encrypted-secret',
        backupCodes: 'encrypted-codes',
        isSetup: true
      });

      const result1 = await verifyTOTPToken('12345'); // too short
      const result2 = await verifyTOTPToken('1234567'); // too long
      const result3 = await verifyTOTPToken('12345a'); // non-numeric

      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(false);
    });

    it('should accept tokens within time window', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue({
        id: '123',
        secret: 'encrypted-secret',
        backupCodes: 'encrypted-codes',
        isSetup: true
      });

      const currentTime = Math.floor(Date.now() / 1000);
      const pastToken = speakeasy.totp({
        secret: 'JBSWY3DPEHPK3PXP',
        encoding: 'base32',
        time: currentTime - 30, // 1 step back
      });

      const result = await verifyTOTPToken(pastToken);
      expect(result).toBe(true);
    });
  });

  describe('verifyBackupCode', () => {
    beforeEach(() => {
      const { decryptBackupCodes } = require('@/lib/crypto-utils');
      decryptBackupCodes.mockReturnValue([
        { code: 'ABCD1234', used: false },
        { code: 'EFGH5678', used: true, usedAt: new Date('2024-01-01') },
        { code: 'IJKL9012', used: false }
      ]);
    });

    it('should verify and consume unused backup code', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue({
        id: '123',
        secret: 'encrypted-secret',
        backupCodes: 'encrypted-codes',
        isSetup: true
      });

      const result = await verifyBackupCode('ABCD1234');

      expect(result).toBe(true);
      expect(mockPrisma.authConfig.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: { backupCodes: 'encrypted-backup-codes' }
      });

      // Check that backup code was marked as used
      const updatedCodes = mockEncryptBackupCodes.mock.calls[0][0] as BackupCode[];
      const usedCode = updatedCodes.find(c => c.code === 'ABCD1234');
      expect(usedCode?.used).toBe(true);
      expect(usedCode?.usedAt).toBeInstanceOf(Date);
    });

    it('should reject already used backup code', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue({
        id: '123',
        secret: 'encrypted-secret',
        backupCodes: 'encrypted-codes',
        isSetup: true
      });

      const result = await verifyBackupCode('EFGH5678');

      expect(result).toBe(false);
      expect(mockPrisma.authConfig.update).not.toHaveBeenCalled();
    });

    it('should reject non-existent backup code', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue({
        id: '123',
        secret: 'encrypted-secret',
        backupCodes: 'encrypted-codes',
        isSetup: true
      });

      const result = await verifyBackupCode('INVALID1');

      expect(result).toBe(false);
      expect(mockPrisma.authConfig.update).not.toHaveBeenCalled();
    });

    it('should handle case insensitive backup codes', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue({
        id: '123',
        secret: 'encrypted-secret',
        backupCodes: 'encrypted-codes',
        isSetup: true
      });

      const result = await verifyBackupCode('abcd1234');

      expect(result).toBe(true);
    });

    it('should return false when TOTP not set up', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue(null);

      const result = await verifyBackupCode('ABCD1234');

      expect(result).toBe(false);
    });

    it('should return false when decryption fails', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue({
        id: '123',
        secret: 'encrypted-secret',
        backupCodes: 'encrypted-codes',
        isSetup: true
      });

      const { decryptBackupCodes } = require('@/lib/crypto-utils');
      decryptBackupCodes.mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const result = await verifyBackupCode('ABCD1234');

      expect(result).toBe(false);
    });
  });

  describe('getUnusedBackupCodesCount', () => {
    beforeEach(() => {
      const { decryptBackupCodes } = require('@/lib/crypto-utils');
      decryptBackupCodes.mockReturnValue([
        { code: 'ABCD1234', used: false },
        { code: 'EFGH5678', used: true, usedAt: new Date() },
        { code: 'IJKL9012', used: false },
        { code: 'MNOP3456', used: false }
      ]);
    });

    it('should count unused backup codes', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue({
        id: '123',
        secret: 'encrypted-secret',
        backupCodes: 'encrypted-codes',
        isSetup: true
      });

      const count = await getUnusedBackupCodesCount();

      expect(count).toBe(3); // 3 unused out of 4 total
    });

    it('should return 0 when TOTP not set up', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue(null);

      const count = await getUnusedBackupCodesCount();

      expect(count).toBe(0);
    });

    it('should return 0 when decryption fails', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue({
        id: '123',
        secret: 'encrypted-secret',
        backupCodes: 'encrypted-codes',
        isSetup: true
      });

      const { decryptBackupCodes } = require('@/lib/crypto-utils');
      decryptBackupCodes.mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const count = await getUnusedBackupCodesCount();

      expect(count).toBe(0);
    });

    it('should handle empty backup codes array', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue({
        id: '123',
        secret: 'encrypted-secret',
        backupCodes: 'encrypted-codes',
        isSetup: true
      });

      const { decryptBackupCodes } = require('@/lib/crypto-utils');
      decryptBackupCodes.mockReturnValue([]);

      const count = await getUnusedBackupCodesCount();

      expect(count).toBe(0);
    });
  });

  describe('regenerateBackupCodes', () => {
    it('should generate new backup codes', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue({
        id: '123',
        secret: 'encrypted-secret',
        backupCodes: 'old-codes',
        isSetup: true
      });

      const newCodes = await regenerateBackupCodes();

      expect(Array.isArray(newCodes)).toBe(true);
      expect(newCodes).toHaveLength(10);

      // Verify format
      newCodes.forEach(code => {
        expect(code).toMatch(/^[A-Z0-9]{8}$/);
      });

      // Verify unique codes
      const uniqueCodes = new Set(newCodes);
      expect(uniqueCodes.size).toBe(10);

      expect(mockPrisma.authConfig.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: { backupCodes: 'encrypted-backup-codes' }
      });

      // Check that codes were encrypted with proper format
      const encryptedData = mockEncryptBackupCodes.mock.calls[0][0] as BackupCode[];
      expect(encryptedData).toHaveLength(10);
      encryptedData.forEach(item => {
        expect(item.used).toBe(false);
        expect(item.code).toMatch(/^[A-Z0-9]{8}$/);
        expect(newCodes).toContain(item.code);
      });
    });

    it('should throw error when TOTP not set up', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue(null);

      await expect(regenerateBackupCodes()).rejects.toThrow('TOTP not set up');
    });

    it('should throw error when config exists but not set up', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue({
        id: '123',
        secret: 'encrypted-secret',
        backupCodes: 'old-codes',
        isSetup: false
      });

      await expect(regenerateBackupCodes()).rejects.toThrow('TOTP not set up');
    });

    it('should replace existing backup codes completely', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue({
        id: '123',
        secret: 'encrypted-secret',
        backupCodes: 'old-codes',
        isSetup: true
      });

      const newCodes1 = await regenerateBackupCodes();
      jest.clearAllMocks();
      mockEncryptBackupCodes.mockReturnValue('encrypted-backup-codes-2');
      
      const newCodes2 = await regenerateBackupCodes();

      // Codes should be different
      expect(newCodes1).not.toEqual(newCodes2);
      expect(mockPrisma.authConfig.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: { backupCodes: 'encrypted-backup-codes-2' }
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete TOTP setup flow', async () => {
      // Setup phase
      const setupData = await generateTOTPSetup();
      expect(setupData.backupCodes).toHaveLength(10);

      // Save phase
      mockPrisma.authConfig.findFirst.mockResolvedValue(null);
      await saveTOTPConfig(setupData.secret, setupData.backupCodes);

      // Verification phase
      mockPrisma.authConfig.findFirst.mockResolvedValue({
        id: '123',
        secret: 'encrypted-secret',
        backupCodes: 'encrypted-codes',
        isSetup: true
      });

      const isSetup = await isTOTPSetup();
      expect(isSetup).toBe(true);
    });

    it('should handle backup code regeneration flow', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue({
        id: '123',
        secret: 'encrypted-secret',
        backupCodes: 'old-codes',
        isSetup: true
      });

      const initialCount = await getUnusedBackupCodesCount();
      const newCodes = await regenerateBackupCodes();
      
      expect(newCodes).toHaveLength(10);
      expect(mockPrisma.authConfig.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: { backupCodes: 'encrypted-backup-codes' }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      mockPrisma.authConfig.findFirst.mockRejectedValue(new Error('Database connection failed'));

      await expect(isTOTPSetup()).rejects.toThrow('Database connection failed');
      await expect(verifyTOTPToken('123456')).rejects.toThrow('Database connection failed');
      await expect(verifyBackupCode('ABCD1234')).rejects.toThrow('Database connection failed');
    });

    it('should handle encryption errors in verification', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue({
        id: '123',
        secret: 'corrupted-data',
        backupCodes: 'corrupted-data',
        isSetup: true
      });

      const { decryptSensitiveData } = require('@/lib/crypto-utils');
      decryptSensitiveData.mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      await expect(verifyTOTPToken('123456')).rejects.toThrow('Decryption failed');
      await expect(getTOTPDiagnostics()).rejects.toThrow('Decryption failed');
    });

    it('should handle malformed backup codes data', async () => {
      mockPrisma.authConfig.findFirst.mockResolvedValue({
        id: '123',
        secret: 'encrypted-secret',
        backupCodes: 'corrupted-data',
        isSetup: true
      });

      const { decryptBackupCodes } = require('@/lib/crypto-utils');
      decryptBackupCodes.mockImplementation(() => {
        throw new Error('Malformed data');
      });

      const result = await verifyBackupCode('ABCD1234');
      expect(result).toBe(false);
    });
  });
});