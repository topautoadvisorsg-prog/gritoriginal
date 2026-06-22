/**
 * 7-Step Onboarding Flow — Blueprint §13.
 *
 * Replaces the single-screen WelcomeModal. Skippable but visible at any step.
 * Profile setup (step 2) saves to /api/me via PATCH; remaining steps are informational
 * content from the master blueprint to teach picks/scoring/progression/qualification.
 *
 * Mount: rendered from App.tsx when user is signed in but has no username set.
 * On final step, calls onComplete() to dismiss for the session.
 */
import React, { useState, useCallback, useRef } from 'react';
import { Swords, ChevronRight, ChevronLeft, X, Loader2, Trophy, Target, TrendingUp, Crown, Sparkles, Camera } from 'lucide-react';
import { COUNTRIES } from '@/shared/lib/countries';
import { useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface OnboardingFlowProps {
  onComplete: () => void;
}

const TOTAL_STEPS = 7;

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [country, setCountry] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isProfileValid = username.length >= 3 && country.length > 0;

  // Real headshot upload — same presigned-URL flow as Settings.tsx.
  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_AVATAR_BYTES) { setError('Image must be less than 2MB'); return; }
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) { setError('Only JPG, PNG, and WebP are allowed'); return; }
    setUploading(true);
    setError('');
    try {
      const urlRes = await fetch('/api/me/avatar/request-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ size: file.size, contentType: file.type }),
      });
      if (!urlRes.ok) throw new Error();
      const { uploadURL, objectPath } = await urlRes.json();
      const putRes = await fetch(uploadURL, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      if (!putRes.ok) throw new Error();
      const confirmRes = await fetch('/api/me/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectPath }),
      });
      if (!confirmRes.ok) throw new Error();
      const data = await confirmRes.json();
      setAvatarUrl(data.avatarUrl || data.profileImageUrl || URL.createObjectURL(file));
    } catch {
      setError('Image upload failed. Try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  const saveProfile = useCallback(async (): Promise<boolean> => {
    if (!isProfileValid || submitting) return false;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          country,
          avatarUrl: avatarUrl || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Something went wrong');
        setSubmitting(false);
        return false;
      }
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      setProfileSaved(true);
      setSubmitting(false);
      return true;
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
      return false;
    }
  }, [username, country, avatarUrl, isProfileValid, submitting, queryClient]);

  const goNext = useCallback(async () => {
    // Step 2 requires profile save before advancing.
    if (step === 2 && !profileSaved) {
      const ok = await saveProfile();
      if (!ok) return;
    }
    if (step < TOTAL_STEPS) setStep(step + 1);
    else onComplete();
  }, [step, profileSaved, saveProfile, onComplete]);

  const goBack = useCallback(() => {
    if (step > 1) setStep(step - 1);
  }, [step]);

  const skip = useCallback(() => onComplete(), [onComplete]);

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Progress + skip */}
        <div style={topBarStyle}>
          <div style={progressBarStyle}>
            <div style={{ ...progressFillStyle, width: `${(step / TOTAL_STEPS) * 100}%` }} />
          </div>
          <button onClick={skip} style={skipBtnStyle} aria-label="Skip onboarding">
            <X size={16} /> Skip
          </button>
        </div>

        {/* Step content */}
        <div style={contentStyle}>
          {step === 1 && <StepWelcome />}
          {step === 2 && (
            <StepProfile
              username={username}
              setUsername={setUsername}
              country={country}
              setCountry={setCountry}
              avatarUrl={avatarUrl}
              uploading={uploading}
              onPickAvatar={() => fileInputRef.current?.click()}
              fileInputRef={fileInputRef}
              onAvatarChange={handleAvatarUpload}
              error={error}
              profileSaved={profileSaved}
            />
          )}
          {step === 3 && <StepPicks />}
          {step === 4 && <StepScoring />}
          {step === 5 && <StepProgression />}
          {step === 6 && <StepQualification />}
          {step === 7 && <StepDashboard />}
        </div>

        {/* Nav */}
        <div style={navStyle}>
          {step > 1 ? (
            <button onClick={goBack} style={backBtnStyle} disabled={submitting}>
              <ChevronLeft size={18} /> Back
            </button>
          ) : <span />}

          <span style={stepCounterStyle}>Step {step} of {TOTAL_STEPS}</span>

          <button
            onClick={goNext}
            style={nextBtnStyle}
            disabled={submitting || (step === 2 && !isProfileValid && !profileSaved)}
          >
            {submitting ? (
              <><Loader2 size={18} className="animate-spin" /> Saving...</>
            ) : step === TOTAL_STEPS ? (
              <>Enter GRIT <Sparkles size={18} /></>
            ) : (
              <>Next <ChevronRight size={18} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Step Components ──────────────────────────────────────────────────────

function StepWelcome() {
  return (
    <div style={stepContainerStyle}>
      <div style={iconCircleStyle}><Swords size={36} /></div>
      <h2 style={titleStyle}>Welcome to GRIT</h2>
      <p style={leadStyle}>
        You're about to compete against the world using your MMA knowledge.
        <br/><br/>
        <strong>No betting. Pure skill.</strong>
      </p>
    </div>
  );
}

function StepProfile({ username, setUsername, country, setCountry, avatarUrl, uploading, onPickAvatar, fileInputRef, onAvatarChange, error, profileSaved }: {
  username: string; setUsername: (v: string) => void;
  country: string; setCountry: (v: string) => void;
  avatarUrl: string | null;
  uploading: boolean;
  onPickAvatar: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: string;
  profileSaved: boolean;
}) {
  return (
    <div style={stepContainerStyle}>
      <h2 style={titleStyle}>Set Up Your Profile</h2>
      <p style={leadStyle}>Pick how you'll show up on the leaderboard.</p>

      <div style={fieldStyle}>
        <label style={labelStyle}>Display Name</label>
        <input
          style={inputStyle}
          type="text"
          placeholder="e.g. NightHawk, OctagonKing"
          value={username}
          onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
          maxLength={50}
          minLength={3}
          autoFocus
          disabled={profileSaved}
        />
        {username.length > 0 && username.length < 3 && (
          <span style={errorStyle}>Must be at least 3 characters</span>
        )}
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Country</label>
        <Select value={country} onValueChange={setCountry} disabled={profileSaved}>
          <SelectTrigger style={inputStyle} aria-label="Country" data-testid="onboarding-country-select">
            <SelectValue placeholder="Select your country" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map(c => (
              <SelectItem key={c.code} value={c.code}>
                <span className={`fi fi-${c.code.toLowerCase()}`} style={{ marginRight: 8 }} /> {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Profile Picture (optional)</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={onAvatarChange}
          disabled={profileSaved || uploading}
        />
        <button type="button" style={uploadZoneStyle} onClick={onPickAvatar} disabled={profileSaved || uploading}>
          <span style={uploadPreviewStyle}>
            {avatarUrl
              ? <img src={avatarUrl} alt="Profile preview" style={uploadImgStyle} />
              : <Camera size={22} />}
            {uploading && (
              <span style={uploadSpinnerStyle}><Loader2 size={18} className="animate-spin" /></span>
            )}
          </span>
          <span style={uploadTextStyle}>
            {uploading ? 'Uploading…' : avatarUrl ? 'Change photo' : 'Upload a photo'}
            <small style={uploadHintStyle}>JPG, PNG or WebP · max 2MB</small>
          </span>
        </button>
      </div>

      {error && <div style={errorBoxStyle}>{error}</div>}
      {profileSaved && <div style={successBoxStyle}>✓ Profile saved. Click Next to continue.</div>}
    </div>
  );
}

function StepPicks() {
  return (
    <div style={stepContainerStyle}>
      <div style={iconCircleStyle}><Target size={36} /></div>
      <h2 style={titleStyle}>How Picks Work</h2>
      <p style={leadStyle}>
        Every fight card lets you make three kinds of picks:
      </p>
      <ul style={listStyle}>
        <li><strong>Moneyline</strong> — who wins. This is what counts toward your ranking, stars, and ROI.</li>
        <li><strong>Method</strong> — KO/TKO, Submission, or Decision. <em>Just for fun</em> — doesn't count.</li>
        <li><strong>Round</strong> — which round the fight ends. <em>Just for fun</em> — doesn't count.</li>
      </ul>
      <p style={leadStyle}>
        Mark high-confidence picks with a <strong>green flag</strong>. Mark low-confidence picks
        with <strong>yellow</strong>. Mark picks you don't want on your record with <strong>red</strong>
        (red picks are excluded from ranking).
      </p>
    </div>
  );
}

function StepScoring() {
  return (
    <div style={stepContainerStyle}>
      <div style={iconCircleStyle}><TrendingUp size={36} /></div>
      <h2 style={titleStyle}>How Scoring Works</h2>
      <p style={leadStyle}>
        <strong>1 unit risked</strong> per moneyline pick. The odds at lock time decide the payout:
      </p>
      <ul style={listStyle}>
        <li>Win on an <strong>underdog</strong> (e.g. +200) = win 2 units</li>
        <li>Win on a <strong>favorite</strong> (e.g. −200) = win 0.5 units</li>
        <li>Lose = lose 1 unit</li>
      </ul>
      <p style={leadStyle}>
        Your <strong>net units</strong> (sum of wins minus losses) is the only number that ranks you.
        No accuracy percentage. No participation weight. Just net units.
      </p>
    </div>
  );
}

function StepProgression() {
  return (
    <div style={stepContainerStyle}>
      <div style={iconCircleStyle}><Crown size={36} /></div>
      <h2 style={titleStyle}>How You Level Up</h2>
      <p style={leadStyle}>
        Positive net units on an event = stars. Lose more than 1 unit = lose a star.
      </p>
      <div style={ladderStyle}>
        <span>🥷 Ninja</span> →
        <span>⚔️ Samurai</span> →
        <span>🏯 Master</span> →
        <span>👑 Grandmaster</span> →
        <span style={{ color: 'var(--gold, #E8C96A)' }}>🐐 GOAT</span>
      </div>
      <p style={leadStyle}>
        5 stars = next badge tier. <strong>Perfect cards earn Keys</strong> ($100 each).
        Collect 5 Keys = <strong>Gold Key Badge + $1,000 prize.</strong>
      </p>
    </div>
  );
}

function StepQualification() {
  return (
    <div style={stepContainerStyle}>
      <div style={iconCircleStyle}><Trophy size={36} /></div>
      <h2 style={titleStyle}>Qualifying for Each Event</h2>
      <p style={leadStyle}>
        Every event has a <strong>minimum picks</strong> requirement to count toward stars and ranking.
        Miss it — no stars that event.
      </p>
      <table style={tableStyle}>
        <thead>
          <tr><th>Card Size</th><th>Minimum Picks</th><th>Flag Budget</th></tr>
        </thead>
        <tbody>
          <tr><td>15 fights</td><td>11</td><td>4</td></tr>
          <tr><td>13 fights</td><td>10</td><td>3</td></tr>
          <tr><td>12 fights</td><td>9</td><td>3</td></tr>
          <tr><td>10 fights</td><td>8</td><td>2</td></tr>
        </tbody>
      </table>
      <p style={leadStyle}>
        A live banner on the fight card page shows where you stand — *"You have 8 picks, need 3 more"*.
      </p>
    </div>
  );
}

function StepDashboard() {
  return (
    <div style={stepContainerStyle}>
      <div style={iconCircleStyle}><Sparkles size={36} /></div>
      <h2 style={titleStyle}>You're All Set</h2>
      <p style={leadStyle}>
        Your dashboard shows the next event, your current rank, your stars, and your keys.
      </p>
      <p style={leadStyle}>
        Make your first picks on the upcoming card. Most users hit their first star within a week.
      </p>
      <p style={{ ...leadStyle, fontStyle: 'italic', color: 'rgba(255,255,255,0.55)' }}>
        Tip: you can re-read these rules anytime from the <strong>Rules</strong> tab in the main nav.
      </p>
    </div>
  );
}

// ─── Inline Styles ────────────────────────────────────────────────────────
// Plain CSS-in-JS to avoid a new .css file. Keep it minimal; theming inherits
// from app-wide CSS variables where possible.

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0, 0, 0, 0.8)',
  backdropFilter: 'blur(8px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: 16,
};

const modalStyle: React.CSSProperties = {
  width: '100%', maxWidth: 520,
  background: 'hsl(220 25% 8%)',
  border: '1px solid hsl(210 25% 18%)',
  borderRadius: 12,
  overflow: 'hidden',
  display: 'flex', flexDirection: 'column',
  maxHeight: '90vh',
};

const topBarStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 16,
  padding: '16px 20px',
  borderBottom: '1px solid hsl(210 25% 14%)',
};

const progressBarStyle: React.CSSProperties = {
  flex: 1, height: 4,
  background: 'hsl(210 25% 14%)',
  borderRadius: 2, overflow: 'hidden',
};

const progressFillStyle: React.CSSProperties = {
  height: '100%',
  background: 'hsl(38 92% 55%)',
  transition: 'width 0.3s ease',
};

const skipBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 4,
  background: 'transparent', border: 'none',
  color: 'rgba(255,255,255,0.5)',
  fontSize: 13, cursor: 'pointer',
};

const contentStyle: React.CSSProperties = {
  padding: '24px 28px', overflowY: 'auto', flex: 1,
};

const stepContainerStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 16, color: 'hsl(0 0% 95%)',
};

