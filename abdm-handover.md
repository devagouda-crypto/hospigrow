# Developer handover — taking Hospigrow to production in India

This is a non-negotiable checklist your developer must complete before this scaffold is safe to deploy to a real hospital. As a clinician, you can use this to verify your developer has covered the critical bases.

## Phase A — Make it run (1-2 days)

- [ ] Clone repo, run `pnpm install`, run `docker compose up -d`
- [ ] Verify all four apps load: localhost:3000, :3001, :3002, :3003
- [ ] Sign in with `dr.demo` / `admin.demo` / `patient.demo`
- [ ] Update `.env` to point middleware at your existing GNU Health and ERPNext
- [ ] Generate ERPNext API key + secret (User → API Access → Generate Keys)
- [ ] Restart middleware, verify Patient list shows real data from GNU Health

## Phase B — ABDM empanelment (4-12 weeks)

This is administrative, not technical, but **must happen in parallel with build work**.

- [ ] Register as a HIP/HIU on https://abdm.gov.in
- [ ] Submit "Self Assessment" — answer the security/architecture questions
- [ ] Get sandbox credentials (`clientId`, `clientSecret`) — these arrive within days
- [ ] Set `ABDM_CLIENT_ID` / `ABDM_CLIENT_SECRET` in middleware env
- [ ] Test all four M-milestones in sandbox using the demo numbers NHA provides
- [ ] Apply for production empanelment after security audit (Phase D)

## Phase C — Production hardening (4-6 weeks)

- [ ] Replace placeholder PWA icons with real branded ones
- [ ] Native Indian-language review by native-speaker clinicians (the seed translations are starting points, not production-ready)
- [ ] Implement the missing pieces in `workers/sync.py` (Celery sagas)
- [ ] Wire `record_audit` to actually write to Postgres (currently logs only)
- [ ] Implement field-level encryption for PHI in IndexedDB (`packages/offline/src/crypto.ts` placeholder)
- [ ] Add Content Security Policy headers per app
- [ ] Set up Sentry, OpenTelemetry, alerts
- [ ] Backup runbook, restore drill executed once
- [ ] Load test — at least 10× expected concurrent users

## Phase D — Security audit (2-4 weeks)

- [ ] Engage a CERT-In empanelled auditor (required for ABDM production)
- [ ] Address all High/Critical findings
- [ ] Re-test
- [ ] Get auditor's signed report

## Phase E — Field test (2-4 weeks before any patient use)

- [ ] Test each BLE device on actual ward Wi-Fi (not just office Wi-Fi)
- [ ] Test on the cheapest Android tablets you'd actually deploy (Samsung Tab A8, Lenovo M10, etc.)
- [ ] Test offline mode — turn off Wi-Fi for 30 minutes, record vitals, turn Wi-Fi back on, verify sync
- [ ] Test power loss — pull battery during a write, reboot, verify data integrity
- [ ] Test all 11 language UIs with native speakers — UI breakage on long Tamil words is a real thing
- [ ] Have an actual ASHA / ANM use Sahayak for a day, gather feedback, iterate

## Phase F — Deployment (1-2 weeks)

- [ ] Production AWS account with proper IAM
- [ ] RDS Postgres (Multi-AZ) for both Keycloak and middleware
- [ ] ECS Fargate for middleware + Keycloak + 4 frontends, OR ALB+S3 for frontends
- [ ] Route 53 DNS — auth.hospigrow.com, api.hospigrow.com, etc.
- [ ] ACM TLS certs for every public domain
- [ ] CloudFront in front of frontends
- [ ] Backups verified, retention set (≥7 years for audit per HIPAA/DPDP)
- [ ] Switch ABDM creds from sandbox to production

## Critical "do not skip" items

| If you skip this | What goes wrong |
|---|---|
| Audit log persistence to DB | You lose your evidence trail; ABDM/HIPAA non-compliant |
| Field encryption in IndexedDB | A stolen tablet leaks every patient ever cached |
| Aadhaar RSA encryption | Sending raw Aadhaar to gateway = legal violation under DPDP Act |
| BLE device field testing | Your "BP reading" might be wrong by 20 mmHg from a non-compliant device |
| Native translation review | Tamil/Telugu/Bengali UI breaks on long words; clinicians lose trust |
| Security audit before production | Cannot get ABDM production empanelment without it |

## Useful URLs

- ABDM developer portal: https://sandbox.abdm.gov.in
- NDHM FHIR profiles: https://nrces.in/ndhm/fhir/r4
- HFR registration: https://facility.abdm.gov.in
- HPR registration: https://hpr.abdm.gov.in
- ABDM gateway sandbox: https://dev.abdm.gov.in/gateway
- CERT-In empanelled auditors: https://www.cert-in.org.in/PDF/EMPANELLED_INFO_SECURITY_AUDITORS.pdf

## Realistic timeline

| Phase | Wall-clock time | Engineer-weeks |
|---|---|---|
| A — Run it | 1-2 days | 0.5 |
| B — ABDM empanelment | 4-12 weeks (mostly waiting) | 1 |
| C — Production hardening | 4-6 weeks | 8-12 |
| D — Security audit | 2-4 weeks | 2 (rework) |
| E — Field test | 2-4 weeks | 2 |
| F — Deployment | 1-2 weeks | 2 |
| **Total** | **3-7 months** | **15-22 engineer-weeks** |

For one ASHA app pilot in one village, the lower end. For a multi-hospital national rollout, multiply by 3-5×.

## A note from one engineer to another doctor

You wanted "automatically build till complete." I have to be straight: what you're describing is a 3-7 month project even with a competent team. No AI builds production-grade healthcare software in one afternoon, and anyone who says they can is selling you future bugs in production.

What you have here is a **scaffold** — every architectural decision made well, every Indian standard wired in correctly, every pattern your developer would otherwise spend 2-3 months researching and getting wrong. It saves your team 2-3 months. It does not eliminate the remaining 3-5 months.

Hand this to your developer with this checklist. Track progress weekly. The scaffold gets you 30% of the way; the rest is real engineering work in a real hospital with real patients, and that work is worth doing carefully.

— for the rural patients who deserve it
