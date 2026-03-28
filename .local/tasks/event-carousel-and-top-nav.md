## Goal
Two related changes to the Event Tab:

1. **Redesign the Event List as a single-center-card carousel** — one main event card fully visible at a time, with partial edge peeks of adjacent events (barely visible, Fortnite character-selection style). Arrow buttons and swipe shift the next event to center.

2. **Move the Events entry point to a top-level header dropdown** — accessible from any page without going to the sidebar.

## Reference Mockup
- `attached_assets/WhatsApp_Image_2026-03-14_at_11.48.44_AM_1773514166849.jpeg`

---

## Part 1 — Single-Center-Card Carousel

### Layout

The carousel container has `overflow: hidden`. Inside, all event cards are positioned in a horizontal track. At any moment:

- **Center card** (~380×480px): full opacity, flat/straight, fully visible
- **Left peek**: the right edge of the previous event card is barely visible (~50–60px) peeking in from the left edge of the container — enough to hint another event exists, not enough to read it
- **Right peek**: mirror of left, showing the left edge of the next event card

The container width is set so the peeks fall just outside the main display area. The center card takes up most of the visible space.

### Card Content (each card)
```
┌──────────────────────────────────┐
│  [Event Image background]        │
│  [Dark overlay]                  │
│                                  │
│  [Fighter A Photo] vs [Fighter B]│
│                                  │
│  Event Name                      │
│  Date · Time · Venue             │
│                                  │
│  [ ENTER DRAFT ]                 │
└──────────────────────────────────┘
```

- Fighter portraits: side by side, `object-fit: cover`, fixed container size
- Fighter names appear below their portrait or overlaid with gradient
- Dark gradient overlay on the background for text readability
- If fighter photo is missing: dark silhouette placeholder SVG (no broken image)
- Event name in bold white uppercase
- Date/time and venue in smaller muted text below
- "ENTER DRAFT" gold-bordered button at the bottom center

### Background
- `background-image: url(event.imageUrl)` with `background-size: cover`, `background-position: center`
- Dark overlay: `rgba(0,0,0,0.55)` or a gradient from transparent top to dark bottom
- Fallback when no imageUrl: dark radial gradient arena feel — never show empty or broken

### Navigation
- Left/right arrow buttons positioned on the edges of the carousel container
- Swipe: pointer/touch events — swipe left = next, swipe right = previous
- Clicking a side peek card shifts it to center (no page navigation)
- Clicking the center card OR pressing "ENTER DRAFT" navigates to `/event/:eventId`

### Animation
- Transition: `300ms ease-out` on `transform` and `opacity`
- When switching: cards slide horizontally into new positions, scale changes smoothly
- Center card hover (desktop only): `scale(1.02)` + subtle gold `box-shadow` glow
- Side peeks: no hover effects

### Data Behavior
- Fetch from `/api/events`
- Filter and prioritize **upcoming** events (status = 'Upcoming')
- Default selected index = first upcoming event (soonest date)
- If only one upcoming event: remains centered, side slots show most recent past event dimmed (opacity ~0.4) to hint at history
- If zero upcoming events: show most recent past event centered with a "Completed" badge

### Fighter Image Resolution
- For each event card, show the main event fighters (boutOrder = 1 or cardPlacement = 'Main Event')
- Look up fighter images from the existing `fighterMap` (via `useFighters()` hook)
- Fighter images: use `imageUrl` from the fighters table

---

## Part 2 — Top Header Event Navigation

### What changes
- Add an event selector dropdown to the `<Header>` component (shown on all pages)
- Dropdown lists all events (upcoming first, then past) — selecting one navigates to `/event/:eventId`
- Shows the currently-viewed event name as the selected label (or "Events" if not on an event page)
- Chevron-down icon opens it

### Sidebar
- Remove the "Event Card" item from `userNavItems` in `navigation.ts` — it's now accessible from the header dropdown on every page
- This keeps the sidebar uncluttered

---

## Files
- `src/user/components/event/EventListPage.tsx` — rewrite as single-center-card carousel
- `src/user/components/layout/Header.tsx` — add event dropdown
- `src/shared/config/navigation.ts` — remove event from sidebar userNavItems

## Dependencies
- Depends on Task #9 (routing — `/event/:eventId` route must exist)
- Depends on Task #12 (image upload — event.imageUrl field must exist in the DB)
- Task #10 (Event Card Page Redesign) should be complete so clicking ENTER DRAFT lands on the redesigned page

## Done looks like
- The Events tab shows one main event card centered, with partial peeks of adjacent events on each side
- Arrow buttons and swipe navigate between events
- Clicking ENTER DRAFT (or the center card) opens the Event Card page
- Header dropdown lets users jump to any event from any page
- No broken images — missing event images and missing fighter photos both have graceful fallbacks