const iconCircleStyle: React.CSSProperties = {
  width: 64, height: 64, borderRadius: '50%',
  background: 'hsl(38 92% 55% / 0.15)',
  color: 'hsl(38 92% 55%)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  margin: '0 auto',
};

const titleStyle: React.CSSProperties = {
  fontSize: 24, fontWeight: 700, textAlign: 'center', margin: 0,
};

const leadStyle: React.CSSProperties = {
  fontSize: 15, lineHeight: 1.6,
  color: 'rgba(255,255,255,0.82)',
  textAlign: 'center', margin: 0,
};

const listStyle: React.CSSProperties = {
  fontSize: 14, lineHeight: 1.7,
  color: 'rgba(255,255,255,0.82)',
  paddingLeft: 20,
};

const fieldStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 6,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600,
  color: 'rgba(255,255,255,0.6)',
  textTransform: 'uppercase', letterSpacing: 1,
};

const inputStyle: React.CSSProperties = {
  background: 'hsl(220 25% 10%)',
  border: '1px solid hsl(210 25% 18%)',
  borderRadius: 6,
  padding: '10px 12px',
  color: 'hsl(0 0% 95%)',
  fontSize: 14,
};

const uploadZoneStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 14,
  background: 'hsl(220 25% 10%)',
  border: '1px solid hsl(210 25% 18%)',
  borderRadius: 8,
  padding: '10px 12px',
  cursor: 'pointer', textAlign: 'left', width: '100%',
  transition: 'all 0.15s',
};

