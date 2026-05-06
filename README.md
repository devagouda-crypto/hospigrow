# Architecture Decision Records

We use lightweight ADRs to record significant decisions. Format:

```
# ADR-NNNN: Title
Date: YYYY-MM-DD
Status: Proposed | Accepted | Deprecated | Superseded by ADR-XXXX

## Context
What's the situation that demands a decision?

## Decision
What we decided.

## Consequences
What follows from this — good and bad.

## Alternatives considered
What we looked at and why we rejected them.
```

## Index

- [ADR-0001 — Use FHIR R4 as the wire format](./0001-use-fhir-as-wire-format.md)
- [ADR-0002 — Keycloak as identity provider](./0002-keycloak-as-idp.md)
- [ADR-0003 — Monorepo with Turborepo](./0003-monorepo-turborepo.md)
- [ADR-0004 — In-memory tokens, never localStorage](./0004-tokens-in-memory.md)
- [ADR-0005 — Saga pattern for cross-system writes](./0005-saga-cross-system-writes.md)
- [ADR-0006 — Local-first / offline architecture for Hospital app](./0006-offline-first-hospital.md)
- [ADR-0007 — Single source of truth per entity](./0007-source-of-truth-per-entity.md)
