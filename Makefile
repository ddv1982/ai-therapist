# Default target: show comprehensive help on plain `make`
.DEFAULT_GOAL := help

# Variables
APP_PORT ?= 4000
ENV_FILE := .env.local
LOCKFILE := package-lock.json
API_SPEC := docs/api.yaml
API_TYPES := src/types/api.generated.ts
STAMP_NODE := node_modules/.installed

SHELL := /bin/sh

.PHONY: help setup dev start build next-build bootstrap install env redis encryption api-types playwright doctor \
        lint fix tsc-check test test-watch coverage e2e e2e-ui e2e-debug qa-smoke qa-full \
        clean clean-all redis-up redis-stop next-stop \
        auth-reset auth-setup auth-status auth-health \
        convex-dev convex-deploy convex-stop convex-health

help: ## Show help
	@printf "%s\n" \
	"AI Therapist - Makefile Help" \
	"──────────────────────────────────────────────────────────────────────────────" \
	"Usage:" \
	"  make                Show this help (default)" \
	"  make setup          Intelligent setup + start dev (auto-installs and prepares everything)" \
	"  make start          Start in production mode (after build) with Redis/encryption checks" \
	"  make build          Build for production (ensures DB)" \
	"" \
	"Common flows:" \
	"  First run           make setup" \
	"  Daily dev           make setup             # or: make dev (after initial setup)" \
	"  Run tests           make test              # unit/integration (Jest)" \
	"  Run E2E             make e2e               # Playwright; auto-starts server" \
"  QA (smoke)          make qa-smoke          # lint + typecheck + jest" \
"  QA (full)           make qa-full           # smoke + coverage + e2e" \
	"  Prod build/start    make build && make start" \
	"" \
	"Convex (serverless DB/functions):" \
	"  Start Convex dev    make convex-dev       # runs 'npm run convex:dev'" \
	"  Stop Convex dev     make convex-stop      # kill local Convex on common ports" \
	"  Convex health       make convex-health    # curl Convex URL from env" \
	"  Deploy Convex       make convex-deploy    # runs 'npm run convex:deploy'" \
	"  Stop Next dev       make next-stop        # kill Next.js dev on APP_PORT (default 4000)" \
	"" \
	"Authorization (TOTP):" \
	"  Reset auth          make auth-reset        # clears TOTP config, sessions, trusted devices" \
	"  Setup TOTP          make auth-setup        # interactive setup (QR + manual key)" \
	"  Status/Health       make auth-status | make auth-health" \
	"" \
	"Diagnostics:" \
	"  make doctor         Quick local checks (Node/NPM, Redis, env, DB, encryption, API types, /api/health)" \
	"" \
	"Environment variables:" \
	"  APP_PORT=4000       Port used by local app and health checks (override: APP_PORT=5000 make setup)" \
	"" \
	"Notes:" \
	"- \"Intelligent\" targets verify and install prerequisites automatically:" \
	"  • Node deps, .env.local, Redis install/start, encryption setup/validate," \
	"    OpenAPI types, Playwright browsers (for E2E)." \
	"- Targets reuse your existing npm scripts and scripts/*.js to avoid duplication." \
	"" \
	"Targets:"
	@awk 'BEGIN {FS = ":.*##";} /^[a-zA-Z0-9_.-]+:.*?##/ { printf "  %-18s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo

# ----- Single intelligent entrypoints -----

setup: $(STAMP_NODE) env redis-up encryption-ok $(API_TYPES) playwright ## Intelligent setup + start dev (Convex + Next, stops on Ctrl+C)
	@/bin/sh -c '\
	  set -e; \
	  echo "🔧 Ensuring Next.js is not already running..."; $(MAKE) -s next-stop >/dev/null 2>&1 || true; \
	  echo "🔧 Ensuring Convex is not already running..."; $(MAKE) -s convex-stop >/dev/null 2>&1 || true; \
	  echo "🚀 Starting Convex in background..."; \
	  npm run convex:dev >/tmp/convex-dev.log 2>&1 & CONVEX_PID=$$!; \
	  sleep 2; \
	  trap "echo \"🛑 Stopping Next.js and Convex...\"; $(MAKE) -s next-stop >/dev/null 2>&1 || true; kill $$CONVEX_PID 2>/dev/null || true; $(MAKE) -s convex-stop >/dev/null 2>&1 || true" INT TERM EXIT; \
	  echo "🌐 Starting Next dev..."; \
	  CORS_ALLOWED_ORIGIN=$${CORS_ALLOWED_ORIGIN:-$$(node scripts/ensure-cors-origin.js)} \
	  CONVEX_URL=http://127.0.0.1:3210 \
	  NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210 \
	  npm run dev; \
	'

