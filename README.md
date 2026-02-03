# 🧠💙 AI Therapist

AI-powered mental health support with enterprise-grade security and professional therapeutic frameworks.

## Features

- **Therapeutic AI** - Evidence-based frameworks including CBT, Schema Therapy, and mindfulness approaches
- **Privacy-First** - AES-256-GCM encryption, BYOK support, optional local AI (Ollama)
- **Multi-Language** - English and Dutch with localized CBT exports
- **Enterprise Security** - Clerk authentication, Convex backend with ownership guards
- **Modern Stack** - Next.js 16, React 19, AI SDK 6, Tailwind CSS v4

## Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Set up environment
bun run env:init
bun run encryption:setup

# 3. Configure services
# - Clerk: Create app at clerk.com, add keys to .env.local
# - Convex: Create project at convex.dev, add URL to .env.local
# - Add Clerk webhook: <CONVEX_URL>/clerk-webhook

# 4. Start development (two terminals)
bun run convex:dev  # Terminal 1: Convex backend
bun run dev         # Terminal 2: Next.js (localhost:4000)
```

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for detailed setup instructions.

## Commands

| Command              | Description                         |
| -------------------- | ----------------------------------- |
| `bun run dev`        | Start development server            |
| `bun run build`      | Build for production                |
| `bun run test`       | Run unit tests                      |
| `bun run test:e2e`   | Run Playwright E2E tests            |
| `bun run qa:full`    | Full QA suite (lint + test + build) |
| `bun run convex:dev` | Start local Convex backend          |
| `bun run lint`       | Run ESLint                          |

## Architecture

```
src/
├── app/           # Next.js App Router
├── features/      # Feature modules (chat, therapy, CBT)
├── components/ui/ # Shared UI components
├── lib/           # Utilities, API clients, auth
└── ai/            # AI model configuration
convex/            # Backend schema and functions
```

**Tech Stack**: Next.js 16 (Turbopack), React 19, TypeScript, Convex, Clerk, AI SDK 6, Tailwind CSS v4, Zod v4

## AI Models

| Mode          | Model              | Use Case                   |
| ------------- | ------------------ | -------------------------- |
| Web Search    | gpt-oss-120b       | Chat with browser tools    |
| Regular Chat  | gpt-oss-20b        | Fast responses             |
| Local/Private | gemma3:4b (Ollama) | On-device, maximum privacy |
| BYOK          | gpt-5-mini         | User-provided OpenAI key   |

## Documentation

- [Development Guide](docs/DEVELOPMENT.md) - Setup, testing, workflows
- [Deployment](docs/DEPLOYMENT.md) - Production deployment
- [Data Model](docs/DATA_MODEL.md) - Database schema
- [Changelog](docs/CHANGELOG.md) - Recent improvements
- [ADRs](docs/adr/) - Architecture decisions

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built with ❤️ for mental health support**
