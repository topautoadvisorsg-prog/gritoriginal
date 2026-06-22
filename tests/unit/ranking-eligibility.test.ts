import { describe, expect, it } from 'vitest';
import { isEligibleScoredPick } from '../../server/services/rankingEligibility';

describe('canonical ranking eligibility', () => {
  it('includes active non-red picks from completed fights', () => {
    expect(isEligibleScoredPick({
      pickStatus: 'active',
      confidenceFlag: 'none',
      fightStatus: 'Completed',
    })).toBe(true);
  });

  it.each([
    ['voided pick', { pickStatus: 'voided', confidenceFlag: 'none', fightStatus: 'Completed' }],
    ['red pick', { pickStatus: 'active', confidenceFlag: 'red', fightStatus: 'Completed' }],
    ['unfinished fight', { pickStatus: 'active', confidenceFlag: 'none', fightStatus: 'Live' }],
  ])('excludes %s', (_label, state) => {
    expect(isEligibleScoredPick(state)).toBe(false);
  });

  it.each(['none', 'yellow', 'green'])('keeps the %s confidence flag eligible', (confidenceFlag) => {
    expect(isEligibleScoredPick({
      pickStatus: 'active',
      confidenceFlag,
      fightStatus: 'Completed',
    })).toBe(true);
  });
});
