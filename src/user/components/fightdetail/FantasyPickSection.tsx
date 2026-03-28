import React from 'react';
import { Fighter } from '@/shared/types/fighter';
import { cn } from '@/shared/lib/utils';
import { Target, Swords, Award, Lock, CheckCircle2, Hand, Clock, Coins, Pencil, Loader2, Flag, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useGamificationActions } from '@/shared/hooks/use-gamification-actions';

interface FantasyPickSectionProps {
  fighter1: Fighter;
  fighter2: Fighter;
  selectedFighter: string | null;
  selectedMethod: string | null;
  selectedRound: number | null;
  onSelectMethod: (method: string) => void;
  onSelectRound: (round: number) => void;
  isLocked: boolean;
  onLock: () => void;
  /** Called when user wants to edit/delete their existing pick */
  onEditPick?: () => void;
  /** True while the delete request is in-flight */
  isEditingPick?: boolean;
  totalRounds: number;
  units: number;
  onSelectUnits: (units: number) => void;
  /** Confidence flag selection */
  confidenceFlag?: 'none' | 'yellow' | 'red' | 'green';
  onSelectConfidenceFlag?: (flag: 'none' | 'yellow' | 'red' | 'green') => void;
  /** Flag budget tracking */
  flagBudget?: number;
  flagsUsed?: number;
}

const METHODS = [
  { id: 'ko', label: 'KO/TKO', icon: Swords, description: 'Knockout or Technical Knockout' },
  { id: 'sub', label: 'Submission', icon: Hand, description: 'Tap out or verbal submission' },
  { id: 'dec', label: 'Decision', icon: Award, description: 'Goes to the judges scorecards' },
];

