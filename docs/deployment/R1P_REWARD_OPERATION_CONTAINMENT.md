# R1-P Reward Operation Containment

Status: deployed and production-verified

Date: 2026-08-11

## Objective

Make the backend match the read-only reward posture by preventing any raffle
draw, winner notification state, key-prize assignment, raffle-pool allocation,
or monthly cash-award execution until the commercial and legal system is
separately approved.

## Implemented behavior

- Reward execution is controlled by one code-owned, fail-closed policy.
- No environment variable can enable the policy.
- Authenticated administrator POST routes for draw, notify, and key-prize
  operations return `503` with `REWARD_OPERATIONS_DISABLED`.
- Direct internal calls to raffle-pool allocation, raffle draws, notification
  state, monthly draw execution, and payout recording throw before database or
  provider access.
- The scheduled monthly bonus job checks the code policy before its legacy
  environment flag.
- Read-only raffle pool and draw inspection remains available to administrators.

Re-enabling requires a reviewed code change after legal, funding, schema,
ledger, idempotency, reconciliation, and operator-runbook approval.

## Validation

- Focused policy and UI/backend contract tests: 8 passed.
- Complete Vitest suite: 48 files, 276 tests passed.
- Repository TypeScript: passed.
- ESLint: zero errors; 15 known Fast Refresh warnings.
- Production dependency policy: passed; 0 Critical/High advisories.
- Production build: passed; 3,752 modules.
- GitHub Actions run `31501284526`: success.
- Railway deployment `01436a12-d5dc-4956-91fa-2b318c54a752`: successful.
- Production root and liveness endpoint: `200` / `200`.

Verification performs no authenticated mutation and changes no database row,
schema object, migration, provider setting, credential, variable, grant, RLS
policy, or production data.

## Finding disposition

`GRID-REWARD-001` is resolved. The unsafe execution capability is disabled at
both HTTP and service boundaries. Future prize-system design remains blocked by
its own legal, financial, schema, and ledger gates and is not implied by this
containment release.

## Rollback

Revert application commit `e59d8e12b0fd4d6dd8448533ba5f026c8807cc46`
and redeploy its predecessor. There is no schema or data rollback. Because the
predecessor restores callable prize mutations, rollback is permitted only for a
demonstrated runtime failure with an immediate replacement containment patch.
