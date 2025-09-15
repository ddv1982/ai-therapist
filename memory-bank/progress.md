# Progress

## What works
- Streaming chat via AI SDK 5 with Groq; unified model provider in `src/ai/providers.ts`.
- CBT diary flow with final reflection before send; session reports adhere to section inclusion policy.
- Authentication with enhanced TOTP management, diagnostics, and trusted devices.
- Standardized API responses and typed client from OpenAPI spec.
- Resilience: circuit breaker, request deduplication, Redis caching, storage monitoring.
- Mobile-friendly UI, PWA manifest, iOS fullscreen config, consistent typography.
- Comprehensive tests (unit/integration/E2E) with Jest and Playwright.

## What's left
- Stabilize button heights and remove shimmer during chat list interactions.
- Complete `useChatController` hook and refactor dashboard page; verify clean build.
- DatePicker DS refactor and responsive popover behavior.
- Memory banner visibility in a new chat; global memory fetch when session is null.
- Later: refactor memory routes with API wrappers while preserving response shapes (coordinate tests).

## Current Status
- Local dev environment streamlined via `npm run setup:all`; app runs on port 4000.
- OpenAPI types generated via `npm run api:types` and consumed by the typed client.

## Known Issues
- Button height bounce on session actions after DS refactor.
- Unwanted shimmer when clicking chats.
- Ensure consistent font across all chat surfaces.
