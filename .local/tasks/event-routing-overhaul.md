## Goal
Fix all event navigation routing so the full user flow works:
**Event List → Event Card → Fight Detail**

## Current Bugs
1. `App.tsx` has no `/event/:eventId` route. Clicking an event goes nowhere meaningful.
2. `EventListPage.tsx` lines 112 & 162 call `navigate(`/event/fight/${event.id}`)` — passes an *event* ID into the URL param that FightDetail expects as a *fight* ID. This is doubly wrong: wrong param and wrong destination.
3. `FightCard.tsx` line 146 calls `navigate(`/fight/${fight.id}`)` — missing the `event/` prefix (also tracked in Task #8, but should be included here to keep all routing work together).

## Changes Required

### `src/App.tsx`
Add a new route for the event card page, and import the required component:
```tsx
<Route path="event/:eventId" element={<EventCardRoute />} />
// Keep existing:
<Route path="event/fight/:fightId" element={<FightDetail />} />
```
Route ordering matters — the static segment `event/fight` must come before the dynamic `event/:eventId` (React Router matches top-to-bottom for sibling routes).

### New file: `src/pages/EventCardRoute.tsx`
A thin container that:
- Reads `:eventId` from `useParams`
- Fetches `/api/events/:eventId` (or filters from `/api/events` — check which endpoint exists)
- Passes the loaded event to `<EventCardPage>`
- Shows a loading spinner and 404 state

### `src/user/components/event/EventListPage.tsx`
Change both navigate calls from:
```ts
navigate(`/event/fight/${event.id}`)
```
to:
```ts
navigate(`/event/${event.id}`)
```

### `src/user/components/event/FightCard.tsx`
Change line 146 from:
```ts
navigate(`/fight/${fight.id}`)
```
to:
```ts
navigate(`/event/fight/${fight.id}`)
```

### Backend check
Verify that `GET /api/events/:eventId` (single event with fights) exists in `server/user/routes/`. If not, add it — EventCardRoute needs to load one event by ID including its `event_fights`.

## Files
- `src/App.tsx`
- `src/pages/EventCardRoute.tsx` (new)
- `src/user/components/event/EventListPage.tsx`
- `src/user/components/event/FightCard.tsx`
- `server/user/routes/eventRoutes.ts` (or equivalent — check if single-event endpoint exists)

## Done looks like
- Clicking an event card in the Event List navigates to `/event/:eventId` and shows that event's full fight card.
- Clicking a fight row in the event card navigates to `/event/fight/:fightId` and opens Fight Detail.
- No dead-end navigations remain.
