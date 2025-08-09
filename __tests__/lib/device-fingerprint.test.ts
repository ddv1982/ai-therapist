/**
 * Tests for Device Fingerprinting Security
 * Tests device identification and fingerprint generation
 */

import { 
  generateDeviceFingerprint, 
  generateBasicDeviceFingerprint,
  generateDeviceName,
  getOrCreateDevice
} from '@/lib/device-fingerprint';

describe('Device Fingerprinting', () => {
  describe('generateBasicDeviceFingerprint', () => {
    it('should generate consistent fingerprints for same user agent', () => {
      const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15';
      
      const fingerprint1 = generateBasicDeviceFingerprint(userAgent);
      const fingerprint2 = generateBasicDeviceFingerprint(userAgent);
      
      expect(fingerprint1).toBe(fingerprint2);
      expect(fingerprint1).toHaveLength(64); // SHA-256 hex string
      expect(/^[a-f0-9]{64}$/i.test(fingerprint1)).toBe(true);
    });

    it('should generate different fingerprints for different user agents', () => {
      const userAgent1 = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      const userAgent2 = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
      
      const fingerprint1 = generateBasicDeviceFingerprint(userAgent1);
      const fingerprint2 = generateBasicDeviceFingerprint(userAgent2);
      
      expect(fingerprint1).not.toBe(fingerprint2);
      expect(fingerprint1).toHaveLength(64);
      expect(fingerprint2).toHaveLength(64);
    });

    it('should handle empty or null user agent gracefully', () => {
      const fingerprint1 = generateBasicDeviceFingerprint('');
      const fingerprint2 = generateBasicDeviceFingerprint(null as any);
      const fingerprint3 = generateBasicDeviceFingerprint(undefined as any);
      
      expect(fingerprint1).toHaveLength(64);
      expect(fingerprint2).toHaveLength(64);
      expect(fingerprint3).toHaveLength(64);
      
      // Should generate consistent fingerprints for empty values
      expect(fingerprint2).toBe(fingerprint3);
    });

    it('should handle malformed user agents', () => {
      const malformedUA = 'Invalid-User-Agent-String-With-Special-Chars-!@#$%^&*()';
      
      const fingerprint = generateBasicDeviceFingerprint(malformedUA);
      
      expect(fingerprint).toHaveLength(64);
      expect(/^[a-f0-9]{64}$/i.test(fingerprint)).toBe(true);
    });
  });

  describe('generateDeviceFingerprint (Enhanced)', () => {
    const testUserAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15';

    it('should generate enhanced fingerprint with additional data', () => {
      const additionalData = {
        screenResolution: '1920x1080',
        timezone: 'America/New_York',
        language: 'en-US',
        platform: 'MacIntel',
      };
      
      const basicFingerprint = generateBasicDeviceFingerprint(testUserAgent);
      const enhancedFingerprint = generateDeviceFingerprint(testUserAgent, additionalData);
      
      expect(basicFingerprint).not.toBe(enhancedFingerprint);
      expect(enhancedFingerprint).toHaveLength(64);
      expect(/^[a-f0-9]{64}$/i.test(enhancedFingerprint)).toBe(true);
    });

    it('should generate consistent enhanced fingerprints for same data', () => {
      const additionalData = {
        screenResolution: '2560x1440',
        timezone: 'Europe/London',
        language: 'en-GB',
        platform: 'Win32',
      };
      
      const fingerprint1 = generateDeviceFingerprint(testUserAgent, additionalData);
      const fingerprint2 = generateDeviceFingerprint(testUserAgent, additionalData);
      
      expect(fingerprint1).toBe(fingerprint2);
    });

    it('should handle partial additional data', () => {
      const partialData = {
        screenResolution: '1366x768',
        // Missing timezone, language, platform
      };
      
      const fingerprint = generateDeviceFingerprint(testUserAgent, partialData);
      
      expect(fingerprint).toHaveLength(64);
      expect(/^[a-f0-9]{64}$/i.test(fingerprint)).toBe(true);
    });

    it('should generate different fingerprints for different screen resolutions', () => {
      const data1 = { screenResolution: '1920x1080' };
      const data2 = { screenResolution: '2560x1440' };
      
      const fingerprint1 = generateDeviceFingerprint(testUserAgent, data1);
      const fingerprint2 = generateDeviceFingerprint(testUserAgent, data2);
      
      expect(fingerprint1).not.toBe(fingerprint2);
    });

    it('should handle empty additional data gracefully', () => {
      const fingerprint1 = generateDeviceFingerprint(testUserAgent, {});
      const fingerprint2 = generateDeviceFingerprint(testUserAgent, null as any);
      
      expect(fingerprint1).toHaveLength(64);
      expect(fingerprint2).toHaveLength(64);
      
      // Should be different from basic fingerprint since it includes empty object
      const basicFingerprint = generateBasicDeviceFingerprint(testUserAgent);
      expect(fingerprint1).not.toBe(basicFingerprint);
    });
  });

  describe('generateDeviceName', () => {
    it('should generate readable device names', () => {
      const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1';
      
      const deviceName = generateDeviceName(userAgent);
      
      expect(deviceName).toContain('Safari');
      expect(deviceName).toContain('iOS');
      expect(deviceName).toContain('Mobile');
    });

    it('should handle desktop browsers', () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      
      const deviceName = generateDeviceName(userAgent);
      
      expect(deviceName).toContain('Chrome');
      expect(deviceName).toContain('Windows');
      expect(deviceName).not.toContain('Mobile');
    });

    it('should handle unknown user agents gracefully', () => {
      const deviceName = generateDeviceName('Unknown User Agent');
      
      expect(deviceName).toContain('Unknown Browser');
      expect(deviceName).toContain('Unknown OS');
    });
  });

  describe('Security considerations', () => {
    it('should not expose sensitive information in fingerprints', () => {
      const sensitiveUserAgent = 'Mozilla/5.0 (user:password@internal.company.com)';
      
      const fingerprint = generateBasicDeviceFingerprint(sensitiveUserAgent);
      
      expect(fingerprint).not.toContain('user');
      expect(fingerprint).not.toContain('password');
      expect(fingerprint).not.toContain('internal.company.com');
      expect(/^[a-f0-9]{64}$/i.test(fingerprint)).toBe(true);
    });

    it('should generate cryptographically strong fingerprints', () => {
      const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)';
      const fingerprints = new Set();
      
      // Generate multiple fingerprints with slightly different data
      for (let i = 0; i < 100; i++) {
        const data = { screenResolution: `${1920 + i}x1080` };
        const fingerprint = generateDeviceFingerprint(userAgent, data);
        fingerprints.add(fingerprint);
      }
      
      // All fingerprints should be unique
      expect(fingerprints.size).toBe(100);
    });

    it('should handle potential hash collision attempts', () => {
      // Test with inputs designed to potentially cause hash collisions
      const collisionAttempts = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', // Exact duplicate
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1', // Different platform
      ];
      
      const fingerprints = collisionAttempts.map(ua => generateBasicDeviceFingerprint(ua));
      
      // First two should be identical (same input)
      expect(fingerprints[0]).toBe(fingerprints[1]);
      
      // Others should be different due to different OS/platform
      expect(fingerprints[2]).not.toBe(fingerprints[3]);
      expect(fingerprints[0]).not.toBe(fingerprints[2]);
    });

    it('should maintain fingerprint stability over time', () => {
      const userAgent = 'Mozilla/5.0 (stable test)';
      const additionalData = {
        screenResolution: '1920x1080',
        timezone: 'UTC',
        language: 'en-US',
      };
      
      const fingerprint1 = generateDeviceFingerprint(userAgent, additionalData);
      
      // Simulate time passing
      setTimeout(() => {
        const fingerprint2 = generateDeviceFingerprint(userAgent, additionalData);
        expect(fingerprint1).toBe(fingerprint2);
      }, 10);
    });
  });

  describe('Performance and reliability', () => {
    it('should generate fingerprints quickly', () => {
      const userAgent = 'Mozilla/5.0 (performance test)';
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        generateBasicDeviceFingerprint(`${userAgent}-${i}`);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete 1000 fingerprints in less than 500ms (reasonable for CI/testing environments)
      expect(duration).toBeLessThan(500);
    });

    it('should handle extremely long user agents', () => {
      const longUserAgent = 'A'.repeat(10000); // 10KB user agent string
      
      const fingerprint = generateBasicDeviceFingerprint(longUserAgent);
      
      expect(fingerprint).toHaveLength(64);
      expect(/^[a-f0-9]{64}$/i.test(fingerprint)).toBe(true);
    });

    it('should be deterministic across multiple calls', () => {
      const userAgent = 'Mozilla/5.0 (deterministic test)';
      const additionalData = { test: 'data' };
      
      const results = Array.from({ length: 10 }, () => 
        generateDeviceFingerprint(userAgent, additionalData)
      );
      
      // All results should be identical
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBe(1);
    });
  });
});