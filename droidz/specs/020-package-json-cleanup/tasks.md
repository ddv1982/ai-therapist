# Tasks: Package.json Cleanup

## Overview
Systematic cleanup of package.json to remove unused dependencies while maintaining full functionality. Tasks are organized to minimize risk and enable early detection of issues.

---

## Phase 1: Preparation & Analysis

### Task 1.1: Setup and Backup
**Priority**: High | **Effort**: Small | **Risk**: Low

**Subtasks**:
- [x] Create backup files: `cp package.json package.json.backup && cp package-lock.json package-lock.json.backup`
- [x] Commit current state: `git add -A && git commit -m "chore: backup before dependency cleanup"`
- [x] Install analysis tools: `npm install -g depcheck npm-check`
- [x] Record baseline metrics (node_modules size, package count, install time)

**Verification**:
```bash
ls -la *.backup  # Should see backup files
which depcheck   # Should show installed
```

**Status**: ✅ COMPLETED

---

### Task 1.2: Run Dependency Analysis Tools
**Priority**: High | **Effort**: Medium | **Risk**: Low

**Subtasks**:
- [x] Run depcheck and save output: `depcheck --json > depcheck-report.json && depcheck`
- [x] Generate import list from codebase:
  ```bash
  rg "^import .* from ['\"](.+)['\"]" --no-heading -r '$1' \
    src/ convex/ scripts/ __tests__/ e2e/ | sort -u > imports.txt
  ```
- [x] Check dependency tree: `npm ls --all --json > dependency-tree.json`
- [x] Review npm-check output: `npm-check --skip-unused`

**Verification**:
- Should have 4 analysis files: depcheck-report.json, imports.txt, dependency-tree.json, npm-check output

**Status**: ✅ COMPLETED
- Found 14 unused dependencies
- Found 11 unused devDependencies
- Identified 8 missing dependencies
- Generated 1,489 unique imports

---

### Task 1.3: Establish Baseline
**Priority**: High | **Effort**: Small | **Risk**: Low

**Subtasks**:
- [x] Run full test suite and save results: `npm run qa:full 2>&1 | tee baseline-test-results.txt`
- [x] Record metrics in cleanup-metrics.txt:
  - Current node_modules size
  - Total package count (dependencies + devDependencies)
  - Installation time
  - Test results summary

**Verification**:
```bash
npm test  # All tests should pass
npm run build  # Build should succeed
```

**Status**: ✅ COMPLETED
- Unit Tests: PASSED (1,528+ tests)
- Coverage: MET THRESHOLDS (≥70%)
- E2E Tests: 61 passed, 4 failed (pre-existing dark mode CSS issues)
- Baseline metrics saved to cleanup-metrics.txt

---

## Phase 2: Manual Package Analysis

### Task 2.1: Analyze UI Component Packages
**Priority**: High | **Effort**: Medium | **Risk**: Medium

