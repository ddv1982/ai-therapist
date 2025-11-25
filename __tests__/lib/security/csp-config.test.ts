/**
 * Tests for CSP Configuration
 *
 * Validates CSP exception documentation and utility functions
 */

import {
  CSP_EXCEPTION_CATEGORIES,
  CSP_EXCEPTIONS,
  CSP_SUMMARY,
  getExceptionsByCategory,
  getExceptionsByDirective,
  getProductionExceptions,
  getDevelopmentExceptions,
  type CSPExceptionCategory,
} from '@/lib/security/csp-config';

describe('CSP Configuration', () => {
  describe('CSP_EXCEPTION_CATEGORIES', () => {
    it('has all required categories', () => {
      expect(CSP_EXCEPTION_CATEGORIES.AUTHENTICATION).toBe('authentication');
      expect(CSP_EXCEPTION_CATEGORIES.CAPTCHA).toBe('captcha');
      expect(CSP_EXCEPTION_CATEGORIES.DEVELOPMENT).toBe('development');
      expect(CSP_EXCEPTION_CATEGORIES.ANALYTICS).toBe('analytics');
      expect(CSP_EXCEPTION_CATEGORIES.BACKEND).toBe('backend');
    });

    it('contains exactly 5 categories', () => {
      const categoryCount = Object.keys(CSP_EXCEPTION_CATEGORIES).length;
      expect(categoryCount).toBe(5);
    });
  });

  describe('CSP_EXCEPTIONS', () => {
    it('is a non-empty array', () => {
      expect(Array.isArray(CSP_EXCEPTIONS)).toBe(true);
      expect(CSP_EXCEPTIONS.length).toBeGreaterThan(0);
    });

    it('all exceptions have required fields', () => {
      CSP_EXCEPTIONS.forEach((exception) => {
        expect(exception.source).toBeDefined();
        expect(typeof exception.source).toBe('string');
        expect(exception.source.length).toBeGreaterThan(0);

        expect(exception.directives).toBeDefined();
        expect(Array.isArray(exception.directives)).toBe(true);
        expect(exception.directives.length).toBeGreaterThan(0);

        expect(exception.category).toBeDefined();
        expect(typeof exception.category).toBe('string');

        expect(exception.reason).toBeDefined();
        expect(typeof exception.reason).toBe('string');
        expect(exception.reason.length).toBeGreaterThan(0);

        expect(typeof exception.devOnly).toBe('boolean');
      });
    });

    it('all exceptions have valid categories', () => {
      const validCategories = Object.values(CSP_EXCEPTION_CATEGORIES);

      CSP_EXCEPTIONS.forEach((exception) => {
        expect(validCategories).toContain(exception.category);
      });
    });

    it('all directives are valid CSP directive names', () => {
      const validDirectives = [
        'script-src',
        'style-src',
        'font-src',
        'img-src',
        'frame-src',
        'connect-src',
        'worker-src',
        'default-src',
        'object-src',
        'media-src',
        'base-uri',
        'form-action',
      ];

      CSP_EXCEPTIONS.forEach((exception) => {
        exception.directives.forEach((directive) => {
          expect(validDirectives).toContain(directive);
        });
      });
    });

    it('devOnly flag is always a boolean', () => {
      CSP_EXCEPTIONS.forEach((exception) => {
        expect(typeof exception.devOnly).toBe('boolean');
      });
    });

    it('contains authentication exceptions for Clerk', () => {
      const clerkExceptions = CSP_EXCEPTIONS.filter(
        (e) => e.source.includes('clerk') && e.category === 'authentication'
      );
      expect(clerkExceptions.length).toBeGreaterThan(0);
    });

    it('contains captcha exceptions for reCAPTCHA', () => {
      const recaptchaExceptions = CSP_EXCEPTIONS.filter(
        (e) => e.source.includes('recaptcha') && e.category === 'captcha'
      );
      expect(recaptchaExceptions.length).toBeGreaterThan(0);
    });

    it('contains backend exceptions for API endpoints', () => {
      const backendExceptions = CSP_EXCEPTIONS.filter((e) => e.category === 'backend');
      expect(backendExceptions.length).toBeGreaterThan(0);

      const sources = backendExceptions.map((e) => e.source);
      expect(sources.some((s) => s.includes('groq'))).toBe(true);
      expect(sources.some((s) => s.includes('convex'))).toBe(true);
    });

    it('contains development-only exceptions', () => {
      const devExceptions = CSP_EXCEPTIONS.filter((e) => e.devOnly === true);
      expect(devExceptions.length).toBeGreaterThan(0);
    });
  });

  describe('getExceptionsByCategory', () => {
    it('filters exceptions by authentication category', () => {
      const authExceptions = getExceptionsByCategory('authentication');

      expect(Array.isArray(authExceptions)).toBe(true);
      expect(authExceptions.length).toBeGreaterThan(0);
      authExceptions.forEach((exception) => {
        expect(exception.category).toBe('authentication');
      });
    });

    it('filters exceptions by captcha category', () => {
      const captchaExceptions = getExceptionsByCategory('captcha');

      expect(Array.isArray(captchaExceptions)).toBe(true);
      expect(captchaExceptions.length).toBeGreaterThan(0);
      captchaExceptions.forEach((exception) => {
        expect(exception.category).toBe('captcha');
      });
    });

    it('filters exceptions by development category', () => {
      const devExceptions = getExceptionsByCategory('development');

      expect(Array.isArray(devExceptions)).toBe(true);
      expect(devExceptions.length).toBeGreaterThan(0);
      devExceptions.forEach((exception) => {
        expect(exception.category).toBe('development');
        expect(exception.devOnly).toBe(true);
      });
    });

    it('filters exceptions by analytics category', () => {
      const analyticsExceptions = getExceptionsByCategory('analytics');

      expect(Array.isArray(analyticsExceptions)).toBe(true);
      analyticsExceptions.forEach((exception) => {
        expect(exception.category).toBe('analytics');
      });
    });

    it('filters exceptions by backend category', () => {
      const backendExceptions = getExceptionsByCategory('backend');

      expect(Array.isArray(backendExceptions)).toBe(true);
      expect(backendExceptions.length).toBeGreaterThan(0);
      backendExceptions.forEach((exception) => {
        expect(exception.category).toBe('backend');
      });
    });

    it('returns empty array for unknown category', () => {
      // TypeScript would complain, but test runtime behavior
      const unknownExceptions = getExceptionsByCategory('unknown-category' as CSPExceptionCategory);

      expect(Array.isArray(unknownExceptions)).toBe(true);
      expect(unknownExceptions.length).toBe(0);
    });
  });

  describe('getExceptionsByDirective', () => {
    it('filters exceptions by script-src directive', () => {
      const scriptExceptions = getExceptionsByDirective('script-src');

      expect(Array.isArray(scriptExceptions)).toBe(true);
      expect(scriptExceptions.length).toBeGreaterThan(0);
      scriptExceptions.forEach((exception) => {
        expect(exception.directives).toContain('script-src');
      });
    });

    it('filters exceptions by connect-src directive', () => {
      const connectExceptions = getExceptionsByDirective('connect-src');

      expect(Array.isArray(connectExceptions)).toBe(true);
      expect(connectExceptions.length).toBeGreaterThan(0);
      connectExceptions.forEach((exception) => {
        expect(exception.directives).toContain('connect-src');
      });
    });

    it('filters exceptions by style-src directive', () => {
      const styleExceptions = getExceptionsByDirective('style-src');

      expect(Array.isArray(styleExceptions)).toBe(true);
      styleExceptions.forEach((exception) => {
        expect(exception.directives).toContain('style-src');
      });
    });

    it('filters exceptions by font-src directive', () => {
      const fontExceptions = getExceptionsByDirective('font-src');

      expect(Array.isArray(fontExceptions)).toBe(true);
      fontExceptions.forEach((exception) => {
        expect(exception.directives).toContain('font-src');
      });
    });

    it('filters exceptions by img-src directive', () => {
      const imgExceptions = getExceptionsByDirective('img-src');

      expect(Array.isArray(imgExceptions)).toBe(true);
      imgExceptions.forEach((exception) => {
        expect(exception.directives).toContain('img-src');
      });
    });

    it('filters exceptions by frame-src directive', () => {
      const frameExceptions = getExceptionsByDirective('frame-src');

      expect(Array.isArray(frameExceptions)).toBe(true);
      frameExceptions.forEach((exception) => {
        expect(exception.directives).toContain('frame-src');
      });
    });

    it('returns empty array for unknown directive', () => {
      const unknownExceptions = getExceptionsByDirective('unknown-directive');

      expect(Array.isArray(unknownExceptions)).toBe(true);
      expect(unknownExceptions.length).toBe(0);
    });

    it('returns empty array for empty directive string', () => {
      const emptyExceptions = getExceptionsByDirective('');

      expect(Array.isArray(emptyExceptions)).toBe(true);
      expect(emptyExceptions.length).toBe(0);
    });
  });

  describe('getProductionExceptions', () => {
    it('excludes devOnly exceptions', () => {
      const prodExceptions = getProductionExceptions();

      expect(Array.isArray(prodExceptions)).toBe(true);
      expect(prodExceptions.length).toBeGreaterThan(0);
      prodExceptions.forEach((exception) => {
        expect(exception.devOnly).toBe(false);
      });
    });

    it('includes all non-dev exceptions', () => {
      const prodExceptions = getProductionExceptions();
      const allNonDevExceptions = CSP_EXCEPTIONS.filter((e) => !e.devOnly);

      expect(prodExceptions.length).toBe(allNonDevExceptions.length);
    });

    it('does not include unsafe-eval', () => {
      const prodExceptions = getProductionExceptions();
      const unsafeEvalException = prodExceptions.find((e) => e.source === "'unsafe-eval'");

      // unsafe-eval should be dev-only
      expect(unsafeEvalException).toBeUndefined();
    });

    it('does not include ws: WebSocket', () => {
      const prodExceptions = getProductionExceptions();
      const wsException = prodExceptions.find((e) => e.source === 'ws:');

      // ws: should be dev-only
      expect(wsException).toBeUndefined();
    });
  });

  describe('getDevelopmentExceptions', () => {
    it('returns only devOnly exceptions', () => {
      const devExceptions = getDevelopmentExceptions();

      expect(Array.isArray(devExceptions)).toBe(true);
      expect(devExceptions.length).toBeGreaterThan(0);
      devExceptions.forEach((exception) => {
        expect(exception.devOnly).toBe(true);
      });
    });

    it('includes unsafe-eval for hot reload', () => {
      const devExceptions = getDevelopmentExceptions();
      const unsafeEvalException = devExceptions.find((e) => e.source === "'unsafe-eval'");

      expect(unsafeEvalException).toBeDefined();
      expect(unsafeEvalException?.directives).toContain('script-src');
    });

    it('includes ws: for WebSocket hot reload', () => {
      const devExceptions = getDevelopmentExceptions();
      const wsException = devExceptions.find((e) => e.source === 'ws:');

      expect(wsException).toBeDefined();
      expect(wsException?.directives).toContain('connect-src');
    });

    it('all dev exceptions have category development', () => {
      const devExceptions = getDevelopmentExceptions();

      devExceptions.forEach((exception) => {
        expect(exception.category).toBe('development');
      });
    });
  });

  describe('CSP_SUMMARY', () => {
    it('has approach documentation', () => {
      expect(CSP_SUMMARY.approach).toBeDefined();
      expect(typeof CSP_SUMMARY.approach).toBe('string');
      expect(CSP_SUMMARY.approach.length).toBeGreaterThan(0);
    });

    it('has environment documentation', () => {
      expect(CSP_SUMMARY.environments).toBeDefined();
      expect(CSP_SUMMARY.environments.development).toBeDefined();
      expect(CSP_SUMMARY.environments.production).toBeDefined();
    });

    it('has security properties list', () => {
      expect(CSP_SUMMARY.securityProperties).toBeDefined();
      expect(Array.isArray(CSP_SUMMARY.securityProperties)).toBe(true);
      expect(CSP_SUMMARY.securityProperties.length).toBeGreaterThan(0);
    });

    it('has instructions for adding exceptions', () => {
      expect(CSP_SUMMARY.addingExceptions).toBeDefined();
      expect(typeof CSP_SUMMARY.addingExceptions).toBe('string');
      expect(CSP_SUMMARY.addingExceptions.length).toBeGreaterThan(0);
    });

    it('has related files documentation', () => {
      expect(CSP_SUMMARY.relatedFiles).toBeDefined();
      expect(typeof CSP_SUMMARY.relatedFiles).toBe('object');

      // Should reference key files
      const files = Object.keys(CSP_SUMMARY.relatedFiles);
      expect(files.some((f) => f.includes('csp-nonce'))).toBe(true);
      expect(files.some((f) => f.includes('middleware'))).toBe(true);
    });
  });

  describe('Exception structure validation', () => {
    it('optional reference field is either undefined or a string', () => {
      CSP_EXCEPTIONS.forEach((exception) => {
        if (exception.reference !== undefined) {
          expect(typeof exception.reference).toBe('string');
          expect(exception.reference.length).toBeGreaterThan(0);
        }
      });
    });

    it('exceptions with references have valid URLs', () => {
      const exceptionsWithRefs = CSP_EXCEPTIONS.filter((e) => e.reference);

      exceptionsWithRefs.forEach((exception) => {
        expect(exception.reference).toMatch(/^https?:\/\//);
      });
    });

    it('exception sources follow valid patterns', () => {
      CSP_EXCEPTIONS.forEach((exception) => {
        // Should be either:
        // - A URL pattern (https://...)
        // - A keyword starting with quote ('unsafe-inline', 'unsafe-eval', or with directive annotation)
        // - A protocol (ws:, data:, blob:)
        const isUrlPattern = exception.source.startsWith('https://');
        const isKeyword = exception.source.startsWith("'");
        const isProtocol = exception.source.endsWith(':');

        expect(isUrlPattern || isKeyword || isProtocol).toBe(true);
      });
    });
  });

  describe('Category distribution', () => {
    it('has reasonable distribution of categories', () => {
      const categories = Object.values(CSP_EXCEPTION_CATEGORIES);

      categories.forEach((category) => {
        const exceptions = getExceptionsByCategory(category);
        // Each category should have at least one exception or be empty
        expect(Array.isArray(exceptions)).toBe(true);
      });
    });

    it('total exceptions equal sum of production and development', () => {
      const prodExceptions = getProductionExceptions();
      const devExceptions = getDevelopmentExceptions();

      expect(prodExceptions.length + devExceptions.length).toBe(CSP_EXCEPTIONS.length);
    });
  });
});
