import React from 'react';
import { Fighter, PerformanceMetrics } from '@/shared/types/fighter';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const defaultPerformance: PerformanceMetrics = {
  ko_wins: 0, tko_wins: 0, submission_wins: 0, decision_wins: 0,
  losses_by_ko: 0, losses_by_submission: 0, losses_by_decision: 0,
  finish_rate: 0, avg_fight_time_minutes: 0, strike_accuracy: 0, strike_defense: 0,
  takedown_avg: 0, takedown_accuracy: 0, strikes_landed_per_min: 0, strikes_absorbed_per_min: 0,
  takedown_defense: 0, submission_defense: 0, submission_avg: 0,
  win_streak: 0, loss_streak: 0, longest_win_streak: 0, ko_streak: 0, sub_streak: 0,
};

interface PaceLineChartProps {
  fighter: Fighter;
  corner: 'red' | 'blue';
}

export const PaceLineChart: React.FC<PaceLineChartProps> = ({ fighter, corner }) => {
  // Safe access with fallbacks for missing data
  const performance = fighter.performance ?? defaultPerformance;
  
  const strikesLandedPerMin = performance.strikes_landed_per_min ?? 0;
  const strikesAbsorbedPerMin = performance.strikes_absorbed_per_min ?? 0;
  const finishRate = performance.finish_rate ?? 0;
  const decisionWins = performance.decision_wins ?? 0;
  const koWins = performance.ko_wins ?? 0;
  const tkoWins = performance.tko_wins ?? 0;
  
  // Generate simulated round-by-round pace data based on fighter's cardio profile
  const baseOutput = strikesLandedPerMin * 5;
  const cardioFactor = 100 - strikesAbsorbedPerMin * 8;
  
  // Simulate different pacing styles based on finish rate
  const isFastStarter = finishRate > 70;
  const isGrinder = decisionWins > koWins + tkoWins;
  
  const generatePaceData = () => {
    if (isFastStarter) {
      // Fast starter - high early output, drops off
      return [
        { round: 'R1', output: Math.round(baseOutput * 1.3), label: 'Round 1' },
        { round: 'R2', output: Math.round(baseOutput * 1.1), label: 'Round 2' },
        { round: 'R3', output: Math.round(baseOutput * 0.85), label: 'Round 3' },
        { round: 'R4', output: Math.round(baseOutput * 0.75), label: 'Round 4' },
        { round: 'R5', output: Math.round(baseOutput * 0.65), label: 'Round 5' },
      ];
    } else if (isGrinder) {
      // Grinder - consistent throughout
      return [
        { round: 'R1', output: Math.round(baseOutput * 0.9), label: 'Round 1' },
        { round: 'R2', output: Math.round(baseOutput * 0.95), label: 'Round 2' },
        { round: 'R3', output: Math.round(baseOutput * 1.0), label: 'Round 3' },
        { round: 'R4', output: Math.round(baseOutput * 0.95), label: 'Round 4' },
        { round: 'R5', output: Math.round(baseOutput * 0.9), label: 'Round 5' },
      ];
    } else {
      // Mixed pace
      return [
        { round: 'R1', output: Math.round(baseOutput * 1.1), label: 'Round 1' },
        { round: 'R2', output: Math.round(baseOutput * 1.0), label: 'Round 2' },
        { round: 'R3', output: Math.round(baseOutput * 0.9), label: 'Round 3' },
        { round: 'R4', output: Math.round(baseOutput * 0.8), label: 'Round 4' },
        { round: 'R5', output: Math.round(baseOutput * 0.75), label: 'Round 5' },
      ];
    }
  };

  const data = generatePaceData();

  const cornerColor = corner === 'red' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))';
  const gradientId = `pace-gradient-${corner}`;

  // Determine pace description
  const getPaceDescription = () => {
    if (isFastStarter) return 'Fast Starter';
    if (isGrinder) return 'Consistent Grinder';
    return 'Mixed Pace';
  };

  return (
    <div className="glass-card p-4 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: cornerColor }}
          />
          <h4 className="text-sm font-semibold text-foreground">
            Fight Pace
          </h4>
        </div>
        <span 
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ 
            backgroundColor: corner === 'red' ? 'hsl(var(--destructive) / 0.15)' : 'hsl(var(--primary) / 0.15)',
            color: cornerColor
          }}
        >
          {getPaceDescription()}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        {fighter.firstName} {fighter.lastName} — Output by Round
      </p>
      
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={data}
            margin={{ left: -10, right: 10, top: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop 
                  offset="5%" 
                  stopColor={cornerColor} 
                  stopOpacity={0.4}
                />
                <stop 
                  offset="95%" 
                  stopColor={cornerColor} 
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))"
              strokeOpacity={0.3}
              vertical={false}
            />
            <XAxis 
              dataKey="round"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={35}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`${value} strikes`, 'Output']}
              labelFormatter={(label) => `Round ${label.replace('R', '')}`}
            />
            <Area
              type="monotone"
              dataKey="output"
              stroke={cornerColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={{ r: 4, fill: cornerColor, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: cornerColor, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
