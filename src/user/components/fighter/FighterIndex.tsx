import React, { useState, useMemo } from 'react';
import { Fighter, Organization, WeightClass, WEIGHT_CLASSES_MALE, WEIGHT_CLASSES_FEMALE } from '@/shared/types/fighter';
import { useFighters } from '@/shared/hooks/useFighters';
import { OrganizationSelector } from './OrganizationSelector';
import { WeightClassSection } from './WeightClassSection';
import { Input } from '@/shared/components/ui/input';
import { Search, Filter, Users, Trophy, Upload, Database } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

interface FighterIndexProps {
  onFighterSelect: (fighter: Fighter) => void;
  onNavigateToImport?: () => void;
}

export const FighterIndex: React.FC<FighterIndexProps> = ({ onFighterSelect, onNavigateToImport }) => {
  const { fighters, isLoaded } = useFighters();
  const [organization, setOrganization] = useState<Organization>('UFC');
  const [searchQuery, setSearchQuery] = useState('');
  const [weightClassFilter, setWeightClassFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');

  // Filter fighters
  const filteredFighters = useMemo(() => {
    let result = fighters.filter(f => f.organization === organization);
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(f =>
        f.firstName.toLowerCase().includes(query) ||
        f.lastName.toLowerCase().includes(query) ||
        f.nickname?.toLowerCase().includes(query)
      );
    }
    
    if (weightClassFilter !== 'all') {
      result = result.filter(f => f.weightClass === weightClassFilter);
    }
    
    if (genderFilter !== 'all') {
      result = result.filter(f => f.gender === genderFilter);
    }
    
    return result;
  }, [fighters, organization, searchQuery, weightClassFilter, genderFilter]);

  // Group by weight class
  const fightersByWeightClass = useMemo(() => {
    const groups: Record<string, Fighter[]> = {};
    
    // Create ordered list based on gender filter
    const orderedClasses: readonly WeightClass[] = 
      genderFilter === 'Female' 
        ? WEIGHT_CLASSES_FEMALE 
        : genderFilter === 'Male'
          ? WEIGHT_CLASSES_MALE
          : [...WEIGHT_CLASSES_MALE, ...WEIGHT_CLASSES_FEMALE];
    
    orderedClasses.forEach(wc => {
      const fighters = filteredFighters.filter(f => f.weightClass === wc);
      if (fighters.length > 0) {
        groups[wc] = fighters;
      }
    });
    
    return groups;
  }, [filteredFighters, genderFilter]);

  // Stats
  const totalFighters = filteredFighters.length;
  const totalChampions = filteredFighters.filter(f => f.isChampion).length;
  const totalDivisions = Object.keys(fightersByWeightClass).length;

  // Empty state - no fighters imported yet
  if (isLoaded && fighters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
          <Database className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">No Fighter Data</h2>
        <p className="text-muted-foreground max-w-md mb-6">
          Your fighter database is empty. Import fighter data to populate profiles, rankings, and analytics.
        </p>
        {onNavigateToImport && (
          <Button onClick={onNavigateToImport} className="gap-2">
            <Upload className="h-4 w-4" />
            Go to Import
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Controls */}
      <div className="space-y-4">
        {/* Organization Selector */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <h2 className="font-display text-xl tracking-wide uppercase text-foreground">
              MMA Rankings
            </h2>
            <OrganizationSelector
              selected={organization}
              onChange={setOrganization}
            />
          </div>
          
          {/* Stats Badges */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <Users className="h-3 w-3" />
              {totalFighters} Fighters
            </Badge>
            <Badge variant="secondary" className="gap-1.5">
              <Trophy className="h-3 w-3 text-accent" />
              {totalChampions} Champions
            </Badge>
            <Badge variant="outline" className="gap-1.5 text-muted-foreground">
              {totalDivisions} Divisions
            </Badge>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search fighters by name or nickname..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/50 border-border/50 focus:border-primary"
            />
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            
            {/* Gender Filter */}
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="w-[130px] bg-card/50 border-border/50">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Divisions</SelectItem>
                <SelectItem value="Male">Men's</SelectItem>
                <SelectItem value="Female">Women's</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Weight Class Filter */}
            <Select value={weightClassFilter} onValueChange={setWeightClassFilter}>
              <SelectTrigger className="w-[180px] bg-card/50 border-border/50">
                <SelectValue placeholder="Weight Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Weight Classes</SelectItem>
                {[...WEIGHT_CLASSES_MALE, ...WEIGHT_CLASSES_FEMALE].map(wc => (
                  <SelectItem key={wc} value={wc}>{wc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Weight Class Sections */}
      <div className="space-y-2">
        {Object.entries(fightersByWeightClass).map(([weightClass, fighters], index) => (
          <WeightClassSection
            key={weightClass}
            weightClass={weightClass as WeightClass}
            fighters={fighters}
            onFighterClick={onFighterSelect}
            defaultOpen={index < 3} // Open first 3 divisions by default
          />
        ))}
        
        {Object.keys(fightersByWeightClass).length === 0 && fighters.length > 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No fighters found matching your criteria.</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Try adjusting your search or filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
