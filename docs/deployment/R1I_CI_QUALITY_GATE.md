# R1-I CI Quality Gate

Status: deployed and production-verified

Date: 2026-08-11

## Objective

Make the validated local TypeScript, test, lint, and production-build gates
mandatory and reproducible on every pull request and update to `main`.

## Candidate changes

- Add one GitHub Actions workflow with read-only repository permissions and no
  persisted checkout credential.
- Run on pull requests, `main`, and explicit manual dispatch.
- Cancel superseded work on the same ref and cap execution at 20 minutes.
- Use Node.js 22.13, the committed lockfile, and `npm ci`.
- Pin official checkout and Node setup actions to immutable commit revisions.
- Use the official Node 24-based action releases so the workflow itself does
  not depend on GitHub's retired Node 20 action runtime.
- Add canonical `typecheck` and single-worker `test:ci` package scripts.
- Run TypeScript, all tests, ESLint, and the production build without production
  credentials or database connectivity.
- Force every Vitest worker to use a loopback port with no listener and a
  test-only session value before dotenv can load developer credentials.

## Safety boundary

The workflow has no deployment step, write token, database URL, provider
credential, migration command, production authorization, or artifact promotion.
It cannot change Railway, Supabase, Clerk, Stripe, R2, or production data.

## Validation gate

| Gate | Result |
|---|---|
| Workflow YAML parse | Pass with the already-installed YAML 2 parser |
| Clean install (Node 22.13.0 / npm 10.8.2) | Pass; 1,365 packages installed from the lockfile |
| Focused CI and type-contract tests | 2 files, 7 tests passed |
| Repository TypeScript (`npm run typecheck`) | Pass |
| Complete CI suite (`npm run test:ci`) | 43 files, 253 tests passed with external DB credentials removed |
| ESLint | Zero errors; 15 pre-existing Fast Refresh warnings |
| Production build | Pass; 3,931 modules |

GitHub recognizes the workflow and the final hosted run completed every gate.

## Hosted-run finding

The first push and manual hosted runs stopped at `npm ci`. They exposed two
pre-existing repository contract defects: the project still advertised Node
20 while dependencies require Node 22.13 or newer, and the committed
lockfile did not fully represent the dependency graph on a clean Linux runner.
R1-I keeps the clean-install gate strict. The repair aligns the declared and CI
runtime at Node 22.13 and regenerates the lockfile; it does not replace
`npm ci`, suppress engine checks, or use a permissive install mode.

The next hosted run passed clean installation and TypeScript, then exposed that
unit tests had been relying on developer `.env` values to satisfy import-time
validation. The test runner now overrides those two required values with inert,
non-secret test configuration. A test that unexpectedly reaches PostgreSQL
will fail against loopback port 1 instead of reaching any external database.

## Production promotion

| Evidence | Identity / result |
|---|---|
| Reviewed runtime commit | `77153c476c578ee71c9ad97e447e9a2750545e61` |
| GitHub Actions run | `31490256095`, success; all eight validation steps passed |
| Railway deployment | `5feec48e-1f31-4b3a-8d37-36f85ff52300` |
| Railway status | Success, 2026-08-11 12:16:10 UTC |
| Public application root | `200` HTML |
| `GET /api/health` | `200` JSON |
| Slip upload without authentication | `401` JSON |
| User slip delete without authentication | `401` JSON |
| Admin slip delete without authentication | `401` JSON |
| Event-image upload without authentication | `401` JSON |
| Retired wildcard upload | `404` JSON |
| Unknown API path | `404` JSON |
| R1-B header contract | Preserved |

The production probes used no application credential and performed no object,
database, provider, or configuration mutation.

## Rollback

Revert only the R1-I commit. The application runtime and prior R1 controls are
unchanged.
