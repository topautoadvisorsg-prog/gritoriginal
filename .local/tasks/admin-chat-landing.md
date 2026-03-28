# Admin Chat Management + Landing Page

## What & Why
Build the Admin Chat Management tab (full moderation controls) and update the landing page with the Slip Wall section and refreshed pricing cards. Both are presenter-layer work that depends on the backend foundation being in place. They are batched together because they share no codebase overlap and can be done by the same agent sequentially.

## Done looks like
- A new "Community" (or "Chat Management") tab appears in the Admin Panel with the following sub-sections:
  - **Chat Control**: ON/OFF toggle with visual status, cooldown minutes input, save button; shows "Chat is currently OPEN/CLOSED" state with a colored pill
  - **Message Feed**: live list of the 50 most recent global messages with username, timestamp, delete button (posts DELETE to admin route); filtered by chat type (global / country selector); confirm dialog before delete
  - **Slip Moderation Queue**: paginated list of pending slips showing image thumbnail, uploader username, upload time; actions: Approve, Feature (approve + add to wall), Reject (opens reason input which becomes the in-app notification message); a separate "Featured Wall" sub-view lets the admin remove slips from the wall
  - **Mutes & Bans**: list of active mutes and bans with username, reason, expiry, remove button; a "Add Mute/Ban" form with username search, reason, duration (hours/days/permanent) selector
  - **Activity Log**: read-only list of the 100 most recent moderation actions (mute/ban/delete/slip approve/reject) with timestamp and acting admin username
- Landing page Slip Wall section ("BIG HITS") inserted between LeaderboardPreview and PricingSection:
  - Dark section with heading "COMMUNITY HITS" and subheading "Real slips. Real wins."
  - Fetches up to 6 featured slips from `/api/slip-wall`; if fewer than 6 or none, shows placeholder cards (keeps the section without breaking the layout)
  - Each card shows the slip image, a username attribution line, and the admin caption
  - Section has a "SEE ALL SLIPS" CTA that links to the in-app slip wall when logged in, or triggers sign-in flow when logged out
- Pricing cards refreshed: tiers renamed to **Contender** (free) and **Challenger** (paid) with the exact feature list from the spec (community chat access, emoji library, slip sharing, badge, etc.)

## Out of scope
- User-facing chat/slip UI (separate task)
- Any new backend routes (backend task covers all API work)
- Payment flow changes (Stripe wiring remains as-is)

## Tasks
1. **Admin Chat tab** — Create a new `AdminChatManagement.tsx` component with Chat Control, Message Feed, Slip Moderation Queue, Featured Wall sub-view, Mutes & Bans, and Activity Log sections. Register the tab in AdminPanel.

2. **Slip Moderation UI** — Inside the admin tab, build the slip queue: thumbnail grid of pending slips, Approve/Feature/Reject actions with confirmation dialogs. The reject action opens an inline reason input that POPs back to the admin endpoint. Featured Wall sub-view shows currently featured slips with a remove-from-wall button.

3. **Mutes & Bans UI** — List + add form for mutes and bans with username search autocomplete, reason field, duration selector. Active list with one-click remove.

4. **Landing page Slip Wall section** — Create a `SlipWallPreview.tsx` landing section component. Fetches `/api/slip-wall`. Renders up to 6 card slots (placeholder skeleton cards when there is no data). Insert the section in `LandingPage.tsx` between `<LeaderboardPreview />` and `<PricingSection />`. Style consistent with the existing dark cinematic landing page aesthetic.

5. **Pricing cards update** — In `PricingSection.tsx`, rename the tier labels to "Contender" and "Challenger". Update the feature lists to match the spec: Contender = read chat, send text, basic emoji, community leaderboard; Challenger = everything above + expanded emoji, slip sharing, Challenger badge in chat, priority slip moderation.

## Relevant files
- `src/admin/AdminPanel.tsx`
- `src/user/pages/LandingPage.tsx`
- `src/user/pages/landing/PricingSection.tsx`
- `src/user/pages/landing/LeaderboardPreview.tsx`
- `src/user/pages/LandingPage.css`
