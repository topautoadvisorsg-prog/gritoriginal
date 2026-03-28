# GRIT — System Audit Report
**Date:** 2026-03-24  
**Scope:** Full codebase verified against actual code. No assumptions.

---

## 1. CURRENT STATE VERIFICATION

```json
{
  "what_matches_readme": [
    "Replit OIDC + Passport.js auth — fully live",
    "Fighter profile UI exists at /fighter/:id (FighterProfilePage.tsx)",
    "Per-event badge/star progression — implemented in progressionService.ts",
    "Scoring engine — canonical path is POST /api/fights/:fightId/result (atomic transaction)",
    "Clean Sweep / Prestige Key detection — implemented",
    "Raffle system — fully implemented",
    "Confidence flag system — implemented",
    "Data Engine webhook — POST /api/webhooks/data-engine/webhook EXISTS",
    "DATA_ENGINE_AUTO_APPLY — config key checked in webhook handler",
    "eventFights[] insertion — upserted in applyEntry()",
    "Leaderboard snapshots — implemented",
    "Chat + moderation — implemented",
    "Admin routes protected by isAuthenticated + requireAdmin"
  ],
  "what_is_outdated": [
    "README Auth table said 'designed for future Supabase migration' — FIXED: Replit OIDC is the final auth system",
    "README API table listed POST /api/fighters/bulk as 'None ⚠️' — FIXED: admin-protected",
    "README API table listed event PUT/DELETE as 'None ⚠️' — FIXED: all event writes in admin routes with full guards",
    "README Badge diagram labeled 'CURRENT: Monthly' — FIXED: runs per-event since progressionService.ts change",
    "Known Tech Debt listed 'Progression Timing: Change from monthly to per-event' — FIXED: already done",
    "Data Engine Pipeline listed in 'Not Yet Implemented' — FIXED: fully implemented",
    "README did not document outbound sync system (push to external Supabase) — NOW DOCUMENTED"
  ],
  "what_is_missing": [
    "Deduplication secondary check — name-only match, no record/weight-class fallback",
    "Retry mechanism for failed pipeline entries",
    "'UNKNOWN' enforcement for missing fields — not validated in schema, relies on Data Engine",
    "Source SOP (UFC→Tapology→Sherdog priority) — Data Engine concern, not enforced in main app",
    "Fighter profile: missing field highlights + per-field source attribution — UI shows all data but does not call out gaps",
    "AI-generated fighter portraits — manual upload only",
    "Image dimension enforcement — no 512x512 / 512x1024 constraints in upload code"
  ],
  "what_is_broken": [
    "scoreEventPicks() in storage/picks.ts — deprecated and logs a warning on call, but still wired. Should be removed entirely to prevent accidental invocation."
  ]
}
```

---

## 2. DATA ENGINE — CHECKS

### A. Pipeline Lifecycle
**Status: ✅ CONFIRMED**

States: `pending → approved → applied / failed`  
Note: state names differ slightly from the spec (`queued/processing`) but are functionally identical.  
Every entry is logged in `data_pipeline` table regardless of auto-apply mode.

### B. Source SOP Enforcement (UFC → Tapology → Sherdog)
**Status: ❌ NOT ENFORCED IN MAIN APP**

The main app is a receiver. Source priority is a Data Engine pipeline responsibility. No source field is prioritized on the main app side — this is correct by design.

### C. Deduplication
**Status: ⚠️ PARTIAL**

What exists: `firstName + lastName` exact match on `create` actions in `submitToPipeline()`  
What's missing: name normalization (case, spacing), secondary match (weight class or record)  

Risk: fighters with the same name bypass detection if spelled differently; same name with different weight class incorrectly flagged.

**Proposed minimum viable fix:**
1. Normalize names: `toLowerCase().trim()` before comparison
2. If name match found, compare `weightClass` as a secondary signal
3. Flag `isPotentialDuplicate = true` without blocking — admin confirms in pipeline review

### D. AI Handling
**Status: ✅ CONFIRMED**

- Zod validation runs before any DB insert (`syncFighterSchema`, `syncEventSchema`, etc.)
- Invalid payloads return 422 with structured error details
- Failed auto-apply falls back to `pending` status — no silent data loss
- JSON output enforced via Zod schema parse

### E. Image System
**Status: ⚠️ PARTIAL**

```json
{
  "image_pipeline_status": "partial",
  "image_source": "manual upload only (no AI generation)",
  "formats_correct": false,
  "issues": [
    "Format is JPG not PNG",
    "No dimension enforcement (512x512 / 512x1024 not validated in upload route)",
    "No AI portrait generation — roadmap item only",
    "Background removal not implemented",
    "Upload is correctly admin-gated (isAuthenticated + requireAdmin)"
  ]
}
```

### F. Fighter Profile UI
**Status: ✅ EXISTS**

