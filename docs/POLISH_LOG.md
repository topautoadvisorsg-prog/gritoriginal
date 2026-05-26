# GRIT — Polish Log

Comprehensive record of the UI/UX polish work shipped on 2026-05-26.
**22 commits total.** Landing rebuilt + entire in-app design system branded.

---

## Quick reference — what's branded

Every Radix/shadcn primitive in `src/shared/components/ui/` has been
re-skinned to share one visual language. Use them anywhere — they're
all wired into the GRIT design system.

| Primitive | Status | What changed |
|-----------|--------|--------------|
| Button | ✅ | active scale, focus ring (existing was good) |
| Input | ✅ | inset shadow, cyan focus ring + 3px glow |
| Textarea | ✅ | matches Input, resize-y only |
| Select | ✅ | branded trigger + glass panel + cyan item focus |
| DropdownMenu | ✅ | glass panel + cyan focus tint |
| Tooltip | ✅ | dark glass with backdrop-blur |
| Tabs | ✅ | pressed-in list + cyan top accent on active |
| Dialog | ✅ | glass content + branded close button + display-font title |
| Sheet | ✅ | glass drawer + branded close |
| AlertDialog | ✅ | glass confirm + same shadow stack |
| Popover | ✅ | glass panel + 1px inner highlight |
| Toast (sonner) | ✅ | glass surface + left-border per variant |
| Skeleton | ✅ | branded diagonal shimmer (replaced animate-pulse) |
| Badge | ✅ | **7 semantic variants** — default/secondary/destructive/outline/success/info/premium |
| Card | ✅ | glass-card depth + display-font italic title |
| Switch | ✅ | gold gradient checked, inset unchecked |
| Checkbox | ✅ | cyan glow on check, inset unchecked |
| Progress | ✅ | slimmer h-2, gold gradient fill with glow |
| Avatar | ✅ | 1px ring + small shadow + gradient fallback |
| **EmptyState** | ✅ NEW | 3 variants (default/compact/card) |
| **Spinner** | ✅ NEW | conic-gradient ring, branded gold |
| **DashboardSkeleton** | ✅ NEW | mirror-layout skeleton for dashboard load |

---

## Design tokens (final, coherent)

```
Glass surface:    bg-card/95 + backdrop-blur-xl
Shadow stack:     0 12-24px 40-80px black + 1px inset white highlight
Focus accent:     cyan (hsl 190 90% 55%)
Brand accent:     gold (hsl 38 92% 55%)
Border:           border-border/60
Panel radius:     xl (12px)
Trigger radius:   lg (8px)
Item radius:      md (6px)
Selection:        red wash (hsl 355 85% 55% / .35)
```

---

## Foundation polish (app-wide, in `src/index.css`)

- Smooth scroll + `scroll-padding-top: 80px` so anchors clear fixed headers
- Branded text selection
- Branded focus ring on every `:focus-visible` interactive element
- Custom dark scrollbars (10px wide, raised thumb)
- Universal button press feedback (`button:active`)
- `prefers-reduced-motion` respect across all animations
- Page-transition fade (every route change does a 280ms fade + 6px slide)
- Glass-card depth (inner highlight + layered shadow on every `.glass-card`)
- `.glass-card-interactive` modifier for hover-lift cards

---

## Landing page work (5 commits)

1. **Hero rebuild** — killed pulsing radial blobs, scan line, 3 spinning octagons.
   Replaced with cinematic vignette + film grain + cinematic bottom fade.
2. **Section pass 2** — ticker pause-on-hover + edge fades; pricing token packs
   refactored from inline styles; core features per-tile accent hover.
3. **Section pass 3** — How It Works step numbers rebuilt premium;
   Leaderboard row accent bar hover + #1 gold wash; Footer CTA glow refined.
4. **Section pass 4** — Event Picks confidence units + lock button polish;
   Founder Badges full refactor with scarcity-bar visualization.
5. **Section pass 5** — Creator Economy purple-accent card grid;
   AI Arena killed inline TEAL constants, proper featured modifier + LEADING badge.

---

## In-app work (10 commits)

1. **App-wide foundation** (`src/index.css`) — listed above
2. **Hover fixes** — TopTabNavigation inactive hover preview, RankingRow lift,
   `hover-grow` typo fix on Dashboard
3. **Branded skeleton loaders** — Skeleton shimmer + DashboardSkeleton +
   EventListPage skeleton grid
4. **EmptyState + toast + form input** — created EmptyState, branded sonner
   with left-border accents, refined Input/Textarea
5. **EmptyState sweep + Spinner** — converted 4 more screens, created Spinner
6. **EmptyState across 5 more surfaces** — MyStatsTab, SlipPicker, FighterTagsSection,
   FighterNotes, BettingOdds
7. **Dialog/Sheet/Popover/AlertDialog** — overlay backdrop blur, glass content,
   branded close buttons, display-font titles
8. **Tabs/Tooltip/Select/DropdownMenu** — coherent surface + focus + radius across all
9. **Badge/Card/Switch/Checkbox/Progress/Avatar** — final primitive sweep
10. **Spacing pass** — fixed flanker bleed (the "two fighters" issue), normalized
    section vertical padding to 120px across all sections

