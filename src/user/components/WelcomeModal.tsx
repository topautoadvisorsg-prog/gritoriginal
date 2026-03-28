import React, { useState, useCallback } from 'react';
import { Swords, ChevronRight, Loader2 } from 'lucide-react';
import { COUNTRIES } from '@/shared/lib/countries';
import { useQueryClient } from '@tanstack/react-query';
import './WelcomeModal.css';

/* MMA-themed avatar options */
const AVATARS = ['🥊', '🥋', '🦅', '🐺', '🦁', '🐉', '🏆', '⚔️', '🔥', '💀'];

interface WelcomeModalProps {
    onComplete: () => void;
}

export default function WelcomeModal({ onComplete }: WelcomeModalProps) {
    const queryClient = useQueryClient();
    const [username, setUsername] = useState('');
    const [country, setCountry] = useState('');
    const [avatar, setAvatar] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const isValid = username.length >= 3 && country.length > 0;

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid || submitting) return;

        setSubmitting(true);
        setError('');

        try {
            const res = await fetch('/api/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username.trim(),
                    country,
                    // Store avatar emoji as a simple string in avatarUrl for now
                    // The app can render this as the fallback when no real image is set
                    avatarUrl: avatar || null,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.message || 'Something went wrong');
                setSubmitting(false);
                return;
            }

            // Invalidate user cache so the app picks up the new profile
            await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
            onComplete();
        } catch {
            setError('Network error. Please try again.');
            setSubmitting(false);
        }
    }, [username, country, avatar, isValid, submitting, queryClient, onComplete]);

    return (
        <div className="welcome-overlay">
            <div className="welcome-modal">
                <div className="welcome-modal__icon"><Swords size={28} /></div>
                <h2 className="welcome-modal__title display-font">Welcome to GRIT</h2>
                <p className="welcome-modal__subtitle">
                    Pick a username, choose your country, and grab a profile picture — then you're in the fight.
                </p>

                <form className="welcome-modal__form" onSubmit={handleSubmit}>
                    {/* Username */}
                    <div className="welcome-modal__field">
                        <label className="welcome-modal__label">Username</label>
                        <input
                            className={`welcome-modal__input ${error.toLowerCase().includes('username') ? 'welcome-modal__input--error' : ''}`}
                            type="text"
                            placeholder="e.g. NightHawk, OctagonKing"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                            maxLength={50}
                            minLength={3}
                            autoFocus
                        />
                        {username.length > 0 && username.length < 3 && (
                            <span className="welcome-modal__error">Must be at least 3 characters</span>
                        )}
                    </div>

                    {/* Country */}
                    <div className="welcome-modal__field">
                        <label className="welcome-modal__label">Country</label>
                        <select
                            className="welcome-modal__select"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                        >
                            <option value="">Select your country</option>
                            {COUNTRIES.map((c) => (
                                <option key={c.code} value={c.name}>
                                    {c.flag} {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Avatar */}
                    <div className="welcome-modal__field">
                        <label className="welcome-modal__label">Profile Picture</label>
                        <div className="welcome-modal__avatars">
                            {AVATARS.map((a) => (
                                <button
                                    type="button"
                                    key={a}
                                    className={`welcome-modal__avatar ${avatar === a ? 'welcome-modal__avatar--selected' : ''}`}
                                    onClick={() => setAvatar(a)}
                                >
                                    {a}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Error */}
                    {error && <div className="welcome-modal__error">{error}</div>}

                    {/* Submit */}
                    <button
                        type="submit"
                        className="welcome-modal__submit"
                        disabled={!isValid || submitting}
                    >
                        {submitting ? (
                            <><Loader2 size={18} className="animate-spin" /> Setting up...</>
                        ) : (
                            <>JOIN GRIT <ChevronRight size={18} /></>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
