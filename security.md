# Security

## Threat model

PHI (Protected Health Information) is the asset. Threats we plan for:

| Threat                          | Mitigation                                                           |
| ------------------------------- | -------------------------------------------------------------------- |
| Stolen access token (XSS)       | Tokens in memory only; CSP; HttpOnly is N/A but tokens are short-lived |
| Stolen refresh / session cookie | HttpOnly + Secure cookies (Keycloak); session timeout                |
| Phishing of credentials         | Keycloak OTP/MFA enforced for clinical roles; brute-force lockout    |
| Insider data exfiltration       | Audit log every PHI read; tamper-evident hash chain (planned)        |
| SQL injection                   | Parameterized queries via SQLAlchemy/asyncpg; no raw SQL             |
| API auth bypass                 | Every endpoint requires JWT; permission gate per route               |
| Privilege escalation            | Roles set in Keycloak only, never modifiable by app code             |
| Token replay                    | Short access-token lifetime (15 min); HTTPS enforced                 |
| Lateral movement (intra-cluster) | Per-pod IAM; no shared secrets across services                       |
| Supply chain                    | `pnpm audit` + Trivy in CI; pinned versions; signed images           |
| Loss of audit trail             | Audit writes are mandatory; failures fail the request                |

## Compliance mapping

| Requirement                                | How we meet it                                              |
| ------------------------------------------ | ----------------------------------------------------------- |
| ISO 27799 §6.7 (audit & accountability)    | FHIR AuditEvent on every PHI access; 7-year retention       |
| HIPAA §164.312(b) (audit controls)         | Same                                                        |
| HIPAA §164.312(c)(1) (integrity)           | All mutations versioned; soft delete only                   |
| HIPAA §164.312(d) (person/entity auth)     | Keycloak OIDC with MFA option                               |
| GDPR Art. 30 (records of processing)       | Audit log is the record                                     |
| GDPR Art. 17 (right to erasure)            | Tombstone + 30-day grace; PII purged from indices           |
| GDPR Art. 32 (security)                    | Encryption-at-rest, encryption-in-transit, RBAC, audit      |
| DPDP Act §11 (consent records)             | `Patient._extensions.consents[]` array                      |
| OWASP ASVS 4.0                             | See checklist below                                         |
| WCAG 2.2 AA                                | Design system + per-component a11y tests                    |

## OWASP ASVS 4.0 checklist (relevant subset)

- [x] V2.1 — passwords ≥ 12 chars, complexity, rotation policy via Keycloak
- [x] V2.2 — brute-force protection (Keycloak realm config)
- [x] V3.4 — tokens not in localStorage (in-memory only)
- [x] V3.5 — token binding via PKCE (RFC 7636)
- [x] V4.1 — RBAC enforced server-side, never trust client roles
- [x] V5.1 — server-side input validation (Pydantic + Zod schemas)
- [x] V8.3 — sensitive data not in logs (PII redacted in audit descriptions)
- [x] V9.1 — TLS only in production (HSTS header)
- [x] V10.3 — dependency updates monitored (Dependabot recommended)
- [x] V12.3 — file upload validated (when added; not yet implemented)
- [x] V14.4 — security headers (X-Content-Type-Options, X-Frame-Options, CSP planned)
- [ ] V14.5 — Content Security Policy: define per-app **before** production launch

## Encryption

- **In transit** — TLS 1.2+ everywhere. Keycloak, middleware, frontends, backends. No plaintext HTTP except local dev.
- **At rest** — Postgres data volume encrypted (AWS EBS encryption). Backups encrypted.
- **PHI at rest in IndexedDB** — sensitive fields wrapped with WebCrypto AES-GCM using a key derived from the user's session. (See `packages/offline/src/crypto.ts` — to be implemented; current scaffold stores PHI clear in IndexedDB pending this work.)

## Secrets management

- **Local dev** — `.env` files (gitignored).
- **CI** — GitHub Actions secrets.
- **Staging/prod** — AWS Secrets Manager. Mounted via ECS task role at runtime; never in env vars or images.

Specifically NOT in source:
- Keycloak admin password
- ERPNext API key/secret
- GNU Health admin password
- DB passwords
- TLS private keys

## Incident response (skeleton — fill in for production)

1. **Detect** — alerts from Sentry, Prometheus alertmanager, AWS GuardDuty.
2. **Contain** — circuit-break the affected service; rotate credentials.
3. **Eradicate** — patch, redeploy, verify.
4. **Recover** — restore from backup if needed; reconcile audit log gaps.
5. **Lessons** — postmortem doc within 5 business days; ADR if architectural.

## Penetration testing

Scope this **before** national rollout. Engagements should cover:
- Authentication/authorization bypass attempts
- API fuzzing
- Cross-tenant data access (when multi-hospital deployments arrive)
- Frontend XSS via FHIR resource fields (e.g., crafted `Patient.name.text`)
- Sync queue replay attacks
- Audit log integrity
