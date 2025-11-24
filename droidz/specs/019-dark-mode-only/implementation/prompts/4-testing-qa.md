# Implementation: Phase 4 - Testing & Quality Assurance

## Task Assignment

### Task 4.1: Update/Remove Unit Tests
**Priority**: Medium | **Effort**: Small | **Risk**: Low

**Subtasks**:
- [ ] Search for test files: `find src/ -name "*.test.tsx" -o -name "*.test.ts"`
- [ ] Remove: `__tests__/theme-provider.test.tsx` (if exists)
- [ ] Remove: `__tests__/theme-toggle.test.tsx` (if exists)
- [ ] Update tests mocking `useTheme()` hook:
  - Remove `jest.mock('@/lib/theme-context')`
  - Remove theme-related assertions
- [ ] Run: `npm test`

**Files Changed**:
- Various test files (modified or deleted)

---

### Task 4.2: E2E Visual Regression Tests
**Priority**: High | **Effort**: Medium | **Risk**: Low

**Subtasks**:
- [ ] Create Playwright test for dark mode verification
- [ ] Test all major pages: dashboard, chat, CBT diary, settings
- [ ] Capture screenshots for baseline
- [ ] Verify no theme toggle UI exists
- [ ] Check for console errors

**Example Test** (`e2e/dark-mode.spec.ts`):
```typescript
test('app renders in dark mode only', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Verify dark mode CSS variable
  const bgColor = await page.evaluate(() => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--background');
  });
  expect(bgColor).toContain('oklch(0.12');
  
  // Verify no theme toggle
  const themeToggle = page.locator('button[aria-label*="theme"]');
  await expect(themeToggle).toHaveCount(0);
});
```

**Files Changed**:
- `e2e/dark-mode.spec.ts` (new)
- Existing E2E tests (updated baselines)

---

### Task 4.3: Accessibility Testing
**Priority**: High | **Effort**: Small | **Risk**: Medium

**Subtasks**:
- [ ] Verify color contrast ratios:
  - Body text: ≥4.5:1 (should be ~17:1)
  - Primary buttons: ≥4.5:1
  - Therapeutic colors: ≥4.5:1
- [ ] Verify focus indicators visible (3:1 contrast minimum)
- [ ] Check keyboard navigation functional

**Verification Checklist**:
- [ ] All contrast ratios meet WCAG AA
- [ ] Keyboard Tab navigation works
- [ ] Focus indicators clearly visible

---

### Task 4.4: Cross-Browser Testing
**Priority**: Medium | **Effort**: Medium | **Risk**: Low

**Browsers to test**:
- [ ] Chrome 120+ (primary development browser)
- [ ] Safari 17+ (macOS)
- [ ] Firefox 120+

**Test Checklist per browser**:
1. Load dashboard - verify dark background
2. Navigate to chat - verify colors correct
3. Open CBT diary - verify therapeutic colors
4. Check command palette - no theme option
5. Inspect console - no errors

---

### Task 4.5: Performance Verification
**Priority**: Low | **Effort**: Small | **Risk**: Low

**Subtasks**:
- [ ] Run: `npm run build`
- [ ] Compare bundle sizes before/after
- [ ] Verify bundle reduced

**Metrics to Record**:
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Total Size | X kb | (X-20)kb | ✅ Reduced |

---

## Context Files

Read these for requirements and patterns:
- spec: droidz/specs/019-dark-mode-only/spec.md
- requirements: droidz/specs/019-dark-mode-only/planning/requirements.md
- tasks: droidz/specs/019-dark-mode-only/tasks.md

## Instructions

1. Read and analyze spec, requirements, and testing strategy
2. Execute Task 4.1: Update/remove unit tests
3. Execute Task 4.2: Create E2E dark mode test
4. Execute Task 4.3: Verify accessibility standards
5. Execute Task 4.4: Test in multiple browsers (at least Chrome)
6. Execute Task 4.5: Verify performance improvements
7. Ensure all tests pass before marking complete
8. Mark tasks complete with [x] in droidz/specs/019-dark-mode-only/tasks.md

## Verification

All tests must pass:
```bash
npm test           # Unit tests
npm run test:e2e   # E2E tests
npm run build      # Production build
```

## Standards

Follow all standards in:
- /Users/vriesd/projects/ai-therapist/AGENTS.md
- /Users/vriesd/projects/ai-therapist/droidz/standards/

## Important Notes

- Do not proceed if any tests fail
- Document any accessibility issues found
- Take screenshots for visual regression comparison
- Run tests in clean environment (clear cache if needed)
