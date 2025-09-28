/** @type {import('next').NextConfig} */
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
import path from 'path';
import { ensureAllowedOrigins } from './scripts/cors-helpers.js';

const nextConfig = {
  serverExternalPackages: ['prisma'],
  // Hide development indicators (Turbopack icon, etc.)
  devIndicators: false,
  // Disable client source maps in development to avoid noisy 3rd-party warnings
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = false;
    }
    return config;
  },
  // Ensure Next uses this project as the workspace root (fixes multi-lockfile warning)
  outputFileTracingRoot: path.resolve(new URL('.', import.meta.url).pathname),
  // Only expose client-safe environment variables
  env: {
    // Remove server-only secrets from client bundle
    // GROQ_API_KEY should be server-only
    // NEXTAUTH_SECRET should be server-only  
    // DATABASE_URL should be server-only
  },
  // Secure CORS configuration
  async headers() {
    const { allowedOrigins, isDevelopment, usedFallback } = ensureAllowedOrigins(process.env, { silent: true });

    if (usedFallback && isDevelopment) {
      console.warn(`[CORS] Using development fallback origins: ${allowedOrigins.join(', ')}`);
    }

    const escapeForRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const baseHeaders = [
      {
        key: 'Access-Control-Allow-Methods',
        value: 'GET,POST,PUT,DELETE,OPTIONS',
      },
      {
        key: 'Access-Control-Allow-Headers',
        value: 'Content-Type, Authorization, X-Requested-With',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
      },
      {
        key: 'Cache-Control',
        value: isDevelopment ? 'no-cache, no-store, must-revalidate' : 'public, max-age=31536000, immutable',
      },
      {
        key: 'Vary',
        value: 'Accept-Encoding, User-Agent, Origin',
      },
    ];

    const securityHeaders = (originValue, credentialsAllowed) => ([
      {
        key: 'Access-Control-Allow-Origin',
        value: originValue,
      },
      {
        key: 'Access-Control-Allow-Credentials',
        value: credentialsAllowed ? 'true' : 'false',
      },
      ...baseHeaders,
      {
        key: 'Content-Security-Policy',
        value: isDevelopment
          ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob:; connect-src 'self' https://api.groq.com ws:;"
          : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob:; connect-src 'self' https://api.groq.com;"
      }
    ]);

    const headers = [];

    allowedOrigins.forEach((origin) => {
      headers.push({
        source: '/(.*)',
        has: [{ type: 'header', key: 'origin', value: escapeForRegex(origin) }],
        headers: securityHeaders(origin, true),
      });
    });

    // Fallback for unmatched origins (defaults to first allowed origin without origin header)
    headers.push({
      source: '/(.*)',
      headers: securityHeaders(allowedOrigins[0], true),
    });

    return headers;
  },
}

export default withNextIntl(nextConfig);
