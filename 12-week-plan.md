# 12-week build plan — Hospigrow Rural

This is a realistic plan to take the v0.2 scaffold to a working, ABDM-certified, rural-deployed product. Hand this to your developer. Tasks are sized for one mid/senior full-stack developer working full-time.

**Doctor's role:** clinical workflows, language review, field testing, NHA paperwork, hospital agreements. Avoid getting drawn into code review.

**Developer's role:** execute the plan. Each week ends with a demo to you so you can validate clinical fitness.

---

## Week 1 — Foundation & local stack

**Goal:** developer can run everything locally and sign in to all apps.

- [ ] Clone repo, run `make install && make up && make dev`
- [ ] Verify all 4 apps load and authenticate against Keycloak
- [ ] Create real users in Keycloak (replace the demo accounts)
- [ ] Hook middleware to your real GNU Health and ERPNext (set env vars)
- [ ] Verify a real GNU Health patient appears in the Hospital app's patient list
- [ ] Set up GitHub repo, Sentry, basic monitoring

**Demo:** doctor logs in, sees real patient list from GNU Health.

---

## Week 2 — Patient creation end-to-end

**Goal:** receptionist can create a patient and they appear in both GNU Health and ERPNext.

- [ ] Patient creation form in Staff app
- [ ] Wire saga worker (Celery) — async ERPNext customer creation
- [ ] Idempotency cache in Redis
- [ ] Audit log persistence to Postgres
- [ ] Reconciliation report (entities present in one system but not other)

**Demo:** receptionist creates a patient; doctor sees them in Hospital app within 10 seconds; ERPNext shows a Customer.

---

## Week 3 — Encounter / vitals workflow

**Goal:** nurse can record vitals offline; they sync when online.

- [ ] Encounter create/list/detail in Hospital app
- [ ] All vitals (BP, HR, SpO2, temp, RR, weight, height) with LOINC codes
- [ ] Offline encounter creation (currently only vitals queue)
- [ ] Sync queue UI showing pending count and conflict resolution
- [ ] Service worker with Workbox precache + runtime cache strategies

**Demo:** nurse turns off Wi-Fi, records vitals on 5 patients, turns Wi-Fi back on, watches them sync.

---

## Week 4 — ABDM M1: ABHA integration

**Goal:** patient gets an ABHA ID linked to their record.

- [ ] Register your hospital on the ABDM Health Facility Registry (HFR)
- [ ] Register doctors on Healthcare Professional Registry (HPR)
- [ ] Sandbox credentials from sandbox.abdm.gov.in
- [ ] ABHA creation flow (Aadhaar + OTP) in Patient app
- [ ] ABHA verification in Staff app
- [ ] Link ABHA to GNU Health patient (custom field via the middleware)
- [ ] QR code scanning for ABHA in Hospital app

**Doctor task this week:** complete HFR/HPR registrations (only you can do this).

**Demo:** patient creates an ABHA in the Patient app; receptionist verifies it via QR scan.

---

## Week 5 — ABDM M2 part 1: Care contexts

**Goal:** every encounter, lab, prescription is registered as an ABDM care context.

- [ ] Care context creation on every clinical event
- [ ] Patient discovery callback (`/v3/patient/care-context/on-discover`)
- [ ] Async response architecture (HTTP 202 then POST result)
- [ ] User-initiated linking (UI in Patient app)
- [ ] HIP-initiated linking (deep link from SMS to Patient app)

This is the hardest week. Budget 1.5x what you think.

---

## Week 6 — ABDM M2 part 2: FHIR bundles + Fidelius

**Goal:** when ABDM requests a patient's records, we send valid encrypted FHIR bundles.

- [ ] FHIR R4 bundle builders for: OPConsultation, DiagnosticReport, Prescription, DischargeSummary, ImmunizationRecord, HealthDocumentRecord, WellnessRecord
- [ ] NRCeS profile compliance — validate against IG
- [ ] **Fidelius encryption** — Curve25519 ECIES via BouncyCastle (use proven library; do not roll your own)
- [ ] Health information request handler (consent artefact validation, scope check, data push)
- [ ] Push retry with exponential backoff for transient failures

**Demo:** sandbox HIU requests records; we deliver them; HIU decrypts successfully.

---

## Week 7 — ABDM M3: HIU + consent

**Goal:** doctor can request and view records from another hospital.

- [ ] Consent init flow from Hospital app
- [ ] Consent status polling
- [ ] Health information request to other HIPs after consent grant
- [ ] Aggregated patient timeline view (internal records + external records, clearly labelled)
- [ ] Consent artefact storage with expiry tracking