const uploadPreviewStyle: React.CSSProperties = {
  position: 'relative', width: 52, height: 52, flexShrink: 0,
  borderRadius: '50%',
  border: '2px solid hsl(210 25% 20%)',
  background: 'hsl(220 25% 13%)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'hsl(210 20% 45%)', overflow: 'hidden',
};

const uploadImgStyle: React.CSSProperties = {
  width: '100%', height: '100%', objectFit: 'cover',
};

const uploadSpinnerStyle: React.CSSProperties = {
  position: 'absolute', inset: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'hsla(220 25% 6% / 0.65)', color: 'hsl(38 92% 55%)',
};

const uploadTextStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 2,
  fontSize: 14, fontWeight: 600, color: 'hsl(0 0% 92%)',
};

const uploadHintStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.45)',
};

const errorStyle: React.CSSProperties = {
  fontSize: 12, color: 'hsl(0 80% 60%)',
};

const errorBoxStyle: React.CSSProperties = {
  padding: '10px 12px',
  background: 'hsl(0 80% 60% / 0.1)',
  border: '1px solid hsl(0 80% 60% / 0.3)',
  borderRadius: 6,
  color: 'hsl(0 80% 70%)', fontSize: 13,
};

const successBoxStyle: React.CSSProperties = {
  padding: '10px 12px',
  background: 'hsl(140 70% 50% / 0.1)',
  border: '1px solid hsl(140 70% 50% / 0.3)',
  borderRadius: 6,
  color: 'hsl(140 70% 65%)', fontSize: 13,
};

