# R1-B HTTP Security and Request Budgets

Status: local candidate verified; production promotion not yet approved

Date: 2026-08-09

## Objective

Establish an explicit Express/Railway proxy boundary, remove framework
fingerprinting, add compatibility-safe HTTP response headers, and replace the
global 50 MB JSON body allowance with route-aware limits. This slice does not
change authentication, authorization, business logic, database access, or
provider configuration.

## Candidate changes

- Pin `helmet@8.3.0` and apply one shared HTTP-security policy to both Express
  application entry points.
- Disable `X-Powered-By`.
- Trust exactly one proxy hop in production and no proxy outside production.
- Add MIME-sniffing, frame, referrer, popup-compatible opener, and browser
  permissions protections.
- Keep Content Security Policy and HSTS disabled in this slice. Clerk, Sentry,
  storage assets, domains, and OAuth redirects require an observed allowlist;
  HSTS requires an approved domain and subdomain policy.
- Reduce ordinary JSON requests from 50 MB to 1 MB.
- Preserve a bounded 5 MB allowance only for the three existing ingestion
  surfaces that legitimately accept larger structured payloads:
  `/api/fighters/bulk`, `/api/fights/bulk`, and
  `/api/fighters/:id/import-history`.
- Preserve raw-body webhook ordering; security headers run before body parsing,
  while the JSON parsers remain after the Stripe raw webhook route.

## Verification

| Gate | Result |
|---|---|
| Focused R1-B contracts | 8 tests passed across 2 files |
| Full Vitest suite | 36 files, 219 tests passed |
| TypeScript | Pass |
| ESLint | Zero errors; 15 pre-existing Fast Refresh warnings |
| Production build | Pass; 3,931 modules |
| Diff integrity | `git diff --check` pass |
| Dependency resolution | `helmet@8.3.0` installed at depth zero |

The contract tests exercise real ephemeral HTTP servers. They verify the
production proxy setting, header set, deliberate CSP/HSTS absence, 1 MB default
rejection, and successful payload handling on a 5 MB import route.

## Compatibility and risk

Railway terminates public TLS at its edge and forwards to the application, so
Express must interpret forwarded connection metadata through a bounded trust
policy. The one-hop policy is intentionally narrower than an unrestricted
`trust proxy` setting. It must be verified from the deployed public domain
before being treated as production evidence.

Helmet's full default policy was not enabled blindly. CSP, HSTS, COEP, and CORP
can change browser, asset, OAuth, and subdomain behavior; each requires a
separate compatibility inventory and staged rollout. R1-B still adds defenses
that do not require those unresolved policies.

The install-time dependency audit reports 38 advisories: 1 critical, 20 high,
16 moderate, and 1 low. They pre-date or are independent of the single direct
Helmet addition and require a separate dependency-remediation gate. No
automatic audit fix was run.

## Production verification plan

After an approved push and successful Railway deployment:

1. reconcile local `HEAD`, `origin/main`, and Railway source commit;
2. verify `/api/health` remains `200` JSON;
3. verify `X-Powered-By` is absent and the approved headers are present;
4. verify CSP and HSTS remain absent as documented;
5. verify an unknown API route remains a JSON `404`;
6. verify an unauthenticated protected write remains rejected;
7. inspect application logs for proxy warnings, body-parser errors, and OAuth
   regressions; and
8. roll back immediately if auth redirects, static assets, API routing, or
   webhook delivery regress.

## Rollback

There is no schema, data, secret, or provider mutation. Revert the R1-B commit
and redeploy the verified R1-A deployment
`ed76ca30-b305-4e57-ad64-a4ac2bbf8c5b`. Do not compensate by restoring the
unbounded 50 MB default; if a legitimate route fails, add a documented,
route-specific budget with a contract test.

## Stop conditions

Do not promote if the deployment is not traceable to the reviewed commit,
forwarded-protocol handling is inconsistent, a documented security header is
missing, OAuth or asset behavior regresses, ordinary oversized JSON is
accepted, a legitimate import under 5 MB is rejected, or any protected route
becomes reachable without its existing authorization boundary.
