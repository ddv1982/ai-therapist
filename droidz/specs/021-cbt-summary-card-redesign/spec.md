# CBT Session Summary Card Redesign Specification

## 1. Overview

### 1.1 Problem Statement

The CBT Session Summary Card is currently rendered inside a message bubble wrapper in the chat interface, causing visual issues:

- **Double styling**: Card styling (shadows, borders, rounded corners) combined with message bubble styling
- **Nested appearance**: Card-within-card effect making the UI feel cluttered
- **Style inheritance**: The `therapeutic-content` class applies typography styles meant for prose content to structured card content

### 1.2 Goal

Redesign the rendering architecture so the CBT Session Summary Card displays as a **standalone, premium component** without message bubble wrapping, while maintaining the existing message bubble styling for regular chat messages.

### 1.3 Scope

| In Scope                              | Out of Scope                       |
| ------------------------------------- | ---------------------------------- |
| Fix double-wrapping issue             | Redesigning card content structure |
| Implement glass/elevated card variant | Adding new CBT data fields         |
| Update rendering pipeline             | Modifying CBT data generation      |
| Add accessibility improvements        | Chat message layout changes        |
| Testing and verification              | Other therapy components           |

---

## 2. Current Implementation Analysis

### 2.1 Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ MessageContent (message-content.tsx)                            │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ <div className={bubbleClasses + therapeutic-content}>       │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ Markdown (markdown.tsx)                                 │ │ │
│ │ │ ┌─────────────────────────────────────────────────────┐ │ │ │
│ │ │ │ CBTSessionSummaryCard (if CBT data detected)        │ │ │ │
│ │ │ │ - Has its own Card with bg-card, shadow-apple-sm    │ │ │ │
│ │ │ └─────────────────────────────────────────────────────┘ │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 File Responsibilities

| File                           | Responsibility                          | Current Behavior                                    |
| ------------------------------ | --------------------------------------- | --------------------------------------------------- |
| `message-content.tsx`          | Wraps message content in bubble styling | Always applies bubble + therapeutic-content classes |
| `markdown.tsx`                 | Parses content, extracts CBT data       | Returns CBTSessionSummaryCard when CBT data found   |
| `cbt-session-summary-card.tsx` | Renders structured CBT summary          | Applies Card component with shadow styling          |
| `message.ts`                   | Defines message design tokens           | Provides bubble classes for user/assistant          |

### 2.3 Data Flow

```
AI Response with CBT data
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ Message contains:                                    │
│ "Here's your session summary:                        │
│ <!-- CBT_SUMMARY_CARD:{json_data} -->               │
│ <!-- END_CBT_SUMMARY_CARD -->"                      │
└─────────────────────────────────────────────────────┘
         │
         ▼
MessageContent receives content string
         │
         ▼
Wraps in bubble div with therapeutic-content class
         │
         ▼
Markdown component parses content
         │
         ▼
extractCBTSummaryData() finds CBT marker
         │
         ▼
Returns CBTSessionSummaryCard (inside bubble wrapper) ← PROBLEM HERE
```

### 2.4 Style Conflict Details

**Message Bubble Classes (assistant role):**

```css
/* From buildMessageClasses() */
p-4 rounded-2xl shadow-sm break-words selectable-text
bg-card/95 backdrop-blur-sm text-foreground
rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-md
shadow-md max-w-none md:max-w-[min(85%,_45rem)] md:mr-auto
```

**CBT Card Classes:**

```css
/* From Card component */
bg-card text-foreground shadow-apple-sm rounded-lg
```

**therapeutic-content Class:**

```css
font-size: 1rem;
line-height: 1.6;
/* Plus list styling, blockquote styling, etc. */
```

**Result:** Double backgrounds, double shadows, double padding, conflicting border-radius values, and prose typography applied to a structured card component.

---

## 3. Proposed Solution

### 3.1 Recommended Approach: Content-Type Detection

Modify `MessageContent` to detect CBT card content **before** applying bubble wrapper, then render appropriately based on content type.

**Key Principle:** Detect content type early, apply styling conditionally.

