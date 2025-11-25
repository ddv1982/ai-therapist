# Package.json Cleanup Specification

## 1. Overview

### 1.1 Purpose
Clean up the project's `package.json` by systematically identifying and removing unused dependencies while maintaining full application functionality, reducing bundle size, improving security posture, and accelerating installation times.

### 1.2 Goals
- **Primary**: Remove all unused dependencies from `package.json`
- **Secondary**: Identify redundant dependencies (already included by other packages)
- **Tertiary**: Reduce `node_modules` size and security vulnerability surface
- **Quality**: Maintain 100% test pass rate and successful builds throughout the process

### 1.3 Target Deliverables
- Cleaned `package.json` with only actively used dependencies
- Verification report showing removed packages and size reduction
- Documentation of analysis methodology for future maintenance

### 1.4 Non-Goals
- Updating package versions (separate task)
- Replacing packages with alternatives
- Refactoring code to remove dependencies
- Adding new dependencies

---

## 2. Current State Analysis

### 2.1 Package.json Structure
The project currently has **62 dependencies** and **30 devDependencies** (92 total packages):

**Tech Stack Overview:**
- **Framework**: Next.js 16.0.3 with App Router
- **UI**: React 19.2.0 with Radix UI components
- **Styling**: Tailwind CSS v4.1.16
- **Backend**: Convex 1.29.3
- **Authentication**: Clerk 6.34.0
- **AI**: AI SDK 5.x with Groq integration
- **Testing**: Jest 30.2.0 + Playwright 1.56.1
- **Type Safety**: TypeScript 5.6.0

### 2.2 Dependency Categories

#### Runtime Dependencies (62 packages)
- **AI/ML**: `@ai-sdk/*`, `ai`, streaming tools
- **Authentication**: `@clerk/nextjs`, `@clerk/themes`
- **UI Components**: Multiple `@radix-ui/*` packages, `lucide-react`, `framer-motion`
- **Forms**: `react-hook-form`, `@hookform/resolvers`
- **Data**: `@tanstack/react-query`, `@tanstack/react-table`, `recharts`
- **Styling**: `@tailwindcss/postcss`, `tailwind-merge`, `tailwindcss-animate`, `class-variance-authority`
- **Utilities**: `date-fns`, `zod`, `uuid`, `clsx`, `cmdk`
- **Internationalization**: `next-intl`
- **Security**: `jose`, `speakeasy`, `qrcode` (for TOTP/MFA)
- **Markdown**: `markdown-it`, `markdown-it-attrs`, `streamdown`
- **Backend**: `convex`, `svix` (webhooks)
- **Device Detection**: `ua-parser-js`
- **Monitoring**: `web-vitals`
- **Configuration**: `dotenv`, `yaml`

#### Dev Dependencies (30 packages)
- **Build Tools**: `@next/bundle-analyzer`, `autoprefixer`, `tsx`
- **Linting**: `eslint*`, `prettier*`, Multiple ESLint plugins
- **Testing**: `@playwright/test`, `@testing-library/*`, `jest*`
- **Type Definitions**: `@types/*` for various packages
- **API Tools**: `openapi-typescript`, `swagger-typescript-api`
- **Utilities**: `js-yaml`, `web-streams-polyfill`

### 2.3 Critical Files Using Dependencies

**Build Configuration:**
- `next.config.js` - Uses `@next/bundle-analyzer`, `next-intl/plugin`
- `tailwind.config.js` - Uses `tailwindcss`, `tailwindcss-animate`
- `jest.config.js` - Uses `next/jest`
- `playwright.config.ts` - Uses `@playwright/test`
- `postcss.config.js` - Uses `@tailwindcss/postcss`, `autoprefixer`
- `tsconfig.json` - Type checking configuration
- `eslint.config.js` - Uses multiple ESLint plugins

**Scripts Directory (16 files):**
- Uses: `dotenv`, `crypto` (Node built-in), `js-yaml`, file system utilities
- Most scripts use only Node.js built-ins and few external packages

**Application Code:**
- `src/app/*` - Next.js App Router pages and API routes
- `src/components/*` - React components using Radix UI, Framer Motion
- `src/lib/*` - Utilities and business logic
- `convex/*` - Backend functions

---

## 3. Tools and Methodology

### 3.1 Analysis Tools

#### 3.1.1 Primary Tool: depcheck
```bash
npm install -g depcheck
depcheck --json > depcheck-report.json
```

**What it detects:**
- ✅ Unused dependencies
- ✅ Missing dependencies (imported but not in package.json)
- ✅ Dependencies used only in specific configurations
- ⚠️ May have false positives for:
  - Webpack loaders
  - Babel plugins
  - Type definitions
  - Peer dependencies

**Configuration:**
Create `~/.depcheckrc` or `.depcheckrc` in project root:
```json
{
  "ignores": [
    "@types/*",
    "eslint-*",
    "prettier-*"
  ],
  "skip-missing": false
}
```

#### 3.1.2 Secondary Tool: npm-check
```bash
npm install -g npm-check
npm-check --skip-unused
```

**What it provides:**
- Interactive UI for reviewing packages
- Shows package descriptions
- Identifies outdated packages (useful for future tasks)

#### 3.1.3 Manual Analysis Tools

**Find all imports in codebase:**
```bash
# Find all import statements
rg "^import .* from ['\"](.+)['\"]" --no-heading --no-line-number -r '$1' \
  src/ convex/ scripts/ __tests__/ e2e/ | sort -u > imports.txt

# Find all require statements
rg "require\(['\"](.+)['\"]\)" --no-heading --no-line-number -r '$1' \
  src/ convex/ scripts/ __tests__/ e2e/ | sort -u >> imports.txt
```

**Check package usage:**
```bash
# Check if a specific package is used
rg "from ['\"]package-name['\"]" src/ convex/ scripts/
rg "require\(['\"]package-name['\"]\)" src/ convex/ scripts/
```

**Verify configuration usage:**
```bash
# Check usage in config files
cat next.config.js tailwind.config.js jest.config.js \
  playwright.config.ts eslint.config.js postcss.config.js | \
  rg "require|import"
```

#### 3.1.4 NPM Built-in Commands

**Check dependency tree:**
```bash
npm ls --all --json > dependency-tree.json
npm ls <package-name>  # Check if package is a transitive dependency
```

**Check for duplicate packages:**
```bash
npm dedupe --dry-run
```

### 3.2 Analysis Methodology

#### Phase 1: Automated Scanning
1. Run `depcheck` to get initial unused list
2. Run `npm ls --all` to understand dependency tree
3. Generate import list from codebase
4. Cross-reference depcheck results with actual imports

#### Phase 2: Manual Verification
For each package flagged as unused:
1. Search for direct imports in codebase
2. Check configuration files (webpack, babel, postcss, etc.)
3. Check if it's a peer dependency requirement
4. Check if it's used in package.json scripts
5. Check if it's a type definition with no import but needed for compilation
6. Verify it's not a transitive dependency that should be explicit

