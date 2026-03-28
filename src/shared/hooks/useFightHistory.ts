import { useFightHistoryData } from '@/shared/context/FightHistoryContext';
import { FightRecord } from '@/shared/types/fighter';

export interface ExtendedFightRecord extends FightRecord {
  fighterId?: string;
  fighterName?: string;
}

export const useFightHistory = () => {
  const context = useFightHistoryData();
  
  return {
    ...context,
    fights: context.fightHistory,
    addFights: context.addFightHistory,
  };
};
