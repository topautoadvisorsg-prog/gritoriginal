import { parse } from 'csv-parse/sync';
import { storage } from './storage';
import { InsertFightHistory, InsertFightTotals, InsertRoundStats, unmatchedOpponents, type Fighter } from '../shared/schema';
import { db } from './db';
import { events, fightHistory, fighters } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './utils/logger';

// ========== FUZZY MATCHING HELPERS ==========

/**
 * Normalize a name for comparison: lowercase, remove accents, special chars, extra spaces
 */
function normalizeName(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9\s]/g, "") // Remove special chars
        .replace(/\s+/g, " ")        // Collapse spaces
        .trim();
}

/**
 * Simple Levenshtein distance calculation
 */
function levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= a.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= b.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // deletion
                matrix[i][j - 1] + 1,      // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }

    return matrix[a.length][b.length];
}

/**
 * Find best matching fighter using fuzzy matching
 */
function fuzzyMatchFighter(
    searchName: string,
    allFighters: Fighter[]
): { match: Fighter | null; confidence: number; candidates: Fighter[] } {
    const normalized = normalizeName(searchName);

    // 1. Exact match (normalized)
    const exact = allFighters.find(f =>
        normalizeName(`${f.firstName} ${f.lastName}`) === normalized ||
        normalizeName(`${f.lastName} ${f.firstName}`) === normalized
    );
    if (exact) return { match: exact, confidence: 1.0, candidates: [] };

    // 2. Nickname match
    const nickname = allFighters.find(f =>
        f.nickname && normalizeName(f.nickname) === normalized
    );
    if (nickname) return { match: nickname, confidence: 0.9, candidates: [] };

    // 3. Last name only match
    const searchParts = normalized.split(' ');
    const searchLastName = searchParts[searchParts.length - 1];
    const lastNameMatches = allFighters.filter(f =>
        normalizeName(f.lastName) === searchLastName
    );
    if (lastNameMatches.length === 1) {
        return { match: lastNameMatches[0], confidence: 0.7, candidates: [] };
    }

    // 4. Levenshtein distance for close matches
    const scored = allFighters.map(f => ({
        fighter: f,
        distance: levenshtein(normalized, normalizeName(`${f.firstName} ${f.lastName}`))
    })).filter(s => s.distance <= 4).sort((a, b) => a.distance - b.distance);

    if (scored.length > 0 && scored[0].distance <= 2) {
        return { match: scored[0].fighter, confidence: 0.6, candidates: scored.slice(1, 4).map(s => s.fighter) };
    }

    return { match: null, confidence: 0, candidates: scored.slice(0, 5).map(s => s.fighter) };
}

/**
 * Log unmatched opponent to database for manual review
 */
async function logUnmatchedOpponent(importedName: string, candidates: Fighter[]): Promise<void> {
    try {
        await db.insert(unmatchedOpponents).values({
            importedName,
            candidates: candidates.map(c => ({ id: c.id, name: `${c.firstName} ${c.lastName}` })),
        });
    } catch (error) {
        logger.error("Failed to log unmatched opponent:", error);
    }
}

// ========== MAIN IMPORT FUNCTION ==========

