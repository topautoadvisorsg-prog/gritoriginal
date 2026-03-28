import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TagDisplay } from './TagDisplay';
import { Loader2, Tags } from 'lucide-react';

interface FighterTag {
    id: string;
    fighterId: string;
    tagDefinitionId: string;
    value: number;
    color: string;
    tagName: string;
    tagDescription: string | null;
    tagCategory: string;
    sortOrder: number;
}

interface FighterTagsSectionProps {
    fighterId: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; order: number }> = {
    'Striking': { label: '🥊 Striking', color: '#ef4444', order: 0 },
    'Grappling': { label: '🤼 Grappling', color: '#3b82f6', order: 1 },
    'Athleticism': { label: '⚡ Athleticism', color: '#22c55e', order: 2 },
    'Fight IQ': { label: '🧠 Fight IQ', color: '#a855f7', order: 3 },
    'Intangibles': { label: '🔥 Intangibles', color: '#f97316', order: 4 },
};

/**
 * Section component rendering all tags for a fighter, grouped by category.
 * Visual scouting summary layout for fighter profile and fight detail views.
 */
export const FighterTagsSection: React.FC<FighterTagsSectionProps> = ({ fighterId }) => {
    const { data: tags, isLoading, error } = useQuery<FighterTag[]>({
        queryKey: [`/api/fighters/${fighterId}/tags`],
        enabled: !!fighterId,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !tags || tags.length === 0) {
        return (
            <div className="text-center py-4">
                <Tags className="h-6 w-6 mx-auto text-muted-foreground mb-2 opacity-50" />
                <p className="text-xs text-muted-foreground">No scouting tags assigned yet</p>
            </div>
        );
    }

    // Group tags by category
    const grouped = tags.reduce<Record<string, FighterTag[]>>((acc, tag) => {
        const cat = tag.tagCategory || 'Intangibles';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(tag);
        return acc;
    }, {});

    // Sort categories by CATEGORY_CONFIG order
    const sortedCategories = Object.keys(grouped).sort((a, b) => {
        return (CATEGORY_CONFIG[a]?.order ?? 99) - (CATEGORY_CONFIG[b]?.order ?? 99);
    });

    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2 mb-3">
                <Tags className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                    Scouting Report
                </h3>
            </div>

            {sortedCategories.map(category => {
                const catConfig = CATEGORY_CONFIG[category] || { label: category, color: '#6b7280', order: 99 };
                const catTags = grouped[category].sort((a, b) => a.sortOrder - b.sortOrder);

                return (
                    <div key={category} className="mb-4">
                        <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                            <span
                                className="inline-block w-2 h-2 rounded-full"
                                style={{ backgroundColor: catConfig.color }}
                            />
                            {catConfig.label}
                        </h4>
                        <div className="grid gap-2">
                            {catTags.map((tag) => (
                                <TagDisplay
                                    key={tag.id}
                                    tagName={tag.tagName}
                                    value={tag.value}
                                    color={tag.color}
                                    description={tag.tagDescription || undefined}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default FighterTagsSection;
