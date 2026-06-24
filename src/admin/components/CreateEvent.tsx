import { useState, useMemo, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import { Badge } from '@/shared/components/ui/badge';
import { ComboInput } from '@/shared/components/ui/combo-input';
import { useToast } from '@/shared/hooks/use-toast';
import {
  Plus, Trash2, Trophy, Calendar, MapPin,
  Loader2, Clock, GripVertical, ChevronDown, ChevronUp,
  ImageIcon, X,
} from 'lucide-react';
import type { Fighter } from '@/shared/types/fighter';

// ─── Constants ───────────────────────────────────────────────────────────────

const PRESET_CITIES    = ['Las Vegas','Miami','Los Angeles','Houston','New York','Abu Dhabi','London','Singapore','Jacksonville','Dallas'];
const PRESET_STATES    = ['Nevada','Florida','California','Texas','New York','Arizona','Georgia','New Jersey'];
const PRESET_COUNTRIES = ['USA','Mexico','UAE','UK','Singapore','Brazil','Canada','Australia','Saudi Arabia'];

const DEFAULT_FIGHT_INTERVAL_MINS = 20;

// ─── Time helpers ─────────────────────────────────────────────────────────────

function timeStrToMins(t: string): number | null {
  const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return null;
  let h = parseInt(m[1]);
  const mn = parseInt(m[2]);
  const p  = m[3].toUpperCase();
  if (p === 'PM' && h !== 12) h += 12;
  if (p === 'AM' && h === 12) h = 0;
  return h * 60 + mn;
}

function minsToTimeStr(totalMins: number, tz = 'PST'): string {
  const safe = ((totalMins % (24 * 60)) + 24 * 60) % (24 * 60);
  const h24  = Math.floor(safe / 60);
  const mn   = safe % 60;
  const p    = h24 >= 12 ? 'PM' : 'AM';
  const h12  = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  return `${h12}:${String(mn).padStart(2, '0')} ${p} ${tz}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface FightEntry {
  id:           string;
  fighter1Id:   string;
  fighter2Id:   string;
  fighter1Name: string;
  fighter2Name: string;
  weightClass:  string;
  isTitleFight: boolean;
  rounds:       number;
  offsetMins:   number; // manual ±adjustment on top of calculated time
}

interface EventFormData {
  name: string; date: string; venue: string;
  city: string; state: string; country: string;
  organization: string; description: string;
}

// ─── Scheduling ───────────────────────────────────────────────────────────────

function computeSectionTimes(
  fights:           FightEntry[],
  sectionStartMins: number,
  intervalMins:     number,
): string[] {
  // Fights listed chronologically (index 0 = first fight of section = earliest time)
  return fights.map((f, i) =>
    minsToTimeStr(sectionStartMins + i * intervalMins + f.offsetMins)
  );
}

interface ComputedCard {
  prePrelimTimes: string[];
  prelimTimes:    string[];
  mainCardTimes:  string[];
}

function computeAllTimes(
  prePrelimStart: string, // e.g. "3:00 PM" or "" if not used
  prelimStart:    string, // e.g. "5:00 PM"
  mainCardStart:  string, // e.g. "7:00 PM"
  intervalMins:   number,
  prePrelimFights: FightEntry[],
  prelimFights:    FightEntry[],
  mainCardFights:  FightEntry[],
): ComputedCard {
  const ppMins = timeStrToMins(prePrelimStart);
  const prMins = timeStrToMins(prelimStart);
  const mcMins = timeStrToMins(mainCardStart);

  return {
    prePrelimTimes: ppMins !== null
      ? computeSectionTimes(prePrelimFights, ppMins, intervalMins)
      : prePrelimFights.map(() => ''),
    prelimTimes: prMins !== null
      ? computeSectionTimes(prelimFights, prMins, intervalMins)
      : prelimFights.map(() => ''),
    mainCardTimes: mcMins !== null
      ? computeSectionTimes(mainCardFights, mcMins, intervalMins)
      : mainCardFights.map(() => ''),
  };
}

// Assign boutOrder and cardPlacement for final submit payload.
// boutOrder=1 = Main Event (last fight of the night), higher number = earlier.
function buildFinalFights(
  prePrelims: FightEntry[], prelimFights: FightEntry[], mainCardFights: FightEntry[],
  schedule: ComputedCard,
) {
  const total = prePrelims.length + prelimFights.length + mainCardFights.length;
  let globalPos = 0; // chronological position (0 = first fight of the night)
  const result: object[] = [];

  // Pre-Prelims (earliest)
  prePrelims.forEach((f, i) => {
    result.push({
      fighter1Id: f.fighter1Id, fighter2Id: f.fighter2Id,
      cardPlacement: 'Pre-Prelims',
      boutOrder: total - globalPos, // highest boutOrder = earliest fight
      weightClass: f.weightClass, isTitleFight: f.isTitleFight,
      rounds: f.rounds, scheduledTime: schedule.prePrelimTimes[i],
    });
    globalPos++;
  });

  // Prelims
  prelimFights.forEach((f, i) => {
    result.push({
      fighter1Id: f.fighter1Id, fighter2Id: f.fighter2Id,
      cardPlacement: 'Preliminary',
      boutOrder: total - globalPos,
      weightClass: f.weightClass, isTitleFight: f.isTitleFight,
      rounds: f.rounds, scheduledTime: schedule.prelimTimes[i],
    });
    globalPos++;
  });

  // Main Card fights (earlier fights in chronological order)
  const mainCardN = mainCardFights.length;
  mainCardFights.forEach((f, i) => {
    const isMainEvent  = i === mainCardN - 1; // last fight = main event
    const isCoMain     = i === mainCardN - 2 && mainCardN >= 2;
    const placement = isMainEvent ? 'Main Event' : isCoMain ? 'Co-Main Event' : 'Main Card';
    result.push({
      fighter1Id: f.fighter1Id, fighter2Id: f.fighter2Id,
      cardPlacement: placement,
      boutOrder: total - globalPos,
      weightClass: f.weightClass, isTitleFight: f.isTitleFight,
      rounds: f.rounds, scheduledTime: schedule.mainCardTimes[i],
    });
    globalPos++;
  });

  return result;
}

// ─── AddFightPanel (shared across sections) ───────────────────────────────────

interface AddFightPanelProps {
  fighters: Fighter[];
  fightersLoading: boolean;
  onConfirm: (entry: Omit<FightEntry, 'id' | 'offsetMins'>) => void;
  onCancel: () => void;
  defaultRounds?: number;
}

function AddFightPanel({ fighters, fightersLoading, onConfirm, onCancel, defaultRounds = 3 }: AddFightPanelProps) {
  const { toast } = useToast();
  const [f1, setF1] = useState('');
  const [f2, setF2] = useState('');
  const [wc, setWc] = useState('');
  const [title, setTitle] = useState(false);
  const [rounds, setRounds] = useState(defaultRounds);
  const [wcFilter1, setWcFilter1] = useState('');
  const [wcFilter2, setWcFilter2] = useState('');

  const weightClasses = useMemo(() => Array.from(new Set(fighters.map(x => x.weightClass))).sort(), [fighters]);

  const filtered1 = useMemo(() =>
    fighters.filter(f => !wcFilter1 || f.weightClass === wcFilter1), [fighters, wcFilter1]);
  const filtered2 = useMemo(() =>
    fighters.filter(f => !wcFilter2 || f.weightClass === wcFilter2), [fighters, wcFilter2]);

  const handleAdd = () => {
    if (!f1 || !f2) { toast({ title: 'Select both fighters', variant: 'destructive' }); return; }
    if (f1 === f2)  { toast({ title: 'Fighters must be different', variant: 'destructive' }); return; }
    if (!wc)        { toast({ title: 'Select a weight class', variant: 'destructive' }); return; }
    const fighter1 = fighters.find(x => x.id === f1);
    const fighter2 = fighters.find(x => x.id === f2);
    if (!fighter1 || !fighter2) return;
    onConfirm({
      fighter1Id: f1, fighter2Id: f2,
      fighter1Name: `${fighter1.firstName} ${fighter1.lastName}`,
      fighter2Name: `${fighter2.firstName} ${fighter2.lastName}`,
      weightClass: wc, isTitleFight: title, rounds,
    });
  };

  return (
    <div className="p-3 rounded-lg border border-[#E8A020]/30 bg-[#E8A020]/5 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {/* Fighter 1 */}
        <div className="space-y-1">
          <Label className="text-xs">Fighter 1 (Red)</Label>
          <Select value={wcFilter1} onValueChange={v => { setWcFilter1(v === '__all' ? '' : v); setF1(''); }}>
            <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Filter by weight class…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All weight classes</SelectItem>
              {weightClasses.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={f1} onValueChange={setF1}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select fighter…" /></SelectTrigger>
            <SelectContent>
              {fightersLoading
                ? <SelectItem value="__loading" disabled>Loading…</SelectItem>
                : filtered1.map(f => (
                    <SelectItem key={f.id} value={f.id} disabled={f.id === f2}>
                      {f.firstName} {f.lastName}
                      {f.nickname ? ` "${f.nickname}"` : ''}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fighter 2 */}
        <div className="space-y-1">
          <Label className="text-xs">Fighter 2 (Blue)</Label>
          <Select value={wcFilter2} onValueChange={v => { setWcFilter2(v === '__all' ? '' : v); setF2(''); }}>
            <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Filter by weight class…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All weight classes</SelectItem>
              {weightClasses.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={f2} onValueChange={setF2}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select fighter…" /></SelectTrigger>
            <SelectContent>
              {fightersLoading
                ? <SelectItem value="__loading" disabled>Loading…</SelectItem>
                : filtered2.map(f => (
                    <SelectItem key={f.id} value={f.id} disabled={f.id === f1}>
                      {f.firstName} {f.lastName}
                      {f.nickname ? ` "${f.nickname}"` : ''}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs mb-1 block">Weight Class</Label>
          <Select value={wc} onValueChange={setWc}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              {weightClasses.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs mb-1 block">Rounds</Label>
          <Select value={String(rounds)} onValueChange={v => setRounds(Number(v))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 Rounds</SelectItem>
              <SelectItem value="5">5 Rounds</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs mb-1 block">Title Fight</Label>
          <div className="flex items-center gap-1 h-8">
            <Switch checked={title} onCheckedChange={v => { setTitle(v); if (v) setRounds(5); }} className="scale-75" />
            {title && <Trophy className="h-3 w-3 text-yellow-400" />}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleAdd}>Add Fight</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// ─── FightRow ────────────────────────────────────────────────────────────────

interface FightRowProps {
  fight:         FightEntry;
  scheduledTime: string;
  index:         number;
  total:         number;
  isDragging:    boolean;
  isMainEvent?:  boolean;
  isCoMain?:     boolean;
  onDragStart:   (i: number) => void;
  onDragOver:    (e: React.DragEvent, i: number) => void;
  onDrop:        (e: React.DragEvent) => void;
  onDragEnd:     () => void;
  onRemove:      (id: string) => void;
  onOffsetChange:(id: string, delta: number) => void;
}

function FightRow({
  fight, scheduledTime, index, total, isDragging,
  isMainEvent, isCoMain,
  onDragStart, onDragOver, onDrop, onDragEnd,
  onRemove, onOffsetChange,
}: FightRowProps) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={e => onDragOver(e, index)}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-2 p-2 rounded-lg bg-card border cursor-grab active:cursor-grabbing transition-opacity ${isDragging ? 'opacity-30' : ''}`}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div className="flex items-center gap-1 flex-1 min-w-0">
        {isMainEvent && <Badge className="text-[9px] bg-red-500/20 text-red-400 border-red-500/50 px-1">MAIN EVENT</Badge>}
        {isCoMain    && <Badge className="text-[9px] bg-orange-500/20 text-orange-400 border-orange-500/50 px-1">CO-MAIN</Badge>}
        {fight.isTitleFight && <Trophy className="h-3 w-3 text-yellow-400 flex-shrink-0" />}
        <span className="text-sm font-medium truncate">
          {fight.fighter1Name} <span className="text-muted-foreground text-xs">vs</span> {fight.fighter2Name}
        </span>
        <Badge variant="outline" className="text-[9px] flex-shrink-0">{fight.weightClass}</Badge>
        <span className="text-xs text-muted-foreground flex-shrink-0">{fight.rounds}R</span>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Clock className="h-3 w-3 text-[#E8A020]" />
        <span className="text-xs text-[#E8A020] font-mono w-20">{scheduledTime}</span>
        <button
          onClick={() => onOffsetChange(fight.id, -5)}
          className="text-muted-foreground hover:text-foreground text-xs px-0.5 rounded"
          title="-5 min"
        >-5</button>
        <button
          onClick={() => onOffsetChange(fight.id, 5)}
          className="text-muted-foreground hover:text-foreground text-xs px-0.5 rounded"
          title="+5 min"
        >+5</button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(fight.id)} aria-label="Remove fight">
          <Trash2 className="h-3 w-3 text-red-400" />
        </Button>
      </div>
    </div>
  );
}

