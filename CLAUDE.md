# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

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
- `jest path/to/test.test.ts` - Run single test file
- `npm run test:e2e` - Run Playwright end-to-end tests
- `npm run test:e2e:ui` - Run E2E tests with Playwright UI
- `npm run test:e2e:debug` - Debug E2E tests

### Security & Encryption
- `npm run encryption:generate` - Generate new encryption keys
- `npm run encryption:setup` - Setup encryption configuration
- `npm run encryption:validate` - Validate encryption setup
- `npm run env:init` - Bootstrap .env.local file with default variables

## Architecture Overview

### Technology Stack
- **Next.js 14** with App Router and Turbopack
- **TypeScript 5.6+** in strict mode
- **Prisma ORM** with SQLite database
- **AI SDK 5** with Groq integration for streaming responses
- **Redux Toolkit** with persistence for state management
- **Tailwind CSS** with shadcn/ui components
- **Jest & Playwright** for comprehensive testing

### AI Model System
The application uses **AI SDK 5** with Groq as the provider:

- **Client-side streaming**: Uses `@ai-sdk/react` `useChat` hook with `DefaultChatTransport` to `/api/chat`
- **Server-side streaming**: Uses AI SDK 5 `streamText` with Groq models from `src/ai/providers.ts`
- **Report generation**: Uses AI SDK 5 `generateText` via `src/lib/api/groq-client.ts`
- **Model configuration**: Single source of truth in `src/ai/providers.ts`

#### Available Models
- `openai/gpt-oss-20b` - Fast model for regular conversation (default)
- `openai/gpt-oss-120b` - Advanced model with web search and deep reasoning

### Database Schema
- **SQLite** with Prisma ORM
- **Encrypted storage** for sensitive data (messages, reports, auth secrets)
- **Key models**: User, Session, Message, SessionReport, AuthConfig, TrustedDevice, AuthSession
- **Message encryption**: AES-256-GCM encryption for all therapeutic content
- **JSON fields**: Native JSON support for complex therapeutic data structures

### Authentication System
- **TOTP-based 2FA** with QR code setup
- **Device fingerprinting** with trusted device management
- **Session-based auth** with encrypted tokens
- **Development bypass**: `BYPASS_AUTH=true` for local development only

### State Management
- **Redux Toolkit** with persistence
- **Persisted slices**: `cbt` (CBT drafts), `sessions` (session data)
- **Non-persisted**: `chat` (real-time chat state)
- **Encryption**: CBT drafts and sensitive data encrypted in localStorage

## Project Structure

### App Router Organization
```
src/app/
├── (auth)/          # Authentication pages with layout
│   ├── auth/setup/  # TOTP setup flow
│   └── auth/verify/ # TOTP verification
├── (dashboard)/     # Main app pages with layout
│   ├── page.tsx     # Chat interface (dashboard home)
│   ├── cbt-diary/   # CBT diary structured forms
│   └── reports/     # Session reports and memory management
└── api/             # API routes
    ├── chat/        # Streaming chat endpoint
    ├── sessions/    # Session CRUD operations
    ├── messages/    # Message persistence
    ├── reports/     # Report generation
    └── auth/        # Authentication endpoints
```

### Component Architecture
```
src/components/
├── ui/              # Base UI components (shadcn/ui based)
├── shared/          # Reusable app components
├── chat/            # Chat-specific components
├── therapy/         # Therapeutic components
└── features/        # Feature-specific component groups
    ├── auth/        # Authentication components
    ├── chat/        # Chat interface components
    └── therapy/     # Therapeutic framework components
```

### Library Structure
```
src/lib/
├── api/             # API clients and middleware
├── auth/            # Authentication utilities
├── chat/            # Chat-related utilities
├── therapy/         # Therapeutic framework logic
├── database/        # Database queries and utilities
└── encryption/      # Client-side encryption
```

## Key Therapeutic Features

### CBT (Cognitive Behavioral Therapy) Support
- **Structured forms** in `/cbt-diary` with real-time draft persistence
- **CBT detection** in chat messages for contextual therapeutic responses
- **Schema therapy integration** with mode identification and analysis
- **Automatic thought records** with cognitive distortion detection
- **Progress tracking** with emotion ratings and behavioral patterns

### ERP (Exposure Response Prevention) Therapy
- **Compassionate approach** with graduated exposure hierarchies
- **Compulsive behavior tracking** (mental, physical, avoidance, safety behaviors)
- **Intrusive thought analysis** with thought-action fusion assessment
- **Safety mechanism** prevents forcing harmful behaviors

