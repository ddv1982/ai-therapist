# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the AI Therapist application.

## What is an ADR?

An Architecture Decision Record is a document that captures an important architectural decision made along with its context and consequences.

## ADR Template

When creating a new ADR, use the following template:

```markdown
# ADR-XXX: [Short Title]

## Status

[Proposed | Accepted | Deprecated | Superseded by ADR-XXX]

## Date

YYYY-MM-DD

## Context

What is the issue that we're seeing that is motivating this decision or change?

## Decision

What is the change that we're proposing and/or doing?

## Consequences

### Positive

- Benefit 1
- Benefit 2

### Negative

- Drawback 1
- Drawback 2

### Neutral

- Trade-off 1

## Alternatives Considered

What other options were considered and why were they rejected?

## References

- Links to relevant resources
```

## Index

| ADR                                                 | Title                       | Status   | Date       |
| --------------------------------------------------- | --------------------------- | -------- | ---------- |
| [ADR-001](./ADR-001-convex-backend.md)              | Convex Backend              | Accepted | 2024-11-25 |
| [ADR-002](./ADR-002-clerk-authentication.md)        | Clerk Authentication        | Accepted | 2024-11-25 |
| [ADR-003](./ADR-003-component-architecture.md)      | Component Architecture      | Accepted | 2024-11-25 |
| [ADR-004](./ADR-004-error-tracking-evaluation.md)   | Error Tracking Evaluation   | Accepted | 2024-11-25 |
| [ADR-005](./ADR-005-modular-monolith-boundaries.md) | Modular Monolith Boundaries | Accepted | 2026-02-08 |

## Guidelines

1. **Numbering**: ADRs are numbered sequentially (ADR-001, ADR-002, etc.)
2. **Immutability**: Once accepted, ADRs should not be modified. If a decision changes, create a new ADR that supersedes the old one.
3. **Status Lifecycle**:
   - `Proposed` → Initial state for new decisions
   - `Accepted` → Decision has been approved
   - `Deprecated` → Decision is no longer relevant
   - `Superseded` → Replaced by a newer ADR
4. **Conciseness**: Keep ADRs focused and to the point. Link to external docs for implementation details.
