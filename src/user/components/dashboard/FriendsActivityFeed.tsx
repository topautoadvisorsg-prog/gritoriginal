import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Clock, TrendingUp, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/shared/lib/utils';

interface ActivityPick {
  id: string;
  userId: string;
  pickedFighterName: string;
  pickedMethod: string;
  units: number;
  eventName: string;
  createdAt: string;
}

export const FriendsActivityFeed: React.FC = () => {
  const { data: activities, isLoading } = useQuery<ActivityPick[]>({
    queryKey: ['/api/activity/feed'],
    queryFn: async () => {
      const res = await fetch('/api/activity/feed');
      if (!res.ok) throw new Error('Failed to fetch activity');
      return res.json();
    },
    staleTime: 0, // Always refetch - activity changes when group members make picks
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-[#E8A020] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-[9px] text-white/40 uppercase tracking-widest">Loading Activity...</p>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-white/[0.02] rounded-2xl border border-white/5">
        <Users className="w-12 h-12 text-white/5 mb-4" />
        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">
          No Group Activity Yet
        </h4>
        <p className="text-[8px] text-white/20 max-w-[200px] leading-relaxed">
          Join a group to see your friends' picks and compete together
        </p>
        <Link 
          to="/groups" 
          className="mt-4 text-[9px] font-black uppercase tracking-widest text-[#E8A020] hover:underline transition-all"
        >
          FIND GROUPS
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-white/40" />
          <h3 className="text-[9px] font-black uppercase tracking-widest text-white/50">
            Friends Activity ({activities.length})
          </h3>
        </div>
        <Link 
          to="/groups" 
          className="text-[8px] font-black uppercase tracking-widest text-[#E8A020] hover:text-[#E8A020]/80 transition-colors"
        >
          VIEW ALL
        </Link>
      </div>

      {/* Activity List */}
      <div className="flex flex-col divide-y divide-white/5 max-h-[400px] overflow-y-auto">
        {activities.slice(0, 10).map((activity) => (
          <div 
            key={activity.id}
            className="flex items-start gap-3 p-4 hover:bg-white/[0.02] transition-colors"
          >
            {/* Avatar Placeholder */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E8A020]/20 to-white/[0.05] border border-white/10 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-4 h-4 text-[#E8A020]" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs font-bold text-white truncate">
                    Picked {activity.pickedFighterName}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[8px] text-white/40 uppercase tracking-wider">
                      {activity.pickedMethod}
                    </span>
                    <span className="text-[7px] text-white/20">•</span>
                    <span className="text-[8px] text-[#E8A020] font-black uppercase tracking-wider">
                      {activity.units}u
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 text-white/30 flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  <span className="text-[7px] font-bold">{formatTimeAgo(activity.createdAt)}</span>
                </div>
              </div>

              {/* Event Context */}
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-3 h-3 text-white/20" />
                <span className="text-[7px] text-white/30 truncate">
                  {activity.eventName}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/5 bg-white/[0.01]">
        <Link 
          to="/groups" 
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-white/10 text-center text-[8px] font-black uppercase tracking-widest text-white/50 hover:bg-white/5 hover:text-white transition-all button-press-scale"
        >
          <Users className="w-3 h-3" />
          View Full Group Activity
        </Link>
      </div>
    </div>
  );
};
