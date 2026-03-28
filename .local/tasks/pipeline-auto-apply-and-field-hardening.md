# Pipeline Auto-Apply, Field Hardening & E2E Validation

## What & Why

The webhook endpoint already exists and passes auth, but three gaps prevent the pipeline from being fully operational:

1. **No auto-apply mode** — every incoming Data Engine push sits in the admin review queue waiting for manual approval before touching the DB. The user needs "automatic" flow: trusted Data Engine pushes are approved and applied immediately without human intervention.

2. **Schema strictness causes 422 rejections** — several fields marked required in the Zod schemas may not always be sent by the Data Engine (e.g. `stance` on fighters, `lockTime` on events, `fightDurationSeconds` on fights). These cause `422 Unprocessable Entity` and silently drop valid data.

3. **Event fights are not created from event payloads** — `applyEventData` extracts the embedded `eventFights` array from an event push but discards it without inserting any fight matchups. Adesanya vs Pyfer fight cards will never appear in the DB from event pushes.

## Done looks like

- A new `DATA_ENGINE_AUTO_APPLY` key is readable/writable in Admin → System Settings alongside the existing keys; when set to `"true"`, incoming webhook payloads are automatically approved and applied to production tables without admin review (the entry still lands in `data_pipeline` but with `status: 'applied'` immediately).
- A complete fighter push (including `imageUrl` but no `stance`) returns HTTP 201 and creates/updates the fighter in DB.
- A complete event push that includes an `eventFights` array creates the event AND the fight matchups in `event_fights` table.
- An Adesanya vs Pyfer full test push (event + fighters + fights) completes end-to-end: webhook → DB → outbound Supabase sync — verified with HTTP 201 responses and confirmed rows in the DB.
- No 422 errors for payloads that omit `stance`, `lockTime`, or `fightDurationSeconds`.

## Out of scope

- Changing the admin approval UI for the manual review flow (it stays as-is for non-auto-apply mode).
- Building a new admin toggle UI for `DATA_ENGINE_AUTO_APPLY` (writing the config key directly via the existing pipeline config endpoint is sufficient for now).
- Fight result finalization via webhook (results come through the existing fight resolution route).

## Tasks

1. **Auto-apply mode in webhook** — Read `DATA_ENGINE_AUTO_APPLY` from `data_engine_config` after each successful `submitToPipeline()` call. If it equals `"true"`, immediately call `approveEntry()` + `applyEntry()` on the newly created pipeline entry and return HTTP 200 (applied) instead of 201 (queued).

2. **Schema relaxation for optional fields** — In `shared/sync-schemas.ts`: make `stance` optional in `syncFighterSchema`; make `lockTime` optional in `syncEventSchema`; change `fightDurationSeconds` from `.positive()` to `.nonnegative()` and make it optional; make `boutOrder` optional with a sensible default.

3. **Event fights creation from event payload** — In `applyEventData()`, after the event is created/updated, iterate over the extracted `eventFights` array (if present) and upsert each fight into the `event_fights` table. Each fight must have `eventId` bound to the just-created/updated event. Add `event_fight` validation schema to `sync-schemas.ts` for the embedded fight objects (fighter IDs, weight class, card placement, rounds, bout order).

4. **E2E push validation** — Using curl or a test script, push a complete Adesanya vs Pyfer payload through the live webhook (event + 10 fighters + 5 fights), verify HTTP 200/201 responses, and confirm the data lands in the GRIT DB. Log any field mismatches as inline comments in the webhook handler.

## Relevant files

- `server/api/webhooks/dataEngineWebhook.ts`
- `server/services/dataEngineService.ts:174-284`
- `shared/sync-schemas.ts`
- `server/services/outboundSyncService.ts`
- `shared/schema.ts`
