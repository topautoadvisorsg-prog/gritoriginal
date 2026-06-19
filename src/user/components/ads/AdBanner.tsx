
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

    // --- WEB ENV ---
    // No web ad network is wired yet. Render nothing rather than a dashed
    // "Ad Space" placeholder, which reads as unfinished scaffolding to users.
    // When a real web creative/slot lands, render it in place of this guard.
    return null;
};