#### Phase 3: Categorization
Categorize findings into:
- ✅ **Safe to Remove**: No usage found anywhere
- ⚠️ **Verify First**: Found in configs or edge cases
- ❌ **Keep**: Required but not directly imported (types, tooling, etc.)
- 🔄 **Redundant**: Transitive dependency that can be removed

---

## 4. Dependency Analysis Approach

### 4.1 Safe-to-Remove Checklist

Before marking a package as safe to remove, verify it is NOT used in:

#### 4.1.1 Application Code
- [ ] Direct imports in `src/**/*.{ts,tsx,js,jsx}`
- [ ] Dynamic imports or lazy loading
- [ ] String-based requires (e.g., `require(variableName)`)

#### 4.1.2 Backend Code
- [ ] Convex functions in `convex/**/*.{ts,js}`
- [ ] API routes in `src/app/api/**/*`
- [ ] Middleware in `middleware.ts`

#### 4.1.3 Testing Code
- [ ] Test files in `__tests__/**/*.test.{ts,tsx}`
- [ ] E2E tests in `e2e/**/*.spec.{ts,tsx}`
- [ ] Test setup files (`jest.setup.js`, `__tests__/setup.ts`)
- [ ] Test mocks in `__tests__/__mocks__/**`

#### 4.1.4 Build Configuration
- [ ] `next.config.js` - Next.js plugins and configuration
- [ ] `tailwind.config.js` - Tailwind plugins
- [ ] `postcss.config.js` - PostCSS plugins
- [ ] `jest.config.js` - Jest transformers and setup
- [ ] `playwright.config.ts` - Playwright configuration
- [ ] `eslint.config.js` - ESLint plugins and parsers
- [ ] `tsconfig.json` - TypeScript compiler options

#### 4.1.5 Scripts
- [ ] `scripts/**/*.{js,mjs,cjs}` - Setup and utility scripts
- [ ] `package.json` scripts - Command-line tools used in npm scripts

#### 4.1.6 Type Definitions
- [ ] `@types/*` packages - May be needed even without explicit imports
- [ ] Check if TypeScript compilation fails without them

#### 4.1.7 Peer Dependencies
- [ ] Check package's peerDependencies in `node_modules/[package]/package.json`
- [ ] Some packages require peer dependencies even if not imported

#### 4.1.8 Implicit Dependencies
- [ ] Babel presets/plugins (if using custom Babel config)
- [ ] Webpack loaders (if using custom webpack config)
- [ ] PostCSS plugins
- [ ] Prettier plugins
- [ ] ESLint plugins and configs

### 4.2 Special Package Categories

#### 4.2.1 Next.js Ecosystem - KEEP
These packages are integral to Next.js and should NOT be removed:
- `next` - Framework
- `react`, `react-dom` - UI library
- `@next/*` packages - Next.js plugins and tools
- Any package imported in `next.config.js`

#### 4.2.2 Tailwind CSS Ecosystem - KEEP
Required for styling system:
- `tailwindcss` - Core framework
- `@tailwindcss/postcss` - PostCSS integration
- `autoprefixer` - Browser compatibility
- `tailwindcss-animate` - Animation utilities (explicitly configured)
- `tailwind-merge` - Runtime utility (used in code)
- `class-variance-authority` - Component variants (used in code)
- `prettier-plugin-tailwindcss` - Code formatting

#### 4.2.3 Testing Infrastructure - KEEP
Required for test suite:
- `jest`, `jest-environment-jsdom` - Test runner
- `@testing-library/*` - React testing utilities
- `@playwright/test` - E2E testing framework
- `@types/jest` - Type definitions
- Any packages in `jest.setup.js` or test setup files

#### 4.2.4 TypeScript & Linting - KEEP
Required for type safety and code quality:
- `typescript` - Type checker
- `@types/*` - Type definitions
- `eslint` and all configured plugins
- `prettier` and configured plugins
- All packages referenced in `eslint.config.js`

#### 4.2.5 Build Tools - KEEP
Required for build process:
- `@next/bundle-analyzer` - Bundle analysis (used in npm scripts)
- `autoprefixer` - CSS processing
- `tsx` - TypeScript execution
- `openapi-typescript` - API type generation (used in npm script)

#### 4.2.6 Authentication & Security - VERIFY CAREFULLY
- `@clerk/nextjs`, `@clerk/themes` - Authentication (critical)
- `jose` - JWT handling
- `speakeasy`, `qrcode` - TOTP/MFA (check if still used)
- `svix` - Webhook verification (critical for Clerk webhooks)

#### 4.2.7 Radix UI Components - VERIFY
Check each `@radix-ui/react-*` package:
- Search for imports: `rg "@radix-ui/react-dialog" src/`
- These are used by shadcn/ui components
- Only remove if corresponding component is not used

### 4.3 High-Risk Packages (May Appear Unused But Are Critical)

#### 4.3.1 Type Definitions
**Why they appear unused:**
- Not directly imported in code
- TypeScript uses them implicitly

**Examples:**
- `@types/node` - Provides Node.js globals
- `@types/react` - React type augmentation
- `@types/jest` - Jest globals in tests

**Verification:**
```bash
# Remove package and run type check
npm uninstall @types/node
npx tsc --noEmit  # Will likely fail
npm install @types/node  # Restore
```

#### 4.3.2 PostCSS Plugins
**Why they appear unused:**
- Loaded via configuration files
- Not directly imported

**Examples:**
- `autoprefixer` - Used in `postcss.config.js`
- `@tailwindcss/postcss` - Tailwind PostCSS plugin

**Verification:**
Check `postcss.config.js` for plugin usage.

#### 4.3.3 ESLint/Prettier Plugins
**Why they appear unused:**
- Loaded via configuration
- String-based requires

**Examples:**
- `eslint-config-next` - Extends ESLint config
- `prettier-plugin-tailwindcss` - Sorts Tailwind classes

**Verification:**
Check `eslint.config.js` and `.prettierrc` for plugin references.

#### 4.3.4 Test Environment Packages
**Why they appear unused:**
- Only loaded during test execution
- Configured in setup files

**Examples:**
- `jest-environment-jsdom` - Provides DOM in tests
- `web-streams-polyfill` - Polyfill for streaming tests

**Verification:**
Check `jest.config.js` and `jest.setup.js`.

---

## 5. Safe Removal Process

### 5.1 Pre-Removal Steps

#### 5.1.1 Create Backup
```bash
# Backup current state
cp package.json package.json.backup
cp package-lock.json package-lock.json.backup
git add -A
git commit -m "chore: backup before dependency cleanup"
```

#### 5.1.2 Create Analysis Document
Create `dependency-cleanup-report.md`:
```markdown
# Dependency Cleanup Report

## Date: [Current Date]

## Initial State
- Total dependencies: 62
- Total devDependencies: 30
- node_modules size: [Run: du -sh node_modules]

## Packages Analyzed
[List all packages analyzed]

## Packages to Remove
[List with justification for each]

## Packages to Keep (appeared unused but confirmed necessary)
[List with explanation]

## Verification Results
[Test results after removal]
```

### 5.2 Removal Strategy

#### 5.2.1 Batch Removal Approach
**Recommended**: Remove packages in small, related batches

