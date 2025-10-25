# 🧠💙 AI Therapist - Compassionate Mental Health Support

A modern therapeutic AI application providing compassionate mental health support through AI-powered conversations with enterprise-grade security and professional therapeutic frameworks.

## 🚀 Recent Improvements

### 🔐 Enhanced TOTP Authentication System
- **Server-Side Management**: Complete TOTP operations now handled server-side only
- **Health Monitoring**: Comprehensive diagnostics for database, encryption, and time sync
- **Improved Error Handling**: Better resilience against decryption failures and edge cases
- **Unified CLI**: Single `npm run totp` command for all TOTP operations
- **Enhanced Security**: Removed external API access to sensitive authentication operations

### 🛠️ Developer Experience
- **Simplified Scripts**: Unified TOTP management with `totp-manager.js`
- **Better Diagnostics**: Health checks and troubleshooting tools
- **Cleaner Repository**: Removed obsolete files and scripts
- **Contributor Guide**: Follow the workflows documented in [`AGENTS.md`](./AGENTS.md)

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
- **Web Search Integration** - Real-time access to therapeutic resources and current information

### 🔒 Enterprise Security
- **AES-256-GCM Encryption** - All sensitive data encrypted
- **Enhanced TOTP Authentication** - Secure two-factor authentication with health monitoring, improved error handling, and server-side management
- **Server-Side TOTP Management** - No external API access to sensitive authentication operations
- **Comprehensive Health Checks** - Database, encryption, and time synchronization monitoring
- **Cross-Device Sessions** - Access sessions on any authenticated device
- **Database Transactions** - Race condition prevention with ACID compliance
- **Device Fingerprinting** - Enhanced unique device identification
- **HIPAA-Compliant Logging** - No sensitive data exposure

### ⚡ Performance & Resilience
- **Redis Caching** - High-performance caching with 90%+ hit rates
- **Circuit Breaker Pattern** - Automatic failover for external services
- **Request Deduplication** - Prevents duplicate operations from rapid clicks
- **Storage Management** - Automatic quota monitoring and cleanup
- **Enhanced Redux Persist** - Timeout handling and corruption recovery
- **Health Monitoring** - Comprehensive system health checks

## 🚀 Quick Start

### Prerequisites
- Node.js 24+
- SQLite (included)
- Redis (for caching - auto-installed)

### Installation

#### Option 1: Complete Automated Setup (Recommended)
```bash
git clone <your-repo-url>
cd ai-therapist
npm run setup:all
```

This will automatically:
- Install all dependencies
- Set up the database
- Install and configure Redis
- Set up encryption
- Create environment configuration
- Generate Prisma client

#### Option 2: Manual Setup

1. **Clone and install**
   ```bash
   git clone <your-repo-url>
   cd ai-therapist
   npm install
   ```

2. **Set up environment**
  ```bash
  # Create .env.local and add your keys
  cat > .env.local <<'EOF'
  GROQ_API_KEY=your_groq_api_key_here
  ENCRYPTION_KEY=your_32_character_encryption_key_here
  NEXTAUTH_SECRET=your_nextauth_secret_here
  NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
  CONVEX_URL=http://127.0.0.1:3210
  
  # Redis Configuration
  REDIS_URL="redis://localhost:6379"
  CACHE_ENABLED="true"
   
   # Local-only opts
   BYPASS_AUTH=true
   RATE_LIMIT_DISABLED=true
   EOF
   ```

3. **Initialize Redis and Convex**
  ```bash
  npm run redis:setup
  npm run convex:dev   # in a separate terminal, leave running for local backend
  ```

4. **Start development**
   ```bash
   npm run dev
   ```

5. **Open browser**
   - Navigate to `http://localhost:4000`
   - Complete TOTP setup for secure access (or use `BYPASS_AUTH=true` for development)
   - Enable web search in chat settings for access to current information
   - Start your first therapeutic conversation

## 🛠 Development Commands