// ─── CardSectionPanel ─────────────────────────────────────────────────────────

interface CardSectionPanelProps {
  sectionId:        'pre-prelims' | 'prelims' | 'main-card';
  label:            string;
  color:            string;
  fights:           FightEntry[];
  times:            string[];
  startTime:        string;
  onStartTimeChange:(val: string) => void;
  optional?:        boolean;
  addingHere:       boolean;
  fighters:         Fighter[];
  fightersLoading:  boolean;
  onOpenAdd:        () => void;
  onConfirmAdd:     (entry: Omit<FightEntry, 'id' | 'offsetMins'>) => void;
  onCancelAdd:      () => void;
  onRemove:         (id: string) => void;
  onReorder:        (fromIndex: number, toIndex: number) => void;
  onOffsetChange:   (id: string, delta: number) => void;
}

function CardSectionPanel({
  sectionId, label, color, fights, times,
  startTime, onStartTimeChange, optional = false,
  addingHere, fighters, fightersLoading,
  onOpenAdd, onConfirmAdd, onCancelAdd, onRemove, onReorder, onOffsetChange,
}: CardSectionPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const dragIndex   = useRef<number | null>(null);
  const dragOverIdx = useRef<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);

  const handleDragStart = (i: number) => { dragIndex.current = i; setDragging(i); };
  const handleDragOver  = (e: React.DragEvent, i: number) => { e.preventDefault(); dragOverIdx.current = i; };
  const handleDrop      = (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragIndex.current;
    const to   = dragOverIdx.current;
    if (from !== null && to !== null && from !== to) onReorder(from, to);
    dragIndex.current = null; dragOverIdx.current = null; setDragging(null);
  };
  const handleDragEnd = () => { dragIndex.current = null; dragOverIdx.current = null; setDragging(null); };

  const hasTime = timeStrToMins(startTime) !== null;

  return (
    <Card className={`border-l-4 ${color}`}>
      <CardHeader className="py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Section label + fight count */}
          <div className="flex items-center gap-2 min-w-0">
            <CardTitle className="text-sm font-bold uppercase tracking-wide whitespace-nowrap">{label}</CardTitle>
            <Badge variant="outline" className="text-xs flex-shrink-0">{fights.length} fights</Badge>
            {optional && (
              <span className="text-[10px] text-muted-foreground italic">optional</span>
            )}
          </div>

          {/* Start time input */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <Input
              placeholder={optional ? 'Start time (optional)' : 'Start time e.g. 7:00 PM'}
              value={startTime}
              onChange={e => onStartTimeChange(e.target.value)}
              className={`h-7 w-44 font-mono text-xs ${hasTime ? 'border-green-500/50 text-green-300' : ''}`}
            />
            {hasTime && fights.length > 0 && (
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                → {times[times.length - 1]}
              </span>
            )}
          </div>

          {/* Spacer + actions */}
          <div className="flex items-center gap-2 ml-auto">
            <Button size="sm" variant="outline" onClick={onOpenAdd} disabled={addingHere} className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" />Add Fight
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand' : 'Collapse'}>
              {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="pt-0 space-y-2">
          {addingHere && (
            <AddFightPanel
              fighters={fighters}
              fightersLoading={fightersLoading}
              onConfirm={onConfirmAdd}
              onCancel={onCancelAdd}
            />
          )}
          {fights.length === 0 && !addingHere && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No fights added yet. Click "Add Fight" to build this card.
            </div>
          )}
          {fights.map((fight, i) => {
            const isMainEvent = sectionId === 'main-card' && i === fights.length - 1 && fights.length > 0;
            const isCoMain    = sectionId === 'main-card' && i === fights.length - 2 && fights.length >= 2;
            return (
              <FightRow
                key={fight.id}
                fight={fight}
                scheduledTime={times[i] ?? ''}
                index={i}
                total={fights.length}
                isDragging={dragging === i}
                isMainEvent={isMainEvent}
                isCoMain={isCoMain}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onRemove={onRemove}
                onOffsetChange={onOffsetChange}
              />
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const CreateEvent = () => {
  const { toast }      = useToast();
  const queryClient    = useQueryClient();

  const [eventData, setEventData] = useState<EventFormData>({
    name: '', date: '', venue: '', city: '', state: '', country: '',
    organization: 'UFC', description: '',
  });

  const [imageUrl,     setImageUrl]     = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  const [prePrelimStartTime, setPrePrelimStartTime] = useState('');        // optional
  const [prelimStartTime,    setPrelimStartTime]    = useState('5:00 PM'); // required
  const [mainCardStartTime,  setMainCardStartTime]  = useState('7:00 PM'); // required

  const [intervalMins, setIntervalMins] = useState(DEFAULT_FIGHT_INTERVAL_MINS);

  const [prePrelimFights, setPrePrelimFights] = useState<FightEntry[]>([]);
  const [prelimFights,    setPrelimFights]    = useState<FightEntry[]>([]);
  const [mainCardFights,  setMainCardFights]  = useState<FightEntry[]>([]);

  const [addingTo, setAddingTo] = useState<'pre-prelims' | 'prelims' | 'main-card' | null>(null);

  const { data: fighters = [], isLoading: fightersLoading } = useQuery<Fighter[]>({
    queryKey: ['/api/fighters'],
    queryFn: async () => { const r = await fetch('/api/fighters'); if (!r.ok) throw new Error('Failed'); return r.json(); },
  });

  // ── Schedule computation ──────────────────────────────────────────────────
  const schedule = useMemo(() =>
    computeAllTimes(
      prePrelimStartTime, prelimStartTime, mainCardStartTime,
      intervalMins,
      prePrelimFights, prelimFights, mainCardFights,
    ),
    [prePrelimStartTime, prelimStartTime, mainCardStartTime, intervalMins, prePrelimFights, prelimFights, mainCardFights],
  );

  const totalFights = prePrelimFights.length + prelimFights.length + mainCardFights.length;

  // ── Image upload ─────────────────────────────────────────────────────────
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Only JPG and PNG images are allowed.', variant: 'destructive' }); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum image size is 5 MB.', variant: 'destructive' }); return;
    }
    setImagePreview(URL.createObjectURL(file));
    setImageUploading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await fetch('/api/admin/events/upload-image', {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();
      setImageUrl(url);
    } catch (err) {
      toast({ title: 'Upload failed', description: 'Could not upload the image.', variant: 'destructive' });
      setImagePreview(null);
    } finally {
      setImageUploading(false);
    }
  };

  // ── Mutation ──────────────────────────────────────────────────────────────
  const createEventMutation = useMutation({
    mutationFn: async () => {
      const finalFights = buildFinalFights(prePrelimFights, prelimFights, mainCardFights, schedule);
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:         eventData.name,
          date:         eventData.date,
          venue:        eventData.venue,
          city:         eventData.city,
          state:        eventData.state,
          country:      eventData.country,
          organization: eventData.organization,
          description:  eventData.description,
          imageUrl:     imageUrl || null,
          fights:       finalFights,
        }),
      });
      if (!response.ok) {
        let msg = 'Failed to create event';
        try { const e = await response.json(); msg = e.error || msg; } catch { /* body not JSON; keep default message */ }
        throw new Error(msg);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Event Created', description: `${eventData.name} created with ${totalFights} fights.` });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setEventData({ name:'',date:'',venue:'',city:'',state:'',country:'',organization:'UFC',description:'' });
      setImageUrl(null); setImagePreview(null);
      setPrePrelimStartTime(''); setPrelimStartTime('5:00 PM'); setMainCardStartTime('7:00 PM');
      setPrePrelimFights([]); setPrelimFights([]); setMainCardFights([]);
    },
    onError: (e: Error) => toast({ title:'Error', description: e.message, variant:'destructive' }),
  });

  // ── Add / remove / reorder helpers ───────────────────────────────────────
  const mkFightEntry = useCallback((entry: Omit<FightEntry, 'id' | 'offsetMins'>): FightEntry => ({
    ...entry, id: crypto.randomUUID(), offsetMins: 0,
  }), []);

  const reorder = (arr: FightEntry[], from: number, to: number) => {
    const copy = [...arr];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    return copy;
  };

  const removeById = (arr: FightEntry[], id: string) => arr.filter(f => f.id !== id);

  const adjustOffset = (arr: FightEntry[], id: string, delta: number) =>
    arr.map(f => f.id === id ? { ...f, offsetMins: f.offsetMins + delta } : f);

  // ── Submit guard ──────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!eventData.name || !eventData.date || !eventData.venue || !eventData.city || !eventData.country) {
      toast({ title: 'Fill in all required event fields', variant: 'destructive' }); return;
    }
    if (!timeStrToMins(prelimStartTime)) {
      toast({ title: 'Set a valid Prelims start time (e.g. 5:00 PM)', variant: 'destructive' }); return;
    }
    if (!timeStrToMins(mainCardStartTime)) {
      toast({ title: 'Set a valid Main Card start time (e.g. 7:00 PM)', variant: 'destructive' }); return;
    }
    if (prePrelimFights.length > 0 && !timeStrToMins(prePrelimStartTime)) {
      toast({ title: 'Set a start time for Pre-Prelims or remove those fights', variant: 'destructive' }); return;
    }
    if (totalFights === 0) {
      toast({ title: 'Add at least one fight', variant: 'destructive' }); return;
    }
    createEventMutation.mutate();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4" data-testid="create-event-page">

      {/* Event Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-[#E8A020]" />
            Event Details
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-2">
            New events start as <strong>Draft</strong> by default. Add all fights, then mark as <strong>Ready</strong> in Event Manager to make visible to users.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="event-name" className="text-xs">Event Name *</Label>
              <Input id="event-name" placeholder="UFC 324: Gaethje vs. Pimblett" value={eventData.name}
                onChange={e => setEventData({ ...eventData, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="event-date" className="text-xs">Event Date *</Label>
              <Input id="event-date" type="date" value={eventData.date}
                onChange={e => setEventData({ ...eventData, date: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="venue" className="text-xs">Venue *</Label>
              <Input id="venue" placeholder="T-Mobile Arena" value={eventData.venue}
                onChange={e => setEventData({ ...eventData, venue: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Organization</Label>
              <ComboInput
                placeholder="UFC"
                value={eventData.organization}
                onChange={v => setEventData({ ...eventData, organization: v })}
                options={['UFC', 'Bellator', 'ONE', 'PFL', 'KSW', 'Other']}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">City *</Label>
              <ComboInput placeholder="Las Vegas" value={eventData.city}
                onChange={v => setEventData({ ...eventData, city: v })} options={PRESET_CITIES} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">State / Province</Label>
              <ComboInput placeholder="Nevada" value={eventData.state}
                onChange={v => setEventData({ ...eventData, state: v })} options={PRESET_STATES} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Country *</Label>
              <ComboInput placeholder="USA" value={eventData.country}
                onChange={v => setEventData({ ...eventData, country: v })} options={PRESET_COUNTRIES} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="description" className="text-xs">Description / Notes</Label>
            <Textarea id="description" placeholder="Additional notes…" value={eventData.description}
              onChange={e => setEventData({ ...eventData, description: e.target.value })} rows={2} />
          </div>

          {/* Event Image Upload */}
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              Event Image
              <span className="text-muted-foreground font-normal ml-1">(optional — used as background in carousel &amp; event card)</span>
            </Label>
            <div className="flex items-center gap-4">
              <label
                htmlFor="event-image-input"
                title="Recommended: 1200×675px. JPG or PNG, max 5 MB."
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border/60 cursor-pointer hover:border-primary/60 transition-colors text-xs text-muted-foreground hover:text-foreground"
              >
                {imageUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
                {imageUploading ? 'Uploading…' : imageUrl ? 'Change Image' : 'Choose Image'}
              </label>
              <input
                id="event-image-input"
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handleImageSelect}
              />
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-16 w-28 object-cover rounded-md border border-border/50"
                  />
                  <button
                    type="button"
                    onClick={() => { setImageUrl(null); setImagePreview(null); }}
                    aria-label="Remove image"
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/80 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {imageUrl && !imageUploading && (
                <span className="text-[10px] text-green-400 font-medium">✓ Uploaded</span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">Recommended: 1200×675px · JPG or PNG · Max 5 MB</p>
          </div>
        </CardContent>
      </Card>

      {/* Interval setting */}
      <div className="flex items-center gap-3 px-1">
        <span className="text-xs text-muted-foreground">Minutes between fights:</span>
        <Select value={String(intervalMins)} onValueChange={v => setIntervalMins(Number(v))}>
          <SelectTrigger className="w-24 h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[10,15,20,25,30].map(m => <SelectItem key={m} value={String(m)}>{m} min</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-[10px] text-muted-foreground">Set each section's start time in its header below.</span>
      </div>

      {/* Pre-Prelims Section */}
      <CardSectionPanel
        sectionId="pre-prelims" label="Pre-Prelims" color="border-l-white/30"
        fights={prePrelimFights} times={schedule.prePrelimTimes}
        startTime={prePrelimStartTime} onStartTimeChange={setPrePrelimStartTime}
        optional={true}
        addingHere={addingTo === 'pre-prelims'}
        fighters={fighters} fightersLoading={fightersLoading}
        onOpenAdd={() => setAddingTo('pre-prelims')}
        onConfirmAdd={entry => { setPrePrelimFights(f => [...f, mkFightEntry(entry)]); setAddingTo(null); }}
        onCancelAdd={() => setAddingTo(null)}
        onRemove={id => setPrePrelimFights(f => removeById(f, id))}
        onReorder={(from, to) => setPrePrelimFights(f => reorder(f, from, to))}
        onOffsetChange={(id, d) => setPrePrelimFights(f => adjustOffset(f, id, d))}
      />

      {/* Prelims Section */}
      <CardSectionPanel
        sectionId="prelims" label="Prelims" color="border-l-[#C4172C]/60"
        fights={prelimFights} times={schedule.prelimTimes}
        startTime={prelimStartTime} onStartTimeChange={setPrelimStartTime}
        addingHere={addingTo === 'prelims'}
        fighters={fighters} fightersLoading={fightersLoading}
        onOpenAdd={() => setAddingTo('prelims')}
        onConfirmAdd={entry => { setPrelimFights(f => [...f, mkFightEntry(entry)]); setAddingTo(null); }}
        onCancelAdd={() => setAddingTo(null)}
        onRemove={id => setPrelimFights(f => removeById(f, id))}
        onReorder={(from, to) => setPrelimFights(f => reorder(f, from, to))}
        onOffsetChange={(id, d) => setPrelimFights(f => adjustOffset(f, id, d))}
      />

      {/* Main Card Section */}
      <CardSectionPanel
        sectionId="main-card" label="Main Card" color="border-l-[#E8A020]/60"
        fights={mainCardFights} times={schedule.mainCardTimes}
        startTime={mainCardStartTime} onStartTimeChange={setMainCardStartTime}
        addingHere={addingTo === 'main-card'}
        fighters={fighters} fightersLoading={fightersLoading}
        onOpenAdd={() => setAddingTo('main-card')}
        onConfirmAdd={entry => { setMainCardFights(f => [...f, mkFightEntry(entry)]); setAddingTo(null); }}
        onCancelAdd={() => setAddingTo(null)}
        onRemove={id => setMainCardFights(f => removeById(f, id))}
        onReorder={(from, to) => setMainCardFights(f => reorder(f, from, to))}
        onOffsetChange={(id, d) => setMainCardFights(f => adjustOffset(f, id, d))}
      />

      {/* Submit */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {totalFights > 0 && (
            <span>{totalFights} fights — first fight: {schedule.prePrelimTimes[0] || schedule.prelimTimes[0] || schedule.mainCardTimes[0]}</span>
          )}
        </div>
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={createEventMutation.isPending || totalFights === 0}
          data-testid="button-create-event"
        >
          {createEventMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <MapPin className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>
    </div>
  );
};

export default CreateEvent;
