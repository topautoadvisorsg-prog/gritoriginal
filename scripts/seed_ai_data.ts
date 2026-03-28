
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log("DEBUG: DATABASE_URL is", process.env.DATABASE_URL ? "SET" : "NOT SET");

import { db } from "../server/db";
import { fighters, eventFights, aiPredictionCache, events } from "../shared/schema";
import { eq, isNotNull } from "drizzle-orm";

async function seedAiData() {
    console.log("🌱 Seeding AI & Performance Data...");

    // 1. Update Fighter Performance Stats
    const allFighters = await db.select().from(fighters);
    console.log(`Found ${allFighters.length} fighters. Updating performance stats...`);

    for (const fighter of allFighters) {
        // Generate realistic random stats
        const wins = fighter.wins || 0;
        const losses = fighter.losses || 0;
        const totalFights = wins + losses + (fighter.draws || 0);

        // Only generate if they have fights, otherwise keep defaults
        if (totalFights > 0) {
            const koWins = Math.round(wins * (0.3 + Math.random() * 0.4)); // 30-70% KO rate
            const subWins = Math.round((wins - koWins) * (0.2 + Math.random() * 0.5));
            const decWins = Math.max(0, wins - koWins - subWins);

            const slpm = (2 + Math.random() * 4).toFixed(2); // 2.00 - 6.00
            const sapm = (2 + Math.random() * 4).toFixed(2);
            const strAcc = Math.round(35 + Math.random() * 30); // 35-65%
            const strDef = Math.round(50 + Math.random() * 20); // 50-70%
            const tdAvg = (Math.random() * 3).toFixed(2);
            const tdAcc = Math.round(20 + Math.random() * 50);
            const tdDef = Math.round(40 + Math.random() * 50);
            const subAvg = (Math.random() * 1.5).toFixed(2);

            const performance = {
                ko_wins: koWins,
                tko_wins: 0, // Simplified
                submission_wins: subWins,
                decision_wins: decWins,
                losses_by_ko: Math.round(losses * 0.3),
                losses_by_submission: Math.round(losses * 0.2),
                losses_by_decision: Math.round(losses * 0.5),
                finish_rate: totalFights > 0 ? Math.round(((koWins + subWins) / wins) * 100) : 0,
                avg_fight_time_minutes: Math.round(5 + Math.random() * 10),
                strike_accuracy: strAcc,
                strike_defense: strDef,
                takedown_avg: parseFloat(tdAvg),
                takedown_accuracy: tdAcc,
                takedown_defense: tdDef,
                submission_avg: parseFloat(subAvg),
                submission_defense: Math.round(50 + Math.random() * 40),
                strikes_landed_per_min: parseFloat(slpm),
                strikes_absorbed_per_min: parseFloat(sapm),
                win_streak: Math.round(Math.random() * 5),
                loss_streak: Math.round(Math.random() * 2),
            };

            await db.update(fighters)
                .set({ performance })
                .where(eq(fighters.id, fighter.id));
        }
    }
    console.log("✅ Fighter performance stats updated.");

    // 2. Generate AI Predictions for Upcoming Fights
    const upcomingEvents = await db.select().from(events).where(eq(events.status, 'Upcoming'));

    const models = ['GPT-4o', 'Claude-3.5-Sonnet', 'Historical-Regression'];

    console.log(`Found ${upcomingEvents.length} upcoming events. Generating predictions...`);

    for (const event of upcomingEvents) {
        const fights = await db.select().from(eventFights).where(eq(eventFights.eventId, event.id));

        if (fights.length === 0) continue;

        for (const fight of fights) {
            // Check if prediction already exists
            const existing = await db.select().from(aiPredictionCache).where(eq(aiPredictionCache.fightId, fight.id));

            if (existing.length === 0) {
                // Generate predictions for each model
                for (const model of models) {
                    const confidence = Math.round(55 + Math.random() * 35); // 55-90%
                    const winnerId = Math.random() > 0.5 ? fight.fighter1Id : fight.fighter2Id;
                    const method = Math.random() > 0.6 ? (Math.random() > 0.5 ? 'KO/TKO' : 'Submission') : 'Decision';
                    const round = method !== 'Decision' ? Math.ceil(Math.random() * 3) : undefined;

                    const prediction = {
                        winnerId,
                        confidence: confidence,
                        method: method,
                        round: round,
                        reasoning: `Based on ${model} analysis, the fighter shows superior ${method === 'Submission' ? 'grappling' : 'striking'} metrics. Key advantage in significant strikes landed per minute and takedown defense.`,
                        keyFactors: [
                            "Higher striking accuracy",
                            "Better takedown defense",
                            "Recent win streak"
                        ]
                    };

                    await db.insert(aiPredictionCache).values({
                        fightId: fight.id,
                        model: model,
                        prediction: prediction,
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
                    });
                }
            }
        }
    }

    console.log("✅ AI Predictions generated.");
    process.exit(0);
}

seedAiData().catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
});
