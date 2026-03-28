import React from 'react';
import { Link } from 'react-router-dom';
import { Fighter } from '@/shared/types/fighter';
import { SkillRadarChart } from './SkillRadarChart';
import { OutcomeBarChart } from './OutcomeBarChart';
import { PaceLineChart } from './PaceLineChart';
import { Activity, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import { Button } from '@/shared/components/ui/button';

interface WarRoomAnalyticsProps {
  fighter1: Fighter;
  fighter2: Fighter;
}

export const WarRoomAnalytics: React.FC<WarRoomAnalyticsProps> = ({ fighter1, fighter2 }) => {
  const { user } = useAuth();

  // Check if user has AI access enabled
  // Admin bypass is implied if admin role has enabled=true by default, but let's be explicit
  const hasAiAccess = user?.role === 'admin' || user?.aiPreferences?.enabled === true;

  return (
    <section className="space-y-6 relative overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/20">
            <Activity className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              War Room Analytics
              {!hasAiAccess && <Lock className="w-4 h-4 text-muted-foreground" />}
            </h2>
            <p className="text-sm text-muted-foreground">
              Historical patterns and tendencies — not predictions
            </p>
          </div>
        </div>

        {!hasAiAccess && (
          <div className="hidden md:block">
            <Button asChild size="sm" className="bg-gradient-to-r from-accent to-primary border-0">
              <Link to="/settings">
                <Sparkles className="w-4 h-4 mr-2" />
                Unlock AI Insights
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Fighter Names Header */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive" />
          <span className="font-semibold text-foreground">
            {fighter1.firstName} {fighter1.lastName}
          </span>
          <span className="text-xs text-muted-foreground">
            ({fighter1.record.wins}-{fighter1.record.losses}-{fighter1.record.draws})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="font-semibold text-foreground">
            {fighter2.firstName} {fighter2.lastName}
          </span>
          <span className="text-xs text-muted-foreground">
            ({fighter2.record.wins}-{fighter2.record.losses}-{fighter2.record.draws})
          </span>
        </div>
      </div>

      {/* Content Container - Blurred if no access */}
      <div className={`space-y-6 transition-all duration-500 ${!hasAiAccess ? 'blur-md opacity-50 select-none pointer-events-none' : ''}`}>

        {/* Charts Grid - 3 charts per fighter */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Fighter 1 - Skill Radar */}
          <SkillRadarChart fighter={fighter1} corner="red" />
          {/* Fighter 2 - Skill Radar */}
          <SkillRadarChart fighter={fighter2} corner="blue" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Fighter 1 - Outcome Bar Chart */}
          <OutcomeBarChart fighter={fighter1} corner="red" />
          {/* Fighter 2 - Outcome Bar Chart */}
          <OutcomeBarChart fighter={fighter2} corner="blue" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Fighter 1 - Pace Line Chart */}
          <PaceLineChart fighter={fighter1} corner="red" />
          {/* Fighter 2 - Pace Line Chart */}
          <PaceLineChart fighter={fighter2} corner="blue" />
        </div>
      </div>

      {/* Data Disclaimer */}
      {hasAiAccess && (
        <p className="text-center text-xs text-muted-foreground/70 pt-4">
          Analytics based on historical fight data. These patterns represent past performance, not predictions.
        </p>
      )}

      {/* Paywall Overlay */}
      {!hasAiAccess && (
        <div className="absolute inset-0 top-[100px] z-10 flex flex-col items-center justify-center p-6 text-center">
          <div className="p-6 max-w-md w-full bg-card/80 backdrop-blur-xl border border-accent/20 rounded-2xl shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center mx-auto shadow-lg shadow-accent/20">
              <Lock className="w-6 h-6 text-white" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">Premium Analytics Locked</h3>
              <p className="text-sm text-muted-foreground">
                Get access to advanced fighter metrics, skill radar charts, and AI-powered performance analysis.
              </p>
            </div>

            <Button asChild size="lg" className="w-full bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 border-0 shadow-lg shadow-accent/20">
              <Link to="/settings">
                <Sparkles className="w-4 h-4 mr-2" />
                Upgrade Integration
              </Link>
            </Button>

            <p className="text-xs text-muted-foreground/70">
              Already have access? <Link to="/auth" className="text-accent hover:underline">Log in</Link>
            </p>
          </div>
        </div>
      )}
    </section>
  );
};
