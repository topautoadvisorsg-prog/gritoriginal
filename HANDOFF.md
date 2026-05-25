# GRIT — Developer Handoff

**Last updated:** 2026-05-21 (end of Week 0)
**Status:** Week 0 complete. Production DB synced. Ready for Week 1 (Auth + Stack Provisioning).

> **You're picking this up cold?** Read in this order:
> 1. **`STATUS.md`** — live progress board, where the project is RIGHT NOW (updated after every work session)
> 2. **This file (`HANDOFF.md`)** — onboarding context (what GRIT is, how to boot, architecture, landmines)
> 3. **`SPEC.md`** — the build plan (v2.1 blueprint-first; Part I product spec, Part II build plan, Part III reconciliation)
> 4. **`grit-blueprint-v6.1.2-production.html`** in `~/Downloads` — the master product blueprint (ultimate source of truth)
>
> If you're a second dev joining: read STATUS.md "Coordination Protocol" before editing anything.

---

## TL;DR — What This Project Is

GRIT is an MMA intelligence + fantasy prediction platform. Users compete on real fight cards using real data, real odds, AI assistance. **It is NOT a sportsbook.**

> 🚫 **HARD RULE — NO REMOTE GIT.** This project has no GitHub/GitLab/Bitbucket remote and intentionally stays local. Local commits for history are fine. Never `git push`, never `git remote add`, never create a remote repo. If you need to share code, use a zip + secure transfer.

Two repos in this build:

| Repo | Path | Role |
|---|---|---|
| `gritapp` | `C:\Users\jovan\Downloads\gritapp` | Main user app (Node + React + Postgres) — **this file lives here** |
| `dataintakegrit` | `C:\Users\jovan\Downloads\dataintakegrit` | Python pipeline that scrapes MMA data and pushes to gritapp via webhook |

A third project (AI Prediction Engine — Claude vs GPT vs Grok) is **Phase 3 only**. Don't touch.

---

## Where We Are Right Now

Week 0 of a planned 9-week Phase 1 build. The 9-week plan is detailed in `SPEC.md §6`. Week 0 was emergency stabilization + truth-finding; we found a lot of drift between code and DB and fixed it.

### What's done

- **22 cleanup + bug-fix tasks shipped** (see SPEC.md §4.1 for the full list)
- **Production DB synced** — went from 30 tables (missing 16) to 52 tables. Drizzle baseline is clean. Migration history starts fresh from here.
- **All 6 architecture decisions resolved** (see SPEC.md §4.1, "Week 0 Decisions — Resolved")
- **4 runtime crash bugs fixed** in main app (scoringService, notificationService, groupService, App.tsx routes). Note: a 5th "jobService pg-boss import" claim from the audit was wrong on verification — original code was correct, no change needed.
- **1 Python bug fixed** in dataintakegrit reconciler
- **Vitest stood up** with 7 baseline scoring tests
- **`BrandAsset` placeholder component** ready — drop SVGs into `public/brand/<name>.svg` and they swap in 1:1

### What's NOT yet built (Week 1+ work)

- Clerk auth (still on Replit OIDC)
- Stripe Connect (only basic Stripe subs work)
- Token economy ($5/$10/$20 packs)
- Creator economy (free vs paid creator, 1-on-1 sessions)
- Live fighter rating + 5-criteria UI
- Per-fight notes UI (the table exists, no frontend yet)
- Founder badges, Gold Key UI
- OneSignal notification triggers (table fixes done, wiring not started)
- 7-step onboarding (only a single `WelcomeModal.tsx` exists)
- In-app Rules tab
- ToS / Privacy / Cookie / Creator Agreement pages
- Multi-account detection (FingerprintJS)
- Sub lapse survival rules
- Refund flow with Stripe metadata mirror

See `SPEC.md §6` for the full 9-week schedule.

---

## Quick Start — Get Running Locally

### 1. Install deps

```bash
cd C:\Users\jovan\Downloads\gritapp
npm install
```

Two lockfiles exist (`package-lock.json` + `bun.lock`). **Use npm.** Bun lockfile is a leftover from an earlier experiment and will be cleaned up.

### 2. Verify .env

`.env` is gitignored and already populated with working Supabase credentials. Verify by running:

```bash
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL ? 'OK' : 'MISSING')"
```

Should print `OK`. If not, see "Credentials" section below.

### 3. Verify DB connection + schema

```bash
npx drizzle-kit migrate
```

Should report "No migrations to apply" (Week 0 baseline already applied). If you see new pending migrations, that means schema changed — apply them.

### 4. Run tests

```bash
npm run test
```

Should show 7 passing in `tests/unit/scoring.test.ts`.

