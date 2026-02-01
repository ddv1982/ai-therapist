# ADR-002: Clerk Authentication

## Status

Accepted

## Date

2024-11-25

## Context

The AI Therapist application handles sensitive therapeutic conversations and requires:

- **Enterprise-grade security**: Medical/therapeutic data requires robust protection
- **Multi-device support**: Users should access sessions from any device
- **Simple user experience**: Minimize friction during sign-up/login
- **Developer experience**: Easy integration with Next.js App Router
- **Compliance considerations**: Authentication logs for audit trails

Previously, the application used a custom authentication system with:

- Manual session management
- Custom TOTP (Time-based One-Time Password) implementation
- Local storage-based session tracking

These custom solutions introduced maintenance burden and security risks.

## Decision

We chose **Clerk** as the managed authentication provider.

Key Clerk features utilized:

- **Pre-built UI Components**: Sign-in/sign-up flows with minimal code
- **Webhook Synchronization**: Automatic user sync to Convex database
- **JWT-based Sessions**: Stateless authentication with Convex integration
- **MFA Support**: Built-in multi-factor authentication
- **Session Management**: Cross-device session handling

### Implementation Details

**Next.js 16 Proxy** (authentication enforcement):

```typescript
// proxy.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/api/chat(.*)']);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth.protect();
  }
});
```

**Clerk-Convex Integration**:

```typescript
// API routes authenticate via Clerk JWT
const { userId } = await auth();
if (!userId) {
  return unauthorized();
}

// Convex functions validate ownership
export const getMessage = query({
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');
    // Validate user owns the requested resource
  },
});
```

**Webhook Synchronization**:

```typescript
// app/api/webhooks/clerk/route.ts
// Syncs Clerk user events to Convex database
// - user.created → Create Convex user record
// - user.updated → Update email/profile
// - user.deleted → Handle data cleanup
```

### Security Architecture

1. **Browser → Next.js Middleware**: Clerk validates session cookie
2. **Next.js → API Routes**: Middleware injects Clerk JWT
3. **API Routes → Convex**: JWT passed as bearer token
4. **Convex Functions**: Validate `ctx.auth` ownership for every query/mutation

This ensures no direct browser-to-Convex access, preventing parameter tampering.

## Consequences

### Positive

- **Reduced Security Burden**: Authentication handled by security experts
- **Compliance Ready**: SOC 2 Type II certified provider
- **Better UX**: Polished sign-in experience out of the box
- **Multi-Device Support**: Sessions sync across devices automatically
- **MFA Built-in**: No custom TOTP implementation needed
- **Audit Logs**: Authentication events tracked for compliance
- **Faster Development**: No auth code to write or maintain

### Negative

- **Vendor Dependency**: Tied to Clerk's availability and pricing
- **Cost**: Monthly fee per monthly active user (MAU)
- **Limited Customization**: Some UI constraints with pre-built components
- **Data Residency**: User auth data stored on Clerk's servers

### Neutral

- **Migration Effort**: Required removing custom auth code (one-time cost, now complete)
- **Learning Curve**: Team needed to learn Clerk patterns

## Alternatives Considered

### NextAuth.js (Auth.js)

- **Pros**: Open source, self-hosted option, flexible providers
- **Cons**: More setup, manual session management, less polished UX
- **Why Rejected**: Clerk offers better out-of-box experience for our use case

### Auth0

- **Pros**: Mature platform, extensive features, enterprise support
- **Cons**: More complex setup, higher cost at scale, less Next.js-native
- **Why Rejected**: Clerk has better Next.js App Router integration

### Firebase Authentication

- **Pros**: Good ecosystem, free tier, Google backing
- **Cons**: Less TypeScript-friendly, would duplicate some Convex auth patterns
- **Why Rejected**: Clerk + Convex integration is more streamlined

### Custom JWT Implementation

- **Pros**: Full control, no vendor dependency
- **Cons**: Security risks, maintenance burden, compliance challenges
- **Why Rejected**: Security expertise better left to specialists

## References

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk + Next.js App Router](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk + Convex Integration](https://docs.convex.dev/auth/clerk)
- [Clerk Webhooks](https://clerk.com/docs/integrations/webhooks)
- [Clerk Security Practices](https://clerk.com/security)