### 3.2 Solution Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ MessageContent (message-content.tsx)                            │
│                                                                 │
│   isCBTCardContent = checkForCBTMarker(content)                 │
│                                                                 │
│   if (isCBTCardContent) {                                       │
│     return <CBTCardWrapper><Markdown>{content}</Markdown>       │
│   }                                                             │
│                                                                 │
│   return <BubbleWrapper><Markdown>{content}</Markdown>          │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Alternative Approaches Considered

| Approach                                    | Pros                               | Cons                      | Verdict               |
| ------------------------------------------- | ---------------------------------- | ------------------------- | --------------------- |
| **A. Content-Type Detection** (Recommended) | Clean separation, explicit control | Requires pattern matching | ✅ Best balance       |
| **B. CSS Override**                         | No structural changes              | Brittle, fights cascade   | ❌ Technical debt     |
| **C. Markdown Signal**                      | Component-level control            | Complex prop threading    | ❌ Over-engineered    |
| **D. Separate Render Path**                 | Full isolation                     | Code duplication          | ❌ Maintenance burden |

---

## 4. Detailed Implementation Plan

### 4.1 Phase 1: Content Detection Function

**File:** `src/features/chat/messages/message-content.tsx`

```typescript
// Add this helper function
function isCBTSummaryCardContent(content: string): boolean {
  const CBT_CARD_PATTERN = /<!-- CBT_SUMMARY_CARD:/;
  return CBT_CARD_PATTERN.test(content);
}
```

### 4.2 Phase 2: Conditional Rendering in MessageContent

**File:** `src/features/chat/messages/message-content.tsx`

```typescript
const MessageContentComponent = function MessageContent({
  content,
  role,
  messageId,
  className,
}: MessageContentProps) {
  // Early detection of CBT card content
  const isCBTCard = role === 'assistant' && isCBTSummaryCardContent(content);

  // For CBT cards: render without bubble wrapper
  if (isCBTCard) {
    return (
      <div className={cn('cbt-card-container w-full max-w-2xl', className)}>
        <Markdown isUser={false}>{content}</Markdown>
      </div>
    );
  }

  // For regular messages: apply bubble styling
  const bubbleClasses = buildMessageClasses(role, 'bubble');
  const contentClasses = role === 'user' ? 'message-content-user' : 'message-content-assistant';

  return (
    <div className={cn(bubbleClasses, contentClasses, 'therapeutic-content', className)}>
      <Markdown isUser={role === 'user'}>{content}</Markdown>
    </div>
  );
};
```

### 4.3 Phase 3: Update CBT Card Styling

**File:** `src/features/therapy/components/cbt-session-summary-card.tsx`

Update the Card to use the `glass` variant for a premium, standalone appearance:

```typescript
return (
  <Card
    variant="glass"
    className={cn(
      'cbt-summary-card',
      'w-full',
      className
    )}
  >
    {/* ... existing content ... */}
  </Card>
);
```

### 4.4 Phase 4: Add Container Styles (Optional)

**File:** `src/styles/components.css` (or appropriate location)

```css
/* CBT Card Container - ensures proper spacing in chat context */
.cbt-card-container {
  margin: 0.5rem 0;
  /* Add entrance animation */
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

/* Ensure the card fills container properly */
.cbt-summary-card {
  width: 100%;
}
```

---

## 5. Visual Design Direction

### 5.1 Recommended: Glass Card Variant

Use the existing `glass` Card variant for a premium, Apple-inspired look:

```css
/* Glass variant from card.tsx */
bg-[var(--glass-white)]
backdrop-blur-glass
backdrop-saturate-glass
border border-[var(--glass-border)]
text-foreground
shadow-apple-md
hover:shadow-apple-lg
```

**Visual Characteristics:**

- Frosted glass background with 70% opacity
- Subtle backdrop blur (12px)
- Soft white border for definition
- Medium Apple-style shadow
- Hover state with enhanced shadow

### 5.2 Design Tokens Applied

