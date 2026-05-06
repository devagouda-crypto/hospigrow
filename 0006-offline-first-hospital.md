# ADR-0006: Local-first / offline architecture for Hospital app

Date: 2026-05-06
Status: Accepted

## Context

Clinicians use tablets in wards with patchy Wi-Fi. They cannot afford "loading…" spinners or, worse, lost data when the network drops mid-write. The Staff and Patient apps are used at desks or on personal phones with normal connectivity expectations — they don't need this complexity.

## Decision

The Hospital app is **local-first**:

1. **Reads** come from IndexedDB first, then refresh from the network in the background (stale-while-revalidate). On cold start with network, we hydrate from the API.
2. **Writes** go to IndexedDB first as `pending`, with optimistic UI updating immediately. A background sync queue drains them to the API.
3. **Idempotency-Key** = client-generated UUID = the queue entry's primary key. Safe retry guaranteed.
4. **Conflict policy**: clinical data never auto-merges. On 409 from the server, we surface both versions and require human resolution.
5. **Sync indicator** is always visible in the header — green (synced), blue (syncing), amber (offline with pending changes).

The Staff and Patient apps use TanStack Query's normal cache and don't queue mutations. Going offline in those apps just means the next interaction shows an error — acceptable for those use cases.

## Consequences

**Positive:**

- Clinicians can keep working through Wi-Fi outages.
- All writes are durable from the moment of input.
- Optimistic UI feels instant.
- Idempotent retries mean we never duplicate orders or vitals.

**Negative:**

- Significant added complexity in the Hospital app vs the others (different mental model, different bug surface).
- IndexedDB is unencrypted at rest — PHI exposure risk on a stolen device. Mitigation: field-level WebCrypto encryption (in roadmap, not yet implemented).
- Conflict UI is non-trivial. Has to be designed by clinical UX, not engineers.
- Storage quota: must monitor and prune old cached patients (LRU based on `lastAccessedAt`).

## Alternatives considered

- **Online-only** — unworkable in real wards.
- **Full local replication of the entire database** — would require copying all PHI to the device, including patients the clinician shouldn't see. Privacy nightmare. We deliberately cache only the patients the clinician has touched.
- **CouchDB / PouchDB replication** — proven pattern but introduces another database technology. Dexie + custom queue gives us enough.
- **RxDB with replication plugin** — heavier but battle-tested. Worth evaluating in Phase 1 of the roadmap if we hit pain points with the Dexie+custom approach.
