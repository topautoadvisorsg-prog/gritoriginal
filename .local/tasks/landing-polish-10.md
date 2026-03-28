# Landing Page Polish — 10 Items

  ## What & Why
  Push the landing page from a 7 to a 10 by polishing every visible surface: favicon, nav sizing, hero cleanup, ticker readability, fighter images, section gaps, How It Works visuals, badge designs, pricing layout, and the final CTA.

  ## Done looks like
  - Browser tab shows the GRIT favicon (file will be provided by owner; scaffold the correct HTML and manifest entries so dropping the file in is the only remaining step)
  - Nav link text is slightly larger and more readable
  - Hero is clean — floating stat badges removed, video/headline/pill/CTAs remain
  - Intel ticker text is readable at a glance (larger font, taller strip)
  - Fighter imagery appears in three places: AI Arena section background, Fighter Intelligence card, Final CTA section
  - The vertical gap between the AI Arena section and the section that follows it is visibly tighter
  - Each How It Works step has a small inline visual (profile card, pick block, chart, badge/rank)
  - Leaderboard rows and badge progression section show four distinct SVG achievement badges: Ninja (steel/dark), Samurai (teal), Master (purple), GOAT (gold)
  - Pricing section shows two cards side by side: CONTENDER (free) on the left, CHALLENGER on the right
  - Final CTA section has dramatic fighter imagery (real photo URLs or high-fidelity SVG cutouts if hotlink-blocked), not abstract silhouettes
  - All i18n keys for new copy are added to both locale files

  ## Out of scope
  - Backend changes
  - Actual favicon file (owner will supply; only the HTML/manifest wiring is in scope)
  - Licensed image procurement (publicly available press photos or SVG fallbacks used for now)

  ## Tasks

  1. **Favicon scaffold** — Update index.html and manifest.json to reference a 512x512 PNG, 180x180 PNG, and 32x32 PNG favicon set. Create named placeholder files in /public so the owner can drop replacements in without touching code. Note in a comment what files are expected.

  2. **Nav font + ticker size** — Increase nav link font-size from .88rem to .96rem and adjust letter-spacing. Increase ticker strip height from 44px to 54px and ticker item font-size from .70rem to .82rem.

  3. **Hero floating badges removal** — Remove the four `.lp-hero__float-badge` elements and the `.lp-hero__floating` wrapper from HeroSection. Remove the associated CSS rules. Keep everything else in the hero untouched.

  4. **Section gap fix** — Reduce padding-top on the section immediately following AICompetitionSection (IntroSection, currently lp-intro) so the transition between sections is tighter. Target feel: one confident scroll, not several.

  5. **Fighter imagery** — Add a dramatic fighter image or silhouette to three places: (a) AICompetitionSection — large offset fighter behind the AI cards, dark-treated; (b) ShowcaseFighters card — replace the SVG initials avatar with a real fighter photo or refined SVG cutout as centerpiece; (c) FooterCTA — replace the two abstract SVG silhouettes with real fighter photo URLs (dark overlay on top). Use publicly available MMA/UFC press photo URLs. If hotlink-blocked, use refined high-fidelity SVG fighter cutouts with the red color treatment.

  6. **How It Works step visuals** — Each of the four steps gets a small inline visual mock: step 01 gets a compact fighter-profile card fragment; step 02 gets a pick-selection block; step 03 gets a small upward trend chart; step 04 gets a badge/rank emblem. These are SVG or JSX fragments — simple, clean, consistent style.

  7. **SVG achievement badges** — Design and build four distinct SVG badge components as a shared file. Ninja: dark steel, angular frame, shuriken motif, cool-grey palette. Samurai: teal, hexagonal frame, katana motif. Master: purple, octagonal frame, crown motif. GOAT: gold, ornate circular frame, star/laurel motif. Integrate badges into LeaderboardPreview rows (replacing emoji) and the badge progression block in ShowcaseRankings.

  8. **Pricing — add free plan** — Add CONTENDER card to PricingSection on the left of CHALLENGER. Price: $0 / Forever. Features: Fighter profiles and records, make picks on all events, global leaderboard access, stars and badge progression, community chat. CTA: START FREE. Add all new copy to both translation.json files.

  ## Relevant files
  - `src/user/pages/landing/HeroSection.tsx`
  - `src/user/pages/landing/AICompetitionSection.tsx`
  - `src/user/pages/landing/ShowcaseSections.tsx`
  - `src/user/pages/landing/FooterCTA.tsx`
  - `src/user/pages/landing/HowItWorks.tsx`
  - `src/user/pages/landing/LeaderboardPreview.tsx`
  - `src/user/pages/landing/PricingSection.tsx`
  - `src/user/pages/landing/SocialProofStrip.tsx`
  - `src/user/pages/LandingPage.css`
  - `src/user/pages/LandingPage.tsx`
  - `public/locales/en/translation.json`
  - `index.html`
  - `public/manifest.json`
  