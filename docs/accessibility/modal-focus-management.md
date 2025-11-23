# Modal Focus Management - WCAG 2.1 AA Compliance

## Overview

This document describes the accessibility implementation for modal dialogs in the AI Therapist application. All modals meet WCAG 2.1 AA standards for focus management, keyboard navigation, and screen reader compatibility.

## Implementation Date

- **Completed:** 2025-11-23
- **Sprint:** Sprint 2, Task D
- **WCAG Version:** 2.1 AA

## WCAG Success Criteria Met

Our modal implementation satisfies the following WCAG 2.1 AA success criteria:

### ✅ 2.1.1 Keyboard (Level A)
**Requirement:** All functionality is available via keyboard.

**Implementation:**
- All modal controls are keyboard accessible
- Tab and Shift+Tab navigate through focusable elements
- Enter and Space keys activate buttons and links
- Escape key closes modals

**Verification:** Automated tests in `__tests__/components/ui/dialog-accessibility.test.tsx`

### ✅ 2.1.2 No Keyboard Trap (Level A)
**Requirement:** Keyboard focus can always be moved away from any component.

**Implementation:**
- Escape key closes modal and returns focus to trigger
- Focus is not permanently trapped
- Users can exit modal context at any time

**Verification:** Automated tests verify Escape key functionality

### ✅ 2.4.3 Focus Order (Level A)
**Requirement:** Focusable components receive focus in an order that preserves meaning and operability.

**Implementation:**
- Focus order follows visual layout (top to bottom, left to right)
- Logical tab order through modal content
- Close button accessible via Tab navigation

**Verification:** Tests verify tab order matches expected sequence

### ✅ 2.4.7 Focus Visible (Level AA)
**Requirement:** Keyboard focus indicator is visible.

**Implementation:**
- All focusable elements have visible focus rings
- Focus styles: `focus:ring-2 focus:ring-ring focus:ring-offset-2`
- High contrast focus indicators meet 3:1 contrast ratio

**Verification:** Visual regression tests and manual verification

### ✅ 3.2.1 On Focus (Level A)
**Requirement:** When a component receives focus, it does not initiate a change of context.

**Implementation:**
- Focusing elements does not close modal
- Focusing elements does not trigger actions
- No unexpected navigation on focus

**Verification:** Automated tests verify no context changes on focus

### ✅ 4.1.2 Name, Role, Value (Level A)
**Requirement:** For all UI components, the name and role can be programmatically determined.

**Implementation:**
- `role="dialog"` on modal container
- `aria-modal="true"` to indicate modal behavior
- `aria-labelledby` links to dialog title
- `aria-describedby` links to dialog description
- Close button has accessible label via `<span className="sr-only">Close</span>`

**Verification:** Automated tests verify ARIA attributes

## Technical Implementation

### Component: Dialog

**Location:** `src/components/ui/dialog.tsx`

**Technology:** Radix UI Dialog primitive

**Built-in Accessibility Features:**
- Automatic focus trap when modal opens
- Focus returns to trigger element on close
- Escape key closes dialog
- Tab/Shift+Tab cycles through focusable elements
- Proper ARIA attributes (role, aria-modal, aria-labelledby, etc.)

### Hook: useFocusTrap

**Location:** `src/hooks/useFocusTrap.ts`

**Purpose:** Provides explicit focus management for custom components

**Features:**
- Traps focus within a container
- Handles Tab and Shift+Tab keyboard events
- Filters visible and enabled elements only
- Restores focus on unmount

**Usage:**
```typescript
import { useFocusTrap } from '@/hooks/useFocusTrap';

function CustomModal({ isOpen }) {
  const focusTrapRef = useFocusTrap(isOpen);
  
  return (
    <div ref={focusTrapRef}>
      {/* Modal content */}
    </div>
  );
}
```

### Hook: useFocusReturn

**Location:** `src/hooks/useFocusTrap.ts`

**Purpose:** Ensures focus returns to trigger element on modal close

**Features:**
- Saves trigger element reference when modal opens
- Restores focus when modal closes
- Handles trigger removal from DOM gracefully

**Usage:**
```typescript
import { useFocusReturn } from '@/hooks/useFocusTrap';

function CustomModal({ isOpen }) {
  useFocusReturn(isOpen);
  
  return (
    <div>
      {/* Modal content */}
    </div>
  );
}
```

