import React from 'react';

interface BadgeProps {
  size?: number;
  showLabel?: boolean;
}

export function NinjaBadge({ size = 56, showLabel = true }: BadgeProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="28,2 54,28 28,54 2,28" fill="hsl(215 20% 10%)" stroke="hsl(210 20% 40%)" strokeWidth="1.5" />
        <polygon points="28,8 48,28 28,48 8,28" fill="hsl(215 20% 7%)" stroke="hsl(210 20% 30%)" strokeWidth="0.5" />
        <path d="M28 16 L32 24 L28 22 L24 24 Z" fill="hsl(210 20% 55%)" />
        <path d="M28 40 L32 32 L28 34 L24 32 Z" fill="hsl(210 20% 55%)" />
        <path d="M16 28 L24 32 L22 28 L24 24 Z" fill="hsl(210 20% 55%)" />
        <path d="M40 28 L32 24 L34 28 L32 32 Z" fill="hsl(210 20% 55%)" />
        <circle cx="28" cy="28" r="5" fill="hsl(210 20% 35%)" stroke="hsl(210 20% 55%)" strokeWidth="1" />
      </svg>
      {showLabel && (
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '.58rem', fontWeight: 700, letterSpacing: '.12em', color: 'hsl(210 20% 50%)', textTransform: 'uppercase' }}>NINJA</span>
      )}
    </div>
  );
}

export function SamuraiBadge({ size = 56, showLabel = true }: BadgeProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="28,2 42,8 52,20 52,36 42,48 28,54 14,48 4,36 4,20 14,8" fill="hsl(355 85% 50% / .1)" stroke="hsl(355 85% 55%)" strokeWidth="1.5" />
        <polygon points="28,8 39,13 47,22 47,34 39,43 28,48 17,43 9,34 9,22 17,13" fill="hsl(355 85% 50% / .05)" stroke="hsl(355 85% 55% / .4)" strokeWidth="0.5" />
        <line x1="18" y1="18" x2="38" y2="38" stroke="hsl(355 85% 65%)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="38" y1="18" x2="18" y2="38" stroke="hsl(355 85% 65%)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="28" cy="28" r="4" fill="hsl(355 85% 52% / .2)" stroke="hsl(355 85% 65%)" strokeWidth="1.5" />
        <circle cx="18" cy="18" r="2.5" fill="hsl(355 85% 52% / .3)" stroke="hsl(355 85% 65%)" strokeWidth="1" />
        <circle cx="38" cy="38" r="2.5" fill="hsl(355 85% 52% / .3)" stroke="hsl(355 85% 65%)" strokeWidth="1" />
        <circle cx="38" cy="18" r="2.5" fill="hsl(355 85% 52% / .3)" stroke="hsl(355 85% 65%)" strokeWidth="1" />
        <circle cx="18" cy="38" r="2.5" fill="hsl(355 85% 52% / .3)" stroke="hsl(355 85% 65%)" strokeWidth="1" />
      </svg>
      {showLabel && (
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '.58rem', fontWeight: 700, letterSpacing: '.12em', color: 'hsl(355 85% 55%)', textTransform: 'uppercase' }}>SAMURAI</span>
      )}
    </div>
  );
}

export function MasterBadge({ size = 56, showLabel = true }: BadgeProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="28,2 42,6 52,17 54,32 46,45 32,53 20,53 6,45 2,32 4,17 14,6" fill="hsl(280 80% 55% / .12)" stroke="hsl(280 80% 65%)" strokeWidth="1.5" />
        <polygon points="28,8 40,12 48,21 50,32 43,43 30,49 18,49 9,43 6,32 8,21 16,12" fill="hsl(280 80% 55% / .06)" stroke="hsl(280 80% 65% / .4)" strokeWidth="0.5" />
        <path d="M21 30 L21 24 L28 22 L35 24 L35 30" stroke="hsl(280 80% 75%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <rect x="19" y="30" width="18" height="6" rx="2" fill="hsl(280 80% 55% / .3)" stroke="hsl(280 80% 70%)" strokeWidth="1.5" />
        <path d="M28 17 L30 22 H35 L31 25 L33 30 L28 27 L23 30 L25 25 L21 22 H26 Z" fill="hsl(280 80% 65%)" />
      </svg>
      {showLabel && (
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '.58rem', fontWeight: 700, letterSpacing: '.12em', color: 'hsl(280 80% 65%)', textTransform: 'uppercase' }}>MASTER</span>
      )}
    </div>
  );
}

export function GoatBadge({ size = 56, showLabel = true }: BadgeProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="28" cy="28" r="26" fill="hsl(45 90% 55% / .12)" stroke="hsl(45 90% 60%)" strokeWidth="1.5" />
        <circle cx="28" cy="28" r="21" fill="hsl(45 90% 55% / .06)" stroke="hsl(45 90% 55% / .5)" strokeWidth="0.5" />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 28 + Math.cos(rad) * 22;
          const y1 = 28 + Math.sin(rad) * 22;
          const x2 = 28 + Math.cos(rad) * 24.5;
          const y2 = 28 + Math.sin(rad) * 24.5;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(45 90% 55%)" strokeWidth="1.5" />;
        })}
        <path d="M28 12 L30.9 20.6 H40 L32.6 25.9 L35.4 34.5 L28 29.2 L20.6 34.5 L23.4 25.9 L16 20.6 H25.1 Z" fill="hsl(45 90% 60%)" />
        <text x="28" y="46" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="5.5" fontWeight="700" letterSpacing="1" fill="hsl(45 90% 55%)">G.O.A.T</text>
      </svg>
      {showLabel && (
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '.58rem', fontWeight: 700, letterSpacing: '.12em', color: 'hsl(45 90% 60%)', textTransform: 'uppercase' }}>GOAT</span>
      )}
    </div>
  );
}

const BADGE_MAP: Record<string, React.ComponentType<BadgeProps>> = {
  NINJA: NinjaBadge,
  SAMURAI: SamuraiBadge,
  MASTER: MasterBadge,
  GOAT: GoatBadge,
  '???': GoatBadge,
};

export function BadgeIcon({ name, size, showLabel }: { name: string; size?: number; showLabel?: boolean }) {
  const Component = BADGE_MAP[name.toUpperCase()] ?? NinjaBadge;
  return <Component size={size} showLabel={showLabel} />;
}
