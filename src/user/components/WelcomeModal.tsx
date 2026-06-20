import React, { useState, useCallback, useRef } from 'react';
import { Swords, ChevronRight, Loader2, Camera } from 'lucide-react';
import { COUNTRIES } from '@/shared/lib/countries';
import { useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import './WelcomeModal.css';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface WelcomeModalProps {
    onComplete: () => void;
}

export default function WelcomeModal({ onComplete }: WelcomeModalProps) {
    const queryClient = useQueryClient();
    const [username, setUsername] = useState('');
    const [country, setCountry] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isValid = username.length >= 3 && country.length > 0;

    // Reuses the same presigned-URL avatar flow as Settings.tsx:
    // request-url -> PUT file -> confirm. Confirm persists avatarUrl server-side.
    const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > MAX_AVATAR_BYTES) {
            setError('Image must be less than 2MB');
            return;
        }
        if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
            setError('Only JPG, PNG, and WebP are allowed');
            return;
        }

        setUploading(true);
        setError('');
        try {
            const urlRes = await fetch('/api/me/avatar/request-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ size: file.size, contentType: file.type }),
            });
            if (!urlRes.ok) throw new Error('Failed to get upload URL');
            const { uploadURL, objectPath } = await urlRes.json();

            const putRes = await fetch(uploadURL, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type },
            });
            if (!putRes.ok) throw new Error('Failed to upload image');

            const confirmRes = await fetch('/api/me/avatar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ objectPath }),
            });
            if (!confirmRes.ok) throw new Error('Failed to save image');
            const data = await confirmRes.json();
            setAvatarUrl(data.avatarUrl || data.profileImageUrl || URL.createObjectURL(file));
        } catch {
            setError('Image upload failed. Try again.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, []);

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
                    // Avatar (if any) is already persisted by the /api/me/avatar
                    // confirm step; resend for idempotency.
                    avatarUrl: avatarUrl || null,
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
                        <Select value={country} onValueChange={setCountry}>
                            <SelectTrigger className="welcome-modal__select" aria-label="Country" data-testid="welcome-country-select">
                                <SelectValue placeholder="Select your country" />
                            </SelectTrigger>
                            <SelectContent>
                                {COUNTRIES.map((c) => (
                                    <SelectItem key={c.code} value={c.name}>
                                        <span className={`fi fi-${c.code.toLowerCase()} mr-2`} /> {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Avatar — real image upload */}
                    <div className="welcome-modal__field">
                        <label className="welcome-modal__label">Profile Picture <span className="welcome-modal__optional">(optional)</span></label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="welcome-modal__file-input"
                            onChange={handleAvatarUpload}
                            disabled={uploading}
                        />
                        <button
                            type="button"
                            className="welcome-modal__upload"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                        >
                            <span className="welcome-modal__upload-preview">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Profile preview" />
                                ) : (
                                    <Camera size={24} />
                                )}
                                {uploading && (
                                    <span className="welcome-modal__upload-spinner">
                                        <Loader2 size={20} className="animate-spin" />
                                    </span>
                                )}
                            </span>
                            <span className="welcome-modal__upload-text">
                                {uploading ? 'Uploading…' : avatarUrl ? 'Change photo' : 'Upload a photo'}
                                <small>JPG, PNG or WebP · max 2MB</small>
                            </span>
                        </button>
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
