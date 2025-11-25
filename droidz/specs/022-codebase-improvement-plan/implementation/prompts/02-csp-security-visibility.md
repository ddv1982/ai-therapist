# Implementation: Task Group 2 - CSP & Security Visibility

## Task Assignment

### Task 2.1: Create CSP Violation Reporting Endpoint

- **Description**: Implement API endpoint to receive and log CSP violation reports.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] `POST /api/csp-report` endpoint created
  - [ ] CSP violations logged with structured format
  - [ ] Rate limiting applied to prevent abuse
  - [ ] Non-verbose response (204 No Content)
- **Complexity**: Small

### Task 2.2: Configure CSP Report-To Header

- **Description**: Update middleware.ts to include CSP reporting directives.
- **Dependencies**: Task 2.1
- **Acceptance Criteria**:
  - [ ] `report-uri` directive points to `/api/csp-report`
  - [ ] `report-to` header configured
  - [ ] Report-Only mode tested first
  - [ ] Production CSP verified working
- **Complexity**: Small

### Task 2.3: Document CSP Exceptions

- **Description**: Create documentation explaining all CSP exceptions and why they're needed.
- **Dependencies**: Task 2.2
- **Acceptance Criteria**:
  - [ ] `src/lib/security/csp-config.ts` documents all exceptions
  - [ ] Clerk.com script requirements explained
  - [ ] `unsafe-inline` for styles justified
  - [ ] Development vs production differences noted
- **Complexity**: Small

### Task 2.4: Create CSP Monitoring Dashboard (Optional)

- **Description**: Add simple dashboard to view CSP violations in development.
- **Dependencies**: Task 2.1
- **Acceptance Criteria**:
  - [ ] Dev-only page to view recent violations
  - [ ] Violations grouped by directive
  - [ ] Clear button for testing
- **Complexity**: Medium

## Context Files

Read these for requirements and patterns:

- spec: `droidz/specs/022-codebase-improvement-plan/spec.md`
- requirements: `droidz/specs/022-codebase-improvement-plan/planning/requirements.md`
- tasks: `droidz/specs/022-codebase-improvement-plan/tasks.md`

Key files to study:

- `middleware.ts` - Current CSP implementation
- `src/lib/security/csp-nonce.ts` - CSP header generation
- `src/app/api/` - API route patterns

## Instructions

1. Read spec and requirements for security context
2. Study existing CSP implementation in `middleware.ts` and `src/lib/security/`
3. Implement tasks in order (2.1 through 2.4)
4. Test CSP violations are captured correctly
5. Verify existing security headers still work
6. Run tests: `npm run test`
7. Mark tasks complete with [x] in `droidz/specs/022-codebase-improvement-plan/tasks.md`

## Standards

- Follow existing API route patterns in `src/app/api/`
- Use structured logging with the existing logger
- Apply rate limiting to prevent abuse
- Keep CSP changes backward compatible
- Document all security decisions
