import React from 'react';
import { Fighter } from '@/shared/types/fighter';
import { StatCard } from '@/shared/components/ui/StatCard';
import { Ruler, Target, Footprints, Cake, MapPin, Building, Users, User } from 'lucide-react';

interface FighterStatsGridProps {
  fighter: Fighter;
}

// Helper to format DOB and calculate age
function formatDateOfBirth(dob: string): { formatted: string; age: number } {
  if (!dob) return { formatted: 'Unknown', age: 0 };
  
  try {
    const date = new Date(dob);
    const now = new Date();
    const age = Math.floor((now.getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    const formatted = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    return { formatted, age };
  } catch {
    return { formatted: dob, age: 0 };
  }
}

export const FighterStatsGrid: React.FC<FighterStatsGridProps> = ({ fighter }) => {
  const stats = fighter.physicalStats;
  const { formatted: dobFormatted, age: calculatedAge } = formatDateOfBirth(fighter.dateOfBirth);
  const displayAge = stats.age || calculatedAge;

  return (
    <div className="space-y-4">
      {/* Bio Info Card */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="section-header mb-4">Fighter Bio</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Cake className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="data-label block">Date of Birth</span>
              <span className="font-medium text-foreground">{dobFormatted}</span>
              <span className="text-muted-foreground text-sm ml-1">({displayAge} yrs)</span>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="data-label block">Nationality</span>
              <span className="font-medium text-foreground">{fighter.nationality || 'Unknown'}</span>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="data-label block">Gym</span>
              <span className="font-medium text-foreground">{fighter.gym || 'Unknown'}</span>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="data-label block">Team</span>
              <span className="font-medium text-foreground">{fighter.team || fighter.gym || 'Unknown'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Physical Attributes Card */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="section-header mb-4">Physical Attributes</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Height"
            value={stats.height || 'N/A'}
            icon={Ruler}
            size="md"
          />
          <StatCard
            label="Reach"
            value={stats.reach || 'N/A'}
            icon={Target}
            size="md"
          />
          <StatCard
            label="Leg Reach"
            value={stats.leg_reach || 'N/A'}
            icon={Footprints}
            size="md"
          />
          <StatCard
            label="Stance"
            value={fighter.stance}
            icon={User}
            size="md"
          />
        </div>
      </div>
    </div>
  );
};
