# ADR-005: Modular Monolith Boundaries and Strangler Migration

## Status

Accepted

## Date

2026-02-08

## Context

The codebase is functionally stable but maintainability is degraded by large orchestration routes,
layer leakage, and duplicated cross-cutting concerns (auth, error contracts, identity handling).

We need a sustainable architecture improvement path that preserves the existing product surface,
avoids rewrite risk, and can be delivered incrementally with strict guardrails.

## Decision

Adopt a modular monolith architecture with explicit layers under `src/server`:

1. `interface/http`: request parsing, validation wiring, response mapping only.
2. `application`: use-case orchestration.
3. `domain`: business rules, lifecycle/state invariants, core types.
4. `infrastructure`: adapters for external systems (Convex, Clerk, cache, AI providers).

Guardrails:

- Infrastructure must only be imported by application layer.
- Interface must not import infrastructure directly.
- Domain must remain free of infrastructure/interface dependencies.
- API response envelope remains unified (`ApiResponse`) for all outcomes.

Migration approach:

- Strangler pattern: keep existing API routes and move behavior behind application services in steps.
- No big-bang moves.
- Each phase requires green lint, tests, and contract checks before continuing.

## Consequences

### Positive

- Reduces coupling and route complexity.
- Improves testability of use-cases and domain rules.
- Makes contract drift easier to detect and prevent.
- Enables safer incremental modernization without product downtime.

### Negative

- Temporary duplication while old and new entrypoints coexist.
- Additional review overhead due to boundary enforcement and phased migrations.

### Neutral

- Some module movement is structural and does not change behavior.
- Existing routes remain stable while internals are refactored.

## Alternatives Considered

### Full Rewrite

Rejected due to high regression risk and long delivery window.

### Microservices Split

Rejected due to operational overhead and insufficient near-term benefit for current team size/scope.

## References

- `docs/adr/README.md`
- `docs/api.yaml`
- `__tests__/api/openapi-route-parity.test.ts`
