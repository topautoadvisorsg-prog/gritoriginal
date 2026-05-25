# GRIT — Phase 1 SPEC

**Version:** v1.2 · Reconciles Blueprint v6.1.2 against verified codebase reality
**Date:** 2026-05-22 · v1.2 additions: Monthly Bonus Draw build (Week 8), Intel Feed admin+gating (Week 4), Chat per-event admin toggle (Week 7), Founder slot atomic allocation (Week 3), Sub-lapse survival rules enumerated (Week 8)
**Status:** ✅ Week 0 executed · Week 1 ready to start
**Source of Truth:** This document. Where it conflicts with the README, this wins.

> **New devs / future sessions: read `HANDOFF.md` first.** It tells you where things stand right now, what's done, and what's next. Then come back here for the full plan.

---

## 1. Mission

GRIT is an **MMA intelligence + fantasy prediction platform.** It is NOT a sportsbook. Fans compete against each other on real fight cards using real data, real odds, and AI.

End goal: **UFC partnership or acquisition** → platform revenue funds a **fighter development gym in Mexico** (full ride, school, housing, training for young fighters from underprivileged backgrounds).

Every engineering decision serves that mission.

---

## 2. Two-Project Architecture

| Project | Role | Stack | Phase 1 Touch |
|---|---|---|---|
| `gritapp` | Main user app (B2C) | Node 20+, Express, React 18, Vite, Drizzle, PostgreSQL | **Heavy rewrite** |
| `dataintakegrit` | Data pipeline (scrapes + pushes via webhook) | Python FastAPI, CrewAI, Claude, DALL-E 3 | **Fix bugs, defer refactor to Phase 2** |

A third project — **AI Prediction Engine** (Claude vs GPT vs Grok) — is **Phase 3 only.** Do not touch.

---

## 3. What Stays — Verified Working

| System | Reality |
|---|---|
| Pick system core (moneyline submission, locked odds, flag write) | Wired ✅ |
| `roiCalculator.ts` | Imported + working (foundation for new scoring engine) |
| Event lifecycle (Upcoming → Live → Completed → Closed → Archived) | ⚠️ **Verify migration 0006 didn't collapse this** (Critical Decision #2) |
| Fighter database + history | Wired ✅ |
| Raffle pool / draws / Stripe auto-add | Wired ✅ |
| Community Chat (Socket.io) | Wired ✅ |
| Pick Board (html2canvas share cards) | Wired ✅ |
| Tag system | Wired ✅ |
| Stripe subscriptions + one-time payments + webhooks | Wired ✅ (no Connect yet) |
| Anthropic SDK (fallback only) | Wired ✅ (model now `claude-sonnet-4-6`) |
| OpenAI GPT-4o-mini (primary AI) | Wired ✅ |
| Drizzle ORM | Keep — DO NOT change ORM |
| Zod validation | Keep |
| Framer Motion, shadcn/ui, react-i18next, html2canvas | Keep |
| Sentry (browser + server) | Keep — already initialized when DSN set |
| OneSignal SDK | Keep — partial wiring, will complete in Phase 1 |
| OpenMeter SDK | Keep — could anchor the new AI token economy |

---

## 4. WEEK 0 — Emergency Stabilization (Cannot Skip)

Before any feature work. Estimated 2-3 days.

### 4.1 Week 0 — COMPLETED 2026-05-21