**Demo:** doctor pulls a patient's previous records from a sandbox-mock other hospital.

---

## Week 8 — Indian languages + voice

**Goal:** ASHA workers and patients use the apps in their language.

- [ ] All 12 priority languages translated (use professional medical translators — not Google Translate)
- [ ] RTL layout testing for Urdu
- [ ] Voice input (Web Speech API) for symptom recording
- [ ] Voice playback for instructions (TTS)
- [ ] Number input in local digits (Devanagari, Bengali, etc.)

**Doctor task:** find translators. Government health translation glossaries help.

---

## Week 9 — Field Worker (ASHA) app + offline hardening

**Goal:** an ASHA in a village with no internet for 3 days can still serve patients.

- [ ] Field Worker app feature complete: enrollment, vitals, symptom checklist, referral
- [ ] Encrypted IndexedDB (WebCrypto AES-GCM with key derived from PIN+sub)
- [ ] Background sync via Service Worker Background Sync API
- [ ] Offline grant mechanism — extended auth window when offline (max 72hr)
- [ ] SMS fallback for critical actions (USSD-style)
- [ ] Print-friendly patient card with QR

**Demo:** put a tablet in airplane mode, do a full ASHA day's work, come back online, watch sync.

---

## Week 10 — IoT integration

**Goal:** ASHA pairs a Bluetooth BP cuff and SpO2 sensor; readings auto-record.

- [ ] BLE GATT profile support: BP cuff (0x1810), pulse oximeter (0x1822), glucose (0x1808), weight scale (0x181D), thermometer (0x1809)
- [ ] Web Bluetooth API integration in Field Worker app
- [ ] Frugal device support — ESP32-based homebrew via MQTT (Eclipse Mosquitto on a Raspberry Pi)
- [ ] FHIR Device + DeviceMetric resources in middleware
- [ ] Calibration tracking (when last calibrated, by whom)

---

## Week 11 — Hardening + accessibility audit + security

**Goal:** ready for clinical pilot.

- [ ] axe-core + manual a11y audit of all 4 apps
- [ ] WCAG 2.2 AA compliance verified
- [ ] Penetration test by an external firm (small scope, focused on auth + ABDM endpoints)
- [ ] Load test middleware to 100 concurrent users sustained
- [ ] Backup + DR drill executed
- [ ] Patient consent flows reviewed by legal counsel (DPDP Act compliance)

---

## Week 12 — Pilot prep + ABDM certification

**Goal:** apply for ABDM functional testing.

- [ ] STQC or CERT-IN engagement for Safe-to-Host certificate
- [ ] NHA functional testing in sandbox — all M1, M2, M3 test cases pass
- [ ] WASA (Web Application Security Audit) for production certification
- [ ] Pilot deployment at one rural facility
- [ ] User training videos in 5 languages
- [ ] Support runbook + first 30-day on-call schedule

---

## Months 4–6 (post-pilot)

After 4 weeks of pilot data and feedback:

- M4 / NHCX integration for insurance claims (PMJAY especially)
- Multi-hospital tenancy
- Telemedicine module (video consult)
- Imaging/DICOM integration (if needed)
- Specialty modules: maternal/child health (very rural-relevant), TB programme, NCD screening

---

## Cost ballpark (single rural deployment, AWS Mumbai)

| Item                                    | Monthly (INR) |
| --------------------------------------- | ------------- |
| Infrastructure (small ECS + RDS + ALB)  | ~₹25,000      |
| ABDM hosting requirements (compliant DC) | ~₹15,000      |
| Domain + email + SMS gateway            | ~₹5,000       |
| **Total infra**                         | **~₹45,000**  |
| Developer (mid-senior, full-time)       | ~₹1.2-2L      |
| ABDM consultant (week 4-7 only)         | ~₹50k-1L total |
| One-time STQC / WASA audit              | ~₹2-4L total  |
| Translators (12 languages, one-time)    | ~₹1-2L total  |

For a national-scale rollout to thousands of villages, those numbers go up but per-village cost drops dramatically due to shared infrastructure.

---

## What the doctor (you) does each week

You don't code. You:

1. Validate clinical workflows match how nurses/ASHAs actually work in your area
2. Recruit and train pilot users
3. Find translators; review their medical terminology
4. Sign HFR/HPR registrations (only you can do this)
5. Demo to potential funders / state health departments
6. **Ruthlessly cut scope** when the developer asks. Doctors love features. Developers love deadlines. The doctor's job in this partnership is to say "version 2" to anything that isn't critical for the first deployment.

Build trust by demoing weekly. Ship working software, even if narrow, every week. After 12 weeks you have a real product running in a real village.
