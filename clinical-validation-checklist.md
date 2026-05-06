# Clinical validation checklist

A practical, printable checklist for **you, the doctor**, to walk through before letting any clinician use Hospigrow with real patients. No coding required — just click and observe.

This complements (does not replace) the engineer-side `docs/india/abdm-handover.md`.

## Setup (15 minutes, with your developer)

- [ ] Developer has run `docker compose up && pnpm dev`
- [ ] All four apps load in the browser:
  - Hospital → http://localhost:3000
  - Staff → http://localhost:3001
  - Patient → http://localhost:3002
  - Sahayak → http://localhost:3003
- [ ] You can sign in as `dr.demo` / `ChangeMe123!`
- [ ] You see the Indian patient list (Priya Sharma, Ramesh Patel, etc.)

If any of the above fails, **stop**. Fix with developer first.

---

## Block 1 — Hospital app (the doctor's workspace)

### 1A. Patient list

- [ ] Open `/patients` — list shows 10 demo patients with Indian names
- [ ] Search "Sharma" — list narrows to Priya Sharma
- [ ] Search "Mohammed" — finds Mohammad Ansari (fuzzy is OK)
- [ ] Clear search — full list returns
- [ ] Click any patient — chart opens

### 1B. Patient chart & vitals

- [ ] Patient name, age, gender display correctly
- [ ] No PHI is shown that you wouldn't expect (no "test debug data" leaks)
- [ ] Record a heart rate of `72` — see "Saving…" then it appears in the latest vitals
- [ ] Reading shows LOINC code `8867-4` somewhere visible (debug mode) — confirms FHIR compliance
- [ ] Record an abnormal value — e.g. heart rate `140` — verify it's flagged red (high)
- [ ] Record a normal value — verify it's marked green (normal)

### 1C. Offline mode (most important block)

This is the critical test for rural deployment.

- [ ] In Chrome DevTools → Application → Service Workers, confirm SW is registered
- [ ] Open Network tab, throttle to "Offline"
- [ ] Navigate to a different patient — should still load (from cache)
- [ ] Record a vital sign — UI should show success
- [ ] Look at the sync indicator in header — should show "1 pending" in amber
- [ ] Switch back to "Online" — within 10 seconds, indicator should turn green
- [ ] Refresh the patient page — the vital you recorded should now be persisted

### 1D. Power-failure simulation (advanced)

- [ ] Open DevTools console
- [ ] Type a vital sign value but DON'T tap Save yet
- [ ] In console: `await indexedDB.databases()` — confirm `hospigrow_clinical` and `hospigrow_wal` exist
- [ ] Tap Save
- [ ] Immediately close the browser tab (within 1 second)
- [ ] Reopen the app — vital should still be there (WAL replayed)

---

## Block 2 — Staff app

