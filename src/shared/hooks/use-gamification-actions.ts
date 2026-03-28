import { useCallback } from 'react';
import { useGamification } from '@/shared/context/GamificationContext';
import { playSound, playClick, playImpact, playChime, playConfirm, playFanfare, SoundName } from '@/shared/lib/sounds';

/**
 * Hook for gamification actions
 * Provides easy-to-use functions for triggering celebrations and sounds
 */
export function useGamificationActions() {
    const { gamificationSettings } = useGamification();

    // Sound actions (check settings before playing)
    const sound = useCallback((name: SoundName) => {
        if (gamificationSettings.enableSounds) {
            playSound(name);
        }
    }, [gamificationSettings.enableSounds]);

    const click = useCallback(() => {
        if (gamificationSettings.enableSounds) {
            playClick();
        }
    }, [gamificationSettings.enableSounds]);

    // KO / TKO
    const impact = useCallback(() => {
        if (gamificationSettings.enableSounds) {
            playImpact();
        }
    }, [gamificationSettings.enableSounds]);

    // Submission
    const chime = useCallback(() => {
        if (gamificationSettings.enableSounds) {
            playChime();
        }
    }, [gamificationSettings.enableSounds]);

    // Decision / Confirm
    const confirm = useCallback(() => {
        if (gamificationSettings.enableSounds) {
            playConfirm();
        }
    }, [gamificationSettings.enableSounds]);

    const fanfare = useCallback(() => {
        if (gamificationSettings.enableSounds) {
            playFanfare();
        }
    }, [gamificationSettings.enableSounds]);

    // Legacy wrapper for lock (uses click/confirm based on preference check, sticking to click per instruction)
    const lock = useCallback(() => {
        if (gamificationSettings.enableSounds) {
            playClick();
        }
    }, [gamificationSettings.enableSounds]);

    // Combined actions (Refactored to remove confetti)

    const celebratePickLock = useCallback(() => {
        lock();
    }, [lock]);

    const celebrateBadgeEarned = useCallback(() => {
        fanfare();
        // Confetti removed, visual shimmer handled by component
    }, [fanfare]);

    return {
        // Individual sounds
        sound,
        click,
        impact,
        chime,
        confirm,
        fanfare,
        lock,

        // Semantic wrappers (for backward compatibility if needed, or convenience)
        playClick: click,
        playImpact: impact,
        playChime: chime,
        playConfirm: confirm,
        playFanfare: fanfare,

        // High-level triggers
        celebratePickLock,
        celebrateBadgeEarned,
    };
}
