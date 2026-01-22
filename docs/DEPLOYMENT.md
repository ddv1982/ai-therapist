# Deployment Guide

This document outlines the deployment process for the AI Therapist application, including environment setup, deployment procedures, and rollback strategies.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Deployment Environments](#deployment-environments)
- [Deployment Process](#deployment-process)
- [CI/CD Pipeline](#cicd-pipeline)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

- **Node.js** 24+ (`node --version`)
- **npm** 10+ (`npm --version`)
- **Git** 2.40+ (`git --version`)
- **Convex CLI** (`npx convex --version`)

### Required Accounts

- [Clerk](https://clerk.com) - Authentication provider
- [Convex](https://convex.dev) - Backend-as-a-Service
- [Groq](https://groq.com) - AI model provider (optional, for cloud AI)

---

## Environment Configuration

### Required Environment Variables

The application requires the following environment variables to run:

| Variable                            | Required | Description                                     |
| ----------------------------------- | -------- | ----------------------------------------------- |
| `ENCRYPTION_KEY`                    | Yes      | 32+ character key for encrypting sensitive data |
| `CLERK_SECRET_KEY`                  | Yes      | Clerk backend secret key                        |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes      | Clerk frontend publishable key                  |
| `NEXT_PUBLIC_CONVEX_URL`            | Yes      | Convex deployment URL                           |

### Optional Environment Variables

| Variable              | Default       | Description                              |
| --------------------- | ------------- | ---------------------------------------- |
| `NODE_ENV`            | `development` | Environment mode                         |
| `PORT`                | `4000`        | Server port                              |
| `LOG_LEVEL`           | `info`        | Logging level (debug, info, warn, error) |
| `GROQ_API_KEY`        | -             | Groq API key for cloud AI                |
| `CONVEX_URL`          | -             | Convex backend URL                       |
| `RATE_LIMIT_DISABLED` | `false`       | Disable rate limiting                    |
| `CACHE_ENABLED`       | `true`        | Enable response caching                  |

### Setting Up Environment

1. **Copy the example configuration:**

   ```bash
   cp .env.example .env.local
   ```

2. **Generate encryption key:**

   ```bash
   npm run encryption:generate
   ```

3. **Configure Clerk:**
   - Create a Clerk application at [dashboard.clerk.com](https://dashboard.clerk.com)
   - Copy the API keys to your `.env.local`:
     ```env
     CLERK_SECRET_KEY=sk_test_xxxxx
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
     ```

4. **Configure Convex:**
   - Run `npx convex dev` to set up Convex
   - Copy the deployment URL:
     ```env
     NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
     ```

5. **Validate configuration:**
   ```bash
   ./scripts/check-env-parity.sh --verbose
   ```

---

## Deployment Environments

### Development

Local development environment for active development.

```bash
# Start development server
npm run dev

# Or with local-only binding
npm run dev:local
```

### Staging (Preview)

Preview deployments are automatically created for pull requests.

- URL: `https://pr-{number}.your-domain.vercel.app`
- Uses development Clerk keys
- Uses separate Convex deployment

### Production

Production deployment on the main branch.

- URL: `https://your-domain.com`
- Uses production Clerk keys
- Uses production Convex deployment

---

## Deployment Process

### Step-by-Step Production Deployment

1. **Ensure all tests pass locally:**

   ```bash
   bun run qa:full
   ```

2. **Create a release branch (for major releases):**

   ```bash
   git checkout -b release/v1.x.x
   ```

3. **Update version (if applicable):**

   ```bash
   npm version patch|minor|major
   ```

4. **Push changes and create PR:**

   ```bash
   git push origin release/v1.x.x
   gh pr create --title "Release v1.x.x" --body "Release notes..."
   ```

5. **Wait for CI to pass:**
   - Lint and type check ✓
   - Unit tests ✓
   - E2E tests ✓
   - Build verification ✓

6. **Merge to main:**

   ```bash
   gh pr merge --squash
   ```

7. **Verify deployment:**
   - Check production URL
   - Verify health endpoint: `curl https://your-domain.com/api/health`
   - Run smoke tests

8. **Tag release:**
   ```bash
   git tag v1.x.x
   git push origin v1.x.x
   ```

### Convex Deployment

Convex functions are deployed separately:

```bash
# Deploy to production Convex
bun run convex:deploy

# Deploy to development Convex
bun run convex:dev
```

**Important:** Always deploy Convex functions before the Next.js app if there are schema changes.

---

## CI/CD Pipeline

### GitHub Actions Workflow

The CI pipeline (`.github/workflows/ci.yml`) runs on:

- Push to `main` branch
- Pull requests to `main`

### Pipeline Jobs

| Job                  | Description                   | Duration |
| -------------------- | ----------------------------- | -------- |
| `lint-and-typecheck` | ESLint, TypeScript, Prettier  | ~2 min   |
| `unit-tests`         | Jest tests with coverage      | ~3 min   |
| `build`              | Next.js production build      | ~3 min   |
| `e2e-tests`          | Playwright browser tests      | ~5 min   |
| `bundle-size`        | Bundle analysis (PRs only)    | ~2 min   |
| `env-check`          | Environment parity validation | ~30 sec  |

### CI Environment Variables

Configure these secrets in GitHub repository settings:

| Secret                              | Required | Description           |
| ----------------------------------- | -------- | --------------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | No\*     | Clerk publishable key |
| `CLERK_SECRET_KEY`                  | No\*     | Clerk secret key      |
| `NEXT_PUBLIC_CONVEX_URL`            | No\*     | Convex deployment URL |
| `CODECOV_TOKEN`                     | No       | For coverage uploads  |

\*Uses mock values if not provided

---

## Rollback Procedures

### Quick Rollback (Vercel)

1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"

### Git Rollback

```bash
# Identify the last good commit
git log --oneline -10

# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit (destructive)
git reset --hard <commit-sha>
git push --force origin main  # ⚠️ Use with caution
```

### Convex Rollback

Convex doesn't support automatic rollback. To rollback:

1. Checkout the previous version:

   ```bash
   git checkout v1.x.x -- convex/
   ```

2. Redeploy:
   ```bash
   bun run convex:deploy
   ```

### Database Rollback

For data-related issues:

1. **Stop new writes** (if critical)
2. **Identify affected data** in Convex dashboard
3. **Create fix migration** in `convex/migrations/`
4. **Test on staging** before production

---

## Troubleshooting

### Common Issues

#### Build Fails with TypeScript Errors

```bash
# Check for type errors locally
bunx tsc --noEmit

# Fix issues and retry
bun run build
```

#### E2E Tests Timeout

The E2E tests require both Convex and Next.js servers:

```bash
# Ensure Convex is running
bunx convex dev &

# Then run E2E tests
bun run test:e2e
```

#### Environment Variables Not Loading

1. Check `.env.local` file exists
2. Verify variable names (must match exactly)
3. Run validation script:
   ```bash
   ./scripts/check-env-parity.sh --verbose
   ```

#### Clerk Authentication Errors

- Verify Clerk keys match the environment
- Check Clerk dashboard for API status
- Ensure webhook secrets are configured

### Health Checks

```bash
# Application health
curl https://your-domain.com/api/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

### Logs

- **Vercel Logs:** Dashboard → Functions → Logs
- **Convex Logs:** Dashboard → Logs
- **Local Logs:** Check terminal output, adjust `LOG_LEVEL`

---

## Security Checklist

Before each production deployment:

- [ ] No secrets committed to repository
- [ ] Environment variables properly configured
- [ ] Encryption key is unique per environment
- [ ] Clerk keys match environment (prod vs dev)
- [ ] CSP headers are properly configured
- [ ] Rate limiting is enabled
- [ ] All tests pass

---

## Emergency Contacts

For deployment emergencies:

1. Check [Vercel Status](https://vercel-status.com)
2. Check [Convex Status](https://status.convex.dev)
3. Check [Clerk Status](https://status.clerk.com)

---

## Appendix: Useful Commands

```bash
# Full QA check
bun run qa:full

# Analyze bundle size
bun run analyze

# Check environment
./scripts/check-env-parity.sh --verbose

# Generate API types
bun run api:types

# Setup encryption
bun run encryption:setup

# Run specific E2E test
bun run test:e2e -- chat-flows.spec.ts
```
