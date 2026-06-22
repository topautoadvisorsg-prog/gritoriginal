# GRIT — Phase 1 SPEC

> **Product plan, not implementation evidence.** Current code/deployment truth and launch gates are in [`docs/system-audit/SYSTEM_STATUS_REPORT.md`](docs/system-audit/SYSTEM_STATUS_REPORT.md) and [`docs/system-audit/PRODUCTION_READINESS.md`](docs/system-audit/PRODUCTION_READINESS.md).

**Version:** v2.1 · Blueprint-first rewrite + self-audit gap fixes
**Date:** 2026-05-23
**Status:** Pending founder review
**Source of Truth:** `grit-blueprint-v6.1.2-production.html` is the master product blueprint. This SPEC is its engineering translation. Where this SPEC conflicts with the blueprint, the blueprint wins.

**v2.1 self-audit (line-by-line blueprint vs SPEC verification) caught and fixed:**
1. Added "The Rule" — blueprint's 6-step build ordering principle as §32a
2. Added Phase 1 / 2 / 3 mission subtitles to §36 / §37 / §38
3. Fixed Inngest scoping — Phase 1 wires new jobs ONLY (monthly bonus, 1099 check); full migration of existing node-cron is Phase 2 per blueprint
4. Added Platform Sub $4.99 explicit verification step to Week 1
5. Added Real Betting Tracker dashboard widget surface to Week 4 (blueprint inventory says "needs dashboard widget")
6. Added Acceptable Use Policy to Week 8 legal pages (now 5 docs, not 4)
7. Added Sponsorships explicitly to Phase 3 (Stake/DraftKings/Monster/Red Bull, UFC pitch)
8. Added PITR upgrade + type safety cleanup to Phase 2
9. **Fixed tier enum data model** — Creator is a separate role, NOT a tier. Enum is `free|challenger`; Creator state in `creator_profiles` table. Display labels ("Contender"/"Challenger") live in copy layer. Affects §4, §36 Week 2, §42.

> **New devs:** Read this whole SPEC. The first half mirrors the blueprint section-by-section so every feature, rule, and compliance item is captured. The second half is the build plan. The last section reconciles spec against the current codebase.

---

# PART I — THE PRODUCT (from Blueprint v6.1.2)

---

## 1. Mission & Identity

**GRIT is an MMA intelligence + fantasy prediction platform.**
- NOT a sportsbook. A competitive analytics arena where fans compete using real fighter data, real odds, and real AI models.
- **Creator Economy layer:** verified platform for MMA analysts and pick sellers to monetize legitimately.
- **Personal MMA Brain:** per-fight private notes on every fighter, live fighter rating during fights, pre-fight reminders, event recaps. The platform learns with the user.
Every engineering decision serves the product.

---

## 2. Three-Server Architecture

| # | Server | Status | Role |
|---|---|---|---|
| 1 | **Data Engine** (`dataintakegrit`) | Built — debugging data quality | Autonomous MMA data ingestion. 8 agents. Currently in manual mode (`MANUAL_INGESTION_MODE=True`); Islam Makhachev test pending before scaling. |
| 2 | **AI Prediction Engine** | Scoped — Phase 3 | Claude vs GPT vs Grok. Same prompt, same data, independent picks. Live accuracy leaderboard. Separate server. |
| 3 | **Main App** (`gritapp`) | In progress — polishing | B2C platform. User + admin sides. Receives data from Server 1. Displays predictions from Server 2. |

Phase 1 = Server 3. Phase 2 = refactor Server 1 internals + polish Server 3. Phase 3 = build Server 2 + mobile + UFC pitch.

---

## 3. Tech Stack (Locked)

| Layer | Tool |
|---|---|
| **Auth** | Clerk (replacing Replit OIDC). Email + Google sign-in. 2FA via SMS or authenticator. |
| **DB + Storage + RLS + Realtime** | Supabase Postgres (already provisioned, region us-west-2). |
| **ORM** | Drizzle (keep). |
| **Payments + Creator Payouts + Escrow** | Stripe + Stripe Connect. |
| **Cache + Rate Limit** | Upstash Redis. |
| **Background Jobs** | Inngest. Replaces node-cron + pg-boss by end of Phase 1. |
| **Push Notifications** | OneSignal. |
| **Transactional Email** | Resend. |
| **Analytics + Feature Flags** | PostHog. |
| **Observability** | Sentry (already wired). |
| **AI Primary** | Anthropic Claude Sonnet 4.6. Demote OpenAI to embeddings only. |
| **Image Generation** | OpenAI DALL-E 3 (in data engine only). |
| **Validation** | Zod. |
| **Frontend** | React 18 + Vite + Tailwind + shadcn/ui + Framer Motion. |
| **Realtime** | socket.io (chat + live leaderboard). |
| **Share Cards** | html2canvas. |

---

## 4. User Tiers — Locked

> **Data model note:** Blueprint presents Contender / Challenger / Creator as three "tiers" for product clarity, but the DB enum is **2 values** (`free | challenger`). **Creator is a separate role**, not a third tier. A Challenger can be both a subscriber AND a Creator (selling picks). A free Contender can be a Free Creator (donations only). Creator state lives in `creator_profiles` table. UI shows "Contender" / "Challenger" labels via copy layer.

### Contender (Free)
- Fighter profiles + records
- Make picks on all events
- Global leaderboard access
- Stars + badge progression
- **Live fighter rating during fights** (5 criteria — see §10)
- **Per-fight private notes on every fighter** (see §10)
- Community chat: basic emoji only, READ-ONLY on slips
- Event reminders + notifications
- **Zero AI access.** Sees AI exists, sees upgrade prompt.

### Challenger ($4.99/month)
- Everything in Contender, plus:
- No ads
- **Founder Badge** if in first 1,000 subscribers (10/50/500/1000 slots)
- **Access to PURCHASE AI tokens** (no free tokens; tokens are separate add-on)
- Intelligence alerts — full access
- Slip sharing in community chat
- Full expanded emoji library
- Pool raffle entry **from month 2 onwards**
- Monthly bonus eligible
- **2FA required** (SMS or authenticator)

### Creator (Free or Paid)
- Any user can become a creator Day 1 — no rank gate
- **Free Creator:** picks public, anyone can donate, no Stripe Connect needed until first donation
- **Paid Creator** (min $5/month, creator sets price): picks locked to subscribers only, requires Stripe Connect onboarding
- Pick visibility per pick: public / subscribers only / reveal after fight — RLS enforced at DB level
- **Donations split:** 95% creator / 5% platform
- **Subscription split:** 85% creator / 15% platform
- **1-on-1 Paid Chat Sessions** (text only, see §25)

### 1-on-1 Chat Session Rules
- **Text only.** No video.
- Booking via Stripe escrow.
- Session is timed; creator sets duration (default 30 min).
- 10-minute no-show window: if creator doesn't show, user gets full automatic refund + creator gets no-show flag.
- Three no-show flags = creator privileges removed.
- On successful completion: 80% creator / 20% platform.
- Messages saved to user's account for reference.

---

## 5. Pick System — Locked

### Pick Types
- **Moneyline** — competitive. Only pick type counting toward ranking, stars, ROI, progression. 1 unit risked per pick. Odds determine payout.
- **Method + Round** — "just for fun." Available on every fight. Does NOT count toward ranking. UI labels them "Just for fun — does not count." Personal accuracy tracker shows over time.
- **Strategic value:** method/round aggregates community sentiment per fight; admin layers with AI predictions for personal edge.

### Odds Math — American Format
- Positive: `profit = 1 unit × odds ÷ 100`
- Negative: `profit = 1 unit × 100 ÷ |odds|`
- Loss: −1 unit
- **Locked at submission** via `lockedOdds` field.

### Confidence Flags — Moneyline Only

| Flag | Behavior |
|---|---|
| **No flag** | Default competitive pick. Counts toward everything. |
| **Green** | High confidence marker. Unlimited. Counts same as no flag. |
| **Yellow** | Low confidence ("not sure but had to pick"). Still counts. Uses flag budget. |
| **Red** | Off-record ("not putting this on my record"). EXCLUDED from ranking + stars. Uses flag budget. |

### Participation Minimums — Fixed Card Size Table
70% formula is removed. Fixed minimums replace it everywhere.

| Card Size | Minimum Picks | Flag Budget |
|---|---|---|
| 17 fights | 13 picks | 4 flags |
| 16 fights | 12 picks | 4 flags |
| 15 fights | 11 picks | 4 flags |
| 14 fights | 11 picks | 3 flags |
| 13 fights | 10 picks | 3 flags |
| 12 fights | 9 picks | 3 flags |
| 11 fights | 8 picks | 3 flags |
| 10 fights | 8 picks | 2 flags |

Cards 16-17 included for multi-promotion expansion (Phase 3, Bellator/PFL).

**Real-time banner:** Fight card page shows live count — "You have X picks. You need Y more to qualify." Flips to "You are qualified" when threshold is hit.

---

## 6. Cancellation + Void Logic — Locked

Industry-standard void rules. Every scenario covered.

| Scenario | Outcome | Notes |
|---|---|---|
| Fight canceled, no replacement | **VOID** | Pick removed. No unit change. Does not count against card minimum. |
| Opponent swap — your fighter still in | **PICK STANDS** | Pick locked at original odds. |
| Opponent swap — your fighter pulled | **VOID** | Pick cannot compete. Removed cleanly. |
| No Contest | **VOID** | Industry standard. |
| Draw | **VOID** | No winner = no result. |
| Disqualification | **COUNTS** | Non-DQ'd fighter wins. |
| Result overturned later (failed test, appeal) | **ORIGINAL STANDS** | No retroactive clawback. Locked forever when scored. |
| Whole event canceled | **FULL VOID** | Event scrubbed from leaderboard, ROI, stars. Like it never happened. |

