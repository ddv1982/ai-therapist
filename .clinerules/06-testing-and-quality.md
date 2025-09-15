# Testing and Quality

- **Coverage Scope**
  - Unit tests for business logic.
  - Integration tests for API endpoints.
  - E2E tests for critical user flows (auth, CBT flow, chat).

- **Standards**
  - Write deterministic tests; avoid reliance on timing or network flakiness.
  - Keep fixtures and mocks reusable; prefer project `__tests__/utils` and helpers.

- **Documentation**
  - Update `docs/api.yaml` and any user-facing docs when API behavior changes.
  - Keep README sections accurate when changing top-level behaviors.

- **CI Discipline**
  - Do not merge with failing tests or type errors.
  - Keep generated API types up-to-date before merging.
