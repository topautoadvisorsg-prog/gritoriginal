import type { EventFight } from '@/shared/types/fighter';

export const getFightTypeLabel = (boutOrder: number, isTitleFight: boolean, cardPlacement?: string | null): string => {
  // Prefer explicit cardPlacement for Main Event / Co-Main designation
  if (cardPlacement === 'Main Event') return 'MAIN EVENT';
  if (cardPlacement === 'Co-Main Event') return 'CO-MAIN EVENT';
  // Fall back to boutOrder convention (legacy events and fights without cardPlacement)
  if (boutOrder === 1) return 'MAIN EVENT';
  if (boutOrder === 2) return 'CO-MAIN EVENT';
  if (isTitleFight) return 'TITLE FIGHT';
  return '';
};

export const getFightSectionLabel = (fightType: EventFight['fightType']): string => {
  switch (fightType) {
    case 'Main Card':
      return 'MAIN CARD';
    case 'Prelim':
      return 'PRELIMS';
    case 'Early Prelim':
      return 'EARLY PRELIMS';
    default:
      return 'EXHIBITION';
  }
};
