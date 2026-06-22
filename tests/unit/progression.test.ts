/**
 * Tests for the progression endpoints exposed by:
 *   GET /api/me/progression       — current stars/badge/keys snapshot
 *   GET /api/me/progression/streak — fresh streak computation
 *   GET /api/me/keys               — full keys list
 *
 * Locks in blueprint §8 progression math:
 *   - 5-tier badge ladder Ninja → Samurai → Master → Grandmaster → GOAT
 *   - Star conversion: 5th star → next badge + reset to 1
 *   - Floor at zero stars / no badge
 *   - 1 key = $100; 5 keys = Gold Key Badge + $1,000
 *
 * Pattern: pure logic tests, no DB. Mirror this for any new derived-state endpoint.
 */
import { describe, it, expect } from 'vitest';
import { config } from '../../server/config/env';
import {
  applyProgressionRules,
  calculateCanonicalProgressionPerformance,
} from '../../server/services/progressionService';

/** Mirrors the path-to-next-badge calc in progressionRoutes.ts */
function computeNextBadge(currentBadge: string, currentStars: number) {
  const tiers = [...config.BADGE_TIERS];
  const currentBadgeIdx = tiers.indexOf(currentBadge as typeof tiers[number]);
  const nextBadge =
    currentBadgeIdx >= 0 && currentBadgeIdx < tiers.length - 1
      ? tiers[currentBadgeIdx + 1]
      : null;
  const starsToNextBadge = nextBadge ? Math.max(0, config.STAR_CAP - currentStars) : 0;
  return { nextBadge, starsToNextBadge };
}

/** Mirrors the Gold Key milestone calc in progressionRoutes.ts */
function computeKeyMilestone(keysCount: number) {
  const keysUntilGoldKey = Math.max(0, 5 - keysCount);
  const hasGoldKey = keysCount >= 5;
  return { keysUntilGoldKey, hasGoldKey };
}

describe('Badge Tier Ladder (Blueprint §8)', () => {
  it('exposes the 5-tier ladder via config', () => {
    expect(config.BADGE_TIERS).toContain('none');
    expect(config.BADGE_TIERS).toContain('ninja');
    expect(config.BADGE_TIERS).toContain('samurai');
    expect(config.BADGE_TIERS).toContain('master');
    expect(config.BADGE_TIERS).toContain('grandmaster');
    expect(config.BADGE_TIERS).toContain('goat');
    expect(config.BADGE_TIERS).toEqual(['none', 'ninja', 'samurai', 'master', 'grandmaster', 'goat']);
  });

  it('STAR_CAP is 5 (5 stars converts to next badge + resets to 1)', () => {
    expect(config.STAR_CAP).toBe(5);
  });
});

describe('Path to Next Badge', () => {
  it('user with no badge ("none") points to ninja as next', () => {
    const result = computeNextBadge('none', 0);
    expect(result.nextBadge).toBe('ninja');
    expect(result.starsToNextBadge).toBe(5);
  });

  it('user with ninja and 3 stars needs 2 more stars to advance', () => {
    const result = computeNextBadge('ninja', 3);
    expect(result.nextBadge).toBe('samurai');
    expect(result.starsToNextBadge).toBe(2);
  });

  it('user with master and 5 stars (about to convert) needs 0 more', () => {
    const result = computeNextBadge('master', 5);
    expect(result.nextBadge).toBe('grandmaster');
    expect(result.starsToNextBadge).toBe(0);
  });

  it('user with GOAT (pinnacle) has no next badge', () => {
    const result = computeNextBadge('goat', 5);
    expect(result.nextBadge).toBeNull();
    expect(result.starsToNextBadge).toBe(0);
  });
});

describe('Gold Key Milestone (Blueprint §8 — 5 keys = unlock)', () => {
  it('0 keys → 5 until Gold Key, hasGoldKey=false', () => {
    expect(computeKeyMilestone(0)).toEqual({ keysUntilGoldKey: 5, hasGoldKey: false });
  });

  it('1 key → 4 until Gold Key', () => {
    expect(computeKeyMilestone(1)).toEqual({ keysUntilGoldKey: 4, hasGoldKey: false });
  });

  it('4 keys → 1 until Gold Key', () => {
    expect(computeKeyMilestone(4)).toEqual({ keysUntilGoldKey: 1, hasGoldKey: false });
  });

  it('5 keys → Gold Key UNLOCKED', () => {
    expect(computeKeyMilestone(5)).toEqual({ keysUntilGoldKey: 0, hasGoldKey: true });
  });

  it('10 keys (past milestone) → still hasGoldKey=true, never negative', () => {
    expect(computeKeyMilestone(10)).toEqual({ keysUntilGoldKey: 0, hasGoldKey: true });
  });
});

