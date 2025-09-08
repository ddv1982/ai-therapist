/** @type {import('next').NextConfig} */
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
import path from 'path';

const nextConfig = {
  serverExternalPackages: ['prisma'],
  // Hide development indicators (Turbopack icon, etc.)
  devIndicators: false,
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
    
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            // Allow network access for development
            value: isDevelopment ? '*' : 'https://your-domain.com',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,DELETE,OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
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
            value: 'Accept-Encoding, User-Agent',
          },
        ],
      },
    ]
  },
}

export default withNextIntl(nextConfig);
