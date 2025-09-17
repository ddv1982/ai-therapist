# Refactor Progress

Tracking implementation against refactorplan.md.

## Phase 1 - Provider/Layout Simplification
- [x] Implement RootProviders to centralize providers (Redux, Theme, Toast, ErrorBoundary).
- [x] Simplify src/app/(dashboard)/layout.tsx to a server-only wrapper.
- [x] Simplify src/app/(auth)/layout.tsx to a server-only wrapper.
- [x] Update src/app/layout.tsx to use RootProviders.
- [x] Swap custom ThemeProvider to next-themes (class attribute, system default).
- [ ] QA: verify SSR and hydration, theme toggle, toast/error flows.

## Phase 2 - API Middleware Modules
- [x] Create modular API utilities: auth.ts, logging.ts, validation.ts.
- [x] Implement withApiRoute wrapper supporting auth/stream/rateLimitBucket.
- [x] Refactor /api/models to use withApiRoute.
- [x] Migrate /api/health, /api/health/cache, /api/env, /api/errors to withApiRoute.
- [x] Extend to additional non-chat routes after validation.
- [x] Migrate /api/auth/logout to withApiRoute (preserve cookie clearing).
- [x] Migrate /api/auth/diagnostics (GET/POST) to withApiRoute + standardized ApiResponse.
- [x] Migrate /api/auth/mobile-debug (GET/POST) to withApiRoute + standardized ApiResponse.
- [x] Migrate /api/auth/devices (GET/DELETE/POST) to withApiRoute + standardized ApiResponse.
- [x] Migrate /api/auth/session DELETE to withApiRoute.
- [x] Migrate /api/reports (GET) to withApiRoute.

## Phase 3 - Chat Route Decomposition
- [x] chat-request.ts: zod schema and normalization.
- [x] session-service.ts: load/persist messages.
- [x] model-selector.ts: model/tool selection.
- [x] streaming.ts: streaming adapter and helpers.
- [x] Refactor /api/chat/route.ts to new composition.

## Phase 4 - Chat Client Modules
- [x] use-memory-context: dedicated memory context fetching.
- [x] use-session-store: sessions list CRUD abstraction.
- [x] use-chat-transport: AI SDK transport hook.
- [x] Integrate hooks inside use-chat-controller (API unchanged).
- [x] Add `src/features/chat/config.ts` and use in `use-chat-controller`.
- [x] Dashboard uses chat config constants and typed selectors for settings.
- [x] Replace remaining hardcoded model IDs across app with shared config.

## Phase 5 - Error Handling & Cleanup
- [x] Add error-reporter util (sendBeacon/requestIdleCallback, keepalive fallback).
- [x] Simplify layout ErrorBoundary to async-report only (no heavy retries during render).
- [x] RootProviders continues to wrap simplified boundary.
- [x] QA: add dev error trigger on dashboard to validate reporting and fallback UI.

## Testing Status
- [x] Jest suite: 55/55 passing (769 tests).
- [ ] Playwright E2E: pending run.

## Next Up
- Optionally migrate remaining non-chat routes to withApiRoute.
- Run Playwright E2E and perform Phase 1/5 QA items.
  - (skipped for now per request)
## Phase 3 - Chat Route Decomposition
  (completed per checklist above)
 
## Phase 6.1 – Redux Store Cleanup
- [x] Remove no-op reducers from `chatSlice` and `sessionsSlice`.
- [x] Add `src/store/selectors.ts` with typed selectors for chat/sessions.

## Phase 6.2 – Documentation
- [x] Add `src/store/README.md` with slice/selector guidance.
- [x] Update root `README.md` with `api:types`, typed API client, and response helpers.
- [x] Align `docs/api.yaml` with refactored endpoints and regenerate types.

## Phase 6.3 – API Types Adoption
- [x] Typed `apiClient.generateReportDetailed` from OpenAPI paths.

## Phase 6.4 – Security Settings
- [x] Refactor SecuritySettings to use typed API client for devices/logout.
- [x] Disable backup code regeneration in UI (server-side only).