| ✅ | Item | Notes |
|---|---|---|
| ✅ | `scoringService.ts` clean-sweep `ReferenceError` fix | Added `ne`, `gt`, `badgeAudit` imports |
| ✅ | `notificationService.ts` dynamic schema import path | 3 occurrences fixed (`../db/schema` → `../../shared/schema`) |
| ✅ | `groupService.ts` missing type imports | `Group`, `GroupMember` now imported |
| ↩️ | `jobService.ts` pg-boss import (audit claim was wrong) | Audit said default-import bug. Verified: pg-boss v12 uses **named** export `{ PgBoss }`. Original code was correct. Reverted my "fix." |
| ✅ | Groups routes mounted in `App.tsx` | `/groups`, `/groups/:groupId` live |
| ✅ | Anthropic model bump | `claude-3-5-sonnet-20240620` → `claude-sonnet-4-6` |
| ✅ | `expirationService.checkExpirations` wired to daily 03:00 cron | Revenue leak plugged |
| ✅ | Admin email hardcoded fallback removed | Throws at boot if `ADMIN_EMAIL` env var missing |
| ✅ | Python reconciler `TypeError` (line 346) | `len(expected_fights)` → `expected_fights` |
| ✅ | `env.ts` schema expanded + empty-string handling | Added Phase 1 placeholders, strips `""` so optionals work |
| ✅ | `.env` + `.env.example` aligned | All vars documented |
| ✅ | Dead frontend components deleted | 12 files + 5 empty dirs removed (RaffleTab, InfluencerTab, InfoTab, dashboard widgets, mock data) |
| ✅ | Vitest installed | `npm run test`, 7 baseline scoring tests passing |
| ✅ | emoji-mart installed | Ready for Challenger tier gating in Week 7 |
| ✅ | `BrandAsset` placeholder component + `/public/brand/` drop zone | SVGs swap in 1:1 when delivered |
| ✅ | `drizzle.config.ts` fixed to include BOTH schema files | Root cause of migration drift — was only seeing `shared/schema.ts`, missing `shared/models/auth.ts` |
| ✅ | Production DB synced to current schema | 30 tables → **52 tables**, 16 missing tables now exist |
| ✅ | Old migrations archived | Moved to `migrations/_archive_pre_phase1/` for historical reference |
| ✅ | Fresh Drizzle baseline (`0000_baseline_phase1.sql`) | Proper migration history starts here |
| ✅ | Test users wiped (5 → 0), orphan tables dropped (`activity_log`, `odds`) | Clean slate |

### Week 0 Decisions — Resolved

| # | Decision | Outcome |
|---|---|---|
| 1 | Drizzle migration strategy | ✅ Regenerated baseline. Migration history clean. Going forward: `drizzle-kit generate` → `drizzle-kit migrate`, never `db:push --force` for prod. |
| 2 | Monthly progression | ✅ Approved as **snapshot-only** (Week 3 implementation). |
| 3 | Migration 0006 event status collapse | ✅ **CANCELLED** — never actually applied to prod. `events.status` is fine. |
| 4 | Dead frontend components | ✅ Deleted (see 4.1 above). |
| 5 | dataintakegrit `MANUAL_INGESTION_MODE` | ✅ Stays for launch. Agents 1/2/3/7 re-enable is Phase 2 work. |
| 6 | Vitest before scoring rewrite | ✅ Stood up. 7 baseline tests pin current flat-points math so Week 3 rewrite is visibly intentional. |

### 4.2 Week 0 Items Still Open / Deferred

| # | Severity | Item | Effort |
|---|---|---|---|
| 1 | **BLOCKER** | **Regenerate Drizzle migration baseline.** Snapshot is 2399 lines but `0000_*` SQL is 2 lines. Journal registers 2 of 9 migrations. `npm run db:push --force` is the actual DB sync mechanism. **A fresh deploy will produce a broken schema.** Action: dump prod schema, regenerate `0000` baseline, renumber the duplicate `0001_*` collision, re-anchor the journal. Until done, the project cannot be deployed to a clean Railway database. | 1 day |
| 2 | **CRITICAL** | **Verify migration 0006 reality.** Migration `0006_event_status_draft_ready.sql` collapses `OPEN/LIVE/CLOSED/ARCHIVED` → `draft\|ready` and adds CHECK constraint. README + blueprint both assume the 5-status lifecycle. Action: query prod DB to check actual constraint. If applied, every event-status-dependent code path is wrong and we must roll it back OR rebuild the lifecycle to match the new constraint. | 0.5 day |
| 3 | **HIGH** | **Fix Python reconciler `TypeError`** at `dataintakegrit/backend/app/services/event_fight_reconciler.py:346`. `len(expected_fights)` on int. Currently masked by surrounding try/except. | 5 min |
| 4 | **HIGH** | **Fix flag budget hardcoding** at `src/user/pages/FightDetail.tsx:525-526`. `flagBudget={5}` and `flagsUsed={0}` are TODO literals. Frontend doesn't enforce budget from server. | 1 hour |
| 5 | **HIGH** | **Stub `progressionRoutes.ts` has 0 endpoints.** Users have no API to fetch their stars/badges/ROI. Backend logic exists in `progressionService` but no route exposes it. | 2 hours |
| 6 | **MED** | **Document `MANUAL_INGESTION_MODE = True`** in dataintakegrit README. Agents 1, 2, 3, 7 are globally disabled. Manual ingestion UI (1693-line `ManualIngest.tsx`) is the live ingestion path. README claims agents work. | 30 min |
| 7 | **MED** | **Add missing env vars** to `.env.example` + `env.ts` schema (SENTRY_DSN, DB_MAX_CONNECTIONS, CUSTOM_DOMAIN, OPEN_AI_KEY, OPENMETER_BASE_URL, LOG_LEVEL, WEBHOOK_KEY). Also pre-register Phase 1 placeholders (CLERK_*, SUPABASE_*, INNGEST_*, UPSTASH_*, RESEND_*, POSTHOG_*, ONESIGNAL_APP_ID, ONESIGNAL_API_KEY) as optional. | 1 hour |
| 8 | **MED** | **`/api/setup/status` endpoint is publicly unauthenticated.** Info leak (fighter count, event count, pending pipeline count). Either gate to admin or remove. Rotate `DATA_ENGINE_API_KEY` before deploy regardless — it controls `/setup/full-reset` which wipes all content. | 1 hour |
| 9 | **LOW** | **Resolve `bun.lock` vs `package-lock.json`** conflict. Pick npm OR bun, delete the other lockfile. | 5 min |
| 10 | **LOW** | **Add a test framework** (Vitest) and rewrite the 5 hardcoded tsx integration scripts under `tests/` to use seeded test data instead of prod UUIDs. Without this, scoring rewrite has zero safety net. | 1 day |

