# AI Therapist Refactor Plan

## 1. Overview
This document captures the proposed restructuring of the AI Therapist codebase to simplify architecture, align with current Next.js conventions, and reduce code volume while preserving existing functionality. It is the companion to the recent code review that identified duplication in provider wiring, overgrown API handlers, and a monolithic chat controller.

## 2. Objectives
- **Reduce surface area**: Eliminate redundant providers, dead Redux reducers, and sprawling utility modules.
- **Improve maintainability**: Decompose mega files (e.g., `api/chat/route.ts`, `use-chat-controller.ts`) into focused modules with single responsibilities.
- **Align with Next.js best practices**: Prefer server components/layouts for data loading, adopt streaming utilities compatible with App Router, and enforce clear separation between server and client concerns.
- **Preserve functionality**: Ensure therapeutic flows, streaming chat, reporting, and memory management continue to operate unchanged.
- **Enable incremental adoption**: Provide a phased roadmap with validation steps so the team can ship improvements without destabilizing production.

## 3. Guiding Principles
1. **“One provider, one place”**: Root layout handles global context; section layouts stay lean.
2. **Small, testable modules**: Group code by capability (auth, rate limit, streaming) rather than dumping into single files.
3. **Type-first contracts**: Use zod + TypeScript types to encode API contracts and reuse definitions across client/server.
4. **Prefer composition over configuration**: Replace configuration-heavy hooks with composable hooks/services.
5. **Optimize for DX**: Avoid long synchronous effects on the client; minimize hydration mismatches; reduce redundant network calls.

## 4. Current Pain Points
| Area | Symptoms | References |
|------|----------|------------|
| Provider Nesting | `src/app/layout.tsx` and `src/app/(dashboard)/layout.tsx` both mount Redux & Theme providers, leading to duplicate renders and harder SSR debugging. | `src/app/layout.tsx`, `src/app/(dashboard)/layout.tsx` |
| API Middleware | `src/lib/api/api-middleware.ts` (~600 LOC) combines auth, rate limiting, validation, logging; streaming and JSON routes share copy/paste logic. | `src/lib/api/api-middleware.ts` |
| Chat Route | `src/app/api/chat/route.ts` (400+ LOC) mixes validation, history hydration, streaming fan-out, persistence, logging, and header mutations. | `src/app/api/chat/route.ts` |
| Chat Controller | `src/hooks/use-chat-controller.ts` orchestrates everything (AI SDK, sessions, scrolling, memory fetching). Hard to test, double-fetches messages, and tightly couples UI to data-access. | `src/hooks/use-chat-controller.ts` |
| Error Boundary | `src/components/layout/error-boundary.tsx` performs fetch-retry loops and storage side effects during render, risking cascading failures. | `src/components/layout/error-boundary.tsx` |
| Redux Slice Noise | `src/store/slices/chatSlice.ts` exports no-op reducers; intent unclear for other developers and bundlers. | `src/store/slices/chatSlice.ts` |
| Layout & UI | Dashboard page mixes top-level routing, session CRUD logic, and UI conditions in a single client component. | `src/app/(dashboard)/page.tsx` |

## 5. Refactor Strategy

