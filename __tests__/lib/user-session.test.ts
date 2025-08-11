import {
  generateDeviceUserId,
  getSingleUserInfo,
  getDeviceUserInfo
} from '@/lib/auth/user-session';

// Mock Request class for testing
class MockRequest {
  public headers: Map<string, string>;

  constructor(headers: Record<string, string> = {}) {
    this.headers = new Map(Object.entries(headers));
  }

  get(name: string): string | null {
    return this.headers.get(name.toLowerCase()) || null;
  }
}

// Create mock Request with headers
function createMockRequest(headers: Record<string, string> = {}): Request {
  const mockRequest = new MockRequest(headers);
  return {
    headers: {
      get: (name: string) => mockRequest.get(name)
    }
  } as Request;
}

describe('User Session Management', () => {
  describe('generateDeviceUserId', () => {
    it('should generate consistent user ID for same request headers', () => {
      const headers = {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'accept-language': 'en-US,en;q=0.9',
        'accept-encoding': 'gzip, deflate, br'
      };

      const request1 = createMockRequest(headers);
      const request2 = createMockRequest(headers);

      const userId1 = generateDeviceUserId(request1);
      const userId2 = generateDeviceUserId(request2);

      expect(userId1).toBe(userId2);
      expect(userId1).toMatch(/^device-user-[a-z0-9]+$/);
    });

    it('should generate different user IDs for different user agents', () => {
      const request1 = createMockRequest({
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
        'accept-language': 'en-US,en;q=0.9',
        'accept-encoding': 'gzip, deflate, br'
      });

      const request2 = createMockRequest({
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36',
        'accept-language': 'en-US,en;q=0.9',
        'accept-encoding': 'gzip, deflate, br'
      });

      const userId1 = generateDeviceUserId(request1);
      const userId2 = generateDeviceUserId(request2);

      expect(userId1).not.toBe(userId2);
      expect(userId1).toMatch(/^device-user-[a-z0-9]+$/);
      expect(userId2).toMatch(/^device-user-[a-z0-9]+$/);
    });

    it('should generate different user IDs for different languages', () => {
      const request1 = createMockRequest({
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
        'accept-language': 'en-US,en;q=0.9',
        'accept-encoding': 'gzip, deflate, br'
      });

      const request2 = createMockRequest({
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
        'accept-language': 'es-ES,es;q=0.9',
        'accept-encoding': 'gzip, deflate, br'
      });

      const userId1 = generateDeviceUserId(request1);
      const userId2 = generateDeviceUserId(request2);

      expect(userId1).not.toBe(userId2);
    });

    it('should generate different user IDs for different encoding', () => {
      const request1 = createMockRequest({
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
        'accept-language': 'en-US,en;q=0.9',
        'accept-encoding': 'gzip, deflate, br'
      });

      const request2 = createMockRequest({
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
        'accept-language': 'en-US,en;q=0.9',
        'accept-encoding': 'gzip, deflate'
      });

      const userId1 = generateDeviceUserId(request1);
      const userId2 = generateDeviceUserId(request2);

      expect(userId1).not.toBe(userId2);
    });

    it('should handle missing headers gracefully', () => {
      const request1 = createMockRequest({});
      const request2 = createMockRequest({
        'user-agent': undefined as any,
        'accept-language': null as any,
        'accept-encoding': ''
      });

      const userId1 = generateDeviceUserId(request1);
      const userId2 = generateDeviceUserId(request2);

      expect(userId1).toMatch(/^device-user-[a-z0-9]+$/);
      expect(userId2).toMatch(/^device-user-[a-z0-9]+$/);
      // Should be the same because empty strings are treated the same way
      expect(userId1).toBe(userId2);
    });

    it('should generate valid user ID format', () => {
      const request = createMockRequest({
        'user-agent': 'Test Browser/1.0',
        'accept-language': 'en-US',
        'accept-encoding': 'gzip'
      });

      const userId = generateDeviceUserId(request);

      expect(userId).toMatch(/^device-user-[a-z0-9]+$/);
      expect(userId.length).toBeGreaterThan(12); // "device-user-" + hash
    });

    it('should handle special characters in headers', () => {
      const request = createMockRequest({
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
        'accept-encoding': 'gzip, deflate, br'
      });

      const userId = generateDeviceUserId(request);

      expect(userId).toMatch(/^device-user-[a-z0-9]+$/);
      expect(userId).not.toContain('undefined');
      expect(userId).not.toContain('null');
    });

    it('should produce different results for edge case inputs', () => {
      const requests = [
        createMockRequest({ 'user-agent': '', 'accept-language': '', 'accept-encoding': '' }),
        createMockRequest({ 'user-agent': ' ', 'accept-language': ' ', 'accept-encoding': ' ' }),
        createMockRequest({ 'user-agent': 'a', 'accept-language': 'b', 'accept-encoding': 'c' })
      ];

      const userIds = requests.map(request => generateDeviceUserId(request));
      
      // First two should be the same (empty vs spaces makes difference)
      expect(userIds[0]).not.toBe(userIds[1]);
      expect(userIds[1]).not.toBe(userIds[2]);
      expect(userIds[0]).not.toBe(userIds[2]);
    });
  });

  describe('getSingleUserInfo', () => {
    it('should return consistent single user ID regardless of request', () => {
      const request1 = createMockRequest({
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0'
      });

      const request2 = createMockRequest({
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36'
      });

      const userInfo1 = getSingleUserInfo(request1);
      const userInfo2 = getSingleUserInfo(request2);

      expect(userInfo1.userId).toBe(userInfo2.userId);
      expect(userInfo1.userId).toBe('therapeutic-ai-user');
      expect(userInfo1.email).toBe('user@therapeutic-ai.local');
      expect(userInfo1.name).toBe('Therapeutic AI User');
    });

    it('should detect mobile device correctly', () => {
      const mobileUserAgents = [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
        'Mozilla/5.0 (Android 10; Mobile; rv:89.0) Gecko/89.0 Firefox/89.0',
        'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 Mobile Safari/537.36'
      ];

      mobileUserAgents.forEach(userAgent => {
        const request = createMockRequest({ 'user-agent': userAgent });
        const userInfo = getSingleUserInfo(request);

        expect(userInfo.currentDevice).toBe('Mobile');
        expect(userInfo.userId).toBe('therapeutic-ai-user');
      });
    });

    it('should detect tablet device correctly', () => {
      const tabletUserAgents = [
        'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
        // Use generic tablet user agent that doesn't contain "Mobile", "Android", or "iPhone"
        'Mozilla/5.0 (Tablet; rv:89.0) Gecko/89.0 Firefox/89.0'
      ];

      tabletUserAgents.forEach(userAgent => {
        const request = createMockRequest({ 'user-agent': userAgent });
        const userInfo = getSingleUserInfo(request);

        // These user agents should be detected as Tablet since they don't contain
        // "Mobile", "Android", or "iPhone" (which would trigger Mobile detection first)
        expect(userInfo.currentDevice).toBe('Tablet');
        expect(userInfo.userId).toBe('therapeutic-ai-user');
      });
    });

    it('should detect computer device correctly', () => {
      const computerUserAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
      ];

      computerUserAgents.forEach(userAgent => {
        const request = createMockRequest({ 'user-agent': userAgent });
        const userInfo = getSingleUserInfo(request);

        expect(userInfo.currentDevice).toBe('Computer');
        expect(userInfo.userId).toBe('therapeutic-ai-user');
      });
    });

    it('should default to "Device" for unknown user agents', () => {
      const unknownUserAgents = [
        'SomeUnknownBot/1.0',
        'CustomApp/2.0',
        '',
        '   '
      ];

      unknownUserAgents.forEach(userAgent => {
        const request = createMockRequest({ 'user-agent': userAgent });
        const userInfo = getSingleUserInfo(request);

        expect(userInfo.currentDevice).toBe('Device');
        expect(userInfo.userId).toBe('therapeutic-ai-user');
      });
    });

    it('should handle missing user agent header', () => {
      const request = createMockRequest({});
      const userInfo = getSingleUserInfo(request);

      expect(userInfo.currentDevice).toBe('Device');
      expect(userInfo.userId).toBe('therapeutic-ai-user');
      expect(userInfo.email).toBe('user@therapeutic-ai.local');
      expect(userInfo.name).toBe('Therapeutic AI User');
    });

    it('should prioritize device detection correctly', () => {
      // Test priority: Mobile > Tablet > Computer
      const mixedUserAgent = 'Mozilla/5.0 (iPad; Mobile; CPU iPhone OS like Mac OS X Windows Linux)';
      const request = createMockRequest({ 'user-agent': mixedUserAgent });
      const userInfo = getSingleUserInfo(request);

      // Should detect as Mobile because "Mobile" appears first in the detection logic
      expect(userInfo.currentDevice).toBe('Mobile');
    });

    it('should detect Android tablets as Mobile due to detection priority', () => {
      // Real Android tablet user agents often contain both "Android" and "Tablet"
      // but should be detected as Mobile due to the detection logic priority
      const androidTabletUserAgent = 'Mozilla/5.0 (Linux; Android 10; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Safari/537.36';
      const request = createMockRequest({ 'user-agent': androidTabletUserAgent });
      const userInfo = getSingleUserInfo(request);

      // Should be Mobile because "Android" is checked before "Tablet" in the detection logic
      expect(userInfo.currentDevice).toBe('Mobile');
      expect(userInfo.userId).toBe('therapeutic-ai-user');
    });

    it('should return correct user info structure', () => {
      const request = createMockRequest({
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0'
      });
      
      const userInfo = getSingleUserInfo(request);

      expect(userInfo).toHaveProperty('userId');
      expect(userInfo).toHaveProperty('email');
      expect(userInfo).toHaveProperty('name');
      expect(userInfo).toHaveProperty('currentDevice');

      expect(typeof userInfo.userId).toBe('string');
      expect(typeof userInfo.email).toBe('string');
      expect(typeof userInfo.name).toBe('string');
      expect(typeof userInfo.currentDevice).toBe('string');
    });
  });

  describe('getDeviceUserInfo (deprecated)', () => {
    it('should return device-specific user info', () => {
      const request = createMockRequest({
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
        'accept-language': 'en-US,en;q=0.9',
        'accept-encoding': 'gzip, deflate, br'
      });

      const userInfo = getDeviceUserInfo(request);

      expect(userInfo.userId).toMatch(/^device-user-[a-z0-9]+$/);
      expect(userInfo.email).toMatch(/@local\.device$/);
      expect(userInfo.name).toMatch(/User$/);
    });

    it('should generate different user info for different devices', () => {
      const request1 = createMockRequest({
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0'
      });

      const request2 = createMockRequest({
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)'
      });

      const userInfo1 = getDeviceUserInfo(request1);
      const userInfo2 = getDeviceUserInfo(request2);

      expect(userInfo1.userId).not.toBe(userInfo2.userId);
      expect(userInfo1.email).not.toBe(userInfo2.email);
      expect(userInfo1.name).not.toBe(userInfo2.name);
    });

    it('should detect device types correctly for user names', () => {
      const testCases = [
        {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
          expectedName: 'Mobile User'
        },
        {
          userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X)',
          expectedName: 'Tablet User'
        },
        {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          expectedName: 'Computer User'
        },
        {
          userAgent: 'SomeUnknownBot/1.0',
          expectedName: 'Device User'
        }
      ];

      testCases.forEach(({ userAgent, expectedName }) => {
        const request = createMockRequest({ 'user-agent': userAgent });
        const userInfo = getDeviceUserInfo(request);

        expect(userInfo.name).toBe(expectedName);
      });
    });

    it('should generate consistent email format', () => {
      const request = createMockRequest({
        'user-agent': 'Test Browser/1.0'
      });

      const userInfo = getDeviceUserInfo(request);

      expect(userInfo.email).toMatch(/^device-user-[a-z0-9]+@local\.device$/);
      expect(userInfo.email).toBe(`${userInfo.userId}@local.device`);
    });

    it('should handle empty user agent', () => {
      const request = createMockRequest({
        'user-agent': ''
      });

      const userInfo = getDeviceUserInfo(request);

      expect(userInfo.userId).toMatch(/^device-user-[a-z0-9]+$/);
      expect(userInfo.email).toMatch(/@local\.device$/);
      expect(userInfo.name).toBe('Device User');
    });

    it('should return correct user info structure', () => {
      const request = createMockRequest({
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0'
      });

      const userInfo = getDeviceUserInfo(request);

      expect(userInfo).toHaveProperty('userId');
      expect(userInfo).toHaveProperty('email');
      expect(userInfo).toHaveProperty('name');

      expect(typeof userInfo.userId).toBe('string');
      expect(typeof userInfo.email).toBe('string');
      expect(typeof userInfo.name).toBe('string');
    });
  });

  describe('Integration Tests', () => {
    it('should demonstrate difference between single user and device user approaches', () => {
      const request1 = createMockRequest({
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0'
      });

      const request2 = createMockRequest({
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)'
      });

      // Single user approach - same user ID across devices
      const singleUser1 = getSingleUserInfo(request1);
      const singleUser2 = getSingleUserInfo(request2);
      expect(singleUser1.userId).toBe(singleUser2.userId);

      // Device user approach - different user IDs per device
      const deviceUser1 = getDeviceUserInfo(request1);
      const deviceUser2 = getDeviceUserInfo(request2);
      expect(deviceUser1.userId).not.toBe(deviceUser2.userId);
    });

    it('should maintain consistency within same session', () => {
      const headers = {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36',
        'accept-language': 'en-US,en;q=0.9',
        'accept-encoding': 'gzip, deflate, br'
      };

      // Multiple calls with same headers should return same results
      const calls = Array(5).fill(0).map(() => {
        const request = createMockRequest(headers);
        return {
          single: getSingleUserInfo(request),
          device: getDeviceUserInfo(request)
        };
      });

      // All single user calls should be identical
      const singleUserIds = calls.map(call => call.single.userId);
      expect(new Set(singleUserIds).size).toBe(1);

      // All device user calls should be identical
      const deviceUserIds = calls.map(call => call.device.userId);
      expect(new Set(deviceUserIds).size).toBe(1);
    });

    it('should handle edge cases gracefully', () => {
      const edgeCaseHeaders = [
        {},
        { 'user-agent': null as any },
        { 'user-agent': undefined as any },
        { 'user-agent': '' },
        { 'user-agent': '   ' },
        { 'user-agent': 'null' },
        { 'user-agent': 'undefined' }
      ];

      edgeCaseHeaders.forEach((headers, index) => {
        const request = createMockRequest(headers);
        
        expect(() => {
          const singleUser = getSingleUserInfo(request);
          const deviceUser = getDeviceUserInfo(request);
          
          expect(singleUser.userId).toBeTruthy();
          expect(deviceUser.userId).toBeTruthy();
        }).not.toThrow();
      });
    });
  });

  describe('Hash Algorithm Consistency', () => {
    it('should generate consistent hashes for same input', () => {
      const testString = 'Mozilla/5.0-en-US,en;q=0.9-gzip, deflate, br';
      
      // Simulate the hash algorithm from generateDeviceUserId
      const createHash = (str: string): number => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
      };

      const hash1 = createHash(testString);
      const hash2 = createHash(testString);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toBeGreaterThan(0);
    });

    it('should generate different hashes for different inputs', () => {
      const createHash = (str: string): number => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return Math.abs(hash);
      };

      const inputs = [
        'Mozilla/5.0-en-US-gzip',
        'Mozilla/5.0-es-ES-gzip',
        'Safari/537.36-en-US-deflate',
        'Chrome/91.0-fr-FR-br'
      ];

      const hashes = inputs.map(createHash);
      const uniqueHashes = new Set(hashes);
      
      expect(uniqueHashes.size).toBe(inputs.length);
    });
  });
});