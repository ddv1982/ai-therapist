/** @type {import('next').NextConfig} */
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
import path from 'path';

const isDevelopment = process.env.NODE_ENV === 'development';

const nextConfig = {
  serverExternalPackages: [],
  devIndicators: false,
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = false;
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
          ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com; style-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com; font-src 'self' data: https://*.clerk.accounts.dev https://*.clerk.com; img-src 'self' data: blob: https://*.clerk.accounts.dev https://*.clerk.com; connect-src 'self' https://api.groq.com https://*.clerk.accounts.dev https://*.clerk.com https://convex.cloud ws:;"
          : "default-src 'self'; script-src 'self' https://*.clerk.accounts.dev https://*.clerk.com; style-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com; font-src 'self' data: https://*.clerk.accounts.dev https://*.clerk.com; img-src 'self' data: blob: https://*.clerk.accounts.dev https://*.clerk.com; connect-src 'self' https://api.groq.com https://*.clerk.accounts.dev https://*.clerk.com https://convex.cloud;",
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
