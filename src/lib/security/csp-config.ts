/**
 * CSP Configuration Documentation
 *
 * This file documents all Content Security Policy (CSP) directives and exceptions
 * used by the AI Therapist application. Each exception is justified with a clear
 * reason for its inclusion.
 *
 * @see src/lib/security/csp-nonce.ts - Actual CSP header generation
 * @see middleware.ts - Where CSP headers are applied
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
 */

/**
 * CSP Exception Categories
 *
 * AUTHENTICATION: Required for Clerk authentication provider
 * CAPTCHA: Required for reCAPTCHA/Cloudflare Turnstile bot protection
 * DEVELOPMENT: Development-only exceptions for hot reload and debugging
 * ANALYTICS: Required for telemetry and analytics services
 * BACKEND: Required for backend API communication (Convex, Groq)
 */
export const CSP_EXCEPTION_CATEGORIES = {
  AUTHENTICATION: 'authentication',
  CAPTCHA: 'captcha',
  DEVELOPMENT: 'development',
  ANALYTICS: 'analytics',
  BACKEND: 'backend',
} as const;

export type CSPExceptionCategory =
  (typeof CSP_EXCEPTION_CATEGORIES)[keyof typeof CSP_EXCEPTION_CATEGORIES];

/**
 * CSP Exception Documentation Interface
 */
export interface CSPException {
  /** Source pattern (e.g., 'https://*.clerk.com') */
  source: string;
  /** Directives where this source is allowed */
  directives: string[];
  /** Category of the exception */
  category: CSPExceptionCategory;
  /** Detailed explanation of why this exception is needed */
  reason: string;
  /** Whether this is only needed in development */
  devOnly: boolean;
  /** Reference documentation URL if applicable */
  reference?: string;
}

/**
 * All CSP Exceptions with Documentation
 *
 * This serves as the single source of truth for understanding why each
 * CSP exception exists. When adding new exceptions, document them here first.
 */
export const CSP_EXCEPTIONS: CSPException[] = [
  // ============================================================================
  // CLERK AUTHENTICATION
  // ============================================================================
  {
    source: 'https://*.clerk.accounts.dev',
    directives: ['script-src', 'style-src', 'font-src', 'img-src', 'frame-src', 'connect-src'],
    category: 'authentication',
    reason:
      'Clerk development domain for authentication UI components. Required for sign-in/sign-up flows, session management, and user profile interfaces.',
    devOnly: false,
    reference: 'https://clerk.com/docs/security/csp',
  },
  {
    source: 'https://*.clerk.com',
    directives: ['script-src', 'style-src', 'font-src', 'img-src', 'frame-src', 'connect-src'],
    category: 'authentication',
    reason:
      'Clerk production domain for authentication. Hosts the authentication UI scripts, stylesheets, and API endpoints for user management.',
    devOnly: false,
    reference: 'https://clerk.com/docs/security/csp',
  },
  {
    source: 'https://clerk-telemetry.com',
    directives: ['connect-src'],
    category: 'analytics',
    reason:
      'Clerk telemetry endpoint for anonymous usage analytics. Helps Clerk improve their service. Can be disabled if privacy is a concern.',
    devOnly: false,
    reference: 'https://clerk.com/docs/telemetry',
  },

  // ============================================================================
  // RECAPTCHA / BOT PROTECTION
  // ============================================================================
  {
    source: 'https://recaptcha.net',
    directives: ['script-src', 'style-src', 'img-src', 'frame-src', 'connect-src'],
    category: 'captcha',
    reason:
      'Google reCAPTCHA service for bot protection. Used by Clerk for additional security during authentication flows.',
    devOnly: false,
    reference: 'https://developers.google.com/recaptcha/docs/csp',
  },
  {
    source: 'https://www.recaptcha.net',
    directives: ['script-src', 'style-src', 'img-src', 'frame-src', 'connect-src'],
    category: 'captcha',
    reason:
      'Alternative reCAPTCHA domain (www subdomain). Required for complete reCAPTCHA functionality.',
    devOnly: false,
    reference: 'https://developers.google.com/recaptcha/docs/csp',
  },
  {
    source: 'https://www.gstatic.com',
    directives: ['script-src', 'style-src', 'img-src', 'connect-src'],
    category: 'captcha',
    reason: "Google's static content CDN. Hosts reCAPTCHA assets and Google Fonts if used.",
    devOnly: false,
    reference: 'https://developers.google.com/recaptcha/docs/csp',
  },
  {
    source: 'https://challenges.cloudflare.com',
    directives: ['script-src', 'frame-src'],
    category: 'captcha',
    reason:
      'Cloudflare Turnstile CAPTCHA integration. Used as an alternative to reCAPTCHA for bot protection.',
    devOnly: false,
    reference: 'https://developers.cloudflare.com/turnstile/reference/content-security-policy/',
  },

  // ============================================================================
  // FONTS
  // ============================================================================
  {
    source: 'https://fonts.gstatic.com',
    directives: ['font-src'],
    category: 'analytics',
    reason:
      'Google Fonts CDN for loading custom web fonts. Used for typography in authentication UI.',
    devOnly: false,
  },

  // ============================================================================
  // BACKEND SERVICES
  // ============================================================================
  {
    source: 'https://api.groq.com',
    directives: ['connect-src'],
    category: 'backend',
    reason:
      'Groq AI API endpoint for LLM inference. Primary AI provider for therapy conversation responses.',
    devOnly: false,
    reference: 'https://console.groq.com/docs',
  },
  {
    source: 'https://convex.cloud',
    directives: ['connect-src'],
    category: 'backend',
    reason:
      'Convex backend-as-a-service. Handles all database operations, real-time subscriptions, and serverless functions.',
    devOnly: false,
    reference: 'https://docs.convex.dev',
  },

  // ============================================================================
  // DEVELOPMENT ONLY
  // ============================================================================
  {
    source: "'unsafe-eval'",
    directives: ['script-src'],
    category: 'development',
    reason:
      'Required for Next.js Fast Refresh and React DevTools in development. Allows eval() for hot module replacement. NEVER used in production.',
    devOnly: true,
    reference: 'https://nextjs.org/docs/architecture/fast-refresh',
  },
  {
    source: 'ws:',
    directives: ['connect-src'],
    category: 'development',
    reason:
      'WebSocket connections for Next.js hot module replacement in development. Enables live code updates without page refresh.',
    devOnly: true,
  },

  // ============================================================================
  // INLINE CONTENT
  // ============================================================================
  {
    source: "'unsafe-inline'",
    directives: ['style-src'],
    category: 'authentication',
    reason: `Inline styles fallback. While we use nonce-based CSP, some third-party libraries (Clerk, reCAPTCHA) 
may inject inline styles. Modern browsers with CSP Level 2+ support will use the nonce and ignore unsafe-inline.
This serves as a fallback for older browsers.`,
    devOnly: false,
    reference:
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/style-src',
  },
  {
    source: "'unsafe-inline' (script-src)",
    directives: ['script-src'],
    category: 'authentication',
    reason: `Script inline fallback for nonce-based CSP. In production, we use nonce-based CSP which takes 
precedence over unsafe-inline in browsers that support CSP Level 2+. The unsafe-inline is kept as a 
fallback for older browsers that don't support nonces. Scripts without valid nonces will be blocked 
in modern browsers regardless of this directive.`,
    devOnly: false,
    reference:
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src',
  },

  // ============================================================================
  // DATA URLS AND BLOBS
  // ============================================================================
  {
    source: 'data:',
    directives: ['font-src', 'img-src'],
    category: 'authentication',
    reason:
      'Data URIs for inline fonts and images. Used by Clerk for embedded icons and small images.',
    devOnly: false,
  },
  {
    source: 'blob:',
    directives: ['img-src', 'worker-src'],
    category: 'backend',
    reason:
      'Blob URLs for dynamically generated content. Used for Web Workers and dynamically created images.',
    devOnly: false,
  },
];