- Route: `/fighter/:id` → `src/user/FighterProfilePage.tsx`
- Shows: fighter stats, record, fight history, images
- Missing: per-field source attribution, missing-field highlights, confidence indicator

---

## 3. MAIN APP — CHECKS

### A. Webhook
**Status: ✅ CONFIRMED**

- Endpoint: `POST /api/webhooks/data-engine/webhook`
- File: `server/api/webhooks/dataEngineWebhook.ts`
- Auth: `X-Data-Engine-Api-Key` header checked against `DATA_ENGINE_API_KEY` config key

### B. Auto-Apply
**Status: ✅ CONFIRMED**

- Config key: `DATA_ENGINE_AUTO_APPLY` (stored in `data_engine_config` table)
- When `"true"`: entry approved + applied immediately, falls back to `pending` on apply error

### C. eventFights[] Insertion
**Status: ✅ CONFIRMED**

`applyEntry()` in `dataEngineService.ts` upserts `eventFights[]` when `sourceType = event`  
Upsert key: `fighter1Id + fighter2Id + eventId`

### D. Security
**Status: ✅ ALL WRITE ROUTES PROTECTED**

| Route group | Guard |
|-------------|-------|
| Fighter CRUD | `isAuthenticated + requireAdmin` |
| Event CRUD | `isAuthenticated + requireAdmin` |
| Fighter image upload/confirm | `isAuthenticated + requireAdmin` |
| Fight result entry | `isAuthenticated + requireAdmin` |
| User-facing fighter/event routes | GET only — no unprotected writes |

### E. Scoring System
**Status: ✅ ONE CANONICAL PATH — with one deprecated ghost**

- **Canonical:** `POST /api/fights/:fightId/result` in `adminFightResolutionRoutes.ts`
- **Deprecated ghost:** `storage.scoreEventPicks()` exists, is wired via `storage/index.ts`, logs a deprecation warning. Not called by any active route — but should be deleted.

---

## 4. IMAGE PIPELINE STATUS

```json
{
  "image_pipeline_status": "partial",
  "image_source": "manual upload only",
  "formats_correct": false,
  "issues": [
    "JPG format used, not PNG",
    "No dimension constraints (512x512 / 512x1024) enforced on upload",
    "No AI image generation exists",
    "Background removal not implemented",
    "Upload correctly admin-gated"
  ]
}
```

---

## 5. BLOCKERS

```json
{
  "blockers": [
    {
      "id": "B1",
      "title": "Weak duplicate detection",
      "detail": "Name-only match with no normalization or secondary signal. Risk of false positives and false negatives.",
      "fix": "Normalize names (lowercase + trim) + add weight-class secondary check before flagging isPotentialDuplicate"
    },
    {
      "id": "B2",
      "title": "No pipeline retry mechanism",
      "detail": "Failed entries sit in 'failed' status indefinitely. Admin must manually re-trigger apply.",
      "fix": "Add retry_count column + cron job that re-attempts failed entries up to 3 times with backoff"
    },
    {
      "id": "B3",
      "title": "scoreEventPicks() deprecated ghost",
      "detail": "Still wired in storage index. Future dev could accidentally call it, introducing a parallel scoring path.",
      "fix": "Remove function from picks.ts and unbind from storage/index.ts"
    }
  ]
}
```

---

## 6. FINAL STATUS SUMMARY

```json
{
  "data_engine_status": "operational",
  "main_app_status": "ready",
  "integration_status": "connected — webhook live, auto-apply configurable",
  "ready_for_live_pipeline": true,
  "blocking_reasons": [],
  "non_blocking_gaps": [
    "AI portrait generation not integrated (admin manual-upload only)"
  ]
}
```

---

## 7. PRIORITY FIX LIST — COMPLETED

| # | Fix | Status | Notes |
|---|-----|--------|-------|
| B1 | Normalize fighter names + weight-class secondary dedup | ✅ Done | toLowerCase/trim + weightClass secondary signal in `dataEngineService.ts` |
| B2 | Retry count + cron retry for failed pipeline entries | ✅ Done | `retryCount`/`lastRetryAt` schema cols, `retryFailedEntries()`, cron every 30 min, `POST /api/admin/pipeline/retry-failed` |
| B3 | Remove `scoreEventPicks()` ghost | ✅ Done | Fully removed from `picks.ts` and `storage/index.ts` |
| — | Integration health endpoint | ✅ Done | `GET /api/admin/pipeline/health` — returns pipeline stats + DB counts |
| — | Image aspect ratio enforcement | ✅ Done | 1:1 face / 2:3 body validated via `image-size` at confirm; invalid files deleted |
| — | Fighter data completeness panel | ✅ Done | `DataCompletenessPanel` in `FighterProfile.tsx` — % bar, critical-missing alerts, field chips |
