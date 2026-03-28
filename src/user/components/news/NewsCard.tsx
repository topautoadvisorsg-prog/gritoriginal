import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { NewsArticle } from '@/shared/types/fighter';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { ChevronRight, Calendar, User, ShieldCheck, Newspaper } from 'lucide-react';
import { format } from 'date-fns';

interface Tag {
  id: string;
  name: string;
  color: string;
  category: string;
  active: boolean;
}

interface NewsCardProps {
  article: NewsArticle;
  onReadMore?: (article: NewsArticle) => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({ article, onReadMore }) => {
  const formattedDate = format(new Date(article.publishedAt), 'MMMM d, yyyy | h:mm a');
  const isIntelligence = article.layer === 'intelligence';

  const { data: activeTags = [] } = useQuery<Tag[]>({
    queryKey: ['/api/tags/active'],
  });

  const resolvedTags = article.tags
    .map(tagId => activeTags.find(t => t.id === tagId))
    .filter(Boolean) as Tag[];

  return (
    <div className={`group relative bg-[#111111]/80 border rounded-xl p-4 hover:border-yellow-500/30 transition-all duration-300 hover:bg-[#1a1a1a] animate-slide-up shadow-sm hover:shadow-[0_4px_20px_rgba(232,160,32,0.1)] ${
      isIntelligence ? 'border-purple-500/30' : 'border-white/5'
    }`}>
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-32 h-24 md:w-40 md:h-28 rounded-lg overflow-hidden bg-muted">
          {article.imageUrl ? (
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Calendar className="h-8 w-8 text-muted-foreground/50" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          {/* Title */}
          <h3 className="text-base md:text-lg font-black text-white leading-tight line-clamp-2 group-hover:text-[#E8A020] transition-colors uppercase tracking-wide">
            {article.title}
          </h3>

          {/* Excerpt */}
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2 hidden md:block">
            {article.excerpt}
          </p>

          {/* Tags + Meta Row */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {/* Layer Badge - Colored Pill */}
            {isIntelligence ? (
              <Badge
                variant="secondary"
                className="text-[10px] font-bold tracking-wider uppercase bg-purple-500/20 text-purple-400 border border-purple-500/40 hover:bg-purple-500/30"
              >
                <ShieldCheck className="w-3 h-3 mr-1" />
                Intelligence
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-[10px] font-bold tracking-wider uppercase border-[#E8A020]/20 text-[#E8A020] bg-[#E8A020]/5 hover:bg-[#E8A020]/15"
              >
                <Newspaper className="w-3 h-3 mr-1" />
                Standard
              </Badge>
            )}

            {resolvedTags.slice(0, 3).map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className={`text-[10px] font-bold tracking-wider uppercase ${tag.category === 'intelligence' ? 'border-amber-500/40 text-amber-500 bg-amber-500/10' : 'border-white/10 text-white/80'}`}
                style={{
                  borderColor: tag.color ? `${tag.color}40` : undefined,
                  color: tag.color || undefined,
                  backgroundColor: tag.color ? `${tag.color}15` : undefined
                }}
              >
                {tag.name}
              </Badge>
            ))}

            {article.eventReference && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {article.eventReference}
              </span>
            )}

            {article.fighterReference && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                {article.fighterReference}
              </span>
            )}

            <span className="text-xs text-muted-foreground ml-auto hidden sm:block">
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Read More Button */}
        <div className="flex-shrink-0 flex items-center">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 border-[#E8A020]/30 text-[#E8A020] hover:bg-[#E8A020]/10 hover:border-[#E8A020] uppercase font-black text-[10px] tracking-widest rounded-full button-press-scale hover-glow"
            onClick={() => onReadMore?.(article)}
          >
            Read More
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
