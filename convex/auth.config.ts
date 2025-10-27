import type { AuthConfig } from 'convex/server';

// Configure Clerk as the JWT auth provider for Convex.
// The domain must match your Clerk JWT template issuer domain.
// Example: https://YOUR-INSTANCE.clerk.accounts.dev
const domain = 'https://advanced-mosquito-60.clerk.accounts.dev';

export default {
  providers: [
    {
      // Clerk provider (domain-only); Convex will fetch JWKS from this domain.
      domain: domain as string,
      applicationID: 'convex', // Must match the Clerk JWT template slug
    },
  ],
} satisfies AuthConfig;