### Core Development
- `npm run dev` - Start development server with Turbopack on port 4000 (network accessible)
- `npm run dev:local` - Start development server on localhost only
- `npm run build` - Build for production (includes database setup)
- `npm run start` - Start production server (network accessible)
- `npm run lint` - Run ESLint for code quality
- `npm run api:types` - Generate TypeScript types from OpenAPI spec (docs/api.yaml → src/types/api.generated.ts)

### Database Management
- `npm run convex:dev` - Start the Convex backend locally (used during development)
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and apply migration
- `npm run db:studio` - Open Prisma Studio for database inspection

### Redis Caching
- `npm run redis:setup` - Install and configure Redis
- `npm run redis:start` - Start Redis server
- `npm run redis:stop` - Stop Redis server
- `npm run redis:status` - Check Redis status
- `npm run cache:health` - Check cache health and statistics
- `npm run cache:stats` - Get detailed cache statistics

### Testing
- `npm run test` - Run unit tests with Jest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run test:e2e` - Run Playwright end-to-end tests
- `npm run test:e2e:ui` - Run E2E tests with Playwright UI
- `npm run test:e2e:debug` - Debug E2E tests

### Setup & Configuration
- `npm run setup:all` - Complete automated setup (database, Redis, encryption, environment)
- `npm run setup:quick` - Quick setup (database and Redis only)
- `npm run env:init` - Bootstrap .env.local file with default variables

### Security & Encryption
- `npm run encryption:generate` - Generate new encryption keys
- `npm run encryption:setup` - Setup encryption configuration
- `npm run encryption:validate` - Validate encryption setup
- `npm run totp` - Complete TOTP management (setup, reset, health checks, diagnostics)

### Health & Monitoring
- `curl http://localhost:4000/api/health` - Get comprehensive system health status
- Monitor circuit breaker status, storage usage, and database performance

### Makefile workflow (optional)

The repository includes a `Makefile` that wraps common npm scripts and setup tasks. Running `make` with no arguments shows a full, self-documented help screen.

Common commands:

- **Help**: `make` or `make help`
- **Intelligent setup + dev**: `make setup`
- **Dev (after setup)**: `make dev`
- **Build / Start (prod)**: `make build && make start`
- **Diagnostics**: `make doctor`
- **Tests**: `make test` (Jest), `make e2e`, `make e2e-ui`, `make e2e-debug` (Playwright)
- **Lint/Type checks**: `make lint`, `make tsc-check`
- **Convex helpers**: `make convex-dev`, `make convex-deploy`, `make convex-health`, `make convex-stop`
- **Redis helpers**: `make redis-up`, `make redis-stop`
- **Auth (TOTP)**: `make auth-setup`, `make auth-reset`, `make auth-status`, `make auth-health`
- **Cleanup**: `make clean` (artifacts), `make clean-all` (also removes node_modules and local DB)

Notes:

- Targets are "intelligent" and will auto-install dependencies, create `.env.local`, start Redis, launch Convex, validate encryption, and generate OpenAPI types where needed.
- Override the app port when useful: `APP_PORT=5000 make setup`

## 🧠 AI Model System

### Unified AI SDK 5 + Groq
- Client streaming uses `@ai-sdk/react` `useChat` with `DefaultChatTransport` to `/api/chat`.
- Server streaming uses AI SDK 5 `streamText` with Groq models from `src/ai/providers.ts`.
- Reports use AI SDK 5 `generateText` via `src/lib/api/groq-client.ts`.
- A single source of truth for models is defined in `src/ai/providers.ts`.

### Typed API Client
- Shared, typed client in `src/lib/api/client.ts` with helpers in `src/types/api.ts`.
- Standardized server responses via `ApiResponse<T>` and `getApiData` (`src/lib/api/api-response.ts`).
- Keep `docs/api.yaml` as the source of truth; after changing endpoints, run `npm run api:types` and use the updated types in the client and handlers.

### Smart Model Selection
The app automatically selects the optimal model based on features:

- **🔍 Web Search Enabled**: `openai/gpt-oss-120b` with browser search tools
- **💬 Regular Chat**: `openai/gpt-oss-20b` for fast responses
- **⚙️ Manual Override**: Users can explicitly select any available model