const ladderStyle: React.CSSProperties = {
  display: 'flex', flexWrap: 'wrap', gap: 8,
  justifyContent: 'center', alignItems: 'center',
  fontSize: 14,
  padding: '12px 16px',
  background: 'hsl(220 25% 10%)',
  borderRadius: 8,
  color: 'rgba(255,255,255,0.85)',
};

const tableStyle: React.CSSProperties = {
  width: '100%', borderCollapse: 'collapse',
  fontSize: 13,
  color: 'rgba(255,255,255,0.85)',
};

const navStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '16px 20px',
  borderTop: '1px solid hsl(210 25% 14%)',
  gap: 12,
};

const backBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 4,
  background: 'transparent',
  border: '1px solid hsl(210 25% 22%)',
  borderRadius: 6,
  padding: '8px 14px',
  color: 'rgba(255,255,255,0.7)',
  fontSize: 14, cursor: 'pointer',
};

const stepCounterStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'rgba(255,255,255,0.45)',
  fontFamily: 'monospace',
};

const nextBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  background: 'hsl(38 92% 55%)',
  border: 'none', borderRadius: 6,
  padding: '10px 18px',
  color: 'hsl(220 25% 8%)',
  fontSize: 14, fontWeight: 600,
  cursor: 'pointer',
};
