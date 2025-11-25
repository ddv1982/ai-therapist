# Implementation: Task Group 10 - Tooling & Developer Experience

## Task Assignment

### Task 10.1: Add Husky Pre-commit Hooks
- **Description**: Install and configure Husky for pre-commit validation.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] Husky installed and initialized
  - [ ] Pre-commit hook runs lint-staged
  - [ ] TypeScript check on commit
  - [ ] Can be bypassed with `--no-verify`
- **Complexity**: Small

### Task 10.2: Configure lint-staged
- **Description**: Set up lint-staged for efficient pre-commit checks.
- **Dependencies**: Task 10.1
- **Acceptance Criteria**:
  - [ ] TypeScript files: ESLint + Prettier
  - [ ] JSON/MD files: Prettier
  - [ ] Only staged files checked
  - [ ] Fast execution (< 10s)
- **Complexity**: Small

### Task 10.3: Configure Dependabot
- **Description**: Set up automated dependency updates.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] `.github/dependabot.yml` created
  - [ ] Weekly update schedule
  - [ ] Minor/patch grouped
  - [ ] Major updates separate
- **Complexity**: Small

### Task 10.4: Add Log Level Filtering
- **Description**: Make logging configurable by environment variable.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] `LOG_LEVEL` environment variable
  - [ ] Levels: debug, info, warn, error
  - [ ] Development defaults to debug
  - [ ] Production defaults to info
- **Complexity**: Small

### Task 10.5: Evaluate Error Tracking Service
- **Description**: Assess Sentry or similar for production error tracking.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] Options evaluated (Sentry, LogRocket, etc.)
  - [ ] Privacy implications documented
  - [ ] Cost analysis
  - [ ] Decision documented
- **Complexity**: Small

## Context Files

Read these for requirements and patterns:
- spec: `droidz/specs/022-codebase-improvement-plan/spec.md`
- requirements: `droidz/specs/022-codebase-improvement-plan/planning/requirements.md`
- tasks: `droidz/specs/022-codebase-improvement-plan/tasks.md`

Key files to study:
- `package.json` - Current scripts and dependencies
- `eslint.config.js` - ESLint configuration
- `.prettierrc` or prettier config - Prettier settings
- `src/lib/utils/logger.ts` - Logging implementation

## Instructions

1. Read spec and requirements for DX context
2. Install Husky and lint-staged as dev dependencies
3. Configure pre-commit hooks
4. Create Dependabot configuration
5. Update logger to support log levels
6. Document error tracking evaluation
7. Run tests: `npm run test`
8. Test pre-commit hooks work correctly
9. Mark tasks complete with [x] in `droidz/specs/022-codebase-improvement-plan/tasks.md`

## Standards

- Husky v9+ for modern hook management
- lint-staged for efficient pre-commit checks
- Keep pre-commit fast (< 10 seconds)
- Dependabot groups minor/patch updates
- Log levels follow standard convention (debug, info, warn, error)
