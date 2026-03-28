/**
 * Seed Test Data Script
 * 
 * Populates the database with minimal test data for end-to-end gameplay loop validation:
 * Event → Picks → Lock → Result → Scoring → ROI → Dashboard → Stats
 * 
 * Usage: npx tsx scripts/seedTestData.ts
 * 
 * This data is DISPOSABLE — DB will be reset before real imports.
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";
import { v4 as uuidv4 } from "uuid";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL must be set");
    process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

// ─── Deterministic IDs for cross-references ─────────────────────────

const IDS = {
    fighter1: uuidv4(),
    fighter2: uuidv4(),
    event1: uuidv4(),
    fight1: uuidv4(),
    fight2: uuidv4(),
    userFree: uuidv4(),
    userPremium: uuidv4(),
    tagDef1: uuidv4(),
    tagDef2: uuidv4(),
    tagDef3: uuidv4(),
    article1: uuidv4(),
};

async function seed() {
    console.log("🌱 Starting seed...\n");

    // ─── 1. Fighters ──────────────────────────────────────────────────

    console.log("👊 Inserting 2 fighters...");
    await db.insert(schema.fighters).values([
        {
            id: IDS.fighter1,
            firstName: "Alex",
            lastName: "Volkov",
            nickname: "The Predator",
            dateOfBirth: new Date("1990-03-15"),
            nationality: "Russian",
            gender: "Male",
            weightClass: "Heavyweight",
            stance: "Orthodox",
            gym: "Team Alpha",
            headCoach: "Coach Ivanov",
            team: "Alpha MMA",
            fightingOutOf: "Moscow, Russia",
            height: 76, // inches
            reach: 80,
            legReach: 44,
            wins: 12,
            losses: 3,
            draws: 0,
            nc: 0,
            imageUrl: "https://via.placeholder.com/400x400/1a1a2e/00d4ff?text=AV",
            bodyImageUrl: "https://via.placeholder.com/400x600/1a1a2e/00d4ff?text=AV+Body",
            organization: "UFC",
            physicalStats: { height_cm: 193, reach_cm: 203 },
            record: { wins: 12, losses: 3, draws: 0, noContests: 0 },
            performance: {
                ko_wins: 7, submission_wins: 2, decision_wins: 3,
                win_streak: 3, loss_streak: 0, longest_win_streak: 5,
            },
            odds: null,
            notes: [],
            riskSignals: [],
            isActive: true,
            ranking: 8,
            isChampion: false,
            isVerified: true,
        },
        {
            id: IDS.fighter2,
            firstName: "Marcus",
            lastName: "Santos",
            nickname: "The Hammer",
            dateOfBirth: new Date("1992-07-22"),
            nationality: "Brazilian",
            gender: "Male",
            weightClass: "Heavyweight",
            stance: "Southpaw",
            gym: "Nova Uniao",
            headCoach: "Andre Pederneiras",
            team: "Nova Uniao",
            fightingOutOf: "Rio de Janeiro, Brazil",
            height: 74,
            reach: 77,
            legReach: 42,
            wins: 15,
            losses: 4,
            draws: 1,
            nc: 0,
            imageUrl: "https://via.placeholder.com/400x400/1a1a2e/ff6b35?text=MS",
            bodyImageUrl: "https://via.placeholder.com/400x600/1a1a2e/ff6b35?text=MS+Body",
            organization: "UFC",
            physicalStats: { height_cm: 188, reach_cm: 196 },
            record: { wins: 15, losses: 4, draws: 1, noContests: 0 },
            performance: {
                ko_wins: 10, submission_wins: 3, decision_wins: 2,
                win_streak: 1, loss_streak: 0, longest_win_streak: 6,
            },
            odds: null,
            notes: [],
            riskSignals: [],
            isActive: true,
            ranking: 5,
            isChampion: false,
            isVerified: true,
        },
    ]);

    // ─── 2. Event ─────────────────────────────────────────────────────

    console.log("📅 Inserting 1 event...");
    await db.insert(schema.events).values({
        id: IDS.event1,
        name: "GRIT Test Event 1",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        venue: "T-Mobile Arena",
        city: "Las Vegas",
        state: "Nevada",
        country: "United States",
        organization: "UFC",
        description: "Seed test event for end-to-end validation",
        status: "Upcoming",
    });

    // ─── 3. Fights ────────────────────────────────────────────────────

    console.log("⚔️  Inserting 2 fights...");
    await db.insert(schema.eventFights).values([
        {
            id: IDS.fight1,
            eventId: IDS.event1,
            fighter1Id: IDS.fighter1,
            fighter2Id: IDS.fighter2,
            cardPlacement: "Main Event",
            boutOrder: 1,
            weightClass: "Heavyweight",
            isTitleFight: false,
            rounds: 5,
            status: "Scheduled",
            odds: {
                fighter1Odds: "-150",
                fighter2Odds: "+130",
                source: "Seed Data",
            },
        },
        {
            id: IDS.fight2,
            eventId: IDS.event1,
            fighter1Id: IDS.fighter2,
            fighter2Id: IDS.fighter1,
            cardPlacement: "Co-Main Event",
            boutOrder: 2,
            weightClass: "Heavyweight",
            isTitleFight: false,
            rounds: 3,
            status: "Scheduled",
            odds: {
                fighter1Odds: "+110",
                fighter2Odds: "-130",
                source: "Seed Data",
            },
        },
    ]);

    // ─── 4. Users ─────────────────────────────────────────────────────

    console.log("👤 Inserting 2 test users...");
    await db.insert(schema.users).values([
        {
            id: IDS.userFree,
            email: "testuser.free@example.com",
            firstName: "Test",
            lastName: "FreeUser",
            username: "test_free",
            role: "user",
            tier: "free",
            totalPoints: 0,
            isVerified: false,
            country: "United States",
        },
        {
            id: IDS.userPremium,
            email: "testuser.premium@example.com",
            firstName: "Test",
            lastName: "PremiumUser",
            username: "test_premium",
            role: "user",
            tier: "premium",
            totalPoints: 0,
            isVerified: true,
            country: "Brazil",
        },
    ]);

    // ─── 5. Picks ─────────────────────────────────────────────────────

    console.log("🎯 Inserting sample picks...");
    await db.insert(schema.userPicks).values([
        {
            userId: IDS.userFree,
            fightId: IDS.fight1,
            pickedFighterId: IDS.fighter1,
            pickedMethod: "ko",
            pickedRound: 3,
            units: 2,
            isLocked: true,
        },
        {
            userId: IDS.userPremium,
            fightId: IDS.fight1,
            pickedFighterId: IDS.fighter2,
            pickedMethod: "dec",
            pickedRound: null,
            units: 3,
            isLocked: true,
        },
        {
            userId: IDS.userFree,
            fightId: IDS.fight2,
            pickedFighterId: IDS.fighter1,
            pickedMethod: "sub",
            pickedRound: 2,
            units: 1,
            isLocked: false, // Not yet locked
        },
    ]);

    // ─── 6. Tag Definitions + Fighter Tags ────────────────────────────

    console.log("🏷️  Inserting tag definitions and fighter tags...");
    await db.insert(schema.fighterTagDefinitions).values([
        {
            id: IDS.tagDef1,
            name: "Knockout Power",
            description: "Raw one-punch knockout ability",
            category: "Striking",
            sortOrder: 1,
        },
        {
            id: IDS.tagDef2,
            name: "Takedown Defense",
            description: "Ability to stay on the feet and stuff takedowns",
            category: "Grappling",
            sortOrder: 2,
        },
        {
            id: IDS.tagDef3,
            name: "Cardio",
            description: "Stamina and pace over 3-5 rounds",
            category: "Athleticism",
            sortOrder: 3,
        },
    ]);

    await db.insert(schema.fighterTags).values([
        // Fighter 1 tags
        { fighterId: IDS.fighter1, tagDefinitionId: IDS.tagDef1, value: 8, color: "#ef4444" },
        { fighterId: IDS.fighter1, tagDefinitionId: IDS.tagDef2, value: 7, color: "#3b82f6" },
        { fighterId: IDS.fighter1, tagDefinitionId: IDS.tagDef3, value: 6, color: "#22c55e" },
        // Fighter 2 tags
        { fighterId: IDS.fighter2, tagDefinitionId: IDS.tagDef1, value: 9, color: "#ef4444" },
        { fighterId: IDS.fighter2, tagDefinitionId: IDS.tagDef2, value: 5, color: "#3b82f6" },
        { fighterId: IDS.fighter2, tagDefinitionId: IDS.tagDef3, value: 8, color: "#22c55e" },
    ]);

    // ─── 7. News Article ──────────────────────────────────────────────

    console.log("📰 Inserting 1 news article...");
    await db.insert(schema.newsArticles).values({
        id: IDS.article1,
        title: "Volkov vs Santos: The Heavyweight Showdown Preview",
        subtitle: "Two of the division's hardest hitters clash at Test Event 1",
        excerpt: "Alex Volkov and Marcus Santos are set to headline the GRIT Test Event in a five-round heavyweight bout.",
        content: `
## The Matchup

Alex "The Predator" Volkov (12-3) takes on Marcus "The Hammer" Santos (15-4-1) in what promises to be a heavyweight clash for the ages.

### Volkov's Path to Victory
Volkov has shown improved striking defense in his last three outings, posting a 68% significant strike defense rate. His reach advantage of 3 inches could be the deciding factor at range.

### Santos's Edge
Santos brings raw knockout power — 10 of his 15 wins have come by KO/TKO. His southpaw stance creates angles that orthodox fighters struggle with.

### The Verdict
This fight could go either way. Volkov's technical approach vs Santos's explosive power makes for a fascinating stylistic clash.
    `.trim(),
        author: "MMA CL Editorial",
        imageUrl: "https://via.placeholder.com/800x400/1a1a2e/ffffff?text=Volkov+vs+Santos",
        tags: ["Heavyweight", "UFC", "Main Event", "Preview"],
        fighterReference: IDS.fighter1,
        eventReference: IDS.event1,
        readTime: "3 min read",
        isPublished: true,
        publishedAt: new Date(),
    });

    // ─── Summary ──────────────────────────────────────────────────────

    console.log("\n✅ Seed complete! Inserted:");
    console.log("   • 2 fighters (Volkov, Santos)");
    console.log("   • 1 event (Test Event 1 - Upcoming)");
    console.log("   • 2 fights (Main Event + Co-Main)");
    console.log("   • 2 users (free + premium)");
    console.log("   • 3 picks (2 locked, 1 unlocked)");
    console.log("   • 3 tag definitions + 6 fighter tags");
    console.log("   • 1 news article");
    console.log("\n📋 Test IDs for reference:");
    console.log(`   Fighter 1 (Volkov):  ${IDS.fighter1}`);
    console.log(`   Fighter 2 (Santos):  ${IDS.fighter2}`);
    console.log(`   Event:               ${IDS.event1}`);
    console.log(`   Fight 1 (Main):      ${IDS.fight1}`);
    console.log(`   Fight 2 (Co-Main):   ${IDS.fight2}`);
    console.log(`   User Free:           ${IDS.userFree}`);
    console.log(`   User Premium:        ${IDS.userPremium}`);

    await pool.end();
}

seed().catch((err) => {
    console.error("❌ Seed failed:", err);
    pool.end();
    process.exit(1);
});
