# CBT Session Summary Card Redesign - Tasks

## Overview

Fix the visual issue where the CBT Session Summary Card displays with double borders/shadows by implementing content-type detection and conditional rendering.

**Estimated Effort:** 2-3 hours  
**Risk Level:** Low (isolated changes, easy rollback)

---

## Phase 1: Content Detection Logic

### Task 1.1: Add CBT Content Detection Helper

- [x] **File:** `src/features/chat/messages/message-content.tsx`
- [x] Add `isCBTSummaryCardContent(content: string): boolean` helper function
- [x] Use regex pattern `/<!-- CBT_SUMMARY_CARD:/` to detect CBT markers
- [x] Export function if needed for testing

```typescript
function isCBTSummaryCardContent(content: string): boolean {
  const CBT_CARD_PATTERN = /<!-- CBT_SUMMARY_CARD:/;
  return CBT_CARD_PATTERN.test(content);
}
```

### Task 1.2: Write Unit Tests for Detection

- [ ] **File:** `__tests__/features/chat/messages/message-content.test.tsx`
- [ ] Test: detects CBT marker in content → returns true
- [ ] Test: regular message content → returns false
- [ ] Test: partial/malformed markers → returns false
- [ ] Run tests to verify: `npm test -- message-content`

---

## Phase 2: Conditional Rendering

### Task 2.1: Implement Conditional Wrapper in MessageContent

- [x] **File:** `src/features/chat/messages/message-content.tsx`
- [x] Add early detection check: `const isCBTCard = role === 'assistant' && isCBTSummaryCardContent(content)`
- [x] Add conditional return for CBT cards (without bubble wrapper)
- [x] Preserve existing bubble wrapper path for regular messages

```typescript
// For CBT cards: render without bubble wrapper
if (isCBTCard) {
  return (
    <div className={cn('cbt-card-container w-full max-w-2xl', className)}>
      <Markdown isUser={false}>{content}</Markdown>
    </div>
  );
}

// For regular messages: existing bubble styling
// ... existing code ...
```

### Task 2.2: Verify Memo Behavior

- [ ] Ensure `memo` comparison still works correctly with new logic
- [ ] Test that re-renders only occur when props change
- [ ] No performance regression

---

## Phase 3: Card Styling Update

### Task 3.1: Update CBTSessionSummaryCard to Glass Variant

- [x] **File:** `src/features/therapy/components/cbt-session-summary-card.tsx`
- [x] Change Card variant from `default` to `glass`
- [x] Add `cbt-summary-card` class for potential future styling hooks
- [x] Ensure responsive width classes are present

```typescript
<Card
  variant="glass"
  className={cn('cbt-summary-card w-full', className)}
>
```

### Task 3.2: Add ARIA Label for Accessibility

- [x] **File:** `src/features/therapy/components/cbt-session-summary-card.tsx`
- [x] Add `role="region"` to Card
- [x] Add `aria-label="CBT Session Summary"` or use translated string
- [x] Verify screen reader announces card properly

---

## Phase 4: Container Styles (Optional)

### Task 4.1: Add Container CSS Classes

- [x] **File:** `src/styles/layout.css` (or create `src/styles/cbt-card.css`)
- [x] Add `.cbt-card-container` styles for spacing
- [x] Add entrance animation (fade + slide up)
- [x] Add reduced motion media query

```css
.cbt-card-container {
  margin: 0.5rem 0;
  animation: cbt-card-enter 0.3s ease-out;
}

@keyframes cbt-card-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cbt-card-container {
    animation: none;
  }
}
```

### Task 4.2: Import CSS (if new file created)

- [ ] **File:** `src/app/globals.css` or appropriate entry point
- [ ] Import new CSS file if created separately
- [ ] Verify styles are applied

---

## Phase 5: Testing & Verification

### Task 5.1: Run Linting and TypeScript

- [x] Run `npm run lint` - fix any errors
- [x] Run `npx tsc --noEmit` - fix any type errors

### Task 5.2: Run Unit Tests

- [x] Run `npm test` - all tests should pass
- [x] Verify new detection tests pass
- [x] Check no regression in existing message tests

### Task 5.3: Manual Visual Testing

- [ ] Start dev server: `npm run dev`
- [ ] Navigate to chat with existing CBT summary
- [ ] Verify: No double borders/shadows on CBT card
- [ ] Verify: Glass effect visible (frosted background, subtle border)
- [ ] Verify: Hover shadow enhancement works
- [ ] Verify: Regular chat messages still have bubble styling
- [ ] Test on mobile viewport (responsive)
- [ ] Test on desktop viewport

### Task 5.4: Accessibility Testing

- [ ] Tab through card - verify focus states visible
- [ ] Test with screen reader (VoiceOver/NVDA)
- [ ] Verify card region is announced
- [ ] Check color contrast meets WCAG AA (4.5:1)

### Task 5.5: Build Verification

- [x] Run `npm run build` - verify production build succeeds
- [x] Check bundle size impact (should be minimal, <1KB)

---

## Phase 6: Cleanup & Commit

### Task 6.1: Remove Debug Code

- [ ] Remove any console.log statements added during development
- [ ] Remove any temporary test code

### Task 6.2: Final Code Review

- [ ] Review all changed files
- [ ] Ensure code follows project conventions
- [ ] Check for any TODO comments that need addressing

### Task 6.3: Commit Changes

- [ ] Stage all changes: `git add -A`
- [ ] Review diff: `git diff --cached`
- [ ] Commit with descriptive message:

```
feat(cbt-card): render CBT summary without message bubble wrapper

- Add content detection to identify CBT card markers
- Implement conditional rendering in MessageContent
- Update CBTSessionSummaryCard to use glass variant
- Add entrance animation with reduced motion support
- Improves visual appearance by removing double borders/shadows
```

---

## Success Criteria Checklist

### Functional

- [ ] CBT Summary Card renders without message bubble wrapper
- [ ] Regular chat messages retain existing bubble styling
- [ ] `therapeutic-content` class NOT applied to CBT cards
- [ ] Glass variant styling visible on CBT cards

### Visual

- [ ] No double borders/shadows on CBT card
- [ ] Card has frosted glass appearance
- [ ] Hover state shows enhanced shadow
- [ ] Mobile layout is full-width
- [ ] Desktop layout is contained (max 42rem)

### Technical

- [ ] All existing tests pass
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] Build succeeds

---

## Files Changed Summary

| File                                                           | Change Type                   |
| -------------------------------------------------------------- | ----------------------------- |
| `src/features/chat/messages/message-content.tsx`               | Modify                        |
| `src/features/therapy/components/cbt-session-summary-card.tsx` | Modify                        |
| `src/styles/layout.css`                                        | Modify (add container styles) |
| `__tests__/features/chat/messages/message-content.test.tsx`    | Modify (add tests)            |

---

## Rollback Plan

If issues arise:

1. `git revert <commit-hash>` to undo all changes
2. Changes are isolated to 2 main files - easy to manually revert
3. No database or API changes - pure frontend modification