**Week 0 total: ~3 days.**

---

## 5. Phase 1 — Decision Points (Need Founder Sign-Off)

Six decisions block heavy build work. Decide before Week 1 starts.

### Decision #1 — Drizzle Migration Strategy

Two paths:

| Option | Pros | Cons |
|---|---|---|
| **A. Regenerate baseline from prod, use proper migrations going forward** | Reproducible deploys, CI-safe, standard practice | 1 day work, requires prod DB dump access |
| **B. Keep `db:push --force` forever, ignore migrations** | Zero work | Cannot deploy to a fresh DB, no rollback, no version history |

**My recommendation: A.** B is technical debt that compounds. Worse on every new env.

### Decision #2 — What Happens to Monthly Progression?

`runMonthlyProgression` runs at 1st of month 00:01. Calls `calculateUserProgression(monthStart, monthEnd)`. Blueprint says **progression is per-event ONLY**. Three paths:

| Option | Behavior |
|---|---|
| **A. Delete monthly entirely** | Aligns with blueprint. Lose archival monthly stats. |
| **B. Keep monthly as a *snapshot* only** (no star changes, just leaderboard record) | Compromise — preserves historical analytics view |
| **C. Keep monthly as-is, accept the per-event/monthly hybrid** | Conflicts with blueprint, but matches existing user expectations |

**My recommendation: B.** Stars/badges only move per-event. Monthly still snapshots ROI rankings for the bonus draw + leaderboard history.

### Decision #3 — Event Status Lifecycle

If migration 0006 already applied: the DB now only allows `draft|ready`. README + blueprint assume `Upcoming → Live → Completed → Closed → Archived`.

| Option | Behavior |
|---|---|
| **A. Roll back 0006**, restore 5-state lifecycle | Aligns with blueprint, requires DB CHECK rebuild |
| **B. Keep 2-state, redesign UX around it** | Less work but loses meaningful "Live"/"Closed" semantics that drive scoring + raffle |

**My recommendation: A.** Blueprint requires the 5-state lifecycle for raffle close, snapshot trigger, pick lock, etc. The 2-state collapse appears to have been an error.

### Decision #4 — Dead Frontend Components

Audit found ~8 dead components and 3 duplicates: `RaffleTab`, `InfluencerTab`, `InfoTab`, `dashboard/widgets/*` (5 files), `dashboard/StatCard` (duplicate of shared), `ActivityWidget` + `ActivityFeed` (both replaced by `FriendsActivityFeed`).

| Option | Behavior |
|---|---|
| **A. Delete all dead components now** | Reduces surface area, lower confusion |
| **B. Leave them, rebuild fresh per blueprint** | Easier to reference old patterns when rebuilding |

**My recommendation: A.** Blueprint explicitly says "reduce surface area." Reference patterns from git history if needed.

### Decision #5 — dataintakegrit `MANUAL_INGESTION_MODE`

Agents 1/2/3/7 are globally disabled. Manual ingestion UI is the live path.

