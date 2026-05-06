# Roadmap

This is the path from "scaffold" to "national deployment". Sequencing matters — items earlier in the list unblock items later.

## Phase 1 — Foundation hardening (4-6 weeks)

Goal: every architectural decision in production-ready shape.

- [ ] Implement audit log persistence to Postgres (currently logs only)
- [ ] Wire up the Celery saga worker for ERPNext customer creation
- [ ] Add idempotency-key cache in Redis (middleware deduplicates retries)
- [ ] Field-level encryption for PHI in IndexedDB (`packages/offline/src/crypto.ts`)
- [ ] Define and enforce CSP headers per app
- [ ] Set up Sentry on all services
- [ ] Set up OpenTelemetry traces flowing to Jaeger/Tempo
- [ ] Add Storybook to `packages/ui` with every component documented
- [ ] Cypress / Playwright e2e tests for the critical paths in each app
- [ ] Backup runbook + DR drill executed once

## Phase 2 — Clinical features MVP (8-12 weeks)

Goal: the Hospital app is usable for real clinical work.

- [ ] Patient creation flow (currently only list/detail)
- [ ] Encounter / visit lifecycle (start visit → record → close)
- [ ] Prescription module — RxNorm or ICD-11 linked drugs, allergies, basic interactions
- [ ] Lab order workflow — order → specimen → result → release
- [ ] Clinical notes (SOAP format) with autosave + offline support
- [ ] Patient timeline view (visits + observations + prescriptions chronologically)
- [ ] Appointment booking from the Hospital app
- [ ] Search across patients (Postgres FTS or OpenSearch)

## Phase 3 — Operations features MVP (6-10 weeks, parallelizable with Phase 2)

Goal: the Staff app replaces ERPNext UI for daily operations.

- [ ] Appointment calendar (week/day views, drag-to-reschedule)
- [ ] Billing flow — generate invoice from encounter
- [ ] Payment recording + receipt printing
- [ ] Staff directory + scheduling
- [ ] Inventory dashboard (read-only view of ERPNext inventory)
- [ ] Reports — revenue, utilization, staff productivity

## Phase 4 — Patient self-service (4-6 weeks)

Goal: the Patient app actually does useful things for patients.

- [ ] Appointment self-booking (with practitioner availability)
- [ ] View past visits + visit summaries
- [ ] View + download lab results
- [ ] View + pay invoices (Stripe / local payment gateway)
- [ ] Request medication refills
- [ ] Document uploads (insurance card, ID)

## Phase 5 — Imaging & advanced clinical (8-12 weeks)

- [ ] DICOMweb viewer integration (OHIF or Cornerstone)
- [ ] PACS integration
- [ ] Vital sign device integration (Bluetooth pulse ox, BP cuffs) via Web Bluetooth where supported
- [ ] Anaesthesia / surgery flow
- [ ] Admission / inpatient ward management

## Phase 6 — Multi-hospital / multi-tenant (6-10 weeks)

Required for national deployment. Demands big changes.

- [ ] Tenancy model: hospital_id on every resource
- [ ] Tenant-aware authentication (Keycloak realm per hospital, OR shared realm with `tenant_id` claim)
- [ ] Cross-tenant referrals (patient sees specialist at a different hospital)
- [ ] Per-tenant configuration (branding, languages, currency)
- [ ] Per-tenant billing and metrics

## Phase 7 — Compliance & accreditation (parallel with all of the above, ramping up)

- [ ] Penetration testing (annual + before each major release)
- [ ] WCAG 2.2 AA audit by external firm
- [ ] HIPAA / GDPR / DPDP Act compliance review
- [ ] NABH (India) / JCI (international) accreditation prep
- [ ] Privacy policy, terms of service, data processing agreements

## Phase 8 — National scale (6-10 weeks)

By the time you're here, expect to redo parts of the foundation.

- [ ] Move from single Postgres to sharded / replicated architecture
- [ ] CDN at the API layer (CloudFront in front of ALB)
- [ ] Read replicas for the middleware
- [ ] Per-region deployments
- [ ] Disaster recovery across regions
- [ ] Capacity planning + load testing
- [ ] 24/7 on-call rotation
- [ ] SLA documentation

## What this scaffold deliberately doesn't do

- Email sending (use SES / SendGrid; integrate via Celery task)
- SMS sending (use SNS / Twilio; same pattern)
- Push notifications (web push is fiddly; consider a managed service)
- Chat / messaging between staff (use Slack / Teams / dedicated tool)
- Telemedicine / video calls (integrate Daily.co / Vonage / Twilio Video)
- Rich PDF reporting (jsPDF or server-side wkhtmltopdf when needed)

These are all addable but not foundational — build them when you have a real user need, not speculatively.
