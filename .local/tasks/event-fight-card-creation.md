# Event & Fight Card Creation — Full Implementation

## What & Why

Five interconnected improvements to the admin event creation and fight card workflow. The most critical is a routing bug that makes event creation completely broken. The rest are UX improvements for speed and correctness.

### Root cause of "Unexpected token is not valid JSON"

The Vite proxy routes:
- `/api/admin/*` → admin-server (port 3002)
- `/api/*` → user-server (port 3001)

All admin write routes for events are registered in `adminEventRoutes.ts` on the admin-server, but their paths use `/api/events` (not `/api/admin/events`). The frontend posts to `/api/events`, which routes to the user-server — which only has GET handlers. Express returns a 404 HTML page; `response.json()` throws "Unexpected token is not valid JSON."

The same mismatch breaks `AdminEventEditor.tsx`: its PUT/DELETE calls to `/api/events/:id` also hit the user-server (no handler), silently failing.

Fix: Move all admin event write routes to `/api/admin/events/*` and update both frontend files.

Additionally, `CreateEvent.tsx` posts without `credentials: 'include'`, so even if routing were correct the session cookie would be dropped.

## Done looks like

- Creating an event from the admin panel saves to the database and persists on refresh
- Editing and deleting events and fights in `AdminEventEditor` works correctly
- Fights appear on the card in the order they were assigned (boutOrder)
- Admin can reorder fights on the card using up/down controls
- Each fight has a scheduled start time; prelim fights default to 1:00 PM PST and are auto-spaced; admin can override
- Location fields (city, state, country) are dropdowns with common MMA venues pre-populated; free-text entry still allowed for unlisted venues
- No manual typing required for repeated common locations (Las Vegas/Nevada/USA, Miami/Florida/USA, etc.)

## Out of scope

- Drag-and-drop reordering (up/down buttons are sufficient)
- Persisting custom locations to the database for future reuse
- Time zone conversion UI (store as plain string, display as entered)
- Public user-facing fight schedule display (admin creation only)

## Tasks

1. **Fix admin event write routes** — In `adminEventRoutes.ts`, rename all write-path handlers from `/api/events/*` to `/api/admin/events/*` (POST, PUT, DELETE, status, fight-level PUT/DELETE). Leave user-server GET routes at `/api/events` unchanged. The admin-server already listens on all paths, so no proxy config change is needed.

2. **Fix CreateEvent.tsx API calls and auth** — Update the POST url from `/api/events` to `/api/admin/events`. Add `credentials: 'include'` to the fetch call (match the pattern in `AdminEventEditor.tsx`'s `fetchWithAuth`).

3. **Fix AdminEventEditor.tsx API calls** — Update all mutation fetch calls from `/api/events/:id*` to `/api/admin/events/:id*`. Query invalidation keys (which drive GET fetches) stay at `/api/events` since those still go to user-server.

4. **Add fight scheduling (scheduledTime column + UI)** — Add `scheduledTime: varchar("scheduled_time", { length: 20 })` to `eventFights` table in `shared/schema.ts`, then run `npm run db:push` to sync the DB. In `CreateEvent.tsx`, add a "Scheduled Time" field for each fight. Default: first Preliminary fight = "1:00 PM PST", each subsequent fight = prior fight time + 25 min. Main Card starts at "7:00 PM PST". Admin can manually override any time. Pass `scheduledTime` through the bulk create payload and store it in the route handler.

5. **Add fight order controls** — In `CreateEvent.tsx`, add move-up / move-down icon buttons next to each fight row in the fight card list. Clicking up/down swaps that fight's `boutOrder` with its neighbor. Fights display sorted by `boutOrder`.

6. **Add location dropdowns** — Replace city, state, and country text `Input` fields in `CreateEvent.tsx` with a `Combobox`-style select that shows preset options but also allows free-text entry for unlisted values. Presets: cities (Las Vegas, Miami, Los Angeles, Houston, New York, Abu Dhabi, London, Singapore), states (Nevada, Florida, California, Texas, New York), countries (USA, Mexico, UAE, UK, Singapore, Brazil, Canada). Also update `AdminEventEditor.tsx` to use the same dropdown component for its location fields.

## Relevant files

- `server/admin/routes/adminEventRoutes.ts`
- `server/user/routes/eventRoutes.ts`
- `src/admin/components/CreateEvent.tsx`
- `src/admin/components/AdminEventEditor.tsx`
- `shared/schema.ts:171-210` (eventFights table definition)
- `server/storage/event.ts`
