import React, { useState, useEffect } from 'react';
import { Fighter } from '@/shared/types/fighter';
import { Badge } from '@/shared/components/ui/ResultBadge';
import { Eye, User } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

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
 * Image Toggle: Switches between profile and body image (if available)
 * Falls back to placeholder if image fails to load.
 */
export const FighterIdentityBlock: React.FC<FighterIdentityBlockProps> = ({ fighter }) => {
  const [imageMode, setImageMode] = useState<'profile' | 'body'>('profile');
  const [profileImageError, setProfileImageError] = useState(false);
  const [bodyImageError, setBodyImageError] = useState(false);
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setOffsetY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fullName = `${fighter.firstName} ${fighter.lastName}`;
  const recordString = `${fighter.record.wins}-${fighter.record.losses}-${fighter.record.draws}`;

  // Determine which image to display
  const hasBodyImage = !!fighter.bodyImageUrl && !bodyImageError;
  const currentImageUrl = imageMode === 'body' && hasBodyImage 
    ? fighter.bodyImageUrl 
    : fighter.imageUrl;
  const currentImageError = imageMode === 'body' ? bodyImageError : profileImageError;

  const handleImageError = () => {
    if (imageMode === 'body') {
      setBodyImageError(true);
    } else {
      setProfileImageError(true);
    }
  };

  return (
    <div className="relative h-[580px] w-full rounded-2xl overflow-hidden glass-card group">
      {/* Fighter Image with Parallax */}
      {!currentImageError ? (
        <img
          src={currentImageUrl}
          alt={fullName}
          referrerPolicy="no-referrer"
          onError={handleImageError}
          className="absolute inset-0 w-full h-[120%] object-cover object-top opacity-100 transition-transform duration-500 group-hover:scale-105 z-10"
          style={{ transform: `translateY(${offsetY * 0.3}px) ${/* preserve hover scale via nesting or just let duration smooth it, but style overrides class transform if we aren't careful. Wait, Tailwind transform relies on classes. Using style={{ transform }} replaces Tailwind's transform. So we do: */ ''}`, top: '-10%' }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <User className="h-32 w-32 text-muted-foreground/30" />
        </div>
      )}

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

          {/* Image Toggle - Only show if body image exists */}
          {hasBodyImage && (
            <button
              onClick={() => setImageMode(imageMode === 'profile' ? 'body' : 'profile')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/80 backdrop-blur-sm text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>{imageMode === 'profile' ? 'PROFILE' : 'BODY'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
