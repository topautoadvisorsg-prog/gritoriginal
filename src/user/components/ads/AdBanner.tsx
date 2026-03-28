
import React, { useEffect, useState } from 'react';
import { useAds } from '@/shared/hooks/use-ads';
import { cn } from '@/shared/lib/utils';
import { X } from 'lucide-react';
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

interface AdBannerProps {
    slotId?: string;
    format?: 'banner' | 'large_banner' | 'leaderboard';
    className?: string;
    position?: 'bottom' | 'inline';
}

export const AdBanner: React.FC<AdBannerProps> = ({
    slotId = 'default-slot',
    format = 'banner',
    className,
    position = 'bottom'
}) => {
    const { showAds } = useAds();
    const [isVisible, setIsVisible] = useState(true);
    const [isNative, setIsNative] = useState(false);

    useEffect(() => {
        // Check platform on mount
        setIsNative(Capacitor.isNativePlatform());

        if (showAds && Capacitor.isNativePlatform()) {
            // Initialize and show AdMob Banner on Native
            const showNativeAd = async () => {
                try {
                    await AdMob.initialize();
                    await AdMob.showBanner({
                        adId: 'YOUR_AD_UNIT_ID', // Replace with Env Var or Config
                        position: BannerAdPosition.BOTTOM_CENTER,
                        adSize: BannerAdSize.BANNER,
                        // margin: 0 
                    });
                } catch (e) {
                    console.error("AdMob Error:", e);
                }
            };
            showNativeAd();

            // Cleanup
            return () => {
                AdMob.hideBanner().catch(err => console.log("Error hiding banner", err));
            };
        }
    }, [showAds]);


    if (!showAds || !isVisible) return null;

    // --- NATIVE ENV ---
    if (isNative) {
        // On native, AdMob renders an overlay. We just need a spacer 
        // if the position is 'bottom' so content doesn't get hidden.
        // AdMob Standard Banner is usually 50dp high.
        if (position === 'bottom') {
            return <div className="h-[50px] w-full bg-transparent pointer-events-none" />;
        }
        return null; // Inline native ads require different handling (Custom Native Ads)
    }

    // --- MACRO / WEB ENV (Placeholder) ---
    const dimensions = {
        banner: 'h-[50px] w-[320px]',
        large_banner: 'h-[100px] w-[320px]',
        leaderboard: 'h-[90px] w-[728px]',
    }[format];

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center bg-background/95 border-t border-border backdrop-blur supports-[backdrop-filter]:bg-background/60",
                position === 'bottom' ? "fixed bottom-0 left-0 right-0 z-50 py-2 transition-transform" : "relative py-4",
                className
            )}
        >
            <div className={cn(
                "bg-muted/50 border border-dashed border-muted-foreground/30 rounded flex items-center justify-center relative overflow-hidden",
                dimensions
            )}>
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest text-center px-4">
                    Ad Space <br />
                    <span className="text-[10px] opacity-70">({format} - {slotId})</span>
                </div>

                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute top-1 right-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 block opacity-60 hover:opacity-100 transition-opacity"
                    aria-label="Close Ad"
                >
                    <X className="w-3 h-3 text-muted-foreground" />
                </button>
            </div>

            <div className="text-[10px] text-muted-foreground/50 mt-1">
                Advertisement • <button className="hover:underline">Remove Ads</button>
            </div>
        </div>
    );
};
