# Changelog

All notable improvements to the AI Therapist application.

## February 2026

### Codebase Cleanup & CBT Localization

- **Localized CBT Reports**: Dutch CBT session reports now use consistent Dutch terminology throughout
- **Localized CBT Exports**: Markdown/text exports respect the active locale for labels and headings
- **Removed Unused Code**: Pruned deprecated test helpers, unused hooks, and legacy utilities
- **Consolidated Test Utilities**: Unified test infrastructure with CSP nonce handling
- **Simplified Chat Architecture**: Removed unused chat actions, state hooks, and UI utilities
- **Cleaner API Surface**: Dropped unused API hooks and report queries

### CI/CD Pipeline Improvements

- **Streamlined CI**: Removed E2E tests from CI (require real Clerk credentials)
- **Bundle Size Monitoring**: Runs on all commits, posts PR comments only on pull requests
- **Bun Caching**: Added dependency caching for ~30-50% faster CI runs
- **Optimized Builds**: Bundle size job reuses build artifacts (no duplicate builds)
- **Lighthouse Manual**: Performance audits moved to manual workflow dispatch

**CI Jobs on every commit:**

| Job                | Description                              |
| ------------------ | ---------------------------------------- |
| lint-and-typecheck | ESLint, TypeScript, Prettier             |
| unit-tests         | Jest with coverage (uploaded to Codecov) |
| build              | Next.js production build                 |
| bundle-size        | Size stats (PR comment on pull requests) |
| ci-status          | Final gate for branch protection         |

## January 2026

### Storage & Security Hardening

- **Sharded Message Counters**: Added Convex sharded counters for high-volume message counts
- **Encrypted CBT Drafts**: CBT draft content is now encrypted at rest in browser storage
- **BYOK Session Storage**: "Remember my key" is session-only and requires confirmation
- **CSP Tightening**: Production CSP is nonce-only (no `unsafe-inline` fallback)

### Next.js 16 Proxy Migration

- **Middleware → Proxy**: Migrated from `middleware.ts` to `proxy.ts` following Next.js 16 conventions
- **Clerk Auth Fix**: Resolved 401 errors by moving proxy to `src/` directory for proper Clerk integration
- **CSP Optimization**: API routes no longer receive unnecessary CSP headers (JSON responses don't need them)
- **Constants Extraction**: Public routes centralized in `src/lib/constants/routes.ts`

### AI SDK 6 Migration

- **AI SDK 6**: Migrated from v5 to v6 with all breaking changes addressed
- **Structured Outputs**: `generateObject` replaced with `generateText + Output.object()` pattern
- **Async Message Conversion**: `convertToModelMessages` now properly awaited
- **Tool Strictness**: Browser search tool uses `strict: true` for schema validation
- **Agent Abstraction**: New `ToolLoopAgent` wrapper for tool-enabled conversations
- **DevTools Ready**: Configuration prepared for AI SDK DevTools integration

## December 2025

### Advanced AI Orchestration & UX

- **Bring Your Own Key (BYOK)**: Integrated support for OpenAI `gpt-5-mini` using user-provided API keys (session-only storage with confirmation when remembered)
- **Local AI Support**: Integration with **Ollama** for running models like `gemma3:4b` locally, ensuring maximum privacy
- **Dynamic UI Enhancements**: Implemented an astronomy-based **Realistic Moon** dashboard that reflects real-world lunar phases for a calming therapeutic atmosphere
- **Global Reach**: Added full **internationalization (i18n)** support with English and Dutch locales
- **Next.js 16 & React 19**: Fully migrated to the latest stable versions with optimized Turbopack builds

## November 2024

### Production Performance Optimization

- **20x Faster Server Rendering**: Production server render time improved from 235ms → 12ms
- **Lightning-Fast Headers**: Optimized locale detection from 208ms → 0.18ms (1156x faster)
- **Clean Console**: Fixed all CSP violations (clerk-telemetry, inline scripts)
- **Modern React 19**: Leveraging latest React features for optimal performance
  - `useOptimistic` for instant UI feedback on user actions
  - `useDraftSaving` custom hook eliminating ~250 lines of duplicated code
- **Production-Ready**: Full test coverage with zero console errors

### Code Architecture Modernization

- **Component Refactoring**: Modularized 4 major components into 52 focused files
- **Modern Patterns**: Single Responsibility Principle, Compound Components, Server/Client separation
- **40-73% Bundle Reduction**: Optimized bundles for specialized use cases
- **Type-Safe Hooks**: Reusable custom hooks with full TypeScript generics support
- **Backward Compatible**: Zero breaking changes, all migrations transparent

### Clerk Authentication Migration

- **Managed Authentication**: Secure, managed authentication with Clerk
- **Webhook Synchronization**: Automatic user sync from Clerk to Convex via webhooks
- **Enhanced Security**: Enterprise-grade authentication infrastructure
- **Message Encryption Preserved**: AES-256-GCM encryption protects therapeutic data
- **Server-Only Convex Access**: The Next.js proxy enforces Clerk auth; API routes fetch Clerk JWTs and call Convex via an authenticated HTTP client; direct browser access to Convex is disabled
- **Convex Authorization Guards**: Every Convex query and mutation now verifies `ctx.auth` ownership so data cannot be enumerated with forged parameters

### AI SDK Session Orchestration

- **Server-Managed Session Pointer**: Active session state is owned by `SessionAI` (`@ai-sdk/rsc createAI`) and hydrated during SSR, eliminating `localStorage` for session tracking
- **Convex Persistence Hooks**: `onSetAIState` / `onGetUIState` keep the Convex `currentSessionId` field synchronized through Clerk-authenticated Convex mutations
- **Streaming Feedback**: Session switching uses AI SDK streamable values so the sidebar/command palette shows real-time status during validation/persistence

### Developer Experience

- **Next.js 16**: Latest version with Turbopack for 2-3× faster builds
- **React 19**: Latest React with concurrent features and improved performance
- **React Query**: Replaced Redux with TanStack Query for efficient server state management
- **Prettier Auto-Format**: Consistent code formatting across the codebase
- **Cleaner Codebase**: Removed custom auth endpoints and legacy TOTP service
- **Latest Dependencies**: All packages upgraded to latest stable versions
- **Robust Test Suite**: Jest unit/integration + Playwright E2E (run `bun run qa:full` for full verification)