### Card Minimum Auto-Adjust
If fights void on a card, participation minimum drops to match new effective card size. Example: 13-fight card → 3 voids → effective 10-fight card → new minimum 8 picks / 2 flags.

### Qualification Recompute After Voids (v6.1.2)
If a user qualified, then voids drop them below the new minimum, system **auto-recomputes qualification status** whenever a fight voids and notifies affected users in real time: *"You've dropped below the minimum due to voided fights — add X more picks before lock."* Recompute runs on every fight status change, not just at scoring time.

### UI
- Voided fights show "VOIDED" badge on pick history.
- User notification sent.
- Event recap explains any voids that affected their card.

---

## 7. Scoring + Ranking — Locked

### Ranking Formula
- **Net Units only.** Sum of all profit and loss across moneyline picks. No accuracy %. No participation weight. Just net units.
- Highest net units = rank 1. Sorted highest to lowest. Multiple users tied = share the same rank position + same stars.
- **Three time windows:** per event, monthly, yearly. Snapshots: monthly last day at 23:59, yearly Dec 31 at 23:59.
- **Red flag picks excluded** from all net unit calculations.

### Star Progression — Per Event
- **Positive ROI** + meets participation minimum:
  - ROI 0%–15%: +1 star
  - ROI > 15%: +2 stars
- **Tolerance zone:** lose 0–1 unit = neutral (no star change)
- **Lose more than 1 unit:** −1 star
- **Hard floor:** zero stars, zero badges. Cannot go negative. Once at zero, that's the floor.

### Monthly Bonus — Fixed $550 Pool
- **1st ROI:** $300
- **2nd ROI:** $100
- **3rd ROI:** $50
- **2 random qualified Challengers:** $50 each
- ROI race requires user qualified for **2+ events that month**.
- Random draw requires only **1 qualifying event**.
- Push notification to winner.
- Admin pays manually via PayPal or USDC/USDT.

### ROI Tiebreaker (Cash Only)
- If multiple users tie for a paid ROI position: **earliest user to lock the full card with zero modifications after lock** wins.
- Still tied? Split the cash prize evenly.
- Stars + rank for tied users NOT affected; they share rank position normally.

---

## 8. Progression — Stars / Badges / Keys / Founder

### Five Badge Tiers (Locked)
1. 🥷 **Ninja** (Tier 1)
2. ⚔️ **Samurai** (Tier 2)
3. 🏯 **Master** (Tier 3)
4. 👑 **Grandmaster** (Tier 4) — **ADD to enum** between Master and GOAT
5. 🐐 **GOAT** (Tier 5) — pinnacle, rarest

### Star Conversion Rule
- Stars run 1 through 5.
- On the 5th star → immediately converts to next badge tier + resets to 1 star.
- Profile shows current badge only.

### Keys — Perfect Card Achievement
- Every **no-flag AND green-flag moneyline pick** correct for an event = **1 key**.
- **Yellow flags EXCLUDED** from key eligibility (yellow flagging removes that pick from key calculation).
- Red flags also excluded (already off-record).
- **1 key = $100 prize.**
- **5 keys = Gold Key Badge unlocked + $1,000 prize.**
- Split equally if multiple users hit same cycle.
- Admin verifies and pays manually.

### Founder Badges — Locked Slot Counts
- **Founder I** — first 10 subscribers
- **Founder II** — first 50
- **Founder III** — first 500
- **Founder IV** — first 1,000

**CRITICAL anti-gaming rule:** Founder slot **stays with the user permanently**. Slot does NOT reopen on cancel. Founder is a status badge, not an active membership perk. Reopening slots would create churn-and-rejoin gaming.

**Atomic allocation requirement:** slot number derived from `COUNT(*)` of badge-of-tier inside the same transaction as INSERT. Use `ON CONFLICT DO NOTHING RETURNING` so two simultaneous subscribers can never claim the same slot.

### Pending SVG Assets (Blocking)
11 SVG files needed:
- GRIT wordmark, GRIT icon
- Founder I, II, III, IV
- Ninja, Samurai, Master, Grandmaster, GOAT
- Gold Key Badge

Founder is delivering these. Until they arrive, use `BrandAsset` component placeholders (grey boxes) — already wired in Week 0.

---

## 9. Live Fighter Rating + Per-Fight Notes

Both features available to **ALL users** (not Challenger-gated).

### Live Fighter Rating — During Fights
- Users rate each fighter on **5 criteria** during the fight, 1-10 stars per category:
  - **Fight IQ**
  - **Grappling**
  - **Striking**
  - **Cardio**
  - **Aggressiveness**
- One rating per user per fighter per fight.
- Submits at fight end.
- Aggregates into community score on fighter profile.

### 5-Layer Anti-Spam / Anti-Brigade (v6.1.1)
1. **Rate limit:** max 5 fighter ratings submitted per event per user.
2. **Account age gate:** ratings only count toward fighter community score after user has **7 days** of account age. Earlier submissions saved on profile but excluded from public aggregate.
3. **Recency weighting:** ratings from last 12 months count **2x**; older ratings decay.
4. **Display threshold:** fighter community score hidden until **10+ valid ratings** exist (prevents 1-rating skew).
5. **Mod-action exclusion:** users with active warnings/mutes/bans have ratings excluded from aggregate while penalty active.

### Per-Fight Private Notes
- Every user can leave a private note on any fighter for any specific upcoming fight.
- **Tied to the bout.** After the fight is added to fighter history, the user's note from before that fight shows up in their private view.
- **PRIVATE to the user.** Nobody else sees them — not creators, not admin, not other users.
- **Compounding personal value.** Years of personal scouting thoughts build up. Massive switching cost.

---

## 10. Community Chat + Slip System

### Chat Availability — Event Driven
- **Manual admin toggle** stored in DB config.
- Chat opens when event goes Live. Closes 24 hours after event ends.
- Future Phase 2: automated tie to events system.

### Tier Gates
- **Contender** — read + type + basic emoji.
- **Challenger** — full emoji library + slip sharing + badge display.

### Slip System (Challenger Only)
- Upload via My Slips on profile.
- Formats: JPG, PNG, WebP. Max 5MB.
- **Admin moderation queue:** Approve / Approve and Feature / Reject.
  - Rejected slips deleted. User gets private notification. No reason given.
- **Posting:** 1 slip per 30 minutes (configurable cooldown). Posts with badge + SLIP marker.
- **7-day auto-expiry** from creation.

### Slip Wall — Hall of Fame
- **Landing page:** between leaderboard and pricing. Max 6 featured slips. Live social proof.
- **In-app:** full scrollable history. Accessible even when chat is closed.
- **Admin controls:** Feature button in moderation queue. Add captions. Remove anytime.
- Caption example: *"450x parlay — UFC 299 — NightHawk"*

---

## 11. Notifications (OneSignal Push)

### Event Schedule Notifications
- **New Event Scheduled** — 1 week before card opens
- **24-Hour Reminder** — make picks before card locks
- **1-Hour Last Chance** — if user hasn't hit qualifying minimum
- **Event Going Live** — picks locked, fights starting
- **Next Fight Up** — 15 minutes before each fight starts during the event

### Achievement + Status Notifications
- Star Earned
- Badge Earned
- Key Earned
- Rank Up
- **Monthly Bonus Win** — "You won this month's bonus. Send PayPal or crypto wallet (USDC/USDT preferred)."
- Raffle Win
- Slip Approved or Featured

**Why this matters:** users currently Google fight schedules constantly. Once GRIT becomes the place they get told when fights are happening, they never leave.

---

## 12. Event Recap — Post-Event Learning Moment

Personal recap view after every event.

### Content
- Final Net Units + Final Rank
- Picks Made vs Picks Correct
- **Best Pick** (biggest underdog hit or biggest win)
- **Worst Miss** (biggest loss)
- Stars Gained or Lost (with explanation)
- **AI Comparison** (how user picks compared to Claude, GPT, Grok this event)
- Streak Status + Path to Next Badge
- **Claude-Generated Summary** — one paragraph: what you got right, what to watch next time

### First-Loss Handling
After a user finishes their first event negative, recap includes a warm message: *"Tough first event. Even sharks have rough cards. Your real journey starts now."* Highlights at least one thing they got right. Keeps them engaged past the first loss.

---

## 13. Onboarding Flow — 7 Steps (Skippable but Visible)

1. **Welcome** — *"You are about to compete against the world using your MMA knowledge. No betting. Pure skill."*
2. **Profile Setup** — display name, country flag, optional avatar
3. **How Picks Work — Interactive** — sample fight card, walk through one pick: moneyline → odds → optional method/round → confidence flag → lock in
4. **How Scoring Works — One Screen** — visual: 1 unit per pick, underdog win = bigger payout, favorite win = smaller, loss = lose 1, net units rank you
5. **How Progression Works — Visual Ladder** — positive event = stars; 5 stars = badge tier up; Ninja→GOAT; 5 perfect cards = Gold Key = $1,000
6. **Qualification Rules** — every event has minimum picks; miss it = no stars; real-time banner shows where you stand
7. **Dashboard Landing** — engaging empty states. Next event front and center with *"Make your first picks"* CTA. Encouraging tone.

---

## 14. In-App Rules Tab — Casino-Style Reference

Dedicated tab in main navigation. Always available. Visual cards covering every system.

