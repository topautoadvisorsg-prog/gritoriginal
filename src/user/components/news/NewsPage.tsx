import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { NewsFilters } from './NewsFilters';
import { NewsCard } from './NewsCard';
import { NewsArticleDetail } from './NewsArticleDetail';
import { toast } from 'sonner';
import { Loader2, Newspaper } from 'lucide-react';
import { NewsArticle } from '@/shared/types/fighter';

export const NewsPage: React.FC = () => {
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTag = searchParams.get('tag') || 'all';

  const queryUrl = selectedTag && selectedTag !== 'all' ? `/api/news?tag=${selectedTag}` : '/api/news';

  const { data: articles = [], isLoading, error } = useQuery<NewsArticle[]>({
    queryKey: [queryUrl],
  });

  const handleReadMore = (article: NewsArticle) => {
    setSelectedArticle(article);
  };

  const handleBackToList = () => {
    setSelectedArticle(null);
  };

  const handleTagChange = (tagId: string) => {
    if (tagId === 'all') {
      searchParams.delete('tag');
    } else {
      searchParams.set('tag', tagId);
    }
    setSearchParams(searchParams);
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
    toast.success('Filters reset');
  };

  if (selectedArticle) {
    return <NewsArticleDetail article={selectedArticle} onBack={handleBackToList} />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-destructive">Failed to load news articles</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display tracking-wide text-foreground">
          News & Research
        </h1>
        <p className="text-muted-foreground mt-1">
          Latest MMA analysis, fighter updates, and event breakdowns
        </p>
      </div>

      <NewsFilters 
        selectedTag={selectedTag} 
        onTagChange={handleTagChange}
        onReset={handleResetFilters} 
      />

      {articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Newspaper className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No news articles yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Check back later for MMA news and analysis
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <NewsCard
              key={article.id}
              article={article}
              onReadMore={handleReadMore}
            />
          ))}
        </div>
      )}

      <div className="flex justify-center pt-4">
        <p className="text-sm text-muted-foreground">
          Showing {articles.length} articles
        </p>
      </div>
    </div>
  );
};
