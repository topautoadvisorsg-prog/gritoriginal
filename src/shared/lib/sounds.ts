import { Howl } from 'howler';

// Sound definitions
const SOUNDS: Record<string, { src: string; volume: number }> = {
    click: { src: '/sounds/click.mp3', volume: 0.3 },
    impact: { src: '/sounds/impact.mp3', volume: 0.5 },    // For KO picks
    chime: { src: '/sounds/chime.mp3', volume: 0.5 },      // For Submission picks
    confirm: { src: '/sounds/confirm.mp3', volume: 0.4 },  // For Decision picks / Lock
    fanfare: { src: '/sounds/fanfare.mp3', volume: 0.6 },  // For Badge unlocks
    ambience: { src: '/sounds/ambience.mp3', volume: 0.2 }, // Background music
};

// Cache for loaded sounds
const soundCache: Map<string, Howl> = new Map();

// Check if sounds are enabled
const areSoundsEnabled = (): boolean => {
    try {
        const settings = localStorage.getItem('gamification-settings');
        if (settings) {
            const parsed = JSON.parse(settings);
            return parsed.enableSounds !== false;
        }
    } catch {
        // Default to enabled
    }
    return true;
};

/**
 * Preload sounds for faster playback
 */
export function preloadSounds(): void {
    Object.entries(SOUNDS).forEach(([name, config]) => {
        if (!soundCache.has(name)) {
            const sound = new Howl({
                src: [config.src],
                volume: config.volume,
                preload: true,
            });
            soundCache.set(name, sound);
        }
    });
}

/**
 * Play a sound by name
 * Respects user's sound preference
 */
export function playSound(name: keyof typeof SOUNDS): void {
    if (!areSoundsEnabled()) return;

    let sound = soundCache.get(name);

    if (!sound) {
        const config = SOUNDS[name];
        if (!config) {
            console.warn(`Sound "${name}" not found`);
            return;
        }

        sound = new Howl({
            src: [config.src],
            volume: config.volume,
        });
        soundCache.set(name, sound);
    }

    sound.play();
}

/**
 * Play click sound (for selections)
 */
export function playClick(): void {
    playSound('click');
}

/**
 * Play impact sound (for KO/TKO picks)
 */
export function playImpact(): void {
    playSound('impact');
}

/**
 * Play chime sound (for Submission picks)
 */
export function playChime(): void {
    playSound('chime');
}

/**
 * Play confirm sound (for Decision picks/Lock)
 */
export function playConfirm(): void {
    playSound('confirm');
}

/**
 * Play fanfare (for achievements/badges)
 */
export function playFanfare(): void {
    playSound('fanfare');
}

// Sound type for external use
export type SoundName = keyof typeof SOUNDS;
