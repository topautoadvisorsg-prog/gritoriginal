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
import React, { useState, useCallback } from 'react';
import { Swords, ChevronRight, ChevronLeft, X, Loader2, Trophy, Target, TrendingUp, Crown, Sparkles } from 'lucide-react';
import { COUNTRIES } from '@/shared/lib/countries';
import { useQueryClient } from '@tanstack/react-query';

const AVATARS = ['🥊', '🥋', '🦅', '🐺', '🦁', '🐉', '🏆', '⚔️', '🔥', '💀'];

interface OnboardingFlowProps {
  onComplete: () => void;
}

const TOTAL_STEPS = 7;

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [country, setCountry] = useState('');
  const [avatar, setAvatar] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [error, setError] = useState('');

  const isProfileValid = username.length >= 3 && country.length > 0;

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
          avatarUrl: avatar || null,
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
  }, [username, country, avatar, isProfileValid, submitting, queryClient]);

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
              avatar={avatar}
              setAvatar={setAvatar}
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

function StepProfile({ username, setUsername, country, setCountry, avatar, setAvatar, error, profileSaved }: {
  username: string; setUsername: (v: string) => void;
  country: string; setCountry: (v: string) => void;
  avatar: string; setAvatar: (v: string) => void;
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
        <label style={labelStyle}>Country Flag</label>
        <select
          style={inputStyle}
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          disabled={profileSaved}
        >
          <option value="">Select your country</option>
          {COUNTRIES.map(c => (
            <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
          ))}
        </select>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Avatar (optional)</label>
        <div style={avatarGridStyle}>
          {AVATARS.map(a => (
            <button
              type="button"
              key={a}
              onClick={() => setAvatar(a)}
              disabled={profileSaved}
              style={{
                ...avatarBtnStyle,
                ...(avatar === a ? avatarBtnSelectedStyle : {}),
              }}
            >
              {a}
            </button>
          ))}
        </div>
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
  background: 'hsl(190 90% 50%)',
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
  background: 'hsl(190 90% 50% / 0.15)',
  color: 'hsl(190 90% 50%)',
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

const avatarGridStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6,
};

const avatarBtnStyle: React.CSSProperties = {
  background: 'hsl(220 25% 10%)',
  border: '1px solid hsl(210 25% 18%)',
  borderRadius: 6,
  padding: '8px 0',
  fontSize: 22, cursor: 'pointer',
  transition: 'all 0.15s',
};

const avatarBtnSelectedStyle: React.CSSProperties = {
  background: 'hsl(190 90% 50% / 0.15)',
  borderColor: 'hsl(190 90% 50%)',
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
  background: 'hsl(190 90% 50%)',
  border: 'none', borderRadius: 6,
  padding: '10px 18px',
  color: 'hsl(220 25% 8%)',
  fontSize: 14, fontWeight: 600,
  cursor: 'pointer',
};
