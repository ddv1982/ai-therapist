import {
  generateSecureUUID,
  generateSecureRandomString,
  generateSecureBytes,
  generateSecureHex,
  generateSessionToken,
  generateRequestId,
  generateBackupCodes,
  isCryptoAvailable,
  getCryptoCapabilities,
} from '@/lib/auth/crypto-secure';

describe('crypto-secure', () => {
  describe('generateSecureUUID', () => {
    it('generates a valid UUID v4 format', () => {
      const uuid = generateSecureUUID();
      
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('generates unique UUIDs', () => {
      const uuid1 = generateSecureUUID();
      const uuid2 = generateSecureUUID();
      
      expect(uuid1).not.toBe(uuid2);
    });

    it('uses crypto.randomUUID when available', () => {
      const originalRandomUUID = crypto.randomUUID;
      const mockRandomUUID = jest.fn(() => '12345678-1234-4123-8123-123456789012');
      (crypto as any).randomUUID = mockRandomUUID;
      
      const uuid = generateSecureUUID();
      
      expect(mockRandomUUID).toHaveBeenCalled();
      expect(uuid).toBe('12345678-1234-4123-8123-123456789012');
      
      (crypto as any).randomUUID = originalRandomUUID;
    });

    it('falls back to getRandomValues when randomUUID not available', () => {
      const originalRandomUUID = crypto.randomUUID;
      delete (crypto as any).randomUUID;
      
      const uuid = generateSecureUUID();
      
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      
      (crypto as any).randomUUID = originalRandomUUID;
    });

    it('throws error when crypto is not available', () => {
      const originalCrypto = global.crypto;
      delete (global as any).crypto;
      
      expect(() => generateSecureUUID()).toThrow('Cryptographically secure');
      
      (global as any).crypto = originalCrypto;
    });
  });

  describe('generateSecureRandomString', () => {
    it('generates string of specified length', () => {
      const str = generateSecureRandomString(16);
      
      expect(str).toHaveLength(16);
    });

    it('generates string with default length', () => {
      const str = generateSecureRandomString();
      
      expect(str).toHaveLength(32);
    });

    it('uses only characters from default charset', () => {
      const str = generateSecureRandomString(100);
      
      expect(str).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('uses custom charset when provided', () => {
      const str = generateSecureRandomString(20, '01');
      
      expect(str).toMatch(/^[01]+$/);
      expect(str).toHaveLength(20);
    });

    it('generates unique strings', () => {
      const str1 = generateSecureRandomString(32);
      const str2 = generateSecureRandomString(32);
      
      expect(str1).not.toBe(str2);
    });

    it('throws error when crypto is not available', () => {
      const originalCrypto = global.crypto;
      delete (global as any).crypto;
      
      expect(() => generateSecureRandomString()).toThrow('Cryptographically secure');
      
      (global as any).crypto = originalCrypto;
    });
  });

  describe('generateSecureBytes', () => {
    it('generates base64 string of appropriate length', () => {
      const bytes = generateSecureBytes(32);
      
      expect(typeof bytes).toBe('string');
      expect(bytes.length).toBeGreaterThan(0);
    });

    it('uses default length when not specified', () => {
      const bytes = generateSecureBytes();
      
      expect(typeof bytes).toBe('string');
      expect(bytes).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it('generates unique byte strings', () => {
      const bytes1 = generateSecureBytes(32);
      const bytes2 = generateSecureBytes(32);
      
      expect(bytes1).not.toBe(bytes2);
    });

    it('works in browser environment', () => {
      const originalBuffer = global.Buffer;
      delete (global as any).Buffer;
      
      const bytes = generateSecureBytes(16);
      
      expect(typeof bytes).toBe('string');
      
      (global as any).Buffer = originalBuffer;
    });
  });

  describe('generateSecureHex', () => {
    it('generates hex string of specified length', () => {
      const hex = generateSecureHex(16);
      
      expect(hex).toMatch(/^[0-9a-f]+$/);
      expect(hex).toHaveLength(32); // 16 bytes = 32 hex chars
    });

    it('generates hex string with default length', () => {
      const hex = generateSecureHex();
      
      expect(hex).toMatch(/^[0-9a-f]+$/);
      expect(hex).toHaveLength(64); // 32 bytes default
    });

    it('generates unique hex strings', () => {
      const hex1 = generateSecureHex(16);
      const hex2 = generateSecureHex(16);
      
      expect(hex1).not.toBe(hex2);
    });
  });

  describe('generateSessionToken', () => {
    it('generates token with correct format', () => {
      const token = generateSessionToken();
      
      expect(token).toMatch(/^st_[0-9a-f]{48}$/);
    });

    it('generates unique tokens', () => {
      const token1 = generateSessionToken();
      const token2 = generateSessionToken();
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('generateRequestId', () => {
    it('generates request ID with correct format', () => {
      const reqId = generateRequestId();
      
      expect(reqId).toMatch(/^req_[0-9a-f]{32}$/);
    });

    it('generates unique request IDs', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      
      expect(id1).not.toBe(id2);
    });
  });

  describe('generateBackupCodes', () => {
    it('generates default number of backup codes', () => {
      const codes = generateBackupCodes();
      
      expect(codes).toHaveLength(10);
      codes.forEach(code => {
        expect(code).toMatch(/^[A-Z0-9]{8}$/);
      });
    });

    it('generates custom number of backup codes', () => {
      const codes = generateBackupCodes(5);
      
      expect(codes).toHaveLength(5);
    });

    it('generates unique backup codes', () => {
      const codes = generateBackupCodes(20);
      const uniqueCodes = new Set(codes);
      
      expect(uniqueCodes.size).toBe(20);
    });
  });

  describe('isCryptoAvailable', () => {
    it('returns true when crypto is available', () => {
      expect(isCryptoAvailable()).toBe(true);
    });

    it('returns false when crypto is not available', () => {
      const originalCrypto = global.crypto;
      delete (global as any).crypto;
      
      expect(isCryptoAvailable()).toBe(false);
      
      (global as any).crypto = originalCrypto;
    });
  });

  describe('getCryptoCapabilities', () => {
    it('returns capabilities when crypto is available', () => {
      const caps = getCryptoCapabilities();
      
      expect(caps.isSecure).toBe(true);
      expect(typeof caps.hasRandomUUID).toBe('boolean');
      expect(typeof caps.hasGetRandomValues).toBe('boolean');
    });

    it('returns false capabilities when crypto unavailable', () => {
      const originalCrypto = global.crypto;
      delete (global as any).crypto;
      
      const caps = getCryptoCapabilities();
      
      expect(caps.isSecure).toBe(false);
      expect(caps.hasRandomUUID).toBe(false);
      expect(caps.hasGetRandomValues).toBe(false);
      
      (global as any).crypto = originalCrypto;
    });
  });
});