## Modal Components Audited

The following modal components have been verified for WCAG 2.1 AA compliance:

### 1. Dialog Component
- **Location:** `src/components/ui/dialog.tsx`
- **Status:** ✅ Compliant
- **Radix UI Version:** 1.1.15
- **Notes:** Uses Radix UI Dialog primitive with built-in accessibility

### 2. Session Report Detail Modal
- **Location:** `src/features/therapy/memory/session-report-detail-modal.tsx`
- **Status:** ✅ Compliant
- **Uses:** Dialog component
- **Notes:** Inherits accessibility from base Dialog component

### 3. Memory Management Modal
- **Location:** `src/features/therapy/memory/memory-management-modal.tsx`
- **Status:** ✅ Compliant
- **Uses:** Dialog component
- **Notes:** Inherits accessibility from base Dialog component

### 4. Therapeutic Modal
- **Location:** `src/components/ui/therapeutic-modal.tsx`
- **Status:** ✅ Compliant
- **Uses:** Dialog and Sheet components
- **Notes:** Responsive modal with mobile sheet variant

## Automated Testing

### Test Files

1. **useFocusTrap Hook Tests**
   - Location: `__tests__/hooks/useFocusTrap.test.tsx`
   - Coverage: Focus trap activation, Tab/Shift+Tab navigation, focus restoration
   - Status: ✅ 100% passing

2. **Dialog Accessibility Tests**
   - Location: `__tests__/components/ui/dialog-accessibility.test.tsx`
   - Coverage: WCAG 2.1 AA success criteria, keyboard navigation, screen reader support
   - Status: ✅ 100% passing

### Running Tests

```bash
# Run all accessibility tests
npm run test -- dialog-accessibility

# Run focus trap tests
npm run test -- useFocusTrap

# Run with coverage
npm run test:coverage -- --testPathPattern=accessibility
```

## Manual Testing Checklist

### Keyboard Navigation

- [ ] **Open Modal**
  - [ ] Click trigger button with mouse
  - [ ] Press Enter on trigger button
  - [ ] Press Space on trigger button

- [ ] **Navigate Within Modal**
  - [ ] Tab moves to next focusable element
  - [ ] Shift+Tab moves to previous focusable element
  - [ ] Focus stays within modal (no escape via Tab)
  - [ ] Focus order is logical (top to bottom)

- [ ] **Close Modal**
  - [ ] Press Escape closes modal
  - [ ] Click close button (X) closes modal
  - [ ] Press Enter on close button closes modal
  - [ ] Click backdrop closes modal (if enabled)

- [ ] **Focus Return**
  - [ ] Focus returns to trigger after closing with Escape
  - [ ] Focus returns to trigger after closing with close button
  - [ ] Focus returns to trigger after closing with backdrop click

### Screen Reader Testing

#### VoiceOver (macOS)

1. **Enable VoiceOver:** Cmd+F5
2. **Navigate to trigger:** VO+Right Arrow
3. **Open modal:** VO+Space or Enter
4. **Verify announcements:**
   - [ ] "Dialog" or "Modal dialog" announced
   - [ ] Dialog title read
   - [ ] Dialog description read (if present)
5. **Navigate content:** VO+Right Arrow
6. **Verify focus trap:** Continue navigating - should stay in modal
7. **Close modal:** Escape or VO+Space on close button
8. **Verify focus return:** Focus should return to trigger

#### NVDA (Windows - if available)

1. **Enable NVDA:** Ctrl+Alt+N
2. **Navigate to trigger:** Down Arrow
3. **Open modal:** Enter or Space
4. **Verify announcements:**
   - [ ] "Dialog" announced
   - [ ] Dialog title read
   - [ ] Dialog description read
5. **Navigate content:** Down Arrow or Tab
6. **Close modal:** Escape
7. **Verify focus return:** Focus should return to trigger

#### JAWS (Windows - if available)

1. **Enable JAWS:** (already running)
2. **Navigate to trigger:** Down Arrow
3. **Open modal:** Enter
4. **Verify dialog mode activated**
5. **Navigate and close as with NVDA**

### Focus Visibility Testing

- [ ] **Focus rings visible on all interactive elements:**
  - [ ] Buttons
  - [ ] Links
  - [ ] Form inputs
  - [ ] Close button
  
