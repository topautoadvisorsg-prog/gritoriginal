import { useMemo } from 'react';
import { useFighterData } from '@/shared/context/FighterDataContext';
import { Fighter, Organization, WeightClass } from '@/shared/types/fighter';

/**
 * Custom hook for consuming fighter data with helper utilities.
 * All fighter data access should go through this hook.
 */
export const useFighters = () => {
  const { 
    fighters, 
    isLoaded, 
    addFighters, 
    updateFighter, 
    removeFighter, 
    clearFighters,
    getFighterById 
  } = useFighterData();

  // Memoized filter helpers
  const getFightersByOrganization = useMemo(() => {
    return (org: Organization): Fighter[] => {
      return fighters.filter(f => f.organization === org);
    };
  }, [fighters]);

  const getFightersByWeightClass = useMemo(() => {
    return (weightClass: WeightClass): Fighter[] => {
      return fighters.filter(f => f.weightClass === weightClass);
    };
  }, [fighters]);

  const getFightersByGender = useMemo(() => {
    return (gender: 'Male' | 'Female'): Fighter[] => {
      return fighters.filter(f => f.gender === gender);
    };
  }, [fighters]);

  const getChampions = useMemo(() => {
    return fighters.filter(f => f.isChampion);
  }, [fighters]);

  const getActiveFighters = useMemo(() => {
    return fighters.filter(f => f.isActive);
  }, [fighters]);

  // Search helper
  const searchFighters = useMemo(() => {
    return (query: string): Fighter[] => {
      if (!query.trim()) return fighters;
      const lowerQuery = query.toLowerCase();
      return fighters.filter(f =>
        f.firstName.toLowerCase().includes(lowerQuery) ||
        f.lastName.toLowerCase().includes(lowerQuery) ||
        f.nickname?.toLowerCase().includes(lowerQuery)
      );
    };
  }, [fighters]);

  // Create a fighter map for efficient lookups
  const fighterMap = useMemo(() => {
    const map = new Map<string, Fighter>();
    fighters.forEach(f => map.set(f.id, f));
    return map;
  }, [fighters]);

  return {
    // Data
    fighters,
    isLoaded,
    fighterMap,
    
    // Stats
    totalFighters: fighters.length,
    champions: getChampions,
    activeFighters: getActiveFighters,
    
    // Actions
    addFighters,
    updateFighter,
    removeFighter,
    clearFighters,
    
    // Lookups
    getFighterById,
    getFightersByOrganization,
    getFightersByWeightClass,
    getFightersByGender,
    searchFighters,
  };
};
