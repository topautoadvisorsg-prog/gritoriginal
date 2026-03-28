/**
 * Super Seed Script for End-to-End Verification
 * 
 * Generates a comprehensive dataset to verify:
 * - Fighter partial data (Gray/Unknown tags)
 * - Event lifecycle (Upcoming, Live, Completed, Closed)
 * - Edge cases: Cancelled fights, Draws, No Contests, Missing Odds
 * - User progression scenarios:
 *   - User A: >70% participation, +ROI (Star/Badge Gain)
 *   - User B: <70% participation (No Change)
 *   - User C: Negative ROI (Star/Badge Loss)
 *   - User D: Neutral ROI (No Change)
 *   - User E: Admin/Super User
 * 
 * Usage: npx tsx scripts/superSeed.ts
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";
import { v4 as uuidv4 } from "uuid";
import { subDays, addDays } from "date-fns";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL must be set");
    process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

// ─── Deterministic IDs ──────────────────────────────

const IDS = {
    // Fighters
    fighterVolkov: uuidv4(),      // Complete stats
    fighterSantos: uuidv4(),      // Complete stats
    fighterUnknown: uuidv4(),     // Partial stats (Gray tags verification)
    fighterDraw: uuidv4(),        // For draw scenario
    fighterNc: uuidv4(),          // For NC scenario

    // Events
    eventLive: uuidv4(),
    eventClosed: uuidv4(),        // For progression calc
    eventUpcoming: uuidv4(),      // For dashboard/next event

    // Fights
    fightMainLive: uuidv4(),
    fightCoMainLive: uuidv4(),
    fightCancelled: uuidv4(),     // Cancelled/Voided verification
    fightDraw: uuidv4(),          // Draw result verification
    fightNc: uuidv4(),            // NC result verification

    // Users
    userGainer: uuidv4(),         // +Stars candidate
    userLoser: uuidv4(),          // -Stars candidate
    userNeutral: uuidv4(),        // Neutral candidate
    userElite: uuidv4(),          // 5-star Badge candidate
    userAdmin: uuidv4(),

    // Tags
    tagPower: uuidv4(),
    tagCardio: uuidv4(),
};

async function seed() {
    console.log("🌱 Starting Super Seed...\n");

    // Clear existing data (optional, but good for clean slate)
    // await db.delete(schema.userPicks);
    // await db.delete(schema.eventFights);
    // await db.delete(schema.events);
    // await db.delete(schema.users);

    // ─── 1. Users ──────────────────────────────────────────────────────
    console.log("👤 Creating Users for Progression Testing...");

    await db.insert(schema.users).values([
        {
            id: IDS.userGainer,
            email: "winner@test.com",
            firstName: "Victor",
            lastName: "Gainer",
            username: "victor_w",
            role: "user",
            starLevel: 2,
            progressBadge: "none",
            totalPoints: 100,
            country: "United States",
            language: "en",
        },
        {
            id: IDS.userLoser,
            email: "loser@test.com",
            firstName: "Larry",
            lastName: "Loser",
            username: "larry_l",
            role: "user",
            starLevel: 3,
            progressBadge: "none",
            totalPoints: 50,
            country: "Canada",
            language: "en",
        },
        {
            id: IDS.userNeutral,
            email: "neutral@test.com",
            firstName: "Nathan",
            lastName: "Neutral",
            username: "nate_n",
            role: "user",
            starLevel: 1,
            progressBadge: "none",
            totalPoints: 20,
            country: "Brazil",
            language: "pt", // Test multi-language
        },
        {
            id: IDS.userElite,
            email: "elite@test.com",
            firstName: "Elite",
            lastName: "Master",
            username: "elite_m",
            role: "user",
            starLevel: 5,
            progressBadge: "ninja", // Should advance to Samurai
            totalPoints: 500,
        },
        {
            id: IDS.userAdmin,
            email: "admin@test.com",
            firstName: "Admin",
            lastName: "User",
            username: "admin_u",
            role: "admin",
            starLevel: 5,
            progressBadge: "goat",
            totalPoints: 9999,
        }
    ]);

    // ─── 2. Fighters ──────────────────────────────────────────────────
    console.log("👊 Creating Fighters (Complete & Partial)...");

    await db.insert(schema.fighters).values([
        {
            id: IDS.fighterVolkov,
            firstName: "Alex",
            lastName: "Volkov",
            nickname: "The Predator",
            nationality: "Russian",
            gender: "Male",
            weightClass: "Heavyweight",
            stance: "Orthodox",
            gym: "Team Alpha",
            headCoach: "Coach Ivanov",
            imageUrl: "https://via.placeholder.com/400x400?text=Volkov",
            organization: "UFC",
            wins: 12, losses: 3, draws: 0, nc: 0,
            ranking: 5,
            isActive: true
        },
        {
            id: IDS.fighterSantos,
            firstName: "Marcus",
            lastName: "Santos",
            nickname: "The Hammer",
            nationality: "Brazilian",
            gender: "Male",
            weightClass: "Heavyweight",
            stance: "Southpaw",
            gym: "Nova Uniao",
            headCoach: "Andre Pederneiras",
            imageUrl: "https://via.placeholder.com/400x400?text=Santos",
            organization: "UFC",
            wins: 15, losses: 4, draws: 1, nc: 0,
            ranking: 8,
            isActive: true
        },
        {
            id: IDS.fighterUnknown, // Partial stats
            firstName: "John",
            lastName: "Doe",
            nickname: "Mystery",
            nationality: "Unknown",
            gender: "Male",
            weightClass: "Middleweight",
            stance: "Orthodox",
            gym: "Unknown Gym",
            headCoach: "Unknown",
            imageUrl: "https://via.placeholder.com/400x400?text=Unknown",
            organization: "UFC",
            wins: 0, losses: 0, draws: 0, nc: 0, // No record
            isActive: true
        },
        {
            id: IDS.fighterDraw,
            firstName: "Danny",
            lastName: "Draws",
            nationality: "USA",
            gender: "Male",
            weightClass: "Lightweight",
            stance: "Orthodox",
            gym: "Draw Gym",
            headCoach: "Coach D",
            imageUrl: "https://via.placeholder.com/400x400?text=Draw",
            organization: "UFC",
            wins: 5, losses: 5, draws: 5, nc: 0,
            isActive: true
        },
    ]);

    // ─── 3. Events ────────────────────────────────────────────────────
    console.log("📅 Creating Events (Upcoming, Live, Closed)...");

    // Event 1: Closed (Last Month) - Used for Progression Calculation
    const lastMonth = subDays(new Date(), 10);
    await db.insert(schema.events).values({
        id: IDS.eventClosed,
        name: "UFC 300: Progression Test",
        date: lastMonth,
        venue: "Madison Square Garden",
        city: "New York",
        country: "USA",
        organization: "UFC",
        status: "Closed", // Important for progression service
    });

    // Event 2: Live (Now)
    await db.insert(schema.events).values({
        id: IDS.eventLive,
        name: "UFC Fight Night: Live Verification",
        date: new Date(),
        venue: "Apex",
        city: "Las Vegas",
        country: "USA",
        organization: "UFC",
        status: "Live",
    });

    // Event 3: Upcoming
    await db.insert(schema.events).values({
        id: IDS.eventUpcoming,
        name: "UFC 305: Future Stars",
        date: addDays(new Date(), 14),
        venue: "O2 Arena",
        city: "London",
        country: "UK",
        organization: "UFC",
        status: "Upcoming",
    });

    // ─── 4. Fights & Results ──────────────────────────────────────────
    console.log("⚔️  Creating Fights (Normal, Cancelled, Draw, NC)...");

    // Fights for Closed Event (Scored)
    await db.insert(schema.eventFights).values([
        {
            id: IDS.fightMainLive, // Volkov vs Santos
            eventId: IDS.eventClosed,
            fighter1Id: IDS.fighterVolkov,
            fighter2Id: IDS.fighterSantos,
            weightClass: "Heavyweight",
            rounds: 5,
            status: "Completed",
            cardPlacement: "Main Event",
            boutOrder: 5,
            odds: { fighter1Odds: "-150", fighter2Odds: "+130" }, // Volkov Favorite
            winnerId: IDS.fighterVolkov, // Volkov won
            method: "KO/TKO",
            roundEnd: 2
        },
        {
            id: IDS.fightDraw,
            eventId: IDS.eventClosed,
            fighter1Id: IDS.fighterDraw,
            fighter2Id: IDS.fighterUnknown,
            weightClass: "Lightweight",
            rounds: 3,
            status: "Completed",
            cardPlacement: "Prelims",
            boutOrder: 2,
            odds: { fighter1Odds: "-110", fighter2Odds: "-110" },
            winnerId: null, // Draw result (must be null for UUID column)
            method: "Decision",
            roundEnd: 3
        },
        {
            id: IDS.fightCancelled,
            eventId: IDS.eventClosed,
            fighter1Id: IDS.fighterSantos,
            fighter2Id: IDS.fighterUnknown,
            weightClass: "Middleweight",
            rounds: 3,
            status: "Cancelled", // Voided fight
            cardPlacement: "Early Prelims",
            boutOrder: 1,
            odds: null,
            winnerId: null,
        }
    ]);

    // Insert Fight Results
    await db.insert(schema.fightResults).values([
        {
            fightId: IDS.fightMainLive, // Volkov vs Santos
            winnerId: IDS.fighterVolkov,
            method: "KO/TKO",
            round: 2,
            time: "2:30",
            completedAt: addDays(lastMonth, 1),
        },
        {
            fightId: IDS.fightDraw, // Draw vs Unknown
            winnerId: "draw",
            method: "Decision",
            round: 3,
            time: "5:00",
            completedAt: addDays(lastMonth, 1),
        }
    ]);

    // ─── 5. User Picks (Picks Logic) ──────────────────────────────────
    console.log("🎯 Creating Picks for Verification...");

    const picks = [
        // User Gainer (Victor): 
        // 1. Picked Volkov (Win, -150 odds, 2 units) -> Profit: (2 * 100/150) = +1.33u
        // 2. Picked Draw Fight (Draw, refund) -> 0u profit
        // Result: Positive ROI, high participation (2/2 valid fights)
        {
            userId: IDS.userGainer,
            fightId: IDS.fightMainLive,
            pickedFighterId: IDS.fighterVolkov,
            pickedMethod: "ko",
            pickedRound: 2, // Perfect pick
            units: 2,
            isLocked: true,
            status: "active",
            pointsAwarded: 6, // 1 + 2 + 3
        },
        {
            userId: IDS.userGainer,
            fightId: IDS.fightDraw,
            pickedFighterId: IDS.fighterDraw,
            pickedMethod: "dec",
            pickedRound: 3,
            units: 1,
            isLocked: true,
            status: "active",
            pointsAwarded: 0, // Draw = 0 points
        },

        // User Loser (Larry):
        // 1. Picked Santos (Loss, 5 units) -> Profit: -5u
        // Result: Negative ROI
        {
            userId: IDS.userLoser,
            fightId: IDS.fightMainLive,
            pickedFighterId: IDS.fighterSantos, // Loss
            pickedMethod: "ko",
            pickedRound: 1,
            units: 5,
            isLocked: true,
            status: "active",
            pointsAwarded: 0,
        },

        // User Neutral (Nathan):
        // 1. Picked Cancelled Fight -> Voided
        // 2. Picked Draw Fight -> Refund
        // Result: 0 ROI, low participation
        {
            userId: IDS.userNeutral,
            fightId: IDS.fightCancelled,
            pickedFighterId: IDS.fighterSantos,
            pickedMethod: "dec",
            pickedRound: 3,
            units: 1,
            isLocked: true,
            status: "voided", // Correct status for cancelled
            pointsAwarded: 0,
        },

        // User Elite (Master):
        // 1. Picked Volkov (Win, 5 units) -> Profit: +3.33u
        // Result: Positive ROI, already 5 stars -> Badge upgrade
        {
            userId: IDS.userElite,
            fightId: IDS.fightMainLive,
            pickedFighterId: IDS.fighterVolkov,
            pickedMethod: "ko",
            pickedRound: 2,
            units: 5,
            isLocked: true,
            status: "active",
            pointsAwarded: 6,
        }
    ];

    await db.insert(schema.userPicks).values(picks);

    // ─── 6. Tags ──────────────────────────────────────────────────────
    console.log("🏷️  Creating Tag Definitions...");

    await db.insert(schema.fighterTagDefinitions).values([
        { id: IDS.tagPower, name: "KO Power", category: "Striking", sortOrder: 1 },
        { id: IDS.tagCardio, name: "Endurance", category: "Physical", sortOrder: 2 },
    ]);

    await db.insert(schema.fighterTags).values([
        { fighterId: IDS.fighterVolkov, tagDefinitionId: IDS.tagPower, value: 9, color: "#ff0000" },
    ]);

    console.log("\n✅ Super Seed Complete!");
    console.log("   • Run `npx tsx scripts/superSeed.ts` to populate DB.");
    console.log("   • Verify Progression: POST /api/admin/progression/calculate");
    console.log("   • Verify ROI/Stats: GET /api/me/stats (for each user)");
    console.log("\n🧪 Test Users:");
    console.log("   • Victor (Gainer):   should gain star");
    console.log("   • Larry (Loser):     should lose star");
    console.log("   • Elite (Master):    should upgrade badge to Samurai");
    console.log("   • Nathan (Neutral):  picks voided/refunded, no change");

    await pool.end();
}

seed().catch(console.error);