### 5. Boot dev servers

```bash
npm run dev
```

Runs three processes concurrently:
- `tsx watch server/user-server.ts` (user API + admin API on port 3001)
- `tsx watch server/admin-server.ts` (admin API alone on port 3002 — dev convenience, prod uses port 3001 for everything)
- `vite` (frontend on port 5173)

In production, `npm start` runs `tsx server/production.ts` which only boots the user-server (single-port deploy for Railway).

---

## Credentials

`.env` is gitignored. Required for anything to boot:

| Var | Set? | Source |
|---|---|---|
| `DATABASE_URL` | ✅ | Supabase session pooler (us-west-2) |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Pasted from founder's pw api file |
| `SESSION_SECRET` | ✅ | Generated, 48 bytes base64 |
| `ADMIN_EMAIL` | ✅ | `saraimateo1612@proton.me` |
| `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `STRIPE_*` | ❌ | Placeholders — fill when wiring those services |
| Phase 1 stack (`CLERK_*`, `INNGEST_*`, `UPSTASH_*`, `RESEND_*`, `POSTHOG_*`, `ONESIGNAL_*`) | ❌ | Provision in Week 1, paste keys then |

**Important:** Supabase's `db.<ref>.supabase.co` direct host is IPv6-only and won't resolve from most Node hosts. We use the **session pooler at port 5432**: `aws-0-us-west-2.pooler.supabase.com`. User format is `postgres.<project-ref>`, not just `postgres`. If you ever rotate keys, keep the pooler format.

---

## Repository Map — What Lives Where

### `gritapp` (Node + React)

```
gritapp/
├── server/                          # Express backend
│   ├── production.ts                # npm start entry — loads dotenv + imports user-server
│   ├── user-server.ts               # Mounts ALL routes (user + admin) in prod
│   ├── admin-server.ts              # Dev-only convenience (port 3002), NOT used in prod
│   ├── db.ts                        # Drizzle client
│   ├── config/env.ts                # Zod-validated env schema + hardcoded config constants
│   ├── auth/guards.ts               # isAuthenticated, requireAdmin, requireTier, requireFeature
│   ├── replit_integrations/auth/    # Replit OIDC (REMOVE in Week 1, replaced by Clerk)
│   ├── api/
│   │   ├── webhooks/stripeWebhook.ts
│   │   ├── webhooks/dataEngineWebhook.ts
│   │   └── bootstrapRoute.ts        # Admin reset/status endpoints, API-key protected
│   ├── services/                    # Business logic
│   │   ├── scoringService.ts        # ⚠️ Rewriting Week 3 (flat points → net units)
│   │   ├── progressionService.ts    # ⚠️ Has monthly duplicate logic, kill in Week 3
│   │   ├── leaderboardService.ts
│   │   ├── raffleService.ts
│   │   ├── stripeService.ts         # Will gain Connect + escrow in Week 5
│   │   ├── anthropicService.ts      # claude-sonnet-4-6 (updated Week 0)
│   │   ├── notificationService.ts   # 4 trigger helpers, paths fixed Week 0
│   │   ├── groupService.ts
│   │   ├── slipService.ts           # if present
│   │   ├── cronService.ts           # node-cron jobs (migrating to Inngest Week 8)
│   │   ├── jobService.ts            # pg-boss (will be replaced by Inngest)
│   │   ├── expirationService.ts     # Wired to daily cron Week 0
│   │   ├── dataEngineService.ts     # 650 lines, monolithic — refactor Phase 2
│   │   └── ...
│   ├── admin/routes/                # 15+ admin route files, all under /api/admin/* guarded
│   └── user/routes/                 # 22+ user route files
├── src/                             # React frontend (Vite + TS)
│   ├── App.tsx                      # React Router setup (12 routes now incl. /groups)
│   ├── user/components/             # Feature-grouped components
│   ├── admin/components/            # Admin dashboards
│   └── shared/
│       ├── components/ui/           # shadcn/ui + BrandAsset (Week 0 new)
│       ├── context/                 # AuthContext, FighterDataContext, GamificationContext
│       └── hooks/
├── shared/                          # Code shared between frontend + backend
│   ├── schema.ts                    # Drizzle: domain tables (fighters, events, picks, etc.)
│   └── models/auth.ts               # Drizzle: users, picks, moderation
├── migrations/
│   ├── 0000_baseline_phase1.sql     # Week 0 fresh baseline (the only live one)
│   ├── meta/                        # Drizzle journal
│   └── _archive_pre_phase1/         # Old broken migrations, historical reference only
├── public/
│   ├── brand/                       # SVG drop zone — see README.md inside
│   └── locales/                     # i18n (9 langs, only en wired so far)
├── tests/                           # Vitest tests
│   └── unit/scoring.test.ts         # Week 0 baseline tests
├── vitest.config.ts
├── drizzle.config.ts                # FIXED Week 0 — now reads BOTH schema files
├── STATUS.md                        # LIVE progress board (read FIRST). Updated after every work session.
├── HANDOFF.md                       # You are here — onboarding context
├── SPEC.md                          # Master plan (v2.1 blueprint-first)
├── README.md                        # Entry-point router
└── .env                             # Gitignored. See "Credentials" above.
```

### `dataintakegrit` (Python FastAPI)

```
dataintakegrit/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entry, 50+ endpoints
│   │   ├── agents/
│   │   │   ├── pipeline_manager.py  # ⚠️ MANUAL_INGESTION_MODE = True → Agents 1/2/3/7 disabled
│   │   │   ├── agent1_event/        # UFCStats scraper (disabled)
│   │   │   ├── agent2_profile/      # Sherdog + Claude (disabled)
│   │   │   ├── agent3_history/      # Sherdog history (disabled)
│   │   │   ├── agent4_intelligence/ # Brave News + Claude (LIVE, every 6h)
│   │   │   ├── agent6_odds/         # BestFightOdds (LIVE, every 24h)
│   │   │   └── agent7_image/        # DALL-E 3 (built, currently skipped)
│   │   ├── services/event_fight_reconciler.py  # Bug fixed Week 0
│   │   ├── scheduler/tasks.py
│   │   ├── scrapers/
│   │   └── utils/
│   └── migrations/                  # Standalone SQL files (separate from gritapp)
├── frontend/                        # Vite + React operator dashboard
│   └── src/pages/ManualIngest.tsx   # 1693 LOC — the REAL ingestion path right now
└── README.md                        # Source of truth for the pipeline
```

---

## Architecture Principles Going Forward

The previous codebase drifted because there was no enforced separation between layers. Phase 1 fixes this. **Every new file/feature must follow these rules:**

1. **Schema is source of truth for DB.** Never `db:push --force` against prod. Always `drizzle-kit generate` → review SQL → `drizzle-kit migrate`. Both schema files (`shared/schema.ts` + `shared/models/auth.ts`) are listed in `drizzle.config.ts`.

2. **Routes are thin.** They validate inputs (Zod), call a service, return a response. No business logic in route handlers.

3. **Services own business logic + DB writes.** Routes never touch `db.*` directly except for trivial reads.

4. **Shared types live in `shared/`.** Frontend imports from there too — single source of truth for response shapes.

5. **Frontend pages compose components, components are dumb when possible.** Heavy data fetching at the page level via React Query.

6. **Tests live next to what they test.** `server/services/foo.ts` → `server/services/foo.test.ts`, OR aggregate in `tests/unit/` for cross-cutting tests like scoring.

7. **Config constants live in `server/config/env.ts`.** Never `process.env.X` deep inside services. Add a Zod field, export through `env`.

8. **Env vars: empty strings are stripped to undefined automatically.** So `.env` placeholders like `STRIPE_SECRET_KEY=` don't fail validation. See `stripEmptyStringEnv` in `env.ts`.

9. **No silent fallbacks for security-critical config.** Old code had `env.ADMIN_EMAIL ?? "hardcoded@example.com"` — now `guards.ts` throws if `ADMIN_EMAIL` is missing.

10. **When you touch a file, leave it cleaner than you found it.** Touch a 14-`as any` file? Replace one of them with a proper type. Compound interest on quality.

---

## Known Landmines

Things that will bite you if you don't know:

| Landmine | Why It's There | What To Do |
|---|---|---|
| `MANUAL_INGESTION_MODE = True` in dataintakegrit's `pipeline_manager.py:20` | Disables Agents 1, 2, 3, 7. Manual ingestion via `ManualIngest.tsx` (1693 LOC) is the actual live path. | Don't flip it without a real plan. Phase 2 work. |
| `users.tier` is currently `'free' \| 'medium' \| 'premium'` | Blueprint demands `contender \| challenger \| creator` rename | Week 2 migration. Plan a rename script for any seeded data. |
| `users.progressBadge` missing `'grandmaster'` | Blueprint requires 5 tiers, schema has 4 | Week 3 migration along with scoring rewrite. |
| Stripe API version `'2025-01-27.acacia'` hardcoded in `stripeService.ts` | Future date string, verify it's a real Stripe version | Bump when wiring Stripe Connect in Week 5. |
| Tests under `tests/` (NOT `tests/unit/`) are 5 hardcoded tsx scripts | They reference real prod UUIDs and admin IDs | Don't run them. They'll be rewritten as Vitest cases. |
| `package.json` start script uses `tsx`, no compiled output | Production runs TypeScript directly | Fine for Railway. Cold-start cost is meaningful. |
| Capacitor + AdMob packages installed | No mobile build pipeline | Ignore until Phase 3 mobile app work. |
| pg-boss queue handler only registered for `outbound-sync` | Only one queue exists | If you add background jobs, prefer Inngest (coming Week 8). |
| `bootstrapRoute.ts` `/api/setup/full-reset` is API-key protected | Wipes all content data | Rotate `DATA_ENGINE_API_KEY` before launch. |
| `/api/setup/status` endpoint has NO auth | Info leak (counts only) | Gate to admin before public launch. |
| The dashboard's "ActivityWidget" is gone but `FriendsActivityFeed` is live | Two implementations existed; the live one is `FriendsActivityFeed.tsx` | Don't resurrect the deleted widget. |
| 36 npm vulnerabilities reported on install (1 critical, 12 high) | Mostly transitive deps from old packages | Task #23 in the TaskList — schedule for end of Week 0 / start of Week 1. |

---

## Next Up — Week 1 (Auth + Stack Provisioning)

**The week 1 sequence per SPEC.md §6:**

1. **Provision accounts:** Clerk, Supabase (done), Stripe Connect, Upstash, Inngest, OneSignal, Resend, PostHog. Paste API keys into `.env`.
2. **Migrate auth: Replit OIDC → Clerk.** Highest-risk single change. Touches every protected route, every middleware, every frontend `useAuth` hook.
3. **2FA enforcement** for users with active subscription (Clerk natively supports SMS + authenticator).
4. **Run `npm audit fix`** (task #23) once new packages settle.
5. **Add Clerk + Supabase SDKs** to package.json.
6. **Verify both servers boot, all tests pass, basic auth flow works** on Clerk before declaring Week 1 done.

When you start Week 1, mark task #15 done (it is), then create the Clerk migration task.

---

## Communication With Founder

| What | How |
|---|---|
| Direct, fast | He prefers terse status. Bullet points + tables. |
| Match energy | He curses. Match if it feels natural, don't force it. |
| Push back when needed | Founder explicitly asked for pushback on technical calls. Always state why. |
| Don't ask permission on cleanup decisions | He gave full autonomy on architecture. Document deletions in SPEC.md, no need to ask first. |
| Big decisions: write to SPEC.md, get explicit approval | Anything that changes scope, pricing, business model, or hard rules from blueprint (see SPEC.md §8) needs sign-off. |
| Don't bring up SVGs | He'll deliver them. Wire `BrandAsset` placeholders and move on. |

---

## TaskList Snapshot (as of handoff)

Run `TaskList` to see current state. As of Week 0 close:

| Completed (22) | scoringService crash fix · notificationService import path · groupService imports · jobService pg-boss · Groups routes mounted · Anthropic model bump · expirationService cron · admin email env · reconciler TypeError · env vars aligned · .env setup · SESSION_SECRET · dead components deleted · Vitest installed · emoji-mart installed · BrandAsset placeholders · Drizzle baseline regen · DB synced · SPEC.md written · production.ts audit · bootstrapRoute audit · deep audits ×2 |
| Pending | #4 Monthly progression → snapshot-only (Week 3) · #23 `npm audit fix` review (end of Week 0) · #24 HANDOFF.md (this file) |

---

## Where Everything Important Lives — Cheat Sheet

| Need to... | Open this |
|---|---|
| Understand the product | `~/Downloads/grit-blueprint-v6.1.2-production.html` |
| Understand the build plan | `SPEC.md` |
| Pick up where things left off | This file (HANDOFF.md) |
| Pick up where things left off, programmatically | TaskList tool |
| See what tables exist | `shared/schema.ts` + `shared/models/auth.ts` |
| See what API endpoints exist | `server/admin/routes/` + `server/user/routes/` |
| See what frontend routes exist | `src/App.tsx` |
| See what env vars are required | `server/config/env.ts` |
| Add a service | `server/services/<name>.ts` |
| Add a route | `server/user/routes/<name>.ts`, register in `user-server.ts` |
| Add a component | `src/user/components/<feature>/<Component>.tsx` |
| Add a test | `tests/unit/<area>.test.ts` |
| Drop a brand asset | `public/brand/<name>.svg` (see README in that folder) |

---

*Built by Claude (Claudio) under direction of Jovan, Smart Click Agency. v6.1.2 production-ready blueprint. Phase 1 in progress.*