**Batch Categories:**
1. **Batch 1**: Obvious unused UI packages (1-3 packages)
2. **Batch 2**: Unused utility packages (1-3 packages)
3. **Batch 3**: Redundant type definitions (1-3 packages)
4. **Batch 4**: Legacy/deprecated packages (1-3 packages)

**After each batch:**
- Run full test suite
- Verify build succeeds
- Check application functionality

#### 5.2.2 Individual Removal Commands
```bash
# Remove a runtime dependency
npm uninstall package-name

# Remove a dev dependency
npm uninstall --save-dev package-name

# Remove multiple packages at once
npm uninstall package1 package2 package3
```

### 5.3 Post-Removal Verification

#### 5.3.1 Immediate Verification (After Each Removal)
```bash
# 1. Clean install
rm -rf node_modules package-lock.json
npm install

# 2. Type check
npx tsc --noEmit

# 3. Lint check
npm run lint

# 4. Build check
npm run build
```

**Expected Results:**
- ✅ No TypeScript errors
- ✅ No linting errors
- ✅ Build completes successfully
- ✅ No missing module errors

If any errors occur:
1. Read error message carefully
2. Identify the missing package
3. Reinstall if it was incorrectly removed
4. Document why it's needed in the analysis report

#### 5.3.2 Comprehensive Verification (After Batch or Final)
```bash
# 1. Run full QA suite
npm run qa:full

# This includes:
# - API type generation
# - Linting
# - TypeScript compilation
# - Unit tests with coverage
# - E2E tests (Playwright)
```

**Expected Results:**
- ✅ All tests pass (1,528+ tests)
- ✅ Coverage thresholds met (70% minimum)
- ✅ No E2E failures
- ✅ All builds complete successfully

#### 5.3.3 Manual Testing Checklist
After cleanup, manually verify critical features:

**Authentication Flow:**
- [ ] Sign up new user
- [ ] Log in existing user
- [ ] Log out

**Chat Functionality:**
- [ ] Create new session
- [ ] Send messages
- [ ] Receive AI responses
- [ ] Switch between sessions

**UI Components:**
- [ ] All dialogs open/close
- [ ] Dropdowns work
- [ ] Forms validate and submit
- [ ] Buttons respond to clicks

**Styling:**
- [ ] Dark mode applies correctly
- [ ] Responsive design works on mobile/tablet
- [ ] Animations play smoothly
- [ ] No missing styles

### 5.4 Rollback Procedure

If issues are discovered:

```bash
# Quick rollback to previous state
git checkout package.json package-lock.json
npm install

# Or restore from backup
cp package.json.backup package.json
cp package-lock.json.backup package-lock.json
npm install

# Full rollback if committed
git revert HEAD
npm install
```

---

## 6. Categories to Analyze

### 6.1 UI Component Libraries

#### 6.1.1 Radix UI Packages
**Total Radix packages (11):**
```
@radix-ui/react-dialog
@radix-ui/react-dropdown-menu
@radix-ui/react-label
@radix-ui/react-popover
@radix-ui/react-progress
@radix-ui/react-scroll-area
@radix-ui/react-select
@radix-ui/react-separator
@radix-ui/react-slider
@radix-ui/react-slot
@radix-ui/react-switch
@radix-ui/react-tabs
```

**Analysis Method:**
```bash
# Check each package usage
for pkg in dialog dropdown-menu label popover progress scroll-area \
           select separator slider slot switch tabs; do
  echo "=== @radix-ui/react-$pkg ==="
  rg "@radix-ui/react-$pkg" src/
done
```

**Decision Criteria:**
- ✅ Keep if imported in any component
- ❌ Remove if no imports found
- Note: These are used by shadcn/ui components, so check component usage

#### 6.1.2 Animation & Motion
```
framer-motion
```

**Analysis:**
- Search for `motion.` components or `AnimatePresence`
- Check for `import { motion } from "framer-motion"`
- Used for smooth animations and transitions

#### 6.1.3 Icons
```
lucide-react
```

**Analysis:**
- Search for icon imports: `rg "from ['\"]lucide-react['\"]"`
- Likely heavily used throughout UI
- Keep unless moving to different icon library

### 6.2 Form & Validation Libraries

```
react-hook-form
@hookform/resolvers
zod
```

**Analysis:**
- Check for `useForm` hook usage
- Check for Zod schemas: `z.object`, `z.string`
- These work together: react-hook-form + zod + @hookform/resolvers

**Decision:**
- Keep all three if forms use Zod validation
- Remove @hookform/resolvers only if not using Zod validation

### 6.3 Data Fetching & State

```
@tanstack/react-query
@tanstack/react-query-devtools
@tanstack/react-table
```

**Analysis:**
- `react-query`: Search for `useQuery`, `useMutation`, `QueryClient`
- `react-query-devtools`: Dev tool, can remove if not used (but small)
- `react-table`: Search for `useReactTable`, `flexRender`

**Decision:**
- Keep react-query (likely core to data fetching)
- Remove devtools if `ReactQueryDevtools` component not used
- Remove react-table if no table implementations

### 6.4 Charts & Visualization

```
recharts
```

**Analysis:**
- Search for chart imports: `LineChart`, `BarChart`, `PieChart`
- Check if reports or analytics use charts

**Decision:**
- Keep if any data visualization exists
- Remove if no chart components used

### 6.5 Markdown & Content

```
markdown-it
markdown-it-attrs
streamdown
```

**Analysis:**
- Check for markdown rendering in chat messages
- Check for content rendering features

**Decision:**
- Keep if AI responses include formatted content
- All three likely work together for markdown rendering

### 6.6 Date Handling

```
date-fns
react-day-picker
```

**Analysis:**
- `date-fns`: Search for imports like `format`, `parseISO`, `differenceInDays`
- `react-day-picker`: Search for date picker components

**Decision:**
- Keep date-fns if any date formatting exists
- Remove react-day-picker if no calendar/date picker UI

### 6.7 Utilities

```
clsx
cmdk
class-variance-authority
tailwind-merge
uuid
```

**Analysis:**
- `clsx`: Conditional classNames - likely used everywhere
- `cmdk`: Command menu component (Cmd+K interface)
- `class-variance-authority`: Component variants - likely used in UI system
- `tailwind-merge`: Merging Tailwind classes - likely in `cn()` utility
- `uuid`: Generating unique IDs

**Verification:**
```bash
rg "\\bclsx\\b|\\bcn\\b" src/
rg "cmdk|CommandMenu" src/
rg "\\bcva\\b|VariantProps" src/
rg "tailwind-merge|\\btwMerge" src/
rg "\\buuid\\b|uuidv4" src/
```

### 6.8 Authentication & Security

```
@clerk/nextjs
@clerk/themes
jose
speakeasy
qrcode
svix
```

**Analysis - HIGH PRIORITY (Security-critical):**
- `@clerk/*`: Core authentication - DO NOT REMOVE
- `jose`: JWT handling - likely critical for auth
- `speakeasy` + `qrcode`: TOTP/MFA implementation
- `svix`: Webhook signature verification

