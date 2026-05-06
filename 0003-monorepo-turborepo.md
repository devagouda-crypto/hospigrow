# ADR-0003: Monorepo with Turborepo

Date: 2026-05-06
Status: Accepted

## Context

We have three frontend apps that share a lot of code: domain types, auth, API client, design system. Options:

1. Three separate repos, copying shared code or extracting to npm packages.
2. One monorepo with Turborepo / Nx / Lerna / Rush.

## Decision

Single monorepo using **pnpm workspaces** + **Turborepo**.

## Consequences

**Positive:**

- Atomic changes across packages and apps. A breaking change to `@hospigrow/domain` and the cascade of fixes happen in one PR.
- One CI pipeline. Turborepo's task graph parallelises builds.
- Type safety across the whole tree — change a type in `domain`, all three apps fail to build until updated.
- New engineers see the whole system in one place.

**Negative:**

- Slower clone, larger working tree.
- Tooling complexity (Turborepo cache config, workspace-relative imports).
- Risk of apps importing from each other instead of via packages — needs discipline + lint rule.

## Alternatives considered

- **Nx** — more powerful than Turborepo but heavier; we don't need most of its features (executors, generators, project graph). Turborepo's simpler model fits.
- **Three repos + npm packages** — adds friction to every shared change. Bad fit when packages are evolving fast alongside apps.
- **Yarn workspaces / Lerna** — pnpm is faster and uses less disk; Lerna is in maintenance mode.
