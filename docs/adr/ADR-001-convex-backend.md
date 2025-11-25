# ADR-001: Convex Backend

## Status

Accepted

## Date

2024-11-25

## Context

The AI Therapist application requires a backend that can:

- Store and retrieve therapeutic conversations with low latency
- Handle real-time updates (messages, session state)
- Provide strong TypeScript integration for type-safe queries
- Scale automatically without DevOps overhead
- Support transactional operations for data integrity
- Allow field-level encryption for sensitive data

Traditional options considered:

- Self-hosted PostgreSQL + REST API (high maintenance overhead)
- Firebase (less TypeScript-friendly, limited query capabilities)
- Supabase (good option, but less integrated real-time)
- Custom GraphQL backend (significant development time)

## Decision

We chose **Convex** as the Backend-as-a-Service (BaaS) for the AI Therapist application.

Key Convex features utilized:

- **Reactive Queries**: Real-time data synchronization without WebSocket boilerplate
- **Type-Safe Functions**: Full TypeScript support with generated types
- **Automatic Scaling**: Serverless architecture handles load automatically
- **ACID Transactions**: Strong consistency guarantees for therapeutic data
- **Integrated Auth**: Seamless Clerk integration via JWT validation

### Implementation Details

```typescript
// convex/schema.ts - Database schema definition
export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    currentSessionId: v.optional(v.id('sessions')),
    // ...
  }).index('by_clerkId', ['clerkId']),

  sessions: defineTable({
    userId: v.id('users'),
    title: v.string(),
    messageCount: v.number(),
    // ...
  }).index('by_user_created', ['userId', 'createdAt']),

  messages: defineTable({
    sessionId: v.id('sessions'),
    role: v.string(),
    content: v.string(), // Encrypted at application layer
    // ...
  }).index('by_session_time', ['sessionId', 'timestamp']),
});
```

**Security Model:**

- All Convex functions validate `ctx.auth` to ensure ownership
- Messages are encrypted at the application layer (AES-256-GCM)
- Direct browser access to Convex is disabled; API routes proxy requests

## Consequences

### Positive

- **Rapid Development**: No backend boilerplate; define schema and write functions
- **Type Safety**: End-to-end TypeScript from database to UI
- **Real-Time by Default**: No manual WebSocket management for live updates
- **Zero DevOps**: No servers to manage, automatic scaling
- **Built-in Auth Integration**: Clerk JWT validation out of the box
- **Optimistic Updates**: Built-in support reduces perceived latency

### Negative

- **Vendor Lock-in**: Migration away from Convex requires significant effort
- **Learning Curve**: Team needs to learn Convex-specific patterns (validators, ctx.auth)
- **Limited Query Flexibility**: No raw SQL; must use Convex query builders
- **Pricing at Scale**: Costs may increase with heavy usage (need to monitor)

### Neutral

- **Schema Evolution**: Convex handles migrations differently than traditional ORMs
- **Testing Approach**: Requires Convex-specific mocking strategies

## Alternatives Considered

### Supabase

- **Pros**: PostgreSQL with real-time, open source, good TypeScript support
- **Cons**: More setup required, less integrated type safety, separate auth needed
- **Why Rejected**: Convex offers better DX for our real-time chat use case

### Firebase Firestore

- **Pros**: Mature platform, good scaling, strong ecosystem
- **Cons**: Weaker TypeScript integration, NoSQL limitations, complex security rules
- **Why Rejected**: TypeScript experience and query flexibility were priorities

### Custom Backend (Express + PostgreSQL)

- **Pros**: Full control, no vendor lock-in, familiar patterns
- **Cons**: Significant development time, DevOps burden, real-time complexity
- **Why Rejected**: Resource constraints; BaaS allows faster iteration

## References

- [Convex Documentation](https://docs.convex.dev)
- [Convex TypeScript Guide](https://docs.convex.dev/using/typescript)
- [Convex + Clerk Integration](https://docs.convex.dev/auth/clerk)
- [Convex Schema Definition](https://docs.convex.dev/database/schemas)