**Verification:**
```bash
# Check TOTP usage
rg "speakeasy|totp" src/ convex/

# Check QR code generation
rg "qrcode|QRCode" src/

# Check webhook verification
rg "svix|Webhook" src/ convex/
```

**Decision:**
- ❌ NEVER remove Clerk packages
- ❌ NEVER remove svix (required for webhook security)
- ⚠️ Only remove speakeasy/qrcode if TOTP feature was removed
- ⚠️ Only remove jose if not used for custom JWT handling

### 6.9 AI & Streaming

```
@ai-sdk/groq
@ai-sdk/react
@ai-sdk/rsc
ai
```

**Analysis:**
- Core to AI functionality - DO NOT REMOVE
- Verify all packages are used for different purposes:
  - `@ai-sdk/groq`: Groq provider
  - `@ai-sdk/react`: React hooks (`useChat`)
  - `@ai-sdk/rsc`: React Server Components integration
  - `ai`: Core AI SDK

### 6.10 Type Definitions (DevDependencies)

```
@types/jest
@types/markdown-it
@types/node
@types/qrcode
@types/react
@types/react-dom
@types/speakeasy
@types/ua-parser-js
@types/uuid
```

**Analysis:**
- Keep ALL `@types/*` packages that correspond to runtime dependencies
- Remove only if the runtime package was also removed

**Verification Method:**
```bash
# For each @types package, check if runtime version exists
npm ls @types/jest    # If jest is installed, keep
npm ls @types/uuid    # If uuid is installed, keep
```

### 6.11 Build & Tooling (DevDependencies)

```
@next/bundle-analyzer
autoprefixer
tsx
openapi-typescript
swagger-typescript-api
```

**Analysis:**
- `@next/bundle-analyzer`: Used in package.json scripts - KEEP
- `autoprefixer`: Used in postcss.config.js - KEEP
- `tsx`: TypeScript execution - check if used anywhere
- `openapi-typescript`: Used in `npm run api:types` - KEEP
- `swagger-typescript-api`: Check if used or alternative to openapi-typescript

**Decision:**
- Keep all actively used in scripts or configs
- Remove tsx if not used in any scripts
- Remove swagger-typescript-api if openapi-typescript is sufficient

### 6.12 Testing (DevDependencies)

```
@playwright/test
@testing-library/dom
@testing-library/jest-dom
@testing-library/react
@testing-library/user-event
jest
jest-environment-jsdom
web-streams-polyfill
```

**Analysis:**
- ALL testing packages should be kept
- These work together as an ecosystem

**Decision:**
- ❌ DO NOT REMOVE any testing packages
- All are critical for test suite

### 6.13 Linting & Formatting (DevDependencies)

```
@eslint/eslintrc
eslint
eslint-config-next
eslint-config-prettier
eslint-plugin-react-perf
eslint-plugin-unicorn
@typescript-eslint/eslint-plugin
@typescript-eslint/parser
typescript-eslint
prettier
prettier-plugin-tailwindcss
```

**Analysis:**
- Check `eslint.config.js` for all plugin references
- All referenced plugins must be kept

**Verification:**
```bash
# Check eslint config
cat eslint.config.js | rg "eslint-"
```

**Decision:**
- Keep all plugins referenced in config
- Remove only if plugin is not in extends/plugins array

### 6.14 Utility Scripts

```
js-yaml
dotenv
```

**Analysis:**
- Check `scripts/` directory for usage
- `dotenv`: Likely used for loading .env files
- `js-yaml`: Check if any YAML processing in scripts

**Verification:**
```bash
rg "require\\(['\"]js-yaml['\"\\)]|from ['\"]js-yaml['\"]" scripts/
rg "require\\(['\"]dotenv['\"\\)]|from ['\"]dotenv['\"]" scripts/
```

### 6.15 Backend/Convex

```
convex
```

**Analysis:**
- Core backend infrastructure - DO NOT REMOVE

### 6.16 Device & Analytics

```
ua-parser-js
web-vitals
```

**Analysis:**
- `ua-parser-js`: User agent parsing for device detection
- `web-vitals`: Performance monitoring

**Verification:**
```bash
rg "ua-parser-js|UAParser" src/ convex/
rg "web-vitals|getCLS|getFID" src/
```

**Decision:**
- Keep if monitoring/analytics are active
- Remove only if features were removed

### 6.17 Internationalization

```
next-intl
```

**Analysis:**
- Check for i18n usage in app
- Check for `useTranslations` hook
- Check `src/i18n/` directory

**Decision:**
- Keep if multi-language support is active
- Likely core feature - DO NOT REMOVE

### 6.18 Miscellaneous

```
dotenv
yaml
sonner
```

**Analysis:**
- `dotenv`: Loading environment variables
- `yaml`: YAML parsing (check API schema files)
- `sonner`: Toast notifications

**Verification:**
```bash
rg "sonner|toast" src/
rg "yaml.parse|YAML" src/ scripts/
```

---

## 7. Verification and Testing Strategy

### 7.1 Verification Stages

#### Stage 1: Pre-Cleanup Baseline
Establish working baseline before any changes:

```bash
# Record baseline metrics
echo "=== Baseline Metrics ===" > cleanup-metrics.txt
echo "Date: $(date)" >> cleanup-metrics.txt
echo "node_modules size: $(du -sh node_modules | cut -f1)" >> cleanup-metrics.txt
echo "Total packages: $(cat package.json | jq '[.dependencies, .devDependencies] | add | length')" >> cleanup-metrics.txt

# Run full test suite
npm run qa:full 2>&1 | tee baseline-test-results.txt

# Record test counts
echo "Test results: PASS/FAIL" >> cleanup-metrics.txt
```

**Acceptance Criteria:**
- ✅ All tests pass
- ✅ Build completes successfully
- ✅ No console errors
- ✅ Application loads and functions

#### Stage 2: Incremental Verification (After Each Removal)
After removing each package or small batch:

```bash
# Quick verification cycle (~2-5 minutes)
npm install
npm run lint
npx tsc --noEmit
npm run build
npm test
```

**Fast Feedback Loop:**
- If any step fails → investigate immediately
- Check error messages for missing packages
- Restore package if incorrectly removed
- Document why package is needed

#### Stage 3: Batch Verification (After Each Category)
After completing a category (e.g., all UI components reviewed):

```bash
# Medium verification cycle (~10-15 minutes)
rm -rf node_modules package-lock.json
npm install
npm run qa:smoke  # Faster than full QA
```

**Checks:**
- ✅ Clean install works
- ✅ No peer dependency warnings
- ✅ All quick tests pass
- ✅ Application still builds

#### Stage 4: Full Verification (After All Cleanup)
Final comprehensive check:

```bash
# Full verification cycle (~20-30 minutes)
rm -rf node_modules package-lock.json .next
npm install
npm run qa:full
```

**Comprehensive Checks:**
- ✅ All 1,528+ tests pass
- ✅ Coverage thresholds met
- ✅ E2E tests pass in all browsers
- ✅ Production build succeeds
- ✅ Bundle analysis shows size reduction

### 7.2 Testing Commands

