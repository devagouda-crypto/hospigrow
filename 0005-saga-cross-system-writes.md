# ADR-0005: Saga pattern for cross-system writes

Date: 2026-05-06
Status: Accepted

## Context

Some operations must affect both backends. Example: creating a patient should result in:
1. A `gnuhealth.patient` + `party.party` in GNU Health.
2. An ERPNext `Customer` linked to the same person, so they can be billed.

There is no shared transaction across the two HTTP APIs. Failure modes:
- GNU Health write succeeds, ERPNext write fails → orphan clinical record.
- ERPNext write succeeds, GNU Health write fails → orphan customer.
- Both succeed, mapping write fails → drift between systems.

## Decision

We use a **saga pattern** with a clear primary/secondary distinction:

1. The middleware identifies a **source of truth** for each entity (patient → GNU Health). The primary write goes there synchronously and must succeed; if it fails, the whole operation fails.
2. The secondary write is enqueued as a **Celery task** that retries with exponential backoff. The endpoint returns 201 to the caller as soon as the primary succeeds — the secondary is best-effort.
3. The mapping (GNU Health party_id ↔ ERPNext customer_id) is stored in the middleware's Postgres on success of the secondary.
4. Idempotency-Key headers on the original request prevent duplicate primary writes if the client retries.
5. After max retries (default 5), the secondary write is flagged for human reconciliation. A daily report surfaces these.

## Consequences

**Positive:**

- Caller gets a fast, reliable response — they don't wait on ERPNext.
- Failures are eventually consistent, not lost.
- Each system's failure modes are isolated.
- Clear ownership: GNU Health owns clinical truth, ERPNext owns operational truth.

**Negative:**

- A patient might exist in GNU Health but not yet in ERPNext for a few seconds (or longer if ERPNext is down). Billing flows must handle "customer not yet present" gracefully — the Staff app re-fetches when an invoice is requested for a patient without an `erpnextCustomerId`.
- Reconciliation is a real operational task, not theoretical. We must build a reconciliation UI for hospital admins.
- Compensating transactions (e.g., delete the GNU Health patient if ERPNext irrecoverably fails) are intentionally NOT implemented for clinical data — partial-state is preferable to data loss in healthcare.

## Alternatives considered

- **Two-phase commit across HTTP** — fairy-tale level of unreliable. Both backends would need a 2PC coordinator and they don't natively support one.
- **Synchronous chained writes with rollback** — the rollback is itself a network call that can fail. End up needing a saga anyway.
- **Event sourcing as the system of record** — the right answer if we owned both systems, but we don't. GNU Health and ERPNext have their own state.
