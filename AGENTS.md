# Repository Guidelines

## Project Structure & Module Organization

Routes and layouts live in `src/app`; feature logic sits in `src/features`, `src/components`, `src/lib`, and `src/ai`. State, middleware, and selectors are in `src/store` with mirrored coverage in `__tests__/store`. Persisted assets stay in `public/`, Convex functions/schema live in `convex/`, automation in `scripts/`, and API specs or docs in `docs/` (`docs/api.yaml` drives generated types).

## Build, Test, and Development Commands

- `npm run setup:all` — bootstrap Redis, encryption (or `make setup`).
- `npm run dev` / `npm run dev:local` — dev server on port 4000 (network vs localhost).
- `npm run build` + `npm run start` — production build and launch.
- `npm run lint` & `npx tsc --noEmit` — linting and TypeScript contracts.
- `npm run test` & `npm run test:coverage` — Jest suites and coverage gates.
- `npm run test:e2e` — Playwright journeys for therapy and auth flows.

## Coding Style & Naming Conventions

Write TypeScript-first with two-space indentation and single quotes in code. Run ESLint’s Next.js core-web-vitals preset via `npm run lint` and autofix before committing. Keep components `PascalCase`, helpers `camelCase`, hooks prefixed with `use`, and favor provided Tailwind utilities over inline styles.

## Testing Guidelines

Place new tests in the closest domain inside `__tests__` using the `.test.ts[x]` suffix. Cover reducers, encryption, and therapy flows with Jest, update snapshots only when behavior changes, and check `npm run test:coverage` before merging. Exercise UI or workflow changes with Playwright (`npm run test:e2e` or `npm run test:e2e:ui`) and note the scenarios in your PR.

## Commit & Pull Request Guidelines

Use concise, imperative commit messages (e.g., “Update cache key patterns”) and reference issues when relevant. PRs need a brief summary, screenshots for UI updates, a commands-run checklist, and callouts for migrations, schema edits, or new environment variables.

## Security & Configuration Tips

Keep secrets out of git; initialize locals with `npm run env:init`, rotate keys through `npm run encryption:setup`, and manage MFA with `npm run totp`. When adding endpoints, update `docs/api.yaml`, regenerate types via `npm run api:types`, and ensure new routes remain behind authentication and rate-limiting tests.
