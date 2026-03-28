import React, { useEffect } from 'react';
import { cn } from '@/shared/lib/utils';
import { BadgeIcon, BadgeType, BADGE_CONFIGS } from './BadgeIcon';
import { X, Share2, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useGamificationActions } from '@/shared/hooks/use-gamification-actions';

interface BadgeUnlockModalProps {
    badge: BadgeType;
    isOpen: boolean;
    onClose: () => void;
    onViewAllBadges?: () => void;
}

export const BadgeUnlockModal: React.FC<BadgeUnlockModalProps> = ({
    badge,
    isOpen,
    onClose,
    onViewAllBadges,
}) => {
    const { celebrateBadgeEarned } = useGamificationActions();
    const config = BADGE_CONFIGS[badge];

    useEffect(() => {
        if (isOpen) {
            // Trigger celebration
            celebrateBadgeEarned();
        }
    }, [isOpen, celebrateBadgeEarned]);

    if (!isOpen || !config) {
        return null;
    }

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `I earned the ${config.label} badge!`,
                text: `${config.description} - GRIT`,
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={cn(
                    'relative z-10 w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl',
                    'animate-in zoom-in-95 fade-in duration-300'
                )}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors"
                >
                    <X className="w-5 h-5 text-muted-foreground" />
                </button>

                {/* Content */}
                <div className="p-8 text-center">
                    {/* Badge with shine animation */}
                    <div className="relative inline-block mb-6">
                        {/* Shine effect */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine" />

                        {/* Glow effect */}
                        <div className={cn(
                            'absolute inset-0 rounded-full blur-2xl opacity-50',
                            config.bgColor
                        )} />

                        {/* Badge */}
                        <BadgeIcon badge={badge} size="xl" unlocked />
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                        Badge Unlocked! 🎉
                    </h2>

                    {/* Badge name */}
                    <p className={cn('text-xl font-bold mb-2', config.color)}>
                        {config.label}
                    </p>

                    {/* Description */}
                    <p className="text-muted-foreground mb-6">
                        {config.description}
                    </p>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={handleShare}
                            variant="default"
                            className="w-full"
                        >
                            <Share2 className="w-4 h-4 mr-2" />
                            Share Achievement
                        </Button>

                        {onViewAllBadges && (
                            <Button
                                onClick={onViewAllBadges}
                                variant="outline"
                                className="w-full"
                            >
                                View All Badges
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        )}

                        <Button
                            onClick={onClose}
                            variant="ghost"
                            className="w-full"
                        >
                            Continue
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Add shine animation to globals.css or index.css
// @keyframes shine {
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(100%); }
// }
// .animate-shine {
//   animation: shine 2s ease-in-out infinite;
// }
