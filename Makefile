# Default target: show comprehensive help on plain `make`
.DEFAULT_GOAL := help

# Variables
APP_PORT ?= 4000
ENV_FILE := .env.local
LOCKFILE := package-lock.json
DB_FILE := prisma/dev.db
API_SPEC := docs/api.yaml
API_TYPES := src/types/api.generated.ts
STAMP_NODE := node_modules/.installed

SHELL := /bin/sh

.PHONY: help setup dev start build bootstrap install env db redis encryption prisma api-types playwright doctor \
        lint fix tsc-check prisma-validate test test-watch coverage e2e e2e-ui e2e-debug qa-smoke qa-full \
        db-studio migrate push generate clean clean-all redis-up redis-stop db-reset \
        auth-reset auth-setup auth-status auth-health

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
	"  Reset database      make db-reset          # deletes local DB and re-initializes" \
	"  Prod build/start    make build && make start" \
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
	"  • Node deps, .env.local, DB init, Redis install/start, encryption setup/validate," \
	"    Prisma client generation, OpenAPI types, Playwright browsers (for E2E)." \
	"- Targets reuse your existing npm scripts and scripts/*.js to avoid duplication." \
	"" \
	"Targets:"
	@awk 'BEGIN {FS = ":.*##";} /^[a-zA-Z0-9_.-]+:.*?##/ { printf "  %-18s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo

# ----- Single intelligent entrypoints -----

setup: $(STAMP_NODE) env $(DB_FILE) redis-up encryption-ok $(API_TYPES) prisma-generate playwright ## Intelligent setup + start dev
	@npm run dev

dev: ## Start dev server (assumes setup done)
	npm run dev

start: redis-up encryption-ok ## Start prod server (db setup runs via npm script)
	@npm run start

build: install db ## Build for production (db setup runs via npm script)
	@npm run build

# ----- Setup building blocks -----

bootstrap: env install db redis encryption prisma api-types playwright ## One-time full setup
	@echo "✅ Setup complete"

install: $(STAMP_NODE) ## Install node dependencies

env: ## Ensure .env.local exists/up-to-date
	@npm run env:init

db: $(DB_FILE) ## Ensure DB is initialized

redis: redis-up ## Ensure Redis installed and running

encryption: encryption-ok ## Ensure encryption is set up/valid

prisma: prisma-generate ## Generate Prisma client

api-types: $(API_TYPES) ## Generate OpenAPI TS types

playwright: ## Ensure Playwright browsers are installed
	@npx playwright install --with-deps || true

doctor: ## Quick health diagnostics
	@echo "Node: $$(node -v)"
	@echo "NPM:  $$(npm -v)"
	@printf "Redis: "; (redis-cli ping >/dev/null 2>&1 && echo "PONG") || echo "not running"
	@test -f $(ENV_FILE) && echo "Env: $(ENV_FILE) present" || echo "Env: MISSING"
	@test -f $(DB_FILE) && echo "DB: $(DB_FILE) present" || echo "DB: MISSING"
	@npm run -s encryption:validate >/dev/null 2>&1 && echo "Encryption: OK" || echo "Encryption: not set"
	@test -f $(API_TYPES) && echo "API types: present" || echo "API types: MISSING"
	@echo "Health endpoint:"; (curl -fsS http://localhost:$(APP_PORT)/api/health >/dev/null 2>&1 && echo "OK") || echo "unreachable (server not running)"

# ----- Quality gates -----

lint: ## Lint and validate (ESLint + TS + Prisma)
	@npx eslint .
	@npx tsc --noEmit
	@npx prisma validate

fix: ## Auto-fix lint issues
	@npx eslint . --fix

tsc-check: ## TypeScript type-check only
	@npx tsc --noEmit

prisma-validate: ## Validate Prisma schema
	@npx prisma validate

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

# ----- DB/Prisma utilities -----

db-studio: ## Open Prisma Studio
	@npm run db:studio

migrate: ## Create/apply Prisma migration (interactive)
	@npm run db:migrate

push: ## Push schema to DB
	@npm run db:push

generate: prisma ## Generate Prisma client
	@true

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

# ----- DB reset -----

db-reset: ## Delete local dev DB and re-initialize (destructive)
	@echo "⚠️  This will delete prisma/dev.db and re-initialize the database."
	@rm -f prisma/dev.db
	@npm run db:setup

# ----- Files and stamps -----

$(STAMP_NODE): package.json $(LOCKFILE)
	@printf "🔎 Checking node_modules... "
	@if [ -d node_modules ]; then echo "✅ present"; else echo "⬇️  installing"; npm install >/dev/null 2>&1 && echo "✅ installed"; fi
	@mkdir -p node_modules
	@touch $(STAMP_NODE)

$(ENV_FILE):
	@set -e; npm run env:init

$(DB_FILE): prisma/schema.prisma
	@printf "🔎 Checking database... "
	@([ -f $(DB_FILE) ] && echo "✅ present") || (echo "⬇️  setting up" && npm run -s db:setup >/dev/null 2>&1 && echo "✅ ready")

$(API_TYPES): $(API_SPEC)
	@printf "🔎 Generating API types... "
	@npm run -s api:types >/dev/null 2>&1 && echo "✅ done"

prisma-generate:
	@printf "🔎 Generating Prisma client... "
	@npm run -s db:generate >/dev/null 2>&1 && echo "✅ done"

encryption-ok:
	@printf "🔎 Checking encryption... "
	@(npm run -s encryption:validate >/dev/null 2>&1 && echo "✅ valid") || (echo "⚠️  setting up" && npm run -s encryption:setup >/dev/null 2>&1 && echo "✅ encryption ready")

# ----- Cleanup -----

clean: ## Clean build/test artifacts
	rm -rf .next playwright-report test-results

clean-all: clean ## Remove node_modules and local DB (destructive)
	rm -rf node_modules
	rm -f $(STAMP_NODE)
	rm -f $(DB_FILE)
