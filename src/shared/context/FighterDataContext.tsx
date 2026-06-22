import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Fighter } from '@/shared/types/fighter';

interface FighterDataContextType {
  fighters: Fighter[];
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  setFighters: (fighters: Fighter[]) => void;
  addFighters: (fighters: Fighter[], mode?: 'add' | 'replace') => void;
  updateFighter: (id: string, data: Partial<Fighter>) => void;
  removeFighter: (id: string) => void;
  clearFighters: () => void;
  getFighterById: (id: string) => Fighter | undefined;
  refreshFighters: () => Promise<void>;
}

const FighterDataContext = createContext<FighterDataContextType | undefined>(undefined);

const EMPTY_PERFORMANCE = {
  ko_wins: 0,
  tko_wins: 0,
  submission_wins: 0,
  decision_wins: 0,
  losses_by_ko: 0,
  losses_by_submission: 0,
  losses_by_decision: 0,
  finish_rate: 0,
  avg_fight_time_minutes: 0,
  strike_accuracy: 0,
  strike_defense: 0,
  takedown_avg: 0,
  takedown_accuracy: 0,
  strikes_landed_per_min: 0,
  strikes_absorbed_per_min: 0,
  takedown_defense: 0,
  submission_defense: 0,
  submission_avg: 0,
  win_streak: 0,
  loss_streak: 0,
  longest_win_streak: 0,
  ko_streak: 0,
  sub_streak: 0,
};

// Transform database record (snake_case) to frontend Fighter type (camelCase)
function transformDbToFighter(dbRecord: any): Fighter {
  return {
    id: dbRecord.id,
    firstName: dbRecord.firstName,
    lastName: dbRecord.lastName,
    nickname: dbRecord.nickname,
    dateOfBirth: dbRecord.dateOfBirth ? new Date(dbRecord.dateOfBirth).toISOString() : '',
    nationality: dbRecord.nationality,
    gender: dbRecord.gender,
    weightClass: dbRecord.weightClass,
    stance: dbRecord.stance,
    gym: dbRecord.gym,
    headCoach: dbRecord.headCoach,
    team: dbRecord.team,
    fightingOutOf: dbRecord.fightingOutOf,
    style: dbRecord.style,
    bio: dbRecord.bio,
    imageUrl: dbRecord.imageUrl,
    bodyImageUrl: dbRecord.bodyImageUrl,
    organization: dbRecord.organization,
    physicalStats: {
      ...(dbRecord.physicalStats || {}),
      weight: dbRecord.weight ?? dbRecord.physicalStats?.weight ?? 0,
    },
    record: {
      wins: dbRecord.record?.wins ?? 0,
      losses: dbRecord.record?.losses ?? 0,
      draws: dbRecord.record?.draws ?? 0,
      noContests: dbRecord.record?.noContests ?? 0,
    },
    performance: { ...EMPTY_PERFORMANCE, ...(dbRecord.performance || {}) },
    history: [],
    notes: dbRecord.notes || [],
    riskSignals: dbRecord.riskSignals || [],
    odds: dbRecord.odds,
    campStartDate: dbRecord.campStartDate,
    trainingPartners: dbRecord.trainingPartners,
    dominantHand: dbRecord.dominantHand,
    dominantFoot: dbRecord.dominantFoot,
    isActive: dbRecord.isActive,
    ranking: dbRecord.ranking,
    rankGlobal: dbRecord.rankGlobal,
    rankPromotion: dbRecord.rankPromotion,
    isChampion: dbRecord.isChampion,
    isVerified: dbRecord.isVerified,
    lastUpdated: dbRecord.lastUpdated,
    createdAt: dbRecord.createdAt,
  };
}

// Transform frontend Fighter to database format
function transformFighterToDb(fighter: Fighter): any {
  return {
    id: fighter.id,
    firstName: fighter.firstName,
    lastName: fighter.lastName,
    nickname: fighter.nickname,
    dateOfBirth: fighter.dateOfBirth,
    nationality: fighter.nationality,
    gender: fighter.gender,
    weightClass: fighter.weightClass,
    stance: fighter.stance,
    gym: fighter.gym,
    headCoach: fighter.headCoach,
    team: fighter.team,
    fightingOutOf: fighter.fightingOutOf,
    style: fighter.style,
    bio: fighter.bio,
    imageUrl: fighter.imageUrl,
    bodyImageUrl: fighter.bodyImageUrl,
    organization: fighter.organization,
    weight: fighter.physicalStats?.weight || null,
    physicalStats: fighter.physicalStats,
    wins: fighter.record?.wins ?? 0,
    losses: fighter.record?.losses ?? 0,
    draws: fighter.record?.draws ?? 0,
    nc: fighter.record?.noContests ?? 0,
    record: fighter.record,
    performance: fighter.performance,
    notes: fighter.notes || [],
    riskSignals: fighter.riskSignals || [],
    odds: fighter.odds,
    campStartDate: fighter.campStartDate,
    trainingPartners: fighter.trainingPartners,
    dominantHand: fighter.dominantHand,
    dominantFoot: fighter.dominantFoot,
    isActive: fighter.isActive,
    ranking: fighter.ranking,
    rankGlobal: fighter.rankGlobal,
    rankPromotion: fighter.rankPromotion,
    isChampion: fighter.isChampion,
    isVerified: fighter.isVerified,
    lastUpdated: fighter.lastUpdated,
    createdAt: fighter.createdAt,
  };
}

