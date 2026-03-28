import React from 'react';
import { Star } from 'lucide-react';
import { ProgressBar } from '../ProgressBar';
import { cn } from '@/shared/lib/utils';

interface StarLevelWidgetProps {
    starLevel: number;
}

export const StarLevelWidget: React.FC<StarLevelWidgetProps> = ({ starLevel }) => {
    // starLevel is 0-5. 
    // Example: 3.25 means 3 full stars + 25% to the 4th star.
    const fullStars = Math.floor(starLevel);
    const partialStar = starLevel % 1;

    return (
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Performance Status
            </h3>

            <div className="flex items-end justify-between mb-4">
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                            key={i}
                            className={cn(
                                "h-8 w-8",
                                i <= fullStars
                                    ? "fill-amber-400 text-amber-400"
                                    : i === fullStars + 1 && partialStar > 0
                                        ? "text-amber-400/40" // Partial star rendering simplified to faint star
                                        : "text-muted-foreground/20"
                            )}
                        />
                    ))}
                </div>
                <div className="text-right">
                    <span className="text-3xl font-display text-foreground leading-none">{starLevel.toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground ml-1">/ 5.0</span>
                </div>
            </div>

            <ProgressBar
                value={starLevel / 5}
                label="Star Progression"
                targetLabel={fullStars < 5 ? `${fullStars + 1} Stars` : "Max Rank"}
                color="gold"
                showPercentage={false}
            />

            <p className="text-[11px] text-muted-foreground mt-4 italic">
                Earn stars by maintaining a positive ROI and meeting the minimum pick requirement for events.
            </p>
        </div>
    );
};