| Property      | Value                        | Purpose                       |
| ------------- | ---------------------------- | ----------------------------- |
| Background    | `oklch(0.15 0.01 250 / 0.7)` | Semi-transparent dark glass   |
| Border        | `oklch(0.99 0 0 / 0.1)`      | Subtle white edge             |
| Shadow        | `shadow-apple-md`            | Floating appearance           |
| Blur          | `backdrop-blur-glass`        | Frosted effect                |
| Border Radius | `0.75rem` (12px)             | Consistent with design system |

### 5.3 Mobile Considerations

| Viewport         | Behavior                                |
| ---------------- | --------------------------------------- |
| Desktop (≥768px) | Max width 42rem, centered in chat       |
| Mobile (<768px)  | Full width with 16px horizontal margins |

---

## 6. Code Changes Summary

### 6.1 Files to Modify

| File                                                           | Change Type | Description                                  |
| -------------------------------------------------------------- | ----------- | -------------------------------------------- |
| `src/features/chat/messages/message-content.tsx`               | Modify      | Add content detection, conditional rendering |
| `src/features/therapy/components/cbt-session-summary-card.tsx` | Modify      | Add glass variant, refine styling            |

### 6.2 Files to Create (Optional)

| File                      | Purpose                                                |
| ------------------------- | ------------------------------------------------------ |
| `src/styles/cbt-card.css` | Container and animation styles (if not using Tailwind) |

### 6.3 No Changes Required

| File             | Reason                                             |
| ---------------- | -------------------------------------------------- |
| `markdown.tsx`   | Extraction logic works correctly                   |
| `card.tsx`       | Glass variant already exists                       |
| `message.ts`     | Design tokens unchanged                            |
| `typography.css` | therapeutic-content preserved for regular messages |

---

## 7. Testing Strategy

### 7.1 Unit Tests

**File:** `__tests__/features/chat/messages/message-content.test.tsx`

```typescript
describe('MessageContent', () => {
  describe('CBT Card Detection', () => {
    it('should detect CBT card marker in content', () => {
      const content =
        'Summary:\n<!-- CBT_SUMMARY_CARD:{"date":"2024-01-01"} -->\n<!-- END_CBT_SUMMARY_CARD -->';
      expect(isCBTSummaryCardContent(content)).toBe(true);
    });

    it('should not detect CBT marker in regular content', () => {
      const content = 'Hello, how are you feeling today?';
      expect(isCBTSummaryCardContent(content)).toBe(false);
    });

    it('should render without bubble wrapper for CBT content', () => {
      // Test that cbt-card-container class is present
      // Test that therapeutic-content class is NOT present
    });

    it('should render with bubble wrapper for regular content', () => {
      // Test that therapeutic-content class IS present
      // Test that cbt-card-container class is NOT present
    });
  });
});
```

### 7.2 Visual Regression Tests

**File:** `e2e/cbt-card-visual.spec.ts`

```typescript
test.describe('CBT Summary Card Visual', () => {
  test('renders standalone without double borders', async ({ page }) => {
    // Navigate to chat with CBT summary
    // Screenshot comparison
    // Verify no nested shadows/borders
  });

  test('maintains glass effect on hover', async ({ page }) => {
    // Hover state verification
  });

  test('displays correctly on mobile', async ({ page }) => {
    // Set mobile viewport
    // Verify full-width rendering
  });
});
```

### 7.3 Manual Test Checklist

- [ ] CBT card displays without message bubble border
- [ ] Glass effect visible with backdrop blur
- [ ] Hover shadow enhancement works
- [ ] Regular chat messages still have bubble styling
- [ ] Card is responsive (mobile + desktop)
- [ ] Content sections render correctly
- [ ] Animations are smooth
- [ ] Dark theme looks correct
- [ ] Accessibility: keyboard navigation works
- [ ] Accessibility: screen reader announces card properly

---

## 8. Accessibility Requirements

### 8.1 WCAG Compliance

| Requirement    | Implementation                                    |
| -------------- | ------------------------------------------------- |
| Color Contrast | Verify 4.5:1 ratio for all text                   |
| Focus States   | Ensure visible focus ring on interactive elements |
| Screen Reader  | Add appropriate ARIA labels to card               |
| Reduced Motion | Respect `prefers-reduced-motion` for animations   |

### 8.2 ARIA Implementation

