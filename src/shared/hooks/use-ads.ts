
import { useAuth } from './use-auth';

export const useAds = () => {
    const { user } = useAuth();

    // Logic:
    // - Guest (no user) -> Show Ad
    // - 'free' tier -> Show Ad
    // - 'plus', 'pro', 'premium' -> Hide Ad
    const showAds = !user || user.tier === 'free';

    return {
        showAds,
        userTier: user?.tier || 'guest',
        isPremium: !!user && user.tier !== 'free'
    };
};
