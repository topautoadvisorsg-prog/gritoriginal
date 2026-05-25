import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Fighter } from '@/shared/types/fighter';
import { cn } from '@/shared/lib/utils';
import { Lock, Clock, Award, CheckCircle2 } from 'lucide-react';
import { StarRating } from './StarRating';

const DIMENSIONS = [
  { key: 'fightIq', label: 'Fight IQ', description: 'Reads, adjustments, ring generalship' },
  { key: 'striking', label: 'Striking', description: 'Accuracy, power, footwork, defense' },
  { key: 'grappling', label: 'Grappling', description: 'Takedowns, control, submissions' },
  { key: 'cardio', label: 'Cardio', description: 'Conditioning through all rounds' },
  { key: 'aggressiveness', label: 'Aggressiveness', description: 'Forward pressure, output, finishing intent' },
] as const;

type DimKey = (typeof DIMENSIONS)[number]['key'];
type Scores = Record<DimKey, number>;

interface RateFighterCardProps {
  fighter: Fighter;
  fightId: string;
  isFightCompleted: boolean;
  completedAt?: string | null;
}

const EMPTY: Scores = { fightIq: 0, striking: 0, grappling: 0, cardio: 0, aggressiveness: 0 };

export const RateFighterCard: React.FC<RateFighterCardProps> = ({
  fighter,
  fightId,
  isFightCompleted,
  completedAt,
}) => {
  const queryClient = useQueryClient();
  const [scores, setScores] = useState<Scores>(EMPTY);

  const isReflectionExpired = useMemo(() => {
    if (!completedAt || !isFightCompleted) return false;
    const diff = (Date.now() - new Date(completedAt).getTime()) / (1000 * 60 * 60);
    return diff > 24;
  }, [completedAt, isFightCompleted]);

  const queryKey = ['fighter-rating', fightId, fighter.id];

  const { data: rating } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/fights/${fightId}/fighters/${fighter.id}/ratings/me`);
      if (!res.ok) throw new Error('Failed to fetch rating');
      return res.json();
    },
    enabled: isFightCompleted,
  });

  useEffect(() => {
    if (rating) {
      setScores({
        fightIq: rating.fightIq ?? 0,
        striking: rating.striking ?? 0,
        grappling: rating.grappling ?? 0,
        cardio: rating.cardio ?? 0,
        aggressiveness: rating.aggressiveness ?? 0,
      });
    }
  }, [rating]);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/fights/${fightId}/fighters/${fighter.id}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scores),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to save rating');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(`Rating saved for ${fighter.firstName} ${fighter.lastName}`);
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['fighter-aggregate-rating', fighter.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const allRated = DIMENSIONS.every(d => scores[d.key] > 0);
  const canSubmit = isFightCompleted && !isReflectionExpired && allRated && !mutation.isPending;

  if (!isFightCompleted) {
    return (
      <div className="rounded-2xl border border-border/50 bg-muted/10 p-5 opacity-60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h4 className="font-bold">Rate {fighter.firstName} {fighter.lastName}</h4>
            <p className="text-xs text-muted-foreground">Unlocks after fight is finalized</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur p-5">
      {/* header */}
      <div className="flex items-center gap-3 mb-4">
        <img
          src={fighter.imageUrl}
          alt={fighter.lastName}
          className="w-10 h-10 rounded-lg object-cover ring-1 ring-border/50"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              `https://via.placeholder.com/40x40/1a1a2e/00d4ff?text=${fighter.firstName[0]}`;
          }}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <h4 className="font-bold text-foreground">
              Rate {fighter.firstName} {fighter.lastName}
            </h4>
          </div>
          <p className="text-[11px] text-muted-foreground">1 to 10 — based on this fight's performance</p>
        </div>
      </div>

      {/* dimensions */}
      <div className="space-y-4">
        {DIMENSIONS.map(d => (
          <StarRating
            key={d.key}
            label={d.label}
            description={d.description}
            value={scores[d.key]}
            readOnly={isReflectionExpired}
            onChange={(v) => setScores(s => ({ ...s, [d.key]: v }))}
          />
        ))}
      </div>

      {/* footer */}
      <div className="mt-5 flex items-center justify-between gap-3">
        {isReflectionExpired ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Lock className="w-4 h-4" />
            Reflection window closed
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            24h reflection window
          </div>
        )}

        {!isReflectionExpired && (
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit}
            className={cn(
              'px-5 py-2 rounded-xl font-semibold text-sm flex items-center gap-2',
              'bg-amber-400/10 text-amber-400 border border-amber-400/30',
              'hover:bg-amber-400/20 transition-colors',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
          >
            {mutation.isPending ? (
              'Saving…'
            ) : rating ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Update Rating
              </>
            ) : (
              'Submit Rating'
            )}
          </button>
        )}
      </div>

      {rating?.countsTowardAggregate === false && (
        <p className="mt-3 text-[11px] text-amber-400/80">
          Your rating is saved but not counted in the public aggregate (
          {rating.excludedReason === 'account_age' ? 'account < 24h old' : 'rate-limited'}).
        </p>
      )}
    </div>
  );
};