---

## Verification

- `npx tsc --noEmit` — clean
- `npx vitest run` — **90/90 tests pass**
- `npm run build` — succeeds (~15s, ~230KB CSS, ~3.3MB JS gzipped to 740KB)
- No new TODOs in polished code paths

---

## How to use the new system in new code

**Need a loading state?**
- Full-page or full-section → use `<DashboardSkeleton />` pattern or build a skeleton
- Inline / button busy → `<Spinner size="sm|md|lg" label="optional" />`
- Icon-only old style → keep `<Loader2 />` but prefer above

**Need an empty state?**
```tsx
import { EmptyState } from '@/shared/components/ui/empty-state';
import { Trophy } from 'lucide-react';

<EmptyState
  icon={Trophy}
  title="No data yet"
  description="Helpful next-step copy here."
  // optional: variant="compact" | "card"
  // optional: action={<Button>Do thing</Button>}
/>
```

**Need a card?**
```tsx
// Static card
<Card>...</Card>

// Or for inline glass surface
<div className="glass-card rounded-2xl p-6">...</div>

// Card that's clickable / navigable
<div className="glass-card-interactive rounded-2xl p-6">...</div>
```

**Need a badge?** Use semantic variant:
```tsx
<Badge variant="success">Won</Badge>
<Badge variant="info">Live</Badge>
<Badge variant="premium">Challenger</Badge>
<Badge variant="destructive">Expired</Badge>
```

---

## Known minor inconsistencies (not blockers)

- **Border radius scale** is wide (4/6/8/10/12/14/16/20/22/100px). A future
  pass could normalize to a 4/8/12/16/24 scale, but every change risks
  breaking layout — left untouched on this pass.
- **Bundle size** — main JS chunk is 3.3MB (740KB gzipped). Vite warns at
  500KB. Code-splitting via `React.lazy()` on route boundaries would
  reduce initial load. Not urgent for a Phase 1 launch.
- Old admin/management screens haven't gone through the same polish — they
  inherit primitive improvements but the layouts are still default-shadcn.

---

## Files added today

- `src/shared/components/ui/empty-state.tsx` (NEW)
- `src/shared/components/ui/spinner.tsx` (NEW)
- `src/user/components/dashboard/DashboardSkeleton.tsx` (NEW)
- `docs/POLISH_LOG.md` (this file)

---

## Files changed today

**Landing (15 files):**
- `src/user/pages/LandingPage.css` (the big one — 5000+ lines, hundreds of changes)
- `src/user/pages/landing/HeroSection.tsx`
- `src/user/pages/landing/Navbar.tsx`
- `src/user/pages/landing/CoreFeaturesSection.tsx`
- `src/user/pages/landing/AICompetitionSection.tsx`
- `src/user/pages/landing/PricingSection.tsx`
- `src/user/pages/landing/FooterCTA.tsx`
- `src/user/pages/landing/FounderBadgesSection.tsx`
- `src/user/pages/landing/CreatorEconomySection.tsx`
- `src/user/pages/landing/ShowcaseSections.tsx`
- `public/locales/en/translation.json` (creator splits scrubbed)
- `public/fighters/fighter-1.png` through `fighter-6.png` (NEW)

**In-app (15 files):**
- `src/index.css` (foundation block)
- `src/user/pages/Index.tsx` (page-fade wrapper)
- `src/user/components/layout/TopTabNavigation.tsx`
- `src/user/components/rankings/RankingRow.tsx`
- `src/user/components/rankings/MMAMetricsRankings.tsx`
- `src/user/components/dashboard/Dashboard.tsx`
- `src/user/components/dashboard/BettingTrackerWidget.tsx`
- `src/user/components/event/EventListPage.tsx`
- `src/user/components/news/NewsPage.tsx`
- `src/user/components/chat/SlipWall.tsx`
- `src/user/components/chat/SlipPicker.tsx`
- `src/user/components/fighter/FighterIndex.tsx`
- `src/user/components/fighter/FighterNotes.tsx`
- `src/user/components/fighter/BettingOdds.tsx`
- `src/user/components/tags/FighterTagsSection.tsx`
- `src/user/components/settings/MyStatsTab.tsx`

**Primitives (all of `src/shared/components/ui/`):**
- button, input, textarea, select, dropdown-menu, tooltip, tabs
- dialog, sheet, alert-dialog, popover, sonner, skeleton
- badge, card, switch, checkbox, progress, avatar

---

## Where to go from here

When you come back to this codebase, the polished design system means
new features ship faster: import the primitive, drop it in, it already
matches the rest of the app.

Suggested next priorities (when ready):
1. Wire Clerk auth (needs Clerk account + keys from founder)
2. Fix dataintake Railway deploy
3. Provision Stripe / Upstash / Inngest / OneSignal / Resend / PostHog
4. Apply Week 2 migration (`migrations/0001_week2_creator_token_rating_antifraud.sql`)
   — staged but not applied. Token economy + creator economy + ratings
   tables will go live once approved.
