# 🧠💙 AI Therapist - Compassionate Mental Health Support

A modern therapeutic AI application providing compassionate mental health support through AI-powered conversations with enterprise-grade security and professional therapeutic frameworks.

## 🚀 Recent Improvements

### 🔐 Storage & Security Hardening (Jan 2026)

- **Sharded Message Counters**: Added Convex sharded counters for high-volume message counts
- **Encrypted CBT Drafts**: CBT draft content is now encrypted at rest in browser storage
- **BYOK Session Storage**: “Remember my key” is session-only and requires confirmation
- **CSP Tightening**: Production CSP is nonce-only (no `unsafe-inline` fallback)

### 🔄 Next.js 16 Proxy Migration (Jan 2026)

- **Middleware → Proxy**: Migrated from `middleware.ts` to `proxy.ts` following Next.js 16 conventions
- **Clerk Auth Fix**: Resolved 401 errors by moving proxy to `src/` directory for proper Clerk integration
- **CSP Optimization**: API routes no longer receive unnecessary CSP headers (JSON responses don't need them)
- **Constants Extraction**: Public routes centralized in `src/lib/constants/routes.ts`

### 🤖 AI SDK 6 Migration (Jan 2026)

- **AI SDK 6**: Migrated from v5 to v6 with all breaking changes addressed
- **Structured Outputs**: `generateObject` replaced with `generateText + Output.object()` pattern
- **Async Message Conversion**: `convertToModelMessages` now properly awaited
- **Tool Strictness**: Browser search tool uses `strict: true` for schema validation
- **Agent Abstraction**: New `ToolLoopAgent` wrapper for tool-enabled conversations
- **DevTools Ready**: Configuration prepared for AI SDK DevTools integration

### 🌙 Advanced AI Orchestration & UX (Dec 2025)

- **Bring Your Own Key (BYOK)**: Integrated support for OpenAI `gpt-5-mini` using user-provided API keys (session-only storage with confirmation when remembered).
- **Local AI Support**: Integration with **Ollama** for running models like `gemma3:4b` locally, ensuring maximum privacy.
- **Dynamic UI Enhancements**: Implemented an astronomy-based **Realistic Moon** dashboard that reflects real-world lunar phases for a calming therapeutic atmosphere.
- **Global Reach**: Added full **internationalization (i18n)** support with English and Dutch locales.
- **Next.js 16 & React 19**: Fully migrated to the latest stable versions with optimized Turbopack builds.

### ⚡ Production Performance Optimization (Nov 2024)

- **20x Faster Server Rendering**: Production server render time improved from 235ms → 12ms
- **Lightning-Fast Headers**: Optimized locale detection from 208ms → 0.18ms (1156x faster)
- **Clean Console**: Fixed all CSP violations (clerk-telemetry, inline scripts)
- **Modern React 19**: Leveraging latest React features for optimal performance
  - `useOptimistic` for instant UI feedback on user actions
  - `useDraftSaving` custom hook eliminating ~250 lines of duplicated code
- **Production-Ready**: Full test coverage with zero console errors

### 🏗️ Code Architecture Modernization

- **Component Refactoring**: Modularized 4 major components into 52 focused files
- **Modern Patterns**: Single Responsibility Principle, Compound Components, Server/Client separation
- **40-73% Bundle Reduction**: Optimized bundles for specialized use cases
- **Type-Safe Hooks**: Reusable custom hooks with full TypeScript generics support
- **Backward Compatible**: Zero breaking changes, all migrations transparent

### 🔐 Clerk Authentication Migration

- **Managed Authentication**: Secure, managed authentication with Clerk
- **Webhook Synchronization**: Automatic user sync from Clerk to Convex via webhooks
- **Enhanced Security**: Enterprise-grade authentication infrastructure
- **Message Encryption Preserved**: AES-256-GCM encryption protects therapeutic data
- **Server-Only Convex Access**: Middleware now issues Clerk JWTs to API routes which in turn call Convex via an authenticated HTTP client; direct browser access to Convex is disabled.
- **Convex Authorization Guards**: Every Convex query and mutation now verifies `ctx.auth` ownership so data cannot be enumerated with forged parameters.

### 🔁 AI SDK Session Orchestration

- **Server-Managed Session Pointer**: Active session state is owned by `SessionAI` (`@ai-sdk/rsc createAI`) and hydrated during SSR, eliminating `localStorage` for session tracking.
- **Convex Persistence Hooks**: `onSetAIState` / `onGetUIState` keep the Convex `currentSessionId` field synchronized through Clerk-authenticated Convex mutations.
- **Streaming Feedback**: Session switching uses AI SDK streamable values so the sidebar/command palette shows real-time status during validation/persistence.

### 🛠️ Developer Experience

- **Next.js 16**: Latest version with Turbopack for 2-3× faster builds
- **React 19**: Latest React with concurrent features and improved performance
- **React Query**: Replaced Redux with TanStack Query for efficient server state management
- **Prettier Auto-Format**: Consistent code formatting across the codebase
- **Cleaner Codebase**: Removed custom auth endpoints and legacy TOTP service
- **Latest Dependencies**: All packages upgraded to latest stable versions
- **Robust Test Suite**: 2431 unit/integration tests across 168 suites + 96 E2E tests ensuring 100% stability.

## ✨ Features

### 🎨 Beautiful Experience

- **Dark Mode Design** - Optimized dark interface for reduced eye strain and therapeutic use
- **Realistic Moon Dashboard** - Astronomy-based lunar illumination matching real-world phases
- **Mobile Optimized** - Touch-friendly responsive design
- **Real-time Streaming** - AI responses with smooth animations
- **Session Management** - Create and switch between therapy sessions

### 🧠 Therapeutic Framework

- **Professional AI Prompting** - Trained with therapeutic principles
- **Multi-Language Support** - Native support for English and Dutch (i18n)
- **CBT & ERP Support** - Cognitive Behavioral Therapy and Exposure Response Prevention
- **Schema Therapy** - Deep pattern recognition and healing approaches
- **Crisis Intervention** - Automatic safety responses
- **Session Reports** - AI-generated insights and progress tracking
- **Web Search Integration** - Real-time access to therapeutic resources

### 🔒 Enterprise Security

- **Bring Your Own Key (BYOK)** - Optional use of personal OpenAI keys for enhanced privacy and cost control (session-only storage when remembered)
- **Clerk Managed Authentication** - Secure, industry-standard identity management
- **AES-256-GCM Encryption** - Field-level encryption for therapeutic message content
- **Webhook Authentication** - Svix signature verification for Clerk events
- **Cross-Device Sessions** - Seamless access across devices
- **Sharded Counters** - Race condition protection for high-volume message counts
- **HIPAA-Compliant Logging** - No sensitive data exposure
- **Convex Hardening** - Convex functions run server-side only and validate ownership via Clerk-issued JWTs.
- **AI SDK Session State** - Session selection is hydrated server-side through AI SDK actions, ensuring the active pointer cannot be tampered with in the browser.

### ⚡ Performance & Resilience

- **Production Performance** - 20x faster server rendering (<15ms in production)
- **Optimized Locale Loading** - Header-based caching for 1156x faster locale detection
- **React 19 Optimizations** - `useOptimistic` for instant UI feedback without loading states
- **In-Memory Caching** - Fast local caching layer
- **Circuit Breaker Pattern** - Automatic failover for external services
- **Request Deduplication** - Prevents duplicate operations
- **Storage Management** - Automatic quota monitoring and cleanup
- **Health Monitoring** - Comprehensive system health checks

## 🚀 Quick Start

### Prerequisites

- Node.js 24+
- Bun 1.2+
- Convex (backend - runs locally during development)
- Ollama (optional, for local model support)

### Installation

1. **Clone and install**

   ```bash
   git clone <your-repo-url>
   cd ai-therapist
   bun install
   ```

2. **Set up Clerk** (Required)
   - Go to [clerk.com](https://clerk.com) and create a new application
   - Copy your API keys from the Clerk dashboard
   - Configure webhook: Add endpoint at `/api/webhooks/clerk` with signing secret

3. **Set up Convex** (Required)
   - Go to [convex.dev](https://convex.dev) and create a new project
   - Run `bunx convex dev` to get your local development URL

4. **Set up environment**

```bash
# Create .env.local and add your keys
cat > .env.local <<'EOF'
# Clerk Authentication (required)
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Convex Backend (required)
CONVEX_URL=http://127.0.0.1:6790/?d=...
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:6790/?d=...

# AI & Encryption (required)
GROQ_API_KEY=your_groq_api_key_here
ENCRYPTION_KEY=your_32_character_encryption_key_here

# Local AI (optional)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL_ID=gemma3:4b

# Local-only opts
RATE_LIMIT_DISABLED=true
CACHE_ENABLED=true
EOF
```

5. **Generate encryption key**

   ```bash
   bun run encryption:generate
   # Copy the output to .env.local as ENCRYPTION_KEY="..."
   ```

6. **Start Convex backend** (keep in separate terminal)

   ```bash
   bun run convex:dev
   ```

7. **Start development**

   ```bash
   bun run dev
   ```

8. **Open browser**
   - Navigate to `http://localhost:4000`
   - Sign up/Login with Clerk
   - Enable web search in chat settings for access to current information

## 🛠 Development Commands

### Core Development

- `bun run dev` - Start development server (port 4000)
- `bun run dev:local` - Start development server (localhost only)
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run api:types` - Generate TypeScript types from OpenAPI spec

### Database Management (Convex)

- `bun run convex:dev` - Start local Convex backend
- `bun run convex:deploy` - Deploy Convex backend to production

### Encryption

- `bun run encryption:generate` - Generate new encryption key (copy to .env.local)

### Testing

- `bun run test` - Run unit tests with Jest
- `bun run test:watch` - Run tests in watch mode
- `bun run test:coverage` - Generate coverage report
- `bun run test:e2e` - Run Playwright E2E tests
- `bun run qa:full` - Run full QA suite (smoke + coverage + E2E)

### Makefile Workflow

The repository includes a `Makefile` for common tasks.

| Command      | Purpose                                       |
| ------------ | --------------------------------------------- |
| `make setup` | Complete setup (deps, encryption, dev server) |
| `make dev`   | Start development server                      |
| `make build` | Build for production                          |
| `make lint`  | Run ESLint + Type check                       |
| `make test`  | Run unit tests                                |
| `make e2e`   | Run E2E tests                                 |
| `make clean` | Clean build artifacts                         |

## 🧠 AI Model System

### Unified AI SDK 6 + Multi-Provider Support

- Client streaming uses `@ai-sdk/react` `useChat` to `/api/chat`.
- **System Models**: Groq-based `gpt-oss-120b` and `gpt-oss-20b`.
- **Local Models**: Native Ollama integration (defaults to `gemma3:4b`).
- **BYOK (Bring Your Own Key)**: Support for user-provided OpenAI keys using `gpt-5-mini` (session-only storage when remembered).
- Reports use AI SDK 6 `generateText` with `Output.object()` for structured outputs.
- Session context/state uses `@ai-sdk/rsc` (`SessionAI`) for hydration and server-authoritative selection.
- Model definition source of truth: `src/ai/model-metadata.ts`.

### Smart Model Selection

- **🔍 Web Search Enabled**: `openai/gpt-oss-120b` with browser tools
- **💬 Regular Chat**: `openai/gpt-oss-20b` for fast responses
- **🏠 Private / Local**: `ollama/gemma3:4b` for on-device inference
- **🔑 Personal Key**: `openai/gpt-5-mini` via BYOK session storage

## 🔧 Configuration

### Environment Variables

Key variables required in `.env.local`:

- `GROQ_API_KEY`: AI inference
- `NEXT_PUBLIC_CONVEX_URL` & `CONVEX_URL`: Backend connection
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` & `CLERK_SECRET_KEY`: Authentication
- `ENCRYPTION_KEY`: 32-char key for field-level encryption

### API Key Setup

- Server-side only via `GROQ_API_KEY` (never sent to client).
- Encryption keys generated via `bun run encryption:generate`.

## 📱 Mobile Experience

- **Touch Optimized** - Interactions designed for mobile
- **PWA Support** - Add to Home Screen capable
- **iOS Integration** - Fullscreen support and safe-area handling

## 🛡️ Security Features

### Authentication (Clerk)

- **Managed Identity** - Secure handling of user credentials
- **Multi-Factor Authentication** - Supported via Clerk
- **Session Management** - Secure, persistent sessions
- **Proxy Enforcement** - Next.js 16 proxy (formerly middleware) enables CSRF protection and injects Clerk JWTs so every API route and streaming endpoint is authenticated before reaching Convex.

### Data Protection

- **Field-level Encryption** - Sensitive data encrypted at rest
- **Encrypted CBT Drafts** - CBT draft content encrypted in browser storage
- **Content Security Policy** - XSS prevention
- **Signed Webhooks** - Verifiable server-to-server communication

## 🏗️ Architecture

### Modern Stack

- **Next.js 16** with App Router and Turbopack
- **React 19** with Concurrent Features
- **AI SDK 6** (Vercel) with Groq & OpenAI providers
- **TypeScript** Strict Mode
- **Bun** Package Manager (10-25x faster than npm)
- **React Query** (TanStack Query v5)
- **Convex** Backend-as-a-Service
- **Tailwind CSS v4**
- **Clerk** Authentication
- **Zod v4** Schema Validation

### Styling & Theme

The application uses a **dark mode only** design optimized for therapeutic use and reduced eye strain. All colors are defined using the OKLCH color space for perceptual uniformity and better color consistency.

- **Dark-First Design** - Single theme approach simplifies maintenance and provides consistent UX
- **OKLCH Color Space** - Perceptually uniform colors with predictable lightness
- **CSS Custom Properties** - Colors centralized in `/src/styles/base.css`
- **Therapeutic Color Palette** - 8 emotion colors + 3 therapeutic state colors
- **Accessibility** - All colors meet WCAG AA contrast requirements (4.5:1 minimum)

### Feature-First Structure

```
src/
├── app/              # Next.js App Router
├── features/         # Feature-based modules (primary logic)
│   ├── chat/         # Chat components, hooks, services
│   ├── therapy/      # CBT, ERP, Schema therapy
│   └── therapy-chat/ # Therapy-specific chat UI
├── components/ui/    # Shared UI components (CVA-based)
├── lib/              # Shared utilities
│   ├── api/          # API clients and middleware
│   ├── auth/         # Authentication helpers
│   └── queries/      # React Query hooks
├── hooks/            # Global custom React hooks
├── types/            # TypeScript definitions
└── styles/           # Global styles
convex/               # Convex backend schema and functions
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Groq** - AI inference API
- **Clerk** - Authentication infrastructure
- **shadcn/ui** - Component library
- **Next.js** - React framework
- **Convex** - Backend platform

---

**Built with ❤️ for mental health support and AI-powered therapy**
