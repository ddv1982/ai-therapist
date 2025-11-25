# Implementation: Task Group 1 - TypeScript Strict Mode

## Task Assignment

### Task 1.1: Audit Current TypeScript Errors

- **Description**: Run `npx tsc --noImplicitAny` to identify all files with implicit any types and document the scope of work.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] Full list of files with `noImplicitAny` errors generated
  - [ ] Errors categorized by module (lib, features, hooks, etc.)
  - [ ] Estimated effort per module documented
- **Complexity**: Small

### Task 1.2: Define Metadata Type Schemas

- **Description**: Create proper TypeScript interfaces and Zod schemas for all metadata fields currently using `v.any()` in Convex schema.
- **Dependencies**: Task 1.1
- **Acceptance Criteria**:
  - [ ] `MessageMetadata` type defined with all valid fields
  - [ ] `ReportKeyPoint`, `TherapeuticInsight` types created
  - [ ] Zod schemas created that mirror the TypeScript types
  - [ ] Types exported from `src/types/therapy-metadata.ts`
- **Complexity**: Medium

### Task 1.3: Update Convex Schema Validators

- **Description**: Replace all `v.any()` usages in Convex schema with proper typed validators.
- **Dependencies**: Task 1.2
- **Acceptance Criteria**:
  - [ ] Zero `v.any()` in `convex/schema.ts`
  - [ ] `messageMetadataValidator` properly typed
  - [ ] `sessionReports` fields (keyPoints, therapeuticInsights, etc.) typed
  - [ ] All existing tests pass with new validators
- **Complexity**: Medium

### Task 1.4: Fix Implicit Any Errors in Hooks

- **Description**: Add proper type annotations to hooks directory files.
- **Dependencies**: Task 1.2
- **Acceptance Criteria**:
  - [ ] All files in `src/hooks/` pass `noImplicitAny`
  - [ ] Function parameters have explicit types
  - [ ] Return types documented where complex
  - [ ] No `as any` escape hatches added
- **Complexity**: Medium

### Task 1.5: Fix Implicit Any Errors in Features

- **Description**: Add proper type annotations to feature modules.
- **Dependencies**: Task 1.2
- **Acceptance Criteria**:
  - [ ] All files in `src/features/` pass `noImplicitAny`
  - [ ] Component props fully typed
  - [ ] Event handlers properly typed
- **Complexity**: Medium

### Task 1.6: Fix Implicit Any Errors in Lib/Utils

- **Description**: Add proper type annotations to library and utility files.
- **Dependencies**: Task 1.2
- **Acceptance Criteria**:
  - [ ] All files in `src/lib/` pass `noImplicitAny`
  - [ ] API response types complete
  - [ ] Utility function signatures typed
- **Complexity**: Medium

### Task 1.7: Enable noImplicitAny Permanently

- **Description**: Enable `noImplicitAny: true` in tsconfig.json and verify CI passes.
- **Dependencies**: Tasks 1.4, 1.5, 1.6
- **Acceptance Criteria**:
  - [ ] `tsconfig.json` has `noImplicitAny: true`
  - [ ] `npm run build` succeeds
  - [ ] `npx tsc --noEmit` passes
  - [ ] All 1529+ tests pass
- **Complexity**: Small

## Context Files

Read these for requirements and patterns:

- spec: `droidz/specs/022-codebase-improvement-plan/spec.md`
- requirements: `droidz/specs/022-codebase-improvement-plan/planning/requirements.md`
- tasks: `droidz/specs/022-codebase-improvement-plan/tasks.md`

## Instructions

1. Read and analyze spec, requirements for full context
2. Study existing codebase patterns in `src/types/`, `convex/schema.ts`
3. Run the TypeScript audit first to understand scope
4. Implement the tasks in order (1.1 through 1.7)
5. Run tests after each major change: `npm run test`
6. Run type check: `npx tsc --noEmit`
7. Mark tasks complete with [x] in `droidz/specs/022-codebase-improvement-plan/tasks.md`

## Standards

- Follow existing TypeScript patterns in the codebase
- Use Zod v4 for runtime validation schemas
- Convex validators should mirror Zod schemas
- No `as any` escape hatches - fix types properly
- Preserve all existing functionality