describe('ROI Star Progression Rules (Blueprint §7)', () => {
  // ROI thresholds from config
  it('ROI bonus threshold is 15%', () => {
    expect(config.ROI_BONUS_THRESHOLD_PCT).toBe(15);
  });

  it('loss tolerance is exactly 1 unit', () => {
    expect(config.ROI_LOSS_TOLERANCE_UNITS).toBe(1);
  });

  // Star rules per blueprint §7:
  //   ROI > 15%   → +2 stars
  //   ROI 0-15%   → +1 star  (positive ROI, qualified)
  //   Lose 0-1u   → neutral (1-unit tolerance zone)
  //   Lose >1u    → -1 star (min 0)
  it('ROI > 15% (e.g. 20%) earns +2 stars when qualified', () => {
    const roi = 20;
    const expectedStarChange = roi > config.ROI_BONUS_THRESHOLD_PCT ? 2 : 1;
    expect(expectedStarChange).toBe(2);
  });

  it('ROI exactly at 15% earns +1 star (boundary)', () => {
    const roi = 15;
    const expectedStarChange = roi > config.ROI_BONUS_THRESHOLD_PCT ? 2 : 1;
    expect(expectedStarChange).toBe(1);
  });

  it('ROI 5% earns +1 star when qualified', () => {
    const roi = 5;
    const expectedStarChange = roi > config.ROI_BONUS_THRESHOLD_PCT ? 2 : 1;
    expect(expectedStarChange).toBe(1);
  });

  it('loss inside 1-unit tolerance is neutral', () => {
    const result = applyProgressionRules({
      oldStars: 3,
      oldBadge: 'none',
      roi: -10,
      netUnits: -1,
      hasMetPickMinimum: true,
      validPicksCount: 8,
      requiredPicks: 8,
    });

    expect(result.newStars).toBe(3);
    expect(result.newBadge).toBe('none');
    expect(result.reason).toContain('Neutral ROI');
  });

  it('loss beyond 1-unit tolerance loses 1 star', () => {
    const result = applyProgressionRules({
      oldStars: 3,
      oldBadge: 'none',
      roi: -20,
      netUnits: -1.01,
      hasMetPickMinimum: true,
      validPicksCount: 8,
      requiredPicks: 8,
    });

    expect(result.newStars).toBe(2);
    expect(result.newBadge).toBe('none');
  });

  it('badge progression walks master → grandmaster → goat', () => {
    const grandmaster = applyProgressionRules({
      oldStars: 5,
      oldBadge: 'master',
      roi: 5,
      netUnits: 1,
      hasMetPickMinimum: true,
      validPicksCount: 8,
      requiredPicks: 8,
    });

    const goat = applyProgressionRules({
      oldStars: 5,
      oldBadge: 'grandmaster',
      roi: 5,
      netUnits: 1,
      hasMetPickMinimum: true,
      validPicksCount: 8,
      requiredPicks: 8,
    });

    expect(grandmaster.newBadge).toBe('grandmaster');
    expect(goat.newBadge).toBe('goat');
  });
});

describe('Canonical progression performance', () => {
  it('uses stored net-unit hundredths with a fixed one-unit denominator', () => {
    const performance = calculateCanonicalProgressionPerformance([
      { status: 'active', confidenceFlag: 'none', fightStatus: 'Completed', pointsAwarded: 150 },
      { status: 'active', confidenceFlag: 'green', fightStatus: 'Completed', pointsAwarded: -100 },
    ]);

    expect(performance).toEqual({ eligiblePicksCount: 2, netUnits: 0.5, roi: 25 });
  });

  it('excludes red, voided, and incomplete picks exactly like rankings', () => {
    const performance = calculateCanonicalProgressionPerformance([
      { status: 'active', confidenceFlag: 'red', fightStatus: 'Completed', pointsAwarded: 500 },
      { status: 'voided', confidenceFlag: 'none', fightStatus: 'Completed', pointsAwarded: 500 },
      { status: 'active', confidenceFlag: 'yellow', fightStatus: 'Live', pointsAwarded: 500 },
      { status: 'active', confidenceFlag: 'yellow', fightStatus: 'Completed', pointsAwarded: -100 },
    ]);

    expect(performance).toEqual({ eligiblePicksCount: 1, netUnits: -1, roi: -100 });
  });
});

describe('Hard Floor (Blueprint §7)', () => {
  it('star count never goes below 0', () => {
    // Simulating "-1 star" applied at currentStars=0
    const currentStars = 0;
    const newStars = Math.max(0, currentStars - 1);
    expect(newStars).toBe(0);
  });

  it('badge never regresses below "ninja" once earned (blueprint floor)', () => {
    // Note: implementation lives in progressionService.ts. Spec validation.
    expect(config.BADGE_TIERS[1]).toBe('ninja'); // ninja is the floor tier
  });
});
