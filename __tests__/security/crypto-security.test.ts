/**
 * Simplified Security Tests for Cryptographic Functions
 * Tests core security utilities without complex dependencies
 */

import { generateSecureRandomString, generateUUID } from '@/lib/utils';

describe('Cryptographic Security Tests', () => {
  describe('Secure Random String Generation', () => {
    it('should generate strings of correct length', () => {
      const short = generateSecureRandomString(8);
      const medium = generateSecureRandomString(32);
      const long = generateSecureRandomString(64);
      
      expect(short).toHaveLength(8);
      expect(medium).toHaveLength(32);
      expect(long).toHaveLength(64);
    });

    it('should generate unique strings', () => {
      const strings = Array.from({ length: 100 }, () => generateSecureRandomString(32));
      const uniqueStrings = new Set(strings);
      
      expect(uniqueStrings.size).toBe(100);
    });

    it('should use only expected characters', () => {
      const token = generateSecureRandomString(100);
      const expectedChars = /^[A-Za-z0-9]+$/;
      
      expect(token).toMatch(expectedChars);
    });

    it('should fail gracefully when crypto is unavailable', () => {
      const originalCrypto = global.crypto;
      
      // Mock crypto as unavailable
      Object.defineProperty(global, 'crypto', {
        value: undefined,
        configurable: true
      });
      
      expect(() => {
        generateSecureRandomString(16);
      }).toThrow('Cryptographically secure random number generation is not available');
      
      // Restore crypto
      Object.defineProperty(global, 'crypto', {
        value: originalCrypto,
        configurable: true
      });
    });

    it('should handle various string lengths', () => {
      const lengths = [1, 16, 32, 64, 128, 256];
      
      lengths.forEach(length => {
        const token = generateSecureRandomString(length);
        expect(token).toHaveLength(length);
        expect(typeof token).toBe('string');
      });
    });
  });

  describe('UUID Generation', () => {
    it('should generate valid UUID v4 format', () => {
      const uuid = generateUUID();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      expect(uuid).toMatch(uuidRegex);
    });

    it('should generate unique UUIDs', () => {
      const uuids = Array.from({ length: 1000 }, () => generateUUID());
      const uniqueUuids = new Set(uuids);
      
      expect(uniqueUuids.size).toBe(1000);
    });

    it('should have correct version and variant bits', () => {
      const uuid = generateUUID();
      const parts = uuid.split('-');
      
      // Version 4 check (13th character should be '4')
      expect(parts[2][0]).toBe('4');
      
      // Variant bits check (17th character should be 8, 9, a, or b)
      expect(['8', '9', 'a', 'b']).toContain(parts[3][0].toLowerCase());
    });

    it('should fail when crypto is unavailable', () => {
      const originalCrypto = global.crypto;
      
      // Mock crypto as unavailable
      Object.defineProperty(global, 'crypto', {
        value: undefined,
        configurable: true
      });
      
      expect(() => {
        generateUUID();
      }).toThrow('Cryptographically secure random number generation is not available');
      
      // Restore crypto
      Object.defineProperty(global, 'crypto', {
        value: originalCrypto,
        configurable: true
      });
    });
  });

  describe('Security Properties', () => {
    it('should not generate predictable sequences', () => {
      // Generate multiple tokens and check they don't follow patterns
      const tokens = Array.from({ length: 10 }, () => generateSecureRandomString(32));
      
      // Check no two consecutive tokens have similar prefixes
      for (let i = 0; i < tokens.length - 1; i++) {
        const commonPrefix = getLongestCommonPrefix(tokens[i], tokens[i + 1]);
        expect(commonPrefix.length).toBeLessThan(4); // Should have very little in common
      }
    });

    it('should have good entropy distribution', () => {
      const token = generateSecureRandomString(10000); // Larger sample for better distribution
      const charCounts: Record<string, number> = {};
      
      // Count character frequency
      for (const char of token) {
        charCounts[char] = (charCounts[char] || 0) + 1;
      }
      
      const frequencies = Object.values(charCounts);
      const avgFrequency = 10000 / 62; // 62 possible characters
      
      // Check that character distribution is reasonably uniform (more tolerant bounds)
      frequencies.forEach(freq => {
        expect(freq).toBeGreaterThan(avgFrequency * 0.3); // More tolerant lower bound
        expect(freq).toBeLessThan(avgFrequency * 3); // More tolerant upper bound
      });
      
      // Ensure we have a good variety of characters
      expect(Object.keys(charCounts).length).toBeGreaterThan(40); // At least 40 different characters
    });

    it('should handle edge cases gracefully', () => {
      // Test minimum length
      expect(generateSecureRandomString(1)).toHaveLength(1);
      
      // Test zero length (should still work or throw meaningful error)
      expect(() => {
        generateSecureRandomString(0);
      }).not.toThrow();
    });
  });

  describe('Performance and Scalability', () => {
    it('should generate tokens efficiently', () => {
      const startTime = Date.now();
      
      // Generate many tokens
      for (let i = 0; i < 1000; i++) {
        generateSecureRandomString(32);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // 1 second
    });

    it('should maintain quality under load', () => {
      const tokens = [];
      
      // Generate tokens rapidly
      for (let i = 0; i < 100; i++) {
        tokens.push(generateSecureRandomString(64));
      }
      
      // All tokens should still be unique
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(tokens.length);
      
      // All tokens should still be correct length
      tokens.forEach(token => {
        expect(token).toHaveLength(64);
      });
    });
  });
});

// Helper function
function getLongestCommonPrefix(str1: string, str2: string): string {
  let i = 0;
  while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
    i++;
  }
  return str1.substring(0, i);
}