dev: ## Start dev (Convex + Next; Ctrl+C cleanly stops both)
	@/bin/sh -c '\
	  set -e; \
	  echo "🔧 Ensuring Next.js is not already running..."; $(MAKE) -s next-stop >/dev/null 2>&1 || true; \
	  echo "🔧 Ensuring Convex is not already running..."; $(MAKE) -s convex-stop >/dev/null 2>&1 || true; \
	  echo "🚀 Starting Convex in background..."; \
	  npm run convex:dev >/tmp/convex-dev.log 2>&1 & CONVEX_PID=$$!; \
	  sleep 2; \
	  trap "echo \"🛑 Stopping Next.js and Convex...\"; $(MAKE) -s next-stop >/dev/null 2>&1 || true; kill $$CONVEX_PID 2>/dev/null || true; $(MAKE) -s convex-stop >/dev/null 2>&1 || true" INT TERM EXIT; \
	  echo "🌐 Starting Next dev..."; \
	  CORS_ALLOWED_ORIGIN=$${CORS_ALLOWED_ORIGIN:-$$(node scripts/ensure-cors-origin.js)} \
	  CONVEX_URL=http://127.0.0.1:3210 \
	  NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210 \
	  npm run dev; \
	'

start: redis-up encryption-ok ## Start prod server (ensure convex:dev is running)
	@npm run start

build: install ## Build for production
	@$(MAKE) next-build

next-build: ## Always run the Next.js build
	@CORS_ALLOWED_ORIGIN=$${CORS_ALLOWED_ORIGIN:-$$(node scripts/ensure-cors-origin.js)} npm run build

# ----- Setup building blocks -----

bootstrap: env install redis encryption api-types playwright ## One-time full setup
	@echo "✅ Setup complete"

install: $(STAMP_NODE) ## Install node dependencies

env: ## Ensure .env.local exists/up-to-date
	@npm run env:init

redis: redis-up ## Ensure Redis installed and running

encryption: encryption-ok ## Ensure encryption is set up/valid

api-types: $(API_TYPES) ## Generate OpenAPI TS types

playwright: ## Ensure Playwright browsers are installed
	@npx playwright install --with-deps || true