- [ ] Sign in as `admin.demo`
- [ ] Open `/appointments`
- [ ] Today's date shows 10 appointments with Indian patient + doctor names
- [ ] Each appointment has a status (booked / fulfilled / etc.) shown as a coloured pill
- [ ] Change date to next Monday — list updates (mock returns same fixtures for any day, that's expected)

---

## Block 3 — Patient app

- [ ] Sign in as `patient.demo`
- [ ] Home shows greeting in selected language
- [ ] "My visits" page loads (may be empty in mock mode — that's OK)
- [ ] Bottom nav (mobile) has 4 large tabs: Home / Visits / Records / Bills
- [ ] Open in Chrome DevTools mobile view (iPhone SE) — UI not cramped, tap targets ≥ 44px

---

## Block 4 — Sahayak app (village worker, the most important for rural use)

This is the app most likely to actually save lives in your rural deployment. Test it carefully.

### 4A. Language switcher

- [ ] Open `/`, tap the globe icon
- [ ] Select Hindi — UI labels switch to Devanagari
- [ ] Select Tamil — verify Tamil script renders correctly
- [ ] Select Bengali, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi — each renders
- [ ] Select Urdu — verify the layout flips to RTL (right-to-left)
- [ ] Switch back to English

> If any script renders as boxes ▢▢▢, the font hasn't loaded — your developer needs to verify Google Fonts is reachable from the deployment region.

### 4B. Tap targets

The Sahayak app is built for low-end Android tablets used by ASHAs. Every action should be **easy to tap with a thumb while standing on a dirt road**.

- [ ] Every button in the home page is at least 88px tall (use a ruler, ~3 cm)
- [ ] No text is smaller than 14px on the home page
- [ ] Big "New patient" / "New visit" buttons clearly dominate the screen
- [ ] In Chrome DevTools, set "Pixel 6" device — UI still readable, no horizontal scroll

### 4C. Visit flow (the core ASHA workflow)

- [ ] Tap "New visit"
- [ ] Pick any patient from the list (e.g. Priya Sharma)
- [ ] Enter chief complaint "Cough" with duration "5 days" → Next
- [ ] Enter vitals (BP 130/85, HR 88, temp 37.8) → Next
- [ ] Enter notes "Likely URI, advised paracetamol" and follow-up "5 days" → Next
- [ ] Review screen shows everything correctly
- [ ] Tap Save → returns to home
- [ ] (If wired) Visit appears in patient chart in Hospital app

### 4D. IoT vitals (only test if you have a BLE device)

If you have an Omron BP cuff or Nonin pulse oximeter:

- [ ] Tap "Vitals" → tap "Blood pressure" or appropriate device
- [ ] Browser pops up the BLE device picker
- [ ] Pair the device — adapter should connect
- [ ] Take a reading on the device
- [ ] Reading appears in the app within 5 seconds
- [ ] Reading shows the correct value (compare to device display)

> If the value differs by more than 1-2 units, **the adapter is wrong** — flag for engineering before clinical use. BP cuffs sending kPa instead of mmHg, or thermometers in Fahrenheit, are the most common bugs.

### 4E. ABHA creation (only test in ABDM sandbox)

- [ ] Tap "ABHA" from home
- [ ] Enter NHA's test Aadhaar number (provided in your developer's ABDM sandbox docs)
- [ ] Tap "Send OTP"
- [ ] Enter the test OTP NHA provides
- [ ] ABHA number is returned and displayed
- [ ] Verify in Keycloak's audit log that the action was recorded — without leaking the Aadhaar

> **Never** test with a real Aadhaar number outside production. NHA's sandbox accepts only their test numbers; using real ones in sandbox violates DPDP Act.

---

## Block 5 — Clinical realism check (your domain expertise)

This is where **you, the clinician**, judge whether the app is safe.

- [ ] Reference ranges for BP, HR, temp, SpO₂ shown in the UI match your local clinical guidelines (the defaults are western/general — your specialist consensus may differ)
- [ ] Vital sign abnormality flags trigger at the right thresholds (e.g. SpO₂ < 95% as warning; not 90%)
- [ ] No drug names, doses, or treatment suggestions appear that you didn't expect (they shouldn't — this scaffold has no clinical decision support yet)
- [ ] The patient demographic data uses gender field as expected (FHIR uses `male`/`female`/`other`/`unknown` — make sure your local recording norms agree)
- [ ] The languages you'll deploy in have been reviewed by a native-speaker clinician — **the seed translations are starting points only**

---

## Block 6 — Failure scenarios

A scaffold that handles success well isn't enough. Confirm it handles failure.

- [ ] In DevTools, kill the middleware (`docker stop hospigrow-middleware`)
- [ ] Hospital app shows a "service degraded" state, not white screen of death
- [ ] Cached patients still load
- [ ] Restart middleware (`docker start hospigrow-middleware`)
- [ ] App recovers within 30 seconds
- [ ] Any vitals you tried to record while down get synced

- [ ] In DevTools, simulate "Slow 3G"
- [ ] App still functional, just slow — no broken images or hung spinners

---

## Block 7 — Security smell test

You don't need to be a security expert; just walk through these.

- [ ] Open DevTools → Application → Local Storage. Confirm there is **no** access token visible. (Tokens should be in memory only.)
- [ ] Open Application → IndexedDB → `hospigrow_clinical`. Confirm patient records exist. (Fine for cached data — but in production these should be encrypted; ask your developer.)
- [ ] In Network tab, click any API request to localhost:8000. Confirm `Authorization: Bearer ...` header is present.
- [ ] Try to access `http://localhost:8000/v1/Patient` directly in a new tab without auth — should return `401 Unauthorized`.

---

## Final sign-off (your call as the responsible clinician)

Before *any* real patient data goes in:

- [ ] Clinical workflows above all pass
- [ ] At least one ASHA / nurse has used Sahayak for a full day in supervised conditions
- [ ] Translations have been reviewed by a native-speaker clinician
- [ ] Backup and restore has been demonstrated by the developer
- [ ] Disaster scenario has been walked through (what if the tablet is stolen, what if the server burns, what if NHA gateway is down for a week)
- [ ] You have a written incident response plan
- [ ] You have legal sign-off on data handling per DPDP Act

If all of the above is checked, you are ready to start a **small pilot** — one ward, one ASHA, supervised for two weeks before any expansion.

---

## When in doubt: don't deploy

You are the clinician here. If anything in this list feels wrong, the answer is "fix it before deploying", not "we'll iterate after launch". Healthcare software bugs are patient harm.

Good luck. The work you're doing matters.
