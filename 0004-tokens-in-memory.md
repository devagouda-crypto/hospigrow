# ADR-0004: Tokens in memory, never localStorage

Date: 2026-05-06
Status: Accepted

## Context

OAuth/OIDC apps need somewhere to store the access token between renders. Options:

1. `localStorage` — easy, persistent across tabs and reloads.
2. `sessionStorage` — same as localStorage but per-tab.
3. HttpOnly cookies — set by an auth server / BFF.
4. In-memory only — lost on reload, recovered via silent token renewal.

## Decision

Tokens live **in memory only**, in the React state managed by `oidc-client-ts`. Tab refresh triggers silent renew via the Keycloak SSO session cookie (HttpOnly, set by Keycloak itself).

`sessionStorage` is used only for the transient OAuth state (PKCE verifier, nonce) during the redirect dance.

## Consequences

**Positive:**

- XSS attacks cannot exfiltrate tokens. The single most common SPA token-theft vector is closed.
- OWASP ASVS 4.0 §3.4.1 satisfied.
- Token rotation is automatic — silent renew gives us a fresh access token every ~13 minutes.

**Negative:**

- Tab refresh briefly shows a loading state while silent renew happens.
- Users opening the app after their Keycloak SSO session expired (8 hours by default) must log in again.
- The `automaticSilentRenew` mechanism uses a hidden iframe, which is deprecated by some browser privacy modes — for those users, refresh tokens via direct grant become the fallback (configured in Keycloak realm).

## Alternatives considered

- **localStorage** — XSS = game over. Healthcare app, no.
- **HttpOnly cookies via a BFF** — strongest security but requires a server-side session. Adds infrastructure (Redis-backed session store, session sticky on the LB). Worth revisiting if we ever add server-side rendering of authenticated pages, but not justified yet.
- **sessionStorage** — same XSS exposure as localStorage.
