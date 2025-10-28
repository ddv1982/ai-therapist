import type { AuthConfig } from 'convex/server';

// Configure Clerk as the JWT auth provider for Convex.
// The domain must match your Clerk JWT template issuer domain.
// Set CLERK_JWT_ISSUER_DOMAIN in Convex env (use: `npx convex env set CLERK_JWT_ISSUER_DOMAIN <issuer>`)
const domain = process.env.CLERK_JWT_ISSUER_DOMAIN;

export default {
  providers: [
    {
      domain: domain as string,
      applicationID: 'convex',
    },
  ],
} satisfies AuthConfig;
