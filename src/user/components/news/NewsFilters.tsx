import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { RotateCcw } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  color: string;
  category: string;
  active: boolean;
}

interface NewsFiltersProps {
  selectedTag?: string;
  onTagChange?: (tagId: string) => void;
  onReset?: () => void;
}

export const NewsFilters: React.FC<NewsFiltersProps> = ({ 
  selectedTag = 'all', 
  onTagChange, 
  onReset 
}) => {
  // Fetch active tags from backend
  const { data: activeTags = [] } = useQuery<Tag[]>({
    queryKey: ['/api/tags/active'],
  });

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {/* Event Filter */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">Event</span>
        <Select>
          <SelectTrigger className="w-40 bg-[#111111]/80 border-white/10 rounded-full hover:border-[#E8A020]/50 transition-colors text-xs font-bold uppercase tracking-wider text-white/70">
            <SelectValue placeholder="EVENT" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ufc-299">UFC 299</SelectItem>
            <SelectItem value="ufc-300">UFC 300</SelectItem>
            <SelectItem value="ufc-301">UFC 301</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Fighter Filter */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">Fighter</span>
        <Select>
          <SelectTrigger className="w-44 bg-[#111111]/80 border-white/10 rounded-full hover:border-[#E8A020]/50 transition-colors text-xs font-bold uppercase tracking-wider text-white/70">
            <SelectValue placeholder="FIGHTER" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="omalley">Sean O'Malley</SelectItem>
            <SelectItem value="mcgregor">Conor McGregor</SelectItem>
            <SelectItem value="makhachev">Islam Makhachev</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tags Filter */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">Tags</span>
        <Select value={selectedTag} onValueChange={(val) => onTagChange?.(val)}>
          <SelectTrigger className="w-36 bg-[#111111]/80 border-white/10 rounded-full hover:border-[#E8A020]/50 transition-colors text-xs font-bold uppercase tracking-wider text-white/70">
            <SelectValue placeholder="TAGS" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            {activeTags.map(tag => (
              <SelectItem key={tag.id} value={tag.id}>{tag.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Filter */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">Date</span>
        <Select>
          <SelectTrigger className="w-32 bg-[#111111]/80 border-white/10 rounded-full hover:border-[#E8A020]/50 transition-colors text-xs font-bold uppercase tracking-wider text-white/70">
            <SelectValue placeholder="ALL TIME" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reset Button */}
      {onReset && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-transparent">Reset</span>
          <Button
            variant="outline"
            size="default"
            className="gap-2 border-[#E8A020]/40 text-[#E8A020] hover:bg-[#E8A020]/10 hover:border-[#E8A020] rounded-full text-xs font-black uppercase tracking-widest transition-all"
            onClick={onReset}
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      )}
    </div>
  );
};
