/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['prisma'],
  },
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
            // Restrict CORS in production, allow localhost in development
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
        ],
      },
    ]
  },
}

module.exports = nextConfig