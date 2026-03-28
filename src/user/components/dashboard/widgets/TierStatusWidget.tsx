import React from 'react';
import { Crown, Shield, Clock, ArrowUpCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

interface TierStatusWidgetProps {
    tier: string;
    currentPeriodEnd: string | null;
}

export const TierStatusWidget: React.FC<TierStatusWidgetProps> = ({ tier, currentPeriodEnd }) => {
    const isPremium = tier === 'premium';
    const isPro = tier === 'medium';
    const isFree = tier === 'free';

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                {isPremium ? <Crown className="h-16 w-16" /> : <Shield className="h-16 w-16" />}
            </div>

            <div className="flex flex-col h-full justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Subscription
                    </h3>
                    <div className="flex items-center gap-2 mb-4">
                        <span className={cn(
                            "text-2xl font-display uppercase tracking-tight",
                            isPremium ? "text-amber-400" : isPro ? "text-slate-300" : "text-foreground/60"
                        )}>
                            {tier === 'free' ? 'Free Member' : tier === 'medium' ? 'Pro Member' : 'Elite Member'}
                        </span>
                        {isPremium && <Crown className="h-5 w-5 text-amber-400" />}
                        {isPro && <Shield className="h-5 w-5 text-slate-300" />}
                    </div>

                    {!isFree && currentPeriodEnd && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                            <Clock className="h-4 w-4" />
                            <span>Renews on {formatDate(currentPeriodEnd)}</span>
                        </div>
                    )}

                    {isFree && (
                        <p className="text-sm text-muted-foreground mb-6">
                            Upgrade to unlock premium AI insights, real-time event chats, and exclusive badges.
                        </p>
                    )}
                </div>

                {isFree ? (
                    <Button className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold h-11">
                        UPGRADE TO ELITE
                    </Button>
                ) : (
                    <Button variant="outline" className="w-full h-11 border-border bg-muted/20 hover:bg-muted/40">
                        MANAGE SUBSCRIPTION
                    </Button>
                )}
            </div>
        </div>
    );
};
