# System Patterns

## Architecture
- Next.js 15 App Router with TypeScript strict mode.
- Domain-driven structure under `src/` (app, components, lib, hooks, styles, types).
- AI SDK 5 with Groq provider; single source of truth in `src/ai/providers.ts`.
- Prisma + SQLite for persistence; Redis for caching and coordination.

## API Design
- API routes under `src/app/api/*`.
- Standardized `ApiResponse<T>` and `getApiData` helpers for symmetry.
- Typed client via OpenAPI: `docs/api.yaml` → `src/types/api.generated.ts` with `npm run api:types`.
- `X-Request-Id` included where applicable and documented.
- Core chat route: `src/app/api/sessions/[sessionId]/messages/route.ts`.
- Prefer API wrappers in `src/lib/api/api-middleware.ts` and `src/lib/api/api-auth.ts`.

## Auth & Security
- Enhanced TOTP flows with server-side operations, diagnostics, and health checks.
- Device fingerprinting and trusted devices with ACID DB transactions.
- Field-level AES-256-GCM encryption for sensitive data.
- No IP addresses logged; HIPAA-conscious logging and CSP/CSRF protections.
- `/api/auth/verify` uses unauthenticated middleware to support LAN/mobile verification in dev.

## Resilience & Performance
- Circuit breaker for external services (configurable thresholds/timeouts).
- Request deduplication to prevent duplicate operations within a short TTL.
- Redis-backed caching; cache health/metrics endpoints exist.
- Storage monitoring and corruption recovery for localStorage.

## State Management & UX
- Redux for app state with careful persistence; slices in `src/store`.
- Chat UX rules: stable heights, minimal shimmer, consistent typography, mobile-first.
- CBT diary flow: final reflection step occurs before sending to chat; new chats only when explicitly sent.

## Conventions
- Strong typing; prefer API wrappers and typed client.
- Keep routes small; reuse middleware from `src/lib/api/*`.
- Prefer deleting obsolete endpoints over deprecating.
