import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FightRecord } from '@/shared/types/fighter';

interface FightHistoryContextType {
  fightHistory: FightRecord[];
  isLoaded: boolean;
  addFightHistory: (records: FightRecord[], mode?: 'add' | 'replace') => Promise<void>;
  getFightsByFighterId: (fighterId: string) => FightRecord[];
  removeFight: (fightId: string) => Promise<void>;
  clearFightHistory: () => void;
  getFightById: (fightId: string) => FightRecord | undefined;
}

const FightHistoryContext = createContext<FightHistoryContextType | undefined>(undefined);

function transformDbToFightRecord(dbRecord: any): FightRecord {
  return {
    id: dbRecord.id,
    eventId: dbRecord.eventId,
    fighterId: dbRecord.fighterId,
    fighterName: dbRecord.fighterName,
    fighterNickname: dbRecord.fighterNickname,
    opponentId: dbRecord.opponentId,
    opponentName: dbRecord.opponentName,
    opponentNickname: dbRecord.opponentNickname,
    opponentLinked: dbRecord.opponentLinked,
    eventName: dbRecord.eventName,
    eventDate: dbRecord.eventDate,
    eventPromotion: dbRecord.eventPromotion,
    weightClass: dbRecord.weightClass,
    fightType: dbRecord.fightType,
    billing: dbRecord.billing,
    boutOrder: dbRecord.boutOrder,
    roundsScheduled: dbRecord.roundsScheduled,
    roundDurationMinutes: dbRecord.roundDurationMinutes,
    location: dbRecord.location || { city: '', country: '', venue: '' },
    result: dbRecord.result,
    method: dbRecord.method,
    methodDetail: dbRecord.methodDetail,
    round: dbRecord.round,
    time: dbRecord.time,
    fightDurationSeconds: dbRecord.fightDurationSeconds,
    titleFight: dbRecord.titleFight,
    titleFightDetail: dbRecord.titleFightDetail,
    referee: dbRecord.referee,
    round_time_format: dbRecord.roundTimeFormat,
    judges_scores_data: dbRecord.judgesScoresData,
    per_round_stats: dbRecord.perRoundStats,
    isLocked: dbRecord.isLocked,
    stats: dbRecord.stats,
    oddsSnapshot: dbRecord.oddsSnapshot,
    travelDistance: dbRecord.travelDistance,
    venueAltitude: dbRecord.venueAltitude,
    mediaPressure: dbRecord.mediaPressure,
    gymChanges: dbRecord.gymChanges,
    injuryFlags: dbRecord.injuryFlags,
    refereeNotes: dbRecord.refereeNotes,
    penaltyDeductions: dbRecord.penaltyDeductions,
    weightCutSuccess: dbRecord.weightCutSuccess,
    adminNotes: dbRecord.adminNotes,
  };
}

export const FightHistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  const { data: fightHistory = [], isLoading } = useQuery<FightRecord[]>({
    queryKey: ['/api/fights'],
    select: (data: any[]) => data.map(transformDbToFightRecord),
  });

  const bulkMutation = useMutation({
    mutationFn: async ({ fights, mode }: { fights: FightRecord[]; mode: 'add' | 'replace' }) => {
      const response = await fetch('/api/fights/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fights, mode }),
      });
      if (!response.ok) {
        throw new Error(`Failed to bulk import fights: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fights'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (fightId: string) => {
      const response = await fetch(`/api/fights/${fightId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`Failed to delete fight: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fights'] });
    },
  });

  const addFightHistory = useCallback(async (records: FightRecord[], mode: 'add' | 'replace' = 'add') => {
    await bulkMutation.mutateAsync({ fights: records, mode });
  }, [bulkMutation]);

  const getFightsByFighterId = useCallback((fighterId: string): FightRecord[] => {
    return fightHistory.filter((f) => f.fighterId === fighterId);
  }, [fightHistory]);

  const removeFight = useCallback(async (fightId: string) => {
    await deleteMutation.mutateAsync(fightId);
  }, [deleteMutation]);

  const clearFightHistory = useCallback(() => {
  }, []);

  const getFightById = useCallback((fightId: string): FightRecord | undefined => {
    return fightHistory.find(f => f.id === fightId);
  }, [fightHistory]);

  const value: FightHistoryContextType = {
    fightHistory,
    isLoaded: !isLoading,
    addFightHistory,
    getFightsByFighterId,
    removeFight,
    clearFightHistory,
    getFightById,
  };

  return (
    <FightHistoryContext.Provider value={value}>
      {children}
    </FightHistoryContext.Provider>
  );
};

export const useFightHistoryData = (): FightHistoryContextType => {
  const context = useContext(FightHistoryContext);
  if (!context) {
    throw new Error('useFightHistoryData must be used within a FightHistoryProvider');
  }
  return context;
};
