# 🧠💙 AI Therapist - Compassionate Mental Health Support

A modern therapeutic AI application providing compassionate mental health support through AI-powered conversations with enterprise-grade security and professional therapeutic frameworks.

## 🚀 Recent Improvements

### ⚡ Production Performance Optimization (Nov 2024)
- **20x Faster Server Rendering**: Production server render time improved from 235ms → 12ms
- **Lightning-Fast Headers**: Optimized locale detection from 208ms → 0.18ms (1156x faster)
- **Clean Console**: Fixed all CSP violations (clerk-telemetry, inline scripts)
- **Modern React 19**: Leveraging latest React features for optimal performance
  - `useOptimistic` for instant UI feedback on user actions
  - `useDraftSaving` custom hook eliminating ~250 lines of duplicated code
- **Production-Ready**: All 1,528 tests passing with zero console errors

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
- **Better Test Coverage**: 100% test pass rate across E2E and unit tests

## ✨ Features

### 🎨 Beautiful Experience
- **Dual Theme Support** - Elegant dark and light modes
- **Mobile Optimized** - Touch-friendly responsive design
- **Real-time Streaming** - AI responses with smooth animations
- **Session Management** - Create and switch between therapy sessions

### 🧠 Therapeutic Framework
- **Professional AI Prompting** - Trained with therapeutic principles
- **CBT & ERP Support** - Cognitive Behavioral Therapy and Exposure Response Prevention
- **Schema Therapy** - Deep pattern recognition and healing approaches
- **Crisis Intervention** - Automatic safety responses
- **Session Reports** - AI-generated insights and progress tracking
- **Web Search Integration** - Real-time access to therapeutic resources

### 🔒 Enterprise Security
- **Clerk Managed Authentication** - Secure, industry-standard identity management
- **AES-256-GCM Encryption** - Field-level encryption for therapeutic message content
- **Webhook Authentication** - Svix signature verification for Clerk events
- **Cross-Device Sessions** - Seamless access across devices
- **Database Transactions** - Race condition prevention with ACID compliance
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
- Convex (backend - runs locally during development)

### Installation

1. **Clone and install**
   ```bash
   git clone <your-repo-url>
   cd ai-therapist
   npm install
   ```

2. **Set up Clerk** (Required)
   - Go to [clerk.com](https://clerk.com) and create a new application
   - Copy your API keys from the Clerk dashboard
   - Configure webhook: Add endpoint at `/api/webhooks/clerk` with signing secret

3. **Set up Convex** (Required)
   - Go to [convex.dev](https://convex.dev) and create a new project
   - Run `npx convex dev` to get your local development URL

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

  # Local-only opts
  RATE_LIMIT_DISABLED=true
  CACHE_ENABLED=true
  EOF
   ```

5. **Initialize Convex**
   ```bash
   npm run encryption:setup # Generate encryption keys
   npm run convex:dev       # Runs backend (keep in separate terminal)
   ```

6. **Start development**
   ```bash
   npm run dev
   ```

7. **Open browser**
   - Navigate to `http://localhost:4000`
   - Sign up/Login with Clerk
   - Enable web search in chat settings for access to current information

## 🛠 Development Commands

### Core Development
- `npm run dev` - Start development server (port 4000)
- `npm run dev:local` - Start development server (localhost only)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run api:types` - Generate TypeScript types from OpenAPI spec

### Database Management (Convex)
- `npm run convex:dev` - Start local Convex backend
- `npm run convex:deploy` - Deploy Convex backend to production

### Encryption
- `npm run encryption:setup` - Setup encryption configuration
- `npm run encryption:generate` - Generate new encryption keys

### Testing
- `npm run test` - Run unit tests with Jest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run test:e2e` - Run Playwright E2E tests
- `npm run qa:full` - Run full QA suite (smoke + coverage + E2E)

### Makefile Workflow

The repository includes a `Makefile` for common tasks.

| Command | Purpose |
|---------|---------|
| `make setup` | Complete setup (deps, encryption, dev server) |
| `make dev` | Start development server |
| `make build` | Build for production |
| `make lint` | Run ESLint + Type check |
| `make test` | Run unit tests |
| `make e2e` | Run E2E tests |
| `make clean` | Clean build artifacts |

## 🧠 AI Model System

### Unified AI SDK 5 + Groq
- Client streaming uses `@ai-sdk/react` `useChat` to `/api/chat`.
- Server streaming uses AI SDK 5 `streamText` with Groq models.
- Reports use AI SDK 5 `generateText`.
- Session context/state uses `@ai-sdk/rsc` (`SessionAI`) for hydration and server-authoritative selection.
- Model definition source of truth: `src/ai/providers.ts`.

### Smart Model Selection
- **🔍 Web Search Enabled**: `openai/gpt-oss-120b` with browser tools
- **💬 Regular Chat**: `openai/gpt-oss-20b` for fast responses

## 🔧 Configuration

### Environment Variables
Key variables required in `.env.local`:
- `GROQ_API_KEY`: AI inference
- `NEXT_PUBLIC_CONVEX_URL` & `CONVEX_URL`: Backend connection
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` & `CLERK_SECRET_KEY`: Authentication
- `ENCRYPTION_KEY`: 32-char key for field-level encryption

### API Key Setup
- Server-side only via `GROQ_API_KEY` (never sent to client).
- Encryption keys managed via `npm run encryption:setup`.

## 📱 Mobile Experience

- **Touch Optimized** - Interactions designed for mobile
- **PWA Support** - Add to Home Screen capable
- **iOS Integration** - Fullscreen support and safe-area handling

## 🛡️ Security Features

### Authentication (Clerk)
- **Managed Identity** - Secure handling of user credentials
- **Multi-Factor Authentication** - Supported via Clerk
- **Session Management** - Secure, persistent sessions
- **Middleware Enforcement** - Next.js middleware enables CSRF protection and injects Clerk JWTs so every API route and streaming endpoint is authenticated before reaching Convex.

### Data Protection
- **Field-level Encryption** - Sensitive data encrypted at rest
- **Content Security Policy** - XSS prevention
- **Signed Webhooks** - Verifiable server-to-server communication

## 🏗️ Architecture

### Modern Stack
- **Next.js 16** with App Router and Turbopack
- **React 19** with Concurrent Features
- **TypeScript** Strict Mode
- **React Query** (TanStack Query v5)
- **Convex** Backend-as-a-Service
- **Tailwind CSS v4**
- **Clerk** Authentication
- **Zod v4** Schema Validation

### Domain-Driven Structure
```
src/
├── app/             # Next.js App Router
├── components/      # React components by domain
├── lib/             # Utilities by domain
│   ├── auth/        # Authentication helpers
│   ├── api/         # API clients and middleware
│   ├── queries/     # React Query hooks
│   ├── chat/        # Chat functionality
│   └── therapy/     # Therapeutic frameworks
├── styles/          # Modularized global styles
├── types/           # TypeScript definitions
└── hooks/           # Custom React hooks
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
