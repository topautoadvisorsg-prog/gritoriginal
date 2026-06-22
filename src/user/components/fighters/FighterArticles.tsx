import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Loader2, Newspaper, ExternalLink } from 'lucide-react';

interface NewsArticle {
    id: string;
    title: string;
    summary: string | null;
    imageUrl: string | null;
    publishedAt: string;
    source: string | null;
    slug: string | null;
}

interface FighterArticlesProps {
    fighterId: string;
    fighterName: string;
}

/**
 * Displays news articles linked to a fighter via fighterReference.
 * Shows a compact list of articles on the fighter profile.
 */
export const FighterArticles: React.FC<FighterArticlesProps> = ({ fighterId, fighterName }) => {
    const { data: articles, isLoading } = useQuery<NewsArticle[]>({
        queryKey: [`/api/news/fighter/${fighterId}`],
        enabled: !!fighterId,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const articleList = Array.isArray(articles) ? articles : [];

    if (articleList.length === 0) return null;

    return (
        <Card className="mt-4">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Newspaper className="h-4 w-4" />
                    Related Articles
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {articleList.slice(0, 5).map(article => (
                    <Link
                        key={article.id}
                        to={`/news/${article.id}`}
                        className="block p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                    >
                        <div className="flex items-start gap-3">
                            {article.imageUrl && (
                                <img
                                    src={article.imageUrl}
                                    alt=""
                                    className="w-16 h-12 object-cover rounded-md flex-shrink-0"
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
                                    {article.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(article.publishedAt).toLocaleDateString()}
                                    </span>
                                    {article.source && (
                                        <span className="text-xs text-muted-foreground">• {article.source}</span>
                                    )}
                                </div>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                        </div>
                    </Link>
                ))}
            </CardContent>
        </Card>
    );
};

export default FighterArticles;
