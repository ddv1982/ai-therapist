import { getSingleUserInfo } from '@/lib/auth/user-session';

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
      get: (name: string) => mockRequest.get(name),
    },
  } as Request;
}

describe('User Session Management', () => {
  describe('getSingleUserInfo', () => {
    it('should return consistent single user ID regardless of request', () => {
      const request1 = createMockRequest({
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
      });

      const request2 = createMockRequest({
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36',
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
        'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 Mobile Safari/537.36',
      ];

      mobileUserAgents.forEach((userAgent) => {
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
        'Mozilla/5.0 (Tablet; rv:89.0) Gecko/89.0 Firefox/89.0',
      ];

      tabletUserAgents.forEach((userAgent) => {
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
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      ];

      computerUserAgents.forEach((userAgent) => {
        const request = createMockRequest({ 'user-agent': userAgent });
        const userInfo = getSingleUserInfo(request);

        expect(userInfo.currentDevice).toBe('Computer');
        expect(userInfo.userId).toBe('therapeutic-ai-user');
      });
    });

    it('should default to "Device" for unknown user agents', () => {
      const unknownUserAgents = ['SomeUnknownBot/1.0', 'CustomApp/2.0', '', '   '];

      unknownUserAgents.forEach((userAgent) => {
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
      const mixedUserAgent =
        'Mozilla/5.0 (iPad; Mobile; CPU iPhone OS like Mac OS X Windows Linux)';
      const request = createMockRequest({ 'user-agent': mixedUserAgent });
      const userInfo = getSingleUserInfo(request);

      // Should detect as Mobile because "Mobile" appears first in the detection logic
      expect(userInfo.currentDevice).toBe('Mobile');
    });

    it('should detect Android tablets as Mobile due to detection priority', () => {
      // Real Android tablet user agents often contain both "Android" and "Tablet"
      // but should be detected as Mobile due to the detection logic priority
      const androidTabletUserAgent =
        'Mozilla/5.0 (Linux; Android 10; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Safari/537.36';
      const request = createMockRequest({ 'user-agent': androidTabletUserAgent });
      const userInfo = getSingleUserInfo(request);

      // Should be Mobile because "Android" is checked before "Tablet" in the detection logic
      expect(userInfo.currentDevice).toBe('Mobile');
      expect(userInfo.userId).toBe('therapeutic-ai-user');
    });

    it('should return correct user info structure', () => {
      const request = createMockRequest({
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
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

  describe('Integration Tests', () => {
    it('should maintain consistency within same session', () => {
      const headers = {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36',
        'accept-language': 'en-US,en;q=0.9',
        'accept-encoding': 'gzip, deflate, br',
      };

      // Multiple calls with same headers should return same results
      const calls = Array(5)
        .fill(0)
        .map(() => {
          const request = createMockRequest(headers);
          return getSingleUserInfo(request);
        });

      // All single user calls should be identical
      const singleUserIds = calls.map((call) => call.userId);
      expect(new Set(singleUserIds).size).toBe(1);
    });

    it('should handle edge cases gracefully', () => {
      const edgeCaseHeaders = [
        {},
        { 'user-agent': null as any },
        { 'user-agent': undefined as any },
        { 'user-agent': '' },
        { 'user-agent': '   ' },
        { 'user-agent': 'null' },
        { 'user-agent': 'undefined' },
      ];

      edgeCaseHeaders.forEach((headers, _index) => {
        const request = createMockRequest(headers as Record<string, string>);

        expect(() => {
          const singleUser = getSingleUserInfo(request);
          expect(singleUser.userId).toBeTruthy();
        }).not.toThrow();
      });
    });
  });
});
