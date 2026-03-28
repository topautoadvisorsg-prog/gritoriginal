import confetti from 'canvas-confetti';

// Check if celebrations are enabled (will be connected to context later)
const areCelebrationsEnabled = (): boolean => {
    try {
        const settings = localStorage.getItem('gamification-settings');
        if (settings) {
            const parsed = JSON.parse(settings);
            return parsed.enableCelebrations !== false;
        }
    } catch {
        // Default to enabled
    }
    return true;
};

/**
 * Trigger standard confetti burst
 * Used for: pick locked, correct prediction
 */
export function triggerConfetti(): void {
    if (!areCelebrationsEnabled()) return;

    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00d4ff', '#7c3aed', '#f59e0b', '#10b981'],
    });
}

/**
 * Trigger gold-themed confetti for badges
 * Used for: badge earned, champion tier
 */
export function triggerBadgeConfetti(): void {
    if (!areCelebrationsEnabled()) return;

    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
        confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#ffd700', '#ffb700', '#ff8c00'],
        });
        confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#ffd700', '#ffb700', '#ff8c00'],
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    };

    frame();
}

/**
 * Trigger star confetti for perfect picks
 */
export function triggerStarConfetti(): void {
    if (!areCelebrationsEnabled()) return;

    const defaults = {
        spread: 360,
        ticks: 100,
        gravity: 0,
        decay: 0.94,
        startVelocity: 30,
        shapes: ['star'] as confetti.Shape[],
        colors: ['#ffd700', '#00d4ff', '#7c3aed'],
    };

    confetti({
        ...defaults,
        particleCount: 40,
        scalar: 1.2,
    });

    confetti({
        ...defaults,
        particleCount: 20,
        scalar: 0.75,
    });
}

/**
 * Trigger multi-color fountain for top 3 finish
 */
export function triggerPodiumConfetti(): void {
    if (!areCelebrationsEnabled()) return;

    const duration = 3000;
    const end = Date.now() + duration;

    const colors = [
        ['#ffd700', '#ffc800'], // Gold
        ['#c0c0c0', '#a8a8a8'], // Silver
        ['#cd7f32', '#b87333'], // Bronze
    ];

    const frame = () => {
        colors.forEach((colorPair, i) => {
            confetti({
                particleCount: 2,
                angle: 90,
                spread: 45,
                origin: { x: 0.3 + i * 0.2, y: 1 },
                colors: colorPair,
                startVelocity: 45,
                gravity: 1.2,
            });
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    };

    frame();
}
