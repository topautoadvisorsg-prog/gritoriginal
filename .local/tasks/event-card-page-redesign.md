## Goal
Redesign the Event Card Page to match the provided mockup (Mockup 1):
- Full-screen dark arena/spotlight atmosphere
- GRIT logo centered at top
- Event name as bold gold headline
- Date, time, venue row
- Live countdown timer (days/hours/minutes)
- Stats row: fight count + player count
- **Main Event hero card** — large dark card with fighter images side-by-side, "MAIN EVENT" badge, org logo, fighter names, "VIEW FIGHT" CTA button
- Below: fight rows with fighter headshots, names, fight label, click-through to Fight Detail

## Reference Mockups
- `@assets/WhatsApp_Image_2026-03-14_at_11.48.44_AM_(1)_1773514166847.jpeg` — Event Card page layout
- `@assets/WhatsApp_Image_2026-03-14_at_11.48.44_AM_1773514166849.jpeg` — Event Selector carousel

## Files to Edit
- `src/user/components/event/EventCardPage.tsx` — main layout overhaul
- `src/user/components/event/EventHeader.tsx` — restyle to match mockup (GRIT logo, headline, countdown)
- `src/user/components/event/FightCard.tsx` — restyle fight rows (fighter headshots + name + label)
- `src/user/components/event/FightCardSection.tsx` — adjust section rendering for the Main Event hero style

## Design Spec (from Mockup 1)

### Background
Dark full-page background with radial spotlight effect (2 spotlights from top-left and top-right angled inward), matching the arena atmosphere. Use CSS `radial-gradient` or an SVG overlay.

### Header area (top of page)
1. GRIT logo (text "GRIT" in gold serif + "GLOBAL MMA FANTASY LEAGUE" subtitle) — centered
2. Event name: all-caps, large bold gold text (e.g. `UFC 300: PEREIRA VS HILL`)
3. Subtitle row: `SAT, APR 13 | 7:00 PM PT` · `T-MOBILE ARENA, LAS VEGAS`
4. Countdown: `10D 04H 30M` in large clean numerals (already partially exists in EventHeader)
5. Stats row: `13 FIGHTS · 25K PLAYERS ENTERED` in small muted text

### Main Event Card
Large rounded dark card (with subtle inset arena image/gradient) containing:
- Top-left badge: `MAIN EVENT` in gold bordered pill
- Org logo centered (e.g. UFC 300 logo if available, otherwise org name text)
- Fighter images: two fighters facing each other (use existing fighter image URLs from fighter data)
- Fighter names: `ALEX PEREIRA vs JAMAHAL HILL` in large bold white, separated by a gold "vs"
- `VIEW FIGHT` button: gold bordered button centered at bottom

### Fight Row Cards (Co-Main and below)
Compact horizontal row cards with:
- Left: fighter 1 headshot (small circular)
- Center: `FIGHTER A vs FIGHTER B` in uppercase bold white, fight label below (CO-MAIN EVENT / BMF Title etc.)
- Right: fighter 2 headshot (small circular)
- Full row is clickable → navigate to `/event/fight/:fightId`
- No explicit "VIEW FIGHT" button on most rows (from mockup, only some show it)

### Typography/Colors
- Primary gold: `#C9A84C` or `hsl(var(--primary))`
- Text: white on dark
- Background: `#0a0a0f` or `hsl(var(--background))`
- Card backgrounds: `rgba(255,255,255,0.04)` with border `rgba(255,255,255,0.1)`

## Implementation Notes
- Fighter images: use the existing `fighterMap` from `useFighters()` to get headshots — same pattern as current code
- Player count: expose from `/api/picks/event/:eventId/count` or hardcode `--` until that endpoint exists
- Preserve existing `groupedFights` logic (Main Card, Preliminary, Pre-Prelims, Exhibition)
- The `EventHeader` component can be replaced entirely or gutted and rewritten in-place

## Done looks like
The event card page matches the dark arena aesthetic of Mockup 1, with a prominent Main Event hero card and clean fight rows below. Fight count is accurate. Clicking any fight row navigates to Fight Detail.
