# Implementation: Phase 1 - Preparation & Analysis

## Task Assignment

### Task 1.1: Setup and Backup
**Priority**: High | **Effort**: Small | **Risk**: Low

**Subtasks**:
- [ ] Create backup files: `cp package.json package.json.backup && cp package-lock.json package-lock.json.backup`
- [ ] Commit current state: `git add -A && git commit -m "chore: backup before dependency cleanup"`
- [ ] Install analysis tools: `npm install -g depcheck npm-check`
- [ ] Record baseline metrics (node_modules size, package count, install time)

---

### Task 1.2: Run Dependency Analysis Tools
**Priority**: High | **Effort**: Medium | **Risk**: Low

**Subtasks**:
- [ ] Run depcheck and save output: `depcheck --json > depcheck-report.json && depcheck`
- [ ] Generate import list from codebase:
  ```bash
  rg "^import .* from ['\"](.+)['\"]" --no-heading -r '$1' \
    src/ convex/ scripts/ __tests__/ e2e/ | sort -u > imports.txt
  ```
- [ ] Check dependency tree: `npm ls --all --json > dependency-tree.json`
- [ ] Review npm-check output: `npm-check --skip-unused`

---

### Task 1.3: Establish Baseline
**Priority**: High | **Effort**: Small | **Risk**: Low

**Subtasks**:
- [ ] Run full test suite and save results: `npm run qa:full 2>&1 | tee baseline-test-results.txt`
- [ ] Record metrics in cleanup-metrics.txt:
  - Current node_modules size
  - Total package count (dependencies + devDependencies)
  - Installation time
  - Test results summary

---

## Context Files

Read these for requirements and patterns:
- spec: droidz/specs/020-package-json-cleanup/spec.md
- requirements: droidz/specs/020-package-json-cleanup/planning/requirements.md
- tasks: droidz/specs/020-package-json-cleanup/tasks.md

## Instructions

1. Read and analyze spec, requirements, and tasks
2. Create backups of package.json and package-lock.json
3. Install analysis tools (depcheck, npm-check)
4. Run all analysis tools and save outputs
5. Establish baseline metrics and test results
6. Mark tasks complete with [x] in droidz/specs/020-package-json-cleanup/tasks.md

## Standards

Follow all standards in:
- /Users/vriesd/projects/ai-therapist/AGENTS.md
- /Users/vriesd/projects/ai-therapist/droidz/standards/

## Important Notes

- This is a preparatory phase - no packages should be removed yet
- All analysis outputs should be saved for review
- Baseline metrics are critical for measuring success
- Commit changes after creating backups
