import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { preloadSounds } from '@/shared/lib/sounds';

export interface GamificationSettings {
    enableSounds: boolean;
    enableCelebrations: boolean;
    showStreaksPublicly: boolean;
    showBadgesPublicly: boolean;
}

export interface NotificationSettings {
    eventReminders: boolean;
    pickDeadlineAlerts: boolean;
    resultNotifications: boolean;
    leaderboardUpdates: boolean;
}

interface GamificationContextType {
    gamificationSettings: GamificationSettings;
    updateGamificationSettings: (settings: Partial<GamificationSettings>) => void;
    notificationSettings: NotificationSettings;
    updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
    toggleSounds: () => void;
    toggleCelebrations: () => void;
    musicEnabled: boolean;
    toggleMusic: () => void;
    musicVolume: number;
    setMusicVolume: (vol: number) => void;
    isLoading: boolean;
}

const defaultGamificationSettings: GamificationSettings = {
    enableSounds: true,
    enableCelebrations: true,
    showStreaksPublicly: true,
    showBadgesPublicly: true,
};

const defaultNotificationSettings: NotificationSettings = {
    eventReminders: true,
    pickDeadlineAlerts: true,
    resultNotifications: true,
    leaderboardUpdates: false,
};

const GamificationContext = createContext<GamificationContextType | null>(null);

const GAMIFICATION_STORAGE_KEY = 'gamification-settings';
const NOTIFICATION_STORAGE_KEY = 'notification-settings';

interface GamificationProviderProps {
    children: ReactNode;
}

export function GamificationProvider({ children }: GamificationProviderProps) {
    const [gamificationSettings, setGamificationSettings] = useState<GamificationSettings>(defaultGamificationSettings);
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);

    const [musicEnabled, setMusicEnabled] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('music-settings');
            return saved ? JSON.parse(saved).enabled : false;
        }
        return false;
    });
    const [musicVolume, setMusicVolume] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('music-settings');
            return saved ? JSON.parse(saved).volume : 0.3;
        }
        return 0.3;
    });

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        localStorage.setItem('music-settings', JSON.stringify({ enabled: musicEnabled, volume: musicVolume }));
    }, [musicEnabled, musicVolume]);

    useEffect(() => {
    }, [musicEnabled, musicVolume]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/me/settings', {
                    credentials: 'include',
                });

                if (response.ok) {
                    const settings = await response.json();

                    setGamificationSettings(prev => ({
                        ...prev,
                        enableSounds: settings.enableSounds,
                        enableCelebrations: settings.enableCelebrations,
                        showStreaksPublicly: settings.showStreaks,
                        showBadgesPublicly: settings.showBadges,
                    }));

                    setNotificationSettings(prev => ({
                        ...prev,
                        eventReminders: settings.enableEventReminders,
                        pickDeadlineAlerts: settings.enablePushNotifications,
                        resultNotifications: settings.enableResultAlerts,
                        leaderboardUpdates: settings.enableLeaderboardUpdates,
                    }));
                }
            } catch (error) {
                console.warn('Failed to load settings from backend:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
        preloadSounds();
    }, []);

    const saveSettingsToBackend = useCallback(async (key: string, value: boolean) => {
        try {
            await fetch('/api/me/settings', {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ key, value })
            });
        } catch (error) {
            console.error('Failed to save setting:', error);
        }
    }, []);

    const updateGamificationSettings = useCallback((updates: Partial<GamificationSettings>) => {
        setGamificationSettings(prev => {
            const newSettings = { ...prev, ...updates };
            Object.entries(updates).forEach(([key, value]) => {
                let backendKey = key;
                if (key === 'showStreaksPublicly') backendKey = 'showStreaks';
                if (key === 'showBadgesPublicly') backendKey = 'showBadges';

                if (typeof value === 'boolean') {
                    saveSettingsToBackend(backendKey, value);
                }
            });
            return newSettings;
        });
    }, [saveSettingsToBackend]);

    const updateNotificationSettings = useCallback((updates: Partial<NotificationSettings>) => {
        setNotificationSettings(prev => {
            const newSettings = { ...prev, ...updates };
            Object.entries(updates).forEach(([key, value]) => {
                let backendKey = key;
                if (key === 'eventReminders') backendKey = 'enableEventReminders';
                if (key === 'pickDeadlineAlerts') backendKey = 'enablePushNotifications';
                if (key === 'resultNotifications') backendKey = 'enableResultAlerts';
                if (key === 'leaderboardUpdates') backendKey = 'enableLeaderboardUpdates';

                if (typeof value === 'boolean') {
                    saveSettingsToBackend(backendKey, value);
                }
            });
            return newSettings;
        });
    }, [saveSettingsToBackend]);

    const toggleSounds = useCallback(() => {
        setGamificationSettings(prev => ({ ...prev, enableSounds: !prev.enableSounds }));
    }, []);

    const toggleCelebrations = useCallback(() => {
        setGamificationSettings(prev => ({ ...prev, enableCelebrations: !prev.enableCelebrations }));
    }, []);

    return (
        <GamificationContext.Provider
            value={{
                gamificationSettings,
                updateGamificationSettings,
                notificationSettings,
                updateNotificationSettings,
                toggleSounds,
                toggleCelebrations,
                musicEnabled,
                toggleMusic: () => setMusicEnabled((prev: boolean) => !prev),
                musicVolume,
                setMusicVolume,
                isLoading,
            }}
        >
            {children}
        </GamificationContext.Provider>
    );
}

export function useGamification(): GamificationContextType {
    const context = useContext(GamificationContext);
    if (!context) {
        throw new Error('useGamification must be used within a GamificationProvider');
    }
    return context;
}

export function useSoundsEnabled(): boolean {
    const context = useContext(GamificationContext);
    return context?.gamificationSettings.enableSounds ?? true;
}

export function useCelebrationsEnabled(): boolean {
    const context = useContext(GamificationContext);
    return context?.gamificationSettings.enableCelebrations ?? true;
}