export const FantasyPickSection: React.FC<FantasyPickSectionProps> = ({
  fighter1,
  fighter2,
  selectedFighter,
  selectedMethod,
  selectedRound,
  onSelectMethod,
  onSelectRound,
  isLocked,
  onLock,
  onEditPick,
  isEditingPick = false,
  totalRounds,
  units,
  onSelectUnits,
  confidenceFlag = 'none',
  onSelectConfidenceFlag,
  flagBudget = 0,
  flagsUsed = 0,
}) => {
  const { celebratePickLock, click, impact, chime, confirm } = useGamificationActions();

  const selectedFighterData = selectedFighter === fighter1.id ? fighter1 : selectedFighter === fighter2.id ? fighter2 : null;
  const isFinishMethod = selectedMethod === 'ko' || selectedMethod === 'sub';
  const canLock = selectedFighter && selectedMethod && (isFinishMethod ? selectedRound !== null : true);
  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);
  const flagsRemaining = Math.max(0, flagBudget - flagsUsed);

  // Handle lock with celebration
  const handleLock = () => {
    onLock();
    celebratePickLock();
  };

  // Handle method selection with sound
  const handleMethodSelect = (method: string) => {
    switch (method) {
      case 'ko':
        impact();
        break;
      case 'sub':
        chime();
        break;
      case 'dec':
        confirm();
        break;
      default:
        click();
    }
    onSelectMethod(method);
  };

  // Handle round selection with sound
  const handleRoundSelect = (round: number) => {
    click();
    onSelectRound(round);
  };

  return (
    <section className={cn(
      "relative rounded-2xl p-6 overflow-hidden",
      "bg-gradient-to-br from-card via-card to-primary/5",
      "border-2",
      isLocked ? "border-win/50" : "border-primary/30"
    )}>
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              isLocked ? "bg-win/20" : "bg-primary/20"
            )}>
              {isLocked ? (
                <Lock className="w-5 h-5 text-win" />
              ) : (
                <Target className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Make Your Prediction</h3>
              <p className="text-xs text-muted-foreground">Pick a fighter and method to win</p>
            </div>
          </div>

          {isLocked && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-win/20 border border-win/40">
              <CheckCircle2 className="w-4 h-4 text-win" />
              <span className="text-xs font-bold text-win uppercase tracking-wider">Locked In</span>
            </div>
          )}
        </div>

        {/* Step Indicators */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Step 1: Pick Fighter */}
          <div className={cn(
            "relative rounded-xl p-4 border-2 transition-all",
            selectedFighter ? "border-win/50 bg-win/5" : "border-border/50 bg-muted/20"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                selectedFighter ? "bg-win text-win-foreground" : "bg-muted text-muted-foreground"
              )}>
                {selectedFighter ? <CheckCircle2 className="w-4 h-4" /> : '1'}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pick Fighter</span>
            </div>
            {selectedFighterData ? (
              <div className="flex items-center gap-2">
                <img
                  src={selectedFighterData.imageUrl}
                  alt={selectedFighterData.lastName}
                  className="w-10 h-10 rounded-lg object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://via.placeholder.com/40x40/1a1a2e/00d4ff?text=${selectedFighterData.firstName[0]}`;
                  }}
                />
                <span className="font-bold text-foreground">{selectedFighterData.lastName}</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Click fighter card above</p>
            )}
          </div>

          {/* Step 2: Select Method */}
          <div className={cn(
            "relative rounded-xl p-4 border-2 transition-all",
            selectedMethod ? "border-win/50 bg-win/5" : "border-border/50 bg-muted/20"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                selectedMethod ? "bg-win text-win-foreground" : "bg-muted text-muted-foreground"
              )}>
                {selectedMethod ? <CheckCircle2 className="w-4 h-4" /> : '2'}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Method</span>
            </div>
            {selectedMethod ? (
              <span className="font-bold text-foreground capitalize">
                {METHODS.find(m => m.id === selectedMethod)?.label}
              </span>
            ) : (
              <p className="text-sm text-muted-foreground">Choose how they win</p>
            )}
          </div>

          {/* Step 3: Lock It In */}
          <div className={cn(
            "relative rounded-xl p-4 border-2 transition-all",
            isLocked ? "border-win/50 bg-win/5" : "border-border/50 bg-muted/20"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                isLocked ? "bg-win text-win-foreground" : "bg-muted text-muted-foreground"
              )}>
                {isLocked ? <CheckCircle2 className="w-4 h-4" /> : '3'}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lock It In</span>
            </div>
            {isLocked ? (
              <span className="font-bold text-win">Prediction Saved!</span>
            ) : (
              <p className="text-sm text-muted-foreground">Confirm your pick</p>
            )}
          </div>
        </div>

        {/* Method Selection */}
        {!isLocked && (
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              How will {selectedFighterData?.lastName || 'your pick'} win?
            </span>
            <div className="grid grid-cols-3 gap-3">
              {METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => handleMethodSelect(method.id)}
                  disabled={!selectedFighter}
                  className={cn(
                    "group relative p-4 rounded-xl border-2 transition-all duration-200",
                    "hover:scale-[1.02] active:scale-[0.98]",
                    selectedMethod === method.id
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                      : "border-border/50 bg-muted/20 hover:border-primary/40",
                    !selectedFighter && "opacity-50 cursor-not-allowed hover:scale-100"
                  )}
                >
                  <method.icon className={cn(
                    "w-6 h-6 mx-auto mb-2 transition-colors",
                    selectedMethod === method.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                  <span className={cn(
                    "block text-sm font-bold",
                    selectedMethod === method.id ? "text-primary" : "text-foreground"
                  )}>
                    {method.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Round Selection (only for finish methods) */}
        {!isLocked && isFinishMethod && (
          <div className="space-y-4 mt-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                In which round?
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {rounds.map((round) => (
                <button
                  key={round}
                  onClick={() => handleRoundSelect(round)}
                  className={cn(
                    "w-12 h-12 rounded-xl border-2 font-bold text-lg transition-all duration-200",
                    "hover:scale-[1.02] active:scale-[0.98]",
                    selectedRound === round
                      ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10"
                      : "border-border/50 bg-muted/20 text-foreground hover:border-primary/40"
                  )}
                >
                  {round}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Units Selection */}
        {!isLocked && onSelectConfidenceFlag && (
          <div className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Confidence Flag
                </span>
              </div>
              {flagBudget > 0 && (
                <span className="text-xs text-muted-foreground">
                  {flagsRemaining}/{flagBudget} flags remaining
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2">
              {/* Standard Pick (No Flag) */}
              <button
                onClick={() => { click(); onSelectConfidenceFlag('none'); }}
                className={cn(
                  "relative p-3 rounded-xl border-2 transition-all duration-200",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  confidenceFlag === 'none'
                    ? "border-border bg-card text-foreground shadow-lg"
                    : "border-border/50 bg-muted/20 text-muted-foreground hover:border-primary/40"
                )}
              >
                <div className="flex flex-col items-center gap-1">
                  <Target className="w-5 h-5" />
                  <span className="text-xs font-bold">Standard</span>
                </div>
              </button>

              {/* Green Flag - High Confidence */}
              <button
                onClick={() => { confirm(); onSelectConfidenceFlag('green'); }}
                className={cn(
                  "relative p-3 rounded-xl border-2 transition-all duration-200",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  confidenceFlag === 'green'
                    ? "border-green-500 bg-green-500/10 text-green-400 shadow-lg shadow-green-500/20"
                    : "border-border/50 bg-muted/20 text-muted-foreground hover:border-green-500/40"
                )}
              >
                <div className="flex flex-col items-center gap-1">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-xs font-bold">Green</span>
                </div>
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              </button>

              {/* Yellow Flag - Caution */}
              <button
                onClick={() => { 
                  if (flagsRemaining > 0) {
                    click(); 
                    onSelectConfidenceFlag('yellow');
                  }
                }}
                disabled={flagsRemaining <= 0}
                className={cn(
                  "relative p-3 rounded-xl border-2 transition-all duration-200",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  confidenceFlag === 'yellow'
                    ? "border-yellow-500 bg-yellow-500/10 text-yellow-400 shadow-lg shadow-yellow-500/20"
                    : "border-border/50 bg-muted/20 text-muted-foreground hover:border-yellow-500/40",
                  flagsRemaining <= 0 && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex flex-col items-center gap-1">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-xs font-bold">Yellow</span>
                </div>
                {flagsRemaining > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
                )}
              </button>

              {/* Red Flag - Not on Record */}
              <button
                onClick={() => { 
                  if (flagsRemaining > 0) {
                    click(); 
                    onSelectConfidenceFlag('red');
                  }
                }}
                disabled={flagsRemaining <= 0}
                className={cn(
                  "relative p-3 rounded-xl border-2 transition-all duration-200",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  confidenceFlag === 'red'
                    ? "border-red-500 bg-red-500/10 text-red-400 shadow-lg shadow-red-500/20"
                    : "border-border/50 bg-muted/20 text-muted-foreground hover:border-red-500/40",
                  flagsRemaining <= 0 && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-xs font-bold">Red</span>
                </div>
                {flagsRemaining > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                )}
              </button>
            </div>

            {/* Flag descriptions */}
            <div className="text-xs text-muted-foreground space-y-1">
              {confidenceFlag === 'none' && <p>Standard pick — counts fully toward your record</p>}
              {confidenceFlag === 'green' && <p>High confidence marker — counts the same as standard</p>}
              {confidenceFlag === 'yellow' && flagsRemaining > 0 && <p>Personal caution marker — STILL COUNTS toward ranking (only red flag excludes)</p>}
              {confidenceFlag === 'yellow' && flagsRemaining <= 0 && <p>Flag budget exhausted</p>}
              {confidenceFlag === 'red' && flagsRemaining > 0 && <p>Exclude from record — does NOT count toward ranking or stars</p>}
              {confidenceFlag === 'red' && flagsRemaining <= 0 && <p>Flag budget exhausted</p>}
            </div>
          </div>
        )}

        {/* Units Selection */}
        {!isLocked && (
          <div className="space-y-4 mt-6">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                How many units?
              </span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((u) => (
                <button
                  key={u}
                  onClick={() => { click(); onSelectUnits(u); }}
                  className={cn(
                    "flex-1 py-3 rounded-xl border-2 font-bold text-lg transition-all duration-200",
                    "hover:scale-[1.02] active:scale-[0.98]",
                    units === u
                      ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10"
                      : "border-border/50 bg-muted/20 text-foreground hover:border-primary/40"
                  )}
                >
                  {u}u
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lock Button Group */}
        {!isLocked && (
          <div className="mt-6 flex flex-col gap-2">
            {!selectedFighter && (selectedMethod || selectedRound !== null) && (
              <p className="text-sm font-bold text-destructive text-center animate-pulse">
                You must pick a fighter first!
              </p>
            )}
            <button
              onClick={handleLock}
              disabled={!canLock}
              className={cn(
                "w-full py-4 rounded-xl font-bold text-lg transition-all duration-200",
                "flex items-center justify-center gap-2",
                canLock
                  ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.01]"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <Lock className="w-5 h-5" />
              Lock In Prediction
            </button>
          </div>
        )}

        {/* Locked State Summary */}
        {isLocked && selectedFighterData && (
          <div className="mt-6 p-4 rounded-xl bg-win/10 border border-win/30">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedFighterData.imageUrl}
                  alt={selectedFighterData.lastName}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-win/50"
                  onError={(e) => {
                    e.currentTarget.src = `https://via.placeholder.com/48x48/1a1a2e/00d4ff?text=${selectedFighterData.firstName[0]}`;
                  }}
                />
                <div>
                  <p className="text-base font-bold text-win">
                    {selectedFighterData.lastName} by {METHODS.find(m => m.id === selectedMethod)?.label}
                    {selectedRound && ` (R${selectedRound})`}
                    {` · ${units}u`}
                  </p>
                  <p className="text-xs text-muted-foreground">Your prediction is saved</p>
                </div>
              </div>

              {/* Edit Pick button — only show if onEditPick is provided */}
              {onEditPick && (
                <button
                  onClick={onEditPick}
                  disabled={isEditingPick}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide",
                    "border border-muted-foreground/30 text-muted-foreground",
                    "hover:border-primary/50 hover:text-primary transition-all",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isEditingPick
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Pencil className="w-3.5 h-3.5" />
                  }
                  {isEditingPick ? 'Editing…' : 'Edit Pick'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
