# Implementation: Phase 3 - Create Removal Plan

## Task Assignment

### Task 3.1: Compile Removal List
**Priority**: High | **Effort**: Medium | **Risk**: Low

**Subtasks**:
- [ ] Create/update dependency-cleanup-report.md
- [ ] List all packages analyzed (92 total)
- [ ] Categorize findings:
  - Safe to remove (no usage found)
  - Verify first (edge cases)
  - Keep (required)
  - Redundant (transitive dependencies)
- [ ] Prioritize removal by risk level
- [ ] Group into batches of 3-5 related packages

---

### Task 3.2: Risk Assessment
**Priority**: High | **Effort**: Small | **Risk**: Low

**Subtasks**:
- [ ] Assign risk level to each removal:
  - Low: Definitely unused, no config references
  - Medium: Appears unused, check configs
  - High: Security, auth, or core infra
- [ ] Order batches from low to high risk
- [ ] Document mitigation strategy for medium/high risk

---

## Context Files

Read these for requirements and patterns:
- spec: droidz/specs/020-package-json-cleanup/spec.md
- requirements: droidz/specs/020-package-json-cleanup/planning/requirements.md
- tasks: droidz/specs/020-package-json-cleanup/tasks.md
- Analysis from Phase 2: dependency-cleanup-report.md (if created)

## Instructions

1. Read all analysis outputs from Phase 2
2. Compile complete list of packages with removal decisions
3. Create removal batches organized by:
   - Related packages (same category)
   - Risk level (low risk first)
   - Dependencies on each other
4. Document justification for each removal
5. Create clear removal plan with ordered batches
6. Ensure plan is conservative and safe
7. Mark tasks complete with [x] in droidz/specs/020-package-json-cleanup/tasks.md

## Standards

Follow all standards in:
- /Users/vriesd/projects/ai-therapist/AGENTS.md

## Important Notes

- This phase is about planning, not execution
- Be conservative - better to keep than break
- Group related packages in same batch
- Order batches by risk (safest first)
- Document WHY each package is being removed
- Include verification steps for each batch
