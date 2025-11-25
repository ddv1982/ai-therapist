# Implementation: Task Group 8 - Security Hardening

## Task Assignment

### Task 8.1: Create Shared Validation Schemas
- **Description**: Ensure client and server use identical validation schemas.
- **Dependencies**: Group 1 (typed schemas)
- **Acceptance Criteria**:
  - [ ] `src/lib/validation/schemas/` created
  - [ ] Message content schema shared
  - [ ] Metadata schema shared
  - [ ] Session schema shared
  - [ ] Documentation for adding new schemas
- **Complexity**: Medium

### Task 8.2: Align Convex Validators with Zod Schemas
- **Description**: Ensure Convex validators match Zod schemas exactly.
- **Dependencies**: Task 8.1
- **Acceptance Criteria**:
  - [ ] `convex/validators.ts` mirrors Zod schemas
  - [ ] Type tests verify alignment
  - [ ] No validation drift possible
  - [ ] CI check for schema parity
- **Complexity**: Medium

### Task 8.3: Document Input Sanitization Requirements
- **Description**: Create documentation for input handling and sanitization.
- **Dependencies**: Task 8.1
- **Acceptance Criteria**:
  - [ ] Sanitization rules documented
  - [ ] XSS prevention verified
  - [ ] SQL injection N/A (Convex)
  - [ ] Validation points mapped
- **Complexity**: Small

### Task 8.4: Evaluate Distributed Rate Limiting
- **Description**: Assess need for Redis-based rate limiting for horizontal scaling.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] Current rate limiting analyzed
  - [ ] Scaling requirements documented
  - [ ] Redis option evaluated (Upstash)
  - [ ] Decision and rationale documented
- **Complexity**: Medium

### Task 8.5: Add Rate Limit Response Headers
- **Description**: Include rate limit information in API responses.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] `X-RateLimit-Limit` header
  - [ ] `X-RateLimit-Remaining` header
  - [ ] `X-RateLimit-Reset` header
  - [ ] Client can react to limits
- **Complexity**: Small

### Task 8.6: Implement Progressive Rate Limiting (If Needed)
- **Description**: Add escalating penalties for repeated limit violations.
- **Dependencies**: Task 8.4
- **Acceptance Criteria**:
  - [ ] Progressive block durations
  - [ ] Abuse detection logging
  - [ ] Recovery path documented
  - [ ] Tests for penalty escalation
- **Complexity**: Medium

## Context Files

Read these for requirements and patterns:
- spec: `droidz/specs/022-codebase-improvement-plan/spec.md`
- requirements: `droidz/specs/022-codebase-improvement-plan/planning/requirements.md`
- tasks: `droidz/specs/022-codebase-improvement-plan/tasks.md`

Key files to study:
- `src/lib/api/rate-limiter.ts` - Current rate limiting
- `src/lib/api/middleware.ts` - API middleware
- `convex/schema.ts` - Convex validators
- `src/types/` - Type definitions

## Instructions

1. Read spec and requirements for security context
2. Study current validation and rate limiting patterns
3. Create shared schemas in `src/lib/validation/schemas/`
4. Ensure Convex validators align with Zod schemas
5. Add rate limit headers to middleware
6. Document security decisions
7. Run tests: `npm run test`
8. Mark tasks complete with [x] in `droidz/specs/022-codebase-improvement-plan/tasks.md`

## Standards

- Use Zod v4 for validation schemas
- Convex validators must mirror Zod exactly
- Rate limit headers follow standard format
- Document all security decisions
- No breaking changes to existing API
