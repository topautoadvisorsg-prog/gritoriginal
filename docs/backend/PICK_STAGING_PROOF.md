# Pick Pipeline Isolated Postgres Proof

**Status:** safety gate code verified; isolated database provisioning and proof pending.
**Production writes:** forbidden.

## Safe staging path

Current discovery found only `DATABASE_URL` and `DIRECT_URL`, both belonging to the connected environment. Docker, `psql`, and a local disposable PostgreSQL server are unavailable. There is therefore no approved write target on this machine today.

Preferred path: create a separate Supabase project named clearly for GRIT staging, with separate credentials, no production replication, no production Clerk/Stripe keys, and a lifecycle that permits reset. A temporary Railway Postgres service is an acceptable alternative. Local Docker Postgres becomes acceptable if Docker is later installed.

The implemented preflight is `npm run staging:check`, backed by
`scripts/staging/stagingGuard.ts`. It reads the proof target only from
`STAGING_DATABASE_URL` and refuses to connect unless all conditions pass:

- `ALLOW_STAGING_WRITES=1` is explicitly set;
- `STAGING_DATABASE_URL` is present;
- it is not byte-for-byte equal to `DATABASE_URL` or `DIRECT_URL`;
- parsed host/database/project identifiers do not match production;
- a staging marker table contains the expected random environment ID;
- `NODE_ENV` is `test` or `staging`;
- Stripe/Clerk production keys are absent;
- fixture IDs use an audit namespace and cleanup is scoped to that namespace.

No fallback from `STAGING_DATABASE_URL` to `DATABASE_URL` is permitted.
Setup and marker instructions live in [`scripts/staging/README.md`](../../scripts/staging/README.md).

### Current safety evidence

- Eight unit cases pass for explicit authorization, environment identity, production target rejection, and credential redaction.
- A real invocation without staging authorization stops at `ALLOW_STAGING_WRITES` before constructing a connection pool.
- The checker requires the database marker ID to equal `STAGING_ENVIRONMENT_ID` before reporting a safe target.
- No staging database has been provisioned and no database proof case below has run.

## Database setup

1. Create the isolated project/service.
2. Apply only reviewed active migrations in order.
3. Run schema parity checks for users, events, fights, picks, constraints, and indexes.
4. Seed one audit user, one 12-fight open event, 24 fighters, and deterministic odds.
5. Record the environment marker and seed manifest.
6. Run proof cases.
7. Delete only manifest-owned rows or reset the entire staging database.

## Required proof cases

### Persistence

- Create a pick and verify fighter, method, round, one unit, flag, odds, timestamps, and unique `(user_id, fight_id)` persistence.
- Edit fighter/method/round/flag and verify one row remains.
- Delete and verify the row is absent.
- Verify an outside fighter, invalid round, variable unit, closed fight, and expired lock time make no write.

### Concurrent edits and row locking

- Submit two simultaneous edits for the same user/fight and prove serialization.
- Submit simultaneous yellow/red changes near the event flag limit and prove the limit cannot be exceeded.
- Confirm no lost update, duplicate row, negative counter, deadlock, or partial user/pick state.
- Record transaction timing and final deterministic winner policy (last committed request unless versioning is added).

### Replay and idempotency

- Replay an identical create request and prove one row remains.
- Replay an edit and delete and prove stable state.
- Confirm database uniqueness protects against duplicate user/fight picks.
- Decide whether HTTP idempotency keys are required. Current upsert-style behavior is state-idempotent but does not provide request-level idempotency/audit identity.

### Socket, cache, and aggregation

- Observe one logical pick update after create, edit, and delete.
- Verify old-fighter count decrements and new-fighter count increments exactly once.
- Verify cold-cache and warm-cache aggregation produce the same counts.
- Verify event cache invalidation occurs after committed persistence, never after rollback.
- Force aggregation/socket failure and prove the committed pick remains correct while reconciliation can repair derived state.

### Downstream ranking impact

- Score deterministic favorite win, underdog win, loss, draw/no-contest, red pick, and voided pick.
- Verify red/voided picks are excluded from every canonical ranking scope.
- Rebuild user totals and compare them with event/month/year aggregates.
- This section cannot pass until the Rankings pipeline defines one authoritative calculation and tie policy.

### Failure and cleanup

- Force an exception between pick write and user flag-cache update and prove transaction rollback.
- Terminate one concurrent request and verify locks release.
- Confirm test cleanup cannot address non-fixture rows.
- Save test output, row reconciliation queries, and staging environment ID as evidence.

## Completion evidence

Pick Pipeline may become **Verified complete** only when:

- all cases above pass against isolated PostgreSQL;
- exact migration version and commit are recorded;
- no production credentials/data were used;
- full TypeScript/tests/build remain green;
- socket/cache reconciliation is demonstrated;
- ranking-dependent assertions either pass or are explicitly held behind the Rankings pipeline gate.

Until then its ledger state remains **Code Verified / Staging DB Proof Pending**.
