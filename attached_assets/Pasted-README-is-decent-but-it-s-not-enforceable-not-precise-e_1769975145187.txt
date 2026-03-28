README is decent, but it’s not enforceable, not precise enough for dev work, and not aligned with your real architecture (admin, imports, schemas, verification, images, etc.).

Below is a fully upgraded, developer-grade README that:

Matches your real fighter system architecture

Separates fighter profile vs fight history vs deep stats

Defines canonical schemas (no ambiguity)

Defines import pipelines (3 layers like you designed)

Defines admin responsibilities (edit, images, verification)

Defines strict dev rules (clean code + README updates)

Removes fake/mock ambiguity

Makes it impossible for the dev to “interpret” requirements wrong

This is final-prompt-level quality. You can paste this directly into your repo.

MMA Matrix Pro

Professional MMA Fighter Intelligence & Analytics Platform

MMA Matrix Pro is a structured fighter intelligence system built with React, TypeScript, and Tailwind CSS.
The system is designed around a Fighter Profile as the single source of truth, with layered data imports for profile data, fight history, and deep fight analytics.

1) Core Philosophy — Fighter as Source of Truth

The Fighter Profile is the canonical data object.

All modules MUST read from the Fighter Profile:

Events module

Fight cards

Analytics & predictions

Admin editing

Import/export pipelines

UI rendering

No module is allowed to redefine fighter data independently.

Data hierarchy:

Fighter Profile (Primary Truth)
├── Profile Data (Identity, Physical, Career Stats)
├── Fight History (Ledger)
└── Fight Detail / Deep Stats (Analytics Layer)

2) Data Architecture Overview
2.1 Fighter Profile Layer (Primary Import)

This is the main fighter profile (UFC-style profile page data).

Includes:

Identity data

Physical attributes

Record

Career statistics

Media assets (images)

Status flags

2.2 Fight History Layer (Secondary Import)

This is the fight ledger (list of fights).

Each fight is immutable once imported (except admin override).

2.3 Deep Fight Intelligence Layer (Third Import)

This is the detailed fight stats (round-by-round, strike breakdown, decisions, referees, etc.).

This layer attaches to a fight record.

3) Canonical Fighter Schema (Source of Truth)
FighterProfile Schema
FighterProfile = {
  id: string,

  // Identity
  firstName: string,
  lastName: string,
  nickname?: string,
  dateOfBirth: string,
  nationality: string,
  gender: 'Male' | 'Female',

  // Division & Organization
  organization: string,
  weightClass: string,
  stance: 'Orthodox' | 'Southpaw' | 'Switch',
  gym: string,
  headCoach?: string,
  team?: string,

  // Media (STRICT RULE: max 2 images)
  imageUrl: string,        // profile/headshot
  bodyImageUrl?: string,   // full body

  // Physical Stats
  physicalStats: {
    age: number,
    height: string,
    heightInches: number,
    weight: number,
    reach: string,
    reachInches: number,
    legReach?: string,
    legReachInches?: number,
  },

  // Record
  record: {
    wins: number,
    losses: number,
    draws: number,
    noContests: number,
  },

  // Career Performance Metrics (UFC Stats)
  performance: {
    strikesLandedPerMin: number,
    strikesAbsorbedPerMin: number,
    strikeAccuracy: number,
    takedownAccuracy: number,
    takedownDefense: number,
    tdAvg?: number,
    subAvg?: number,
    koWins: number,
    tkoWins: number,
    submissionWins: number,
    decisionWins: number,
    finishRate: number,
  },

  // Fight History
  history: FightRecord[],

  // Status Flags
  isActive: boolean,
  ranking?: number,
  isChampion?: boolean,

  // Verification (simple logic)
  isVerified: boolean,

  createdAt: string,
  lastUpdated: string,
}

4) Fight History Schema (Ledger Layer)
FightRecord = {
  id: string,
  eventId: string,
  eventName: string,
  eventDate: string,

  opponentId?: string,
  opponentName: string,

  result: 'WIN' | 'LOSS' | 'DRAW' | 'NC' | 'PENDING',
  method: 'KO' | 'TKO' | 'Submission' | 'Decision' | 'Split Decision' | 'Unanimous Decision' | 'DQ',
  methodDetail?: string,

  round: number,
  time: string,
  fightDurationSeconds: number,

  titleFight: boolean,
  fightType: 'Main Card' | 'Prelim' | 'Early Prelim',

  referee?: string,
  performanceBonus?: boolean,

  stats?: FightStats,
}

5) Deep Fight Stats Schema (Analytics Layer)
FightStats = {
  knockdowns: number,
  significantStrikesLanded: number,
  significantStrikesAttempted: number,
  strikesLanded: number,
  strikesAttempted: number,
  takedownsLanded: number,
  takedownsAttempted: number,
  submissionAttempts: number,
  reversals?: number,
  controlTimeSeconds: number,

  headStrikesLanded: number,
  bodyStrikesLanded: number,
  legStrikesLanded: number,
}

6) Import System Rules (CRITICAL)
6.1 Import Types

There are exactly 3 import pipelines:

Fighter Profile Import

Fight History Import

Fight Detail / Deep Stats Import

6.2 Mandatory Rules

Fighters MUST exist before importing fight history.

Fight history MUST exist before importing deep stats.

No silent overwrites.

Conflicts require admin decision.

Real data MUST NOT be replaced by mock data.

Mock data MUST NOT be committed as production data.

7) Admin System Requirements
7.1 Admin Fighter Editor

Admin must be able to:

Edit fighter profile fields

Edit fight history records

Upload images

Toggle verification status

7.2 Image Rules (STRICT)

Each fighter has exactly 2 images:

Profile image (headshot)

Body image (full body)

Rules:

Uploading a new profile image replaces the old one.

Uploading a new body image replaces the old one.

No multiple image storage.

No image history.

7.3 Verification Logic (Simple)
isVerified: boolean


Meaning:

true = factual UFC data verified by admin

false = unverified or incomplete data

No external sources, no AI verification, no metadata.

8) Storage Architecture

Current storage:

Admin Input / CSV Import
→ FighterDataContext
→ localStorage
→ UI Modules


Important notes:

localStorage is environment-specific (dev ≠ production).

If cross-environment sync is required, a database is mandatory.

9) File Structure (Canonical)
src/
├── components/
│   ├── fighter/
│   ├── admin/
│   ├── import/
│   ├── export/
├── context/
│   ├── FighterDataContext.tsx
├── types/
│   ├── fighter.ts
├── utils/
│   ├── fighterTransform.ts
│   ├── fightHistoryTransform.ts

10) Development Rules (MANDATORY)

Every task must follow these rules:

10.1 Clean Code

No duplicated logic

No unused files

No hardcoded mock data in production paths

Strict TypeScript typing

Consistent naming conventions

10.2 Standard Structure

Follow existing architecture

Do NOT introduce parallel data systems

Do NOT bypass FighterDataContext

10.3 README Update Rule (CRITICAL)

Every implemented feature MUST:

Update the README

Document new fields

Document schema changes

Document new workflows

Rules:

Do NOT delete existing README content.

Only extend and improve documentation.

Keep documentation consistent with real implementation.

11) Known Limitations (Current State)

No backend database (localStorage only)

No authentication system

No multi-user support

Events module partially mocked

No real-time data feeds

12) Strategic Goal

MMA Matrix Pro is not a simple CRUD app.

It is a structured fighter intelligence engine designed for:

Analytics

Prediction models

Fight simulations

Performance tracking

Data-driven MMA insights

Therefore:

Data integrity is more important than speed of development.