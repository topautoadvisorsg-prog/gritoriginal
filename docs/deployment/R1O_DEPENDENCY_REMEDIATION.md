# R1-O Dependency Remediation

Status: deployed and production-verified

Date: 2026-08-11

## Objective

Remove reachable Critical and High dependency advisories without a blind major
rewrite, reduce unnecessary production packages, and make regression fail in
hosted CI.

## Implemented slice

- Classified build, type, and migration tools as development dependencies.
- Replaced the broad `@clerk/ui` tree with the dedicated `@clerk/themes`
  package used by the application.
- Removed `image-size` and replaced it with a bounded parser for only the
  allowlisted JPEG, PNG, and WebP formats.
- Updated compatible direct/transitive packages and Vite 6 without forcing the
  React Router 7 breaking migration.
- Added `npm run audit:production`; hosted CI now rejects High or Critical
  production advisories.
- Corrected a progression-service `const` reassignment exposed by the upgraded
  build tool before it could throw on the login-bonus path.

## Dependency result

| Scope | Before | After |
|---|---|---|
| Full locked tree | 1 Critical, 19 High, 16 Moderate, 1 Low | 0 Critical, 0 High, 9 Moderate, 0 Low |
| Production tree | noisy Critical/High runtime and transitive chains | 0 Critical, 0 High, 2 Moderate |

The two production advisories are in React Router 6. Their available fix is a
breaking React Router 7 migration and remains separately gated. Remaining full-
tree advisories are development/mobile tooling chains, not permission to ignore
them indefinitely.

## Validation

- Clean `npm ci`: package-lock SHA-256 remained
  `EDC28FC754B389B2BC4AD63B6E3FAEF5A17E95907B396B2518A794436478DA7D`.
- Focused image-validation tests: 15 passed.
- Complete Vitest suite: 47 files, 273 tests passed.
- Repository TypeScript: passed.
- ESLint: zero errors; 15 known Fast Refresh warnings.
- Production build: passed; 3,752 modules; the progression reassignment warning
  is absent.
- GitHub Actions run `31500110247`: success on Node 22.13, including the new
  dependency policy step.
- Railway deployment `a9907df8-5783-4bd3-93ab-d2f9ad2341c4`: successful.
- Production root and liveness endpoint: `200` / `200`.

Verification performs no authenticated mutation and changes no database row,
schema object, migration, provider setting, credential, variable, grant, RLS
policy, or production data.

## Finding disposition

`GRID-DEP-001` is partially resolved. Its Critical/High release condition is
closed and continuously enforced, but the React Router compatibility migration,
development-tool cleanup, and SBOM/ownership policy remain open work.

## Rollback

Revert application commit `c77f71e97cbb0d3d4dec990ee98f563023a72637`
and redeploy its predecessor. There is no schema or data rollback. A rollback
also removes the CI severity ceiling and restores the larger vulnerable package
tree, so it should be used only for demonstrated compatibility failure.