| Option | Behavior |
|---|---|
| **A. Leave manual mode for launch, defer automation to Phase 2** | Less risk, but operator burden continues |
| **B. Re-enable agents 1/2/3, fix data quality issues (Islam Makhachev test) before launch** | Automation works for launch, more risk |
| **C. Hybrid — agents run in shadow mode, output goes to manual review queue** | Best of both, more code |

**My recommendation: A.** Phase 1 is already 9 weeks. Manual ingestion is working. Don't take on agent debugging during launch crunch.

### Decision #6 — Test Framework Now or Later?

Currently zero CI-runnable tests. Scoring rewrite (the largest change) has no safety net.

| Option | Behavior |
|---|---|
| **A. Stand up Vitest in Week 0, write scoring tests before rewriting scoring** | Safer rewrite, +2 days |
| **B. Rewrite scoring without tests, manual QA only** | Faster, risky |

**My recommendation: A.** Scoring is the heart of the product. A regression breaks every leaderboard, every star, every key. Worth 2 days.

---

## 6. Phase 1 — 9-Week Sequence (Updated)

Assumes founder approves recommendations above.

### Week 0 — Stabilization
- All §4.2 items
- Vitest scaffolded with scoring tests against current behavior
- SPEC.md committed

### Week 1 — Auth + Foundation
- Migrate Replit OIDC → Clerk (highest risk — touches every protected route)
- Provision: Clerk, Supabase, Stripe Connect, Upstash, Inngest, OneSignal, Resend, PostHog
- Add Clerk + Supabase SDKs, swap auth middleware
- 2FA enforcement gated to Challenger tier (decision: enforce at signup or first sub?)

### Week 2 — DB Migration to Supabase + Schema Alignment
- Move from PostgreSQL/Drizzle to Supabase Postgres (still Drizzle ORM)
- Add `grandmaster` to `users.progressBadge` enum + `config.BADGE_TIERS`
- Rename tier enum: `free|medium|premium` → `contender|challenger|creator` (migration + frontend updates)
- 1-unit tolerance: change progression math from `roi < 0 = -1 star` to `roi-units < -1 = -1 star`
- Add token-economy tables: `token_packs`, `token_balances`, `token_transactions`
- Add creator tables: `creator_profiles`, `creator_subscriptions`, `chat_sessions`
- Add `fighter_ratings` table (5 criteria + anti-spam metadata)
- Add `device_fingerprints` table (multi-account detection)

### Week 3 — Scoring + Progression Rewrite
- **Replace flat-points scoring with net-units ROI engine.** Moneyline only counts for ranking. Method/round still tracked but flagged "just for fun" in UI.
- Rewrite leaderboard service to consume net units
- Per-event progression with 1-unit tolerance
- Method/round become personal accuracy tracker only
- Update tests (Vitest) to validate new scoring math
- **Founder badge slot tracking (10/50/500/1000, permanent on cancel).** Atomic allocation via single SQL UPSERT with `INSERT ... ON CONFLICT DO NOTHING RETURNING` so two simultaneous subscribers can never claim the same slot. Slot number derived from total badges-of-tier count at insertion time inside the same transaction. Once awarded, the slot is locked to that userId regardless of subscription state (anti-gaming rule).
- **Gold Key Badge (5 keys = unlock).** Frontend display for collected Keys on profile. Backend awards on clean sweep already exists.

### Week 4 — Engagement Layer
- Live fighter rating during fights (5 criteria + 5-layer anti-spam from blueprint). Criteria: Fight IQ, Grappling, Striking, Cardio, Aggressiveness. Anti-spam: rate limit 5 ratings/event/user; account age gate 7 days; recency weighting (last 12mo count 2x); display threshold ≥10 valid ratings; mod-action exclusion.
- Per-fight private notes UI (RLS enforced via Supabase) — available to ALL users, not Challenger-gated.
- Event recap view with Claude-generated paragraph summary, AI vs user comparison, stars-gained explanation, warm message on first-event-negative.
- OneSignal notifications: fix the 4 broken triggers (already path-corrected in Week 0), wire all blueprint notification types: New Event Scheduled (7d), 24h Reminder, 1h Last Chance, Event Going Live, Next Fight Up (15min before each fight), Star Earned, Badge Earned, Key Earned, Rank Up, Monthly Bonus Win, Raffle Win, Slip Approved/Featured.
- **Intelligence Alerts Feed** — full build, NOT just "mount UI":
  - Admin publish UI in admin dashboard (compose signal, attach fighter/event, set urgency, set tags like injury/camp-change/sharp-money)
  - **Challenger-gated reading** — Contenders see locked teaser with upgrade CTA on dashboard
  - Tag pills color-coded by signal type
  - Dashboard teaser widget shows latest 2-3 signals with link to full feed
  - Backend uses existing `intelFeedItems` schema (no new tables needed)

