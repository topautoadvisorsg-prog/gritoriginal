# Rename AI Predictions to AI Fight Analyst

## What & Why
The document calls for repositioning the AI feature away from "predictions" and toward "analysis." The product is a fight analyst — not a predictor — and this should be reflected everywhere users see it: sidebar nav, page titles, and the AI's own response framing.

## Done looks like
- The sidebar nav entry reads "AI Fight Analyst" (or equivalent translation) in all supported locales (en, en-US, es, es-ES, fr, ja, ko, pt, ru)
- The page title/subtitle in the header reads "AI Fight Analyst" and "Premium fight matchup analysis" (or similar)
- The AI system prompt in fight-context mode explicitly instructs the model to phrase conclusions analytically: "Based on the available data...", "Historically this matchup favors...", "One possible path to victory..."
- No user-facing string anywhere in the product still says "AI Predictions"

## Out of scope
- Renaming internal file names or TypeScript identifiers (AIPredictionsTab.tsx, etc.) — internal naming only; no user impact
- Any changes to the AI's general-mode (non-fight-context) behavior or prompts
- Phase 2 features (embeddings, semantic matching)

## Tasks
1. **Update navigation config and i18n** — Change the `ai` entry in `navigation.ts` to title "AI Fight Analyst" and subtitle "Premium fight matchup analysis." Update the `sidebar.ai_predictions` key and its translation in all 9 locale files (en, en-US, es, es-ES, fr, ja, ko, pt, ru).

2. **Update AI system prompt framing** — In the FIGHT ANALYST MODE block in `aiChatRoutes.ts`, add explicit guidance that the model should phrase all conclusions using analytical language ("Based on the available data...", "Historically this matchup favors...", "One possible path to victory...") and must never present itself as a predictor of outcomes.

## Relevant files
- `src/shared/config/navigation.ts:38-75`
- `public/locales/en/translation.json`
- `public/locales/en-US/translation.json`
- `public/locales/es/translation.json`
- `public/locales/es-ES/translation.json`
- `public/locales/fr/translation.json`
- `public/locales/ja/translation.json`
- `public/locales/ko/translation.json`
- `public/locales/pt/translation.json`
- `public/locales/ru/translation.json`
- `server/user/routes/aiChatRoutes.ts:237-260`
