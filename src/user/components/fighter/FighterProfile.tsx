import React, { useState, useEffect } from 'react';
import { Fighter } from '@/shared/types/fighter';
import { FighterIdentityBlock } from './FighterIdentityBlock';
import { FighterStatsGrid } from './FighterStatsGrid';
import { FightHistoryLedger } from './FightHistoryLedger';
import { PerformanceMetrics } from './PerformanceMetrics';
import { BettingOdds } from './BettingOdds';
import { ProfileStatus } from './ProfileStatus';
import { FighterNotes } from './FighterNotes';
import { RiskSignals } from './RiskSignals';
import { FighterTagsSection } from '@/user/components/tags/FighterTagsSection';
import { FighterArticles } from '@/user/components/fighters/FighterArticles';
import { ShieldCheck, Twitter, Instagram, Globe, UserCog, Swords, Flag, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { SkillRadarChart } from '@/user/components/fightdetail/SkillRadarChart';
import { OutcomeBarChart } from '@/user/components/fightdetail/OutcomeBarChart';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { toast } from '@/shared/hooks/use-toast';

// ─── Data Completeness Panel ───────────────────────────────────────────────

interface FieldCheck {
  label: string;
  value: any;
  critical?: boolean;
}

function getFieldChecks(fighter: Fighter): FieldCheck[] {
  return [
    { label: 'Headshot image', value: fighter.imageUrl, critical: true },
    { label: 'Half-body image', value: fighter.bodyImageUrl },
    { label: 'Nickname', value: fighter.nickname },
    { label: 'Date of birth', value: fighter.dateOfBirth },
    { label: 'Nationality', value: fighter.nationality },
    { label: 'Weight class', value: fighter.weightClass, critical: true },
    { label: 'Stance', value: fighter.stance },
    { label: 'Style', value: fighter.style },
    { label: 'Height (inches)', value: fighter.heightInch },
    { label: 'Reach (inches)', value: fighter.reachInch },
    { label: 'Weight (lbs)', value: fighter.weight },
    { label: 'Gym / Team', value: fighter.gym || fighter.team },
    { label: 'Head coach', value: fighter.headCoach },
    { label: 'Fighting out of', value: fighter.fightingOutOf },
    { label: 'Organization', value: fighter.organization },
    { label: 'Bio', value: fighter.bio },
    { label: 'Win record', value: (fighter.record?.wins ?? 0) > 0 || (fighter.record?.losses ?? 0) > 0, critical: true },
  ];
}

function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '' || value.trim() === 'UNKNOWN';
  if (typeof value === 'boolean') return !value;
  return false;
}

interface DataCompletenessPanelProps {
  fighter: Fighter;
}

