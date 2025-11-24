# Implementation: Phase 2 - CSS Variable Consolidation

## Task Assignment

### Task 2.1: Consolidate Dark Mode Variables to :root
**Priority**: High | **Effort**: Medium | **Risk**: Medium

**Subtasks**:
- [ ] Open `/src/styles/base.css`
- [ ] Copy all variables from `.dark { ... }` block
- [ ] Replace entire `:root { ... }` block with dark mode variables
- [ ] Delete the entire `.dark { ... }` class block
- [ ] Delete `@media (prefers-color-scheme: light) { ... }` block
- [ ] Preserve typography rules (h1-h6, p, li, etc.)
- [ ] Preserve accessibility media queries (`prefers-reduced-motion`)
- [ ] Keep safe area insets in body styles

**Key Variables to Move**:
```css
/* Backgrounds */
--background: oklch(0.12 0.01 250);
--card: oklch(0.14 0.01 250);
--popover: oklch(0.14 0.01 250);

/* Text */
--foreground: oklch(0.98 0.005 250);

/* Accents */
--primary: oklch(0.7 0.15 237);
--accent: oklch(0.65 0.12 152);

/* Therapeutic colors */
--therapy-success: oklch(0.7 0.12 142);
--therapy-warning: oklch(0.8 0.12 85);
--therapy-info: oklch(0.75 0.12 237);

/* All 8 emotion colors */
--emotion-fear: oklch(0.7 0.12 200);
--emotion-anger: oklch(0.7 0.2 25);
--emotion-sadness: oklch(0.7 0.12 255);
--emotion-joy: oklch(0.8 0.16 95);
--emotion-anxiety: oklch(0.78 0.14 80);
--emotion-shame: oklch(0.78 0.16 350);
--emotion-guilt: oklch(0.7 0.14 285);
/* + remaining emotion color */

/* Shadows */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 8px -2px rgba(0, 0, 0, 0.4);
/* etc... */
```

**Files Changed**:
- `/src/styles/base.css` (modified - major restructure)

---

### Task 2.2: Verify Tailwind Theme Registration
**Priority**: Medium | **Effort**: Small | **Risk**: Low

**Subtasks**:
- [ ] Open `/src/app/globals.css`
- [ ] Verify `@theme` block exists and maps CSS variables
- [ ] Confirm all color names match updated `:root` variables
- [ ] No changes needed unless variable names changed

**Files Changed**:
- `/src/app/globals.css` (likely no changes needed)

---

## Context Files

Read these for requirements and patterns:
- spec: droidz/specs/019-dark-mode-only/spec.md
- requirements: droidz/specs/019-dark-mode-only/planning/requirements.md
- tasks: droidz/specs/019-dark-mode-only/tasks.md

## Instructions

1. Read and analyze spec, requirements, and current CSS structure
2. Carefully read `/src/styles/base.css` to understand current variable structure
3. Implement Task 2.1 by moving ALL `.dark` variables to `:root`
4. Delete light mode blocks completely
5. Preserve all non-color-related CSS (typography, accessibility, etc.)
6. Verify Task 2.2 - check that Tailwind theme registration is intact
7. Test visual appearance: `npm run dev` and verify dark colors render
8. Mark tasks complete with [x] in droidz/specs/019-dark-mode-only/tasks.md

## Verification

After changes:
```bash
npm run dev  # Load app, verify dark colors render
# Visual check: backgrounds should be dark, text white
npm run build  # Should build without CSS errors
```

## Standards

Follow all standards in:
- /Users/vriesd/projects/ai-therapist/AGENTS.md
- /Users/vriesd/projects/ai-therapist/droidz/standards/

## Important Notes

- This is a critical phase - CSS changes affect entire app
- Take backup of base.css before making changes
- Ensure ALL emotion and therapy colors are preserved
- Test that therapeutic colors still work correctly
