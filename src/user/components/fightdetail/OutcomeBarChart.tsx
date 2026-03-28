import React from 'react';
import { Fighter, PerformanceMetrics } from '@/shared/types/fighter';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts';

const defaultPerformance: PerformanceMetrics = {
  ko_wins: 0, tko_wins: 0, submission_wins: 0, decision_wins: 0,
  losses_by_ko: 0, losses_by_submission: 0, losses_by_decision: 0,
  finish_rate: 0, avg_fight_time_minutes: 0, strike_accuracy: 0, strike_defense: 0,
  takedown_avg: 0, takedown_accuracy: 0, strikes_landed_per_min: 0, strikes_absorbed_per_min: 0,
  takedown_defense: 0, submission_defense: 0, submission_avg: 0,
  win_streak: 0, loss_streak: 0, longest_win_streak: 0, ko_streak: 0, sub_streak: 0,
};

interface OutcomeBarChartProps {
  fighter: Fighter;
  corner: 'red' | 'blue';
}

export const OutcomeBarChart: React.FC<OutcomeBarChartProps> = ({ fighter, corner }) => {
  // Safe access with fallbacks for missing data
  const record = fighter.record ?? { wins: 0, losses: 0, draws: 0, noContests: 0 };
  const performance = fighter.performance ?? defaultPerformance;
  
  const totalWins = record.wins || 1; // Avoid division by zero
  const koWins = performance.ko_wins ?? 0;
  const tkoWins = performance.tko_wins ?? 0;
  const submissionWins = performance.submission_wins ?? 0;
  const decisionWins = performance.decision_wins ?? 0;
  
  const data = [
    {
      method: 'KO/TKO',
      value: Math.round(((koWins + tkoWins) / totalWins) * 100),
      count: koWins + tkoWins,
    },
    {
      method: 'SUB',
      value: Math.round((submissionWins / totalWins) * 100),
      count: submissionWins,
    },
    {
      method: 'DEC',
      value: Math.round((decisionWins / totalWins) * 100),
      count: decisionWins,
    },
  ];

  const baseColor = corner === 'red' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))';
  const colors = corner === 'red' 
    ? ['hsl(0, 84%, 50%)', 'hsl(0, 84%, 40%)', 'hsl(0, 84%, 30%)']
    : ['hsl(221, 83%, 60%)', 'hsl(221, 83%, 50%)', 'hsl(221, 83%, 40%)'];

  return (
    <div className="glass-card p-4 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <div 
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: baseColor }}
        />
        <h4 className="text-sm font-semibold text-foreground">
          Fight Outcomes
        </h4>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        {fighter.firstName} {fighter.lastName} — Win Distribution
      </p>
      
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            layout="vertical"
            margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
          >
            <XAxis 
              type="number" 
              domain={[0, 100]}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis 
              type="category" 
              dataKey="method"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={50}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number, name: string, props: any) => [
                `${value}% (${props.payload.count} wins)`,
                props.payload.method
              ]}
              cursor={{ fill: 'hsl(var(--accent) / 0.3)' }}
            />
            <Bar 
              dataKey="value" 
              radius={[0, 4, 4, 0]}
              maxBarSize={28}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-3">
        {data.map((item, index) => (
          <div key={item.method} className="flex items-center gap-1.5">
            <div 
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: colors[index] }}
            />
            <span className="text-xs text-muted-foreground">
              {item.method}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