#### 7.2.1 Quick Tests (2-5 min)
```bash
npm run lint              # ESLint check
npx tsc --noEmit          # Type check
npm test -- --testPathPattern=lib  # Fast unit tests
```

#### 7.2.2 Smoke Tests (10 min)
```bash
npm run qa:smoke
# Includes: api:types, lint, tsc, test
```

#### 7.2.3 Full QA (20-30 min)
```bash
npm run qa:full
# Includes: smoke + coverage + e2e tests
```

#### 7.2.4 Individual Test Suites
```bash
# Unit tests only
npm test

# Unit tests with coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# E2E with UI (manual verification)
npm run test:e2e:ui

# Build verification
npm run build
npm run start  # Then test manually
```

### 7.3 Test Coverage Requirements

#### Minimum Coverage Thresholds (from jest.config.js)
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

**Verification:**
```bash
npm run test:coverage
# Check coverage summary in output
# Must meet all thresholds
```

### 7.4 Critical User Journeys to Verify

#### Journey 1: Authentication
1. Navigate to app
2. Click "Sign Up"
3. Complete registration
4. Verify redirect to app
5. Log out
6. Log in with same credentials

**Verification:**
```bash
npm run test:e2e -- --grep "authentication"
```

#### Journey 2: Chat Session
1. Log in to app
2. Create new chat session
3. Send a message
4. Verify AI response appears
5. Send follow-up message
6. Switch to different session
7. Return to original session

**Verification:**
```bash
npm run test:e2e -- --grep "chat"
```

#### Journey 3: Session Management
1. Create multiple sessions
2. Switch between sessions
3. Verify session state persists
4. Delete a session
5. Verify deletion

**Verification:**
- Manual testing or E2E suite

### 7.5 Performance Verification

#### Bundle Size Analysis
```bash
# Generate bundle analysis
npm run analyze

# Or for specific bundles
npm run analyze:server
npm run analyze:browser
```

**Check for:**
- Reduced bundle sizes after cleanup
- No unexpected large dependencies
- Improved load times

#### Installation Time
```bash
# Before cleanup
time npm install  # Record time

# After cleanup
rm -rf node_modules package-lock.json
time npm install  # Compare time
```

**Expected Improvement:**
- Faster installation (10-30% depending on packages removed)
- Smaller node_modules directory

#### Metrics to Track
Document in `cleanup-metrics.txt`:
```
=== Before Cleanup ===
node_modules size: [size]
Total packages: [count]
Install time: [seconds]
Bundle size: [size]

=== After Cleanup ===
node_modules size: [size]
Total packages: [count]
Install time: [seconds]
Bundle size: [size]

=== Improvements ===
Packages removed: [count]
Size reduction: [%]
Install time improvement: [%]
```

---

## 8. Risk Mitigation

### 8.1 Risk Categories

#### 8.1.1 HIGH RISK: Breaking Production
**Symptoms:**
- Application fails to build
- Runtime errors in production
- Missing features or functionality

**Mitigation:**
1. Never remove packages in production first
2. Test thoroughly in development environment
3. Use staging environment for final verification
4. Deploy during low-traffic period
5. Have rollback plan ready

**Recovery:**
```bash
# Quick rollback
git revert HEAD
npm install
npm run build
```

#### 8.1.2 MEDIUM RISK: Breaking Tests
**Symptoms:**
- Tests fail after package removal
- Missing test utilities
- Type errors in test files

**Mitigation:**
1. Run tests after each removal
2. Keep all testing infrastructure packages
3. Don't remove packages referenced in test setup files
4. Verify both unit and E2E tests

**Recovery:**
```bash
# Restore package
npm install <package-name>
# Or restore package.json
git checkout package.json
npm install
```

#### 8.1.3 MEDIUM RISK: Type Errors
**Symptoms:**
- TypeScript compilation fails
- Missing type definitions
- IDE shows type errors

**Mitigation:**
1. Run `npx tsc --noEmit` after each removal
2. Keep all `@types/*` packages for dependencies in use
3. Check if implicit types are used (Node.js globals, etc.)

**Recovery:**
```bash
# Restore type definitions
npm install --save-dev @types/<package>
```

#### 8.1.4 LOW RISK: Development Experience
**Symptoms:**
- Missing dev tools
- Slower development workflow
- IDE features broken

**Mitigation:**
1. Keep all devDependencies used in npm scripts
2. Keep linting and formatting tools
3. Keep development utilities (bundle analyzer, etc.)

### 8.2 Common Pitfalls

#### Pitfall 1: Removing Implicitly Used Packages
**Example:** Removing `@types/node` because it's not imported

**Why it fails:**
- TypeScript uses it for Node.js globals (`process`, `Buffer`, etc.)
- Not directly imported but essential for compilation

**Solution:**
- Always run `npx tsc --noEmit` after removing type packages
- Understand that some packages work implicitly

#### Pitfall 2: Removing Peer Dependencies
**Example:** Removing `react-dom` because it's "only used by React"

**Why it fails:**
- Many packages list peer dependencies they expect to be installed
- Package won't work without its peers

**Solution:**
- Check `peerDependencies` field: `cat node_modules/<pkg>/package.json | jq .peerDependencies`
- Keep packages listed as peer dependencies

#### Pitfall 3: Removing Config-Loaded Packages
**Example:** Removing `autoprefixer` because it's not imported in code

**Why it fails:**
- PostCSS loads it from config file
- String-based loading not detected by static analysis

**Solution:**
- Manually check all config files for plugin references
- Search for package name in all `.config.*` files

#### Pitfall 4: Removing Transitive Dependencies
**Example:** Explicitly installing a package that's already a transitive dependency

**Why it's a problem:**
- It might not be unused, just pulled in by another package
- If that package is removed, your code breaks

**Solution:**
- Run `npm ls <package>` to see dependency tree
- Only remove if it's truly a top-level unused dependency

#### Pitfall 5: Removing CLI Tools Used in Scripts
**Example:** Removing `tsx` that's used in a package.json script

**Why it fails:**
- Script execution fails with "command not found"
- May only fail in specific scenarios (CI, deployment, etc.)

**Solution:**
- Check all scripts in `package.json` for tool usage
- Test running each script after cleanup

### 8.3 Safety Protocols

#### Protocol 1: One-at-a-Time Removal
**When to use:** First-time cleanup or uncertain packages

**Process:**
1. Remove single package
2. Run verification
3. If pass → commit and continue
4. If fail → restore and document

**Pros:**
- Easy to identify which package caused issue
- Minimal risk of cascading failures

**Cons:**
- Time-consuming
- Many commits

#### Protocol 2: Batch Removal
**When to use:** Confident about removals, packages are independent

**Process:**
1. Remove 3-5 related packages
2. Run verification
3. If pass → commit and continue
4. If fail → restore batch and try one-at-a-time

**Pros:**
- Faster overall process
- Fewer commits

**Cons:**
- Harder to identify problem package
- Risk of cascading failures

#### Protocol 3: Progressive Testing
**When to use:** After any removal (either protocol)

**Levels:**
```
1. Type Check (10 sec) ← Fast feedback
2. Lint (20 sec)
3. Build (60 sec)
4. Unit Tests (2 min)
5. E2E Tests (15 min) ← Comprehensive but slow
```