Sections to include:
- Picks (moneyline vs method vs round)
- Odds and Units (American odds math with examples)
- Flags (4 flags color-coded with budget rules)
- Participation (fixed card size table)
- Stars and Badges (5 tiers, 1-unit tolerance, floor at zero)
- Keys (perfect card achievement, prize pool rules)
- Founder Badges (slot tracker showing remaining)
- Monthly Bonus (top 3 + 2 random, all eligible)
- Raffle (month 1 exclusion, auto entry)
- Creator Economy (free vs paid, revenue splits)
- AI Tokens (packages, freeze rule)
- Live Fighter Rating (5 criteria during fights)
- Chat and Slips (availability rules, 7-day expiry)
- Notifications (customize in settings)

---

## 15. Raffle System

- **$0.50 per subscriber per event** — auto-calculated from active subscriber count.
- **Month 1 exclusion** — new subscriber month 1 = recognized, not entered. Month 2 onwards = automatic entry every event.
- **Resubscribe resets:** cancel + resub = start date resets, back to month 1.
- **Auto draw on event close.** Random winner from eligible pool. Admin notified for manual payout.
- **Dashboard display:**
  - Qualified: shows entry, pool size, next draw
  - Not qualified: friendly message — "qualify starting next month"

---

## 16. Dashboard Widgets

**Critical rule:** ZERO mock data anywhere on the dashboard. Every widget pulls from real backend data.

### Widgets
1. **Event Block** — upcoming event name/date/card; picks made vs needed; countdown to lock; quick link to picks
2. **Leaderboard Block** — current rank for active event; current net units; users above + below; all-time rank
3. **Progression Block** — current stars to next badge; current badge + tier; keys collected; winning streak (only if 2+ consecutive)
4. **Raffle Block** — qualified: pool size + draw date; not qualified: qualify next month message
5. **Real Betting Tracker** — optional, toggle in settings. Unit size, wagered, P&L, ROI. **Private**, not on any leaderboard.
6. **Intelligence Feed Teaser** — latest 2-3 intel signals; tag pills in assigned colors; link to full feed

---

## 17. Pick Board — Visual Pick Grid + Share

- Toggle on event page: List View default, Pick Board alternate. Instant switch, no reload.
- Grid layout: picked fighter highlighted with glow + border; opponent dimmed at 30% opacity; no-pick neutral.
- **Share Picks button:** html2canvas generates clean image — event name, all fights, picks highlighted, no UI chrome.
- Edge cases: no picks neutral; partial picks show only selected; missing images placeholder.

---

## 18. AI Token Economy — Locked

### The Model
- **Contender (free):** ZERO AI access. Sees AI exists. Sees upgrade prompt. Cannot use AI in any form. Drives conversion.
- **Challenger ($4.99):** RIGHT TO BUY tokens. **No free tokens included. No welcome bonus.** Like Costco membership — pay to walk in, then pay for what you buy. Empty meter at signup.
- **Every AI query consumes tokens.** Different features cost different amounts.
- **Tokens never expire while subscribed.** Roll over forever. Freeze on sub lapse. Resume on renewal.

### Token Packs — Locked Pricing
| Pack | Tokens | Per-token rate |
|---|---|---|
| $5 | 100 | $0.05 |
| $10 | 220 | ~$0.045 |
| $20 | 500 | $0.04 |

### Real Cost Economics
- Claude Sonnet 4.6: $3/M input, $15/M output
- Real cost per GRIT query: $0.02–$0.05 with prompt caching
- User pays: $0.05–$0.25 per query
- Gross margin: ~60% on every AI interaction

### Token Cost Per AI Feature

| Feature | Tokens | User Pays | Real Cost | Profit |
|---|---|---|---|---|
| Quick Fighter Breakdown | 1 | $0.05 | ~$0.02 | $0.03 |
| Matchup Style Analysis | 2 | $0.10 | ~$0.03 | $0.07 |
| Custom AI Scout Report | 3 | $0.15 | ~$0.05 | $0.10 |
| Custom Prediction with Reasoning | 3 | $0.15 | ~$0.06 | $0.09 |
| Multi-Fight Parlay Analyzer | 4 | $0.20 | ~$0.08 | $0.12 |
| Sharp Money Detection Report | 5 | $0.25 | ~$0.10 | $0.15 |

**What $5 (100 tokens) gets a user:** 100 breakdowns, 50 matchup analyses, 33 scout reports, 25 parlay analyzers, 20 sharp money reports — or any mix.

### The Meter — Visual Token Balance
- **Visual gauge like a gas tank.** Persistent in top nav, larger on AI chat page + dashboard.
- **Color states:**
  - Full (200+): green glow, "AI ready"
  - Mid (100–199): standard fill
  - Low (30–99): yellow, "Running low"
  - Critical (1–29): red pulsing, "Top up soon"
  - Empty (0): red empty, AI locked
- **Top Up button** always visible near meter, especially prominent in red zone. One click opens pack modal. Stripe one-click checkout.
- **Real-time animation** via Framer Motion: drain during query, fill on pack purchase.
- **Visual cap at 250.** Above shows "+X extra". Always feels achievable to fill.
- **Empty meter at signup** with prompt: *"You need tokens to use AI features. Top up to unlock."*

### v6.1.2 — Payment Failure Fallback
- If Stripe payment fails (card declined, insufficient funds, expired), user is NOT stranded.
- **Modal:** *"Payment didn't go through. Try a different card or update your payment method."*
- **Persistent banner** in app until resolved.
- **Fallback content:** rules, fighter records still accessible. AI features blocked. **Never block account access.**
- **3 failed attempts in 24h** = email with troubleshooting + support link.

### Token Refund Policy (Simplified v6.1)
- **Any spent tokens = no refund on that pack.** Period. No pro-rata. No partial. No arbitrage.
- **Untouched pack + 7 days = full refund.** Two clicks in Stripe. Tokens removed.
- **After 7 days = no refund.** Tokens remain in account as long as sub is active. Frozen on lapse, restored on renewal.

---

## 19. Admin AI Controls — You Control the Economy

Full admin control over token economy. No developer needed when Anthropic changes prices.

### Capabilities
- **Token Pack Prices** — edit $ per pack, tokens per pack, toggle packs on/off, add new packs, view total packs sold
- **Token Cost Per Feature** — edit tokens per AI feature, add new AI features, disable any AI feature globally
- **AI Model Settings** — switch model (Sonnet 4.6, Opus 4.7, etc.), fallback model, max input/output tokens, toggle prompt caching
- **Real-Time Cost Monitoring** — spend per day/week/month, Anthropic cost vs token revenue, gross margin %, cost per user, most expensive users (abuse detection)
- **User Token Management** — view balance, grant promotional tokens (referrals, contests, apologies), revoke for abuse, reset balance, transaction history
- **Bulk Operations** — promo tokens to all Challengers, sale pricing across packs, pause all AI features (emergencies), cost alert thresholds

---

## 20. Monetization — Revenue Streams

### Platform Revenue
- Challenger Subscriptions $4.99/month — 100% platform
- AI Token Packs $5/$10/$20 — 100% platform
- Creator subscription cut — 15% platform / 85% creator
- 1-on-1 chat session cut — 20% platform / 80% creator
- Donations cut — 5% platform / 95% creator

### Future Revenue (Phase 3)
- Affiliate links (Stake, DraftKings) with attribution tracking
- Sponsorships (Stake, DraftKings, Monster, Red Bull); UFC partnership end goal
- Monthly bonus pool funded by % of monthly revenue back to community

---

## 21. Refund Policy — 7-Day Window

### Challenger Subscription
- **7-day refund window** from purchase. Full refund granted.
- After 7 days: no refunds. Access continues until end of billing period if they cancel.

### Token Packs
- **7-day refund + ZERO tokens spent** = full refund.
- **Any tokens spent** = no refund on that pack.
- After 7 days: no refunds. Tokens remain.

### Creator Payouts + 1-on-1 Sessions
- **Creator subscription refunds:** if creator subscriber refunds within 7 days, money returns to subscriber. Deducted from pending creator payout.
- **Creator payout timing:** monthly around the 20th. 7-day refund window always falls before payout date.
- **1-on-1 sessions:** Stripe escrow. Auto-refund if creator no-shows 10 min. Otherwise releases on completion: 80% creator / 20% platform.
- **Donations:** non-refundable.

### v6.1.2 — Refund Policy Mirrored In Stripe Metadata + ToS
Three independent matching records:
1. **Stripe charge descriptors** — `statement_descriptor` and metadata field documenting refund policy at purchase time. E.g. `GRIT-CHALLENGER-7D-REFUND`, `GRIT-TOKENS-BINARY-REFUND`.
2. **In-app pre-purchase confirmation** — explicit refund policy text BEFORE confirm button. *"Refundable within 7 days only if no tokens used."* Checkbox required. Stored with transaction.
3. **ToS Section 7 (Refunds)** — identical language to in-app + Stripe metadata. Zero gap.

Chargeback disputes are won or lost on paper trail consistency. Three matching records flips the win rate.

---

## 22. Subscription Lapse + Reactivation (v6.1.1)

### Stays Forever — Earned, Not Rented
- Pick history (all historical picks on profile)
- Stars, badges, keys (achievement progression preserved)
- **Founder badge** (CRITICAL: slot stays with user permanently)
- Approved + featured slips
- Per-fight notes (always free, always private)

