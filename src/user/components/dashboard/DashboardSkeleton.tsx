import React from 'react';
import { Skeleton } from '@/shared/components/ui/skeleton';

/**
 * Dashboard loading skeleton — mirrors the real Dashboard layout
 * (hero, quick stats, betting tracker, event/perf grid) so layout
 * doesn't shift when data lands. Premium perceived speed.
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto space-y-8 pb-12">
      {/* Hero */}
      <div className="flex flex-col md:flex-row items-center gap-8 bg-[#0a0a0a] border border-white/10 p-8 rounded-3xl">
        <Skeleton className="w-24 h-24 rounded-full flex-shrink-0" />
        <div className="flex-1 w-full space-y-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-12 w-3/4 max-w-md" />
          <div className="max-w-md space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
        <div className="flex flex-col gap-2 p-6 bg-white/5 border border-white/10 rounded-2xl">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-2 w-16" />
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center justify-center p-4 bg-[#111] border border-white/5 rounded-2xl gap-2">
            <Skeleton className="h-2 w-14" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>

      {/* Event + Performance grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#111] border border-white/10 rounded-3xl p-8 space-y-4 min-h-[300px]">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-3 w-32" />
          <div className="pt-8 flex items-end justify-between gap-4">
            <Skeleton className="h-14 flex-1" />
            <Skeleton className="h-11 w-32" />
          </div>
        </div>
        <div className="bg-[#111] border border-white/10 rounded-3xl p-6 space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-2 w-3/4" />
          <Skeleton className="h-2 w-5/6" />
        </div>
      </div>
    </div>
  );
};
