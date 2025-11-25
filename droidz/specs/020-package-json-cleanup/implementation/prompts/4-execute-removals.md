# Implementation: Phase 4 - Execute Removals

## Task Assignment

### Task 4.1: Remove Batch 1 (Lowest Risk)

**Priority**: High | **Effort**: Small | **Risk**: Low

**Process**:

1. Remove packages: `npm uninstall pkg1 pkg2 pkg3`
2. Clean install: `rm -rf node_modules package-lock.json && npm install`
3. Run verification: tsc, lint, build, test
4. If all pass, commit
5. If failures, restore and document

### Task 4.2: Remove Batch 2

**Priority**: High | **Effort**: Small | **Risk**: Low-Medium

Follow same process as Batch 1

### Task 4.3: Remove Batch 3

**Priority**: Medium | **Effort**: Small | **Risk**: Medium

Follow same process with extra caution

### Task 4.4: Remove Remaining Batches

**Priority**: Medium | **Effort**: Variable | **Risk**: Variable

Continue batch removal process

---

## Context Files

Read these for requirements and patterns:

- spec: droidz/specs/020-package-json-cleanup/spec.md
- requirements: droidz/specs/020-package-json-cleanup/planning/requirements.md
- tasks: droidz/specs/020-package-json-cleanup/tasks.md
- Removal plan from Phase 3: dependency-cleanup-report.md

## Instructions

1. Read the removal plan from Phase 3
2. For EACH batch, execute in order:
   a. Remove packages with npm uninstall
   b. Clean install
   c. Run verification (tsc, lint, build, test)
   d. If success: commit with clear message
   e. If failure: restore package and document why needed
3. After EACH batch, verify before continuing
4. Update dependency-cleanup-report.md with results
5. Mark tasks complete with [x] in droidz/specs/020-package-json-cleanup/tasks.md

## Verification Commands

After each batch:

```bash
npx tsc --noEmit  # Type check
npm run lint       # Lint
npm run build      # Build
npm test          # Tests
```

## Standards

Follow all standards in:

- /Users/vriesd/projects/ai-therapist/AGENTS.md

## Important Notes

- Remove packages in batches as planned in Phase 3
- ALWAYS verify after each batch before continuing
- Commit after each successful batch
- If ANY verification fails, restore the package immediately
- Document WHY package was restored (what failed)
- Be conservative - if uncertain, keep the package
- Test thoroughly after each removal
