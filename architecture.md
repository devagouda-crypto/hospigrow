# Architecture

## Layered model

Hospigrow is structured as four concentric layers, each ignorant of layers above it:

1. **Backends of record** — GNU Health (clinical) and ERPNext (operational). Untouched by Hospigrow code; integrated as external systems via their public APIs.
2. **Middleware** — translates between FHIR R4 and the vendor schemas. Holds cross-system orchestration (sagas), audit logs, and the OpenAPI contract.
3. **Shared packages** — domain types, auth, API client, design system, offline runtime, i18n. Consumed by all apps.
4. **Frontend apps** — Hospital, Staff, Patient. Each a thin shell of role-specific UX over the shared packages.

The dependency direction is strict: apps depend on packages; packages depend on each other only as declared in their `package.json`; nothing depends on the apps.

## Why FHIR as the lingua franca

Both GNU Health and ERPNext have idiosyncratic schemas. If we'd built our middleware around either one's model, we'd be locked in. By making **FHIR R4** the wire format between middleware and frontends, the apps stay vendor-neutral. Swapping GNU Health for OpenMRS or Bahmni in the future means rewriting `app/services/gnuhealth.py` and `app/domain/mappers.py` — nothing else.

FHIR is also what every other healthcare system in the world speaks. National health information exchanges, government reporting endpoints, and lab interoperability all assume FHIR. Picking it now means we're already speaking the right language when those integrations come.

## Single source of truth per entity

| Entity        | Source of truth | Synchronized to                          |
| ------------- | --------------- | ---------------------------------------- |
| Patient       | GNU Health      | ERPNext (Customer record, for billing)   |
| Encounter     | GNU Health      | —                                        |
| Observation   | GNU Health      | —                                        |
| Condition     | GNU Health      | —                                        |
| Practitioner  | GNU Health      | ERPNext (Employee record, for HR)        |
| Appointment   | GNU Health      | —                                        |
| Invoice       | ERPNext         | —                                        |
| Employee      | ERPNext         | —                                        |
| Inventory     | ERPNext         | —                                        |

Mutations always write to the source of truth first. Synchronization to the secondary system runs as a Celery saga: best-effort, idempotent, retryable, with reconciliation alerts after exhausted retries.

## Authentication and authorization

**Authentication** — outsourced to Keycloak. Every request to the middleware carries a Bearer JWT signed by Keycloak; the middleware verifies the signature against Keycloak's JWKS (cached for 1 hour, invalidated on signature mismatch).

**Authorization** — performed in the middleware, not delegated to the backends. The middleware authenticates as a single service account to GNU Health and ERPNext, then enforces user-level permissions in its own dependency injection. This is simpler to audit than user-token impersonation and avoids needing two identity systems in the backends.

The role matrix lives in `packages/domain/src/roles.ts` (frontend) and `services/middleware/app/auth/deps.py` (backend). **Keep these in sync.** A test in CI should verify they match.

## Offline architecture (Hospital app)

Clinicians work in places with bad Wi-Fi. The Hospital app is **local-first**:

- **Read path** — cached in IndexedDB via Dexie. Service worker handles app shell + asset caching (Workbox). Stale-while-revalidate for patient lists.
- **Write path** — every mutation enqueued in IndexedDB with a client-generated UUID (which also serves as the `Idempotency-Key`). Background drain when online; exponential backoff on retry; conflict surfacing on 4xx.
- **Conflict policy** — clinical data never auto-merges. If two clinicians edited offline, both versions are surfaced and a human picks. Non-clinical edits are last-write-wins.

The Staff and Patient apps are online-first; they use TanStack Query's cache for snappy navigation but don't queue mutations.

## Observability

- **Logs** — structured JSON, correlated by trace_id (W3C Trace Context). Aggregation via Loki/ELK/CloudWatch.
- **Metrics** — Prometheus via `prometheus-fastapi-instrumentator` at `/metrics`. p50/p95/p99 latencies per route.
- **Traces** — OpenTelemetry, exported via OTLP to Jaeger/Tempo/X-Ray.
- **Errors** — Sentry SDK in middleware and frontends.
- **Audit** — separate stream from operational logs. Never deleted; retained ≥ 7 years.

## Failure modes we plan for

| Failure                                | Detection                       | Response                                                      |
| -------------------------------------- | ------------------------------- | ------------------------------------------------------------- |
| Keycloak unavailable                   | Middleware JWKS fetch fails     | Cached JWKS continues to validate tokens until cache expires  |
| GNU Health unavailable                 | 5xx / timeout                   | Read endpoints fail fast; writes queued via Celery for retry  |
| ERPNext unavailable                    | 5xx / timeout                   | Patient creation succeeds; Customer record reconciled later   |
| Both backends unavailable              | All API calls fail              | Apps surface "service degraded" banner; offline-cached reads continue |
| Middleware database unavailable        | SQL errors                      | Audit logs buffered to disk; reads return 503                 |
| Browser offline (Hospital app)         | `navigator.onLine === false`    | All reads from IndexedDB; writes enqueued; sync on reconnect  |

## What we explicitly chose against

- **GraphQL** — adds complexity; FHIR REST is simpler and what FHIR ecosystem expects.
- **Service mesh (Istio etc.)** — overkill for a 1-service backend.
- **Event sourcing** — interesting but multiplies the complexity of every cross-system mutation.
- **Microservices** — premature decomposition. The middleware is intentionally a monolith. Split only when scaling pain is real.
- **Direct DB access to GNU Health/ERPNext databases** — would couple us to vendor schemas and break upgrades.
