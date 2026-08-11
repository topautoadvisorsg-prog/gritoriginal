# MMA Grid Release Provenance

**Verified:** 2026-08-09
**Method:** read-only Railway deployment-detail inspection plus local Git
comparison
**Cloud mutations:** none

## Authoritative chain

| Layer | Authority / identity |
|---|---|
| Local repository | `C:\Users\jovan\Downloads\gritapp` |
| Git remote | `https://github.com/topautoadvisorsg-prog/gritoriginal.git` |
| Branch | `main` |
| Current deployed commit | `c0a741ef00b5feb720c8f06be5458aa91272c3d3` |
| Railway workspace | `topautoadvisorsg-prog's Projects` |
| Railway project | `virtuous-freedom` / `68681fa5-aff3-426a-b48d-4b375a6092ae` |
| Railway environment | `production` / `bb6c0026-993f-4eda-8298-785a37a120e7` |
| Railway service | `gritoriginal` / `eb45b6c8-997b-4fad-9dda-16ba62c95969` |
| Active deployment | `7d19679b-3ea0-400c-98e6-73ce2316c57d` |
| Previous rollback deployment | `d2c10de6-8812-4f91-a50d-a4ef5b0f100c` |
| Public Railway domain | `gritoriginal-production.up.railway.app` |
| Region / replicas | `sfo` / 1 |
| Build / start | Nixpacks; `npm install --include=dev && npm run build`; `npm start` |
| Health gate | `GET /api/health`, 100-second timeout |

Railway's active deployment links directly to the GitHub commit above. At the
time of verification, local `HEAD`, remote `origin/main`, and the active Railway
deployment all referenced the same commit. The previous deployment remains the
recorded application rollback artifact.

## Database linkage

The read-only Audit 3 database target fingerprint is
`8b3f502f18638396`. This non-secret fingerprint is the comparison handle until
the project/service variable-to-Supabase project relationship is independently
recorded without exposing credentials. Database schema reconciliation remains a
separate gate; provenance does not approve migrations.

## Clerk and Stripe linkage

The code contains Clerk and Stripe integrations, but R0 did not inspect or copy
secret values. Exact Clerk instance and Stripe account/mode identifiers remain
required evidence before authentication or payment production authorization.
Payments and rewards remain disabled by release policy.

## Per-release evidence requirement

Before promotion, record:

1. reviewed commit and tree;
2. CI/test artifact and checksums;
3. Railway project, environment, service, and deployment IDs;
4. source repository and branch shown by Railway;
5. database baseline/fingerprint and migration decision;
6. Clerk instance and Stripe mode/account identifiers without secrets;
7. previous known-good deployment ID;
8. rollback owner and verification result.

Stop if any identifier is missing, mismatched, or inferred rather than observed.
