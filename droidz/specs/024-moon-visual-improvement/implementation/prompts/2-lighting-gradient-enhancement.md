We're continuing our implementation of Moon Visual Improvement by implementing task group number 2:

## Implement this task and its sub-tasks:

### Phase 2: Lighting Gradient Enhancement

#### Task 2.1: Update Primary Sphere Gradient

- [ ] Locate `<radialGradient id="moon-sphere">` (lines ~165-173)
- [ ] Increase gradient stops from 5 to 8 for smoother transitions
- [ ] Shift center from 45%,45% to 40%,40%
- [ ] Increase radius from 55% to 60%
- [ ] Update color stops: slate-50 → slate-600 progression

#### Task 2.2: Add Highlight Accent Gradient

- [ ] Create new `<radialGradient id="highlight-accent">`
- [ ] Position at 30%,30% with 40% radius
- [ ] Use white/20 → white/5 → transparent stops
- [ ] Add corresponding `<path>` using this gradient on lit portion

#### Task 2.3: Add Limb Darkening Gradient

- [ ] Create new `<radialGradient id="limb-darkening">`
- [ ] Position at center (50%,50%) with 50% radius
- [ ] Create edge darkening effect (transparent → black/30)
- [ ] Add corresponding `<circle>` overlay

#### Task 2.4: Add Atmospheric Glow Edge

- [ ] Create new `<radialGradient id="atmo-glow">`
- [ ] Create subtle primary color edge glow
- [ ] Add corresponding `<circle>` overlay

**Verification:**

```bash
npm run dev
# Check lighting appears more 3D and spherical
# Verify terminator line is softer
```

## Understand the context

Read @droidz/specs/024-moon-visual-improvement/spec.md to understand the context for this spec and where the current task fits into it.

Also read these further context and reference:

- @droidz/specs/024-moon-visual-improvement/planning/requirements.md
- @droidz/specs/024-moon-visual-improvement/planning/visuals

## Perform the implementation

Implement the lighting gradient enhancements in `src/features/chat/components/dashboard/realistic-moon.tsx`.

Use the code snippets from spec.md (sections 3.3 and 3.4) as reference for the gradient definitions.

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
