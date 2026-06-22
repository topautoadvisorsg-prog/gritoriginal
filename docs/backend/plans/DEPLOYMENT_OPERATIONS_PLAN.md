# Deployment and Operations Plan

**Current state:** Railway single-process deployment works conceptually; readiness, horizontal coordination, durable assets, dependency posture, and recovery need work.

## Delivery phases

1. Create separate local/test, staging, and production environments with unique database, Clerk, Stripe, storage, notification, and AI credentials.
2. Implement CI: clean install, types, tests, build, migration lint/parity, dependency policy, and artifact retention.
3. Separate liveness from readiness; readiness verifies DB, required schema version, auth/payment configuration for enabled features, job health, and storage.
4. Add migration release protocol: review SQL, staging apply/proof, backup, forward repair/rollback, reconciliation.
5. Move rate limits/cache/socket coordination to shared infrastructure before replicas.
6. Replace/coordinate process cron with durable idempotent jobs and dead-letter/replay operations.
7. Move filesystem uploads to durable object storage.
8. Tune DB pool per instance and establish connection/latency/error budgets.
9. Resolve critical/high runtime dependency findings deliberately with regression tests.
10. Add structured logs, trace correlation, metrics, alerts, Sentry sampling, and cost dashboards.
11. Add backup-restore, regional/provider outage, secret rotation, rollback, and incident runbooks.
12. Run authenticated load/failure tests for picks, rankings, chat/socket, AI streaming, uploads, and webhooks.

## Release gates

- Exact commit, migration version, config manifest, and feature flags recorded.
- Staging proof and reconciliation attached.
- No fixture mode or production test data.
- Rollback/forward-repair owner and commands reviewed.
- Error/latency/DB/socket/job/payment dashboards healthy during canary.

## Definition of done

Staging mirrors production topology safely; readiness fails closed; migrations and restores are rehearsed; replicas cannot duplicate jobs; assets are durable; high-risk dependencies are resolved/accepted; load and incident exercises meet documented objectives.

**Complexity:** XL, incremental. **Production risk:** High but reducible through canary releases.
