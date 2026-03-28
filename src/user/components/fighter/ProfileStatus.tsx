import React from 'react';
import { Fighter } from '@/shared/types/fighter';
import { Edit, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

interface ProfileStatusProps {
  fighter: Fighter;
}

export const ProfileStatus: React.FC<ProfileStatusProps> = ({ fighter }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).toUpperCase();
  };

  return (
    <div className="glass-card rounded-xl p-6">
      <h3 className="section-header mb-4">Profile Status</h3>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            Last Updated
          </span>
          <span className="text-xs font-mono font-bold text-foreground">
            {formatDate(fighter.lastUpdated)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground flex items-center gap-2">
            <CheckCircle className="h-3.5 w-3.5" />
            Data Status
          </span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-win">
            <span className="h-2 w-2 rounded-full bg-win" />
            Verified
          </span>
        </div>
      </div>

      <Button
        variant="secondary"
        className="w-full"
      >
        <Edit className="h-4 w-4 mr-2" />
        Edit Profile
      </Button>
    </div>
  );
};
