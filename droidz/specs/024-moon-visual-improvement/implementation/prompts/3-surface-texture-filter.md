We're continuing our implementation of Moon Visual Improvement by implementing task group number 3:

## Implement this task and its sub-tasks:

### Phase 3: Surface Texture Filter

#### Task 3.1: Create Turbulence Filter

- [ ] Add new `<filter id="moon-texture">` to defs section
- [ ] Add `<feTurbulence>` with fractalNoise type
- [ ] Set baseFrequency="0.04 0.08" for asymmetric texture
- [ ] Set numOctaves="4" for complexity
- [ ] Add `<feBlend>` with overlay mode
- [ ] Add `<feGaussianBlur>` to soften

#### Task 3.2: Apply Filter to Craters

- [ ] Wrap crater pattern path in `<g filter="url(#moon-texture)">`
- [ ] Adjust crater opacity to work with filter (try 50%)
- [ ] Ensure mix-blend-mode="multiply" still applies

#### Task 3.3: Test Filter Performance

- [ ] Test on desktop Chrome, Safari, Firefox
- [ ] Test on mobile Safari (iOS)
- [ ] Test on Chrome Android
- [ ] If performance issues, add conditional rendering:
  ```tsx
  const skipFilter = prefersReducedMotion || isLowPerfDevice();
  ```

**Verification:**

```bash
npm run dev
# Test on multiple devices/browsers
# Check for any animation lag
```

## Understand the context

Read @droidz/specs/024-moon-visual-improvement/spec.md to understand the context for this spec and where the current task fits into it.

Also read these further context and reference:

- @droidz/specs/024-moon-visual-improvement/planning/requirements.md
- @droidz/specs/024-moon-visual-improvement/planning/visuals

## Perform the implementation

Implement the surface texture filter in `src/features/chat/components/dashboard/realistic-moon.tsx`.

Use the code snippet from spec.md (section 3.1) as reference for the feTurbulence filter.

**Important:** The component already uses `prefersReducedMotion` from Framer Motion. Leverage this for the performance fallback if needed.

## User Standards & Preferences Compliance

IMPORTANT: Ensure that your implementation work is ALIGNED and DOES NOT CONFLICT with the user's preferences and standards as detailed in the following files:

**Global Standards:**

- @droidz/standards/global/coding-style.md
- @droidz/standards/global/commenting.md
- @droidz/standards/global/conventions.md
- @droidz/standards/global/error-handling.md
- @droidz/standards/global/tech-stack.md
- @droidz/standards/global/validation.md

**Frontend Standards:**

- @droidz/standards/frontend/accessibility.md
- @droidz/standards/frontend/components.md
- @droidz/standards/frontend/css.md
- @droidz/standards/frontend/responsive.md
- @droidz/standards/frontend/routing.md

**Backend Standards:**

- @droidz/standards/backend/api.md
- @droidz/standards/backend/migrations.md
- @droidz/standards/backend/models.md
- @droidz/standards/backend/queries.md

**Testing Standards:**

- @droidz/standards/testing/test-writing.md