### Freezes or Restricts — Active Perks Only
- **AI tokens** — freeze at END of paid billing period. Balance preserved. Unfrozen instantly on resub.
- **Intelligence alerts** — access cuts at billing period end. No retroactive viewing.
- **Slip sharing in chat** — new slips can't be posted. Existing approved slips stay.
- **Raffle + monthly bonus eligibility** — ends at billing period close. Re-eligible on resub. Raffle resets to month-1 only if sub gap >30 days.
- **Subscriber badge + full emoji** — removed on billing period end. Restored on resub.

### Re-Subscription Flow
Existing users who resub pick up where they left off: same display name, same progression, same Founder badge if earned, frozen tokens unfrozen.

---

## 23. Chat Profanity + Spam Filter (v6.1.1)

Proactive pre-send filtering. v6 had only reactive (report/block/mute/ban). v6.1.1 adds defense against first-troll-in-chat scenarios.

### Defenses
- **Profanity library** — open-source `bad-words` (MIT licensed) baseline + custom blocklist for MMA-specific slurs, fighter harassment patterns, link spam
- **Link spam detection** — block messages with 2+ URLs unless from verified Creator. Block known scam patterns (telegram pump links, "DM for picks", crypto address paste)
- **Repeat message throttle** — same user same message 3+ times in 5 min = auto-suppress + admin alert

### Responses
- **Soft block:** blocked message returns toast — *"Message blocked — please review community guidelines."* Never posts. No public shame.
- **Three-strikes auto mute:** 3 blocked messages in 24h = auto 1-hour mute. Admin notified.
- **Admin override:** adjust filter sensitivity per chat, whitelist over-flagged phrases, disable temporarily during testing.

### Why Not AI Moderation Yet
Services like Checkstep, WebPurify, Stream Chat AI moderation cost $50–500/month. Not justified at launch volume. Open-source + custom rules handle 90% of real-world chat abuse for free. **Upgrade Phase 2** when chat volume justifies it.

---

## 24. Paid Creator Eligibility (v6.1.1)

**Free Creator = Day 1 eligible. Paid Creator = trust signals required.**

### Free Creator — Day 1
- No account age requirement
- No activity requirement
- Stripe Connect onboarding only at first donation (lightweight Stripe Express)
- Same picks-visibility options as Paid (public / subs only / post-fight reveal)

### Paid Creator — Trust Signals Required
- **30-day account age**
- **3+ qualifying events on record** (met participation minimum)
- **2FA enabled**
- **No active mod actions** (warnings, mutes, bans)
- **Stripe Connect verified** (`charges_enabled` AND `payouts_enabled` both true)
- **Auto-disable on standards drop:** if Paid Creator gets banned, suspended, or fails Stripe verification → paid features disable, new subs blocked, existing subs handled per Termination rules

### UI
Creator settings tab shows "Eligibility Progress" widget — checklist style. *"Day 17 of 30 days. 2 of 3 events qualified. 2FA: ✓."* Pre-empts support tickets.

---

## 25. Creator Termination Handling (v6.1.1)

Four scenarios — locked rules.

| Scenario | Sub Action | Refund | Communication |
|---|---|---|---|
| Creator voluntarily stops | Auto-cancel at period end | No refund (subs got the full period they paid for) | Subs notified 7 days before period end |
| Creator banned for ToS | Cancel immediately | Pro-rated refund. Platform pays first from withheld creator payout, eats remainder | Subs notified within 24h with refund amount. No reason given (per moderation policy) |
| Creator inactive 60+ days | Auto-pause | No new charges. Sub "paused" not "canceled" — easy to resume | Notifications at 30 and 60 days |
| Creator dies / account deleted | Cancel immediately | No refund (no fraud, just end of service). 7-day notice if possible | Sensitive language if death known. Option to find another creator |

### Why Platform Eats Cost on Bans
Subs paid in good faith. Platform took 15%. Platform vetted the creator at Paid eligibility. Creator bad behavior is platform responsibility. Cost of having a Paid Creator marketplace. Build the loss into Paid Creator economics.

### Pending Payout Withholding
Stripe Connect holds creator earnings for a payout cycle (monthly by default). If creator gets banned, the pending balance can be clawed back to fund refunds. Standard Stripe Connect practice.

---

## 26. Account + Privacy

### Account Deletion + GDPR Data Export
- User-initiated: Settings → Delete Account. Confirmation flow with clear warning.
- On confirm: wipe everything — profile, picks history, notes, slips, ratings, tokens, subscriptions.
- **Data export before delete:** user downloads JSON/CSV of all data (picks, notes, stats, transactions). GDPR compliant.
- **Stripe subscription auto-cancel** on delete. Active tokens forfeit. No refunds on deletion.

### Profile Privacy Settings (Granular Toggles)
- Show/hide from public leaderboards
- Show/hide picks history publicly
- Show/hide stars and badges publicly
- Show/hide full profile to non-followers
- Allow/block creator subscription invites
- Allow/block 1-on-1 chat session requests
- Allow/block donations

### Two-Factor Authentication
- **Challenger:** required (any active sub or token balance)
- **Contender:** optional
- Methods: SMS code or authenticator app (Google Authenticator, Authy). Clerk supports both natively.

### Age Verification
- **18+ self-declaration** checkbox at signup
- **Phone verification** via SMS
- **Email verification** required
- Self-declaration + email + phone = sufficient for analytics platform (not gambling)
- **Future:** if real-money wagering ever added, full government ID verification kicks in

---

## 27. Reporting + Moderation

### Report System
- Report button on every chat message, slip, user profile, creator listing
- **Categories:** Spam · Harassment · Inappropriate · Scam · Fake creator · Other (with text field)
- Reports flow to admin moderation queue (same panel as slips)

### Admin Actions
- Warning (private notification)
- Mute (temporary chat block)
- Ban (account suspended)
- Content removal
- Creator privilege removal
- No action

### Auto-Triggers
- **3 reports against same user** = auto-escalate to admin review with priority flag
- **Progressive penalties** (configurable):
  - First offense: warning
  - Second: mute 24h
  - Third: mute 7 days
  - Fourth: account suspension

### Block + Mute in Chat
- **Block user:** hard block. Their messages hidden everywhere. They cannot DM, donate, subscribe, or book sessions. Managed in Settings → Blocked Users.
- **Mute user:** softer. Their messages hidden for current session only. Resets when chat reopens for next event.

---

## 28. Time Zone + Localization

### Time Zone
- **UTC storage in DB** for all event times, pick lock times, snapshot times. Single source of truth.
- **Auto-detect on signup** via browser timezone. User sees local time automatically.
- **Manual override in Settings.** Dropdown of all global time zones. Useful for travelers.
- **Countdown timers** calculated from UTC, displayed local. Accurate everywhere.

### Multilanguage Roadmap
- **Phase 1: English only in app.** Landing page already supports language selector for marketing.
- **i18n framework from Day 1.** Translation files ready. Adding languages later doesn't require rewriting.
- **Phase 2 languages (in order):** Spanish (Mexico/LatAm/Spain) → Portuguese (Brazil) → Russian (Eastern Europe) → Chinese Simplified (China). Strong MMA markets only.
- **Skip:** French, German, Japanese — no proven MMA fanbase. Reassess later based on user data.

---

## 29. Business Structure + Tax (v6.1)

### Entity Structure
- **US LLC — Post-Validation.** Delaware or Wyoming, foreign-owned (single-member, non-US founder). Via Stripe Atlas or equivalent. Owns platform, IP, Stripe accounts, customer contracts.
- **~$500 setup, 2–3 weeks.** NOT a Phase 1 cost. Formation triggered when real subscriber revenue is flowing. Until then, operate on personal Stripe to test market.
- **Why not Mexico:** 2026 Mexican tax reform = real-time SAT data access, CFDI e-invoicing, IEPS up to 50% on sweepstakes, kill-switch enforcement. US LLC removes platform from Mexican jurisdiction.
- **Why not offshore:** banking friction, Stripe Connect compatibility issues, blacklisted in some jurisdictions, harder to attract acquirers. Mexico's 2022 beneficial ownership rules require disclosure anyway.
- **Stripe Atlas recommended** — bundles Delaware LLC, EIN, US bank, registered agent. Year 1 federal filing included.

### Tax Obligations — Two-Sided Split
- **Platform side (US LLC):** Form 5472 + pro-forma 1120 annually. Minimal US tax owed when no US-effectively-connected activity. Sales tax handled by Stripe automatically. ~$400–800/year for US accountant familiar with foreign-owned LLCs.
- **Founder side (Mexican personal):** founder remains Mexican tax resident. Annual personal income tax in Mexico declares foreign-source income from LLC distributions. Standard brackets. No special digital platform burden.

### US Prize Payouts — 1099-NEC Tracking
- If any US user receives **$600+** in cash payouts (monthly bonus + keys + raffles combined) in a calendar year, US LLC must issue 1099-NEC by January 31 of following year.
- Collect W-9 from US winners before threshold.
- Admin dashboard tracks cumulative payouts per user.

### Non-US Winners — No Withholding
- US LLC has no withholding obligation paying non-US users from non-US-source income.
- Collect W-8BEN from non-US winners as paper trail.

### Mexican Users — Self-Report
- Declare foreign income on own Mexican return.
- Platform has no SAT reporting obligation (not Mexican-domiciled).

### Compliance Tracker Per User (Admin Dashboard)
- **Cumulative payout column** — tracks total cash paid per user per calendar year. Yellow warning at $400. Red flag at $550. Block further payouts until W-9 (US) or W-8BEN (non-US) collected via DocuSign or HelloSign.
- **User citizenship flag** — self-declared at signup. Drives which tax form is required.
- **Annual 1099-NEC batch** — admin generates list of US users >$600 threshold, forms issued by Jan 31.

