# GRIT Deployment

**Truth date:** June 21, 2026
**Current target:** Railway single-process Node deployment serving API, Socket.IO, jobs, and the built Vite frontend.

## Build and start

`railway.json` configures Nixpacks:

```text
build: npm install --include=dev && npm run build
start: npm start
health: GET /api/health
restart: on failure, maximum 5 retries
```

`npm start` runs `tsx server/production.ts`. Production serves `dist/public` and returns `index.html` for unmatched SPA routes.

## Health endpoints

- `GET /api/health`: lightweight Railway liveness response; it does not test dependencies.
- `GET /api/system/health`: database/auth/socket diagnostic with healthy/degraded/unhealthy state.
- `GET /api/system/ping`: lightweight system ping.

Railway currently uses only `/api/health`, so a process can remain “healthy” while database, auth, jobs, or third-party integrations are unavailable.

## Required environment groups

| Group | Required for current runtime |
|---|---|
| Database | `DATABASE_URL`, `SESSION_SECRET`; `DB_MAX_CONNECTIONS` strongly recommended |
| Clerk | server/publishable keys; webhook secret required if Clerk webhook is deployed |
| Stripe | secret, publishable, and webhook secret before any payment testing |
| AI | OpenAI and/or Anthropic according to enabled surfaces |
| Data integration | data-engine URL/key and webhook key when ingestion is enabled |
| Notifications | OneSignal values when delivery is enabled |
| Observability | Sentry DSN and log level as desired |
| Domain/socket | `CUSTOM_DOMAIN` or `RAILWAY_PUBLIC_DOMAIN` in production |

`.env.example` is the shape reference, but several comments still describe historical phases. Never copy old secrets or commit `.env`.

## Deployment blockers

- Core pick contract and ranking integrity are not production-safe.
- Stripe checkout is not a recurring subscription and trusts browser Price/redirect values.
- Creator/token/payout/legal tables are absent from the connected database.
- Schema readiness is not checked at startup or in `/api/health`.
- Production payment/reward flows lack ledgers and reconciliation.
- In-process cron runs on every replica without a distributed leader/idempotency boundary.
- Default rate-limit storage and caches are process-local.
- Uploads use local filesystem paths and are not durable across replicas/redeploys.
- Database pool defaults to 50 per process unless overridden.
- Main JS bundle is about 3.43 MB uncompressed and 766 KB gzip.
- Dependency audit reports 2 critical, 6 high, and 28 moderate advisories.

## Safe release workflow

1. Create a release branch and record the intended commit.
2. Put isolated database credentials in `.env.staging.local`; never reuse production credentials.
3. Run `npm run staging:check` and retain the redacted target/marker evidence.
4. Run `npm ci`, TypeScript, Vitest, production build, and dependency review.
5. Apply reviewed migrations to staging; verify event-status, snapshot-idempotency, durable close-run, and progression-application constraints plus actual parity.
6. Run authenticated browser QA without `UI_AUDIT_FIXTURES` against deterministic staging data.
7. Run Stripe test-mode subscription lifecycle and webhook replay tests when payments are enabled.
8. Run pick/leaderboard/event-close reconciliation tests.
9. Run the ranking drift report, apply only in staging, then rerun it to retain zero-drift evidence.
10. Deploy staging, verify both health endpoints, logs, sockets, jobs, and external callbacks.
11. Back up production and document migration rollback/reconciliation queries.
12. Deploy production without force-pushing; monitor errors, DB pool, latency, webhook failures, and job results.
13. Roll back application code if necessary; never blindly reverse financial/data migrations.

## Scaling requirements

Before adding replicas:

- move rate limits and shared caches to Redis;
- replace/coordinate in-process cron with a durable scheduler and idempotency keys;
- move uploads to durable object storage;
- calculate a safe per-instance DB pool;
- use a Socket.IO adapter if realtime state spans instances;
- separate liveness from readiness and include schema/dependency checks;
- add payment/job dead-letter and replay operations.

## What can deploy today

Documentation and internal QA builds. A controlled free staging environment can run today. Public free beta requires the pick/ranking P0 fixes. Paid subscriptions, creator monetization, AI token sales, and rewards remain blocked.

See [production readiness](../system-audit/PRODUCTION_READINESS.md) for release gates.

Execution plan: [Deployment and Operations](../backend/plans/DEPLOYMENT_OPERATIONS_PLAN.md).
