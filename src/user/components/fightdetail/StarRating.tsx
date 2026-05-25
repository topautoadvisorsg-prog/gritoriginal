import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface StarRatingProps {
  value: number;            // current rating (0–10, 0 = unset)
  onChange?: (v: number) => void;
  max?: number;             // default 10
  size?: number;            // px
  readOnly?: boolean;
  label?: string;
  description?: string;
}

/**
 * Star rating component — 1 to 10 (blueprint §9).
 * Hover preview while picking, click to commit.
 */
export const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  max = 10,
  size = 22,
  readOnly = false,
  label,
  description,
}) => {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;

  return (
    <div className="flex flex-col gap-1.5">
      {(label || description) && (
        <div className="flex items-baseline justify-between">
          <div>
            {label && <div className="text-sm font-semibold text-foreground">{label}</div>}
            {description && (
              <div className="text-[11px] text-muted-foreground">{description}</div>
            )}
          </div>
          <div className="text-xs font-mono text-muted-foreground tabular-nums">
            {display > 0 ? `${display}/${max}` : '—'}
          </div>
        </div>
      )}
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={() => setHover(null)}
        role="radiogroup"
        aria-label={label || 'Rating'}
      >
        {Array.from({ length: max }, (_, i) => {
          const star = i + 1;
          const filled = star <= display;
          return (
            <button
              key={star}
              type="button"
              disabled={readOnly}
              onMouseEnter={() => !readOnly && setHover(star)}
              onClick={() => !readOnly && onChange?.(star)}
              className={cn(
                'p-0.5 rounded transition-transform',
                !readOnly && 'hover:scale-110 cursor-pointer',
                readOnly && 'cursor-default',
              )}
              role="radio"
              aria-checked={star === value}
              aria-label={`${star} out of ${max}`}
            >
              <Star
                size={size}
                className={cn(
                  'transition-colors',
                  filled ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-muted-foreground/50',
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