---

## 30. Anti-Fraud + Multi-Account Detection (v6.1.2)

Keys ($100), monthly bonus ($550), raffle, Founder slots — all gameable with sockpuppets. v6.1.2 adds tripwires.

### Detection Layer
- **Device fingerprinting** — FingerprintJS free tier on signup + payment events. Stable device ID across cookies, sessions, even VPN swaps.
- **Stripe customer email dedup** — checked against existing records on every payment.
- **Payment method hash** — Stripe `card.fingerprint` (same card across two accounts has same fingerprint even if numbers obscured). Hard dedup signal.
- **IP + ASN logging** — at signup, first sub, prize-eligible events. ASN cross-referenced.
- **Behavioral patterns** — pick timing similarity, identical pick selections across accounts, similar account creation timing. Batch analysis (not real-time block).

### Enforcement Layer
- **Soft flag → admin review** — suspicious accounts flagged in admin dashboard. Not auto-banned. Admin reviews before any prize payout above $50.
- **Pre-payout block** — monthly bonus, key prize, raffle payouts require admin manual review for flagged accounts.
- **Hard flag (fingerprint + payment match)** — block new sub at Stripe checkout: *"This payment method is already linked to another account. Contact support."*
- **Ban cascade** — when one account gets banned for fraud, all linked accounts (by fingerprint, payment method, behavioral cluster) flagged for review.
- **Appeals process** — legit shared-device cases exist (couples, families, roommates). Admin whitelists manually.

### Cost / Effort
- FingerprintJS free tier: up to 20k unique visitors/month
- Stripe fingerprint: built-in (no cost)
- IP/ASN logging: free with any geoip lookup
- **Total cost: $0** until outgrowing FingerprintJS free tier
- **Effort: 1-2 days dev work** for full pipeline

### Privacy
Device fingerprinting + behavioral logging disclosed in Privacy Policy. EU users may have GDPR opt-out rights; legitimate interest for fraud prevention generally holds. Document data collected + retention period (24 months recommended).

---

## 31. Backup + Disaster Recovery (v6.1.2)

### Automatic Coverage
- **Daily Database Backups** — Supabase Pro plan ($25/month) includes daily automated backups + 7-day retention. Team plan extends to 14 days.
- **Point-in-Time Recovery (PITR)** — Supabase Team plan adds PITR. Restore to any second within retention. Phase 2 upgrade.
- **Storage Bucket Redundancy** — native cloud storage redundancy for slip images, fighter photos, avatars.

### Founder-Operated Tier
- **Weekly manual snapshot** — every Sunday: `pg_dump` via Supabase CLI to encrypted cloud storage (Backblaze B2 cheap, or Google Drive personal). Belt + suspenders.
- **Monthly restore test** — spin up staging Supabase project, restore latest backup, verify. Calendar reminder.
- **Documented runbook** — "what to do if production goes down" — step-by-step in admin docs. Contact Supabase support, restore from latest, communicate via Twitter + email, read-only mode if partial restore.
- **RTO 4 hours, RPO 24 hours** — acceptable for analytics platform at this stage. Tighten when revenue justifies.

### Disaster Scenarios
1. **Supabase outage** — wait it out, communicate.
2. **Data corruption** — restore from backup, lose 1 day max.
3. **Account compromise** — change admin keys, restore from pre-compromise backup, force user re-auth via Clerk.

None are end-of-business with this plan.

---

## 32. Legal — Required Pages Before Launch

- **Terms of Service** — footer link + signup confirmation. Cover: liability, content ownership, dispute resolution, payment terms, AI usage rules, account termination. **Governing law: State of Delaware** (US LLC jurisdiction).
- **Privacy Policy** — footer link + signup confirmation. Cover: data collected, how used, third-party sharing (Stripe, Anthropic, OneSignal), user rights, GDPR compliance, data retention.
- **Creator Agreement** — required acceptance during creator onboarding. Cover: payout terms, refund obligations, no-show penalties, content responsibility, platform fees, tax responsibility.
- **Cookie Policy** — EU compliance. Cookie banner with accept/decline. Analytics opt-in.
- **Acceptable Use Policy** — defines banned behaviors (cheating, scamming, hate speech, abuse). Referenced in ToS.

Base legal language modeled after Rithmm, Action Network, comparable MMA analytics platforms. Custom GRIT-specific clauses added. **Attorney review recommended before launch.**

---

# PART II — THE BUILD PLAN

---

## 32a. The Rule — Build Ordering Principle (from blueprint)

> *"Clean first. Fix second. Build third. Comply throughout. Ship. Observe. Adjust."*

Six ordered priorities that govern Phase 1 execution:

1. **Clean Dead Code** — Pre-build cleanup (§33). Reduce surface area before adding anything new.
2. **Fix Security + Bugs** — Admin email, missing imports, broken cron, missing schema fields, etc.
3. **Rewrite Scoring** — Flat points → net units from moneyline. Heart of the product.
4. **Build Creator + Engagement** — Tokens, creators, slips, rating, notes, recap, notifications, intel feed.
5. **Lock Compliance** — Refund policy mirror, ToS/Privacy/Cookie/Creator Agreement, 1099-NEC tracking, multi-account detection, backup/DR runbook.
6. **Ship. Observe. Adjust.** — Deploy, monitor, iterate.

Every Week 0–9 milestone in §36 should map cleanly to one of these six.

---

## 33. Pre-Build Cleanup (Execute First)

| # | Item | Priority |
|---|---|---|
| 1 | Move admin email to env var (was hardcoded in `guards.ts` + `replitAuth.ts`) | Security — before deploy |
| 2 | Update Anthropic model to `claude-sonnet-4-6` | One-line fix |
| 3 | Delete `statsIngest.ts` | 284 lines dead — **VERIFY: dynamically imported by `adminFighterRoutes.ts:257`, may be alive** |
| 4 | Delete monthly progression duplicate | Per-event is live, monthly dupe never called — **VERIFY: actually called by cronService.ts:29** |
| 5 | Wire `expirationService.ts` to cron | Sub expiry logic exists but never triggers. Revenue leak. |
| 6 | Do NOT touch `dataEngineService.ts` in Phase 1 | 650 lines monolithic. Map it, isolate it, refactor Phase 2 only. |

(Items 3 + 4 are flagged because Week 0 verification showed both are actually wired — see §47 Reconciliation.)

---

## 34. System Inventory — Status Per Spec

| System | Status | Action |
|---|---|---|
| Pick System core | ✅ WORKING | Modify scoring weight per §7 |
| `scoringService.ts` | ⚠️ REWRITE | Replace flat points with net-units ROI |
| `progressionService.ts` | ⚠️ MODIFY | 5-star + Grandmaster + 1-unit tolerance + monthly bonus draw |
| `roiCalculator.ts` | ✅ ACTIVE | Keep + extend |
| Leaderboard | ✅ WORKING | Keep as-is structurally, swap input to net units |
| Event Lifecycle | ✅ WORKING | Keep (5 states confirmed in DB after Week 0 audit) |
| Fighter Database | ✅ WORKING | Keep |
| Raffle System | ✅ WORKING | Keep, verify month-1 exclusion logic |
| Community Chat | ✅ WORKING | Extend with slip system + tier gates + profanity filter |
| Participation Formula | ✅ FIXED | Fixed table in place |
| Flag System | ✅ FIXED | Yellow counts. Red excludes. |
| Dashboard | ✅ FIXED | All widgets on real data (verified Week 0) |
| Pick Board | ✅ BUILT | Keep |
| Tag System | ✅ BUILT | Keep |
| Data Engine Pipeline | ⚠️ DEBUGGING | Fix data quality (Islam Makhachev test). Manual mode for launch. |
| Real Betting Tracker | ✅ BUILT | Surface on dashboard (toggle in settings) |
| Winning Streak | ✅ FIXED | Event-level, 2+ consecutive |
| Cron Jobs | ✅ BUILT | Keep + add slip expiry assignment + Inngest migration in Week 8 |
| Key System | ⚠️ PARTIAL | Complete frontend (backend awards on clean sweep, Gold Key SVG pending) |
| Auth — Replit OIDC | ⚠️ REPLACE | Migrate to Clerk |
| Stripe | ⚠️ EXTEND | Add Connect + token packs + escrow |
| Creator System | 🆕 BUILD | Phase 1 |
| Slip System | 🆕 BUILD | Phase 1 (table exists, no logic) |
| Founder Badges | 🆕 BUILD | Phase 1 (10/50/500/1000 slot tracking, atomic) |
| Grandmaster Badge | 🆕 BUILD | Phase 1 (one enum + migration) |
| Gold Key Badge | 🆕 BUILD | Phase 1 (5 keys = badge unlock) |
| Monthly Bonus Draw | 🆕 BUILD | Phase 1 ($550 fixed pool) |
| Live Fighter Rating | 🆕 BUILD | Phase 1 (5 criteria + 5-layer anti-spam) |
| Per-Fight Notes | 🆕 BUILD | Phase 1 (table exists, no UI) |
| Event Recap | 🆕 BUILD | Phase 1 |
| Notifications System | 🆕 BUILD | Phase 1 (OneSignal, 12+ triggers) |
| Onboarding Flow | 🆕 BUILD | Phase 1 (7 steps) |
| In-App Rules Tab | 🆕 BUILD | Phase 1 |
| Intel Feed | 🆕 BUILD | Phase 1 (admin publish + Challenger gate) |
| 1-on-1 Paid Chat | 🆕 BUILD | Phase 1 (text only, escrow, 10-min no-show) |
| Profile Privacy UI | 🆕 BUILD | Phase 1 (schema exists) |
| Account Delete + GDPR Export | 🆕 BUILD | Phase 1 |
| Profanity Filter | 🆕 BUILD | Phase 1 |
| Multi-Account Detection | 🆕 BUILD | Phase 1 |
| Time Zone Handling | 🆕 BUILD | Phase 1 (replace hardcoded PST/EST map) |
| 1099-NEC Tracking | 🆕 BUILD | Phase 1 (admin dashboard field) |
| ToS / Privacy / Cookie / Creator Agreement | 🆕 BUILD | Phase 1 |
| Backup + DR Runbook | 🆕 BUILD | Phase 1 (Supabase Pro + weekly snapshot + monthly restore test) |
| Landing Page | ⚠️ NEARLY DONE | Fighter images + logo + favicon pending (Fiverr SVGs) |
| AI Prediction Engine (Server 2) | 🆕 BUILD | **Phase 3 only** |
| `statsIngest.ts` | ❌ VERIFY ALIVE | Found dynamically imported by `adminFighterRoutes.ts:257` — keep or rewire |
| `expirationService.ts` | ⚠️ BUG FIXED Week 0 | Now wired to daily cron, port to Inngest Week 8 |