**Strategy:**
- Run levels 1-3 after each removal
- Run level 4 after each batch
- Run level 5 before committing cleanup

### 8.4 Rollback Strategies

#### Strategy 1: Git Revert (Recommended)
```bash
# If already committed
git log --oneline -5  # Find commit hash
git revert <commit-hash>
npm install
```

**When to use:**
- Changes already committed
- Need to preserve history
- Working with team

#### Strategy 2: Git Reset
```bash
# If not yet pushed to remote
git reset --hard HEAD~1
npm install
```

**When to use:**
- Local changes only
- Want to completely undo commit
- Solo development

#### Strategy 3: Restore from Backup
```bash
# Using backup files
cp package.json.backup package.json
cp package-lock.json.backup package-lock.json
npm install
```

**When to use:**
- Multiple commits need reverting
- Want to restart cleanup
- Emergency recovery

#### Strategy 4: Cherry-Pick Packages
```bash
# Restore specific package without full rollback
npm install <package-name>
# Or with specific version
npm install <package-name>@<version>
```

**When to use:**
- Most cleanup is good, one package needs restoring
- Want to keep progress
- Identified specific missing package

### 8.5 Validation Checklist

Before declaring cleanup complete, verify:

#### Build & Runtime
- [ ] `npm install` completes without errors
- [ ] No peer dependency warnings
- [ ] `npm run build` succeeds
- [ ] `npm run start` launches app
- [ ] App loads in browser without console errors

#### Type Safety
- [ ] `npx tsc --noEmit` passes
- [ ] IDE shows no type errors
- [ ] All `@types/*` packages for runtime deps are present

#### Code Quality
- [ ] `npm run lint` passes
- [ ] `npm run format:check` passes
- [ ] No import errors in any file

#### Testing
- [ ] `npm test` passes all unit tests
- [ ] `npm run test:coverage` meets thresholds
- [ ] `npm run test:e2e` passes all E2E tests
- [ ] No flaky test failures

#### Functionality
- [ ] Authentication works (login/logout)
- [ ] Chat sessions work (create/send/receive)
- [ ] UI components render correctly
- [ ] Forms validate and submit
- [ ] Navigation works
- [ ] API routes respond correctly

#### Performance
- [ ] Bundle size reduced (or not significantly increased)
- [ ] Page load times acceptable
- [ ] No new performance warnings

#### Documentation
- [ ] Cleanup report completed
- [ ] Metrics documented
- [ ] Removed packages listed with justification
- [ ] Commit message describes changes

---

## 9. Success Criteria

### 9.1 Quantitative Metrics

#### Primary Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Unused packages removed | ≥ 5 packages | Count in package.json diff |
| node_modules size reduction | ≥ 10% | `du -sh node_modules` before/after |
| Installation time improvement | ≥ 10% | `time npm install` before/after |
| Test pass rate | 100% | All tests passing |
| Build success | 100% | Production build completes |

#### Secondary Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Bundle size reduction | ≥ 5% | Bundle analyzer comparison |
| Zero peer dependency warnings | 0 warnings | `npm install` output |
| Security vulnerabilities reduced | ≥ 0 | `npm audit` comparison |
| Type coverage maintained | 100% | No new `any` types |

### 9.2 Qualitative Criteria

#### Must Have (Hard Requirements)
- ✅ All existing tests pass
- ✅ Application builds successfully
- ✅ No runtime errors in development
- ✅ No runtime errors in production build
- ✅ All critical features work:
  - Authentication
  - Chat functionality
  - Session management
  - UI components
  - Forms and validation

#### Should Have (Soft Requirements)
- ✅ Development experience maintained or improved
- ✅ No new linting errors
- ✅ Documentation updated
- ✅ Cleanup rationale documented
- ✅ Team members can understand changes

#### Nice to Have (Bonus)
- ✅ Improved installation speed
- ✅ Reduced bundle sizes
- ✅ Fewer security vulnerabilities
- ✅ Cleaner dependency tree
- ✅ Identified redundant dependencies

### 9.3 Acceptance Tests

#### Test 1: Clean Installation
```bash
rm -rf node_modules package-lock.json
npm install
```
**Pass Criteria:**
- ✅ Installation completes without errors
- ✅ No peer dependency warnings
- ✅ No missing dependency errors

#### Test 2: Full Build
```bash
npm run build
```
**Pass Criteria:**
- ✅ Build completes successfully
- ✅ No TypeScript errors
- ✅ No missing module errors
- ✅ Generated `.next` directory is valid

#### Test 3: Full Test Suite
```bash
npm run qa:full
```
**Pass Criteria:**
- ✅ All unit tests pass (100%)
- ✅ Coverage thresholds met (≥70%)
- ✅ All E2E tests pass
- ✅ No test failures

#### Test 4: Development Server
```bash
npm run dev
```
**Pass Criteria:**
- ✅ Server starts without errors
- ✅ Application loads in browser
- ✅ No console errors
- ✅ Hot reload works

#### Test 5: Production Server
```bash
npm run build && npm run start
```
**Pass Criteria:**
- ✅ Build succeeds
- ✅ Server starts
- ✅ Application loads
- ✅ All features functional

### 9.4 Sign-off Checklist

Before marking task as complete:

#### Technical Sign-off
- [ ] All acceptance tests pass
- [ ] Metrics documented and targets met
- [ ] No regressions identified
- [ ] Code review completed (if applicable)
- [ ] Changes committed with clear message

#### Documentation Sign-off
- [ ] Cleanup report completed (`dependency-cleanup-report.md`)
- [ ] Metrics recorded (`cleanup-metrics.txt`)
- [ ] Removed packages listed with justification
- [ ] Kept packages explained (if appeared unused)
- [ ] Known issues documented (if any)

#### Process Sign-off
- [ ] Backup created and preserved
- [ ] Clean git history
- [ ] No uncommitted changes
- [ ] Ready for deployment
- [ ] Rollback procedure tested (optional but recommended)

---

## 10. Implementation Checklist

### Phase 1: Preparation (1-2 hours)

#### Setup and Analysis
- [ ] 1.1. Create backup of package.json and package-lock.json
- [ ] 1.2. Commit current state to git
- [ ] 1.3. Install analysis tools:
  ```bash
  npm install -g depcheck npm-check
  ```
- [ ] 1.4. Run baseline tests and record results:
  ```bash
  npm run qa:full 2>&1 | tee baseline-test-results.txt
  ```
- [ ] 1.5. Document baseline metrics:
  ```bash
  echo "node_modules size: $(du -sh node_modules | cut -f1)" > cleanup-metrics.txt
  echo "Total packages: $(cat package.json | jq '[.dependencies, .devDependencies] | add | length')" >> cleanup-metrics.txt
  ```

#### Analysis
- [ ] 1.6. Run depcheck:
  ```bash
  depcheck --json > depcheck-report.json
  depcheck  # Human-readable output
  ```
- [ ] 1.7. Generate import list:
  ```bash
  rg "^import .* from ['\"](.+)['\"]" --no-heading -r '$1' src/ convex/ | sort -u > imports.txt
  ```
