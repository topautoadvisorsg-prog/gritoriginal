# R1-C Legacy Upload Retirement

Status: deployed and production-verified

Date: 2026-08-09

## Objective

Remove the obsolete authenticated endpoint that streamed arbitrary request
bodies to attacker-selected local filesystem paths. Preserve the current R2
presigned upload flows and make no object-storage, database, secret, or provider
configuration change.

## Candidate changes

- Remove `PUT /api/uploads/*` from the production composition root.
- Delete its local filesystem writer implementation.
- Add a source contract proving that the route and implementation cannot return
  through an accidental import.
- Remove the unused generic upload hook whose request-url endpoint is not
  implemented.
- Enforce the documented Challenger/premium entitlement on slip uploads at the
  server route, not only in the interface.
- Confirm that the current avatar and fighter-image clients continue uploading
  directly to their server-issued presigned object-storage URLs.

## Compatibility evidence

Repository-wide client inspection found no caller of the retired `PUT` route.
The unused generic upload hook referenced `POST /api/uploads/request-url`, which
is not implemented server-side. It had no consumers and did not invoke the
removed wildcard `PUT`, so it is deleted with the obsolete boundary. Active
avatar and fighter-image clients upload to the absolute URL returned by their
respective implemented request-url endpoints.

The `/objects` static mount remains unchanged because local event-image and
historical asset compatibility is a separate migration decision. R1-C removes
the arbitrary write boundary only.

The pre-push dependency review identified a separately reachable denial-of-
service concern in the admin-only R2 fighter-image validation path. It is not
introduced by R1-C and requires the next R1-D owned-key/media-validation slice;
R1-C does not widen or conceal that dependency.

## Verification

The promotion gate requires:

- focused R1-C contract tests;
- complete Vitest suite;
- TypeScript;
- ESLint;
- production build;
- diff-integrity review; and
- a production probe proving the retired route returns the generic API `404`
  while R2-backed request-url routes retain their existing authorization.

## Rollback

The verified R1-B deployment is
`5025bbe2-0147-4c6a-adbf-44e6d8964a05`. If an undocumented legacy dependency is
found, roll back the application artifact while migrating that dependency to a
bounded R2 contract. Do not restore an unbounded path-controlled filesystem
writer as a permanent fix.

## Production promotion

| Evidence | Identity / result |
|---|---|
| Reviewed commit | `70590656dab49d69d0f9710be6c76c63967464be` |
| Railway deployment | `1518fe37-219e-456f-8d5a-526d39276d1f` |
| GitHub deployment status | Success, 2026-08-09 17:16:46 UTC |
| `GET /api/health` | `200` JSON |
| Unknown API path | `404` JSON |
| Retired wildcard upload | `404` JSON |
| Unauthenticated slip upload | `401` JSON |
| Unauthenticated data-engine webhook | `401` |
| Oversized ordinary JSON | `413` JSON |
| R1-B header contract | Preserved |

The upload retirement probe used an unauthenticated request to a nonexistent
release-probe path and could not create data. Challenger-tier enforcement is
covered by the source contract; no production user credential was used.

## Stop conditions

Do not promote if a repository client still calls the removed wildcard route,
an active presigned upload workflow changes, the retired route remains mounted,
or the reviewed commit cannot be reconciled to an immutable deployment.