### Session Reports & Memory System
- **AI-generated reports** with comprehensive therapeutic analysis
- **Privacy-focused**: No direct quotes, only therapeutic patterns and insights
- **Memory context**: Previous session insights inform future conversations
- **Cross-session continuity** with encrypted memory persistence

### Security & Privacy Features
- **Field-level encryption** for all sensitive therapeutic data
- **HIPAA-compliant logging** with no sensitive data exposure
- **Client-side encryption** for CBT drafts and session data
- **Secure device management** with fingerprinting and trusted device tracking

## Development Guidelines

### Environment Setup
Required environment variables:
```bash
DATABASE_URL="file:./prisma/dev.db"
GROQ_API_KEY="your_groq_api_key"          # Server-side only
ENCRYPTION_KEY="your_32_character_key"     # For data encryption
NEXTAUTH_SECRET="your_secret"              # For session security

# Development only
BYPASS_AUTH="true"                         # Skip auth in development
RATE_LIMIT_DISABLED="true"                 # Disable rate limiting
```

### Code Patterns
- **Type safety**: Strict TypeScript with comprehensive types in `src/types/`
- **Error handling**: Standardized API responses with error boundaries
- **Validation**: Zod schemas for all API inputs and outputs
- **Testing**: Jest for unit tests, Playwright for E2E, React Testing Library for components
- **Streaming**: Server-sent events for real-time AI responses

### Code Style Guidelines (from .cursor/rules)
- **Function signatures**: Prefer explicit function signatures for exported APIs
- **Type safety**: Avoid unsafe casts or `any` - use precise types
- **Naming**: Use meaningful, descriptive names (avoid 1-2 character identifiers)
- **Error handling**: Use guard clauses and handle errors early - don't catch without meaningful handling
- **Code clarity**: Prefer multi-line over overly clever one-liners and deep nesting
- **Formatting**: Match existing formatting and avoid unrelated reformatting

### Therapeutic AI Integration
- **System prompts**: Comprehensive therapeutic prompts in `src/lib/therapy/therapy-prompts.ts`
- **Memory-enhanced prompting**: Previous session context integration
- **Schema therapy support**: Deep psychological pattern analysis
- **Crisis detection**: Built-in safety responses for mental health emergencies

### State Management Patterns
- **Redux slices**: Separate concerns (chat, sessions, cbt)
- **Persistence**: Critical data (CBT drafts, sessions) persisted across sessions
- **Encryption**: Sensitive state encrypted before storage
- **Hydration**: Proper SSR hydration handling for persisted state

## Testing Strategy

### Comprehensive Test Coverage
- **46 test files** across unit, integration, and E2E suites
- **Security testing**: Authentication, encryption, and data protection
- **API testing**: Complete endpoint validation with error scenarios
- **Component testing**: React components with user interaction testing
- **Therapeutic framework testing**: CBT, ERP, and schema therapy validation

### Test Organization
- `__tests__/api/` - API endpoint tests
- `__tests__/components/` - React component tests
- `__tests__/lib/` - Utility function tests
- `__tests__/security/` - Security implementation tests
- `__tests__/integration/` - End-to-end integration tests
- `e2e/` - Playwright browser automation tests

## Common Patterns & Utilities

### API Route Structure
All API routes use standardized middleware with:
- Authentication validation
- Rate limiting (when enabled)
- Input validation with Zod
- Error handling with typed responses
- Logging with context tracking

### Encryption Patterns
- **Client-side**: AES-256-GCM for localStorage data
- **Server-side**: Field-level database encryption for sensitive data
- **Key management**: Environment-based key configuration
- **Migration-safe**: Encryption keys persisted securely

### Streaming Chat Implementation
- **Client**: `useChat` hook from AI SDK 5 with custom transport
- **Server**: `streamText` with Groq provider and therapeutic system prompts
- **Memory integration**: Previous session context included in prompts
- **Error handling**: Graceful fallback for streaming failures

## Production Considerations

### Performance Optimization
- **Turbopack**: Fast development builds
- **Component code splitting**: Lazy loading for therapeutic components
- **Database indexing**: Optimized queries for session and message retrieval
- **Caching**: Strategic caching for AI model responses

### Security Hardening
- **CSP headers**: Content Security Policy for XSS prevention
- **CSRF protection**: Token-based request validation
- **Rate limiting**: API endpoint protection (configurable)
- **Data minimization**: Only necessary data stored and transmitted

### Monitoring & Observability
- **Structured logging**: Context-aware logging throughout the application
- **Health checks**: Database connectivity and AI service availability
- **Error boundaries**: Graceful error handling in React components
- **Performance metrics**: Client-side and API response time tracking