/**
 * Get CSP exceptions filtered by category
 */
export function getExceptionsByCategory(category: CSPExceptionCategory): CSPException[] {
  return CSP_EXCEPTIONS.filter((e) => e.category === category);
}

/**
 * Get CSP exceptions for a specific directive
 */
export function getExceptionsByDirective(directive: string): CSPException[] {
  return CSP_EXCEPTIONS.filter((e) => e.directives.includes(directive));
}

/**
 * Get only production exceptions (excludes dev-only)
 */
export function getProductionExceptions(): CSPException[] {
  return CSP_EXCEPTIONS.filter((e) => !e.devOnly);
}

/**
 * Get only development exceptions
 */
export function getDevelopmentExceptions(): CSPException[] {
  return CSP_EXCEPTIONS.filter((e) => e.devOnly);
}

/**
 * Summary of CSP Configuration
 *
 * This provides a high-level overview of the CSP setup for documentation purposes.
 */
export const CSP_SUMMARY = {
  /**
   * Overall approach
   */
  approach: `
    The AI Therapist uses a nonce-based Content Security Policy for maximum security.
    Each request generates a unique cryptographic nonce that must be present on
    inline scripts and styles to execute. This prevents XSS attacks while allowing
    legitimate application code to run.
  `,

  /**
   * Development vs Production differences
   */
  environments: {
    development: `
      - Allows 'unsafe-eval' for Next.js Fast Refresh and debugging
      - Allows WebSocket connections (ws:) for hot module replacement
      - All other restrictions remain in place to catch issues early
    `,
    production: `
      - No 'unsafe-eval' allowed
      - Nonce-based script/style execution only
      - 'unsafe-inline' kept as fallback but ignored by modern browsers
      - CSP violation reporting enabled to /api/csp-report
    `,
  },

  /**
   * Key security properties
   */
  securityProperties: [
    'Scripts require valid nonce to execute (XSS protection)',
    'Framing restricted to DENY (clickjacking protection)',
    'Strict transport security enabled with preload',
    'Connect sources limited to known API endpoints',
    'CSP violations logged for monitoring and adjustment',
  ],

  /**
   * How to add new exceptions
   */
  addingExceptions: `
    1. First, document the exception in CSP_EXCEPTIONS array above
    2. Include: source, directives, category, reason, and devOnly flag
    3. Update getCSPHeader() in csp-nonce.ts with the actual directive
    4. Test in development mode first
    5. Verify no CSP violations in browser console
    6. Deploy and monitor /api/csp-report for violations
  `,

  /**
   * Related files
   */
  relatedFiles: {
    'src/lib/security/csp-nonce.ts': 'CSP header generation and nonce creation',
    'middleware.ts': 'Where CSP headers are applied to responses',
    'src/app/api/csp-report/route.ts': 'CSP violation reporting endpoint',
    'src/lib/security/csp-violations.ts': 'In-memory violation storage for dev',
    'src/lib/security/nonce.ts': 'Server component nonce utilities',
  },
} as const;