doctor: ## Quick health diagnostics
	@echo "Node: $$(node -v)"
	@echo "NPM:  $$(npm -v)"
	@printf "Redis: "; (redis-cli ping >/dev/null 2>&1 && echo "PONG") || echo "not running"
	@test -f $(ENV_FILE) && echo "Env: $(ENV_FILE) present" || echo "Env: MISSING"
	@npm run -s encryption:validate >/dev/null 2>&1 && echo "Encryption: OK" || echo "Encryption: not set"
	@test -f $(API_TYPES) && echo "API types: present" || echo "API types: MISSING"
	@echo "Health endpoint:"; (curl -fsS http://localhost:$(APP_PORT)/api/health >/dev/null 2>&1 && echo "OK") || echo "unreachable (server not running)"
	@echo "Convex URL:"; echo $${CONVEX_URL:-$$(grep -E '^NEXT_PUBLIC_CONVEX_URL=' $(ENV_FILE) 2>/dev/null | sed -E 's/.*=\"?//; s/\"$//')}
	@echo "Convex health:"; (curl -fsS $${CONVEX_URL:-$$(grep -E '^NEXT_PUBLIC_CONVEX_URL=' $(ENV_FILE) 2>/dev/null | sed -E 's/.*=\"?//; s/\"$//')} >/dev/null 2>&1 && echo "OK") || echo "unreachable (ensure 'make convex-dev' is running)"

# ----- Quality gates -----

lint: ## Lint and validate (ESLint + TS)
	@npx eslint .
	@npx tsc --noEmit

fix: ## Auto-fix lint issues
	@npx eslint . --fix

tsc-check: ## TypeScript type-check only
	@npx tsc --noEmit

# ----- Testing -----

test: ## Run unit/integration tests (Jest)
	@npm test

test-watch: ## Jest watch mode
	@npm run test:watch

coverage: ## Jest coverage
	@npm run test:coverage

e2e: playwright ## Run Playwright E2E (auto-starts dev server via config)
	@npm run test:e2e

e2e-ui: playwright ## Run Playwright E2E with UI
	@npm run test:e2e:ui

e2e-debug: playwright ## Run Playwright E2E in debug mode
	@npm run test:e2e:debug

# ----- QA bundles -----

qa-smoke: ## Lint, type-check, and run unit/integration tests
	@npm run qa:smoke

qa-full: ## Full QA: smoke + coverage + E2E
	@npm run qa:full

# ----- Redis helpers -----

redis-up: ## Ensure Redis installed and running (installs/starts if missing)
	@printf "🔎 Checking Redis... "
	@if redis-cli ping >/dev/null 2>&1; then \
		echo "✅ running"; \
	else \
		echo "⚠️  not running"; \
		echo "   ⬇️  Installing/starting Redis..."; \
		(npm run redis:setup || npm run redis:start || true) >/dev/null 2>&1; \
		if redis-cli ping >/dev/null 2>&1; then echo "   ✅ Redis ready"; else echo "   ❌ Redis not ready"; fi; \
	fi

redis-stop: ## Stop Redis
	npm run redis:stop || true

# ----- Authorization (TOTP) helpers -----

auth-reset: ## Reset authorization (TOTP + sessions/trusted devices)
	@npx tsx scripts/totp-manager.js reset

auth-setup: ## Interactive TOTP setup (prints manual key and QR link)
	@npx tsx scripts/totp-manager.js setup

auth-status: ## Show TOTP status
	@npx tsx scripts/totp-manager.js status

auth-health: ## TOTP health diagnostics
	@npx tsx scripts/totp-manager.js health


# ----- Files and stamps -----

$(STAMP_NODE): package.json $(LOCKFILE)
	@printf "🔎 Checking node_modules... "
	@if [ -d node_modules ]; then echo "✅ present"; else echo "⬇️  installing"; npm install >/dev/null 2>&1 && echo "✅ installed"; fi
	@mkdir -p node_modules
	@touch $(STAMP_NODE)

$(ENV_FILE):
	@set -e; npm run env:init

$(API_TYPES): $(API_SPEC)
	@printf "🔎 Generating API types... "
	@npm run -s api:types >/dev/null 2>&1 && echo "✅ done"

encryption-ok:
	@printf "🔎 Checking encryption... "
	@(npm run -s encryption:validate >/dev/null 2>&1 && echo "✅ valid") || (echo "⚠️  setting up" && npm run -s encryption:setup >/dev/null 2>&1 && echo "✅ encryption ready")

# ----- Cleanup -----

clean: ## Clean build/test artifacts
	rm -rf .next playwright-report test-results

clean-all: clean ## Remove node_modules and local DB (destructive)
	rm -rf node_modules
	rm -f $(STAMP_NODE)
	true

# ----- Convex helpers -----

convex-dev: ## Start Convex local backend (Ctrl+C to stop). If port busy, run 'make convex-stop' first.
	@echo "Starting Convex dev..."
	@npm run convex:dev

convex-deploy: ## Deploy Convex functions/schema to the configured project
	@npm run convex:deploy

convex-health: ## Check Convex endpoint in env
	@echo "Convex URL: $${CONVEX_URL:-$$(grep -E '^NEXT_PUBLIC_CONVEX_URL=' $(ENV_FILE) 2>/dev/null | sed -E 's/.*=\"?//; s/\"$//')}"
	@curl -v -fsS $${CONVEX_URL:-$$(grep -E '^NEXT_PUBLIC_CONVEX_URL=' $(ENV_FILE) 2>/dev/null | sed -E 's/.*=\"?//; s/\"$//')} || true

convex-stop: ## Stop any local Convex backend on common ports (3210 and 6790)
	@echo "Stopping Convex on port 3210 (if running)..."; \
  PID=$$(lsof -ti tcp:3210 2>/dev/null || true); \
  if [ -n "$$PID" ]; then kill $$PID || true; sleep 1; fi; \
  echo "Stopping Convex on port 6790 (if running)..."; \
  PID2=$$(lsof -ti tcp:6790 2>/dev/null || true); \
  if [ -n "$$PID2" ]; then kill $$PID2 || true; sleep 1; fi; \
  echo "Done."

next-stop: ## Stop any Next.js dev server on APP_PORT (default 4000)
	@echo "Stopping Next.js on port $(APP_PORT) (if running)..."; \
  PID=$$(lsof -ti tcp:$(APP_PORT) 2>/dev/null || true); \
  if [ -n "$$PID" ]; then kill $$PID || true; sleep 1; fi; \
  echo "Done."
