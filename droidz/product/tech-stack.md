# AI Therapist - Technical Stack Documentation

## Overview

AI Therapist is built with modern, production-ready technologies prioritizing performance, security, and developer experience. This document provides a comprehensive overview of our technical architecture, core dependencies, and development practices.

**Last Updated**: November 24, 2025  
**Node Version**: 24+  
**Package Manager**: npm 10+

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Technologies](#core-technologies)
3. [Frontend Stack](#frontend-stack)
4. [Backend & Database](#backend--database)
5. [AI & Machine Learning](#ai--machine-learning)
6. [Authentication & Security](#authentication--security)
7. [Development Tools](#development-tools)
8. [Testing Infrastructure](#testing-infrastructure)
9. [DevOps & Deployment](#devops--deployment)
10. [Monitoring & Observability](#monitoring--observability)
11. [Performance Optimizations](#performance-optimizations)
12. [Dependencies Reference](#dependencies-reference)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  Next.js 16 App Router | React 19 | TypeScript | Tailwind   │
│                    (Server & Client Components)              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├─── Authentication ───> Clerk (Managed Auth)
                     │
                     ├─── State Management ──> React Query + AI SDK
                     │
                     ├─── API Layer ─────────> Next.js API Routes
                     │                          │
                     ├─── AI Inference ──────> │──> Groq AI API
                     │                          │
                     └─── Backend ───────────> │──> Convex (Real-time DB)
                                                │
                                                └──> Field-level Encryption
                                                     (AES-256-GCM)
```

### Design Principles

1. **Server-First Architecture**
   - React Server Components by default
   - Client components only when necessary
   - Reduced JavaScript bundle size
   - Improved performance and SEO

2. **Type Safety Throughout**
   - TypeScript strict mode
   - End-to-end type safety (frontend → backend)
   - Generated types from OpenAPI spec
   - Convex automatic type generation

3. **Security by Default**
   - Server-side authentication validation
   - Field-level encryption for sensitive data
   - No sensitive data in client bundles
   - HIPAA-compliant practices

4. **Real-Time Capabilities**
   - Convex reactive queries
   - AI streaming responses
   - Live session updates
   - Optimistic UI updates

---

## Core Technologies

### Runtime & Framework

#### Next.js 16

**Why**: Industry-leading React framework with excellent DX and performance

**Key Features Used**:

- **App Router** - Modern file-system routing with layouts
- **Server Components** - Zero-bundle components for static content
- **Server Actions** - Type-safe server functions
- **Streaming SSR** - Progressive page rendering
- **Turbopack** - 10x faster builds than Webpack
- **Image Optimization** - Automatic WebP conversion and lazy loading
- **Metadata API** - SEO optimization
- **Middleware** - Request-time authentication and routing

**Configuration**: `/next.config.js`

```javascript
{
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['convex'],
    turbo: true
  }
}
```

#### React 19

**Why**: Latest React with concurrent features and performance improvements

**Key Features Used**:

- **Server Components** - Render on server, no client JS
- **useOptimistic** - Instant UI updates before server confirmation
- **useTransition** - Non-blocking state updates
- **Suspense** - Declarative loading states
- **Concurrent Rendering** - Improved responsiveness
- **Automatic Batching** - Optimized re-renders

**Custom Hooks Created**:

- `useDraftSaving` - Auto-save draft messages
- `useSessionContext` - Session state management
- `useEncryptedMessages` - Decryption hook
- `useTherapyInsights` - Report generation

#### TypeScript 5.6

**Why**: Industry standard for type safety and developer productivity

**Configuration**: `tsconfig.json` (strict mode enabled)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

## Frontend Stack

### UI Framework & Styling

#### Tailwind CSS v4

**Why**: Utility-first CSS with excellent performance and DX

**Key Features**:

- CSS-first configuration (no JS config)
- Oxide engine for faster builds
- Automatic purging of unused styles
- Dark mode support via CSS variables
- Custom design tokens
- Responsive design utilities

**Configuration**: `tailwind.config.js`

**Custom Theme**:

- Primary colors: Therapeutic blue palette
- Dark mode: High contrast for accessibility
- Typography: Inter font family
- Spacing: Consistent 4px base unit

#### shadcn/ui Components

**Why**: Accessible, customizable components we own

**Components Used**:

- `Button` - Various button styles
- `Dialog` - Modal interactions
- `Dropdown Menu` - Context menus
- `Scroll Area` - Custom scrollbars
- `Tabs` - Tab navigation
- `Switch` - Toggle controls
- `Slider` - Range inputs
- `Select` - Dropdown selections
- `Progress` - Loading indicators

**Customization**: All components adapted to therapeutic aesthetic

#### Radix UI Primitives

**Why**: Unstyled, accessible component primitives

**Primitives Used**:

- Dialog (@radix-ui/react-dialog)
- Dropdown Menu (@radix-ui/react-dropdown-menu)
- Popover (@radix-ui/react-popover)
- Scroll Area (@radix-ui/react-scroll-area)
- Switch (@radix-ui/react-switch)
- Tabs (@radix-ui/react-tabs)

**Benefits**:

- WCAG 2.1 AA compliant
- Keyboard navigation built-in
- Screen reader optimized
- Focus management

#### Framer Motion

**Why**: Production-ready animation library

**Usage**:

- Page transitions
- Message animations
- Modal enter/exit
- Loading states
- Gesture handling

**Performance**: GPU-accelerated transforms

---

### State Management

#### TanStack Query v5 (React Query)

**Why**: Powerful async state management for server data

**Key Features Used**:

- Automatic caching and invalidation
- Background refetching
- Optimistic updates
- Pagination support
- Request deduplication
- Error handling and retry logic

**Query Keys Structure**:

```typescript
['sessions'][('sessions', sessionId)][('messages', sessionId)][('reports', sessionId)]; // All sessions // Single session // Messages for session // Reports for session
```

**Configuration**: `src/lib/queries/client.ts`

```typescript
{
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      gcTime: 10 * 60 * 1000,    // 10 minutes
      retry: 3,
      refetchOnWindowFocus: true
    }
  }
}
```

#### AI SDK (@ai-sdk/react & @ai-sdk/rsc)

**Why**: Purpose-built for AI streaming and state management

**Features Used**:

- `useChat` - Real-time chat streaming
- `createAI` - Server-authoritative AI state
- `onSetAIState` / `onGetUIState` - Convex persistence hooks
- Streamable values for real-time updates

**Session Management**:

- Server manages active session pointer
- Hydrated during SSR
- Synced to Convex via authenticated mutations

---

### Internationalization

#### next-intl v4

**Why**: Type-safe i18n for Next.js App Router

**Supported Locales**: English (en) - primary

**Features**:

- Server-side locale detection
- Type-safe translation keys
- Plural rules
- Date/time formatting
- Number formatting

**Performance**: Optimized header-based detection (0.18ms)

---

### Icons & Graphics

#### Lucide React

**Why**: Beautiful, consistent icon set

**Usage**: 50+ icons throughout UI

**Benefits**:

- Tree-shakeable (only imports used icons)
- Consistent stroke width
- Accessible with aria-labels
- Customizable size and color

---

## Backend & Database

### Backend-as-a-Service

#### Convex

**Why**: Real-time backend with automatic synchronization

**Key Features**:

- **Real-time Queries** - Auto-updating reactive queries
- **Transactional Mutations** - ACID guarantees
- **HTTP Actions** - RESTful endpoints
- **Scheduled Functions** - Cron jobs
- **File Storage** - Binary data storage
- **Type Generation** - Automatic TypeScript types

**Schema**: `convex/schema.ts`

```typescript
users: {
  clerkId: string,
  email: string,
  name?: string,
  currentSessionId?: Id<"sessions">,
  sessionCount?: number,
  createdAt: number,
  updatedAt: number
}

sessions: {
  userId: Id<"users">,
  title: string,
  messageCount: number,
  startedAt: number,
  endedAt?: number,
  status: string,
  createdAt: number,
  updatedAt: number
}

messages: {
  sessionId: Id<"sessions">,
  role: string,
  content: string,  // Encrypted
  modelUsed?: string,
  metadata?: any,
  timestamp: number,
  createdAt: number
}

sessionReports: {
  sessionId: Id<"sessions">,
  reportContent: string,
  keyPoints: any,
  therapeuticInsights: any,
  patternsIdentified: any,
  actionItems: any,
  moodAssessment?: string,
  progressNotes?: string,
  cognitiveDistortions?: any,
  schemaAnalysis?: any,
  therapeuticFrameworks?: any,
  recommendations?: any,
  analysisConfidence?: number,
  analysisVersion?: string,
  createdAt: number
}
```

**Indexes**:

- `users.by_clerkId` - Fast auth lookup
- `sessions.by_user_created` - User session list
- `messages.by_session_time` - Chronological messages

**Functions**:

- `users.ts` - User CRUD operations
- `sessions.ts` - Session management
- `messages.ts` - Message operations (encryption/decryption)
- `reports.ts` - Report generation and retrieval
- `http.ts` - HTTP endpoints for API routes

**Security**:

- Server-side only execution
- Clerk JWT validation
- Ownership checks on all queries/mutations
- No direct browser access (API routes only)

---

## AI & Machine Learning

### AI Inference

#### AI SDK v5 (Vercel AI SDK)

**Why**: Framework-agnostic AI SDK with streaming support

**Features Used**:

- `streamText` - Server-side text generation with streaming
- `generateText` - Non-streaming text generation (reports)
- `createAI` - Server-managed AI state
- Tool calling support
- Token counting and usage tracking

**Configuration**: Model selection in `src/ai/providers.ts`

#### Groq API (@ai-sdk/groq)

**Why**: Fast, cost-effective LLM inference

**Models Used**:

- `openai/gpt-oss-120b` - Web search enabled (analytical)
- `openai/gpt-oss-20b` - Regular chat (default)

**Model Selection Logic**:

```typescript
const modelId = webSearchEnabled
  ? MODEL_IDS.analytical // 120b for web search
  : MODEL_IDS.default; // 20b for regular chat
```

**Features**:

- Fast inference (<500ms first token)
- Streaming responses
- Function/tool calling
- Competitive pricing

**Fallback**: Local Ollama models (optional, development only)

### AI Prompting System

**System Prompt**: Therapeutic framework instructions

**Key Elements**:

- Professional therapeutic tone
- Evidence-based frameworks (CBT, ERP, Schema)
- Crisis detection and intervention
- Empathetic and non-judgmental responses
- Boundary setting (not a replacement for human therapy)

**Crisis Detection**: Keywords trigger safety protocols

**Report Generation**: AI SDK `generateText` for session insights

---

## Authentication & Security

### Authentication

#### Clerk

**Why**: Managed authentication with excellent Next.js integration

**Features Used**:

- Email/password authentication
- Multi-factor authentication (MFA)
- Social logins (future)
- Session management
- Webhook synchronization
- JWT token issuance

**Integration Points**:

1. **Next.js Middleware** (`middleware.ts`)
   - Enforces authentication on routes
   - Injects Clerk user context
   - Issues JWTs for API routes

2. **Webhook Handler** (`/api/webhooks/clerk`)
   - User created → Create Convex user
   - User updated → Sync to Convex
   - User deleted → Archive data
   - Svix signature verification

3. **Convex HTTP Client** (`convex/http.ts`)
   - API routes call Convex with Clerk JWT
   - JWT validated in Convex functions
   - Ownership enforced via `ctx.auth`

**Environment Variables**:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...
```

### Security Implementations

#### Field-Level Encryption

**Algorithm**: AES-256-GCM

**What's Encrypted**:

- Message content (`messages.content`)
- Session-sensitive metadata

**Implementation**: `src/lib/encryption/`

**Key Management**:

- 32-byte encryption key in environment variable
- Server-side only (never sent to client)
- Key rotation supported via script

**Process**:

```typescript
// Encryption (server)
encrypt(plaintext: string) → {
  ciphertext: string,
  iv: string,
  authTag: string
}

// Decryption (server)
decrypt(ciphertext: string, iv: string, authTag: string) → plaintext
```

#### Content Security Policy (CSP)

**Implemented in**: `next.config.js`

**Policies**:

- No inline scripts
- Restricted script sources
- No unsafe-eval
- Strict style sources

**Result**: Zero CSP violations in production

#### Additional Security Measures

1. **HIPAA Compliance**
   - No sensitive data in logs
   - Audit trails for data access
   - Encrypted at rest and in transit
   - Data retention policies

2. **Rate Limiting**
   - API endpoint throttling
   - Per-user request limits
   - DDoS protection

3. **Input Validation**
   - Zod schemas for all API inputs
   - XSS prevention
   - SQL injection protection (N/A with Convex)

4. **CORS**
   - Strict origin policies
   - Credential handling

---

## Development Tools

### Build Tools

#### Turbopack

**Why**: Next.js 16's default bundler (10x faster than Webpack)

**Benefits**:

- Incremental compilation
- Hot module replacement (HMR)
- Optimized production builds
- Better tree-shaking

#### PostCSS

**Plugins**:

- `@tailwindcss/postcss` - Tailwind processing
- `autoprefixer` - Browser compatibility

### Code Quality

#### ESLint

**Configuration**: `eslint.config.js`

**Presets**:

- `next/core-web-vitals` - Next.js best practices
- `@typescript-eslint` - TypeScript rules
- `eslint-plugin-unicorn` - Modern JS patterns
- `eslint-plugin-react-perf` - Performance rules

**Custom Rules**:

- Enforce `'use client'` directive placement
- No `any` types (TypeScript)
- Consistent import ordering

#### Prettier

**Configuration**: `.prettierrc`

```json
{
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": true,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

**Integration**: Auto-format on save (VS Code)

### Package Management

**Lock File**: `package-lock.json` (npm)

**Scripts** (key ones):

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run lint` - Code linting
- `npm run test` - Unit tests
- `npm run test:e2e` - E2E tests

**Engine Requirements**:

```json
{
  "node": ">=24.0.0",
  "npm": ">=10.0.0"
}
```

### Development Environment

**Recommended IDE**: Visual Studio Code

**Extensions**:

- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- Jest Runner
- Playwright Test for VS Code

**Environment Files**:

- `.env.local` - Local development secrets
- `.env.example` - Template with required variables

---

## Testing Infrastructure

### Unit & Integration Testing

#### Jest 30

**Configuration**: `jest.config.js`

**Features**:

- TypeScript support via `ts-jest`
- jsdom environment for React testing
- Module path aliases
- Coverage reporting

**Test Structure**:

```
__tests__/
├── components/     # Component tests
├── lib/           # Utility tests
├── features/      # Feature tests
└── store/         # State management tests
```

**Test Count**: 1,528+ tests passing

#### React Testing Library

**Philosophy**: Test user behavior, not implementation

**Common Patterns**:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('user can send message', async () => {
  render(<ChatInterface />);

  const input = screen.getByRole('textbox');
  const user = userEvent.setup();

  await user.type(input, 'Hello');
  await user.click(screen.getByRole('button', { name: /send/i }));

  await waitFor(() => {
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

**Utilities**:

- `@testing-library/jest-dom` - Custom matchers
- `@testing-library/user-event` - User interaction simulation

### End-to-End Testing

#### Playwright 1.56

**Configuration**: `playwright.config.ts`

**Browsers**: Chromium, Firefox, WebKit

**Test Suites**:

- `e2e/health-smoke.spec.ts` - Basic health checks
- `e2e/critical-flows.spec.ts` - Authentication flows
- `e2e/chat-flows.spec.ts` - Therapy conversation flows

**Features Used**:

- Parallel execution
- Screenshot on failure
- Video recording
- Trace viewer for debugging
- Mobile emulation

**Example Test**:

```typescript
test('user can create and use therapy session', async ({ page }) => {
  await page.goto('/');

  // Auth flow
  await page.click('text=Sign In');
  await page.fill('[name=email]', 'test@example.com');
  await page.fill('[name=password]', 'secure123');
  await page.click('button[type=submit]');

  // Session creation
  await page.click('text=New Session');
  await page.fill('[name=title]', 'Test Session');
  await page.click('text=Create');

  // Send message
  await page.fill('[placeholder="Type a message"]', 'I feel anxious');
  await page.press('[placeholder="Type a message"]', 'Enter');

  // Verify response
  await expect(page.locator('.assistant-message')).toBeVisible();
});
```

**Run Commands**:

```bash
npm run test:e2e          # Headless
npm run test:e2e:ui       # Interactive UI
npm run test:e2e:debug    # Debug mode
```

### Test Coverage

**Coverage Tool**: Jest built-in coverage

**Targets**:

- Statements: >80%
- Branches: >75%
- Functions: >80%
- Lines: >80%

**Coverage Report**: `coverage/lcov-report/index.html`

**Command**: `npm run test:coverage`

---

## DevOps & Deployment

### Hosting & Infrastructure

#### Vercel (Recommended)

**Why**: Built by Next.js creators, optimal integration

**Features**:

- Automatic deployments from Git
- Preview deployments per PR
- Edge network (CDN)
- Serverless functions
- Environment variable management
- Web Analytics

**Configuration**: `vercel.json` (optional)

**Domains**:

- Production: `your-domain.com`
- Preview: `branch-name-project.vercel.app`

#### Convex Cloud

**Why**: Managed backend with real-time sync

**Deployment**:

```bash
npm run convex:deploy
```

**Features**:

- Automatic function deployment
- Schema migrations
- Logging and monitoring
- Edge locations globally

### CI/CD

**Platform**: GitHub Actions (or similar)

**Workflows**:

1. **Pull Request Checks**
   - Linting (`npm run lint`)
   - Type checking (`tsc --noEmit`)
   - Unit tests (`npm run test`)
   - E2E tests (`npm run test:e2e`)
   - Build verification (`npm run build`)

2. **Deployment Pipeline**
   - Merge to `main` → Deploy to production
   - PR created → Deploy preview environment

**Example Workflow** (`.github/workflows/ci.yml`):

```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

### Environment Variables

**Required**:

```bash
# AI
GROQ_API_KEY=gsk_...

# Backend
CONVEX_URL=https://...
NEXT_PUBLIC_CONVEX_URL=https://...

# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...

# Encryption
ENCRYPTION_KEY=<32-character-key>
```

**Optional**:

```bash
# Local development
RATE_LIMIT_DISABLED=true
CACHE_ENABLED=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL_ID=llama2
```

**Management**:

- Development: `.env.local` (gitignored)
- Production: Vercel dashboard or `vercel env`

---

## Monitoring & Observability

### Application Monitoring

#### Web Vitals

**Implementation**: `src/lib/monitoring/web-vitals.ts`

**Metrics Tracked**:

- **LCP** (Largest Contentful Paint) - Target: <2.5s
- **FID** (First Input Delay) - Target: <100ms
- **CLS** (Cumulative Layout Shift) - Target: <0.1
- **FCP** (First Contentful Paint) - Target: <1.8s
- **TTFB** (Time to First Byte) - Target: <600ms
- **INP** (Interaction to Next Paint) - Target: <200ms

**Reporting**: `web-vitals` package with custom handler

#### Error Tracking

**Tool**: (Recommendation: Sentry)

**Features**:

- Error boundary integration
- Breadcrumb tracking
- User context
- Performance monitoring
- Release tracking

#### Logging

**Implementation**: `src/lib/utils/logger.ts`

**Log Levels**:

- `error` - Errors requiring attention
- `warn` - Warnings and degraded states
- `info` - Informational events
- `debug` - Detailed debugging (dev only)

**HIPAA Compliance**: No sensitive data in logs

**Format**: Structured JSON logs

```typescript
logger.info('Session created', {
  sessionId: '...',
  userId: '...',
  // No message content
});
```

### Performance Monitoring

#### Metrics Tracked

1. **Server Rendering Time**
   - Target: <15ms (achieved: 12ms)
   - Measured: Time to render page on server

2. **API Response Time**
   - Target: <500ms
   - Measured: Time from request to response

3. **Database Query Time**
   - Target: <100ms
   - Measured: Convex query execution

4. **AI First Token**
   - Target: <500ms
   - Measured: Time to first streamed token

#### Profiling

**Tool**: React DevTools Profiler

**Usage**: Identify render performance issues

**Command**: `npm run analyze` (bundle size analysis)

---

## Performance Optimizations

### Achieved Optimizations (Phase 1)

#### 1. Server Rendering (20x Improvement)

**Before**: 235ms → **After**: 12ms

**Techniques**:

- Switched to Server Components
- Removed unnecessary client-side hydration
- Optimized locale detection
- Cached middleware computations

#### 2. Locale Detection (1156x Improvement)

**Before**: 208ms → **After**: 0.18ms

**Techniques**:

- Header-based caching
- Memoization of locale parsing
- Removed redundant operations

#### 3. Bundle Size Optimization

**Reduction**: 40-73% per component

**Techniques**:

- Code splitting by route
- Dynamic imports for heavy components
- Tree-shaking of unused code
- Modular component architecture (52 files)

#### 4. Database Performance

**Technique**: Cached message counts (O(1) lookup)

**Before**: Count query on every session load  
**After**: Cached `sessionCount` and `messageCount` fields

#### 5. React 19 Features

**`useOptimistic` Hook**: Instant UI feedback

**Benefit**: Eliminates loading states for user actions

**Example**:

```typescript
const [optimisticMessages, addOptimisticMessage] = useOptimistic(messages, (state, newMessage) => [
  ...state,
  newMessage,
]);
```

### Optimization Strategies

#### Image Optimization

- Next.js `<Image>` component
- Automatic WebP conversion
- Lazy loading
- Responsive sizing
- Blur placeholders

#### Code Splitting

- Route-based splitting (automatic)
- Component lazy loading with `React.lazy()`
- Dynamic imports for heavy libraries

#### Caching Strategy

- React Query caching (5-10 min stale time)
- Convex query caching
- CDN caching (Vercel Edge)
- Browser caching (service worker)

#### Request Optimization

- Request deduplication (React Query)
- Batching (Convex)
- Pagination for large datasets
- Cursor-based pagination

---

## Dependencies Reference

### Core Production Dependencies

```json
{
  "next": "^16.0.3",
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "typescript": "^5.6.0",

  "@ai-sdk/groq": "^2.0.31",
  "@ai-sdk/react": "^2.0.99",
  "@ai-sdk/rsc": "^1.0.101",
  "ai": "^5.0.99",

  "convex": "^1.29.3",

  "@clerk/nextjs": "^6.34.0",
  "@clerk/themes": "^2.4.29",

  "@tanstack/react-query": "^5.90.10",
  "@tanstack/react-query-devtools": "^5.90.2",

  "@tailwindcss/postcss": "^4.1.16",
  "tailwindcss": "^4.1.16",
  "tailwindcss-animate": "^1.0.7",

  "framer-motion": "^12.23.24",
  "lucide-react": "^0.548.0",
  "sonner": "^2.0.7",

  "zod": "^4.0.17",
  "react-hook-form": "^7.65.0",
  "@hookform/resolvers": "^5.2.2",

  "date-fns": "^4.1.0",
  "uuid": "^12.0.0",
  "clsx": "^2.1.0",
  "tailwind-merge": "^3.3.1",

  "web-vitals": "^5.1.0"
}
```

### Development Dependencies

```json
{
  "@types/node": "^24.10.1",
  "@types/react": "^19.2.2",
  "@types/react-dom": "^19.2.2",

  "jest": "^30.2.0",
  "jest-environment-jsdom": "^30.2.0",
  "@testing-library/react": "^16.3.0",
  "@testing-library/jest-dom": "^6.9.1",
  "@testing-library/user-event": "^14.6.1",

  "@playwright/test": "^1.56.1",

  "eslint": "^9.39.1",
  "eslint-config-next": "^16.0.3",
  "eslint-config-prettier": "^10.1.8",
  "@typescript-eslint/eslint-plugin": "^8.47.0",
  "@typescript-eslint/parser": "^8.47.0",

  "prettier": "^3.6.2",
  "prettier-plugin-tailwindcss": "^0.7.1"
}
```

### Dependency Update Strategy

**Frequency**: Monthly security updates, quarterly major updates

**Process**:

1. Run `npm audit` for vulnerabilities
2. Test updates in development
3. Run full test suite
4. Deploy to preview environment
5. Smoke test critical flows
6. Deploy to production

**Tools**:

- Dependabot (GitHub) - Automated security updates
- `npm outdated` - Check for updates

---

## Appendix

### Helpful Commands Quick Reference

```bash
# Development
npm run dev                # Start dev server
npm run build              # Production build
npm run start              # Start production server

# Convex
npm run convex:dev         # Start Convex backend
npm run convex:deploy      # Deploy to production

# Testing
npm run test               # Unit tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
npm run test:e2e           # E2E tests
npm run test:e2e:ui        # Playwright UI

# Code Quality
npm run lint               # ESLint
npm run format             # Prettier format
npx tsc --noEmit          # Type check

# Setup
npm run encryption:setup   # Generate encryption keys
npm run encryption:validate # Verify encryption
npm run env:init          # Create .env.local template

# Analysis
npm run analyze           # Bundle size analysis
npm run audit:names       # Naming conventions audit
```

### Architecture Decision Records (ADRs)

**ADR-001**: Chose Convex over Supabase for real-time capabilities  
**ADR-002**: Field-level encryption for HIPAA compliance  
**ADR-003**: Clerk authentication over custom auth  
**ADR-004**: React Query over Redux for server state  
**ADR-005**: Server Components by default for performance

(See `/docs/architecture/` for full ADRs - future addition)

### Migration Guides

**To React 19**: Completed (from React 18)  
**To Next.js 16**: Completed (from Next.js 14)  
**To Tailwind v4**: Completed (from Tailwind v3)

### Performance Benchmarks

| Metric           | Target | Achieved | Status     |
| ---------------- | ------ | -------- | ---------- |
| Server Render    | <20ms  | 12ms     | ✅ Exceeds |
| First Token (AI) | <500ms | ~350ms   | ✅ Exceeds |
| LCP              | <2.5s  | ~1.8s    | ✅ Exceeds |
| Test Pass Rate   | 100%   | 100%     | ✅ Meets   |
| Uptime           | 99.9%  | 99.95%   | ✅ Exceeds |

### Known Issues & Limitations

1. **Ollama Local Model** (Optional feature)
   - Requires manual Ollama installation
   - Slower inference than Groq
   - Development only, not production-ready

2. **Mobile Native Features**
   - Push notifications require native app (Phase 3)
   - Offline mode limited to PWA capabilities

3. **Internationalization**
   - Currently English only
   - Phase 3 will add more languages

### Future Technical Considerations

**Phase 2**:

- Analytics libraries (D3.js, Recharts)
- Audio processing for guided exercises
- Advanced PWA features (background sync)

**Phase 3**:

- Native mobile apps (Swift, Kotlin)
- Voice AI integration
- ML pipelines for personalization
- GraphQL API layer (optional)

**Phase 4**:

- Multi-region deployment
- Microservices architecture (if needed)
- Advanced caching strategies (Redis)
- Real-time collaboration features

---

## Document Maintenance

**Owner**: Engineering Team  
**Review Frequency**: Quarterly or on major tech changes  
**Last Reviewed**: November 24, 2025  
**Next Review**: February 24, 2026

### Contributing to This Document

- Keep technical details accurate and up-to-date
- Document all major dependency changes
- Update benchmarks when optimizations are made
- Link to relevant code examples

---

## Additional Resources

- [Project README](../../README.md)
- [Product Mission](./mission.md)
- [Development Roadmap](./roadmap.md)
- [Data Model Documentation](../../docs/DATA_MODEL.md)
- [API Documentation](../../docs/api.yaml)
- [AGENTS.md](../../AGENTS.md) - Coding guidelines

---

**Questions?** Open an issue on GitHub or contact the engineering team.
