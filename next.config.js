/** @type {import('next').NextConfig} */
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
import path from 'path';

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
    const isDevelopment = process.env.NODE_ENV === 'development';
    const parseOriginList = (raw) =>
      typeof raw === 'string'
        ? raw.split(',').map((value) => value.trim()).filter(Boolean)
        : [];

    const devOrigins = parseOriginList(process.env.DEV_CORS_ORIGIN);
    const prodOrigins = parseOriginList(process.env.CORS_ALLOWED_ORIGIN);

    let resolvedOrigin = 'https://your-domain.com';
    let allowCredentials = 'false';

    if (isDevelopment) {
      if (devOrigins.length === 0) {
        resolvedOrigin = '*';
      } else if (devOrigins.length === 1) {
        resolvedOrigin = devOrigins[0];
        allowCredentials = resolvedOrigin !== '*' ? 'true' : 'false';
      } else {
        resolvedOrigin = '*';
      }
    } else if (prodOrigins.length > 0) {
      resolvedOrigin = prodOrigins[0];
      allowCredentials = resolvedOrigin !== '*' ? 'true' : 'false';
    }
    
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            // Allow network access for development or env-driven origin in prod
            value: resolvedOrigin,
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: allowCredentials,
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,DELETE,OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
          // Add security headers
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
          // Content Security Policy - Prevents XSS attacks
          {
            key: 'Content-Security-Policy',
            value: isDevelopment 
              ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob:; connect-src 'self' https://api.groq.com ws:;"
              : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob:; connect-src 'self' https://api.groq.com;",
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
          // Mobile Safari specific headers
          {
            key: 'Cache-Control',
            value: isDevelopment ? 'no-cache, no-store, must-revalidate' : 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding, User-Agent, Origin',
          },
        ],
      },
    ]
  },
}

export default withNextIntl(nextConfig);
