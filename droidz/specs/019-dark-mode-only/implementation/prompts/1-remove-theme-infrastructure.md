# Implementation: Phase 1 - Remove Theme Infrastructure

## Task Assignment

### Task 1.1: Remove Theme Provider and Dependencies
**Priority**: High | **Effort**: Small | **Risk**: Low

**Subtasks**:
- [ ] Remove ThemeProvider from `/src/app/providers.tsx`
- [ ] Delete `/src/components/providers/theme-provider.tsx`
- [ ] Delete `/src/lib/theme-context.ts`
- [ ] Remove `next-themes` import statements from all files
- [ ] Run `npm uninstall next-themes`
- [ ] Verify `npm list next-themes` returns empty

**Files Changed**:
- `/src/app/providers.tsx` (modified)
- `/src/components/providers/theme-provider.tsx` (deleted)
- `/src/lib/theme-context.ts` (deleted)
- `package.json` (modified)

---

### Task 1.2: Remove Theme Toggle UI Component
**Priority**: High | **Effort**: Small | **Risk**: Low

**Subtasks**:
- [ ] Delete `/src/components/shared/theme-toggle.tsx`
- [ ] Remove ThemeToggle export from `/src/features/shared/index.ts`
- [ ] Remove ThemeToggle import and usage from `/src/features/chat/components/dashboard/chat-sidebar.tsx`
- [ ] Remove ThemeToggle import and usage from `/src/features/chat/components/session-sidebar.tsx`
- [ ] Search codebase for any other ThemeToggle references: `grep -r "ThemeToggle" src/`

**Files Changed**:
- `/src/components/shared/theme-toggle.tsx` (deleted)
- `/src/features/shared/index.ts` (modified)
- `/src/features/chat/components/dashboard/chat-sidebar.tsx` (modified)
- `/src/features/chat/components/session-sidebar.tsx` (modified)

---

### Task 1.3: Remove Command Palette Theme Option
**Priority**: Medium | **Effort**: Small | **Risk**: Low

**Subtasks**:
- [ ] Open `/src/components/ui/command-palette.tsx`
- [ ] Remove `onThemeToggle?: () => void` from CommandPaletteProps interface
- [ ] Remove theme toggle CommandItem (search for Moon icon)
- [ ] Remove any theme-related command logic
- [ ] Update components that pass `onThemeToggle` prop to CommandPalette

**Files Changed**:
- `/src/components/ui/command-palette.tsx` (modified)
- Any parent components passing `onThemeToggle` (modified)

---

## Context Files

Read these for requirements and patterns:
- spec: droidz/specs/019-dark-mode-only/spec.md
- requirements: droidz/specs/019-dark-mode-only/planning/requirements.md
- tasks: droidz/specs/019-dark-mode-only/tasks.md

## Instructions

1. Read and analyze spec, requirements, and tasks file
2. Study existing codebase patterns for the files mentioned
3. Implement all subtasks in Task 1.1, 1.2, and 1.3 following project standards
4. Run verification commands after each task:
   - After 1.1: `npx tsc --noEmit` and verify no theme errors
   - After 1.2: `grep -r "ThemeToggle" src/` should return no results
   - After 1.3: `grep -r "onThemeToggle" src/` should return no results
5. Mark tasks complete with [x] in droidz/specs/019-dark-mode-only/tasks.md

## Standards

Follow all standards in:
- /Users/vriesd/projects/ai-therapist/AGENTS.md
- /Users/vriesd/projects/ai-therapist/droidz/standards/

## Important Notes

- Keep commits focused on theme infrastructure removal
- Test that app still runs with `npm run dev` after changes
- Ensure no breaking changes to non-theme functionality
