# AI Therapist Code Review – Actionable Improvements

This document summarizes the full code review findings and provides a prioritized list of concrete actions to improve the codebase.

---

## ✅ Priority 1 – Security & Auth

| Action | Description | Files to Touch |
|--------|-------------|----------------|
| Secure session cookies | Ensure cookies are `HttpOnly`, `Secure`, `SameSite=Strict` and short-lived. | `src/lib/auth/`, `middleware.ts` |
| Encrypt all sensitive data | Audit `prisma/schema.prisma` to confirm therapy notes & chat logs are encrypted at rest. | `src/lib/encryption/`, `prisma/schema.prisma` |
| Rate-limit auth endpoints | Wrap all login/verify routes with `withAuthAndRateLimit`. | `src/app/api/auth/`, `src/lib/api/rate-limiter.ts` |
| Prevent user enumeration | Standardize error messages (e.g. “Invalid credentials”) for all auth failures. | `src/app/api/auth/`, `src/lib/api/api-response.ts` |
| Key rotation policy | Document and automate encryption key rotation. | `scripts/setup-encryption.js`, `docs/` |

---

## ✅ Priority 2 – API Layer

| Action | Description | Files to Touch |
|--------|-------------|----------------|
| Enforce middleware everywhere | Migrate all API routes to use `withApiMiddleware` or `withAuthAndRateLimit`. | `src/app/api/` |
| Add X-Request-Id headers | Ensure every request/response includes `X-Request-Id` for traceability. | `src/lib/api/api-middleware.ts`, `docs/api.yaml` |
| Keep OpenAPI in sync | Update `docs/api.yaml` whenever routes change; regenerate `src/types/api.generated.ts`. | `docs/api.yaml`, `package.json` scripts |
| Standardize error shapes | Return `ApiResponse<ErrorShape>` consistently; avoid ad-hoc error objects. | `src/lib/api/api-response.ts` |

---

## ✅ Priority 3 – Redux & Chat UX

| Action | Description | Files to Touch |
|--------|-------------|----------------|
| Delay session creation | Only create sessions after user submits a message (not on “New Chat” click). | `src/store/slices/sessionsSlice.ts`, `src/features/chat/` |
| Normalize state | Use `createEntityAdapter` for messages and sessions to prevent deep nesting. | `src/store/slices/chatSlice.ts`, `sessionsSlice.ts` |
| Centralize async errors | Ensure thunks dispatch error actions and UI shows feedback. | `src/store/middleware/`, `src/features/chat/` |

---

## ✅ Priority 4 – Frontend Components

| Action | Description | Files to Touch |
|--------|-------------|----------------|
| Accessibility audit | Add ARIA roles/labels to chat composer, message list, therapy forms. | `src/components/chat/`, `src/components/therapy/` |
| Sanitize markdown | Confirm `src/lib/markdown-processor.ts` strips unsafe HTML. | `src/lib/markdown-processor.ts` |
| Error feedback | Show inline errors when chat send or therapy save fails. | `src/components/chat/chat-composer.tsx`, `src/components/therapy/` |
| System banner clarity | Ensure system messages are visually and semantically distinct. | `src/components/chat/system-banner.tsx` |

---

## ✅ Priority 5 – Testing & Quality

| Action | Description | Files to Touch |
|--------|-------------|----------------|
| Deep component tests | Expand beyond shallow rendering; test user interactions. | `__tests__/components/` |
| E2E therapy flows | Add Playwright tests for CBT form → save → retrieve. | `e2e/` |
| Auto-generate mocks | Create mocks from `docs/api.yaml` to prevent drift. | `__tests__/__mocks__/`, `scripts/` |
| Enforce coverage | Add minimum coverage thresholds to `jest.config.js`. | `jest.config.js`, GitLab CI |
| CI/CD checks | Enforce linting, type-checking, and tests in pipeline. | `.gitlab-ci.yml` or equivalent |

---

## ✅ Priority 6 – Performance & Scalability