```tsx
<Card
  variant="glass"
  role="region"
  aria-label="CBT Session Summary"
  className={cn('cbt-summary-card', className)}
>
  {/* Content */}
</Card>
```

### 8.3 Animation Accessibility

```css
@media (prefers-reduced-motion: reduce) {
  .cbt-card-container {
    animation: none;
  }
}
```

---

## 9. Rollback Plan

### 9.1 Feature Flag (Optional)

If concerned about stability, implement behind a feature flag:

```typescript
const USE_STANDALONE_CBT_CARD = process.env.NEXT_PUBLIC_STANDALONE_CBT_CARD === 'true';

// In MessageContent:
if (USE_STANDALONE_CBT_CARD && isCBTCard) {
  // New rendering path
}
// Else: existing behavior
```

### 9.2 Git Revert

All changes are isolated to 1-2 files. Standard `git revert` of the commit will restore previous behavior without side effects.

---

## 10. Success Criteria

### 10.1 Functional Requirements

- [ ] CBT Summary Card renders without message bubble wrapper
- [ ] Regular chat messages retain existing bubble styling
- [ ] `therapeutic-content` class not applied to CBT cards
- [ ] Glass variant styling visible on CBT cards

### 10.2 Visual Requirements

- [ ] No double borders/shadows on CBT card
- [ ] Card has frosted glass appearance
- [ ] Hover state shows enhanced shadow
- [ ] Mobile layout is full-width
- [ ] Desktop layout is contained (max 42rem)

### 10.3 Technical Requirements

- [ ] All existing tests pass
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] Bundle size impact < 1KB
- [ ] No performance regression

---

## 11. Implementation Checklist

```
Phase 1: Detection Logic
├── [ ] Add isCBTSummaryCardContent helper function
├── [ ] Write unit tests for detection
└── [ ] Verify pattern matches all CBT card formats

Phase 2: Conditional Rendering
├── [ ] Implement conditional wrapper in MessageContent
├── [ ] Add cbt-card-container class
├── [ ] Test both code paths (CBT vs regular)
└── [ ] Verify memo behavior unchanged

Phase 3: Card Styling
├── [ ] Update CBTSessionSummaryCard to use glass variant
├── [ ] Add/verify responsive width classes
├── [ ] Test hover states
└── [ ] Verify all card sections display correctly

Phase 4: Polish & Testing
├── [ ] Add entrance animation (optional)
├── [ ] Run visual regression tests
├── [ ] Execute manual test checklist
├── [ ] Verify accessibility compliance
└── [ ] Run full test suite (npm run test)

Phase 5: Documentation
├── [ ] Update component documentation (if applicable)
└── [ ] Document any new CSS classes
```

---

## Appendix A: CBT Card Data Structure

```typescript
interface CBTSessionSummaryData {
  date: string;
  situation?: string;
  initialEmotions?: Array<{ emotion: string; rating: number }>;
  automaticThoughts?: Array<{ thought: string; credibility: number }>;
  coreBelief?: { belief: string; credibility: number };
  rationalThoughts?: Array<{ thought: string; confidence: number }>;
  schemaModes?: Array<{ name: string; intensity?: number }>;
  finalEmotions?: Array<{ emotion: string; rating: number }>;
  newBehaviors?: string[];
  completedSteps?: string[];
}
```

## Appendix B: Card Variant Reference

```typescript
// From card.tsx - available variants
const cardVariants = cva('rounded-lg transition-all duration-base ease-out-smooth', {
  variants: {
    variant: {
      default: 'bg-card text-card-foreground shadow-apple-sm hover:shadow-apple-md',
      glass:
        'bg-[var(--glass-white)] backdrop-blur-glass backdrop-saturate-glass border border-[var(--glass-border)] text-foreground shadow-apple-md hover:shadow-apple-lg',
      elevated:
        'bg-card text-card-foreground shadow-apple-md hover:shadow-apple-lg hover:-translate-y-0.5',
    },
  },
  defaultVariants: { variant: 'default' },
});
```

---

_Specification Version: 1.0_  
_Created: 2024_  
_Last Updated: 2024_