---

## 35. Tech Stack — Add / Modify / Keep

| SDK / Tool | Action | Notes |
|---|---|---|
| `@anthropic-ai/sdk` | UPDATE | Model `claude-sonnet-4-6` (done Week 0) |
| `openai` | KEEP | Demote to embeddings only |
| `stripe` | EXTEND | Add Connect + token packs + escrow |
| `@clerk/express` + `@clerk/clerk-react` | ADD | Replaces Replit OIDC (installed Week 0) |
| `@supabase/supabase-js` | ADD | RLS + Realtime |
| `@upstash/redis` | ADD | Leaderboard cache + rate limiting |
| `inngest` | ADD | Background jobs |
| `onesignal` | KEEP / WIRE | SDK already installed, triggers broken (fixed Week 0), wire full coverage Week 4 |
| `resend` | ADD | Transactional email |
| `posthog-js` + `posthog-node` | ADD | Analytics + flags |
| `drizzle-orm` | KEEP | Type-safe queries |
| `socket.io` | KEEP + EXTEND | Live leaderboard in Phase 2 |
| `framer-motion` | KEEP | Animations + celebrations |
| `html2canvas` | KEEP | Pick board shares |
| `zod` | KEEP | Validation |
| `bad-words` | ADD | Profanity filter (Week 7) |
| `@fingerprintjs/fingerprintjs` | ADD | Multi-account detection (Week 8) |
| `svix` | ADD | Clerk webhook verification (installed Week 0) |
| `emoji-mart` | ADD | Challenger expanded emoji (installed Week 0) |

---

## 36. Phase 1 — Week-by-Week (9 weeks)

**Phase 1 = "CLEANUP + CORE + CREATOR + ENGAGEMENT + COMPLIANCE"** (blueprint subtitle). Clean. Fix. Build creator. Add engagement. Lock compliance. 7–9 weeks.

### Week 0 — Emergency Stabilization (✅ COMPLETED 2026-05-21)
See §47 Reconciliation for the 24 items shipped.

### Week 1 — Auth + Stack Provisioning
- Provision Clerk, Stripe Connect, Upstash, Inngest, OneSignal, Resend, PostHog
- Migrate Replit OIDC → Clerk (highest risk single change — touches every protected route)
- 2FA enforcement gated to Challenger tier
- Clerk webhook for user sync to local `users` table
- Delete `server/replit_integrations/` entirely
- **Verify Platform Sub $4.99/month** wiring end-to-end: Stripe price object exists, checkout flow charges $4.99, webhook upgrades `tier='challenger'`, downgrade on cancel/expiry works. Hardcoded $4.99 lives in `server/config/env.ts` config block.
- `npm audit fix` review (36 vulnerabilities, 1 critical)

### Week 2 — Schema Alignment + Tier Rename
- Add `grandmaster` to `users.progressBadge` enum + `config.BADGE_TIERS`
- Rename tier enum: `free|medium|premium` → `free|challenger`. **Creator is NOT a tier** — it's a separate role/profile. A Challenger can also be a Creator. A free Contender can be a Free Creator. Migration must preserve any existing user data correctly (5 test users currently; old `plus` and `pro` map to `challenger`, old `free` stays `free`).
- Creator state stored separately: `creator_profiles` table (with `is_paid`, `stripe_connect_account_id`, `paid_eligibility_met_at`, etc.) — created in this week's schema work below
- Friendly display names in UI ("Contender" for free, "Challenger" for paid) live in the i18n/copy layer, NOT in the DB enum
- Add token-economy tables: `token_packs`, `token_balances`, `token_transactions`
- Add creator tables: `creator_profiles`, `creator_subscriptions`, `chat_sessions`
- Add `fighter_ratings` table (5 criteria + anti-spam metadata)
- Add `device_fingerprints` table (multi-account detection)
- Supabase RLS policies for picks, notes, slips, creator pick visibility

### Week 3 — Scoring + Progression Rewrite
- Replace flat-points scoring with net-units ROI engine (moneyline only counts)
- Method/round become personal accuracy tracker only ("just for fun" UI label)
- Rewrite leaderboard service to consume net units
- Per-event progression with 1-unit tolerance
- **Founder badge slot tracking** (10/50/500/1000, atomic allocation, permanent on cancel)
- **Gold Key Badge** (5 keys = unlock) + frontend display
- Update Vitest scoring tests to new math

### Week 4 — Engagement Layer
- **Live Fighter Rating** (5 criteria + 5-layer anti-spam)
- **Per-Fight Private Notes** UI (RLS enforced, available to ALL users not Challenger-gated)
- **Event Recap view** (Claude paragraph summary + AI comparison + first-loss warm message)
- **OneSignal notifications** — all 12+ triggers from §11
- **Intelligence Alerts Feed** — Phase 1 build (admin publish + Challenger gate; Phase 2 = full polish):
  - Admin publish UI (signal, fighter/event attach, urgency, tags)
  - Challenger-gated reading (Contender = teaser + upgrade CTA)
  - Dashboard teaser widget
  - Tag pills color-coded
- **Real Betting Tracker dashboard widget** — backend exists; surface as a dashboard widget. Toggle in settings to show/hide. Tracks unit size, wagered, P&L, ROI. Private — never on any leaderboard.

### Week 5 — Stripe Layer (DEDICATED week)
- **AI Token Economy:**
  - Token packs purchase ($5/100, $10/220, $20/500)
  - Token meter component (gas-tank visual + color states + animation)
  - Per-feature token cost map
  - Payment failure fallback (modal + persistent banner + free content access + email after 3 failed attempts)
  - Empty meter at signup with upgrade prompt
- **Refund flow:**
  - 7-day window enforcement (subs + tokens)
  - Binary token refund (touched = no refund)
  - Stripe metadata mirror + in-app confirm checkbox + ToS Section 7 (3-way paper trail)
- **Stripe Connect** for creator payouts
- **Stripe escrow** for 1-on-1 sessions
- **Admin AI Controls Dashboard** (pricing editor, model switch, cost monitoring, user token management, bulk ops)

### Week 6 — Creator Economy
- Creator toggle in settings (Free vs Paid)
- **Paid Creator eligibility gate** (30d age + 3 qualifying events + 2FA + Stripe Connect verified + no active mod actions)
- **Pick visibility per pick** (public / subscribers only / post-fight reveal) with RLS enforcement
- **Donations** (95/5 split)
- **Creator Subscriptions** (85/15 split)
- **1-on-1 Paid Chat Sessions** (text only, Stripe escrow, 10-min no-show auto-refund, 80/20 split, messages saved)
- Creator Agreement page + acceptance flow
- **Creator Termination handling** — 4 scenarios per §25

### Week 7 — Slips + Chat Upgrade + Moderation
- **Slip System:**
  - Upload (JPG/PNG/WebP, max 5MB)
  - Wire 7-day `expiresAt` on insert
  - Admin moderation queue (Approve / Feature / Reject)
  - Chat posting (1 per 30 min cooldown)
  - **Slip Wall** on landing (max 6 featured) + in-app full hall of fame
- **Chat Upgrades:**
  - Admin per-event toggle (opens on Live, closes 24h after)
  - Tier gates (Contender basic emoji, Challenger full Emoji Mart + slips + badge)
  - **Profanity filter** (`bad-words` + custom MMA blocklist + harassment patterns)
  - Link spam detection (2+ URLs unless verified Creator, scam pattern detection)
  - Repeat message throttle (3 same in 5min = auto-suppress)
  - Three-strikes auto-mute (3 blocks/24h = 1h mute)
  - Admin filter sensitivity control + whitelist
- **Reporting + Moderation:**
  - Report button everywhere
  - 6 categories
  - 3-report auto-escalate
  - Progressive penalties (warning → 24h → 7d → suspend)
- **Block + Mute UI** in Settings → Blocked Users