const DataCompletenessPanel: React.FC<DataCompletenessPanelProps> = ({ fighter }) => {
  const checks = getFieldChecks(fighter);
  const populated = checks.filter(c => !isEmpty(c.value));
  const missing = checks.filter(c => isEmpty(c.value));
  const criticalMissing = missing.filter(c => c.critical);
  const pct = Math.round((populated.length / checks.length) * 100);

  const barColor = pct >= 85 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Database className="h-4 w-4 text-cyan-400" />
        <h4 className="section-header">Data Completeness</h4>
        <span className={cn(
          "ml-auto text-xs font-bold px-2 py-0.5 rounded-full",
          pct >= 85 ? "bg-green-500/20 text-green-400" :
          pct >= 60 ? "bg-yellow-500/20 text-yellow-400" :
          "bg-red-500/20 text-red-400"
        )}>{pct}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-4">
        <div
          className={cn("h-full rounded-full transition-all duration-700", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>

      {criticalMissing.length > 0 && (
        <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-xs font-semibold text-red-400 mb-1 uppercase tracking-wider">Critical — Missing</p>
          <ul className="space-y-1">
            {criticalMissing.map(f => (
              <li key={f.label} className="flex items-center gap-1.5 text-xs text-red-300">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {f.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {missing.filter(c => !c.critical).length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Missing fields</p>
          <div className="flex flex-wrap gap-1">
            {missing.filter(c => !c.critical).map(f => (
              <span key={f.label} className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400">
                {f.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {populated.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Populated</p>
          <div className="flex flex-wrap gap-1">
            {populated.map(f => (
              <span key={f.label} className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
                <CheckCircle2 className="h-2.5 w-2.5" />
                {f.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- NEW ANIMATED HELPERS ---
const AnimatedCounter = ({ value }: { value: number }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const increment = value / (duration / 30);
    if (value === 0) return;
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) { setCount(value); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{count}</span>;
}

const WinMethodBar = ({ ko, sub, dec }: { ko: number, sub: number, dec: number }) => {
  const total = ko + sub + dec || 1;
  const [w1, setW1] = useState(0);
  const [w2, setW2] = useState(0);
  const [w3, setW3] = useState(0);
  
  useEffect(() => {
    setTimeout(() => {
        setW1((ko/total)*100);
        setW2((sub/total)*100);
        setW3((dec/total)*100);
    }, 300);
  }, [ko, sub, dec, total]);
  
  return (
    <div className="w-full mt-2 min-w-[200px]">
      <div className="flex justify-between text-[10px] uppercase font-bold mb-1 tracking-widest">
        <span className="text-red-500">KO <AnimatedCounter value={ko} /></span>
        <span className="text-blue-500">SUB <AnimatedCounter value={sub} /></span>
        <span className="text-[#E8A020]">DEC <AnimatedCounter value={dec} /></span>
      </div>
      <div className="h-1.5 w-full flex bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-red-500 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(239,68,68,0.5)]" style={{ width: `${w1}%` }} />
        <div className="h-full bg-blue-500 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(59,130,246,0.5)]" style={{ width: `${w2}%` }} />
        <div className="h-full bg-[#E8A020] transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(232,160,32,0.5)]" style={{ width: `${w3}%` }} />
      </div>
    </div>
  )
}

// --- VISUAL VERIFICATION: STUBS REMOVED ---
// All data now flows strictly from the 'fighter' prop.
// -------------------------------------
// -------------------------------------

interface FighterProfileProps {
  fighter: Fighter;
}

/**
 * FighterProfile - Source of Truth
 * 
 * This is the primary data authority in the system. All future modules
 * (Event, Fight Card, Picks, Analytics, Import/Export) read from this profile.
 * 
 * Layout Structure (Redesigned):
 * - TOP ROW: Identity Image (left) + Header/Quick Stats (right)
 * - MIDDLE ROW: Bio Info + Physical Stats + Performance Metrics (balanced 2-column)
 * - BOTTOM: Fight History (full width)
 * 
 * Empty State Handling:
 * - All blocks render cleanly when data is missing
 * - Blocks hide gracefully when appropriate
 * - No layout breaks with empty data
 */
export const FighterProfile: React.FC<FighterProfileProps> = ({ fighter }) => {
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [whatIsWrong, setWhatIsWrong] = useState('');
  const [sourceLink, setSourceLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitCorrection = async () => {
    if (whatIsWrong.trim().length < 10) {
      toast({ title: 'Please describe the issue', description: 'Minimum 10 characters required.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/fighters/${fighter.id}/corrections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatIsWrong: whatIsWrong.trim(), sourceLink: sourceLink.trim() }),
      });
      if (!res.ok) throw new Error('Failed');
      toast({ title: 'Report submitted', description: 'Thank you. Our team will review the information.' });
      setWhatIsWrong('');
      setSourceLink('');
      setCorrectionOpen(false);
    } catch {
      toast({ title: 'Submission failed', description: 'Please try again later.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* TOP ROW: Identity + Header Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left - Fighter Image */}
        <div className="lg:col-span-4">
          <FighterIdentityBlock fighter={fighter} />
        </div>

        {/* Right - Header Info + Quick Stats */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Header Info Card */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-end mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="section-header">Fighter Identity</h4>
                  {fighter.isVerified && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 border border-green-500/30 rounded-full">
                      <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-xs font-medium text-green-500">Verified</span>
                    </div>
                  )}
                  {/* Social Media Links */}
                  <div className="flex items-center gap-2 ml-4">
                    {fighter.socialMedia?.twitter && (
                      <a href={`https://twitter.com/${fighter.socialMedia.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[#1DA1F2] transition-colors"><Twitter size={14} /></a>
                    )}
                    {fighter.socialMedia?.instagram && (
                      <a href={`https://instagram.com/${fighter.socialMedia.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[#E1306C] transition-colors"><Instagram size={14} /></a>
                    )}
                    {fighter.socialMedia?.website && (
                      <a href={fighter.socialMedia.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Globe size={14} /></a>
                    )}
                  </div>
                </div>
                <h1 className="text-3xl md:text-4xl font-display tracking-wide text-foreground uppercase">
                  {fighter.firstName} {fighter.lastName}
                </h1>
                {fighter.nickname && (
                  <p className="text-lg text-muted-foreground font-mono mt-1">
                    "{fighter.nickname}"
                  </p>
                )}
              </div>

              {/* Quick Record */}
              <div className="flex flex-col gap-2 mt-4 md:mt-0 items-end">
                <div className="stat-card flex items-center justify-center gap-3 w-max">
                  <span className="text-2xl font-bold font-mono tracking-widest text-foreground">
                    <AnimatedCounter value={fighter.record.wins} />-<AnimatedCounter value={fighter.record.losses} />-<AnimatedCounter value={fighter.record.draws} />
                  </span>
                </div>
                <WinMethodBar 
                  ko={fighter.performance.ko_wins + fighter.performance.tko_wins} 
                  sub={fighter.performance.submission_wins} 
                  dec={fighter.record.wins - (fighter.performance.ko_wins + fighter.performance.tko_wins + fighter.performance.submission_wins)} 
                />
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-4 border-t border-border/50">
              <div>
                <span className="data-label block">Weight Class</span>
                <span className="font-medium text-foreground">{fighter.weightClass}</span>
              </div>
              <div>
                <span className="data-label block">Stance</span>
                <span className="font-medium text-foreground">{fighter.stance}</span>
              </div>
              <div>
                <span className="data-label block">Organization</span>
                <span className="font-medium text-foreground">{fighter.organization}</span>
              </div>
              <div>
                <span className="data-label block">Status</span>
                <span className="font-medium text-foreground">
                  {fighter.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {fighter.fightingOutOf && (
                <div>
                  <span className="data-label block">Fighting Out Of</span>
                  <span className="font-medium text-foreground">{fighter.fightingOutOf}</span>
                </div>
              )}
              {fighter.rankGlobal != null && fighter.rankGlobal > 0 && (
                <div>
                  <span className="data-label block">Global Ranking</span>
                  <span className="font-medium text-foreground">#{fighter.rankGlobal}</span>
                </div>
              )}
              {fighter.rankPromotion != null && fighter.rankPromotion > 0 && (
                <div>
                  <span className="data-label block">Promotion Ranking</span>
                  <span className="font-medium text-foreground">#{fighter.rankPromotion}</span>
                </div>
              )}
            </div>
            {/* Bio Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <UserCog className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-xs text-muted-foreground block">Head Coach</span>
                  <span className="text-sm font-medium">{fighter.headCoach || 'Unknown'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Swords className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-xs text-muted-foreground block">Style</span>
                  <span className="text-sm font-medium">{fighter.style || 'MMA'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bio + Physical Stats (filling the right side) */}
          <FighterStatsGrid fighter={fighter} />
        </div>
      </div>

      {/* MIDDLE ROW: Performance + Betting/Risk/Notes (Balanced 2-Column) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Performance */}
        <div className="flex flex-col gap-6">
          <PerformanceMetrics fighter={fighter} />

          {/* VISUAL VERIFICATION: REAL DATA CONNECTED */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkillRadarChart
              fighter={fighter}
              corner="blue"
            />
            <OutcomeBarChart
              fighter={fighter}
              corner="blue"
            />
          </div>

          <ProfileStatus fighter={fighter} />
        </div>

        {/* Right Column - Betting & Signals + Scouting Tags */}
        <div className="flex flex-col gap-6">
          <BettingOdds odds={fighter.odds} />
          {/* Scouting Report (Tags) */}
          <div className="glass-card rounded-xl p-6">
            <FighterTagsSection fighterId={fighter.id} />
          </div>
          <RiskSignals signals={fighter.riskSignals} />
          <FighterNotes notes={fighter.notes} />
          <FighterArticles fighterId={fighter.id} fighterName={`${fighter.firstName} ${fighter.lastName}`} />
        </div>
      </div>

      {/* DATA COMPLETENESS PANEL */}
      <DataCompletenessPanel fighter={fighter} />

      {/* BOTTOM: Fight History (Full Width) */}
      <div className="w-full">
        <FightHistoryLedger
          fights={fighter.history}
          hasPendingFight={false}
        />
      </div>

      {/* Footer: Reporting */}
      <div className="flex justify-center pt-8 pb-4 border-t border-border/50">
        <button
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setCorrectionOpen(true)}
        >
          <Flag className="h-4 w-4" />
          Report incorrect info about {fighter.lastName}
        </button>
      </div>

      <Dialog open={correctionOpen} onOpenChange={setCorrectionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Report Incorrect Information</DialogTitle>
            <DialogDescription>
              Let us know what's wrong and, if possible, include a link to the correct source. We review all submissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="what-is-wrong">What's incorrect?</Label>
              <Textarea
                id="what-is-wrong"
                placeholder="e.g. Wrong weight class, incorrect win/loss record, outdated gym..."
                value={whatIsWrong}
                onChange={(e) => setWhatIsWrong(e.target.value)}
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">{whatIsWrong.length}/1000</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="source-link">Source link (optional)</Label>
              <Input
                id="source-link"
                type="url"
                placeholder="https://tapology.com/..."
                value={sourceLink}
                onChange={(e) => setSourceLink(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCorrectionOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmitCorrection} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

