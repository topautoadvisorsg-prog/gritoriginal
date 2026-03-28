import { db } from '../db';
import { fighters, fightHistory, events, eventFights } from '../../shared/schema';
import { eq, desc } from 'drizzle-orm';
import type { FightContext } from './openaiClient';

/**
 * Build context for AI prediction from database
 */
export async function buildFightContext(fightId: string): Promise<FightContext> {
    // Get the fight
    const [fight] = await db.select().from(eventFights).where(eq(eventFights.id, fightId));
    if (!fight) {
        throw new Error('Fight not found');
    }

    // Get event
    const [event] = await db.select().from(events).where(eq(events.id, fight.eventId));

    // Get both fighters
    const [fighter1] = await db.select().from(fighters).where(eq(fighters.id, fight.fighter1Id));
    const [fighter2] = await db.select().from(fighters).where(eq(fighters.id, fight.fighter2Id));

    if (!fighter1 || !fighter2) {
        throw new Error('Fighters not found');
    }

    // Get recent fight history for both fighters (last 5 fights)
    const fighter1History = await db.select()
        .from(fightHistory)
        .where(eq(fightHistory.fighterId, fighter1.id))
        .orderBy(desc(fightHistory.eventDate))
        .limit(5);

    const fighter2History = await db.select()
        .from(fightHistory)
        .where(eq(fightHistory.fighterId, fighter2.id))
        .orderBy(desc(fightHistory.eventDate))
        .limit(5);

    // Calculate age from DOB
    const calculateAge = (dob: string | Date | null): number | null => {
        if (!dob) return null;
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    // Extract record from fighter data
    const getRecord = (fighter: any) => {
        const record = fighter.record as any || {};
        return {
            wins: record.wins || 0,
            losses: record.losses || 0,
            draws: record.draws || 0,
        };
    };

    // Map fight history to simple format
    const mapHistory = (history: any[]) => history.map(h => ({
        opponent: h.opponentName || 'Unknown',
        result: h.result || 'Unknown',
        method: h.method || 'Unknown',
    }));

    // Get performance data
    const getFinishRate = (fighter: any): number | null => {
        const perf = fighter.performance as any || {};
        const koWins = perf.ko_wins || 0;
        const subWins = perf.submission_wins || 0;
        const totalWins = getRecord(fighter).wins;
        if (totalWins === 0) return null;
        return (koWins + subWins) / totalWins;
    };

    return {
        fighter1: {
            id: fighter1.id,
            name: `${fighter1.firstName} ${fighter1.lastName}`,
            record: getRecord(fighter1),
            recentFights: mapHistory(fighter1History),
            style: fighter1.stance || 'Orthodox',
            reach: fighter1.reach as number | null,
            age: calculateAge(fighter1.dateOfBirth),
            finishRate: getFinishRate(fighter1),
        },
        fighter2: {
            id: fighter2.id,
            name: `${fighter2.firstName} ${fighter2.lastName}`,
            record: getRecord(fighter2),
            recentFights: mapHistory(fighter2History),
            style: fighter2.stance || 'Orthodox',
            reach: fighter2.reach as number | null,
            age: calculateAge(fighter2.dateOfBirth),
            finishRate: getFinishRate(fighter2),
        },
        event: {
            name: event?.name || 'Unknown Event',
            date: event?.date ? new Date(event.date).toISOString().split('T')[0] : 'Unknown',
            venue: event?.venue || 'Unknown',
        },
        weightClass: fight.weightClass || 'Unknown',
        isTitleFight: fight.isTitleFight || false,
    };
}