## 🎯 Therapeutic Features

### CBT Draft Management
- **Real-time Auto-save** - Never lose therapeutic progress
- **Encrypted Storage** - AES-256-GCM encryption for all drafts
- **Cross-Session Persistence** - Access drafts across devices
- **Visual Feedback** - "Saved ✓" indicators

### ERP Therapy Support
- **Compassionate Approach** - Gradual exposure hierarchy
- **Pattern Detection** - Identifies compulsive behaviors and intrusive thoughts
- **Safety Mechanisms** - Built-in protections against forcing behaviors

### Session Reports
- **AI Analysis** - Professional therapeutic insights
- **Privacy Protected** - No personal details reproduced
- **Growth Focused** - Emphasizes healing and progress

#### Context-Driven Inclusion Policy
- Reports include sections only when supported by chat or CBT diary context.
- ERP, Schema Therapy, Cognitive Distortion Analysis, and Framework Recommendations are omitted if irrelevant.
- When in doubt about relevance, omit rather than include placeholders.
- Defined in `src/lib/therapy/therapy-prompts.ts` (see “Section Inclusion Policy”).

## 🔧 Configuration

### Environment Variables
```bash
# Required
GROQ_API_KEY="your_groq_api_key"
NEXT_PUBLIC_CONVEX_URL="http://127.0.0.1:3210"
CONVEX_URL="http://127.0.0.1:3210"

# Security
NEXTAUTH_SECRET="your_secret"
ENCRYPTION_KEY="your_32_char_key"

# Optional Configuration
CHAT_INPUT_MAX_BYTES="131072"  # Request size limit (default: 128KB)

# Development only
BYPASS_AUTH="true"           # Skip authentication (localhost only)
RATE_LIMIT_DISABLED="true"   # Disable API rate limiting
```

### API Key Setup
- Server-side only via `GROQ_API_KEY` (used by AI SDK Groq provider); never sent to client.

### Encryption Key Setup
- Generate and save locally:
  ```bash
  npm run encryption:setup
  ```
  Writes `ENCRYPTION_KEY` to `.env.local` (or `.env` if `.env.local` is missing).
- Generate only (copy manually):
  ```bash
  npm run encryption:generate
  ```
  Copy the printed `ENCRYPTION_KEY` into `.env.local`.
- Validate a key:
  ```bash
  npm run encryption:validate
  # or
  ENCRYPTION_KEY="your_key" npm run encryption:validate
  ```
- Notes: use different keys per env (dev/staging/prod); keep `.env.local` out of git; rotate keys periodically.

### Bootstrap .env.local
If you need to scaffold a local env file with defaults (including an empty `ENCRYPTION_KEY`):
```bash
npm run env:init
```
This creates `.env.local` with common variables so you can paste your keys.

## 📱 Mobile Experience

- **Touch Optimized** - All interactions designed for mobile
- **Full-width Messages** - Better readability on small screens
- **Auto-collapsing Sidebar** - Clean mobile navigation
- **Authentication Flow** - Mobile-optimized TOTP setup

### PWA and iOS Fullscreen
- Add to Home Screen in Safari to launch without browser UI.
- Manifest served at `/manifest.webmanifest` via `src/app/manifest.ts`.
- iOS metadata configured in `src/app/layout.tsx` (Apple web app, status bar, icons).
- Place icons under `public/icons/`:
  - `icon-192.png`, `icon-512.png`, `maskable-512.png`, `apple-touch-icon.png` (180×180)
- Tip: After changes, delete the old Home Screen icon and add again.

### iOS Keyboard Handling
- Inputs use ≥16px font to prevent auto-zoom.
- Safe areas applied via `env(safe-area-inset-*)` in `globals.css`.
- Messages list sets `scroll-padding-bottom` based on the input/footer height (ResizeObserver) so `scrollIntoView` keeps the input visible above the keyboard.

## 🛡️ Security & Resilience Features