export const FighterDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [fighters, setFightersState] = useState<Fighter[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch fighters from API on mount
  const fetchFighters = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/fighters');
      if (!response.ok) {
        throw new Error(`Failed to fetch fighters: ${response.statusText}`);
      }
      const data = await response.json();
      const transformed = data.map(transformDbToFighter);
      setFightersState(transformed);
      setIsLoaded(true);
    } catch (err) {
      console.error('Failed to load fighters from API:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setFightersState([]);
      setIsLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFighters();
  }, [fetchFighters]);

  const setFighters = useCallback((newFighters: Fighter[]) => {
    setFightersState(newFighters);
  }, []);

  // Add fighters via API bulk endpoint
  const addFighters = useCallback(async (newFighters: Fighter[], mode: 'add' | 'replace' = 'add') => {
    try {
      const fightersToSave = newFighters.map(transformFighterToDb);
      const response = await fetch('/api/fighters/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fighters: fightersToSave }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save fighters: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if ((result.created ?? 0) + (result.updated ?? 0) > 0) {
        // Fighters were actually persisted — refresh from DB to get canonical state
        await fetchFighters();
      } else {
        // API accepted the request but inserted nothing (e.g. all failed per-item validation).
        // Fall back to local state so fighters stay visible in this session.
        console.error('Bulk import returned 0 created/updated. Errors:', result.errorDetails);
        setFightersState(prev => {
          const next = [...prev];
          newFighters.forEach(fighter => {
            const existingIndex = next.findIndex(f => f.id === fighter.id);
            if (existingIndex >= 0) {
              if (mode === 'replace') next[existingIndex] = fighter;
            } else {
              next.push(fighter);
            }
          });
          return next;
        });
      }
    } catch (err) {
      console.error('Failed to add fighters:', err);
      // Network/auth failure — update local state for UI responsiveness
      setFightersState(prev => {
        const next = [...prev];
        newFighters.forEach(fighter => {
          const existingIndex = next.findIndex(f => f.id === fighter.id);
          if (existingIndex >= 0) {
            if (mode === 'replace') next[existingIndex] = fighter;
          } else {
            next.push(fighter);
          }
        });
        return next;
      });
    }
  }, [fetchFighters]);

  // Update fighter via API
  const updateFighter = useCallback(async (id: string, data: Partial<Fighter>) => {
    // Find existing fighter first
    const existingFighter = fighters.find(f => f.id === id);
    if (!existingFighter) {
      console.error('Cannot update fighter: fighter not found in local state', id);
      return;
    }
    
    // Optimistic update for UI
    const updatedData = { ...data, lastUpdated: new Date().toISOString() };
    setFightersState(prev => 
      prev.map(fighter => 
        fighter.id === id 
          ? { ...fighter, ...updatedData }
          : fighter
      )
    );
    
    try {
      // Send only the partial update - server will merge with existing
      const response = await fetch(`/api/fighters/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update fighter: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Failed to update fighter:', err);
      // Refresh to restore correct state if update failed
      await fetchFighters();
    }
  }, [fighters, fetchFighters]);

  // Remove fighter via API
  const removeFighter = useCallback(async (id: string) => {
    // Optimistic update
    setFightersState(prev => prev.filter(fighter => fighter.id !== id));
    
    try {
      const response = await fetch(`/api/fighters/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete fighter: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Failed to delete fighter:', err);
      // Refresh to restore state if delete failed
      await fetchFighters();
    }
  }, [fetchFighters]);

  const clearFighters = useCallback(() => {
    setFightersState([]);
  }, []);

  const getFighterById = useCallback((id: string): Fighter | undefined => {
    return fighters.find(f => f.id === id);
  }, [fighters]);

  const refreshFighters = useCallback(async () => {
    await fetchFighters();
  }, [fetchFighters]);

  const value: FighterDataContextType = {
    fighters,
    isLoaded,
    isLoading,
    error,
    setFighters,
    addFighters,
    updateFighter,
    removeFighter,
    clearFighters,
    getFighterById,
    refreshFighters,
  };

  return (
    <FighterDataContext.Provider value={value}>
      {children}
    </FighterDataContext.Provider>
  );
};

export const useFighterData = (): FighterDataContextType => {
  const context = useContext(FighterDataContext);
  if (!context) {
    throw new Error('useFighterData must be used within a FighterDataProvider');
  }
  return context;
};
