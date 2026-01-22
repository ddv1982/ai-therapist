# Development Setup Guide

This guide will help you get the AI Therapist application running locally in under an hour.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Step-by-Step Setup](#step-by-step-setup)
- [Development Workflow](#development-workflow)
- [Common Issues & Solutions](#common-issues--solutions)
- [IDE Setup](#ide-setup)
- [Testing](#testing)
- [Helpful Commands](#helpful-commands)

---

## Prerequisites

### Required Software

| Tool    | Version | Check Command    | Installation                                         |
| ------- | ------- | ---------------- | ---------------------------------------------------- |
| Node.js | 24+     | `node --version` | [nodejs.org](https://nodejs.org) or `nvm install 24` |
| npm     | 10+     | `npm --version`  | Comes with Node.js                                   |
| Git     | 2.40+   | `git --version`  | [git-scm.com](https://git-scm.com)                   |

### Required Accounts

1. **Clerk** (Authentication) - [clerk.com](https://clerk.com)
   - Free tier available for development
   - Create an application and get API keys

2. **Convex** (Backend) - [convex.dev](https://convex.dev)
   - Free tier includes generous development usage
   - Run locally during development

3. **Groq** (AI) - [console.groq.com](https://console.groq.com)
   - Free tier with rate limits
   - Get API key for AI inference

---

## Quick Start

For experienced developers, here's the fastest path:

```bash
# 1. Clone and install
git clone <repository-url>
cd ai-therapist
bun install

# 2. Set up environment (creates .env.local with prompts)
bun run env:init

# 3. Generate encryption key
bun run encryption:setup

# 4. Start Convex backend (keep running in separate terminal)
bun run convex:dev

# 5. Start Next.js development server
bun run dev

# 6. Open http://localhost:4000
```

---

## Step-by-Step Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd ai-therapist
```

### Step 2: Install Dependencies

```bash
bun install
```

This installs all required packages including:

- Next.js 16 with React 19
- Convex client
- Clerk authentication
- UI components (Radix, shadcn/ui)
- Testing tools (Jest, Playwright)

### Step 3: Configure Clerk Authentication

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Create a new application (or use existing)
3. Navigate to **API Keys**
4. Copy the following keys:
   - `CLERK_SECRET_KEY` (starts with `sk_`)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_`)

5. Configure webhook:
   - Go to **Webhooks** in Clerk dashboard
   - Add endpoint: `http://localhost:4000/api/webhooks/clerk` (for local) or your production URL
   - Select events: `user.created`, `user.updated`, `user.deleted`
   - Copy the **Signing Secret** (`CLERK_WEBHOOK_SECRET`)

### Step 4: Configure Convex Backend

1. Go to [dashboard.convex.dev](https://dashboard.convex.dev)
2. Create a new project (or use existing)
3. Run the development server:
   ```bash
   bun run convex:dev
   ```
4. Follow the prompts to authenticate and select your project
5. The Convex URL will be saved automatically

### Step 5: Get Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Create an account or sign in
3. Navigate to **API Keys**
4. Create a new API key
5. Copy the key (starts with `gsk_`)

### Step 6: Set Up Environment Variables

Create a `.env.local` file in the project root:

```bash
# Run the interactive setup script
bun run env:init

# Or create manually
cp .env.example .env.local
```

Required environment variables:

```env
# Authentication (from Clerk dashboard)
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx

# Backend (from Convex)
CONVEX_URL=https://your-project.convex.cloud
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud

# AI (from Groq)
GROQ_API_KEY=gsk_xxxxx

# Encryption (generate with setup script)
ENCRYPTION_KEY=your-32-character-encryption-key

# Development options
RATE_LIMIT_DISABLED=true
CACHE_ENABLED=true
LOG_LEVEL=debug
```

### Step 7: Generate Encryption Key

```bash
bun run encryption:setup
```

This generates a secure 32-character encryption key for encrypting therapeutic message content.

### Step 8: Start Development Servers

**Terminal 1 - Convex Backend:**

```bash
bun run convex:dev
```

Keep this running. It will hot-reload on schema/function changes.

**Terminal 2 - Next.js Frontend:**

```bash
bun run dev
```

### Step 9: Verify Setup

1. Open [http://localhost:4000](http://localhost:4000)
2. Sign up with Clerk (use email or social login)
3. Create a new chat session
4. Send a test message

If everything works, you're ready to develop! 🎉

---

## Development Workflow

### Directory Structure

```
ai-therapist/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   │   ├── ui/           # Base UI components (shadcn/ui + therapeutic)
│   │   └── ...
│   ├── features/         # Feature modules
│   │   ├── auth/         # Authentication UI
│   │   ├── chat/         # Chat feature
│   │   ├── therapy/      # Therapeutic frameworks
│   │   └── ...
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and helpers
│   │   ├── api/          # API clients and middleware
│   │   ├── chat/         # Chat utilities
│   │   ├── security/     # Security helpers
│   │   └── therapy/      # Therapeutic analysis
│   └── types/            # TypeScript type definitions
├── convex/               # Convex backend functions
│   ├── schema.ts         # Database schema
│   ├── messages.ts       # Message queries/mutations
│   └── ...
├── __tests__/            # Test files
├── e2e/                  # Playwright E2E tests
└── docs/                 # Documentation
```

### Making Changes

1. **Create a feature branch:**

   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes** - Hot reload is enabled for both Next.js and Convex

3. **Run type check and lint before committing:**

   ```bash
   bun run lint
   bunx tsc --noEmit
   ```

4. **Run tests:**

   ```bash
   bun run test
   ```

5. **Commit with meaningful messages:**
   ```bash
   git commit -m "feat: add new therapy framework support"
   ```

### Code Style

The project uses:

- **TypeScript** with strict mode
- **ESLint** with Next.js and custom rules
- **Prettier** for formatting
- **Pre-commit hooks** (Husky + lint-staged)

Code is automatically formatted on commit. To manually format:

```bash
bun run format
```

---

## Common Issues & Solutions

### "Cannot find module 'convex/...'" Error

**Problem:** TypeScript can't find Convex generated types.

**Solution:**

```bash
# Regenerate Convex types
bun run convex:dev
# Press Ctrl+C after it syncs
```

### Clerk Authentication Not Working

**Problem:** Redirect loops or unauthorized errors.

**Solutions:**

1. Verify `.env.local` has correct Clerk keys
2. Check Clerk dashboard for API status
3. Ensure NEXT*PUBLIC variables have the `NEXT_PUBLIC*` prefix
4. Clear browser cookies for localhost

### "Encryption key not found" Error

**Problem:** Missing or invalid encryption key.

**Solution:**

```bash
bun run encryption:setup
# Restart the dev server
```

### "Port 4000 already in use" Error

**Problem:** Another process is using port 4000.

**Solution:**

```bash
# Find and kill the process
lsof -i :4000
kill -9 <PID>

# Or use a different port
PORT=4001 bun run dev
```

### Convex Connection Issues

**Problem:** "Failed to connect to Convex" errors.

**Solutions:**

1. Ensure `npm run convex:dev` is running
2. Check `.env.local` has correct CONVEX_URL
3. Run `npx convex dev` to re-authenticate

### Tests Failing with "Cannot find element"

**Problem:** React Testing Library can't find elements.

**Solutions:**

1. Wait for async operations: `await waitFor(() => ...)`
2. Check component is mounted
3. Use `screen.debug()` to see rendered output

### E2E Tests Timeout

**Problem:** Playwright tests take too long or timeout.

**Solutions:**

1. Ensure both Convex and Next.js servers are running
2. Increase timeout in `playwright.config.ts`
3. Run in headed mode to debug: `bun run test:e2e:headed`

---

## IDE Setup

### VS Code (Recommended)

Install these extensions:

- **ESLint** - Linting
- **Prettier** - Formatting
- **TypeScript and JavaScript Language Features** - Built-in
- **Tailwind CSS IntelliSense** - CSS utilities autocomplete
- **Convex** (if available) - Convex function support

Recommended settings (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```

### WebStorm / IntelliJ

1. Enable ESLint: Settings → Languages & Frameworks → ESLint
2. Enable Prettier: Settings → Languages & Frameworks → Prettier
3. Set Prettier as default formatter
4. Enable "Run on save" for both

---

## Testing

### Unit Tests (Jest)

```bash
# Run all tests
bun run test

# Run in watch mode (recommended during development)
bun run test:watch

# Run with coverage report
bun run test:coverage

# Run specific test file
bun run test -- session-repository.test.ts
```

### End-to-End Tests (Playwright)

```bash
# Run all E2E tests (headless)
bun run test:e2e

# Run with UI (recommended for debugging)
bun run test:e2e:ui

# Run in headed browser
bun run test:e2e:headed

# Run specific test
bun run test:e2e -- chat-flows.spec.ts
```

### Full QA Suite

Before submitting a PR, run the complete QA suite:

```bash
bun run qa:full
```

This runs:

1. API type generation
2. Linting
3. Type checking
4. Unit tests with coverage
5. E2E tests

---

## Helpful Commands

| Command                    | Description                          |
| -------------------------- | ------------------------------------ |
| `bun run dev`              | Start development server (port 4000) |
| `bun run dev:local`        | Start on localhost only              |
| `bun run build`            | Build for production                 |
| `bun run lint`             | Run ESLint                           |
| `bun run format`           | Format code with Prettier            |
| `bun run test`             | Run unit tests                       |
| `bun run test:coverage`    | Run tests with coverage              |
| `bun run test:e2e`         | Run Playwright E2E tests             |
| `bun run convex:dev`       | Start Convex development server      |
| `bun run convex:deploy`    | Deploy Convex to production          |
| `bun run encryption:setup` | Set up encryption key                |
| `bun run api:types`        | Generate API TypeScript types        |
| `bun run analyze`          | Analyze bundle size                  |
| `bun run qa:full`          | Run full QA suite                    |

---

## Next Steps

Once your development environment is set up:

1. **Read the Architecture Decision Records** - `docs/adr/`
2. **Explore the codebase** - Start with `src/app/` for pages
3. **Review component library** - `src/components/ui/`
4. **Understand the data model** - `docs/DATA_MODEL.md`
5. **Check the API spec** - `docs/api.yaml`

Happy coding! 🚀
