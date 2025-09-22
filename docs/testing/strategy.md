# Testing & QA Strategy

This document operationalizes the plan in `refactorplan.md` Section 7.

## Test Pyramid
- Unit: chat modules (model selector, streaming, session service), API helpers, zod schemas.
- Contract: `ApiResponse<T>` envelope, `X-Request-Id` propagation, typed client parity with `docs/api.yaml`.
- Component: chat UI units with Testing Library and a11y checks.
- Integration: API route behavior (streaming, truncation, persistence, errors), auth flows.
- E2E: Playwright regression for chat, CBT diary, memory, devices.

## Quality Gates
- Smoke gate (PR default): eslint + `tsc --noEmit` + jest unit/integration.
- Full gate (pre-release): smoke + jest coverage + Playwright.

## Coverage Thresholds
Global (configured in `jest.config.js`):
- branches: 70
- functions: 70
- lines: 70
- statements: 70

## Commands
- Smoke: `npm run qa:smoke` or `make qa-smoke`.
- Full: `npm run qa:full` or `make qa-full`.

## CI Notes
- Run `npm run api:types` before tests.
- Cache node modules and Playwright browsers.
- Upload Playwright HTML report and Jest `lcov.info`.

## Manual QA
See `docs/testing/manual-qa-checklist.md`.

