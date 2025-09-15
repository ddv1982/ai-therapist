# Tech Context

## Technologies
- Next.js 15 (App Router), React 19, TypeScript 5 strict
- Tailwind CSS v4, shadcn/ui (Radix primitives)
- AI SDK 5 with Groq provider
- Prisma + SQLite; Redis for caching
- Jest + React Testing Library; Playwright for E2E
- next-intl for i18n; PWA manifest

## Development Setup
- Node.js ≥ 24, npm ≥ 10
- Primary commands:
  - `npm run dev` (network accessible on port 4000)
  - `npm run build` / `npm run start`
  - `npm run api:types` to generate OpenAPI types
  - `npm run setup:all` for full local setup (DB, Redis, encryption)
- Makefile wrappers available (`make setup`, `make dev`, `make build`, etc.)

## Dependencies (selected)
- `next`, `react`, `@reduxjs/toolkit`, `react-redux`, `redux-persist`
- `@ai-sdk/react`, `ai`, `@ai-sdk/groq`
- `prisma`, `@prisma/client`, `redis`
- `zod`, `react-hook-form`, `date-fns`
- `lucide-react`, `class-variance-authority`, `tailwind-merge`
- Testing: `jest`, `@playwright/test`, `@testing-library/*`

## Tooling Patterns
- OpenAPI types generated from `docs/api.yaml` to `src/types/api.generated.ts`.
- Typed client utilities under `src/lib/api/client.ts` and helpers in `src/lib/api/api-response.ts`.
- API wrappers and middleware in `src/lib/api/api-middleware.ts`, `src/lib/api/api-auth.ts`, and `src/lib/api/rate-limiter.ts`.
- State store in `src/store`, slices in `src/store/slices/*`.
- i18n setup in `i18n/` and `src/i18n.ts`.

## Constraints & Preferences
- Do not log IP addresses; include `X-Request-Id` where relevant.
- Prefer standardized API responses and typed clients across server/client.
- Keep solutions robust, simple, and maintainable.
