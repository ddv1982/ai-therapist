/** @type {import('next').NextConfig} */
import createNextIntlPlugin from 'next-intl/plugin';
import bundleAnalyzer from '@next/bundle-analyzer';

const withNextIntl = createNextIntlPlugin({
  requestConfig: './i18n/request.ts',
  locales: ['en', 'nl'],
  defaultLocale: 'en',
  localePrefix: 'never',
  localeCookie: {
    name: 'NEXT_LOCALE',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    httpOnly: false,
  },
});

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

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
    // Note: CSP headers are now managed by middleware.ts with nonce support
    // These headers serve as fallback and include non-CSP security headers
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
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
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

// Apply plugins in order: bundle analyzer first, then intl
export default withNextIntl(withBundleAnalyzer(nextConfig));
