# Implementation: Phase 3 - Component Class Simplification

## Task Assignment

### Task 3.1: Identify All Files with dark: Classes

**Priority**: High | **Effort**: Small | **Risk**: Low

**Subtasks**:

- [ ] Run: `grep -r "dark:" src/ --include="*.tsx" --include="*.ts" -l > dark-files.txt`
- [ ] Review list, estimate ~20-30 files
- [ ] Prioritize files by user-facing importance

---

### Task 3.2: Update High Priority Chat Components

**Priority**: High | **Effort**: Medium | **Risk**: Medium

**Components to update**:

1. `/src/features/chat/components/chat-composer.tsx`
2. `/src/features/chat/components/chat-header.tsx`
3. `/src/features/chat/components/dashboard/chat-sidebar.tsx`
4. `/src/features/chat/components/session-sidebar.tsx`
5. `/src/features/chat/components/dashboard/chat-empty-state.tsx`

**Transformation rules**:

- `bg-white dark:bg-black` → `bg-black`
- `bg-card/70 dark:bg-card/60` → `bg-card/60`
- `text-gray-900 dark:text-gray-100` → `text-gray-100`
- `shadow-sm dark:shadow-md` → `shadow-md`
- `hover:bg-gray-100 dark:hover:bg-gray-800` → `hover:bg-gray-800`

**Files Changed**: 5 chat component files

---

### Task 3.3: Update Medium Priority Therapy Components

**Priority**: Medium | **Effort**: Medium | **Risk**: Low

**Components to update**:

1. `/src/features/therapy/ui/therapy-card.tsx`
2. `/src/features/therapy/cbt/chat-components/action-plan.tsx`
3. `/src/features/therapy/cbt/chat-components/schema-modes.tsx`
4. `/src/features/therapy/cbt/components/draft-panel.tsx`
5. `/src/features/therapy/components/cbt-session-summary-card.tsx`

**Special attention**:

- Pay special attention to therapeutic color classes
- Ensure emotion colors remain distinguishable

**Files Changed**: 5 therapy component files

---

### Task 3.4: Update Remaining Components

**Priority**: Low | **Effort**: Medium | **Risk**: Low

**Components to update**:

- All remaining files from `dark-files.txt`
- Includes session controls, moon component, misc UI elements

**For each file**:

- [ ] Apply standard transformation rules
- [ ] Test if component is user-facing

**Files Changed**: ~10-20 remaining component files

---

### Task 3.5: Special Case - Realistic Moon Component

**Priority**: Low | **Effort**: Small | **Risk**: Low

**File**: `/src/features/chat/components/dashboard/realistic-moon.tsx`

**Subtasks**:

- [ ] Update SVG element classes with `dark:` variants
- [ ] Example: `fill-slate-700 dark:fill-slate-900` → `fill-slate-900`
- [ ] Test moon renders correctly on dashboard

**Files Changed**:

- `/src/features/chat/components/dashboard/realistic-moon.tsx`

---

## Context Files

Read these for requirements and patterns:

- spec: droidz/specs/019-dark-mode-only/spec.md
- requirements: droidz/specs/019-dark-mode-only/planning/requirements.md
- tasks: droidz/specs/019-dark-mode-only/tasks.md

## Instructions

1. Read and analyze spec, requirements
2. Execute Task 3.1 to identify all files with `dark:` classes
3. For Tasks 3.2-3.5, systematically update each component:
   - Read the component file
   - Find all `dark:` class variants
   - Keep only the dark mode variant (remove light mode)
   - Test component renders correctly with `npm run dev`
4. Apply transformation rules consistently across all files
5. Verify: `grep -r "dark:" src/ --include="*.tsx" -c` shows significantly reduced count
6. Mark tasks complete with [x] in droidz/specs/019-dark-mode-only/tasks.md

## Verification

After each component update:

```bash
npm run dev
# Navigate to the updated component
# Verify it renders correctly in dark mode
```

Final verification:

```bash
grep -r "dark:" src/ --include="*.tsx" -c
# Should show significantly reduced count or zero
```

## Standards

Follow all standards in:

- /Users/vriesd/projects/ai-therapist/AGENTS.md
- /Users/vriesd/projects/ai-therapist/droidz/standards/

## Important Notes

- Test each component after updating
- Keep commits focused (one component or group per commit)
- Preserve all functionality - only change styling
- Be careful with therapeutic and emotion colors
