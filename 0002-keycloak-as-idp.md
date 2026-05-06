# ADR-0002: Keycloak as identity provider

Date: 2026-05-06
Status: Accepted

## Context

Three frontend apps + ERPNext + (eventually) GNU Health must share authentication. Users expect single sign-on. We also need a flexible role/permission system that can be adjusted by hospital admins without redeploying code.

## Decision

**Keycloak** runs as the central IdP at `auth.hospigrow.com`. All apps and ERPNext authenticate against it via OIDC + PKCE. GNU Health authenticates via an LDAP federation bridge (Keycloak federates an OpenLDAP instance; GNU Health's `trytond_ldap_authentication` reads from the same LDAP).

Realm roles (`doctor`, `nurse`, `hospital_admin`, etc.) are defined in Keycloak. The middleware reads them from the JWT and enforces permissions per route.

## Consequences

**Positive:**

- One place to manage users. Hospital admins adjust role assignments in Keycloak admin UI.
- Mature OIDC implementation; PKCE, token introspection, MFA, brute-force protection all built in.
- ERPNext speaks OIDC natively via Social Login Keys.
- Open source — no vendor lock-in to Auth0/Okta/etc.
- Themeable login page.

**Negative:**

- Keycloak is heavyweight: needs Postgres, runs as a JVM service, takes ~30s to start.
- GNU Health integration via LDAP isn't true SSO (user re-enters password). True SSO would require a custom Tryton OIDC module.
- Realm export/import for config-as-code requires care; some settings don't export cleanly.

## Alternatives considered

- **Auth0** — managed, mature, but expensive at scale and adds vendor lock-in. Healthcare deployments often need on-prem auth.
- **Authentik** — lighter than Keycloak, growing community, but less battle-tested in production-critical healthcare contexts.
- **Roll our own** — never. Auth is not a place to be original.
- **AWS Cognito** — opinionated, hard to migrate away from, weak self-service admin UX.