### Week 5 — Stripe Layer (DEDICATED week)
- AI token economy: pack purchase ($5/$10/$20), token meter component, per-feature token cost map
- Payment failure fallback (modal + banner + free content access)
- 7-day binary refund flow with Stripe metadata + in-app confirm checkbox + ToS mirror
- Stripe Connect for creator payouts
- Stripe escrow for 1-on-1 sessions
- Admin AI Controls dashboard (token cost editor, model switch, cost monitoring)

### Week 6 — Creator Economy
- Creator toggle in settings (Free vs Paid)
- Paid creator eligibility gate (30d age + 3 qual events + 2FA + Stripe Connect verified, no active mod actions)
- Pick visibility tiers (public, subscribers only, post-fight reveal) with RLS
- 1-on-1 paid text chat (10-min no-show auto-refund logic)
- Donations + creator subs revenue split
- Creator agreement page + acceptance flow
- Creator termination handling (4 scenarios from blueprint)

### Week 7 — Slips + Chat Upgrade
- **Slip System**:
  - Wire slip 7-day `expiresAt` on insert (currently only delete cron exists)
  - Upload flow (JPG/PNG/WebP, max 5MB) → admin moderation queue (Approve / Approve + Feature / Reject — rejected slips deleted with private no-reason notification)
  - Chat slip posting: 1 slip per 30 min cooldown, configurable
  - Slip Wall on landing page (between leaderboard and pricing, max 6 featured) + in-app full scrollable hall of fame
  - Admin captions + feature/unfeature controls
- **Chat Upgrades**:
  - **Admin per-event chat toggle** — chat opens when event goes Live, auto-closes 24h after event ends. Manual admin override stored in `chatConfig` table. Future Phase 2 ties to events automation.
  - Tier gates: Contender (read + type + basic emoji, read-only on slips); Challenger (full Emoji Mart + slip share + badge display)
  - Profanity filter (open-source `bad-words` library + custom MMA blocklist + fighter harassment patterns)
  - Link spam detection: block messages with 2+ URLs unless verified Creator; block known scam patterns (telegram pump links, "DM for picks", crypto address paste)
  - Repeat message throttle: same user same message 3+ times in 5min = auto-suppress + admin alert
  - Three-strikes auto-mute: 3 blocked messages in 24h = auto 1-hour mute
  - Admin filter sensitivity control + whitelist override
- **Reporting + Moderation**:
  - Report button on every chat message, slip, profile, creator listing
  - Categories: Spam, Harassment, Inappropriate, Scam, Fake creator, Other
  - 3 reports against same user auto-escalate with priority flag
  - Progressive penalties: warning → 24h mute → 7d mute → suspension (admin-configurable)
- Block + Mute UI in Settings → Blocked Users tab

### Week 8 — Compliance + Operational
- 7-step onboarding flow (replace single `WelcomeModal`): Welcome → Profile (display name, country flag, avatar) → How Picks Work (interactive sample) → How Scoring Works (visual) → Progression Ladder (Ninja→GOAT, Gold Key) → Qualification Rules → Dashboard CTA. Skippable, visible later.
- In-app Rules tab in main navigation — casino-style reference covering every system, always available.
- Account deletion + GDPR data export per-user (download JSON/CSV before delete)
- Profile privacy settings UI (already in schema, needs frontend): leaderboard visibility, picks history, badges, profile, creator invites, 1-on-1 requests, donations
- Age + phone verification (Clerk supports both natively); 18+ self-declaration at signup
- Time zone handling (UTC storage, auto-detect, manual override) — replace hardcoded PST/EST map
- ToS + Privacy + Cookie + Creator Agreement pages with acceptance recorded per user
- 1099-NEC tracking field + threshold warnings (yellow $400, red $550, block payouts pending W-9/W-8BEN)
- Fight void/cancel rules + qualification recompute on void (8 void scenarios from blueprint table; auto-notify affected users in real time)
- **Subscription Lapse Survival Rules** — explicit list per blueprint:
  - **Permanent (stays forever):** Pick history, stars/badges/keys, Founder badge slot, approved+featured slips, per-fight notes
  - **Freezes at billing period end:** AI tokens (balance preserved, unfrozen on resub), intel alerts access, slip-sharing-in-chat, raffle+monthly-bonus eligibility, subscriber badge + full emoji
  - **Resub flow:** identity preserved, badges restored, tokens unfrozen instantly; raffle resets to month-1 only if gap >30 days
