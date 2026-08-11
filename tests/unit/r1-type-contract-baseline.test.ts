import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { normalizeCardPlacementToFightType } from '../../src/shared/utils/eventHelpers';

describe('R1 repository type-contract baseline', () => {
  it('normalizes event card placement without weakening the EventFight union', () => {
    expect(normalizeCardPlacementToFightType('Main Event')).toBe('Main Card');
    expect(normalizeCardPlacementToFightType('Co-Main Event')).toBe('Main Card');
    expect(normalizeCardPlacementToFightType('Preliminary')).toBe('Prelim');
    expect(normalizeCardPlacementToFightType('Early Prelims')).toBe('Early Prelim');
    expect(normalizeCardPlacementToFightType('Pre-Prelims')).toBe('Early Prelim');
    expect(normalizeCardPlacementToFightType('Exhibition')).toBe('Exhibition');
  });

  it('uses canonical snake-case streak fields in the fighter corner', () => {
    const source = readFileSync(
      new URL('../../src/user/components/event/FighterCorner.tsx', import.meta.url),
      'utf8',
    );
    expect(source).toContain('win_streak: winStreak');
    expect(source).toContain('loss_streak: lossStreak');
    expect(source).not.toContain('const { winStreak, lossStreak }');
  });

  it('keeps event-history construction aligned with required EventFight fields', () => {
    const source = readFileSync(
      new URL('../../src/user/components/eventhistory/EventHistoryPage.tsx', import.meta.url),
      'utf8',
    );
    expect(source).toContain('rounds: fight.rounds');
    expect(source).toContain('fightType: normalizeCardPlacementToFightType(fight.cardPlacement)');
  });
});
