# GRIT

GRIT is a fantasy MMA prediction and community platform. Users make picks on real fight cards, compete on net units, follow event intelligence, chat, and review performance. It is not a sportsbook and does not accept wagers.

## Current status

The application is a React/Vite/TypeScript frontend with an Express 5 backend, PostgreSQL via Drizzle, Clerk authentication, Stripe integration, Supabase-backed data, Socket.IO chat, and OpenAI-powered analysis. It is deployed from the `main` branch and remains **not approved for paid, prize-bearing, or viral-scale production launch**. The canonical current implementation and release summary is [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md).

The active release-gate summary is maintained in
[`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md). The June audit findings remain
available as a dated snapshot in
[`docs/system-audit/PRODUCTION_READINESS.md`](docs/system-audit/PRODUCTION_READINESS.md).
The highest-level open gates are:

- authoritative schema reconciliation and production-shaped staging proof;
- administrator revocation and identity-lifecycle authority;
- shared MMA data ownership, identity, and replay rules;
- Stripe entitlement/event-ledger correctness and reward containment;
- safe multi-replica jobs, limits, readiness, and recovery evidence;
- dependency, Supabase exposure, and observability remediation.

Do not enable paid acquisition, creator payments, token sales, or cash rewards until the P0/P1 release gates are closed.

| Pipeline | Current evidence state |
|---|---|
| Fighter ingestion | Review-before-write controls deployed; schema/identity/ownership gates remain |
| Picks and rankings | Remediation evidence exists; production-shaped reconciliation remains gated |
| Groups and AI | Implemented surfaces; viral-scale, cost, and multi-instance proof pending |
| Payments and rewards | Production blocked |
| Creator economy | Not approved for production |
| Production readiness | Controlled internal QA only; paid, prize-bearing, and viral launch not approved |

## Audit documentation

- [Architecture](docs/architecture/README.md)
- [Backend capability ledger](docs/backend/README.md)
- [Backend master implementation plan](docs/backend/plans/MASTER_IMPLEMENTATION_PLAN.md)
- [Payments](docs/payments/README.md)
- [Rankings and picks](docs/rankings/README.md)
- [Creator economy](docs/creator-economy/README.md)
- [Groups](docs/groups/README.md)
- [Deployment](docs/deployment/README.md)
- [Release provenance and R0 containment](docs/deployment/RELEASE_PROVENANCE.md)
- [Current engineering state](docs/CURRENT_STATE.md)
- [Documentation authority](docs/DOCUMENT_AUTHORITY.md)
- [June 2026 system audit snapshot](docs/system-audit/SYSTEM_STATUS_REPORT.md)
- [Monetization audit](docs/system-audit/MONETIZATION_AUDIT.md)
- [Payment flow diagrams](docs/system-audit/PAYMENT_FLOW.md)
- [Ranking and picks audit](docs/system-audit/RANKING_SYSTEM_AUDIT.md)
- [Production readiness](docs/system-audit/PRODUCTION_READINESS.md)
- [Missing features](docs/system-audit/MISSING_FEATURES.md)
- [Technical debt](docs/system-audit/TECHNICAL_DEBT.md)
- [Recommended next build order](docs/system-audit/RECOMMENDED_NEXT_BUILD_ORDER.md)

The older `STATUS.md`, `HANDOFF.md`, and `SPEC.md` describe historical plans and should not be treated as current implementation truth.

## Local development

Requirements: Node.js 20+, npm, and a fresh `.env` based on `.env.example`. Never reuse or commit credentials.

```bash
npm install
npm run dev
```

Development runs Vite plus the user and admin Express processes. Production uses the single server entry point:

```bash
npm run build
npm start
```

The production server mounts user and admin APIs, registers the Stripe webhook before JSON parsing, serves `dist/public`, and exposes `GET /api/health`.

## Verification

```bash
npx tsc --noEmit
npx vitest run
npm run build
npm audit --omit=dev
```

Current R1-M application baseline on August 11, 2026:

- TypeScript: pass
- Vitest: 47 files, 271 tests passed
- ESLint: zero errors; 15 known Fast Refresh warnings
- Production build: pass; 3,931 modules transformed
- Hosted quality gate: pass on the reviewed runtime commit

## Repository map

```text
src/                    React application
server/                 Express APIs, auth, jobs, services, webhooks
shared/                 Drizzle schemas and shared validation/types
migrations/             Baseline plus staged migrations
tests/                  Vitest and operational test scripts
docs/ui-audit/           Visual audit artifacts
docs/system-audit/       Dated audit snapshots and remediation inputs
```

## Operational rules

- Work through reviewed branches and normal pushes; never force-push `main`.
- Treat schema declarations and migrations as separate from deployed database state.
- Never place fixture or fake audit data in the production database.
- Keep Stripe webhook signature verification and raw-body middleware ordering intact.
- Use `flag-icons` for countries and approved headshot/body imagery for fighters.
- Record product behavior in tests before enabling paid or prize-bearing workflows.
