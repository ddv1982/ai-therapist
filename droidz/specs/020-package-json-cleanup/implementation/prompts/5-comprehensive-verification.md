# Implementation: Phase 5 - Comprehensive Verification

## Task Assignment

### Task 5.1: Full Clean Install & Build
- [ ] Complete clean slate: rm -rf node_modules package-lock.json .next && npm install
- [ ] Verify no peer dependency warnings
- [ ] Run production build: npm run build
- [ ] Check build output for errors

### Task 5.2: Run Full Test Suite
- [ ] Run comprehensive QA: npm run qa:full
- [ ] Verify all tests pass (1,528+ tests)
- [ ] Check coverage thresholds met (≥70%)
- [ ] Run E2E tests: npm run test:e2e
- [ ] Document any failures

### Task 5.3: Manual Feature Testing
- [ ] Start dev server: npm run dev
- [ ] Test authentication (sign up, log in, log out)
- [ ] Test chat functionality
- [ ] Test UI components
- [ ] Verify styling and animations
- [ ] Check browser console for errors

### Task 5.4: Production Build Verification
- [ ] Build production: npm run build
- [ ] Start production server: npm run start
- [ ] Test critical features in production mode
- [ ] Check for production-only issues

### Task 5.5: Performance Metrics
- [ ] Run bundle analyzer: npm run analyze
- [ ] Compare bundle sizes before/after
- [ ] Measure installation time
- [ ] Document all metrics

---

## Context Files

Read these for requirements and patterns:
- spec: droidz/specs/020-package-json-cleanup/spec.md
- requirements: droidz/specs/020-package-json-cleanup/planning/requirements.md
- tasks: droidz/specs/020-package-json-cleanup/tasks.md
- Baseline metrics from Phase 1
- Removal results from Phase 4

## Instructions

1. Perform complete clean install from scratch
2. Run FULL test suite (all tests must pass)
3. Manually test critical features:
   - Authentication flow
   - Chat functionality
   - UI components
   - Styling/animations
4. Verify production build works
5. Collect and compare metrics (before/after)
6. Document all results in dependency-cleanup-report.md
7. Mark tasks complete with [x] in droidz/specs/020-package-json-cleanup/tasks.md

## Acceptance Criteria

All must pass:
- ✅ Clean install succeeds
- ✅ All 1,528+ tests pass
- ✅ Coverage ≥70%
- ✅ Production build succeeds
- ✅ All critical features work
- ✅ No console errors
- ✅ Performance maintained or improved

## Standards

Follow all standards in:
- /Users/vriesd/projects/ai-therapist/AGENTS.md

## Important Notes

- This is the final verification before completion
- ALL tests must pass - no exceptions
- Manual testing is critical - automated tests may miss issues
- Compare metrics to baseline from Phase 1
- Document any regressions or issues
- If ANY test fails, investigate and fix before proceeding
