# Week 2 Migration Review — Founder Approval Sheet

**File:** `migrations/0001_week2_creator_token_rating_antifraud.sql`
**Reviewed:** 2026-05-23 by Claudio
**Verdict:** ✅ SAFE TO APPLY

---

## What It Does

Creates 13 new tables. **Zero destructive operations** (no DROP, no TRUNCATE, no data mutation). Pure additive.

| Table | Purpose | Blueprint § |
|---|---|---|
| `token_packs` | Admin-configurable AI token packs ($5/$10/$20) | §18 |
| `token_balances` | Per-user token state + freeze flag | §18, §22 |
| `token_transactions` | Append-only ledger (purchase/spend/refund/freeze/promo) | §18, §21 |
| `token_feature_costs` | Admin-configurable cost per AI feature | §18, §19 |
| `creator_profiles` | Free vs Paid creator state + Stripe Connect tracking | §4, §24 |
| `creator_subscriptions` | User→creator subscriptions | §4, §25 |
| `creator_donations` | One-time donations (95/5 split, non-refundable) | §4, §21 |
| `chat_sessions` | 1-on-1 paid creator chat bookings (escrow + no-show flag) | §4 |
| `fighter_ratings` | Per-user 5-criteria ratings during fights | §9 |
| `device_fingerprints` | Anti-fraud detection log (FingerprintJS + Stripe + IP) | §30 |
| `multi_account_flags` | Sockpuppet flags for admin review | §30 |
| `founder_badge_slots` | Atomic allocation for 10/50/500/1000 slots | §8 |
| `legal_acceptances` | Per-user record of ToS/Privacy/Cookie/Creator/AUP acceptance | §32 |

---

## Safety Checks

| Check | Result |
|---|---|
| Any DROP statements? | ❌ None |
| Any TRUNCATE? | ❌ None |
| Any data mutation (UPDATE/DELETE)? | ❌ None |
| Existing tables modified? | ❌ None |
| FK violations possible on current data? | ❌ No — `users` table currently has 0 rows |
| Backwards compatible? | ✅ Yes — old code paths untouched |
| Reversible? | ✅ Yes — 13 `DROP TABLE` statements would undo it |

---

## Foreign Key Design Decisions

| FK | Behavior | Why |
|---|---|---|
| All user FKs (most tables) | `ON DELETE CASCADE` | If user deletes account, their token/creator/rating data goes too (GDPR-clean) |
| `creator_donations.donor_id` | `ON DELETE SET NULL` | Preserve donation history if donor account deletes (creator earnings stay) |
| `multi_account_flags.reviewed_by` | `ON DELETE NO ACTION` | Admin who reviewed shouldn't be deletable while flags reference them |
| `token_transactions.pack_id → token_packs` | `ON DELETE NO ACTION` | Pack history must survive even if pack is removed from sale |
| `fighter_ratings.fighter_id → fighters` | `ON DELETE CASCADE` | If fighter is purged from DB, ratings go too |

All reasonable.

---

## Unique Constraints That Enforce Blueprint Rules

| Index | Enforces |
|---|---|
| `founder_tier_slot_idx UNIQUE(tier, slot_number)` | Atomic Founder badge slot allocation (no two users claim same slot) — Blueprint §8 critical |
| `founder_user_tier_idx UNIQUE(user_id, tier)` | A user can't hold two slots of the same Founder tier |
| `creator_sub_unique_idx UNIQUE(subscriber_id, creator_id)` | A subscriber can't subscribe twice to same creator |
| `rating_user_fighter_fight_idx UNIQUE(user_id, fighter_id, fight_id)` | One rating per user per fighter per fight — Blueprint §9 rule |
| `ma_flag_unique_idx UNIQUE(user_id, linked_user_id, match_type)` | Idempotent flag detection |
| `token_packs_code_unique` | Admin can't create two packs with same code |
| `token_feature_costs_feature_code_unique` | Admin can't create two cost rules for same feature |

---

## Performance Indexes

Added indexes match expected query patterns:
- `payout_user_year_idx` — 1099-NEC batch queries
- `chat_session_*_idx` — booker + creator dashboards
- `creator_sub_creator_idx` — creator's subscriber list
- `fp_*_idx` (4 indexes) — multi-account detection lookups
- `rating_fighter_idx` — community aggregate computation
- `token_tx_user_idx` — user transaction history

No missing indexes that I can see.

---

## How To Apply (When You're Ready)

```bash
cd C:\Users\jovan\Downloads\gritapp
npx drizzle-kit migrate
```

That's it. Drizzle reads `migrations/_journal.json`, sees `0001_week2_*` is unapplied, runs the SQL, marks it applied. Takes <5 seconds.

## After Applying

These will go from dormant to LIVE:
- Monthly bonus draw service (already drafted by Cody)
- Founder badge atomic allocation service (already drafted by Cody)
- Token economy can be built (Week 5)
- Creator economy can be built (Week 6)
- Legal acceptance recording (already wired in onboarding)

## Risk Assessment

**Risk: LOW.**

- All-or-nothing transaction (Drizzle wraps in BEGIN/COMMIT)
- Zero existing data affected (52 tables stay intact, just adds 13 more = 65 total after)
- Rollback = drop the 13 new tables (none have dependencies from outside the new set)
- All code paths that USE these tables are either dormant or feature-flagged off until you wire them in

**Worst case scenario:** migration fails partway → Postgres rolls back the transaction → DB stays at 52 tables → you fix the SQL and retry. No data loss possible.

---

**Bottom line:** ✅ Safe to approve. Run `npx drizzle-kit migrate` when ready.
