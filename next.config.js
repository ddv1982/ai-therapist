/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['prisma'],
  },
  // Enable source maps for better mobile debugging
  productionBrowserSourceMaps: process.env.NODE_ENV === 'development',
  
  // Optimize for mobile and network access
  compress: true,
  poweredByHeader: false,
  
  // Allow dev origins for network access during development
  ...(process.env.NODE_ENV === 'development' && {
    allowedDevOrigins: ['192.168.178.59:3001', '192.168.178.59:3000', 'localhost:3000', '127.0.0.1:3000']
  }),
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
            // More permissive for development network access, but secure for production
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

module.exports = nextConfig