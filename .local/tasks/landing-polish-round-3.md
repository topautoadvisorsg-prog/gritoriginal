# Landing Page Polish Round 3

## What & Why
Seven targeted fixes to sharpen the landing page: remove redundant text from a step, make the feature card mockups match the actual app's interface patterns, create a visible atmospheric background that replaces the flat black, enlarge the section pill labels, update the AI Arena label copy, fix hero headline contrast, and lay out fighter image placeholders in two more sections.

## Done looks like
- Step 04 "Climb the Rankings" no longer shows "Prove you belong at the top." — just the title and UI mockup
- Fantasy Picks card in the More Features section shows the actual app's pick interface style: fighter corners, method selector (KO/TKO · Submission · Decision), unit selector, and a lock button — colors and layout matching the real `FantasyPickSection` component
- Community card's chat mockup mirrors the real app chat component style (dark bubbles, avatar initials, timestamps, send bar)
- Every section below the hero has a visible arena atmosphere: deep dark base (warm, not blue), red light bleeding from corners and bottom edges, subtle smoke/haze gradients, faint octagon outlines barely visible in the far background
- Section pill labels are clearly readable: larger font, more padding — they read as a deliberate design element, not fine print
- The AI Arena pill label reads something punchy that communicates AI models competing live on picks (e.g. "AI MODELS. COMPETING LIVE.")
- Hero headline: primary text is solid white, 2–3 key words across the two title lines are deep brand red, the rest stays white — high contrast on any video frame
- AI Arena section has a half-body fighter image placeholder on the LEFT and one on the RIGHT flanking the three AI cards — outlined, labeled "FIGHTER IMAGE · HALF BODY · [dimensions]"
- ShowcaseFighters ("Every Fighter Fully Decoded") section has its right-side visual simplified to show a prominent half-body fighter image placeholder as the centerpiece, clearly labeled

## Out of scope
- Actual fighter photos (placeholders only — labeled for correct size/format)
- Any changes to the Pricing, Leaderboard, or FooterCTA sections
- Structural changes to routing or the app's authenticated views

## Tasks

1. **Step 04 text fix** — Remove "Prove you belong at the top." from the `step4_desc` translation key in both locale files, leaving just the title and the visual.

2. **Feature card mockups — match real app** — Rebuild the Fantasy Picks card miniature UI to reflect the real `FantasyPickSection` patterns (fighter corner selection, method pills KO/Sub/Dec, unit dots, lock button). Rebuild the Community card's chat to reflect the real `EventChat` patterns (avatar initials circle, username, timestamp, message bubble, send input bar). Use the same color tokens the app uses.

3. **Atmospheric arena background** — Fix all section backgrounds below the hero so they are fully visible: solid dark base with a warm tint (not transparent over the video), strong enough red gradient bleeds from corners/bottom (increase opacity to make them clearly visible), and faint octagon SVG outlines repeating in the background. Apply consistently to every section: AI Arena, Intro, all Showcase sections, More Features, How It Works, Leaderboard, Pricing, FooterCTA.

4. **Section label pills — larger** — Increase font size and padding on `.lp-section-label` so the pill is an intentional, readable design element (not fine print). Also check the pill is using the brand red border, not something too subtle.

5. **AI Arena label text** — Change the `ai_arena.label` translation key from "AI ARENA" to a punchy line that describes what the feature actually is — AI models competing live on picks. Update both locale files.

6. **Hero headline colors** — Refactor `HeroSection.tsx` to render the headline with explicit `<span>` elements so select words can be solid deep red while everything else is solid white. Remove the gradient background-clip approach on the main title lines and use direct color values. Choose words that carry the most weight in each line for the red accent.

7. **Fighter image placeholders — two new locations** — In `AICompetitionSection.tsx`, add a half-body placeholder on the left side AND one on the right side of the three AI cards grid (flanking layout). In `ShowcaseFighters`, simplify the right-side fighter card to make the half-body image placeholder the visual centerpiece — the placeholder should be large and prominent with the stats sitting below or secondary to it. All placeholders must be clearly labeled with size and format guidance.

## Relevant files
- `public/locales/en/translation.json`
- `public/locales/en-US/translation.json`
- `src/user/pages/landing/HowItWorks.tsx`
- `src/user/pages/landing/Tier2Features.tsx`
- `src/user/pages/landing/AICompetitionSection.tsx`
- `src/user/pages/landing/ShowcaseSections.tsx`
- `src/user/pages/landing/HeroSection.tsx`
- `src/user/pages/LandingPage.css:259-275,806-820,1015-1028,1229-1234,1341-1360,2535-2855`
- `src/user/components/fightdetail/FantasyPickSection.tsx:1-80`
- `src/user/components/chat/EventChat.tsx:1-80`
