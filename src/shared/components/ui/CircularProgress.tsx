import React from 'react';
import { cn } from '@/shared/lib/utils';

interface CircularProgressProps {
  value: number;
  label: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  label,
  size = 100,
  strokeWidth = 8,
  className,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const getColor = (val: number) => {
    if (val >= 70) return 'hsl(var(--win))';
    if (val >= 50) return 'hsl(var(--accent))';
    return 'hsl(var(--loss))';
  };

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg className="absolute transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />
        </svg>
        
        {/* Progress circle */}
        <svg className="absolute transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getColor(value)}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
            style={{
              filter: `drop-shadow(0 0 8px ${getColor(value)})`,
            }}
          />
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold font-mono text-foreground">
            {value}%
          </span>
        </div>
      </div>
      <span className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">
        {label}
      </span>
    </div>
  );
};
