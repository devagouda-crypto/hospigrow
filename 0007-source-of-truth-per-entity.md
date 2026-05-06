# ADR-0007: Single source of truth per entity

Date: 2026-05-06
Status: Accepted

## Context

GNU Health and ERPNext both have models that could plausibly be the home for shared concepts:

- GNU Health has `gnuhealth.health_professional`; ERPNext has `Employee`.
- GNU Health knows about `party.party` (which can be a patient); ERPNext knows about `Customer`.

If both could be authoritative, drift is inevitable: someone updates a phone number in ERPNext, someone else updates it in GNU Health, the values diverge, neither is "right."

## Decision

Every shared entity has **exactly one source of truth**, and the other system holds a synchronized linked record:

| Entity        | Source of truth | Mirror              | Reason                              |
| ------------- | --------------- | ------------------- | ----------------------------------- |
| Patient       | GNU Health      | ERPNext Customer    | Clinical history is the foundation  |
| Practitioner  | GNU Health      | ERPNext Employee    | License/qualification belongs there |
| Encounter     | GNU Health      | (none)              | Clinical only                       |
| Observation   | GNU Health      | (none)              | Clinical only                       |
| Invoice       | ERPNext         | (none)              | Operational; ERPNext owns billing   |
| Inventory     | ERPNext         | (none)              | Operational                         |
| Salary        | ERPNext         | (none)              | HR                                  |

The middleware has a small `entity_mapping` table in its Postgres recording the cross-system identifiers, but this is metadata — the data itself lives in one place.

## Consequences

**Positive:**

- No ambiguity about where to read or write.
- Reduced sync surface area.
- Each backend can be upgraded/migrated without coordinating with the other.

**Negative:**

- Some operations require multiple round-trips (e.g., generating an invoice needs the Patient from GNU Health and creates the Invoice in ERPNext).
- Field-level synchronization (e.g., when a patient updates their phone in the Patient app, both systems need it) requires a sync worker — not free.
- If the source-of-truth system is down, both reads and writes for that entity fail.

## Alternatives considered

- **Bidirectional sync, merge on conflict** — looks tempting, becomes a tar pit. Conflict resolution between two systems with different schemas, validation rules, and business logic is not solvable in the general case.
- **Master data management (MDM) layer** — appropriate for large enterprises with many systems; overkill for two.
- **Read from both, prefer most recent** — assumes clock sync and complete event history; we have neither.
