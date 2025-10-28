/** @type {import('next').NextConfig} */
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
import path from 'path';

const isDevelopment = process.env.NODE_ENV === 'development';

const nextConfig = {
  serverExternalPackages: [],
  devIndicators: false,
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.devtool = false;
      // Use in-memory cache in development to avoid pack-file serialization overhead
      config.cache = { type: 'memory' };
    }
    if (!dev) {
      // Use in-memory cache during production build to silence big-string pack cache warnings
      // and avoid serializing large prompt strings into the filesystem cache.
      config.cache = { type: 'memory' };
    }
    return config;
  },
  outputFileTracingRoot: path.resolve(new URL('.', import.meta.url).pathname),
  async headers() {
    const securityHeaders = [
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
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
      },
      {
        key: 'Content-Security-Policy',
        value: isDevelopment
          ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com https://recaptcha.net https://www.recaptcha.net https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com https://recaptcha.net https://www.recaptcha.net https://www.gstatic.com; font-src 'self' data: https://*.clerk.accounts.dev https://*.clerk.com https://fonts.gstatic.com; img-src 'self' data: blob: https://*.clerk.accounts.dev https://*.clerk.com https://recaptcha.net https://www.recaptcha.net https://www.gstatic.com; frame-src https://*.clerk.accounts.dev https://*.clerk.com https://recaptcha.net https://www.recaptcha.net https://challenges.cloudflare.com; connect-src 'self' https://api.groq.com https://*.clerk.accounts.dev https://*.clerk.com https://convex.cloud https://recaptcha.net https://www.recaptcha.net https://www.gstatic.com ws:;"
          : "default-src 'self'; script-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com https://recaptcha.net https://www.recaptcha.net https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com https://recaptcha.net https://www.recaptcha.net https://www.gstatic.com; font-src 'self' data: https://*.clerk.accounts.dev https://*.clerk.com https://fonts.gstatic.com; img-src 'self' data: blob: https://*.clerk.accounts.dev https://*.clerk.com https://recaptcha.net https://www.recaptcha.net https://www.gstatic.com; frame-src https://*.clerk.accounts.dev https://*.clerk.com https://recaptcha.net https://www.recaptcha.net https://challenges.cloudflare.com; connect-src 'self' https://api.groq.com https://*.clerk.accounts.dev https://*.clerk.com https://convex.cloud https://recaptcha.net https://www.recaptcha.net https://www.gstatic.com;",
      },
    ];

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
