import { describe, expect, it } from 'vitest';
import { createPickRequestSchema } from '../../shared/schema';
import { PickPolicyError, projectedFlagUsage, validatePickForFight } from '../../server/services/pickService';

const fight = {
  id: 'fight-1',
  eventId: 'event-1',
  fighter1Id: 'fighter-1',
  fighter2Id: 'fighter-2',
  rounds: 3,
} as any;

describe('canonical pick request contract', () => {
  it('accepts the browser field names and supplies safe fixed-unit defaults', () => {
    expect(createPickRequestSchema.parse({
      fightId: 'fight-1',
      pickedFighterId: 'fighter-1',
    })).toEqual({
      fightId: 'fight-1',
      pickedFighterId: 'fighter-1',
      pickedMethod: 'Decision',
      pickedRound: null,
      units: 1,
      confidenceFlag: 'none',
    });
  });

  it('rejects the legacy payload and variable stakes', () => {
    expect(createPickRequestSchema.safeParse({
      fightId: 'fight-1',
      predictedWinnerId: 'fighter-1',
      method: 'Decision',
    }).success).toBe(false);
    expect(createPickRequestSchema.safeParse({
      fightId: 'fight-1',
      pickedFighterId: 'fighter-1',
      units: 5,
    }).success).toBe(false);
  });
});

describe('pick matchup policy', () => {
  it('accepts either fighter in the matchup', () => {
    for (const pickedFighterId of ['fighter-1', 'fighter-2']) {
      expect(() => validatePickForFight(createPickRequestSchema.parse({
        fightId: 'fight-1',
        pickedFighterId,
      }), fight)).not.toThrow();
    }
  });

  it('rejects a fighter outside the matchup and a round beyond the fight', () => {
    expect(() => validatePickForFight(createPickRequestSchema.parse({
      fightId: 'fight-1',
      pickedFighterId: 'fighter-3',
    }), fight)).toThrow(PickPolicyError);
    expect(() => validatePickForFight(createPickRequestSchema.parse({
      fightId: 'fight-1',
      pickedFighterId: 'fighter-1',
      pickedMethod: 'KO/TKO',
      pickedRound: 4,
    }), fight)).toThrow('Round must be between 1 and 3.');
  });
});

describe('flag-budget projections', () => {
  const picks = [
    { fightId: 'fight-1', confidenceFlag: 'yellow' },
    { fightId: 'fight-2', confidenceFlag: 'red' },
    { fightId: 'fight-3', confidenceFlag: 'green' },
  ];

  it('does not double-count an edit that keeps a budgeted flag', () => {
    expect(projectedFlagUsage(picks, 'fight-1', 'red')).toBe(2);
  });

  it('decrements when an edit removes a budgeted flag', () => {
    expect(projectedFlagUsage(picks, 'fight-1', 'green')).toBe(1);
  });

  it('increments only when another fight starts consuming budget', () => {
    expect(projectedFlagUsage(picks, 'fight-3', 'yellow')).toBe(3);
  });
});
