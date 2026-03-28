## Problem
Clicking a fight row in the event card does nothing. Users cannot navigate to the Fight Detail (Tale of the Tape) page from the fight card.

## Root Cause
`src/user/components/event/FightCard.tsx` line 146 navigates to:
```
/fight/${fight.id}
```
But the route in `App.tsx` is registered as:
```
path="event/fight/:fightId"   →  full path: /event/fight/:fightId
```
The missing `event/` prefix means the URL matches no registered route, so nothing happens. Compare with `EventListPage.tsx` which correctly uses `/event/fight/`.

## Fix
One-line change in `src/user/components/event/FightCard.tsx`:
```ts
// Before (line 146)
navigate(`/fight/${fight.id}`);

// After
navigate(`/event/fight/${fight.id}`);
```

## Files
- `src/user/components/event/FightCard.tsx` — only file that needs changing

## Done looks like
Clicking any fight card row navigates to `/event/fight/:fightId` and renders the FightDetail page with Tale of the Tape, fantasy pick section, and odds.