### Authentication
- **QR Code Setup** - Easy authenticator app configuration
- **Device Trust** - 30-day authenticated sessions with unique fingerprinting
- **Enhanced Fingerprinting** - Multiple entropy sources with database constraints
- **Backup Codes** - Encrypted recovery options with usage tracking
- **Transaction Protection** - ACID compliance prevents race conditions in auth flows

### Data Protection
- **Field-level Encryption** - Database encryption for sensitive data
- **CSRF Protection** - Signed tokens prevent attacks
- **Content Security Policy** - XSS attack prevention
- **No External Sharing** - Data only sent to Groq API
- **Database Constraints** - Unique indexes prevent duplicate device registrations

### Resilience & Performance
- **Circuit Breaker** - Automatic failover when external services fail
  - Configurable failure threshold (default: 3 failures)
  - Automatic reset after timeout (default: 60 seconds)
  - Graceful fallback responses
- **Request Deduplication** - Prevents duplicate operations
  - 5-second TTL for rapid-fire requests
  - Key-based deduplication by user and operation
  - Automatic cleanup of expired entries
- **Storage Management** - Intelligent localStorage monitoring
  - Quota usage tracking and warnings
  - Automatic cleanup of old/large items
  - Corruption detection and repair

### Rate Limiting
- **Defaults (per IP)**
  - API: 300 requests / 5 minutes
  - Chat streaming: 120 requests / 5 minutes, max concurrency 2
- **Environment overrides**
  - `API_MAX_REQS`, `API_WINDOW_MS`, `CHAT_MAX_REQS`, `CHAT_WINDOW_MS`, `CHAT_MAX_CONCURRENCY`, `RATE_LIMIT_BLOCK_MS`
  - `RATE_LIMIT_DISABLED=true` disables limits (development only)
- **Development**: localhost and private LAN IPs are exempt; production enforces limits.

## 📊 Testing & Quality

### Comprehensive Test Suite
- **772+ Total Tests** with 100% pass rate
- **Security Testing** - Encryption and authentication validation
- **Component Testing** - React Testing Library coverage
- **API Testing** - Complete endpoint validation
- **Therapeutic Framework Testing** - CBT, ERP, and schema therapy validation

### Test Organization
```
__tests__/
├── api/              # API endpoint tests
├── components/       # React component tests  
├── lib/             # Utility function tests
├── security/        # Security implementation tests
└── integration/     # End-to-end integration tests
```

## 🤝 Troubleshooting

### Common Issues

**Authentication Problems**
- Run `npm run totp health` to diagnose TOTP issues and time sync
- Clear cookies to reset device trust
- Verify `ENCRYPTION_KEY` is set
- Ensure your Convex URL matches the backend you're targeting (check `NEXT_PUBLIC_CONVEX_URL`)

### Authentication Recovery

#### 🔐 TOTP Authentication Management

The improved TOTP system provides comprehensive management through a unified command-line interface:

```bash
npm run totp [command]
```

#### Available Commands:

**Health Check & Diagnostics:**
```bash
npm run totp health    # Comprehensive system health check with diagnostics
npm run totp status    # Quick status overview
```

**TOTP Setup & Management:**
```bash
npm run totp setup     # Set up new TOTP configuration with QR code
npm run totp reset     # Reset TOTP (server-side only, removes all config)
npm run totp test      # Test TOTP functionality with diagnostics
```

#### Stable QR Code During Setup
- The setup QR code is now stable across refreshes on the setup page, avoiding token mismatches.
- Server caches setup data for 5 minutes and reuses it during initial setup.
- Client also holds setup data in sessionStorage (5 minutes) to avoid unintentional regeneration on refresh.
- Cache is automatically cleared when setup completes or when you run `npm run totp reset`.

If you still get mismatches:
- Ensure your device time is set to automatic and is in sync.
- Avoid opening the setup page in multiple tabs while scanning.
- Use the manual entry key if QR scanning is delayed.

