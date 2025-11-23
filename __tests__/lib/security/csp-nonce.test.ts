/**
 * Tests for CSP Nonce Generation
 *
 * Validates Content Security Policy nonce generation and header construction
 */

import { generateCSPNonce, getCSPHeader, getSecurityHeaders } from '@/lib/security/csp-nonce';

describe('CSP Nonce Generation', () => {
  describe('generateCSPNonce', () => {
    it('generates a base64 string', () => {
      const nonce = generateCSPNonce();
      
      expect(typeof nonce).toBe('string');
      expect(nonce.length).toBeGreaterThan(0);
      
      // Should be valid base64
      expect(() => Buffer.from(nonce, 'base64')).not.toThrow();
    });

    it('generates unique nonces', () => {
      const nonces = new Set<string>();
      
      // Generate 1000 nonces
      for (let i = 0; i < 1000; i++) {
        nonces.add(generateCSPNonce());
      }
      
      // All should be unique
      expect(nonces.size).toBe(1000);
    });

    it('generates nonces of sufficient length', () => {
      const nonce = generateCSPNonce();
      
      // 16 bytes = 128 bits of entropy
      // Base64 encoding makes it ~22 characters
      expect(nonce.length).toBeGreaterThanOrEqual(20);
    });
  });

  describe('getCSPHeader', () => {
    describe('Development mode', () => {
      it('includes unsafe-eval for hot reload', () => {
        const nonce = 'test-nonce-123';
        const csp = getCSPHeader(nonce, true);
        
        expect(csp).toContain("'unsafe-eval'");
        expect(csp).toContain("'unsafe-inline'");
      });

      it('includes WebSocket for hot reload', () => {
        const nonce = 'test-nonce-123';
        const csp = getCSPHeader(nonce, true);
        
        expect(csp).toContain('connect-src');
        expect(csp).toContain('ws:');
      });

      it('includes all required external domains', () => {
        const nonce = 'test-nonce-123';
        const csp = getCSPHeader(nonce, true);
        
        // Clerk domains
        expect(csp).toContain('https://*.clerk.accounts.dev');
        expect(csp).toContain('https://*.clerk.com');
        
        // API domains
        expect(csp).toContain('https://api.groq.com');
        expect(csp).toContain('https://convex.cloud');
        
        // reCAPTCHA domains
        expect(csp).toContain('https://recaptcha.net');
        expect(csp).toContain('https://www.recaptcha.net');
        expect(csp).toContain('https://www.gstatic.com');
      });
    });

    describe('Production mode', () => {
      it('removes unsafe-eval and unsafe-inline', () => {
        const nonce = 'test-nonce-123';
        const csp = getCSPHeader(nonce, false);
        
        expect(csp).not.toContain("'unsafe-eval'");
        expect(csp).toContain("'unsafe-inline'"); // Still needed for styles
      });

      it('includes nonce in script-src', () => {
        const nonce = 'test-nonce-123';
        const csp = getCSPHeader(nonce, false);
        
        expect(csp).toContain(`'nonce-${nonce}'`);
      });

      it('does not include WebSocket', () => {
        const nonce = 'test-nonce-123';
        const csp = getCSPHeader(nonce, false);
        
        expect(csp).not.toContain('ws:');
      });

      it('still includes external domains', () => {
        const nonce = 'test-nonce-123';
        const csp = getCSPHeader(nonce, false);
        
        expect(csp).toContain('https://*.clerk.accounts.dev');
        expect(csp).toContain('https://api.groq.com');
      });
    });

    describe('Required directives', () => {
      it('includes default-src', () => {
        const csp = getCSPHeader('test', false);
        expect(csp).toContain("default-src 'self'");
      });

      it('includes script-src', () => {
        const csp = getCSPHeader('test', false);
        expect(csp).toContain('script-src');
      });

      it('includes style-src', () => {
        const csp = getCSPHeader('test', false);
        expect(csp).toContain('style-src');
      });

      it('includes img-src', () => {
        const csp = getCSPHeader('test', false);
        expect(csp).toContain('img-src');
      });

      it('includes font-src', () => {
        const csp = getCSPHeader('test', false);
        expect(csp).toContain('font-src');
      });

      it('includes connect-src', () => {
        const csp = getCSPHeader('test', false);
        expect(csp).toContain('connect-src');
      });

      it('includes frame-src', () => {
        const csp = getCSPHeader('test', false);
        expect(csp).toContain('frame-src');
      });

      it('includes worker-src', () => {
        const csp = getCSPHeader('test', false);
        expect(csp).toContain('worker-src');
      });
    });

    describe('CSP format', () => {
      it('separates directives with semicolons', () => {
        const csp = getCSPHeader('test', false);
        
        const directives = csp.split('; ');
        expect(directives.length).toBeGreaterThan(1);
        
        // Each directive should have a key and values
        directives.forEach(directive => {
          expect(directive).toMatch(/^[\w-]+ .+$/);
        });
      });

      it('formats directives correctly', () => {
        const csp = getCSPHeader('test', false);
        
        // Should match pattern: "directive-name value1 value2; next-directive ..."
        expect(csp).toMatch(/^[\w-]+ .+?(?:; [\w-]+ .+?)*$/);
      });
    });
  });

  describe('getSecurityHeaders', () => {
    it('includes CSP header', () => {
      const nonce = 'test-nonce';
      const headers = getSecurityHeaders(nonce, false);
      
      expect(headers['Content-Security-Policy']).toBeDefined();
      expect(headers['Content-Security-Policy']).toContain(`'nonce-${nonce}'`);
    });

    it('includes all security headers', () => {
      const headers = getSecurityHeaders('test', false);
      
      expect(headers['Content-Security-Policy']).toBeDefined();
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-XSS-Protection']).toBe('1; mode=block');
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
      expect(headers['Permissions-Policy']).toContain('camera=()');
      expect(headers['Strict-Transport-Security']).toContain('max-age=63072000');
    });

    it('returns correct HSTS header', () => {
      const headers = getSecurityHeaders('test', false);
      
      expect(headers['Strict-Transport-Security']).toBe(
        'max-age=63072000; includeSubDomains; preload'
      );
    });

    it('returns correct Permissions-Policy', () => {
      const headers = getSecurityHeaders('test', false);
      
      const policy = headers['Permissions-Policy'];
      expect(policy).toContain('camera=()');
      expect(policy).toContain('microphone=()');
      expect(policy).toContain('geolocation=()');
      expect(policy).toContain('interest-cohort=()');
    });
  });

  describe('Security requirements', () => {
    it('production CSP does not allow inline scripts', () => {
      const csp = getCSPHeader('test', false);
      
      // Should not have unsafe-inline in script-src (after 'script-src' and before next ';')
      const scriptSrcMatch = csp.match(/script-src ([^;]+)/);
      expect(scriptSrcMatch).toBeTruthy();
      
      const scriptSrc = scriptSrcMatch![1];
      expect(scriptSrc).not.toContain("'unsafe-inline'");
      expect(scriptSrc).not.toContain("'unsafe-eval'");
    });

    it('production CSP requires nonce for scripts', () => {
      const nonce = 'secure-nonce-abc123';
      const csp = getCSPHeader(nonce, false);
      
      expect(csp).toContain(`'nonce-${nonce}'`);
    });

    it('allows necessary external resources', () => {
      const csp = getCSPHeader('test', false);
      
      // Clerk for authentication
      expect(csp).toContain('clerk');
      
      // Groq for AI
      expect(csp).toContain('groq');
      
      // Convex for backend
      expect(csp).toContain('convex');
    });

    it('restricts frame sources', () => {
      const csp = getCSPHeader('test', false);
      
      const frameSrcMatch = csp.match(/frame-src ([^;]+)/);
      expect(frameSrcMatch).toBeTruthy();
      
      const frameSrc = frameSrcMatch![1];
      // Should only allow specific domains, not 'self' or wildcards
      expect(frameSrc).not.toContain("'self'");
      expect(frameSrc).toContain('clerk');
    });
  });
});
