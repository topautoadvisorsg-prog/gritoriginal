# Pre-Test Technical Debt Register

Last updated: 2026-06-22 on `codex/product-validation-audit-2026-06-22`.

## Current Gate Status

| Gate | Status |
|---|---|
| TypeScript | Passing: `npx tsc --noEmit` |
| Unit/contract tests | Passing: 32 files, 198 tests |
| Production build | Passing: no chunk over 500 KB after route/vendor splitting |
| Hook dependency warnings | 0 in `src server shared` |
| App lint backlog | 197 errors, 15 warnings, mostly explicit `any` and legacy test style |
| Dependency audit | 0 critical, 1 high, 20 moderate |

## Highest-Risk Items Left

### P1: Vite Major Upgrade Audit

`npm audit` reports one remaining high-severity advisory on Vite 5. The available automated fix is a major upgrade to Vite 8, so it should be handled as a controlled migration with browser QA rather than `npm audit fix --force`.

Why it matters: the advisory is primarily development-server exposure, not the built production bundle, but Windows local development is part of this project workflow.

Recommended path:
- Evaluate Vite 6/7/8 compatibility with `@vitejs/plugin-react-swc`, Vitest, aliases, and proxy behavior.
- Run fixture-mode desktop/mobile browser smoke after the upgrade.
- Keep the app on Node 22 while validating because `package.json` requires Node `<23`.

### P1: Type Debt In Core Services

The biggest lint offenders are `server/services/dataEngineService.ts`, `server/services/scoringService.ts`, `src/user/components/chat/ChatHub.tsx`, and `server/user/routes/groupsRoutes.ts`.

Why it matters: these modules touch provider ingestion, scoring money math, realtime chat, and community permissions. The code compiles, but explicit `any` makes future refactors riskier.

Recommended path:
- Start with data-engine DTOs and staged-change schemas.
- Then type scoring inputs/results so net-units math is enforced at compile time.
- Then split `ChatHub` types and mutation payloads into local interfaces.

### P1: External Integration Validation

Local fixture mode verifies product flows without writing fake data to production. Real provider checks still need staging credentials.

Needs:
- `STAGING_DATABASE_URL`
- `STAGING_ENVIRONMENT_ID`
- explicit staging write flags only when the founder is ready

Do not paste secrets into chat; put them in local `.env`.

## Cleanup Completed In This Pass

- Replaced duplicated admin route mounting with `server/admin/registerAdminApi.ts`.
- Fixed production/admin auth drift for globally guarded admin chat/slip routes.
- Added a shared terminal API error handler that does not leak 5xx internals.
- Deleted retired Replit OIDC/session code and removed unused Passport/OpenID/session dependencies.
- Reduced audit findings from 2 critical / 7 high to 0 critical / 1 high.
- Split frontend routes and admin workflows into lazy chunks.
- Split stable vendor chunks for React, Clerk, Sentry, query cache, and motion.
- Removed all React hook dependency warnings in application/server/shared code.
- Fixed in-place mutation of `event.fights` in the event card auto-scroll effect.
