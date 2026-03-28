import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { NewsArticle } from '@/shared/types/fighter';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';
import { format } from 'date-fns';

interface Tag {
  id: string;
  name: string;
  color: string;
  category: string;
  active: boolean;
}

interface NewsArticleDetailProps {
  article: NewsArticle;
  onBack: () => void;
}

export const NewsArticleDetail: React.FC<NewsArticleDetailProps> = ({ article, onBack }) => {
  const formattedDate = format(new Date(article.publishedAt), 'MMMM d, yyyy');
  const formattedTime = format(new Date(article.publishedAt), 'h:mm a');

  const { data: activeTags = [] } = useQuery<Tag[]>({
    queryKey: ['/api/tags/active'],
  });

  const resolvedTags = article.tags
    .map(tagId => activeTags.find(t => t.id === tagId))
    .filter(Boolean) as Tag[];

  return (
    <div className="animate-fade-in max-w-4xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to News
      </Button>

      {/* Article Header */}
      <article className="space-y-6">
        {/* Featured Image */}
        <div className="w-full h-64 md:h-80 rounded-xl overflow-hidden bg-muted border border-border">
          {article.imageUrl ? (
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Calendar className="h-16 w-16 text-muted-foreground/50" />
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {resolvedTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className={`text-sm ${tag.category === 'intelligence' ? 'border-amber-500/40 text-amber-500 bg-amber-500/10 font-bold' : 'border-primary/40 text-primary bg-primary/10'}`}
              style={tag.category !== 'intelligence' ? {
                borderColor: tag.color ? `${tag.color}40` : undefined,
                color: tag.color || undefined,
                backgroundColor: tag.color ? `${tag.color}15` : undefined
              } : undefined}
            >
              {tag.name}
            </Badge>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-4xl font-display tracking-wide text-foreground leading-tight">
          {article.title}
        </h1>

        {/* Meta Row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-b border-border pb-6">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {formattedTime}
          </span>
          {article.readTime && (
            <span className="text-primary">{article.readTime}</span>
          )}
          {article.eventReference && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" />
              {article.eventReference}
            </span>
          )}
          {article.fighterReference && (
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4 text-primary" />
              {article.fighterReference}
            </span>
          )}
        </div>

        {/* Article Body */}
        <div className="prose prose-invert prose-cyan max-w-none">
          {article.content.split('\n\n').map((paragraph, index) => {
            if (paragraph.startsWith('## ')) {
              return (
                <h2 key={index} className="text-xl font-semibold text-foreground mt-8 mb-4">
                  {paragraph.replace('## ', '')}
                </h2>
              );
            }
            if (paragraph.startsWith('### ')) {
              return (
                <h3 key={index} className="text-lg font-medium text-foreground mt-6 mb-3">
                  {paragraph.replace('### ', '')}
                </h3>
              );
            }
            return (
              <p key={index} className="text-muted-foreground leading-relaxed mb-4">
                {paragraph}
              </p>
            );
          })}
        </div>
      </article>
    </div>
  );
};