- [ ] 1.8. Review config files for implicit dependencies:
  - [ ] next.config.js
  - [ ] tailwind.config.js
  - [ ] jest.config.js
  - [ ] playwright.config.ts
  - [ ] eslint.config.js
  - [ ] postcss.config.js
- [ ] 1.9. Create `dependency-cleanup-report.md` document
- [ ] 1.10. Review package.json scripts for CLI tools

### Phase 2: Category Analysis (2-4 hours)

For each category in Section 6, complete:

#### UI Components (Radix UI, Icons, Animation)
- [ ] 2.1. Check Radix UI package usage:
  ```bash
  for pkg in dialog dropdown-menu label popover progress scroll-area select separator slider slot switch tabs; do
    echo "=== @radix-ui/react-$pkg ==="
    rg "@radix-ui/react-$pkg" src/
  done
  ```
- [ ] 2.2. Verify lucide-react usage: `rg "from ['\"]lucide-react['\"]" src/`
- [ ] 2.3. Verify framer-motion usage: `rg "motion\\.|AnimatePresence" src/`
- [ ] 2.4. Document findings in cleanup report

#### Forms & Validation
- [ ] 2.5. Check react-hook-form usage: `rg "useForm|Controller" src/`
- [ ] 2.6. Check Zod usage: `rg "z\\.object|z\\.string|ZodSchema" src/`
- [ ] 2.7. Check @hookform/resolvers: `rg "zodResolver" src/`
- [ ] 2.8. Document findings

#### Data & State Management
- [ ] 2.9. Check React Query usage: `rg "useQuery|useMutation|QueryClient" src/`
- [ ] 2.10. Check React Query Devtools: `rg "ReactQueryDevtools" src/`
- [ ] 2.11. Check React Table: `rg "useReactTable|flexRender" src/`
- [ ] 2.12. Document findings

#### Charts & Visualization
- [ ] 2.13. Check recharts usage: `rg "LineChart|BarChart|PieChart|recharts" src/`
- [ ] 2.14. Document findings

#### Markdown & Content
- [ ] 2.15. Check markdown-it usage: `rg "markdown-it" src/`
- [ ] 2.16. Check streamdown usage: `rg "streamdown" src/`
- [ ] 2.17. Document findings

#### Date Handling
- [ ] 2.18. Check date-fns usage: `rg "format|parseISO|differenceIn" src/`
- [ ] 2.19. Check react-day-picker usage: `rg "DayPicker|DatePicker" src/`
- [ ] 2.20. Document findings

#### Utilities
- [ ] 2.21. Check clsx usage: `rg "\\bclsx\\b" src/`
- [ ] 2.22. Check cmdk usage: `rg "cmdk|Command" src/`
- [ ] 2.23. Check class-variance-authority: `rg "\\bcva\\b|VariantProps" src/`
- [ ] 2.24. Check tailwind-merge: `rg "twMerge|tailwind-merge" src/`
- [ ] 2.25. Check uuid usage: `rg "\\buuid\\b|uuidv4" src/`
- [ ] 2.26. Document findings

#### Authentication & Security
- [ ] 2.27. Verify Clerk packages (DO NOT REMOVE)
- [ ] 2.28. Check jose usage: `rg "\\bjose\\b|SignJWT" src/ convex/`
- [ ] 2.29. Check speakeasy usage: `rg "speakeasy|totp" src/ convex/`
- [ ] 2.30. Check qrcode usage: `rg "qrcode|QRCode" src/`
- [ ] 2.31. Verify svix usage (DO NOT REMOVE): `rg "svix|Webhook" src/ convex/`
- [ ] 2.32. Document findings - mark critical packages

#### AI & Streaming
- [ ] 2.33. Verify all @ai-sdk packages (DO NOT REMOVE)
- [ ] 2.34. Document as critical

