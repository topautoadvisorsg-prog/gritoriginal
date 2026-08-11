# R1-H TypeScript Contract Baseline

Status: local candidate; not deployed

Date: 2026-08-10

## Objective

Restore the repository-wide TypeScript project-reference gate after R1-G
exposed ten pre-existing frontend and domain-contract errors.

## Candidate changes

- Add the existing Vite `@shared` alias to the application TypeScript paths.
- Restore the missing `Loader2` icon import used by system-settings save states.
- Validate the news-tag category string before assigning its narrow union.
- Align fighter-corner streak reads with the canonical snake-case fighter
  contract.
- Declare the three optional imported win-percentage metrics already produced
  by the fighter transformer and exposed by import mappings.
- Import the export-preview fight record from its authoritative transform
  module instead of a nonexistent type module.
- Normalize database card placements to the `EventFight.fightType` union and
  carry the required round count into event-history cards.

No blanket cast, `any`, `@ts-ignore`, loosened strictness flag, or domain-union
widening is used.

## Safety boundary

This is a compile-time and UI-adapter correction only. It changes no database,
migration, API route, authentication rule, provider setting, secret, production
data, deployment configuration, or media lifecycle.

## Validation gate

| Gate | Result |
|---|---|
| Focused type-contract regression | 1 file, 3 tests passed |
| Complete Vitest suite | 42 files, 248 tests passed with `--maxWorkers=1` |
| Repository TypeScript (`npx tsc -b`) | Pass |
| ESLint | Zero errors; 15 pre-existing Fast Refresh warnings |
| Production build | Pass; 3,931 modules |

Promotion still requires exact deployment identity and unauthenticated
production regression probes.

## Rollback

Revert only the R1-H commit. R1-G object-storage behavior is independent and
must remain intact.