### Week 8 — Compliance + Operational
- **7-Step Onboarding** (replaces single `WelcomeModal`)
- **In-App Rules Tab** in main navigation
- **Account Deletion + GDPR Data Export** (per-user JSON/CSV download before delete)
- **Profile Privacy Settings UI** (7 granular toggles per §26)
- **Age + Phone Verification** (Clerk native)
- **Time Zone handling** (UTC storage, auto-detect, manual override, replace hardcoded PST/EST map)
- **5 legal pages** — Terms of Service + Privacy Policy + Cookie Policy + Creator Agreement + Acceptable Use Policy. Acceptance recorded per user. Cookie banner accept/decline (EU compliance). Analytics cookies opt-in. Base language modeled after Rithmm/Action Network; attorney review recommended before launch.
- **1099-NEC tracking field** (cumulative payouts per user, yellow $400, red $550)
- **Fight Void Rules** (8 scenarios per §6) + qualification recompute on void
- **Subscription Lapse Survival Rules** — explicit enumeration per §22
- **Monthly Bonus Draw** ($550 pool):
  - Inngest job 1st of month at 00:05 UTC
  - Top-3 selection (≥2 qualified events for cash race; ≥1 for random draw)
  - Tiebreaker logic (earliest full-card lock with no post-lock mods)
  - Admin payout dashboard
- **Multi-Account Detection** (FingerprintJS + Stripe fingerprint dedup + IP/ASN log + ban cascade + appeals)
- **Backup + DR Runbook** (Supabase Pro + weekly manual snapshot + monthly restore test + 3-scenario runbook + RTO 4h/RPO 24h)
- **Inngest — Phase 1 scope** (full migration is Phase 2 per blueprint): set up Inngest event key + signing key in env; wire ONLY the new jobs that don't yet exist on node-cron — monthly bonus draw (1st of month, 00:05 UTC), 1099-NEC threshold check (daily). Existing node-cron jobs (sub expiration, slip expiry, monthly/yearly snapshots, pipeline retry) STAY on node-cron through Phase 1. Phase 2 migrates them all.

### Week 9 — Polish + Deploy
- Landing page final polish (waiting on 11 SVGs + fighter photos)
- Mobile bottom nav final pass
- Full QA pass on all flows
- Deploy: Vercel (frontend) + Railway (backend) + Supabase (DB)
- DNS, SSL, monitoring, alerts
- Soft launch to first 1,000 (Founder I–IV badge race begins)

---

## 37. Phase 2 — Deferred (Post-Launch Polish + Refactor)

**Phase 2 = "POLISH + REFACTOR"** (blueprint subtitle). Live tournament. Result animations. Refactor data engine. Performance.

- **AI Chat Scoped to Upcoming Fights** — chat per fight, context-aware
- **Pre-Generated Fight Breakdowns** — cache popular AI outputs
- **Intelligence Feed Full Build** — beyond Phase 1's admin publish + Challenger gate; full polish, smart routing, signal scoring
- **Live Tournament Leaderboard** — fight-by-fight real-time updates during live card, green moneyline accuracy only
- **Result Animations + Sound** — KO/TKO, Submission, Decision with sound effects
- **`dataEngineService.ts` Refactor** — 650-line monolith split into FighterPipelineService, EventPipelineService, NewsPipelineService
- **dataintakegrit agents 1/2/3 re-enable** — currently `MANUAL_INGESTION_MODE=True`, manual ingestion UI is live ingestion path
- **Upstash Redis Leaderboard Cache** — full integration (Phase 1 sets up Upstash; Phase 2 wires the cache hot path)
- **Inngest Job Migration** — port remaining node-cron + pg-boss jobs to Inngest (sub expiration, slip expiry, monthly/yearly snapshots, outbound sync, pipeline retry)
- **Community Rating Roll-up Views** — aggregate Live Fighter Rating data into fighter profiles (data flowing from Phase 1)
- **Street Credibility Rankings** — community-generated rankings separate from official
- **i18n expansion** — Spanish (Mexico/LatAm/Spain) → Portuguese (Brazil) → Russian → Chinese Simplified. Skip French/German/Japanese.
- **AI moderation upgrade** — Checkstep / WebPurify / Stream Chat AI when chat volume justifies $50–500/mo
- **PITR upgrade** — move Supabase Pro → Team for Point-in-Time Recovery
- **Type safety cleanup** — gradual elimination of 115 `as any` instances as files get touched

---

## 38. Phase 3 — Deferred (Scale + Moat)

**Phase 3 = "SCALE + MOAT"** (blueprint subtitle). After real users. AI Prediction Engine. Mobile. Affiliates. UFC pitch.

- **AI Prediction Engine — Server 2** — Claude vs GPT vs Grok. Same prompt, same data, same odds. Independent picks. Live accuracy leaderboard.
- **Affiliate Links** — Stake + DraftKings, trackable attribution IDs at decision moments (pick submission, intelligence review)
- **Line Movement Tracking** — historical odds table, movement charts, multi-sportsbook comparison foundation
- **AI Fighter Portrait Generation** — in main app (data engine already has DALL-E 3 portrait pipeline; bring it to live app)
- **Mobile App** — React Native or activate Capacitor packages already installed (`@capacitor/core`, `@capacitor-community/admob`)
- **Multi-Promotion Expansion** — Bellator, PFL (schema already supports 16–17 fight cards per §5)
- **UFC Partnership Pitch** — revenue + DAU benchmarks ready; end-goal acquisition pitch
- **Sponsorships** — Stake, DraftKings, Monster, Red Bull pursued at scale

---

## 39. Pending Assets (Blockers)

| Asset | Status | Blocking |
|---|---|---|
| 11 SVG files (GRIT wordmark, GRIT icon, Founder I–IV, Ninja, Samurai, Master, Grandmaster, GOAT, Gold Key Badge) | Founder delivering | Landing page + Badges visuals |
| Fighter photos (400×400 face, 400×600 half body) | Data engine pipeline | Landing page |
| API keys for live testing (Clerk, Stripe, OneSignal, etc.) | Founder provisioning sprint | Week 1 cutover |
| Islam Makhachev test output | Data engine debug | Phase 2 agent re-enable |

Until SVGs land, `BrandAsset` placeholder component renders grey boxes. Drop SVGs in `public/brand/<name>.svg` to swap in 1:1 (zero code changes).

---

## 40. Definition of Done — Phase 1 Ship Criteria

Phase 1 is "done" when ALL of:

