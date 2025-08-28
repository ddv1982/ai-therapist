# 🧠💙 AI Therapist - Compassionate Mental Health Support

A modern therapeutic AI application providing compassionate mental health support through AI-powered conversations with enterprise-grade security and professional therapeutic frameworks.

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
- **TOTP Authentication** - Secure two-factor authentication
- **Cross-Device Sessions** - Access sessions on any authenticated device
- **HIPAA-Compliant Logging** - No sensitive data exposure

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- SQLite (included)

### Installation

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
   DATABASE_URL="file:./prisma/dev.db"
   GROQ_API_KEY=your_groq_api_key_here
   ENCRYPTION_KEY=your_32_character_encryption_key_here
   NEXTAUTH_SECRET=your_nextauth_secret_here
   # Local-only opts
   BYPASS_AUTH=true
   RATE_LIMIT_DISABLED=true
   EOF
   ```

3. **Initialize database**
   ```bash
   npm run db:generate
   npm run db:push
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
- `npm run api:types` - Generate TypeScript types from OpenAPI spec

### Database Management
- `npm run db:setup` - Initialize and setup database (runs automatically in dev/build)
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and apply migration
- `npm run db:studio` - Open Prisma Studio for database inspection

### Testing
- `npm run test` - Run unit tests with Jest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run test:e2e` - Run Playwright end-to-end tests
- `npm run test:e2e:ui` - Run E2E tests with Playwright UI
- `npm run test:e2e:debug` - Debug E2E tests

### Security & Encryption
- `npm run encryption:generate` - Generate new encryption keys
- `npm run encryption:setup` - Setup encryption configuration
- `npm run encryption:validate` - Validate encryption setup

## 🧠 AI Model System

### Unified AI SDK 5 + Groq
- Client streaming uses `@ai-sdk/react` `useChat` with `DefaultChatTransport` to `/api/chat`.
- Server streaming uses AI SDK 5 `streamText` with Groq models from `src/ai/providers.ts`.
- Reports use AI SDK 5 `generateText` via `src/lib/api/groq-client.ts`.
- A single source of truth for models is defined in `src/ai/providers.ts`.

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
DATABASE_URL="file:./prisma/dev.db"
GROQ_API_KEY="your_groq_api_key"

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

## 🛡️ Security Features

### Authentication
- **QR Code Setup** - Easy authenticator app configuration
- **Device Trust** - 30-day authenticated sessions
- **Enhanced Fingerprinting** - Multiple entropy sources
- **Backup Codes** - Encrypted recovery options

### Data Protection
- **Field-level Encryption** - Database encryption for sensitive data
- **CSRF Protection** - Signed tokens prevent attacks
- **Content Security Policy** - XSS attack prevention
- **No External Sharing** - Data only sent to Groq API

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
- Check time sync for TOTP
- Clear cookies to reset device trust
- Verify `ENCRYPTION_KEY` is set

### Reset authentication (development)

If you lose access to your authenticator or need to re-enroll during development, you can reset TOTP configuration and sessions:

```bash
# Dev-only: resets TOTP config and clears sessions; accessible only from localhost
curl -X POST http://localhost:4000/api/auth/setup/reset
```

Then open `http://localhost:4000/auth/setup` to scan a new QR and complete verification.

**API Key Issues**  
- Confirm Groq API key validity
- Check sufficient credits
- Verify environment variable or UI setting

**Database Issues**
- Run `npm run db:generate && npm run db:push`
- Database auto-created at `prisma/dev.db`

**Build Issues**
- Clear `.next` folder: `rm -rf .next`
- Reinstall: `rm -rf node_modules && npm install`
- Run tests: `npm test`

## 🏗️ Architecture

### Modern Stack
- **Next.js 14** with App Router and Turbopack
- **TypeScript** in strict mode
- **Tailwind CSS** with design system
- **Prisma** with SQLite database
- **AI SDK 5** with Groq integration

### Domain-Driven Structure
```
src/
├── app/             # Next.js App Router
├── components/      # React components by domain
├── lib/            # Utilities by domain
├── types/          # TypeScript definitions
└── hooks/          # Custom React hooks
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Groq** - AI inference API
- **shadcn/ui** - Component library
- **Next.js** - React framework
- **Tailwind CSS** - Styling framework

---

**Built with ❤️ for mental health support and AI-powered therapy**