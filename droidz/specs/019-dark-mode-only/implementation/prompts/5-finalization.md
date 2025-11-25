# Implementation: Phase 5 - Finalization & Documentation

## Task Assignment

### Task 5.1: Final Code Cleanup

**Priority**: High | **Effort**: Small | **Risk**: Low

**Subtasks**:

- [ ] Run: `grep -r "dark:" src/` - should be zero or minimal results
- [ ] Run: `grep -r "useTheme\|next-themes" src/` - should be zero results
- [ ] Run: `npm run lint` - should pass with no warnings
- [ ] Run: `npx tsc --noEmit` - should compile cleanly

**Verification**:

```bash
npm run lint          # Pass
npx tsc --noEmit      # Pass
grep -r "dark:" src/  # Minimal or zero results
```

---

### Task 5.2: Update Documentation

**Priority**: Medium | **Effort**: Small | **Risk**: Low

**Files to update**:

- [ ] `/README.md` - Remove theme toggle instructions, add dark-mode-only note
- [ ] `/AGENTS.md` - Remove theme-related guidelines (if any)
- [ ] Add note about dark-mode-only decision

**Example README Update**:

```markdown
## Styling & Theme

The application uses a **dark mode only** design optimized for
therapeutic use and reduced eye strain. All colors are defined
using OKLCH color space for perceptual uniformity.

Colors are centralized in `/src/styles/base.css` using CSS
custom properties.
```

**Files Changed**:

- `/README.md` (modified)
- `/AGENTS.md` (modified if needed)

---

### Task 5.3: Pre-Deployment Checklist

**Priority**: High | **Effort**: Small | **Risk**: Low

**Checklist**:

- [ ] `npm run build` succeeds without warnings
- [ ] `npm run lint` passes
- [ ] `npx tsc --noEmit` succeeds
- [ ] `npm test` passes (all unit tests)
- [ ] No console errors on dashboard page
- [ ] Dark mode renders correctly in production build
- [ ] Bundle size reduced (verify in build output)
- [ ] No `next-themes` in `node_modules` after fresh install

---

### Task 5.4: Deployment & Monitoring

**Priority**: High | **Effort**: Small | **Risk**: Medium

**Note**: This task is for documentation only - actual deployment will be manual.

**Deployment Steps** (to document):

1. [ ] Merge PR to main branch
2. [ ] Deploy to staging environment (if applicable)
3. [ ] QA validation on staging
4. [ ] Deploy to production
5. [ ] Monitor for 24 hours

---

## Context Files

Read these for requirements and patterns:

- spec: droidz/specs/019-dark-mode-only/spec.md
- requirements: droidz/specs/019-dark-mode-only/planning/requirements.md
- tasks: droidz/specs/019-dark-mode-only/tasks.md

## Instructions

1. Read and analyze spec and requirements
2. Execute Task 5.1: Run all cleanup commands and verify results
3. Execute Task 5.2: Update documentation files
4. Execute Task 5.3: Complete pre-deployment checklist
5. Document Task 5.4: Prepare deployment notes
6. Ensure all verification commands pass
7. Mark tasks complete with [x] in droidz/specs/019-dark-mode-only/tasks.md

## Verification

Final verification checklist:

```bash
npm run lint          # Must pass
npx tsc --noEmit      # Must pass
npm test              # Must pass
npm run build         # Must succeed
grep -r "dark:" src/  # Should be minimal/zero
grep -r "next-themes" src/  # Should be zero
npm list next-themes  # Should be empty
```

## Standards

Follow all standards in:

- /Users/vriesd/projects/ai-therapist/AGENTS.md
- /Users/vriesd/projects/ai-therapist/droidz/standards/

## Important Notes

- All verification commands must pass before considering complete
- Documentation should be clear and accurate
- Leave deployment notes for manual execution
- Ensure README accurately reflects new dark-only approach
