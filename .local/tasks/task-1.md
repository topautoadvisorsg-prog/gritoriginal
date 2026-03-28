---
title: Restructure landing page sections
---
# Landing Page Restructure

## What & Why
Reorganize and enhance the GRIT landing page to place core platform features front and center, demote AI competition to a marketing hook, and improve the visual hierarchy and scroll flow. No existing functionality is removed — only the order, content emphasis, and visual treatment of sections changes.

## Done looks like
- **New page order** (top to bottom):
  1. Hero (unchanged — video bg, headline, CTA)
  2. Core Features strip — 5-tile grid: Dashboard, Event Picks, Fighter Profiles, Community Chat, AI Chat — each tile has an icon, short label, and brief description; half-body fighter image placeholders (460×600) flank the section as visual anchors
  3. Intel Feed / Live Signals — SocialProofStrip promoted to a full-width "LIVE INTEL FEED" section with a visible heading and the scrolling ticker below it
  4. Fighter Profile showcase (ShowcaseFighters) — extended with a 3-line AI Scout Brief block and badge chips
  5. AI Competition callout — compact version of current AICompetitionSection with the copy "AI models compete on the same data — track the sharpest insights over time." No full-page layout; presented as a narrow marketing banner with the 3 AI model cards scaled down
  6. Leaderboard / Rankings — LeaderboardPreview enhanced by embedding the badge progression grid (currently in ShowcaseRankings) below the leaderboard table. ShowcaseRankings component is removed after its content is merged in.
  7. Community & Chat — standalone section using the ChatMockup from Tier2Features, listing: global & country chat rooms, premium slip uploads, badge display, expanded emoji library, token-based AI chat access
  8. Event Picks — Tier2Features PicksMockup moved here as a standalone section with a focus on prediction mechanics (moneyline, method, confidence units)
  9. How It Works — unchanged 4-step timeline
  10. Pricing — enhanced with a side-by-side feature comparison table (rows: Event picks, Chat access, Slip uploads, AI Chat, Badges, Emoji library) in addition to the existing price cards
  11. Footer CTA — unchanged

- The `IntroSection` component (currently between the ticker and Showcase AI) is removed — its content is absorbed into the new Core Features section.
- `ShowcaseAI` is removed — AI chat is one tile in the Core Features strip and the compact AI Competition callout covers it sufficiently.
- `ShowcaseRankings` is removed after its badge content is merged into LeaderboardPreview.
- `Tier2Features` is removed after its two mockups are split into the standalone Community & Chat and Event Picks sections.

## Out of scope
- No backend changes.
- No new real data endpoints — all new sections use static mock content matching the existing style.
- No changes to CSS variables, font stack, or color palette.
- No changes to any page other than LandingPage.tsx and its landing/ sub-components.
- i18n translation keys: reuse existing keys where possible; add new ones only where copy is genuinely new. Do not remove existing keys.

## Tasks

1. **Create CoreFeaturesSection component** — New file `src/user/pages/landing/CoreFeaturesSection.tsx`. 5-tile grid (Dashboard, Event Picks, Fighter Profiles, Community Chat, AI Chat) with icon + label + 1-line description. Two half-body fighter image placeholders (460×600) positioned as left/right flankers mirroring the AICompetitionSection flanker pattern.

2. **Promote SocialProofStrip to a full section** — Wrap the ticker in a proper `lp-section` container with a visible "LIVE INTEL FEED" heading and a red pulsing dot, so it reads as a section rather than just a ticker bar.

3. **Enhance ShowcaseFighters with AI Scout Brief** — Add a 3-line AI Scout Brief block inside the fighter card mockup and surface badge chips (Ninja/Samurai/Master/GOAT) below the stats.

4. **Create compact AICompetitionBanner component** — New file `src/user/pages/landing/AICompetitionBanner.tsx`. Narrow horizontal banner (not full-section) with the 3 model cards scaled down and the tagline "AI models compete on the same data — track the sharpest insights over time."

5. **Merge ShowcaseRankings into LeaderboardPreview** — Add the badge progression grid (4 tier cards: Ninja → Samurai → Master → GOAT with stars) below the leaderboard table inside LeaderboardPreview. Delete ShowcaseRankings.tsx.

6. **Create CommunitySection component** — New file `src/user/pages/landing/CommunitySection.tsx`. Uses the existing ChatMockup. Lists premium features: global/country rooms, slip uploads, badges, emoji library, token-based AI chat.

7. **Create EventPicksSection component** — New file `src/user/pages/landing/EventPicksSection.tsx`. Uses the existing PicksMockup. Focused copy on prediction mechanics.

8. **Enhance PricingSection with comparison table** — Add a feature comparison table below the two price cards: rows for Event Picks, Chat Access, Slip Uploads, AI Chat Access, Badges, Emoji Library. Contender column shows ✓/✗, Challenger column shows ✓ for all.

9. **Rewire LandingPage.tsx** — Update imports and section order to match the new sequence. Remove IntroSection, ShowcaseAI, ShowcaseRankings, Tier2Features. Add CoreFeaturesSection, AICompetitionBanner, CommunitySection, EventPicksSection.

## Relevant files
- `src/user/pages/LandingPage.tsx`
- `src/user/pages/landing/AICompetitionSection.tsx`
- `src/user/pages/landing/SocialProofStrip.tsx`
- `src/user/pages/landing/ShowcaseSections.tsx`
- `src/user/pages/landing/LeaderboardPreview.tsx`
- `src/user/pages/landing/Tier2Features.tsx`
- `src/user/pages/landing/IntroSection.tsx`
- `src/user/pages/landing/PricingSection.tsx`
- `src/user/pages/landing/HowItWorks.tsx`
- `src/user/pages/landing/Badges.tsx`
- `src/user/pages/landing/hooks.ts`
- `src/user/pages/LandingPage.css`