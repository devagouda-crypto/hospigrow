# Deployment

Targets are AWS-first because the existing GNU Health and ERPNext are on AWS, but the patterns translate to GCP/Azure/bare metal.

## Topology (recommended)

```
                     CloudFront
                    /    |    \
              ┌────┘     │     └────┐
              │          │          │
      hospital.       staff.      patient.
      hospigrow.com   hospigrow.com   hospigrow.com
              │          │          │
              └─────► ALB ◄─────────┘
                       │
                ┌──────┴──────┐
                │             │
           api.hospigrow   auth.hospigrow
              .com            .com
            (middleware)   (Keycloak)
                │             │
                ├─── Postgres (RDS) ───┤
                │                      │
                ├─── Redis (Elasticache)
                │
                ├──► suite.hospigrow.com (GNU Health, EC2)
                └──► staff.hospigrow.com (ERPNext, EC2)
```

## DNS

| Subdomain                  | Points to              | Purpose                |
| -------------------------- | ---------------------- | ---------------------- |
| `auth.hospigrow.com`       | Keycloak ALB           | SSO                    |
| `api.hospigrow.com`        | Middleware ALB         | The backend API        |
| `hospital.hospigrow.com`   | CloudFront (Hospital)  | Clinical app           |
| `team.hospigrow.com`       | CloudFront (Staff)     | Operations app *(see note)* |
| `app.hospigrow.com`        | CloudFront (Patient)   | Patient app            |
| `suite.hospigrow.com`      | EC2 (existing)         | GNU Health             |
| `staff.hospigrow.com`      | EC2 (existing)         | ERPNext (already in use) |

> **Note**: `staff.hospigrow.com` is already taken by ERPNext. The Staff app is hosted on `team.hospigrow.com` to avoid the conflict. If you want to migrate ERPNext to a different subdomain, do it before launching the Staff app to users — changing it later requires updating Keycloak redirect URIs and bookmarks.

## TLS

ACM-issued certs for every public domain. ALB terminates TLS. Internal traffic between services can be plaintext within the VPC, but the ALB-to-service hop should still be TLS where supported.

Force HTTPS at the ALB:
```
HTTP listener → 301 redirect → HTTPS listener
HTTPS listener → forward → target group
```

The middleware sets `Strict-Transport-Security: max-age=31536000; includeSubDomains` automatically when `ENV=production`.

## Frontend deployment

Each Next.js app builds to a standalone Node.js bundle. Two paths:

**Path A — ECS Fargate (recommended for parity):**
```bash
# In each app dir
docker build -t hospigrow/hospital-app:$GIT_SHA .
aws ecr put-image ...
# Update ECS service to new task definition
```

**Path B — S3 + CloudFront (if you go static export):**
```bash
# Set output: 'export' in next.config.js (loses some features)
pnpm --filter @hospigrow/hospital-app build
aws s3 sync apps/hospital/out s3://hospital.hospigrow.com --delete
aws cloudfront create-invalidation --distribution-id ABC123 --paths "/*"
```

Path A is recommended because the apps need server-side features (cookie reading, image optimization, future SSR for SEO on patient app).

## Middleware deployment

```bash
docker build -t hospigrow/middleware:$GIT_SHA services/middleware
docker tag ... 123456789.dkr.ecr.us-east-1.amazonaws.com/hospigrow/middleware:$GIT_SHA
docker push ...
```

Run on **ECS Fargate** with at least 2 tasks behind the ALB. Auto-scale on CPU > 70%. Health check path `/health`.

Memory: 1 GB is enough for normal load (FastAPI + asyncpg + httpx is light). Bump to 2 GB if you see GC pressure.

## Database

- **RDS Postgres 16**, Multi-AZ.
- Daily automated snapshots, retained 35 days.
- Point-in-time recovery enabled.
- Separate database per logical concern (the middleware DB should be separate from any analytics warehouse).

The middleware uses Postgres only for: audit events, idempotency keys, sync state, mappings between GNU Health IDs and ERPNext IDs. **It is not a clinical data store.**

## Redis

- Elasticache Redis 7, single-AZ is fine for caching.
- Do **not** put audit-critical data in Redis. It's a cache.

## Keycloak

- Run on ECS Fargate, 2 replicas, behind its own ALB.
- DB on the same RDS Postgres (separate database within the cluster: `keycloak`).
- Realm config in `infra/keycloak/realm-export.json` is the source of truth — apply via partial import on each deploy.
- Themes: replace the default Keycloak login theme with a Hospigrow-branded one before launch (`themes/hospigrow/login`).

### Keycloak production config (key flags)

```bash
KC_DB=postgres
KC_DB_URL=jdbc:postgresql://prod-db.../keycloak
KC_HOSTNAME=auth.hospigrow.com
KC_HOSTNAME_STRICT=true
KC_PROXY=edge                 # because ALB terminates TLS
KC_HEALTH_ENABLED=true
KC_METRICS_ENABLED=true
```

## Backups & disaster recovery

| Asset                     | Backup mechanism            | RPO   | RTO   |
| ------------------------- | --------------------------- | ----- | ----- |
| Postgres (middleware)     | RDS automated snapshots     | 5 min | 1 hr  |
| Postgres (Keycloak)       | RDS automated snapshots     | 5 min | 1 hr  |
| GNU Health DB             | (existing — verify)         | ?     | ?     |
| ERPNext DB                | (existing — verify)         | ?     | ?     |
| S3 frontend buckets       | Versioning enabled          | 0     | min   |
| Audit log (long-term)     | Stream to S3 Glacier        | 1 hr  | 24 hr |

DR drill: quarterly. Restore Postgres to staging from a snapshot, verify Keycloak realm intact, verify middleware can authenticate test user. Document in a runbook.

## Monitoring & alerting

Alert on:
- Middleware p95 latency > 1s for 5 min
- Middleware 5xx rate > 1% for 5 min
- Keycloak `/health` failing
- Sync queue depth > 1000 (something's wrong)
- Audit write failure (any) — wake someone up

## Cost ballpark (rough, US East)

For a single-hospital deployment with ~500 daily active users:

| Resource                    | Monthly cost (USD) |
| --------------------------- | ------------------ |
| ALB + CloudFront            | ~$50               |
| ECS Fargate (4 services)    | ~$200              |
| RDS Postgres (db.t4g.medium, Multi-AZ) | ~$140 |
| Elasticache (cache.t4g.small) | ~$30             |
| Route 53                    | ~$5                |
| Data transfer               | ~$50               |
| **Total**                   | **~$475 / mo**     |

For national-scale (many hospitals, tens of thousands of DAU), you'll be in the $5-15k/mo range and need a serious capacity plan.