- **Monthly Bonus Draw** ($550 pool, $300/$100/$50 to top-3 ROI + 2x$50 random qualified Challengers):
  - Inngest scheduled job runs 1st of month at 00:05 UTC
  - Top-3 selection: highest net units across qualified events (≥2 qualified events for cash race; ≥1 for random draw)
  - Tiebreaker (cash only, not stars/rank): earliest user to lock full card with zero post-lock modifications; if still tied split prize evenly
  - Push notification to winners requesting PayPal email or USDC/USDT wallet; admin pays manually
  - Admin payout tracking dashboard with status (pending/paid/disputed)
- **Multi-Account Detection**:
  - FingerprintJS free tier on signup + payment events
  - Stripe customer email dedup on every payment
  - Stripe card.fingerprint hash dedup (catches same card across accounts)
  - IP + ASN logging at signup, first sub, prize events
  - Soft flag → admin manual review before any payout >$50
  - Hard flag (fingerprint AND payment match existing Challenger) → block new sub at Stripe checkout
  - Ban cascade with appeals process (legit shared-device cases handled by admin whitelist)
- **Backup + DR Runbook**:
  - Supabase Pro plan ($25/mo) for daily automated backups + 7-day retention
  - Weekly manual `pg_dump` snapshot to encrypted cloud storage (Backblaze B2)
  - Monthly restore test on calendar — spin up staging Supabase project, restore latest backup, verify integrity
  - Documented runbook for 3 disaster scenarios (Supabase outage, data corruption, account compromise)
  - RTO 4h / RPO 24h targets
- **Inngest migration** — replaces node-cron + pg-boss for:
  - Monthly bonus draw job
  - Subscription expiration check (already wired on node-cron in Week 0, port over)
  - Slip 7-day expiry cleanup
  - Leaderboard snapshots (monthly + yearly)
  - Outbound sync to Supabase (currently pg-boss queue)

### Week 9 — Polish + Deploy
- Landing page final polish (waiting on 11 SVGs + fighter photos — blocking assets)
- Mobile bottom nav final pass
- Full QA pass on all flows
- Deploy: Vercel (frontend) + Railway (backend) + Supabase (DB)
- DNS, SSL, monitoring, alerts (Sentry already wired)
- Soft launch to first 1,000 (Founder I-IV badge race begins)

---

## 7. Out of Scope for Phase 1

These items from the blueprint or audit are explicitly **deferred**:

| Item | Phase |
|---|---|
| `dataEngineService.ts` 650-line refactor | Phase 2 |
| AI Prediction Engine (Claude vs GPT vs Grok) | Phase 3 |
| dataintakegrit agents 1/2/3 re-enable | Phase 2 |
| Live tournament leaderboard (fight-by-fight live updates) | Phase 2 |
| Result animations + sound effects | Phase 2 |
| Affiliate links (Stake, DraftKings) | Phase 3 |
| AI fighter portrait generation in main app | Phase 3 |
| Mobile app (React Native or Capacitor build pipeline) | Phase 3 |
| Multi-promotion expansion (Bellator, PFL) | Phase 3 |
| Spanish/Portuguese/Russian/Chinese i18n | Phase 2 |
| Type safety holes (115 `as any`) cleanup | Ongoing — touch when in the file |
| AI moderation (Checkstep / WebPurify) | Phase 2 |
| PITR (Point-in-Time Recovery on Supabase Team plan) | Phase 2 |

---

## 8. Hard Rules (Locked, No Pushback Without Deal-Killer Reason)

These are blueprint mandates that don't get re-debated:

