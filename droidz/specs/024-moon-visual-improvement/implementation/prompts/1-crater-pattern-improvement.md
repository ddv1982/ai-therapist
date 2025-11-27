We're continuing our implementation of Moon Visual Improvement by implementing task group number 1:

## Implement this task and its sub-tasks:

### Phase 1: Crater Pattern Improvement

#### Task 1.1: Update Crater Pattern Definition

- [ ] Locate the `<pattern id="craters">` definition (lines ~145-163)
- [ ] Replace circles with ellipses for organic shapes
- [ ] Increase pattern size from 50x50 to 60x60 to reduce visible repetition
- [ ] Add varied crater sizes (large, medium, small, tiny)

#### Task 1.2: Add Crater Shadows and Depth

- [ ] Add outer rim highlight (lighter ellipse offset up)
- [ ] Add crater bowl (main shape)
- [ ] Add inner shadow (darker ellipse offset down-left)
- [ ] Apply layered shadow technique to large and medium craters

#### Task 1.3: Verify Crater Appearance

- [ ] View moon at different phases (new, quarter, full, waning)
- [ ] Confirm no visible grid pattern
- [ ] Check opacity values look natural

**Verification:**

```bash
npm run dev
# Navigate to dashboard, observe moon at different times
```

## Understand the context

Read @droidz/specs/024-moon-visual-improvement/spec.md to understand the context for this spec and where the current task fits into it.

Also read these further context and reference:

- @droidz/specs/024-moon-visual-improvement/planning/requirements.md
- @droidz/specs/024-moon-visual-improvement/planning/visuals

## Perform the implementation

Implement the crater pattern improvements in `src/features/chat/components/dashboard/realistic-moon.tsx`.

Use the code snippet from spec.md as reference for the improved crater pattern.

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
