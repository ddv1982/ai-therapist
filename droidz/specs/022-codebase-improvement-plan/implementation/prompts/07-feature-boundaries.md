# Implementation: Task Group 7 - Feature Boundaries & Components

## Task Assignment

### Task 7.1: Document Current Module Boundaries
- **Description**: Create documentation of current feature module responsibilities and overlaps.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] Current structure documented
  - [ ] Overlaps between chat and therapy-chat identified
  - [ ] Business logic locations mapped
  - [ ] Circular dependencies detected
- **Complexity**: Small

### Task 7.2: Define Target Feature Architecture
- **Description**: Design the target state for feature module organization.
- **Dependencies**: Task 7.1
- **Acceptance Criteria**:
  - [ ] Decision: consolidate vs separate
  - [ ] Target directory structure documented
  - [ ] Module responsibilities clearly defined
  - [ ] Migration path outlined
- **Complexity**: Medium

### Task 7.3: Consolidate or Clarify therapy-chat Module
- **Description**: Either merge `therapy-chat` into appropriate modules or clarify its boundaries.
- **Dependencies**: Task 7.2
- **Acceptance Criteria**:
  - [ ] `therapy-chat` either removed or justified
  - [ ] No overlapping responsibilities
  - [ ] Imports updated throughout
  - [ ] All tests pass
- **Complexity**: Large

### Task 7.4: Reorganize Component Directory
- **Description**: Restructure `src/components/ui/` from 48 flat files to organized subdirectories.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] `primitives/` - base shadcn components
  - [ ] `therapeutic/` - therapy-specific components
  - [ ] `composed/` - compound components
  - [ ] Index files for clean imports
  - [ ] All imports updated
- **Complexity**: Large

### Task 7.5: Standardize Component Naming
- **Description**: Apply consistent naming convention to all components.
- **Dependencies**: Task 7.4
- **Acceptance Criteria**:
  - [ ] PascalCase for component files
  - [ ] Consistent therapeutic component prefix
  - [ ] Directory names match component categories
  - [ ] Documentation updated
- **Complexity**: Medium

### Task 7.6: Create Feature Barrel Exports
- **Description**: Add index.ts files for clean feature imports.
- **Dependencies**: Task 7.3
- **Acceptance Criteria**:
  - [ ] Each feature has `index.ts`
  - [ ] Public API explicitly exported
  - [ ] Internal modules kept private
  - [ ] Import paths simplified
- **Complexity**: Small

## Context Files

Read these for requirements and patterns:
- spec: `droidz/specs/022-codebase-improvement-plan/spec.md`
- requirements: `droidz/specs/022-codebase-improvement-plan/planning/requirements.md`
- tasks: `droidz/specs/022-codebase-improvement-plan/tasks.md`

Key files to study:
- `src/features/` - Current feature structure
- `src/features/chat/` - Chat feature
- `src/features/therapy/` - Therapy feature
- `src/features/therapy-chat/` - Overlapping module
- `src/components/ui/` - 48 component files

## Instructions

1. Read spec and requirements for architecture context
2. Map current dependencies between modules
3. Document findings in `docs/architecture/`
4. Create target structure documentation first
5. Refactor incrementally with tests passing after each change
6. Update all import paths
7. Run tests: `npm run test`
8. Run type check: `npx tsc --noEmit`
9. Mark tasks complete with [x] in `droidz/specs/022-codebase-improvement-plan/tasks.md`

## Standards

- No circular dependencies between features
- Clear public API via index.ts exports
- Keep internal modules private (no cross-feature imports of internals)
- Preserve kebab-case for files (existing ESLint rule)
- Update all imports - no broken references
