import { eq, ne, type SQL } from 'drizzle-orm';
import { eventFights, userPicks } from '../../shared/schema';

export type RankingPickState = {
  pickStatus: string;
  confidenceFlag: string;
  fightStatus: string;
};

export function isEligibleScoredPick(state: RankingPickState): boolean {
  return state.pickStatus === 'active'
    && state.confidenceFlag !== 'red'
    && state.fightStatus === 'Completed';
}

/** Shared SQL predicate for every net-unit ranking aggregate. */
export function canonicalRankingEligibilityConditions(): SQL[] {
  return [
    eq(userPicks.status, 'active'),
    ne(userPicks.confidenceFlag, 'red'),
    eq(eventFights.status, 'Completed'),
  ];
}
