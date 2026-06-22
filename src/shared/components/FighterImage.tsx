import React, { useEffect, useState } from 'react';
import type { Fighter } from '@/shared/types/fighter';
import { cn } from '@/shared/lib/utils';

type FighterImageData = Pick<Fighter, 'firstName' | 'lastName' | 'imageUrl' | 'bodyImageUrl'>;

interface FighterImageProps {
  fighter?: FighterImageData | null;
  variant?: 'headshot' | 'hero';
  alt?: string;
  className?: string;
  fallbackClassName?: string;
}

/**
 * Enforces the two-asset fighter image contract. Hero art is desktop-only;
 * compact and mobile layouts always request the headshot.
 */
export const FighterImage: React.FC<FighterImageProps> = ({
  fighter,
  variant = 'headshot',
  alt,
  className,
  fallbackClassName,
}) => {
  const [bodyEnabled, setBodyEnabled] = useState(true);
  const [headshotFailed, setHeadshotFailed] = useState(false);

  useEffect(() => {
    setBodyEnabled(true);
    setHeadshotFailed(false);
  }, [fighter?.imageUrl, fighter?.bodyImageUrl]);

  const headshot = fighter?.imageUrl?.trim();
  const body = fighter?.bodyImageUrl?.trim();
  const label = alt || (fighter ? `${fighter.firstName} ${fighter.lastName}` : 'Fighter');

  if (!headshot || headshotFailed) {
    return (
      <div
        role="img"
        aria-label={label}
        className={cn(
          'relative h-full w-full overflow-hidden bg-gradient-to-b from-zinc-800 to-black',
          fallbackClassName,
          className,
        )}
      >
        <div className="absolute left-1/2 top-[18%] h-[24%] aspect-square -translate-x-1/2 rounded-full bg-white/10" />
        <div className="absolute bottom-[-12%] left-1/2 h-[62%] w-[82%] -translate-x-1/2 rounded-[50%_50%_0_0] bg-white/[0.07]" />
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
          GRIT
        </span>
      </div>
    );
  }

  const image = (
    <img
      src={headshot}
      alt={label}
      referrerPolicy="no-referrer"
      className={cn('h-full w-full object-cover object-top', className)}
      onError={(event) => {
        const selectedBody = body
          ? event.currentTarget.currentSrc === new URL(body, document.baseURI).href
          : false;
        if (selectedBody) {
          setBodyEnabled(false);
        } else {
          setHeadshotFailed(true);
        }
      }}
    />
  );

  if (variant !== 'hero' || !body || !bodyEnabled) return image;

  return (
    <picture className="contents">
      <source media="(min-width: 768px)" srcSet={body} />
      {image}
    </picture>
  );
};