#### What the system provides:
- ✅ **Comprehensive Health Monitoring** - Database, encryption, time sync, and configuration checks
- 🔄 **Secure Server-Side Operations** - No external API access to sensitive operations
- 💾 **Automatic Backup Codes** - 10 secure backup codes generated automatically
- 🔑 **Manual Entry Support** - Manual key for devices without camera
- 📱 **QR Code Generation** - Scannable QR codes for easy authenticator setup
- 🛡️ **Enhanced Error Handling** - Graceful handling of decryption failures and edge cases
- ⏰ **Improved Time Tolerance** - 4-time-window support for multi-device reliability

#### Example Usage:

**Check system health:**
```bash
npm run totp health
```
Output:
```
🏥 TOTP Health Check
──────────────────────────────────────────────────
Overall Health: ✅ Healthy
Database: ✅ Accessible
Configuration: ✅ Set up
Encryption: ✅ Working
Time Sync: ✅ In sync
Current Token: 223943
Server Time: 2025-08-28T22:03:22.806Z
──────────────────────────────────────────────────
```

**Set up new TOTP (when locked out):**
```bash
npm run totp setup
```
Output:
```
🔄 Setting up new TOTP configuration...
✅ TOTP configuration saved successfully!

🔑 Manual Entry Key: EFTSSJRPEUWGI5B2ENCXITCUPBFT4TKWLV5SCXJTHIYUYJTMG5JQ
📱 QR Code URL: data:image/png;base64,...
💾 Backup Codes:
   1. FQHRC3AC
   2. GEF9DPQ1
   ...
```

**Reset TOTP completely:**
```bash
npm run totp reset
```
Output:
```
⚠️  WARNING: This will completely reset TOTP authentication!
   - All TOTP configuration will be deleted
   - All sessions and trusted devices will be cleared
   - You will need to set up TOTP again

❓ Are you sure you want to reset TOTP? (type "RESET" to confirm): RESET
✅ TOTP configuration reset successfully!
```

**API Key Issues**  
- Confirm Groq API key validity
- Check sufficient credits
- Verify environment variable or UI setting

**Database Issues**
- Run `npm run db:generate && npm run db:push`
- Convex backend runs via `npm run convex:dev` during development

**Storage Issues**
- High localStorage usage: Check browser DevTools > Application > Storage
- Redux persist hangs: Clear browser storage or check console for errors
- Storage quota exceeded: App will automatically cleanup old data

**Performance Issues**
- Circuit breaker activated: Check `/api/health` endpoint for service status
- Duplicate requests: Request deduplication will prevent within 5-second window
- Slow responses: Monitor health endpoint for degraded services

**Build Issues**
- Clear `.next` folder: `rm -rf .next`
- Reinstall: `rm -rf node_modules && npm install`
- Run tests: `npm test`

## 🏗️ Architecture

### Modern Stack
- **Next.js 15** with App Router and Turbopack
- **TypeScript** in strict mode
- **Tailwind CSS v4** with modularized global styles (`src/styles/`)
- **Prisma** with SQLite database
- **AI SDK 5** with Groq integration

### Domain-Driven Structure
```
src/
├── app/             # Next.js App Router
├── components/      # React components by domain
├── lib/             # Utilities by domain
│   ├── auth/        # Authentication & device management
│   ├── api/         # API clients and middleware
│   ├── utils/       # Core utilities
│   │   ├── graceful-degradation.ts    # Circuit breaker pattern
│   │   ├── request-deduplication.ts   # Duplicate request prevention
│   │   └── storage-management.ts      # localStorage monitoring
│   ├── chat/        # Chat functionality
│   └── therapy/     # Therapeutic frameworks
├── styles/          # Modularized global styles (base, typography, layout, components, utilities)
├── types/           # TypeScript definitions
└── hooks/           # Custom React hooks
```

### Key Architectural Improvements
- **Database Transactions** - All auth operations use ACID transactions
- **Circuit Breaker Pattern** - External service failure handling
- **Request Deduplication** - Prevents race conditions from rapid user actions
- **Storage Monitoring** - Proactive localStorage management
- **Enhanced Error Handling** - Graceful degradation throughout the stack

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Groq** - AI inference API
- **shadcn/ui** - Component library
- **Next.js** - React framework
- **Tailwind CSS** - Styling framework

---

**Built with ❤️ for mental health support and AI-powered therapy**
