import React, { useRef } from 'react';
import { Swords, Trophy, Target } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface SlipShareCardProps {
  fighterName: string;
  opponentName?: string;
  pickedMethod: string;
  pickedRound?: string;
  units: number;
  eventName?: string;
  userDisplayName: string;
  onCaptureReady: (element: HTMLDivElement | null) => void;
}

export const SlipShareCard: React.FC<SlipShareCardProps> = ({
  fighterName,
  opponentName,
  pickedMethod,
  pickedRound,
  units,
  eventName,
  userDisplayName,
  onCaptureReady,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Notify parent when ref is ready for capture
  React.useEffect(() => {
    onCaptureReady(cardRef.current);
  }, [onCaptureReady]);

  return (
    <div
      ref={cardRef}
      className="absolute top-0 left-0 w-[1080px] h-[1080px] bg-gradient-to-br from-black via-[#0a0a0a] to-[#111] overflow-hidden"
      style={{ zIndex: -9999, position: 'absolute' }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(232, 160, 32, 0.3) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Top Gradient Accent */}
      <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#E8A020] via-yellow-500 to-[#E8A020]" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-16">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-12">
          <div className="flex items-center gap-4 mb-4">
            <Swords className="w-16 h-16 text-[#E8A020]" />
          </div>
          <h2 className="text-5xl font-black text-white uppercase tracking-widest mb-2">
            GRIT PICK
          </h2>
          {eventName && (
            <p className="text-xl font-bold text-white/40 uppercase tracking-wider mt-2">
              {eventName}
            </p>
          )}
        </div>

        {/* Fighter Display */}
        <div className="flex flex-col items-center mb-12">
          <div className="flex items-center gap-8 mb-6">
            <div className="text-center">
              <h1 className="text-7xl font-black text-white uppercase leading-tight">
                {fighterName.split(' ').pop()}
              </h1>
              {fighterName.split(' ').length > 1 && (
                <p className="text-3xl font-bold text-white/60 uppercase mt-2">
                  {fighterName.split(' ').slice(0, -1).join(' ')}
                </p>
              )}
            </div>
          </div>

          {opponentName && (
            <div className="flex items-center gap-4 text-white/30">
              <span className="text-2xl font-bold uppercase">VS</span>
              <span className="text-3xl font-bold uppercase">{opponentName.split(' ').pop()}</span>
            </div>
          )}
        </div>

        {/* Pick Details */}
        <div className="bg-white/[0.05] border border-white/10 rounded-3xl p-10 mb-10 min-w-[600px]">
          <div className="flex flex-col gap-6">
            {/* Method */}
            <div className="flex items-center gap-4">
              <Target className="w-8 h-8 text-[#E8A020]" />
              <div>
                <p className="text-sm font-black text-white/40 uppercase tracking-widest mb-1">
                  Method
                </p>
                <p className="text-3xl font-black text-white uppercase">
                  {pickedMethod}
                </p>
              </div>
            </div>

            {/* Round (if applicable) */}
            {(pickedMethod === 'KO/TKO' || pickedMethod === 'Submission') && pickedRound && (
              <div className="flex items-center gap-4 pt-6 border-t border-white/5">
                <Trophy className="w-8 h-8 text-[#E8A020]" />
                <div>
                  <p className="text-sm font-black text-white/40 uppercase tracking-widest mb-1">
                    Round
                  </p>
                  <p className="text-3xl font-black text-white">
                    {pickedRound}
                  </p>
                </div>
              </div>
            )}

            {/* Units */}
            <div className="flex items-center gap-4 pt-6 border-t border-white/5">
              <div className="w-8 h-8 rounded-full bg-[#E8A020]/20 flex items-center justify-center border border-[#E8A020]/30">
                <span className="text-lg font-black text-[#E8A020]">U</span>
              </div>
              <div>
                <p className="text-sm font-black text-white/40 uppercase tracking-widest mb-1">
                  Units Wagered
                </p>
                <p className="text-3xl font-black text-[#E8A020]">
                  {units}u
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#E8A020]/30 to-white/[0.05] border-2 border-[#E8A020]/50 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-[#E8A020]" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-white/40 uppercase tracking-wider">
              Picked by
            </p>
            <p className="text-2xl font-black text-white uppercase">
              {userDisplayName}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-12 border-t border-white/10 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Swords className="w-6 h-6 text-[#E8A020]" />
              <span className="text-lg font-black text-white uppercase tracking-wider">
                GRIT MMA
              </span>
            </div>
            <p className="text-sm font-bold text-white/30 uppercase tracking-wider">
              Prove Your Fight IQ
            </p>
          </div>
        </div>
      </div>

      {/* Corner Accent */}
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-[#E8A020]/10 to-transparent rounded-tl-3xl" />
    </div>
  );
};
