# Adesanya vs Pyfer End-to-End Pipeline Test

## What & Why
Run a full live integration test using the upcoming Adesanya vs. Joe Pyfer card to verify every layer of the data pipeline works correctly end-to-end: webhook ingest → admin review → apply to DB → outbound Supabase sync. This test validates the entire bidirectional sync architecture under realistic conditions and surfaces any data field gaps before live usage.

The test covers all 6 stages from the audit checklist: event scanning, fighter data, fight history, image/data enrichment stubs, webhook push, and main app update.

## Done looks like
- A complete test event ("UFC Fight Night: Adesanya vs Pyfer" or the actual real event name) is pushed through the webhook endpoint with fighter profiles and fight card data for both fighters.
- The admin pipeline UI shows the inbound entries as pending; admin reviews and approves each entry.
- Entries are applied — fighters, fight history stubs, and the event land in the Neon DB.
- The outbound Supabase sync fires and the data is visible in the data engine's Supabase instance.
- A written test report documents: which fields populated correctly, which were null/missing, any errors during ingest or sync, and recommendations for the data engine team.
- The test event and test fighters are clearly marked (e.g., `adminNotes: "E2E-TEST"`) so they can be identified and cleaned up after the test.

## Out of scope
- Real image generation (NanoBanana) — stubs or placeholder image URLs are used.
- Real fight result data — this is pre-fight so results are empty/null.
- Load testing or concurrent webhook pushes.
- Changes to the data schema.

## Tasks
1. **Prepare test payloads** — Build the webhook payloads for: (a) two fighter `create` entries (Adesanya and Pyfer, with all available public data populated), (b) one event `create` entry for the card, and (c) one or more `fight` entries linking the fighters to the event.

2. **Push via webhook** — POST the payloads to the webhook endpoint (`/api/webhooks/data-engine/webhook`) with the correct auth header. Capture the response and log any validation errors.

3. **Admin review + apply** — Walk through the admin Data Pipeline tab, review each pending entry, check for correct field mapping, and apply them all to the database. Note any fields that arrived null or malformed.

4. **Supabase sync verification** — After applying, read from the data engine's Supabase REST API to confirm the outbound sync fired and the records appear there with accurate data.

5. **Write test report** — Document the full results: which fields populated, which were missing, any errors or warnings from the pipeline logs, and specific recommendations for the data engine team on improving payload completeness.

6. **Cleanup** — Mark or delete the test data entries from Neon DB after the test is verified complete, to leave the database clean for production use.

## Relevant files
- `server/api/webhooks/dataEngineWebhook.ts`
- `shared/sync-schemas.ts`
- `server/services/dataEngineService.ts`
- `server/services/outboundSyncService.ts`
- `server/admin/routes/adminDataPipelineRoutes.ts`
- `replit.md`