- [ ] Fresh clone + `npm install` + env setup + `npm run db:migrate` + `npm run dev` boots clean
- [ ] User can sign up via Clerk, complete 7-step onboarding, make picks, submit, view scored results
- [ ] Challenger sub purchase works end-to-end (Stripe → tier upgrade → token purchase → token spend on AI feature)
- [ ] Per-event scoring uses net units; leaderboard shows net units; ranks update on event close
- [ ] Star/badge progression awards correctly per event with 1-unit tolerance
- [ ] **Live fighter rating** (5 criteria + anti-spam) + **per-fight notes** work for ALL users (NOT Challenger-gated)
- [ ] Slip upload → admin approve → posts in chat → 7-day auto-expire → Featured slips appear on Slip Wall
- [ ] Creator can become paid, list 1-on-1 sessions, accept booking, complete session, get paid via Connect
- [ ] All 8 fight-void scenarios handled correctly (auto-recompute qualification + real-time user notification)
- [ ] All 12+ notification triggers fire (event 7d/24h/1h/live/15min-before-each + star/badge/key/rank/bonus/raffle/slip)
- [ ] **Monthly Bonus Draw** runs via Inngest, picks top-3 ROI + 2 random, admin payout dashboard records winners
- [ ] **Intel Feed**: Challenger sees full feed; Contender sees teaser + upgrade CTA; admin can publish signals
- [ ] Chat opens automatically when event goes Live, closes 24h after; admin override available
- [ ] **Founder badge slot allocation is atomic** — verified by stress test (2 concurrent subscribers can't claim same slot)
- [ ] Sub lapse + resub preserves badges/keys/Founder slot/notes; freezes tokens/intel/raffle correctly
- [ ] Multi-account detection flags fingerprint+payment collisions; admin review queue for prize payouts >$50
- [ ] All 5 legal pages exist (ToS + Privacy + Cookie + Creator Agreement + Acceptable Use Policy) with acceptance recorded per user
- [ ] Cookie banner shows on first visit (EU compliance); analytics cookies opt-in
- [ ] Real Betting Tracker widget surfaces on dashboard when toggle is on; never appears on any leaderboard
- [ ] Tier migration: existing `free` users remain `free`; `plus` and `pro` (test data) map to `challenger`; zero user data lost
- [ ] Inngest wired for new Phase 1 jobs (monthly bonus, 1099 threshold check); existing node-cron jobs untouched (Phase 2 migration)
- [ ] **Refund Policy mirrored** across Stripe metadata + in-app confirm checkbox + ToS Section 7
- [ ] Time zone handled correctly (UTC storage, auto-detect, manual override)
- [ ] 1099-NEC tracking field on admin dashboard (yellow at $400, red at $550, blocks payout until W-9/W-8BEN)
- [ ] Profile privacy settings (7 toggles) work
- [ ] Account deletion + GDPR data export work
- [ ] Vitest passes in CI (scoring + progression + Stripe webhook + auth guards + Clerk webhook minimum)
- [ ] Deployed: gritapp on Vercel + backend on Railway + Supabase prod project
- [ ] Sentry catching errors, PostHog tracking funnels
- [ ] Backup runbook documented; monthly restore test scheduled
- [ ] No `as any` introduced in NEW code (legacy holes acceptable for cleanup later)

---

# PART III — RECONCILIATION (against verified codebase)

---

## 41. What Already Exists That Matches Spec (KEEP)

From Week 0 audit + DB verification:

| System | Reality |
|---|---|
| Pick system core (moneyline submission, locked odds, flag write) | Wired ✅ |
| `roiCalculator.ts` | Imported by progression service; foundation for new scoring |
| Event lifecycle (Upcoming → Live → Completed → Closed → Archived) | DB confirmed (migration 0006 never applied) |
| Fighter database + history | Wired ✅ |
| Raffle pool / draws / Stripe auto-add | Wired ✅ |
| Community Chat (Socket.io) | Wired ✅ — extend per §10 |
| Pick Board (html2canvas share cards) | Wired ✅ |
| Tag system | Wired ✅ |
| Stripe subscriptions + one-time + webhooks | Wired ✅ (no Connect yet — Week 5) |
| Anthropic SDK | Wired ✅, model bumped to `claude-sonnet-4-6` Week 0 |
| OpenAI GPT-4o-mini | Wired ✅, demote to embeddings only later |
| Drizzle ORM | Keep — don't change |
| Zod validation | Keep |
| Framer Motion, shadcn/ui, react-i18next, html2canvas | Keep |
| Sentry (browser + server) | Already initialized when DSN set |
| OneSignal SDK | Partial wiring; complete triggers Week 4 |
| OpenMeter SDK | Could anchor AI token economy metering |
| Pick Distribution (community sentiment) | Already wired |
| Pick Lock multi-layer (time/status/flag) | Already implemented |
| Winning Streak (2+ consecutive) | Already in `progressionService` |
| Heartbeat endpoint | `/api/system/heartbeat` works |
| pg-boss outbound-sync queue | Works (audit's "broken pg-boss import" was wrong, verified Week 0) |
| 52 tables in production DB | Fresh baseline applied Week 0, schema matches code |

---

## 42. What Needs Adapting (MODIFY)

| Item | Change |
|---|---|
| `progressionService.ts` | Add Grandmaster, change tolerance 2u→1u, monthly progression becomes snapshot-only, add monthly bonus draw |
| `scoringService.ts` | Replace flat points (+1/+2/+3) with net-units from moneyline only |
| Tier enum migration | `free \| medium \| premium` → `free \| challenger` (Creator is a separate role, not a tier — see §4 data model note) |
| `progressBadge` enum | Add `grandmaster` between `master` and `goat` |
| Stripe integration | Add Connect (creator payouts), escrow (1-on-1), token packs |
| Chat system | Add admin toggle, tier gates, slip posting, profanity filter |
| `anthropicService.ts` | Promote from fallback to primary (currently OpenAI primary, Anthropic fallback) |
| Replit OIDC | Replace with Clerk |
| Time zone hardcoded PST/EST map (`picksRoutes.ts:39-44`) | Replace with proper UTC + user TZ |
| Tests under `tests/` | Migrate 5 tsx scripts with hardcoded prod UUIDs into Vitest |

---

## 43. What Needs Full Rewrite (REWRITE)

| Item | Why |
|---|---|
| **`scoringService.ts`** | Fundamentally wrong scoring model (flat points vs net units mandate). Affects every downstream consumer (leaderboard, progression, recap, dashboard). ~7-10 day rewrite when combined with leaderboardService. |
| **Auth layer (Replit OIDC → Clerk)** | Touches every protected route. Highest-risk change in entire build. Week 1. |

---

## 44. What Needs Building From Scratch (BUILD)

Tables that exist in DB but have no UI/logic (just schema):
- `slips` — full slip system (Week 7)
- `fightNotes` — per-fight private notes UI (Week 4)
- `intelFeedItems` — intel feed UI + admin publish (Week 4)
- `userKeys` — keys frontend (Week 3)
- `userBadges` extended for Founder slots — Week 3
- `groups` / `groupMembers` / `groupChat` — already mounted in App.tsx Week 0; Phase 1 polish if needed

Tables that don't exist yet:
- `token_packs`, `token_balances`, `token_transactions` — AI token economy (Week 2 schema, Week 5 logic)
- `creator_profiles`, `creator_subscriptions`, `chat_sessions` — creator economy (Week 2 schema, Week 6 logic)
- `fighter_ratings` — live fighter rating (Week 2 schema, Week 4 logic)
- `device_fingerprints` — multi-account detection (Week 2 schema, Week 8 logic)

Features with zero current code:
- AI token economy (meter, packs, per-feature cost, payment fallback)
- Creator economy (paid eligibility gate, 1-on-1 chat sessions, donations)
- Stripe Connect + Escrow
- Live fighter rating + 5-layer anti-spam
- Event recap view + Claude summary
- 7-step onboarding flow
- In-app Rules tab
- Account deletion + GDPR export route (delete exists, no export endpoint)
- Slip Wall (landing + in-app)
- Profanity filter
- Multi-account detection
- Backup runbook (docs/ops, not code)
- 1099-NEC tracking dashboard field
- ToS / Privacy / Cookie / Creator Agreement pages
- Time zone proper handling
- Monthly bonus draw job + payout dashboard
- Intelligence feed admin publish UI + Challenger gating
- Sub lapse rules explicit enforcement
- Refund flow Stripe-metadata mirror

---

## 45. Verified Code Reality (Week 0 Audit Findings)

| Finding | Status |
|---|---|
| Production DB went from 30 → 52 tables (fresh baseline applied Week 0) | ✅ Synced |
| Drizzle journal had only 1 real migration; old 9 migrations archived under `migrations/_archive_pre_phase1/` | ✅ Clean |
| `drizzle.config.ts` was missing `shared/models/auth.ts` reference — root cause of schema drift; fixed Week 0 | ✅ Fixed |
| Migration 0006 (collapsing event status to draft\|ready) was never actually applied to prod | ✅ Cancelled |
| `statsIngest.ts` is NOT dead — dynamically imported by `adminFighterRoutes.ts:257`. Audit was wrong. | Keep |
| `runMonthlyProgression` is NOT dead — wired to cronService and admin endpoint. Will become snapshot-only Week 3. | Modify |
| `jobService.ts` pg-boss `import { PgBoss }` was correct (NAMED export). Audit said default; reverted my fix Week 0. | Verified |
| `scoringService.ts` clean-sweep code crashed at runtime due to missing imports (`ne`, `gt`, `badgeAudit`); fixed Week 0 | ✅ Fixed |
| `notificationService.ts` 4 trigger helpers used wrong dynamic import path; fixed Week 0 | ✅ Fixed |
| `groupService.ts` missing type imports; fixed Week 0 | ✅ Fixed |
| `python event_fight_reconciler.py:346` had `TypeError` (`len()` on int); fixed Week 0 | ✅ Fixed |
| Admin email hardcoded in `guards.ts` + `replitAuth.ts` (`saraimateo1612@proton.me`); removed Week 0 — throws if env missing | ✅ Fixed |
| Anthropic model bumped `claude-3-5-sonnet-20240620` → `claude-sonnet-4-6` Week 0 | ✅ Fixed |
| `expirationService.checkExpirations` wired to daily 03:00 cron Week 0; will port to Inngest Week 8 | ✅ Wired |
| 12 dead frontend components + 5 empty dirs deleted Week 0 (RaffleTab, InfluencerTab, InfoTab, dashboard widgets, mock data) | ✅ Cleaned |
| Vitest stood up Week 0; 7 baseline scoring tests pass; pin current flat-points math so Week 3 rewrite is visibly intentional | ✅ Ready |
| `BrandAsset` placeholder component + `/public/brand/` drop zone ready Week 0 | ✅ Ready |
| 36 npm vulnerabilities (1 critical, 12 high) flagged Week 0 — `npm audit fix` review pending Week 1 | ⚠️ Pending |
| `MANUAL_INGESTION_MODE = True` in `dataintakegrit/backend/app/agents/pipeline_manager.py:20` — Agents 1/2/3/7 globally disabled; manual ingestion UI (1693 LOC `ManualIngest.tsx`) is live ingestion path | Documented |
| dataintakegrit CORS = `allow_origins=["*"]` + `allow_credentials=True` — invalid combo; functionally insecure | ⚠️ Phase 2 fix |
| `/api/setup/status` endpoint publicly unauthenticated (info leak: fighter/event/pipeline counts); `/setup/full-reset` API-key protected but key needs rotation before launch | ⚠️ Week 1 |
| `bun.lock` vs `package-lock.json` collision — bun.lock deleted Week 0 | ✅ Resolved |
| Pre-existing TS issues in admin routes (`req.query.id` typing, OneSignal `tokenValue`, sql.lit) — not Phase 1 blockers | Touch when in file |

---

## 46. Risks + Open Questions

1. **Clerk + Express + Vite glue** — session-cookie handshake well-documented but not zero-config. +1 day buffer in Week 1.
2. **DALL-E 3 cost** if we re-enable agent 7 — Phase 2 question, not Phase 1.
3. **11 SVGs + fighter photos** — blocking Week 9 landing polish. Founder delivers.
4. **Founder Mexican tax + US LLC structure** — post-validation. Phase 1 ships on personal Stripe; LLC formation triggered when revenue is flowing. Document in ToS.
5. **Anthropic `claude-sonnet-4-6` model alias** — verified current; if renamed, update one line.
6. **Manual ingestion as launch strategy** — operator burden continues until Phase 2 agent re-enable. Acceptable per blueprint Phase 1 scope.
7. **Stripe API version `'2025-01-27.acacia'`** hardcoded in `stripeService.ts:14` — verify it exists when wiring Stripe Connect Week 5; bump if needed.

---

## 47. Next Step

Founder reviews this v2.0 SPEC. If approved, Week 1 starts: founder finishes provisioning sprint (Clerk → Upstash → Inngest → OneSignal → Resend → PostHog → Stripe Connect), Claudio runs Clerk auth cutover + `npm audit fix`.

---

*GRIT v6.1.2 build. Blueprint-first SPEC. Reconciled against verified code reality. Ready to execute.*
