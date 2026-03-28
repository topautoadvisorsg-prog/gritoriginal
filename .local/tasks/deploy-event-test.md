# Deploy, Create Event, Lock Cards, Full Test

## What & Why
The latest code is built and ready (API key auth + bio schema fix). Production needs to be redeployed, the UFC Fight Night: Adesanya vs. Pyfer event created with all 11 fight card bouts, picks locked, and the full pipeline validated end-to-end so the system is live and functional.

## Done looks like
- Production is running the latest build (API key auth active, bio field flowing)
- UFC Fight Night: Adesanya vs. Pyfer event exists in production with all 11 bouts on the card
- Event lock time is set and fight cards are closed (no new picks accepted)
- 30 pending pipeline fighter entries are rejected (bad data — gender/nationality/bio issues)
- All major routes verified: /event shows the card, fighters load, picks gate enforces lock
- No errors in production logs

## Out of scope
- Approving the 30 bad pipeline entries (must be re-pushed with corrected data first)
- Adding fighter images (manual process)
- User pick submission testing (requires authenticated users)

## Tasks
1. **Redeploy** — Trigger a production deployment to push the API key auth fallback and bio schema changes live.

2. **Create UFC Fight Night: Adesanya vs. Pyfer event** — Use the admin API to create the event with full metadata (date, venue, city, country, organization=UFC, status=OPEN). Set a lock time in the past or at card start to close picks.

3. **Add all 11 fight card bouts** — Wire each bout into the event with correct fighter IDs (from the 30 queued pipeline entries' data), weight class, card placement (Main Card / Prelim), and bout order. Fighters must exist in DB first — if the fighters table is still empty, create the fighters via admin before building the card.

4. **Lock the event** — Set event status to CLOSED or set lockTime to now so pick submission is blocked (HTTP 423).

5. **End-to-end verification** — Check production DB: event row exists, event_fights rows exist (11), fighters count matches. Hit /event in the UI, confirm card renders. Check logs for any errors.

## Relevant files
- `server/admin/routes/adminEventRoutes.ts`
- `server/admin/routes/adminFighterRoutes.ts`
- `server/api/webhooks/dataEngineWebhook.ts`
- `server/services/dataEngineService.ts`
- `shared/sync-schemas.ts`
- `server/production.ts`
