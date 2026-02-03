/**
 * CSP Nonce Generation
 *
 * Generates cryptographically secure nonces for Content Security Policy headers.
 * Enables production CSP without unsafe-eval and unsafe-inline directives.
 *
 * Security:
 * - Cryptographically random nonces (128-bit)
 * - Environment-aware CSP directives
 * - Development mode allows hot reload
 * - Production mode requires nonces for all scripts/styles
 */

/**
 * Generate a cryptographically secure CSP nonce
 * Uses Web Crypto API for Edge Runtime compatibility
 * @returns Base64-encoded random nonce
 */
export function generateCSPNonce(): string {
  // Use Web Crypto API for Edge Runtime compatibility
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);

  // Convert to base64 using btoa (browser/Edge compatible)
  const base64 = btoa(String.fromCharCode(...array));
  return base64;
}

/**
 * Get Content Security Policy header value
 * @param nonce - Cryptographic nonce for inline scripts/styles
 * @param isDev - Whether running in development mode
 * @returns CSP header value string
 *
 * @see src/lib/security/csp-config.ts for documentation of all CSP exceptions
 */
export function getCSPHeader(nonce: string, isDev: boolean): string {
  const baseDirectives: Record<string, string[]> = {
    'default-src': ["'self'"],

    // Script sources
    // Development: Allow unsafe-eval for hot reload, unsafe-inline for convenience
    // Production: Use nonce-based CSP for modern browsers only (no unsafe-inline fallback)
    'script-src': isDev
      ? [
          "'self'",
          "'unsafe-eval'",
          "'unsafe-inline'",
          'https://*.clerk.accounts.dev',
          'https://*.clerk.com',
          'https://challenges.cloudflare.com',
          'https://recaptcha.net',
          'https://www.recaptcha.net',
          'https://www.gstatic.com',
        ]
      : [
          "'self'",
          `'nonce-${nonce}'`,
          'https://*.clerk.accounts.dev',
          'https://*.clerk.com',
          'https://challenges.cloudflare.com',
          'https://recaptcha.net',
          'https://www.recaptcha.net',
          'https://www.gstatic.com',
        ],

    // Style sources
    // Nonce-based for modern browsers only (no unsafe-inline fallback)
    'style-src': isDev
      ? [
          "'self'",
          "'unsafe-inline'",
          'https://*.clerk.accounts.dev',
          'https://*.clerk.com',
          'https://recaptcha.net',
          'https://www.recaptcha.net',
          'https://www.gstatic.com',
        ]
      : [
          "'self'",
          `'nonce-${nonce}'`,
          'https://*.clerk.accounts.dev',
          'https://*.clerk.com',
          'https://recaptcha.net',
          'https://www.recaptcha.net',
          'https://www.gstatic.com',
        ],

    // Font sources
    'font-src': [
      "'self'",
      'data:',
      'https://*.clerk.accounts.dev',
      'https://*.clerk.com',
      'https://fonts.gstatic.com',
    ],

    // Image sources
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https://*.clerk.accounts.dev',
      'https://*.clerk.com',
      'https://recaptcha.net',
      'https://www.recaptcha.net',
      'https://www.gstatic.com',
    ],

    // Worker sources
    'worker-src': ["'self'", 'blob:'],

    // Frame sources
    'frame-src': [
      'https://*.clerk.accounts.dev',
      'https://*.clerk.com',
      'https://recaptcha.net',
      'https://www.recaptcha.net',
      'https://challenges.cloudflare.com',
    ],

    // Connect sources - API endpoints
    'connect-src': isDev
      ? [
          "'self'",
          'https://api.groq.com',
          'https://*.clerk.accounts.dev',
          'https://*.clerk.com',
          'https://clerk-telemetry.com',
          'https://convex.cloud',
          'https://recaptcha.net',
          'https://www.recaptcha.net',
          'https://www.gstatic.com',
          'ws:',
        ]
      : [
          "'self'",
          'https://api.groq.com',
          'https://*.clerk.accounts.dev',
          'https://*.clerk.com',
          'https://clerk-telemetry.com',
          'https://convex.cloud',
          'https://recaptcha.net',
          'https://www.recaptcha.net',
          'https://www.gstatic.com',
        ],

    // CSP Reporting - send violation reports to our endpoint
    // This helps identify potential security issues and CSP misconfigurations
    'report-uri': ['/api/csp-report'],
  };

  return Object.entries(baseDirectives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

/**
 * Get the Report-To header for CSP reporting (Reporting API)
 * @returns Report-To header value as JSON string
 *
 * @see https://w3c.github.io/reporting/
 */
function getReportToHeader(): string {
  const reportGroup = {
    group: 'csp-endpoint',
    max_age: 10886400, // 126 days
    endpoints: [{ url: '/api/csp-report' }],
  };

  return JSON.stringify(reportGroup);
}

/**
 * Get all security headers including CSP
 * @param nonce - CSP nonce for this request
 * @param isDev - Whether running in development mode
 * @returns Record of security headers
 */
export function getSecurityHeaders(nonce: string, isDev: boolean): Record<string, string> {
  return {
    'Content-Security-Policy': getCSPHeader(nonce, isDev),
    'Report-To': getReportToHeader(),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  };
}