1. **Tiers:** Contender (free) / Challenger ($4.99/mo) / Creator (free or paid)
2. **AI tokens:** $5/100, $10/220, $20/500 — Challenger-only purchase, binary refund
3. **Badges:** Ninja → Samurai → Master → Grandmaster → GOAT (5 tiers)
4. **Stars:** 1-5, on 5th converts to next badge + resets to 1, floor at 0/no badge
5. **Tolerance:** Lose 0-1 unit = neutral, lose more = -1 star
6. **Scoring:** Net units from moneyline only. Method/round are "just for fun."
7. **Flags:** None/Green/Yellow count, Red excluded
8. **Monthly bonus:** $300/$100/$50 to top 3 ROI + $50 to 2 random qualified Challengers ($550 pool)
9. **Founder badges:** 10/50/500/1000 slots, **permanent on cancel** (anti-gaming rule)
10. **7-day refund window** on subs + tokens, binary on tokens (touched = no refund)
11. **Live fighter rating + per-fight notes** available to ALL users (not gated to Challenger)
12. **AI tokens** are positioned as add-on purchase, NOT the headline feature
13. **Stack:** Clerk (auth), Supabase (DB + storage + RLS + realtime), Stripe Connect (creator + escrow), Upstash (cache + rate limit), Inngest (jobs), OneSignal (push), Resend (email), PostHog (analytics)

---

## 9. Definition of Done — Phase 1 Ship Criteria

Phase 1 is "done" when ALL of:

- [ ] Fresh clone + `npm install` + env setup + `npm run db:migrate` + `npm run dev` boots clean
- [ ] User can sign up via Clerk, complete onboarding, make picks, submit, view scored results
- [ ] Challenger sub purchase works end-to-end (Stripe → tier upgrade → token purchase → token spend on AI feature)
- [ ] Per-event scoring uses net units, leaderboard shows net units, ranks update on event close
- [ ] Star/badge progression awards correctly per event with 1-unit tolerance
- [ ] Live fighter rating (5 criteria + anti-spam) + per-fight notes work for any user (NOT Challenger-gated)
- [ ] Slip upload → admin approve → posts in chat → 7-day auto-expire → appears on Slip Wall if Featured
- [ ] Creator can become paid, list 1-on-1 sessions, accept booking, complete session, get paid via Connect
- [ ] All 8 fight-void scenarios handled correctly (qualification recompute, real-time user notification)
- [ ] All 12+ notification triggers fire (event 7d/24h/1h/live/15min-before-each-fight, star/badge/key/rank/bonus/raffle/slip)
- [ ] Monthly bonus draw runs via Inngest, picks top-3 ROI + 2 random, admin payout dashboard records winners
- [ ] Intel feed: Challenger sees full feed, Contender sees teaser+upgrade CTA, admin can publish signals
- [ ] Chat opens automatically when event goes Live, closes 24h after; admin can override
- [ ] Founder badge slot allocation is atomic — verified by stress test (2 concurrent subscribers can't claim the same slot)
- [ ] Sub lapse + resub preserves badges/keys/Founder slot/notes; freezes tokens/intel/raffle correctly
- [ ] Multi-account detection flags fingerprint+payment collisions; admin review queue for prize payouts >$50
- [ ] ToS / Privacy / Cookie / Creator Agreement pages exist with acceptance recorded
- [ ] Vitest passes in CI (scoring + progression + Stripe webhook + auth guards minimum)
- [ ] Deployed: gritapp on Vercel (frontend) + Railway (backend), Supabase prod project
- [ ] Sentry catching errors, PostHog tracking funnels
- [ ] No `as any` introduced in NEW code (legacy holes acceptable for cleanup later)

---

## 10. Risks + Open Questions

1. **Drizzle migration regen** requires prod DB dump access. Founder needs to provide Supabase connection string or DB dump.
2. **Clerk + Express + Vite glue** is well-documented but not zero-config. Plan +1 day buffer.
3. **DALL-E 3 cost** for image generation if we re-enable agent 7 — quote estimate vs current manual upload.
4. **11 SVGs + fighter photos** are blocking the landing page. Fiverr brief is ready per blueprint. Order Week 0 so they arrive by Week 9.
5. **Founder Mexican tax + US LLC structure** is post-validation. Phase 1 ships on personal Stripe; LLC formation triggered when revenue is flowing. Document this in ToS.
6. **Anthropic model `claude-sonnet-4-6`** — verified as the current alias; if it gets renamed before launch, update one line.

---

## 11. Next Step

Founder reviews Decisions #1-6 in §5 and signs off. Then Week 0 starts.

---

*GRIT v6.1.2 build. Aligned. Verified. Ready to execute.*
