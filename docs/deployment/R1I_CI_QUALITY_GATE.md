# R1-I CI Quality Gate

Status: local candidate; not deployed

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
- Add canonical `typecheck` and single-worker `test:ci` package scripts.
- Run TypeScript, all tests, ESLint, and the production build without production
  credentials or database connectivity.

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
| Complete CI suite (`npm run test:ci`) | 43 files, 252 tests passed |
| ESLint | Zero errors; 15 pre-existing Fast Refresh warnings |
| Production build | Pass; 3,931 modules |

Promotion still requires GitHub to recognize the workflow and complete the
first hosted run successfully.

## Hosted-run finding

The first push and manual hosted runs stopped at `npm ci`. They exposed two
pre-existing repository contract defects: the project still advertised Node
20 while dependencies require Node 22.13 or newer, and the committed
lockfile did not fully represent the dependency graph on a clean Linux runner.
R1-I keeps the clean-install gate strict. The repair aligns the declared and CI
runtime at Node 22.13 and regenerates the lockfile; it does not replace
`npm ci`, suppress engine checks, or use a permissive install mode.

## Rollback

Revert only the R1-I commit. The application runtime and prior R1 controls are
unchanged.