| Action | Description | Files to Touch |
|--------|-------------|----------------|
| Distributed rate limiting | Ensure limiter uses Redis, not per-instance memory. | `src/lib/api/rate-limiter.ts` |
| Redis fallback | Add in-memory cache fallback if Redis is unavailable. | `src/lib/cache/`, `docs/redis-implementation.md` |
| Query optimization | Audit Prisma queries for N+1 issues; add indexes. | `src/lib/database/`, `prisma/schema.prisma` |
| React re-render fixes | Use `React.memo`, selectors, and normalized Redux state. | `src/store/slices/`, `src/components/chat/` |
| Streaming backpressure | Confirm streaming routes handle load gracefully. | `src/app/api/chat/`, `src/lib/api/api-middleware.ts` |

---

## ✅ Priority 7 – Internationalization (i18n)

| Action | Description | Files to Touch |
|--------|-------------|----------------|
| Externalize all strings | Audit `src/components/` for hardcoded English text. | `src/components/`, `src/i18n/messages/` |
| ICU message format | Use pluralization, date/number formatting. | `src/i18n/config.ts` |
| RTL support | Test UI with `dir="rtl"`; add E2E test. | `e2e/language-toggle.spec.ts`, Tailwind config |
| Lazy-load locales | Split large translation files per language. | `src/i18n/config.ts`, `next.config.js` |

---

## ✅ Priority 8 – DevOps & Tooling

| Action | Description | Files to Touch |
|--------|-------------|----------------|
| Consolidate setup scripts | Create single `scripts/setup.js` CLI with subcommands. | `scripts/`, `README.md` |
| Environment validation | Ensure required env vars are checked at startup. | `scripts/setup-env-local.js`, `src/lib/utils/` |
| One-command onboarding | Provide `make setup` or `npm run setup`. | `Makefile`, `package.json` |
| Strict linting & types | Enable strict ESLint and TypeScript rules. | `.eslintrc.json`, `tsconfig.json` |
| CI/CD enforcement | Enforce all checks (lint, type, test, coverage) in GitLab pipeline. | GitLab CI config |

---

## ✅ Priority 9 – Documentation, Observability & Error Boundaries

| Action | Description | Files to Touch |
|--------|-------------|----------------|
| Keep docs updated | Update `docs/api.yaml`, `README.md`, and developer docs alongside code changes. | `docs/`, `README.md` |
| Add logging & metrics | Log auth failures, rate-limit breaches, and crisis detection triggers. Consider Prometheus/Grafana for API metrics. | `src/lib/auth/`, `src/lib/api/rate-limiter.ts`, `src/lib/crisis-detection/` |
| Wrap critical UI in error boundaries | Prevent full app crashes by wrapping shared components in React error boundaries. | `src/components/shared/`, `src/components/ui/` |
| Ensure crisis detection runs server-side | Confirm detection logic is enforced server-side and logs/escalates flagged content. | `src/lib/crisis-detection/`, `__tests__/lib/crisis-detection.test.ts` |

---

## How to Use This List

1. **Start at Priority 1** – these are security-critical.
2. **Create GitLab issues** (or GitHub issues) for each action.
3. **Label issues** with `priority-1`, `priority-2`, etc.
4. **Assign owners** and set milestones for incremental delivery.
5. **Re-run audits** after each priority level is complete.

---

## Quick Wins (1–2 days each)

- Add secure cookie flags
- Add `X-Request-Id` middleware
- Externalize hardcoded strings
- Consolidate setup scripts
- Add coverage thresholds
- Add logging for auth failures and rate-limit breaches

---

## Bigger Projects (1–2 weeks each)

- Normalize Redux state with `createEntityAdapter`
- Add E2E therapy flows
- Implement Redis fallback caching
- Audit and optimize Prisma queries
- Add RTL support and testing
- Add Prometheus/Grafana metrics
- Wrap shared components in error boundaries

---

## Final Note

This list is **opinionated and actionable**.  
It balances **security, quality, and developer experience** without rewriting the entire codebase.

Pick your milestone, assign owners, and ship improvements incrementally.