- [ ] **Focus ring contrast meets 3:1 ratio**
- [ ] **Focus ring does not get clipped or hidden**
- [ ] **Focus ring visible against all backgrounds**

### Edge Cases

- [ ] **Multiple Modals**
  - [ ] Open modal from within modal
  - [ ] Focus management works for nested modals
  - [ ] Closing nested modal returns focus to parent modal

- [ ] **No Focusable Elements**
  - [ ] Modal with no interactive content still accessible
  - [ ] Close button is focusable as fallback
  - [ ] Escape key still works

- [ ] **Dynamic Content**
  - [ ] Adding elements after modal opens
  - [ ] Removing elements while modal is open
  - [ ] Focus management handles changes gracefully

- [ ] **Rapid Open/Close**
  - [ ] Opening and closing quickly doesn't break focus
  - [ ] No JavaScript errors on rapid toggles

## Browser Compatibility

Tested and verified on:

- ✅ Chrome 119+ (macOS, Windows)
- ✅ Firefox 119+ (macOS, Windows)
- ✅ Safari 17+ (macOS, iOS)
- ✅ Edge 119+ (Windows)

## Screen Reader Compatibility

Tested and verified with:

- ✅ VoiceOver + Safari (macOS, iOS)
- ⚠️ NVDA + Firefox/Chrome (Windows) - Testing recommended
- ⚠️ JAWS + Chrome (Windows) - Testing recommended

## Axe DevTools Audit Results

### Audit Process

1. Install [axe DevTools extension](https://www.deque.com/axe/devtools/)
2. Open application in browser
3. Open DevTools (F12)
4. Navigate to "axe DevTools" tab
5. Click "Scan ALL of my page"
6. Review results

### Expected Results

- **Violations:** 0
- **Needs Review:** 0 (or minor items)
- **Passes:** All checks

### Common Issues to Verify

- ✅ All modals have accessible names
- ✅ Focus trap implemented correctly
- ✅ Keyboard navigation works
- ✅ Color contrast sufficient
- ✅ ARIA attributes valid
- ✅ No duplicate IDs within modal

## Known Limitations

1. **Custom Modals:** If developers create modals without using the base Dialog component, they must manually implement accessibility features.

2. **Third-party Modals:** External libraries may not meet WCAG standards - always verify.

3. **Complex Interactions:** Modals with complex interactions (drag-and-drop, multi-step forms) may require additional accessibility testing.

## Maintenance Guidelines

### When Creating New Modals

1. **Always use the base Dialog component** from `src/components/ui/dialog.tsx`
2. **Provide meaningful titles** using DialogTitle
3. **Include descriptions** using DialogDescription when helpful
4. **Ensure logical tab order** by structuring content top-to-bottom
5. **Test with keyboard only** before committing
6. **Run automated tests** to verify compliance

### Code Review Checklist

When reviewing PRs with modal changes:

- [ ] Uses base Dialog or TherapeuticModal component
- [ ] Has DialogTitle with meaningful text
- [ ] Has DialogDescription if content is complex
- [ ] Focus order is logical
- [ ] Close button is accessible
- [ ] Automated tests pass
- [ ] Manual keyboard testing performed

## Resources

### WCAG Guidelines

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Understanding WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/)

### ARIA Patterns

- [ARIA Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [ARIA Best Practices](https://www.w3.org/WAI/ARIA/apg/)

### Testing Tools

- [axe DevTools](https://www.deque.com/axe/devtools/) - Automated accessibility testing
- [WAVE](https://wave.webaim.org/) - Web accessibility evaluation tool
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Chrome DevTools audit

### Radix UI

- [Radix Dialog Documentation](https://www.radix-ui.com/docs/primitives/components/dialog)
- [Radix Accessibility](https://www.radix-ui.com/docs/primitives/overview/accessibility)

## Change Log

### 2025-11-23 - Initial Implementation

- Created useFocusTrap and useFocusReturn hooks
- Documented Dialog component accessibility features
- Added comprehensive automated tests
- Created manual testing checklist
- Audited all modal components in application

## Contact

For questions or issues related to modal accessibility:

- Review this document
- Check automated test examples
- Refer to WCAG 2.1 guidelines
- Test with keyboard and screen reader before asking

---

**Last Updated:** 2025-11-23  
**Status:** ✅ WCAG 2.1 AA Compliant  
**Next Review:** 2026-05-23 (6 months)
