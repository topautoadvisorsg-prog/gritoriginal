import React, { useState, useEffect } from 'react';
import { Fighter } from '@/shared/types/fighter';
import { FighterImage } from '@/shared/components/FighterImage';
import { Badge } from '@/shared/components/ui/ResultBadge';

interface FighterIdentityBlockProps {
  fighter: Fighter;
}

/**
 * FighterIdentityBlock - Core Identity Display
 * 
 * Displays fighter's identity with support for 2 images:
 * - imageUrl: Primary profile/headshot image
 * - bodyImageUrl: Full body fight stance image (optional)
 * 
 * Mobile requests the headshot; desktop may use the body image.
 */
export const FighterIdentityBlock: React.FC<FighterIdentityBlockProps> = ({ fighter }) => {
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setOffsetY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fullName = `${fighter.firstName} ${fighter.lastName}`;
  const recordString = `${fighter.record.wins}-${fighter.record.losses}-${fighter.record.draws}`;

  return (
    <div className="relative h-[580px] w-full rounded-2xl overflow-hidden glass-card group">
      {/* Fighter Image with Parallax */}
      <div
        className="absolute inset-x-0 h-[120%] -top-[10%] z-10 transition-transform duration-500 group-hover:scale-105"
        style={{ transform: `translateY(${offsetY * 0.3}px)` }}
      >
        <FighterImage fighter={fighter} variant="hero" alt={fullName} />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-20" />

      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-30">
        <Badge variant="primary" size="md">
          {fighter.isActive ? 'ACTIVE' : 'INACTIVE'}
        </Badge>

        {fighter.ranking && (
          <Badge variant="accent" size="md">
            #{fighter.ranking} RANKED
          </Badge>
        )}
      </div>

      {/* Champion Badge */}
      {fighter.isChampion && (
        <div className="absolute top-16 left-4 z-30">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/20 border border-accent/50">
            <span className="text-accent text-lg">👑</span>
            <span className="text-xs font-bold tracking-wider text-accent">CHAMPION</span>
          </div>
        </div>
      )}

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-30">
        <div className="flex items-end justify-between mb-4">
          <div>
            {fighter.nickname && (
              <p className="text-muted-foreground text-sm font-medium mb-1">
                "{fighter.nickname}"
              </p>
            )}
            <h2 className="text-3xl md:text-4xl font-display tracking-wide text-foreground uppercase">
              {fullName}
            </h2>
          </div>

        </div>

      </div>
    </div>
  );
};
