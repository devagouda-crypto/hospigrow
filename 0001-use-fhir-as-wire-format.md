# ADR-0001: Use HL7 FHIR R4 as the wire format

Date: 2026-05-06
Status: Accepted

## Context

We need to integrate two clinical/operational systems (GNU Health and ERPNext) and expose them to multiple frontend apps. Both backends have very different data models:

- GNU Health uses Tryton models (`gnuhealth.patient`, `party.party`, `gnuhealth.appointment`).
- ERPNext uses Frappe DocTypes (`Customer`, `Sales Invoice`, `Employee`).

Choices for the API contract between middleware and frontends:

1. Mirror GNU Health's schema.
2. Mirror ERPNext's schema.
3. Invent our own bespoke schema.
4. Use a healthcare interoperability standard.

## Decision

We use **HL7 FHIR R4** as the wire format and primary domain model.

The middleware translates between FHIR ↔ vendor schemas in `app/domain/mappers.py`. Every endpoint exposes FHIR-shaped resources. The shared domain package (`packages/domain`) defines TypeScript types directly aligned with FHIR R4.

## Consequences

**Positive:**

- Frontends are vendor-neutral. Swapping GNU Health for OpenMRS / Bahmni / OpenEMR means rewriting one mapper file, not the apps.
- We're already speaking the language of every external system that matters: national HIEs, lab interop networks, imaging systems, government reporting endpoints.
- New developers with healthcare background recognize the schema immediately.
- Easier compliance: regulators understand FHIR.

**Negative:**

- FHIR is verbose. A simple "Patient" has dozens of optional fields most of which we don't use. The domain types are heavier than they'd be in a bespoke schema.
- Some FHIR concepts don't map cleanly to GNU Health (e.g., FHIR's `Organization` hierarchy vs Tryton parties). We've used `_extensions` namespaces to capture vendor-specific bits without polluting standard FHIR.
- Initial learning curve for engineers unfamiliar with FHIR.

## Alternatives considered

- **Mirror GNU Health** — locks us in. Decision against.
- **Mirror ERPNext** — wrong domain entirely; ERPNext is operational, not clinical.
- **Bespoke schema** — gives short-term velocity but creates a maintenance burden forever and fails the day we need to integrate with anything else in healthcare.
