import React, { useState } from 'react';
import { Fighter } from '@/shared/types/fighter';
import { cn } from '@/shared/lib/utils';
import { MessageSquare, PenLine, Clock, Lock, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface PostFightNotesProps {
  fighter1: Fighter;
  fighter2: Fighter;
  fightId: string;
  isFightCompleted: boolean;
  completedAt?: string | null;
}

export const PostFightNotes: React.FC<PostFightNotesProps> = ({
  fighter1,
  fighter2,
  fightId,
  isFightCompleted,
  completedAt,
}) => {
  const queryClient = useQueryClient();
  const [note1, setNote1] = useState('');
  const [note2, setNote2] = useState('');

  // Check 24h window
  const isReflectionExpired = React.useMemo(() => {
    if (!completedAt || !isFightCompleted) return false;
    const completedDate = new Date(completedAt);
    const now = new Date();
    const diffHours = (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60);
    return diffHours > 24;
  }, [completedAt, isFightCompleted]);

  // Fetch existing note
  const { data: note, isLoading } = useQuery({
    queryKey: ['fight-notes', fightId],
    queryFn: async () => {
      const res = await fetch(`/api/fights/${fightId}/notes`);
      if (!res.ok) throw new Error('Failed to fetch notes');
      return res.json();
    },
    enabled: isFightCompleted,
  });

  // Populate state on load
  React.useEffect(() => {
    if (note?.content) {
      try {
        const parsed = JSON.parse(note.content);
        setNote1(parsed.fighter1 || '');
        setNote2(parsed.fighter2 || '');
      } catch {
        setNote1(note.content); // fallback if it was just a string
      }
    }
  }, [note]);

  const mutation = useMutation({
    mutationFn: async () => {
      const content = JSON.stringify({ fighter1: note1, fighter2: note2 });
      const res = await fetch(`/api/fights/${fightId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Failed to save notes');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Notes saved successfully');
      queryClient.invalidateQueries({ queryKey: ['fight-notes', fightId] });
    },
    onError: () => {
      toast.error('Failed to save notes. The reflection window may have closed.');
    }
  });

  if (!isFightCompleted) {
    return (
      <section className="glass-card rounded-2xl p-6 opacity-60">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Post-Fight Notes</h3>
            <p className="text-xs text-muted-foreground">Available after fight completion</p>
          </div>
        </div>

        <div className="text-center py-8 border border-dashed border-border/50 rounded-xl">
          <Clock className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            This section will unlock after the fight is finalized.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Add personal notes about each fighter's performance, cardio, technique, etc.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="glass-card rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Post-Fight Notes</h3>
          <p className="text-xs text-muted-foreground">Personal observations about each fighter</p>
        </div>
      </div>

      {/* Notes Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Fighter 1 Note */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <img 
              src={fighter1.imageUrl} 
              alt={fighter1.lastName}
              className="w-8 h-8 rounded-lg object-cover"
              onError={(e) => {
                e.currentTarget.src = `https://via.placeholder.com/32x32/1a1a2e/00d4ff?text=${fighter1.firstName[0]}`;
              }}
            />
            <span className="font-bold text-foreground">{fighter1.firstName} {fighter1.lastName}</span>
          </div>
          <div className="relative">
            <textarea
              value={note1}
              onChange={(e) => setNote1(e.target.value)}
              placeholder="Observations: cardio, speed, chin, power, technique..."
              className={cn(
                "w-full h-32 p-4 rounded-xl resize-none",
                "bg-muted/30 border border-border/50",
                "text-sm text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
                "transition-all duration-200"
              )}
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-1 text-muted-foreground">
              <PenLine className="w-3 h-3" />
              <span className="text-[10px]">{note1.length}/500</span>
            </div>
          </div>
        </div>

        {/* Fighter 2 Note */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <img 
              src={fighter2.imageUrl} 
              alt={fighter2.lastName}
              className="w-8 h-8 rounded-lg object-cover"
              onError={(e) => {
                e.currentTarget.src = `https://via.placeholder.com/32x32/1a1a2e/00d4ff?text=${fighter2.firstName[0]}`;
              }}
            />
            <span className="font-bold text-foreground">{fighter2.firstName} {fighter2.lastName}</span>
          </div>
          <div className="relative">
            <textarea
              value={note2}
              onChange={(e) => setNote2(e.target.value)}
              placeholder="Observations: cardio, speed, chin, power, technique..."
              className={cn(
                "w-full h-32 p-4 rounded-xl resize-none",
                "bg-muted/30 border border-border/50",
                "text-sm text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
                "transition-all duration-200",
                isReflectionExpired && "opacity-60 cursor-not-allowed bg-muted/10"
              )}
              disabled={isReflectionExpired || mutation.isPending}
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-1 text-muted-foreground">
              <PenLine className="w-3 h-3" />
              <span className="text-[10px]">{note2.length}/500</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-between items-center">
        {isReflectionExpired ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="w-4 h-4" />
            <span className="text-sm font-medium">Reflection window closed (Notes are read-only)</span>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Auto-saves locally. Press save to lock in.
          </div>
        )}
        
        {!isReflectionExpired && (
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className={cn(
              "px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2",
              "bg-primary/10 text-primary border border-primary/30",
              "hover:bg-primary/20 transition-colors duration-200 disabled:opacity-50"
            )}
          >
            {mutation.isPending ? 'Saving...' : 'Save Notes'}
          </button>
        )}
      </div>
    </section>
  );
};
