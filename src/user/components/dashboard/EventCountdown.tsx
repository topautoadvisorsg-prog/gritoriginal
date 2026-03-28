import React, { useState, useEffect } from 'react';
import { cn } from '@/shared/lib/utils';
import { Calendar, Clock, Flame } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Link } from 'react-router-dom';

interface EventCountdownProps {
    eventId: string;
    eventName: string;
    eventDate: Date;
    isLive?: boolean;
    picksComplete?: number;
    totalPicks?: number;
    onMakePicks?: () => void;
}

interface TimeRemaining {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

export const EventCountdown: React.FC<EventCountdownProps> = ({
    eventId,
    eventName,
    eventDate,
    isLive = false,
    picksComplete = 0,
    totalPicks = 0,
    onMakePicks,
}) => {
    const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        const calculateTime = () => {
            const now = new Date().getTime();
            const target = eventDate.getTime();
            const difference = target - now;

            if (difference <= 0) {
                setTimeRemaining(null);
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            setTimeRemaining({ days, hours, minutes, seconds });
            setIsUrgent(difference < 1000 * 60 * 60); // Less than 1 hour
        };

        calculateTime();
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, [eventDate]);

    if (isLive) {
        return (
            <div className="p-4 rounded-xl border border-red-500/50 bg-gradient-to-br from-red-500/10 to-orange-500/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Flame className="w-6 h-6 text-red-500 animate-pulse" />
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                        </div>
                        <div>
                            <p className="text-xs text-red-400 font-bold uppercase tracking-wider">Live Now</p>
                            <p className="font-bold text-foreground">{eventName}</p>
                        </div>
                    </div>
                    <Link to={`/`}>
                        <Button variant="destructive" size="sm" className="font-bold">
                            Watch Live
                        </Button>
                    </Link>
                </div>

                {/* Picks Locked banner for Live */}
                <div className="mt-4 pt-3 border-t border-red-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 bg-red-500/5 -mx-4 -mb-4 px-4 py-3 rounded-b-xl">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-red-300">🔒 PICKS LOCKED</span>
                        <span className="text-xs text-muted-foreground hidden sm:inline-block">You can no longer edit your predictions.</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!timeRemaining) {
        return null;
    }

    return (
        <div
            className={cn(
                'p-4 rounded-xl border transition-all',
                isUrgent
                    ? 'border-orange-500/50 bg-gradient-to-br from-orange-500/10 to-red-500/5 animate-pulse'
                    : 'border-border bg-card'
            )}
        >
            <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Upcoming Event
                </span>
            </div>

            <p className="font-bold text-lg text-foreground mb-3">{eventName}</p>

            {/* Countdown timer */}
            <div className="grid grid-cols-4 gap-2 mb-4">
                <TimeBlock value={timeRemaining.days} label="Days" isUrgent={isUrgent} />
                <TimeBlock value={timeRemaining.hours} label="Hours" isUrgent={isUrgent} />
                <TimeBlock value={timeRemaining.minutes} label="Min" isUrgent={isUrgent} />
                <TimeBlock value={timeRemaining.seconds} label="Sec" isUrgent={isUrgent} />
            </div>

            {/* Picks status */}
            {totalPicks > 0 && (
                <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground tabular-nums">
                            {picksComplete} / {totalPicks} PICKS
                        </span>
                    </div>
                    {picksComplete < totalPicks && (
                        <Button size="sm" onClick={onMakePicks} className="font-bold shadow-sm hover:-translate-y-0.5 transition-transform">
                            {picksComplete === 0 ? 'Make Picks' : 'Finish Picks'}
                        </Button>
                    )}
                    {picksComplete === totalPicks && (
                        <span className="text-sm font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-md">✓ ALL PICKS LOCKED</span>
                    )}
                </div>
            )}
        </div>
    );
};

// Time block component
const TimeBlock: React.FC<{ value: number; label: string; isUrgent?: boolean }> = ({
    value,
    label,
    isUrgent,
}) => (
    <div className="text-center">
        <div
            className={cn(
                'text-2xl font-bold rounded-lg p-2 tabular-nums tracking-tight border',
                isUrgent ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' : 'text-foreground bg-muted border-border/50'
            )}
        >
            {String(value).padStart(2, '0')}
        </div>
        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-1.5 block">{label}</span>
    </div>
);
