import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { NewsArticleDetail } from '@/user/components/news/NewsArticleDetail';
import { NewsArticle } from '@/shared/types/fighter';
import { Loader2, Newspaper } from 'lucide-react';

const NewsArticlePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: article, isLoading, error } = useQuery<NewsArticle>({
        queryKey: [`/api/news/${id}`],
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
                <Newspaper className="h-12 w-12 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Article not found</h2>
                <p className="text-muted-foreground">This article may have been removed or doesn't exist.</p>
                <button
                    onClick={() => navigate('/news')}
                    className="text-primary hover:underline text-sm"
                >
                    Back to News
                </button>
            </div>
        );
    }

    return (
        <NewsArticleDetail
            article={article}
            onBack={() => navigate('/news')}
        />
    );
};

export default NewsArticlePage;