### 5.1 Provider & Layout Simplification
- Keep global providers (`ReduxProvider`, `ThemeProvider`, `ToastProvider`, `ErrorBoundary`) in `src/app/layout.tsx`.
- Convert `(dashboard)` and `(auth)` layouts to simple server components that render children.
- Replace custom theme handling with [`next-themes`](https://github.com/pacocoursey/next-themes) or small wrapper around CSS variables; remove localStorage bootstrapping and loading spinners.
- Introduce `src/app/providers.tsx` exporting a `RootProviders` component to centralize stacking of providers.

### 5.2 API Middleware Modularization
- Break `api-middleware.ts` into:
  1. `auth.ts`: `authenticateRequest`, `getUserContext`.
  2. `rate-limit.ts`: `applyRateLimit`, `applyStreamingRateLimit`.
  3. `logging.ts`: `createRequestContext`, `withRequestMetrics`.
  4. `validation.ts`: wrappers around zod.
- Provide lightweight `withApiRoute(handler, { auth?: true, stream?: true, rateLimitBucket?: 'chat' })`.
- Enforce consistent error responses using `createErrorResponse` without duplicating header logic.

### 5.3 Streaming Chat Route Refactor
- Create `src/lib/chat/chat-request.ts` containing schema + normalization logic.
- Add `src/lib/chat/session-service.ts` for history loading/persistence with Prisma + encryption helpers.
- Add `src/lib/chat/model-selector.ts` for model + tool choice decisions.
- Extract streaming fan-out into `src/lib/chat/streaming.ts` (handles tee, collector, truncation caps, test mode bypass).
- Rebuild `POST` handler as composition of the above, ~150 LOC.
- Extend tests to focus on modules (unit) plus integration for route.

### 5.4 Chat Client Stack Rework
- Introduce RTK Query (already partially in repo) or server actions for session list/message persistence.
- Split `use-chat-controller` into:
  - `useChatTransport` (handles AI SDK transport setup + streaming callbacks).
  - `useSessionStore` (fetch list, create/delete, select session via RTK Query or server actions).
  - `useChatUIState` (sidebar visibility, input state, scroll).
- Move memory context fetching into a dedicated hook `useMemoryContext(sessionId)`.
- Convert `src/app/(dashboard)/page.tsx` to server component that loads initial session summary; hydrate client components with data props.

### 5.5 Error Handling Overhaul
- Replace class-based ErrorBoundary with minimal boundary + `useErrorReporter` hook.
- Move error reporting logic into `/api/errors` handler invoked via `requestIdleCallback`/`navigator.sendBeacon` to avoid fetch during render.
- Provide fallback UI and optional debug panel behind `NODE_ENV === 'development'`.

### 5.6 Redux Store Cleanup
- Remove unused reducers from `chatSlice`.
- Export typed selectors from a central `src/store/selectors.ts`.
- Document intended usage of slices in `src/store/README.md`.
- Ensure `persistConfig` only includes slices still requiring persistence.

### 5.7 UI & Component Structure
- In dashboard page, move sidebar, composer, header, report modal into colocated components under `src/features/chat`.
- Adopt pattern:
- Remove `index.ts` re-export barrels unless necessary (can cause circular deps).
- Introduce `src/features/chat/config.ts` for constants (model IDs, defaults).

## 6. Implementation Roadmap

### Phase 0 – Prep (1–2 days)
- Create branch `refactor/architecture`.
- Add ADR-style note in `/docs/` summarizing goals (this file).
- Update lint rules to flag unused exports.

### Phase 1 – Provider/Layout Simplification (1–2 days)
- Implement `RootProviders`.
- Remove duplicate provider wrapping in `(dashboard)` and `(auth)` layouts.
- Swap theme provider to `next-themes`.
- QA: verify SSR + hydration, theme toggle, toast/error flows.

### Phase 2 – API Middleware Modules (2–3 days)
- Break down middleware files; update imports.
- Refactor non-chat routes first (health, sessions) to ensure wrappers work.
- QA: run unit tests + hit endpoints via Jest/Playwright smoke.

### Phase 3 – Chat Route Decomposition (3–4 days)
- Build new modules for schema/streaming/session service.
- Update `api/chat/route.ts` to new composition.
- Expand test coverage (unit + integration) to cover truncation, persistence, error handling.
- QA: run `npm run test` and manual streaming test.

### Phase 4 – Chat Client Modules (4–6 days)
- Introduce new hooks (`useChatTransport`, `useSessionStore`, etc.).
- Update UI components to consume new hooks.
- Remove dead Redux reducers.
- QA: manual session creation/deletion, streaming, memory context, report generation.

### Phase 5 – Error Handling & Misc Cleanup (2–3 days)
- Replace ErrorBoundary implementation.
- Migrate memory/error reporting to async hooks.
- Update docs/readmes to reflect new structure.
- QA: intentionally throw errors to confirm fallback/telemetry.

### Phase 6 – Polish & Testing (ongoing)
- Run full Jest + Playwright suites.
- Update `README` and developer docs.
- Prepare migration notes for team (changelog, follow-up tasks).

## 7. Testing & QA Strategy
The goal is to prevent regressions while enabling rapid refactors. We follow a small-fast-first pyramid with quality gates.

- Unit tests
  - Chat modules: model selector, streaming adapter, session service, encryption utilities.
  - API middleware units: auth, rate limit, validation, logging helpers.
  - Deterministic factories and zod schemas for inputs/outputs.

- Contract tests
  - `createErrorResponse` and API wrappers to assert standardized `ApiResponse<T>` envelopes and `X-Request-Id` propagation.
  - Typed-client parity checks against `docs/api.yaml` (generate types before tests).

- Component tests
  - Chat UI units (composer, message list, sidebar) with Testing Library.
  - Accessibility assertions for interactive controls and focus management.

- Integration tests
  - Route-level tests for `/api/sessions/:id/messages` covering streaming happy-path, truncation, persistence, and error handling.
  - Auth flows (login, TOTP verify) including device trust and logout.

- E2E (Playwright)
  - Regression flows: chat streaming, CBT diary (full flow), memory banner/reporting, device management.
  - Desktop Safari/Firefox/Chrome projects enabled; screenshots, video, and traces on failure.

- Manual QA checklist
  - Light/dark themes, mobile viewport (iPhone 12) UI sanity.
  - Offline/online toggles and retry UX.
  - First-load behavior (no sessions), new-session creation, report export.

- Gates and thresholds
  - Jest coverage thresholds (global): branches/functions/lines/statements ≥ 70% (enforced in `jest.config.js`).
  - Smoke gate: lint + typecheck + unit/integration tests must pass before merging.
  - Full gate (pre-release): add Playwright E2E in CI with retries on CI only.

- Commands (developer ergonomics)
  - Smoke: `npm run qa:smoke` or `make qa-smoke` → eslint + `tsc --noEmit` + jest.
  - Full: `npm run qa:full` or `make qa-full` → smoke + jest coverage + playwright.

- CI recommendations
  - Cache node_modules and Playwright browsers; run `api:types` before tests.
  - Upload HTML reports for Playwright; store coverage `lcov.info` as artifact.

## 8. Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Streaming regression | Maintain parity in tests; shadow deploy via feature flag if possible. |
| Redux store changes break persistence | Validate persisted keys, run migration script to clean old storage on first load. |
| Theme provider swap causes FOUC | Use `next-themes` `attribute="class"` and `defaultTheme="system"`; verify SSR. |
| Increased bundle size from new modules | Monitor bundle reports; prefer server-side utilities. |

## 9. Follow-up Ideas (post-refactor)
- Consider moving session storage to server actions + React cache to further simplify Redux usage.
- Explore adopting [React Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components) for session lists to cut client bundle size.
- Add lint rules enforcing Max LOC per file to avoid future mega modules.
- Document streaming patterns for other AI endpoints to keep consistency.

## 10. Recent Updates (September 2024)
- Decomposed `src/app/(dashboard)/page.tsx` by introducing `ChatSidebar` and `ChatEmptyState` under `src/features/chat/components/dashboard`, shifting presentation logic out of the page shell.
- Delegated session and viewport orchestration to the new `useChatSessions` and `useChatViewport` hooks, keeping `useChatController` focused on AI transport and message flow.
- Tightened lint gates via `max-lines`, `max-lines-per-function`, `complexity`, and `eslint-plugin-react-perf` to catch regressions early in CI.
- Expanded automated coverage with sidebar/component Jest suites, a hook-level session manager test, and a Playwright smoke test scaffold for authenticated sidebar toggling.

---

**Next Step**: Save this file (e.g., `docs/refactor-plan.md`) and use it as the living source for tracking the refactor milestones.