**Subtasks**:
- [ ] Check each @radix-ui/* package usage:
  ```bash
  for pkg in dialog dropdown-menu label popover progress scroll-area \
             select separator slider slot switch tabs; do
    echo "=== @radix-ui/react-$pkg ===" && rg "@radix-ui/react-$pkg" src/
  done
  ```
- [ ] Check framer-motion: `rg "motion\\.|AnimatePresence" src/`
- [ ] Check lucide-react: `rg "from ['\"]lucide-react['\"]" src/`
- [ ] Document findings in dependency-cleanup-report.md

**Decision Criteria**:
- Keep if ANY imports found
- Remove if NO usage found

---

### Task 2.2: Analyze Data & State Management
**Priority**: High | **Effort**: Small | **Risk**: Medium

**Subtasks**:
- [ ] Check React Query: `rg "useQuery|useMutation|QueryClient" src/`
- [ ] Check React Query Devtools: `rg "ReactQueryDevtools" src/`
- [ ] Check React Table: `rg "useReactTable|flexRender" src/`
- [ ] Document findings

**Critical Packages** (likely KEEP):
- @tanstack/react-query
- @tanstack/react-query-devtools (small, dev tool)

---

### Task 2.3: Analyze Forms & Validation
**Priority**: Medium | **Effort**: Small | **Risk**: Low

**Subtasks**:
- [ ] Check react-hook-form: `rg "useForm|Controller" src/`
- [ ] Check Zod: `rg "z\\.object|z\\.string|ZodSchema" src/`
- [ ] Check @hookform/resolvers: `rg "zodResolver" src/`
- [ ] Document findings

**Note**: These 3 packages work together, likely all in use

---

### Task 2.4: Analyze Utility Packages
**Priority**: Medium | **Effort**: Medium | **Risk**: Low

**Subtasks**:
- [ ] Check clsx: `rg "\\bclsx\\b" src/`
- [ ] Check cmdk: `rg "cmdk|Command" src/`
- [ ] Check class-variance-authority: `rg "\\bcva\\b|VariantProps" src/`
- [ ] Check tailwind-merge: `rg "twMerge|tailwind-merge" src/`
- [ ] Check uuid: `rg "\\buuid\\b|uuidv4" src/`
- [ ] Document findings

---

### Task 2.5: Analyze Charts, Markdown & Content
**Priority**: Low | **Effort**: Small | **Risk**: Low

**Subtasks**:
- [ ] Check recharts: `rg "LineChart|BarChart|recharts" src/`
- [ ] Check markdown-it: `rg "markdown-it" src/`
- [ ] Check streamdown: `rg "streamdown" src/`
- [ ] Document findings

**Note**: recharts is large (~400KB), good candidate for removal if unused

---

### Task 2.6: Analyze Date & Time Packages
**Priority**: Low | **Effort**: Small | **Risk**: Low

**Subtasks**:
- [ ] Check date-fns: `rg "format|parseISO|differenceIn" src/`
- [ ] Check react-day-picker: `rg "DayPicker|DatePicker" src/`
- [ ] Document findings

---

### Task 2.7: Verify Critical Infrastructure (DO NOT REMOVE)
**Priority**: High | **Effort**: Small | **Risk**: High

**Subtasks**:
- [ ] Verify authentication packages (@clerk/*, svix, jose)
- [ ] Verify AI packages (@ai-sdk/*, ai)
- [ ] Verify backend (convex)
- [ ] Verify core framework (next, react, react-dom)
- [ ] Verify styling (tailwindcss, @tailwindcss/postcss, autoprefixer)
- [ ] Verify testing (jest, @testing-library/*, @playwright/test)
- [ ] Verify TypeScript & linting (typescript, eslint, prettier)
- [ ] Mark ALL as KEEP in report

---

### Task 2.8: Analyze Security Packages (HIGH CAUTION)
**Priority**: High | **Effort**: Small | **Risk**: High

**Subtasks**:
- [ ] Check speakeasy (TOTP): `rg "speakeasy|totp" src/ convex/`
- [ ] Check qrcode: `rg "qrcode|QRCode" src/`
- [ ] Check jose (JWT): `rg "\\bjose\\b|SignJWT" src/ convex/`
- [ ] Document findings with CAUTION flags

**Critical**: Only remove if feature was explicitly removed

---

### Task 2.9: Check Configuration Files
**Priority**: High | **Effort**: Small | **Risk**: Medium

**Subtasks**:
- [ ] Review next.config.js for plugin usage
- [ ] Review tailwind.config.js for plugins
- [ ] Review postcss.config.js for plugins
- [ ] Review jest.config.js for transformers/setup
- [ ] Review playwright.config.ts for dependencies
- [ ] Review eslint.config.js for all plugins
- [ ] Document ALL config-loaded packages as KEEP

---

### Task 2.10: Analyze Type Definitions
**Priority**: Medium | **Effort**: Small | **Risk**: Low

**Subtasks**:
- [ ] List all @types/* packages: `cat package.json | jq '.devDependencies | keys[] | select(startswith("@types/"))'`
- [ ] For each @types/* package, verify runtime package exists:
  ```bash
  # Example
  npm ls jest && echo "Keep @types/jest"
  npm ls uuid && echo "Keep @types/uuid"
  ```
- [ ] Document which can be removed (runtime package not installed)

**Rule**: Keep @types/* if runtime package exists

---

### Task 2.11: Check Scripts for Tool Usage
**Priority**: Medium | **Effort**: Small | **Risk**: Medium

**Subtasks**:
- [ ] Review all scripts in package.json
- [ ] Identify CLI tools used: tsx, openapi-typescript, etc.
- [ ] Verify each tool is needed
- [ ] Document findings

**Note**: Scripts may use tools not imported in code

---

## Phase 3: Create Removal Plan

### Task 3.1: Compile Removal List
**Priority**: High | **Effort**: Medium | **Risk**: Low

**Subtasks**:
- [ ] Create dependency-cleanup-report.md
- [ ] List all packages analyzed (92 total)
- [ ] Categorize findings:
  - Safe to remove (no usage found)
  - Verify first (edge cases)
  - Keep (required)
  - Redundant (transitive dependencies)
- [ ] Prioritize removal by risk level
- [ ] Group into batches of 3-5 related packages

**Report Structure**:
```markdown
# Dependency Cleanup Report

## Analysis Summary
- Total packages analyzed: 92
- Packages to remove: X
- Packages to keep: Y

## Detailed Findings
[For each package: name, usage analysis, decision, justification]

## Removal Batches
[Grouped packages with risk assessment]
```

---

### Task 3.2: Risk Assessment
**Priority**: High | **Effort**: Small | **Risk**: Low

**Subtasks**:
- [ ] Assign risk level to each removal:
  - Low: Definitely unused, no config references
  - Medium: Appears unused, check configs
  - High: Security, auth, or core infra
- [ ] Order batches from low to high risk
- [ ] Document mitigation strategy for medium/high risk

---

## Phase 4: Execute Removals

### Task 4.1: Remove Batch 1 (Lowest Risk)
**Priority**: High | **Effort**: Small | **Risk**: Low

**Subtasks**:
- [ ] Remove packages: `npm uninstall pkg1 pkg2 pkg3`
- [ ] Clean install: `rm -rf node_modules package-lock.json && npm install`
- [ ] Run verification:
  ```bash
  npx tsc --noEmit  # Type check
  npm run lint       # Lint
  npm run build      # Build
  npm test          # Tests
  ```
- [ ] If all pass, commit:
  ```bash
  git add package.json package-lock.json
  git commit -m "chore: remove unused dependencies (batch 1)

  Removed:
  - pkg1: reason
  - pkg2: reason
  
  Verified: build ✓, tests ✓, types ✓"
  ```
- [ ] If failures, restore and document: `npm install <pkg>`

---

### Task 4.2: Remove Batch 2
**Priority**: High | **Effort**: Small | **Risk**: Low-Medium

**Subtasks**:
- [ ] Follow same process as Task 4.1
- [ ] Remove next batch of packages
- [ ] Verify and commit if successful

---

### Task 4.3: Remove Batch 3
**Priority**: Medium | **Effort**: Small | **Risk**: Medium

**Subtasks**:
- [ ] Follow same process as Task 4.1
- [ ] Extra caution for medium-risk packages
- [ ] Test more thoroughly

---

### Task 4.4: Remove Remaining Batches
**Priority**: Medium | **Effort**: Variable | **Risk**: Variable

**Subtasks**:
- [ ] Continue batch removal process
- [ ] One batch at a time
- [ ] Always verify before continuing
- [ ] Document any issues encountered

---

## Phase 5: Comprehensive Verification

### Task 5.1: Full Clean Install & Build
**Priority**: High | **Effort**: Small | **Risk**: Low

**Subtasks**:
- [ ] Complete clean slate:
  ```bash
  rm -rf node_modules package-lock.json .next
  npm install
  ```
- [ ] Verify no peer dependency warnings
- [ ] Run production build: `npm run build`
- [ ] Check build output for errors

**Verification**:
- ✅ Installation completes successfully
- ✅ No warnings or errors
- ✅ Build succeeds

---

### Task 5.2: Run Full Test Suite
**Priority**: High | **Effort**: Medium | **Risk**: Low

**Subtasks**:
- [ ] Run comprehensive QA: `npm run qa:full`
- [ ] Verify all tests pass (1,528+ tests)
- [ ] Check coverage thresholds met (≥70%)
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Document any test failures

**Acceptance Criteria**:
- ✅ All unit tests pass
- ✅ All E2E tests pass
- ✅ Coverage maintained

---

### Task 5.3: Manual Feature Testing
**Priority**: High | **Effort**: Medium | **Risk**: Medium

**Subtasks**:
- [ ] Start dev server: `npm run dev`
- [ ] Test authentication flow:
  - [ ] Sign up
  - [ ] Log in
  - [ ] Log out
- [ ] Test chat functionality:
  - [ ] Create new session
  - [ ] Send messages
  - [ ] Receive AI responses
  - [ ] Switch between sessions
- [ ] Test UI components:
  - [ ] Open dialogs/modals
  - [ ] Use dropdowns
  - [ ] Submit forms
  - [ ] Check animations
- [ ] Verify styling (dark mode, responsive)
- [ ] Check browser console for errors

---

### Task 5.4: Production Build Verification
**Priority**: High | **Effort**: Small | **Risk**: Medium

**Subtasks**:
- [ ] Build production: `npm run build`
- [ ] Start production server: `npm run start`
- [ ] Test critical features in production mode
- [ ] Check for production-only issues
- [ ] Verify no console errors

---

### Task 5.5: Performance Metrics
**Priority**: Medium | **Effort**: Small | **Risk**: Low

**Subtasks**:
- [ ] Run bundle analyzer: `npm run analyze`
- [ ] Compare bundle sizes before/after
- [ ] Measure installation time:
  ```bash
  rm -rf node_modules
  time npm install
  ```
- [ ] Document metrics in cleanup-metrics.txt:
  - Before/after node_modules size
  - Before/after package count
  - Before/after install time
  - Bundle size changes

---

## Phase 6: Documentation & Finalization

### Task 6.1: Complete Cleanup Report
**Priority**: High | **Effort**: Medium | **Risk**: Low

**Subtasks**:
- [ ] Fill in all sections of dependency-cleanup-report.md:
  - Initial state
  - All packages analyzed
  - Packages removed with justifications
  - Packages kept with explanations
  - Metrics comparison
  - Test results
  - Lessons learned
- [ ] Update cleanup-metrics.txt with final numbers
- [ ] Calculate improvements (%, size, time)

---

### Task 6.2: Final Verification Checklist
**Priority**: High | **Effort**: Small | **Risk**: Low

**Checklist**:
- [ ] `npm install` completes without errors
- [ ] No peer dependency warnings
- [ ] `npm run build` succeeds
- [ ] `npm run start` launches app
- [ ] App loads in browser without console errors
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes
- [ ] `npm test` - all tests pass
- [ ] `npm run test:coverage` meets thresholds (≥70%)
- [ ] `npm run test:e2e` passes
- [ ] Authentication works
- [ ] Chat functionality works
- [ ] UI components render correctly
- [ ] Bundle size reduced or stable
- [ ] Installation faster or stable

---

### Task 6.3: Update Project Documentation
**Priority**: Medium | **Effort**: Small | **Risk**: Low

**Subtasks**:
- [ ] Update README.md if dependencies section exists
- [ ] Document any removed features (if applicable)
- [ ] Add note about cleanup in CHANGELOG (if exists)
- [ ] Share cleanup report with team

---

### Task 6.4: Final Commit and Sign-off
**Priority**: High | **Effort**: Small | **Risk**: Low

**Subtasks**:
- [ ] Review all changes: `git diff origin/main`
- [ ] Create final commit:
  ```bash
  git add .
  git commit -m "chore: complete package.json cleanup

  Summary:
  - Removed X unused dependencies
  - node_modules reduced by Y%
  - Installation time improved by Z%
  
  All tests passing. Documentation updated.
  
  See dependency-cleanup-report.md for details.
  
  Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>"
  ```
- [ ] Push to remote: `git push origin main`

---

## Summary

**Total Tasks**: 31 tasks across 6 phases
**Estimated Effort**: 8-15 hours (depends on number of packages to remove)
**Risk Level**: Medium (careful verification mitigates risk)

**Critical Path**:
1. Preparation & Analysis (establish safe baseline)
2. Package Analysis (thorough investigation)
3. Create Removal Plan (strategic approach)
4. Execute Removals (incremental with verification)
5. Comprehensive Verification (full testing)
6. Documentation (complete record)

**Success Metrics**:
- ✅ Unused packages removed
- ✅ All tests pass
- ✅ Build succeeds
- ✅ No functionality broken
- ✅ Bundle size reduced or stable
- ✅ Installation faster
- ✅ Documentation complete

**Key Principles**:
- **Conservative**: When in doubt, keep the package
- **Incremental**: Remove in small batches with verification
- **Reversible**: Commit often, can always restore
- **Thorough**: Test comprehensively after changes
- **Documented**: Record all decisions and findings

---

## Notes

**Important Reminders**:
- Create backups before starting
- Test after EVERY removal batch
- Commit working states frequently
- Can always add packages back if needed
- Focus on obvious unused packages first
- Don't remove critical infrastructure (auth, backend, testing, framework)
- Verify config-loaded packages carefully (PostCSS, ESLint, etc.)
- Keep all @types/* for packages that are kept

**If Issues Arise**:
1. Read error message carefully
2. Identify which package is needed
3. Restore: `npm install <package>`
4. Document why it's needed
5. Continue with next package
