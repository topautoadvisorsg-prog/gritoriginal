import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    BadgeCheck, Crown, Star, Loader2, Users
} from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';

interface Influencer {
    id: string;
    username: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    profileImageUrl: string | null;
    socialLinks: { twitter?: string; instagram?: string; tiktok?: string } | null;
    isVerified: boolean;
    featuredInfluencer: boolean;
    totalPoints: number;
    tier: string;
}

export const InfluencerTab: React.FC = () => {
    const { data: influencers = [], isLoading } = useQuery<Influencer[]>({
        queryKey: ['/api/influencers'],
    });

    const featured = influencers.filter(i => i.featuredInfluencer);
    const verified = influencers.filter(i => !i.featuredInfluencer);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl" />
                    <div className="relative p-4 bg-card border-2 border-blue-500/30 rounded-2xl">
                        <BadgeCheck className="h-10 w-10 text-blue-500" />
                    </div>
                </div>
                <h2 className="text-2xl font-display tracking-wide text-foreground uppercase">
                    Verified Influencers
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                    Verified community voices and featured analysts
                </p>
            </div>

            {/* Featured Influencers */}
            {featured.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Crown className="h-5 w-5 text-amber-500" />
                        <h3 className="text-sm font-semibold uppercase tracking-wider">Featured</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {featured.map((inf) => (
                            <InfluencerCard key={inf.id} influencer={inf} isFeatured />
                        ))}
                    </div>
                </div>
            )}

            {/* All Verified */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider">
                        Verified Members ({influencers.length})
                    </h3>
                </div>

                {influencers.length === 0 ? (
                    <div className="text-center py-12">
                        <BadgeCheck className="h-8 w-8 mx-auto text-muted-foreground mb-3 opacity-50" />
                        <p className="text-sm text-muted-foreground">No verified users yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {verified.map((inf) => (
                            <InfluencerCard key={inf.id} influencer={inf} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

interface InfluencerCardProps {
    influencer: Influencer;
    isFeatured?: boolean;
}

const InfluencerCard: React.FC<InfluencerCardProps> = ({ influencer, isFeatured }) => {
    const displayName = influencer.username ||
        [influencer.firstName, influencer.lastName].filter(Boolean).join(' ') ||
        influencer.email?.split('@')[0] ||
        'Anonymous';

    const avatarSrc = influencer.avatarUrl || influencer.profileImageUrl;
    const tierColors: Record<string, string> = {
        free: 'text-muted-foreground',
        medium: 'text-blue-400',
        premium: 'text-amber-400',
    };

    return (
        <Card className={`relative overflow-hidden transition-all hover:shadow-lg ${isFeatured ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-amber-500/10' : ''}`}>
            {isFeatured && (
                <div className="absolute top-2 right-2">
                    <Crown className="h-4 w-4 text-amber-500" />
                </div>
            )}
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        {avatarSrc ? (
                            <img
                                src={avatarSrc}
                                alt={displayName}
                                className="w-12 h-12 rounded-full object-cover border-2 border-border"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                                <span className="text-lg font-bold text-muted-foreground">
                                    {displayName.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                        {/* Verification badge */}
                        <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                            <BadgeCheck className="h-3.5 w-3.5 text-white" />
                        </div>
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm truncate">{displayName}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs font-medium capitalize ${tierColors[influencer.tier] || ''}`}>
                                {influencer.tier}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                • {influencer.totalPoints} pts
                            </span>
                        </div>

                        {/* Social Links */}
                        {influencer.socialLinks && (
                            <div className="flex gap-2 mt-1.5">
                                {influencer.socialLinks.twitter && (
                                    <a
                                        href={influencer.socialLinks.twitter}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-400 hover:underline"
                                    >
                                        𝕏
                                    </a>
                                )}
                                {influencer.socialLinks.instagram && (
                                    <a
                                        href={influencer.socialLinks.instagram}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-pink-400 hover:underline"
                                    >
                                        IG
                                    </a>
                                )}
                                {influencer.socialLinks.tiktok && (
                                    <a
                                        href={influencer.socialLinks.tiktok}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-foreground hover:underline"
                                    >
                                        TT
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    <Star className="h-4 w-4 text-primary/30 flex-shrink-0" />
                </div>
            </CardContent>
        </Card>
    );
};

export default InfluencerTab;