#### Type Definitions
- [ ] 2.35. For each @types/* package, verify runtime package exists:
  ```bash
  npm ls @types/jest && npm ls jest
  npm ls @types/uuid && npm ls uuid
  # Repeat for all @types packages
  ```
- [ ] 2.36. Document which type packages can be removed

#### Build & Tooling
- [ ] 2.37. Verify @next/bundle-analyzer in scripts: `grep "analyze" package.json`
- [ ] 2.38. Verify autoprefixer in postcss.config.js
- [ ] 2.39. Check tsx usage: `rg "tsx " scripts/ package.json`
- [ ] 2.40. Verify openapi-typescript in scripts: `grep "api:types" package.json`
- [ ] 2.41. Check swagger-typescript-api usage
- [ ] 2.42. Document findings

#### Testing Packages
- [ ] 2.43. Mark ALL testing packages as KEEP
- [ ] 2.44. Document as critical infrastructure

#### Linting & Formatting
- [ ] 2.45. Review eslint.config.js for all plugin references
- [ ] 2.46. Mark all referenced plugins as KEEP
- [ ] 2.47. Verify prettier plugins
- [ ] 2.48. Document findings

#### Backend & Monitoring
- [ ] 2.49. Verify Convex (DO NOT REMOVE)
- [ ] 2.50. Check ua-parser-js usage: `rg "ua-parser|UAParser" src/`
- [ ] 2.51. Check web-vitals usage: `rg "web-vitals|getCLS" src/`
- [ ] 2.52. Document findings

#### Internationalization
- [ ] 2.53. Verify next-intl usage (likely critical)
- [ ] 2.54. Check i18n directory exists
- [ ] 2.55. Document as likely critical

#### Miscellaneous
- [ ] 2.56. Check dotenv usage in scripts
- [ ] 2.57. Check yaml usage: `rg "yaml\\.parse|YAML" scripts/`
- [ ] 2.58. Check sonner usage: `rg "sonner|toast" src/`
- [ ] 2.59. Document findings

### Phase 3: Create Removal Plan (1 hour)

- [ ] 3.1. Compile list of packages to remove with justifications
- [ ] 3.2. Categorize by risk level (low/medium/high)
- [ ] 3.3. Create removal batches (3-5 packages per batch)
- [ ] 3.4. Order batches from lowest to highest risk
- [ ] 3.5. Review plan for safety
- [ ] 3.6. Document plan in cleanup report

### Phase 4: Execute Removals (2-6 hours, depending on quantity)

For each batch:

#### Batch Removal
- [ ] 4.1. Note batch number and packages in cleanup report
- [ ] 4.2. Remove packages:
  ```bash
  npm uninstall package1 package2 package3
  ```
- [ ] 4.3. Clean install:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

#### Quick Verification
- [ ] 4.4. Run type check: `npx tsc --noEmit`
- [ ] 4.5. Run lint: `npm run lint`
- [ ] 4.6. Run build: `npm run build`
- [ ] 4.7. Run unit tests: `npm test`

#### Handle Failures
- [ ] 4.8. If any check fails:
  - [ ] Read error message
  - [ ] Identify problem package
  - [ ] Restore package: `npm install <package>`
  - [ ] Document why package is needed
  - [ ] Re-run verification

#### Commit Progress
- [ ] 4.9. If all checks pass, commit:
  ```bash
  git add package.json package-lock.json
  git commit -m "chore: remove unused dependencies (batch N)

  Removed packages:
  - package1 - reason
  - package2 - reason
  - package3 - reason

  Verified: build ✓, tests ✓, types ✓
  
  Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>"
  ```

- [ ] 4.10. Repeat for next batch

### Phase 5: Comprehensive Verification (1-2 hours)

#### Full Test Suite
- [ ] 5.1. Clean slate:
  ```bash
  rm -rf node_modules package-lock.json .next
  npm install
  ```
- [ ] 5.2. Run full QA: `npm run qa:full`
- [ ] 5.3. Record results in cleanup report
- [ ] 5.4. If failures, investigate and fix

#### Manual Testing
- [ ] 5.5. Start development server: `npm run dev`
- [ ] 5.6. Test authentication:
  - [ ] Sign up
  - [ ] Log in
  - [ ] Log out
- [ ] 5.7. Test chat functionality:
  - [ ] Create session
  - [ ] Send message
  - [ ] Receive response
  - [ ] Switch sessions
- [ ] 5.8. Test UI components:
  - [ ] Open dialogs
  - [ ] Use dropdowns
  - [ ] Submit forms
- [ ] 5.9. Check console for errors
- [ ] 5.10. Verify styling is correct

#### Production Build
- [ ] 5.11. Build for production: `npm run build`
- [ ] 5.12. Start production server: `npm run start`
- [ ] 5.13. Test critical features in production mode
- [ ] 5.14. Check for any production-only issues

#### Performance Metrics
- [ ] 5.15. Run bundle analysis: `npm run analyze`
- [ ] 5.16. Compare bundle sizes before/after
- [ ] 5.17. Measure installation time:
  ```bash
  rm -rf node_modules
  time npm install
  ```
- [ ] 5.18. Document all metrics

### Phase 6: Documentation & Wrap-up (1 hour)

#### Complete Report
- [ ] 6.1. Fill in all sections of `dependency-cleanup-report.md`:
  - [ ] Initial state
  - [ ] Packages analyzed (all 92)
  - [ ] Packages removed (with justifications)
  - [ ] Packages kept (appeared unused but necessary)
  - [ ] Metrics comparison
  - [ ] Test results
  - [ ] Lessons learned
- [ ] 6.2. Update `cleanup-metrics.txt` with final numbers
- [ ] 6.3. Calculate improvements (%, size, time)

#### Final Commit
- [ ] 6.4. Review all changes: `git diff origin/main`
- [ ] 6.5. Ensure nothing was missed
- [ ] 6.6. Final commit (if needed):
  ```bash
  git add .
  git commit -m "docs: add dependency cleanup report"
  ```

#### Verification Checklist
- [ ] 6.7. Complete all items in Section 8.5 (Validation Checklist)
- [ ] 6.8. Complete all items in Section 9.3 (Acceptance Tests)
- [ ] 6.9. Complete all items in Section 9.4 (Sign-off Checklist)

#### Knowledge Sharing
- [ ] 6.10. Update project documentation (if needed)
- [ ] 6.11. Share cleanup report with team
- [ ] 6.12. Document lessons learned for future cleanups
- [ ] 6.13. Consider setting up automated dependency checks

### Phase 7: Deployment Preparation (Optional)

If deploying to production:

- [ ] 7.1. Test in staging environment
- [ ] 7.2. Verify all staging tests pass
- [ ] 7.3. Create deployment plan
- [ ] 7.4. Prepare rollback procedure
- [ ] 7.5. Schedule deployment during low-traffic period
- [ ] 7.6. Have team available for monitoring
- [ ] 7.7. Deploy changes
- [ ] 7.8. Monitor for issues
- [ ] 7.9. Verify production functionality

---

## Appendix A: Quick Reference Commands

### Analysis Commands
```bash
# Install tools
npm install -g depcheck npm-check

# Run analysis
depcheck
npm-check
npm ls --all --json > deps.json

# Find imports
rg "^import .* from ['\"](.+)['\"]" -r '$1' src/ | sort -u

# Check specific package
rg "from ['\"]package-name['\"]" src/
npm ls package-name
```

### Removal Commands
```bash
# Remove package
npm uninstall package-name

# Remove multiple
npm uninstall pkg1 pkg2 pkg3

# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Verification Commands
```bash
# Quick checks
npx tsc --noEmit
npm run lint
npm run build
npm test

# Full verification
npm run qa:full

# Performance
npm run analyze
time npm install
```

### Recovery Commands
```bash
# Restore package
npm install package-name

# Rollback commit
git revert HEAD

# Restore from backup
cp package.json.backup package.json
npm install
```

---

## Appendix B: Common Package Usage Patterns

### Config-Loaded Packages
These won't show in grep but are essential:
- `autoprefixer` → postcss.config.js
- `prettier-plugin-*` → .prettierrc or prettier.config.js
- `eslint-plugin-*` → eslint.config.js
- `babel-plugin-*` → babel.config.js (if exists)

### Script-Used Tools
Check package.json scripts for:
- `tsx` - TypeScript execution
- `openapi-typescript` - API type generation
- CLI tools run via `npx` or direct execution

### Test Setup Packages
Check jest.config.js and jest.setup.js for:
- `jest-environment-*` - Test environment
- `@testing-library/*` - Testing utilities
- Polyfills and mocks

### Type Definitions
Keep if runtime package exists:
```bash
# Pattern
@types/X → keep if X is in dependencies
```

---

## Appendix C: Decision Tree

```
For each package in package.json:
├─ Is it imported in code?
│  ├─ YES → KEEP
│  └─ NO → Continue
├─ Is it in a config file?
│  ├─ YES → KEEP
│  └─ NO → Continue
├─ Is it used in package.json scripts?
│  ├─ YES → KEEP
│  └─ NO → Continue
├─ Is it a @types/* package?
│  ├─ YES → Does runtime package exist?
│  │  ├─ YES → KEEP
│  │  └─ NO → REMOVE
│  └─ NO → Continue
├─ Is it a peer dependency of another package?
│  ├─ YES → KEEP
│  └─ NO → Continue
├─ Is it critical infrastructure?
│  │  (next, react, testing, auth, backend)
│  ├─ YES → KEEP
│  └─ NO → SAFE TO REMOVE

After removal:
├─ Run verification
│  ├─ PASS → Commit and continue
│  └─ FAIL → Restore and document
```

---

## Document Information

**Version:** 1.0  
**Date:** 2025-11-24  
**Status:** Ready for Implementation  
**Estimated Duration:** 8-15 hours (depending on findings)  
**Author:** AI Therapist Development Team  

**Related Documents:**
- `requirements.md` - Original requirements
- `package.json` - Current dependencies
- `AGENTS.md` - Project coding guidelines

**Next Steps:**
1. Review and approve this specification
2. Schedule cleanup work (recommend dedicated time block)
3. Follow implementation checklist (Section 10)
4. Document results in cleanup report

---

*This specification provides a comprehensive, safe, and systematic approach to cleaning up package.json dependencies while maintaining full application functionality and test coverage.*
