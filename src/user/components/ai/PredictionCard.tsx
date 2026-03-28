import React from 'react';
import { cn } from '@/shared/lib/utils';
import {
    Brain,
    TrendingUp,
    AlertTriangle,
    Loader2,
    Crown,
    Sparkles,
    Zap,
    Target,
    RefreshCw
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

interface Prediction {
    predictedWinner: string;
    confidence: number;
    likelyMethod: string;
    likelyRound: number | null;
    keyFactors: string[];
    upset: boolean;
}

interface PredictionCardProps {
    fighter1Name: string;
    fighter2Name: string;
    prediction: Prediction | null;
    isLoading: boolean;
    onGenerate: () => void;
    isPremium: boolean;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({
    fighter1Name,
    fighter2Name,
    prediction,
    isLoading,
    onGenerate,
    isPremium,
}) => {
    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 75) return { text: 'text-green-400', bg: 'bg-green-500', glow: 'shadow-green-500/30' };
        if (confidence >= 55) return { text: 'text-yellow-400', bg: 'bg-yellow-500', glow: 'shadow-yellow-500/30' };
        return { text: 'text-orange-400', bg: 'bg-orange-500', glow: 'shadow-orange-500/30' };
    };

    const getConfidenceLabel = (confidence: number) => {
        if (confidence >= 80) return 'Very High';
        if (confidence >= 65) return 'High';
        if (confidence >= 50) return 'Moderate';
        return 'Low';
    };

    // Premium Gate
    if (!isPremium) {
        return (
            <div className="relative p-6 rounded-xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-card to-amber-500/5 overflow-hidden">
                {/* Animated shine */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent animate-shine" />

                <div className="relative text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/20 mb-4">
                        <Crown className="w-8 h-8 text-yellow-400" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">Premium Feature</h3>
                    <p className="text-muted-foreground mb-4">
                        Unlock AI fight analysis with a Premium subscription
                    </p>
                    <Button className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-black font-bold">
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to Premium
                    </Button>
                </div>
            </div>
        );
    }

    // No prediction yet
    if (!prediction && !isLoading) {
        return (
            <div className="relative p-6 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-cyan-500/5 overflow-hidden">
                {/* Subtle animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shine" style={{ animationDuration: '3s' }} />

                <div className="relative text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 mb-4">
                        <Brain className="w-10 h-10 text-primary opacity-60" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">Generate AI Analysis</h3>
                    <p className="text-muted-foreground mb-6">
                        Get an AI-powered analysis for<br />
                        <span className="text-foreground font-semibold">{fighter1Name}</span> vs <span className="text-foreground font-semibold">{fighter2Name}</span>
                    </p>
                    <Button
                        onClick={onGenerate}
                        disabled={isLoading}
                        size="lg"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Analysis
                    </Button>
                </div>
            </div>
        );
    }

    // Loading State
    if (isLoading) {
        return (
            <div className="relative p-8 rounded-xl border border-primary/30 bg-card overflow-hidden">
                {/* Animated scanning effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-primary/10 animate-pulse" />

                <div className="relative text-center py-8">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse" />
                        <Brain className="w-16 h-16 text-primary relative animate-pulse" />
                    </div>
                    <p className="text-foreground font-semibold mt-4 mb-2">Analyzing Fight Data</p>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing fighter stats, history & matchup...
                    </div>
                </div>
            </div>
        );
    }

    if (!prediction) return null;

    const confidenceStyle = getConfidenceColor(prediction.confidence);

    // Prediction Result
    return (
        <div className="relative rounded-xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden">
            {/* Glow effect for high confidence */}
            {prediction.confidence >= 75 && (
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
            )}

            {/* Header */}
            <div className="relative p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                        <Brain className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                    <h3 className="font-bold text-foreground">AI Fight Analysis</h3>
                        <p className="text-xs text-muted-foreground">GPT-4o Analysis</p>
                    </div>
                </div>

                {prediction.upset && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/40">
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                        <span className="text-xs font-bold text-orange-400 uppercase">Upset Pick</span>
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="relative p-5 space-y-5">
                {/* Winner Prediction */}
                <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Favored Fighter</p>
                    <div className={cn(
                        "inline-flex items-center gap-2 px-6 py-3 rounded-xl",
                        "bg-gradient-to-r from-primary/20 to-cyan-500/20",
                        "border border-primary/40"
                    )}>
                        <Zap className="w-5 h-5 text-primary" />
                        <span className="text-2xl font-bold text-gradient-brand">{prediction.predictedWinner}</span>
                    </div>
                </div>

                {/* Confidence Meter */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Confidence Level
                        </span>
                        <span className={cn('text-lg font-bold', confidenceStyle.text)}>
                            {prediction.confidence}%
                        </span>
                    </div>

                    {/* Animated Progress Bar */}
                    <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                        <div
                            className={cn(
                                'h-full rounded-full transition-all duration-1000 ease-out',
                                confidenceStyle.bg,
                                'shadow-lg',
                                confidenceStyle.glow
                            )}
                            style={{ width: `${prediction.confidence}%` }}
                        />
                        {/* Shine effect on bar */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine" />
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Low</span>
                        <span className={cn('font-semibold', confidenceStyle.text)}>
                            {getConfidenceLabel(prediction.confidence)}
                        </span>
                        <span>High</span>
                    </div>
                </div>

                {/* Method & Round */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Likely Method</p>
                        <p className="font-bold text-foreground text-lg">{prediction.likelyMethod}</p>
                    </div>
                    {prediction.likelyRound && (
                        <div className="p-4 rounded-xl bg-muted/50 border border-border">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Likely Round</p>
                            <p className="font-bold text-foreground text-lg">Round {prediction.likelyRound}</p>
                        </div>
                    )}
                </div>

                {/* Key Factors */}
                <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Key Factors
                    </p>
                    <ul className="space-y-2">
                        {prediction.keyFactors.map((factor, index) => (
                            <li
                                key={index}
                                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                            >
                                <div className="p-1 rounded-full bg-primary/20 mt-0.5">
                                    <Sparkles className="w-3 h-3 text-primary" />
                                </div>
                                <span className="text-sm text-foreground">{factor}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Footer */}
            <div className="px-5 pb-5">
                <Button
                    variant="outline"
                    onClick={onGenerate}
                    disabled={isLoading}
                    className="w-full border-primary/30 hover:bg-primary/10"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate Prediction
                </Button>
            </div>
        </div>
    );
};