export async function handleFighterHistoryImport(fighterId: string, csvData: string) {
    const records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    }) as any[];

    const results = {
        processed: 0,
        errors: [] as string[],
    };

    const fighter = await storage.getFighter(fighterId);
    if (!fighter) {
        throw new Error("Fighter not found");
    }

    for (const row of records) {
        try {
            // 1. Validate required fields
            if (!row.event_name || !row.event_date || !row.opponent_full_name) {
                throw new Error("Missing required fields: event_name, event_date, or opponent_full_name");
            }

            // 2. Find or Create Event
            // Simple lookup by name + date
            // In a real app, this might be fuzzy, but strict for now
            let eventId: string;
            const eventDate = new Date(row.event_date);

            const existingEvents = await db.select().from(events).where(and(eq(events.name, row.event_name)));
            // Check date match strictly or loosely? Let's filter in JS to be safe with timezones
            const match = existingEvents.find(e => {
                const d = new Date(e.date);
                return d.toISOString().split('T')[0] === eventDate.toISOString().split('T')[0];
            });

            if (match) {
                eventId = match.id;
            } else {
                // Create archived event
                const newEvent = await storage.createEvent({
                    id: uuidv4(),
                    name: row.event_name,
                    date: eventDate,
                    venue: 'Unknown',
                    city: 'Unknown',
                    country: 'Unknown',
                    status: 'Archived',
                    createdAt: new Date(),
                    organization: fighter.organization || 'UFC'
                });
                eventId = newEvent.id;
            }

            // 3. Find Opponent using fuzzy matching
            const opponentName = row.opponent_full_name;
            const allFighters = await storage.getAllFighters();
            const matchResult = fuzzyMatchFighter(opponentName, allFighters);

            const opponent = matchResult.match;
            if (!opponent && opponentName) {
                // Log unmatched for manual review
                await logUnmatchedOpponent(opponentName, matchResult.candidates);
                logger.warn(`[Import] Unmatched opponent: "${opponentName}" (${matchResult.candidates.length} candidates)`);
            } else if (matchResult.confidence < 1.0 && opponent) {
                logger.info(`[Import] Fuzzy matched "${opponentName}" → "${opponent.firstName} ${opponent.lastName}" (confidence: ${matchResult.confidence})`);
            }

            // 4. Upsert Fight History
            // Check if this fight already exists for this fighter + event
            const existingHistory = await db.select().from(fightHistory).where(
                and(
                    eq(fightHistory.fighterId, fighterId),
                    eq(fightHistory.eventId, eventId)
                )
            );

            let fightId: string;
            const historyData: InsertFightHistory = {
                fighterId,
                eventId,
                fighterName: fighter.firstName + " " + fighter.lastName,
                fighterNickname: fighter.nickname,
                opponentId: opponent ? opponent.id : null,
                opponentName: opponentName,
                opponentNickname: null,
                opponentLinked: !!opponent,

                eventName: row.event_name,
                eventDate: eventDate, // InsertFightHistory expects Date logic handled by Drizzle
                eventPromotion: row.event_promotion || 'UFC',
                weightClass: row.weight_class || fighter.weightClass,
                fightType: 'Pro', // Default
                boutOrder: parseInt(row.bout_order) || 0,

                result: row.result || 'Unknown',
                method: row.method || 'Unknown',
                methodDetail: row.method_detail,
                round: parseInt(row.round) || 1,
                time: row.time || '0:00',
                fightDurationSeconds: 0, // Calculate from time?

                location: { city: 'Unknown' }, // Placeholder constraint
                roundsScheduled: parseInt(row.rounds_scheduled) || 3,
            };

            if (existingHistory.length > 0) {
                fightId = existingHistory[0].id;
                await storage.updateFightHistory(fightId, historyData);
            } else {
                // create
                const newFight = await storage.createFightHistory(historyData);
                fightId = newFight.id;
            }

            // 5. Stats - Clean Slate Strategy
            // Delete existing stats for this fight/fighter
            await storage.deleteFightTotals(fightId, fighterId);
            await storage.deleteRoundStats(fightId, fighterId);

            // Insert Totals
            if (row.sig_str_landed || row.total_str_landed) { // If any stats exist
                const totals: InsertFightTotals = {
                    fightId,
                    fighterId,
                    knockdowns: parseInt(row.kd) || null,
                    sigStrLanded: parseInt(row.sig_str_landed) || null,
                    sigStrAttempted: parseInt(row.sig_str_attempted) || null,
                    sigStrPercentage: parseInt(row.sig_str_pct) || null,
                    totalStrLanded: parseInt(row.total_str_landed) || null,
                    totalStrAttempted: parseInt(row.total_str_attempted) || null,
                    takedownsLanded: parseInt(row.td_landed) || null,
                    takedownsAttempted: parseInt(row.td_attempted) || null,
                    takedownPercentage: parseInt(row.td_pct) || null,
                    submissionAttempts: parseInt(row.sub_attempts) || null,
                    controlTime: row.control_time || null,
                };
                await storage.createFightTotals(totals);
            }

            // Insert Round Stats
            // Dynamically check for r1_, r2_, r3_ ...
            for (let r = 1; r <= 5; r++) {
                const prefix = `r${r}_`;
                // Check if any key starts with prefix and has value
                const hasRoundData = Object.keys(row).some(k => k.startsWith(prefix) && row[k]);

                if (hasRoundData) {
                    const roundStat: InsertRoundStats = {
                        fightId,
                        fighterId,
                        roundNumber: r,
                        sigStrLanded: parseInt(row[`${prefix}sig_str_landed`]) || null,
                        sigStrAttempted: parseInt(row[`${prefix}sig_str_attempted`]) || null,
                        sigStrPercentage: parseInt(row[`${prefix}sig_str_pct`]) || null,
                        // Add more mapping as needed based on schema
                    };
                    await storage.createRoundStats(roundStat);
                }
            }

            results.processed++;

        } catch (err) {
            logger.error(`Error processing row: ${JSON.stringify(row)}`, err);
            results.errors.push(`Row error: ${String(err)}`);
        }
    }

    return results;
}
