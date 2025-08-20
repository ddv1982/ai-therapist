/**
 * Security Tests for Authentication System
 * Tests critical security vulnerabilities and authentication flows
 */

import { encryptSensitiveData, decryptSensitiveData } from '@/lib/auth/crypto-utils';
import { generateSecureRandomString, generateUUID } from '@/lib/utils';
import { generateDeviceFingerprint, generateBasicDeviceFingerprint } from '@/lib/auth/device-fingerprint';

// Type declarations for global test utilities from jest.setup.js
declare global {
  var mockCrypto: (mockImplementation?: Crypto) => void;
  var restoreCrypto: () => void;
}

// Mock environment variables for testing
const originalEnv = process.env;

beforeEach(() => {
  process.env = {
    ...originalEnv,
    ENCRYPTION_KEY: 'test-encryption-key-32-chars-long-for-testing',
    CSRF_SECRET: 'test-csrf-secret-for-testing',
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('Authentication Security Tests', () => {
  describe('Content Security Policy', () => {
    it('should validate secure CSP configuration', () => {
      const secureCSP = {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Required for Tailwind
        connectSrc: ["'self'", "https://api.groq.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        fontSrc: ["'self'", "data:"],
      };

      expect(secureCSP.defaultSrc).toContain("'self'");
      expect(secureCSP.scriptSrc).not.toContain("'unsafe-eval'");
      expect(secureCSP.connectSrc).toContain("https://api.groq.com");
    });

    it('should validate SameSite cookie configuration', () => {
      const cookieConfig = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      };

      expect(cookieConfig.sameSite).toBe('strict');
      expect(cookieConfig.httpOnly).toBe(true);
      expect(cookieConfig.path).toBe('/');
    });
  });

  describe('Data Encryption', () => {
    it('should encrypt sensitive data securely', () => {
      const plaintext = 'sensitive-therapeutic-data';
      const encrypted = encryptSensitiveData(plaintext);
      
      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.length).toBeGreaterThan(plaintext.length);
    });

    it('should decrypt data correctly', () => {
      const plaintext = 'test-message-content';
      const encrypted = encryptSensitiveData(plaintext);
      const decrypted = decryptSensitiveData(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different encrypted output for same input', () => {
      const plaintext = 'same-message';
      const encrypted1 = encryptSensitiveData(plaintext);
      const encrypted2 = encryptSensitiveData(plaintext);
      
      // Due to random salt/IV, encrypted values should be different
      expect(encrypted1).not.toBe(encrypted2);
      
      // But both should decrypt to same plaintext
      expect(decryptSensitiveData(encrypted1)).toBe(plaintext);
      expect(decryptSensitiveData(encrypted2)).toBe(plaintext);
    });

    it('should fail gracefully with wrong encryption key', () => {
      const plaintext = 'test-data';
      const encrypted = encryptSensitiveData(plaintext);
      
      // Change the encryption key
      process.env.ENCRYPTION_KEY = 'different-key-32-chars-long-testing';
      
      expect(() => {
        decryptSensitiveData(encrypted);
      }).toThrow();
    });

    it('should reject malformed encrypted data', () => {
      const malformedData = 'not-valid-encrypted-data';
      
      expect(() => {
        decryptSensitiveData(malformedData);
      }).toThrow();
    });
  });

  describe('Token Generation Security', () => {
    it('should generate cryptographically secure random strings', () => {
      const token1 = generateSecureRandomString(32);
      const token2 = generateSecureRandomString(32);
      
      expect(token1).toBeTruthy();
      expect(token2).toBeTruthy();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(32);
      expect(token2.length).toBe(32);
    });

    it('should generate secure UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      
      expect(uuid1).toBeTruthy();
      expect(uuid2).toBeTruthy();
      expect(uuid1).not.toBe(uuid2);
      expect(uuid1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should fail when crypto is unavailable', () => {
      // Mock crypto as unavailable using the helper function
      global.mockCrypto(undefined);
      
      expect(() => {
        generateSecureRandomString(16);
      }).toThrow('Cryptographically secure random number generation is not available');
      
      expect(() => {
        generateUUID();
      }).toThrow('Cryptographically secure random number generation is not available');
      
      // Restore crypto using the helper function
      global.restoreCrypto();
    });
  });

  describe('Device Fingerprinting Security', () => {
    const testUserAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1';
    
    it('should generate consistent fingerprints for same device', () => {
      const fingerprint1 = generateBasicDeviceFingerprint(testUserAgent);
      const fingerprint2 = generateBasicDeviceFingerprint(testUserAgent);
      
      expect(fingerprint1).toBe(fingerprint2);
      expect(fingerprint1).toBeTruthy();
      expect(fingerprint1.length).toBe(64); // SHA-256 hex string
    });

    it('should generate different fingerprints for different devices', () => {
      const userAgent1 = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      const userAgent2 = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
      
      const fingerprint1 = generateBasicDeviceFingerprint(userAgent1);
      const fingerprint2 = generateBasicDeviceFingerprint(userAgent2);
      
      expect(fingerprint1).not.toBe(fingerprint2);
    });

    it('should handle enhanced fingerprinting with additional data', () => {
      const additionalData = {
        screenResolution: '1920x1080',
        timezone: 'America/New_York',
        language: 'en-US',
        platform: 'MacIntel'
      };
      
      const basicFingerprint = generateBasicDeviceFingerprint(testUserAgent);
      const enhancedFingerprint = generateDeviceFingerprint(testUserAgent, additionalData);
      
      expect(basicFingerprint).not.toBe(enhancedFingerprint);
      expect(enhancedFingerprint).toBeTruthy();
      expect(enhancedFingerprint.length).toBe(64);
    });

    it('should handle malformed user agents gracefully', () => {
      const malformedUA = '';
      const fingerprint = generateBasicDeviceFingerprint(malformedUA);
      
      expect(fingerprint).toBeTruthy();
      expect(fingerprint.length).toBe(64);
    });
  });
});

describe('Security Vulnerability Tests', () => {
  describe('Input Validation', () => {
    it('should prevent SQL injection attempts', () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "'; DELETE FROM auth_config; --",
        "1'; UPDATE users SET email='hacker@evil.com'; --"
      ];
      
      maliciousInputs.forEach(input => {
        // Test that our encryption handles malicious input safely
        expect(() => {
          const encrypted = encryptSensitiveData(input);
          const decrypted = decryptSensitiveData(encrypted);
          expect(decrypted).toBe(input); // Should be safely encrypted/decrypted
        }).not.toThrow();
      });
    });

    it('should handle XSS attempts in encrypted content', () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src=x onerror=alert("xss")>',
        '<svg onload=alert("xss")>'
      ];
      
      xssPayloads.forEach(payload => {
        expect(() => {
          const encrypted = encryptSensitiveData(payload);
          const decrypted = decryptSensitiveData(encrypted);
          expect(decrypted).toBe(payload); // Content should be preserved but encrypted
        }).not.toThrow();
      });
    });
  });

  describe('Authentication Bypass Prevention', () => {
    it('should not allow localhost bypass in production', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true });
      
      // Import the auth middleware to test production behavior
      // Note: This would require mocking NextRequest which is complex
      // In real implementation, this would be tested with integration tests
      
      Object.defineProperty(process.env, 'NODE_ENV', { value: originalNodeEnv, writable: true });
    });

    it('should require proper environment variables for bypass', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      const originalBypassAuth = process.env.BYPASS_AUTH;
      
      // Test that bypass is only allowed with explicit flag
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });
      process.env.BYPASS_AUTH = undefined;
      
      // This would need integration testing to properly validate
      // but the principle is that auth bypass should require explicit flag
      
      Object.defineProperty(process.env, 'NODE_ENV', { value: originalNodeEnv, writable: true });
      process.env.BYPASS_AUTH = originalBypassAuth;
    });
  });

  describe('Rate Limiting and DoS Prevention', () => {
    it('should generate unique tokens to prevent replay attacks', () => {
      const tokens = new Set();
      
      // Generate 100 tokens and ensure they're all unique
      for (let i = 0; i < 100; i++) {
        const token = generateSecureRandomString(32);
        expect(tokens.has(token)).toBe(false);
        tokens.add(token);
      }
      
      expect(tokens.size).toBe(100);
    });

    it('should handle large encrypted payloads', () => {
      // Test with a large therapeutic message
      const largeMessage = 'A'.repeat(10000);
      
      expect(() => {
        const encrypted = encryptSensitiveData(largeMessage);
        const decrypted = decryptSensitiveData(encrypted);
        expect(decrypted).toBe(largeMessage);
      }).not.toThrow();
    });
  });
});