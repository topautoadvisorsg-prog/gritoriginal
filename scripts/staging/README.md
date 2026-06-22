# Staging Database Safety Gate

These scripts protect database proof work from accidentally targeting production.
They do not create a staging database and they never fall back to `DATABASE_URL`.

## Setup

1. Provision a separate Postgres or Supabase project containing no production data.
2. Apply the normal schema and migrations to that isolated database.
3. Edit and run `environment-marker.sql` in that database once. Use a unique ID
   beginning with `grit-staging-`.
4. Create `.env.staging.local` (gitignored) with:

```dotenv
NODE_ENV=staging
ALLOW_STAGING_WRITES=1
STAGING_ENVIRONMENT_ID=grit-staging-your-unique-id
STAGING_DATABASE_URL=postgresql://...
```

5. Run `npm run staging:check` before any proof command.

The command rejects missing authorization, development or production runtimes,
placeholder URLs, a database matching `DATABASE_URL` or `DIRECT_URL`, a production
Supabase project reference, and a missing or mismatched database marker. It prints
only the host, port, database name, and marker ID; credentials are never printed.

Set `STAGING_ENV_FILE` only when a different local env filename is required.

## Ranking Total Reconciliation

Run the read-only drift report against the verified staging target:

```text
npm run rankings:reconcile:staging
```

Exit code `0` means no drift; exit code `2` means drift exists. The report prints
only the target, drifted-user count, and aggregate absolute delta.

To apply the canonical totals in staging, add
`ALLOW_RANKING_RECONCILIATION=1` to the local staging environment and run:

```text
npm run rankings:reconcile:staging -- --apply
```

Apply mode re-verifies the marker inside a serializable transaction, updates only
drifted cached totals, verifies zero remaining drift, and rolls back on any mismatch.
It is not a production migration command.

## Proof Boundary

Passing `staging:check` proves only that the configured target passed the safety
gate and owns the expected staging marker. It does not prove pick persistence,
locking, idempotency, socket events, cache invalidation, aggregation, or rankings.
Those scenarios remain defined in `docs/backend/PICK_STAGING_PROOF.md`.
