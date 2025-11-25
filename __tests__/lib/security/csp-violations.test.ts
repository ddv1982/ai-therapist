/**
 * Tests for CSP Violations Storage
 *
 * Validates CSP violation tracking and statistics functionality
 */

import {
  addCSPViolation,
  getCSPViolations,
  getCSPViolationStats,
  clearCSPViolations,
  type CSPViolation,
} from '@/lib/security/csp-violations';

// Mock the isDevelopment flag
jest.mock('@/config/env.public', () => ({
  isDevelopment: true,
}));

describe('CSP Violations Storage', () => {
  // Clear violations before each test
  beforeEach(() => {
    clearCSPViolations();
  });

  describe('addCSPViolation', () => {
    it('stores violations in development mode', () => {
      const violation: CSPViolation = {
        timestamp: new Date().toISOString(),
        documentUri: 'https://example.com/page',
        violatedDirective: 'script-src',
        blockedUri: 'https://malicious.com/script.js',
      };

      addCSPViolation(violation);

      const violations = getCSPViolations();
      expect(violations.length).toBe(1);
      expect(violations[0]).toEqual(violation);
    });

    it('stores newest violations first', () => {
      const violation1: CSPViolation = {
        timestamp: '2024-01-01T00:00:00Z',
        documentUri: 'https://example.com/page1',
        violatedDirective: 'script-src',
        blockedUri: 'https://malicious1.com/script.js',
      };

      const violation2: CSPViolation = {
        timestamp: '2024-01-02T00:00:00Z',
        documentUri: 'https://example.com/page2',
        violatedDirective: 'style-src',
        blockedUri: 'https://malicious2.com/style.css',
      };

      addCSPViolation(violation1);
      addCSPViolation(violation2);

      const violations = getCSPViolations();
      expect(violations.length).toBe(2);
      // Newest should be first
      expect(violations[0]).toEqual(violation2);
      expect(violations[1]).toEqual(violation1);
    });

    it('limits storage to MAX_STORED_VIOLATIONS (100)', () => {
      // Add 105 violations
      for (let i = 0; i < 105; i++) {
        const violation: CSPViolation = {
          timestamp: new Date(2024, 0, 1, 0, 0, i).toISOString(),
          documentUri: `https://example.com/page${i}`,
          violatedDirective: 'script-src',
          blockedUri: `https://malicious${i}.com/script.js`,
        };
        addCSPViolation(violation);
      }

      const violations = getCSPViolations();
      expect(violations.length).toBe(100);
    });

    it('keeps newest violations when limit is reached', () => {
      // Add 105 violations
      for (let i = 0; i < 105; i++) {
        const violation: CSPViolation = {
          timestamp: new Date(2024, 0, 1, 0, 0, i).toISOString(),
          documentUri: `https://example.com/page${i}`,
          violatedDirective: 'script-src',
          blockedUri: `https://malicious${i}.com/script.js`,
        };
        addCSPViolation(violation);
      }

      const violations = getCSPViolations();
      // Should have kept the newest 100 (i = 5 to 104)
      expect(violations[0].documentUri).toContain('page104');
      expect(violations[99].documentUri).toContain('page5');
    });

    it('stores all violation fields correctly', () => {
      const violation: CSPViolation = {
        timestamp: '2024-01-15T12:30:45Z',
        documentUri: 'https://example.com/page',
        referrer: 'https://referrer.com',
        violatedDirective: 'script-src',
        effectiveDirective: 'script-src-elem',
        blockedUri: 'https://blocked.com/script.js',
        disposition: 'enforce',
        statusCode: 200,
        scriptSample: 'console.log("test")',
        sourceFile: 'https://example.com/app.js',
        lineNumber: 42,
        columnNumber: 10,
      };

      addCSPViolation(violation);

      const violations = getCSPViolations();
      expect(violations[0]).toEqual(violation);
      expect(violations[0].referrer).toBe('https://referrer.com');
      expect(violations[0].effectiveDirective).toBe('script-src-elem');
      expect(violations[0].disposition).toBe('enforce');
      expect(violations[0].statusCode).toBe(200);
      expect(violations[0].scriptSample).toBe('console.log("test")');
      expect(violations[0].sourceFile).toBe('https://example.com/app.js');
      expect(violations[0].lineNumber).toBe(42);
      expect(violations[0].columnNumber).toBe(10);
    });
  });

  describe('getCSPViolations', () => {
    it('returns empty array when no violations', () => {
      const violations = getCSPViolations();
      expect(violations).toEqual([]);
    });

    it('returns stored violations', () => {
      const violation: CSPViolation = {
        timestamp: new Date().toISOString(),
        documentUri: 'https://example.com/page',
        violatedDirective: 'script-src',
        blockedUri: 'https://malicious.com/script.js',
      };

      addCSPViolation(violation);

      const violations = getCSPViolations();
      expect(violations.length).toBe(1);
    });

    it('returns defensive copy (not reference)', () => {
      const violation: CSPViolation = {
        timestamp: new Date().toISOString(),
        documentUri: 'https://example.com/page',
        violatedDirective: 'script-src',
        blockedUri: 'https://malicious.com/script.js',
      };

      addCSPViolation(violation);

      const violations1 = getCSPViolations();
      const violations2 = getCSPViolations();

      // Should be different array instances
      expect(violations1).not.toBe(violations2);
      // But with same content
      expect(violations1).toEqual(violations2);

      // Modifying one should not affect the other
      violations1.pop();
      expect(violations1.length).toBe(0);
      expect(violations2.length).toBe(1);
    });
  });

  describe('getCSPViolationStats', () => {
    it('returns zero stats when no violations', () => {
      const stats = getCSPViolationStats();

      expect(stats.totalViolations).toBe(0);
      expect(stats.violationsByDirective).toEqual({});
      expect(stats.violationsByBlockedUri).toEqual({});
      expect(stats.recentViolations).toBe(0);
      expect(stats.oldestViolation).toBeUndefined();
      expect(stats.newestViolation).toBeUndefined();
    });

    it('counts total violations', () => {
      for (let i = 0; i < 5; i++) {
        addCSPViolation({
          timestamp: new Date().toISOString(),
          documentUri: `https://example.com/page${i}`,
          violatedDirective: 'script-src',
          blockedUri: 'https://malicious.com/script.js',
        });
      }

      const stats = getCSPViolationStats();
      expect(stats.totalViolations).toBe(5);
    });

    it('counts violations by directive', () => {
      addCSPViolation({
        timestamp: new Date().toISOString(),
        documentUri: 'https://example.com/page1',
        violatedDirective: 'script-src',
        blockedUri: 'https://malicious.com/script.js',
      });

      addCSPViolation({
        timestamp: new Date().toISOString(),
        documentUri: 'https://example.com/page2',
        violatedDirective: 'script-src',
        blockedUri: 'https://malicious.com/script2.js',
      });

      addCSPViolation({
        timestamp: new Date().toISOString(),
        documentUri: 'https://example.com/page3',
        violatedDirective: 'style-src',
        blockedUri: 'https://malicious.com/style.css',
      });

      const stats = getCSPViolationStats();
      expect(stats.violationsByDirective['script-src']).toBe(2);
      expect(stats.violationsByDirective['style-src']).toBe(1);
    });

    it('uses effectiveDirective when available', () => {
      addCSPViolation({
        timestamp: new Date().toISOString(),
        documentUri: 'https://example.com/page1',
        violatedDirective: 'script-src',
        effectiveDirective: 'script-src-elem',
        blockedUri: 'https://malicious.com/script.js',
      });

      const stats = getCSPViolationStats();
      expect(stats.violationsByDirective['script-src-elem']).toBe(1);
      expect(stats.violationsByDirective['script-src']).toBeUndefined();
    });

    it('counts violations by blocked URI hostname', () => {
      addCSPViolation({
        timestamp: new Date().toISOString(),
        documentUri: 'https://example.com/page1',
        violatedDirective: 'script-src',
        blockedUri: 'https://malicious1.com/script.js',
      });

      addCSPViolation({
        timestamp: new Date().toISOString(),
        documentUri: 'https://example.com/page2',
        violatedDirective: 'script-src',
        blockedUri: 'https://malicious1.com/other.js',
      });

      addCSPViolation({
        timestamp: new Date().toISOString(),
        documentUri: 'https://example.com/page3',
        violatedDirective: 'script-src',
        blockedUri: 'https://malicious2.com/script.js',
      });

      const stats = getCSPViolationStats();
      expect(stats.violationsByBlockedUri['malicious1.com']).toBe(2);
      expect(stats.violationsByBlockedUri['malicious2.com']).toBe(1);
    });

    it('counts recent violations (within 1 hour)', () => {
      const now = new Date();
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      addCSPViolation({
        timestamp: now.toISOString(),
        documentUri: 'https://example.com/page1',
        violatedDirective: 'script-src',
        blockedUri: 'https://malicious.com/script.js',
      });

      addCSPViolation({
        timestamp: thirtyMinutesAgo.toISOString(),
        documentUri: 'https://example.com/page2',
        violatedDirective: 'script-src',
        blockedUri: 'https://malicious.com/script.js',
      });

      addCSPViolation({
        timestamp: twoHoursAgo.toISOString(),
        documentUri: 'https://example.com/page3',
        violatedDirective: 'script-src',
        blockedUri: 'https://malicious.com/script.js',
      });

      const stats = getCSPViolationStats();
      expect(stats.totalViolations).toBe(3);
      expect(stats.recentViolations).toBe(2); // Now and 30 min ago
    });

    it('handles URL parsing for blocked URIs', () => {
      addCSPViolation({
        timestamp: new Date().toISOString(),
        documentUri: 'https://example.com/page',
        violatedDirective: 'script-src',
        blockedUri: 'https://cdn.example.com:8080/path/to/script.js?query=1',
      });

      const stats = getCSPViolationStats();
      expect(stats.violationsByBlockedUri['cdn.example.com']).toBe(1);
    });

    it('handles inline blocked URIs', () => {
      addCSPViolation({
        timestamp: new Date().toISOString(),
        documentUri: 'https://example.com/page',
        violatedDirective: 'script-src',
        blockedUri: 'inline',
      });

      const stats = getCSPViolationStats();
      expect(stats.violationsByBlockedUri['inline']).toBe(1);
    });

    it('handles eval blocked URIs', () => {
      addCSPViolation({
        timestamp: new Date().toISOString(),
        documentUri: 'https://example.com/page',
        violatedDirective: 'script-src',
        blockedUri: 'eval',
      });

      const stats = getCSPViolationStats();
      expect(stats.violationsByBlockedUri['eval']).toBe(1);
    });

    it('handles invalid URLs gracefully', () => {
      addCSPViolation({
        timestamp: new Date().toISOString(),
        documentUri: 'https://example.com/page',
        violatedDirective: 'script-src',
        blockedUri: 'not-a-valid-url',
      });

      const stats = getCSPViolationStats();
      // Should keep original if not a valid URL
      expect(stats.violationsByBlockedUri['not-a-valid-url']).toBe(1);
    });

    it('tracks oldest and newest violations', () => {
      const oldTimestamp = '2024-01-01T00:00:00Z';
      const newTimestamp = '2024-06-01T00:00:00Z';

      addCSPViolation({
        timestamp: oldTimestamp,
        documentUri: 'https://example.com/page1',
        violatedDirective: 'script-src',
        blockedUri: 'https://malicious.com/script.js',
      });

      addCSPViolation({
        timestamp: newTimestamp,
        documentUri: 'https://example.com/page2',
        violatedDirective: 'script-src',
        blockedUri: 'https://malicious.com/script.js',
      });

      const stats = getCSPViolationStats();
      expect(stats.newestViolation).toBe(newTimestamp);
      expect(stats.oldestViolation).toBe(oldTimestamp);
    });

    it('handles empty hostname from URL', () => {
      addCSPViolation({
        timestamp: new Date().toISOString(),
        documentUri: 'https://example.com/page',
        violatedDirective: 'script-src',
        blockedUri: 'data:text/javascript,alert(1)',
      });

      const stats = getCSPViolationStats();
      // Should fall back to original URI when hostname is empty
      expect(Object.keys(stats.violationsByBlockedUri).length).toBe(1);
    });
  });

  describe('clearCSPViolations', () => {
    it('clears all violations', () => {
      for (let i = 0; i < 5; i++) {
        addCSPViolation({
          timestamp: new Date().toISOString(),
          documentUri: `https://example.com/page${i}`,
          violatedDirective: 'script-src',
          blockedUri: 'https://malicious.com/script.js',
        });
      }

      expect(getCSPViolations().length).toBe(5);

      clearCSPViolations();

      expect(getCSPViolations().length).toBe(0);
    });

    it('clears stats as well', () => {
      addCSPViolation({
        timestamp: new Date().toISOString(),
        documentUri: 'https://example.com/page',
        violatedDirective: 'script-src',
        blockedUri: 'https://malicious.com/script.js',
      });

      clearCSPViolations();

      const stats = getCSPViolationStats();
      expect(stats.totalViolations).toBe(0);
    });

    it('allows adding new violations after clear', () => {
      addCSPViolation({
        timestamp: new Date().toISOString(),
        documentUri: 'https://example.com/page1',
        violatedDirective: 'script-src',
        blockedUri: 'https://malicious.com/script.js',
      });

      clearCSPViolations();

      addCSPViolation({
        timestamp: new Date().toISOString(),
        documentUri: 'https://example.com/page2',
        violatedDirective: 'style-src',
        blockedUri: 'https://malicious.com/style.css',
      });

      const violations = getCSPViolations();
      expect(violations.length).toBe(1);
      expect(violations[0].violatedDirective).toBe('style-src');
    });
  });
});

describe('CSP Violations Storage (Production Mode)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('does nothing in production mode', async () => {
    jest.doMock('@/config/env.public', () => ({
      isDevelopment: false,
    }));

    const {
      addCSPViolation: addViolationProd,
      getCSPViolations: getViolationsProd,
      getCSPViolationStats: getStatsProd,
      clearCSPViolations: clearViolationsProd,
    } = await import('@/lib/security/csp-violations');

    addViolationProd({
      timestamp: new Date().toISOString(),
      documentUri: 'https://example.com/page',
      violatedDirective: 'script-src',
      blockedUri: 'https://malicious.com/script.js',
    });

    expect(getViolationsProd()).toEqual([]);

    const stats = getStatsProd();
    expect(stats.totalViolations).toBe(0);

    // clearCSPViolations should be a no-op in prod
    clearViolationsProd();
    expect(getViolationsProd()).toEqual([]);
  });
});
