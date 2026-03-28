import React from 'react';
import { Fighter, PerformanceMetrics } from '@/shared/types/fighter';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const defaultPerformance: PerformanceMetrics = {
  ko_wins: 0, tko_wins: 0, submission_wins: 0, decision_wins: 0,
  losses_by_ko: 0, losses_by_submission: 0, losses_by_decision: 0,
  finish_rate: 0, avg_fight_time_minutes: 0, strike_accuracy: 0, strike_defense: 0,
  takedown_avg: 0, takedown_accuracy: 0, strikes_landed_per_min: 0, strikes_absorbed_per_min: 0,
  takedown_defense: 0, submission_defense: 0, submission_avg: 0,
  win_streak: 0, loss_streak: 0, longest_win_streak: 0, ko_streak: 0, sub_streak: 0,
};

interface SkillRadarChartProps {
  fighter: Fighter;
  corner: 'red' | 'blue';
}

export const SkillRadarChart: React.FC<SkillRadarChartProps> = ({ fighter, corner }) => {
  // Safe access with fallbacks for missing data
  const record = fighter.record ?? { wins: 0, losses: 0, draws: 0, noContests: 0 };
  const performance = fighter.performance ?? defaultPerformance;

  const strikesLandedPerMin = performance.strikes_landed_per_min ?? 0;
  const strikeAccuracy = performance.strike_accuracy ?? 0;
  const takedownAccuracy = performance.takedown_accuracy ?? 0;
  const takedownDefense = performance.takedown_defense ?? 0;
  const submissionWins = performance.submission_wins ?? 0;
  const strikesAbsorbedPerMin = performance.strikes_absorbed_per_min ?? 0;

  // Generate skill data from fighter stats
  const data = [
    {
      skill: 'SLpM',
      value: Math.min(100, strikesLandedPerMin * 10), // Normalized approx
      fullMark: 100,
      raw: strikesLandedPerMin
    },
    {
      skill: 'Str. Acc',
      value: strikeAccuracy,
      fullMark: 100,
      raw: strikeAccuracy
    },
    {
      skill: 'SApM',
      value: Math.min(100, (10 - strikesAbsorbedPerMin) * 10), // Lower is better, inverted
      fullMark: 100,
      raw: strikesAbsorbedPerMin
    },
    {
      skill: 'Str. Def',
      value: performance.strike_defense ?? 0,
      fullMark: 100,
      raw: performance.strike_defense ?? 0
    },
    {
      skill: 'TD Avg',
      value: Math.min(100, (performance.takedown_avg ?? 0) * 20), // Normalized
      fullMark: 100,
      raw: performance.takedown_avg ?? 0
    },
    {
      skill: 'TD Acc',
      value: takedownAccuracy,
      fullMark: 100,
      raw: takedownAccuracy
    },
    {
      skill: 'TD Def',
      value: takedownDefense,
      fullMark: 100,
      raw: takedownDefense
    },
    {
      skill: 'Sub Avg',
      value: Math.min(100, (performance.submission_avg ?? 0) * 30), // Normalized
      fullMark: 100,
      raw: performance.submission_avg ?? 0
    },
  ];

  const cornerColor = corner === 'red' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))';
  const cornerFill = corner === 'red' ? 'hsl(var(--destructive) / 0.3)' : 'hsl(var(--primary) / 0.3)';

  return (
    <div className="glass-card p-4 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: cornerColor }}
        />
        <h4 className="text-sm font-semibold text-foreground">
          Skill Distribution
        </h4>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        {fighter.firstName} {fighter.lastName}
      </p>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid
              stroke="hsl(var(--border))"
              strokeOpacity={0.5}
            />
            <PolarAngleAxis
              dataKey="skill"
              tick={{
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 10,
              }}
              tickLine={false}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />
            <Radar
              name={fighter.lastName}
              dataKey="value"
              stroke={cornerColor}
              fill={cornerFill}
              strokeWidth={2}
              dot={{ r: 3, fill: cornerColor }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`${Math.round(value)}%`, '']}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
