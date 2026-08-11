# R1-K Outbound Sync Reliability

Status: deployed and production-verified

Date: 2026-08-11

## Objective

Stop outbound synchronization jobs from acknowledging failed or skipped remote
delivery as success, without changing database schema, provider configuration,
credentials, or production data.

## Delivered behavior

- Supabase HTTP failures, missing credentials, and missing record IDs now reject
  the public sync promise, allowing pg-boss to apply its retry policy.
- Create, update, and delete intent is preserved through the job contract.
- Fighter, fight-history, event, and news applies carry their resolved local ID
  into the outbound payload.
- Embedded event fights are enqueued only after the local transaction commits
  and retain whether they were created or updated.
- Direct admin fighter/event changes and fight finalization enqueue durable jobs
  instead of invoking remote sync through process-local `setImmediate` work.
- The public API does not begin accepting traffic until pg-boss has started and
  registered the outbound queue and worker.
- A post-commit enqueue failure leaves the local pipeline entry truthfully
  `applied` and records an explicit delivery warning in its existing
  `error_log`; it does not pretend the local transaction rolled back.

## Validation

- Focused reliability coverage: 5 tests passed.
- Complete Vitest suite: 45 files, 261 tests passed.
- Repository TypeScript: passed.
- ESLint: zero errors; 15 pre-existing Fast Refresh warnings.
- Production build: passed; 3,931 modules.
- Hosted secret-free quality gate: run `31494376269`, success.
- Railway deployment `a4649cfe-6887-406d-b11b-980e14a0b71b`: successful and
  active.
- Production root and health: `200`.
- Unauthenticated admin configuration read/write: `401`.
- Unknown API route: `404`.

No production write, integration delivery, database row, schema object,
credential, variable, RLS policy, grant, or provider setting was changed during
verification.

## Remaining boundary

This is not a transactional outbox. The local domain transaction and pg-boss
enqueue remain separate commits. Pipeline enqueue failures are persisted in
`error_log`, while direct-admin enqueue failures currently remain log-visible
only. Delivery-state columns, stable provider idempotency receipts, dead-letter
replay, and operator reconciliation tooling remain gated on the database
authority and ownership work.

Accordingly, `GRID-INGEST-005` is partially resolved and remains a production
blocker for authoritative cross-system convergence.

## Rollback

Revert application commit `41c102961bdcf0df4784f47f7401ec5359aceb80` and
redeploy the previous immutable artifact. This slice has no schema or data
rollback.
