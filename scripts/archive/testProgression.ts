
import "dotenv/config";
import { calculateUserProgression } from "../server/progressionService";
import { subDays, addDays } from "date-fns";

// IDs copied from superSeed.ts
const IDS = {
    userGainer: "550e8400-e29b-41d4-a716-446655440000",         // +Stars candidate (Victor)
    userLoser: "550e8400-e29b-41d4-a716-446655440001",          // -Stars candidate (Larry)
    userNeutral: "550e8400-e29b-41d4-a716-446655440002",        // Neutral candidate (Nathan)
    userElite: "550e8400-e29b-41d4-a716-446655440003",          // 5-star Badge candidate (Elite)
};

// Override UUIDs if they were different in superSeed.ts?
// Wait, superSeed.ts uses uuidv4(), so IDs are RANDOM every time!
// I cannot hardcode them here unless I query users by email.

import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("🧪 Testing Progression Service...");

    // Fetch users by email to get their actua IDs
    const gainer = await db.query.users.findFirst({ where: eq(users.email, "winner@test.com") });
    const loser = await db.query.users.findFirst({ where: eq(users.email, "loser@test.com") });
    const neutral = await db.query.users.findFirst({ where: eq(users.email, "neutral@test.com") });
    const elite = await db.query.users.findFirst({ where: eq(users.email, "elite@test.com") });

    if (!gainer || !loser || !neutral || !elite) {
        console.error("❌ Could not find test users. Did superSeed.ts run?");
        process.exit(1);
    }

    const monthStart = subDays(new Date(), 30);
    const monthEnd = new Date();

    console.log(`\n📅 Period: ${monthStart.toISOString()} - ${monthEnd.toISOString()}`);

    // Test Gainer
    console.log(`\n--- Testing Gainer (${gainer.username}) ---`);
    console.log(`Current: ${gainer.starLevel} stars, Badge: ${gainer.progressBadge}`);
    const resGainer = await calculateUserProgression(gainer.id, monthStart, monthEnd);
    console.log("Result:", resGainer);

    // Test Loser
    console.log(`\n--- Testing Loser (${loser.username}) ---`);
    console.log(`Current: ${loser.starLevel} stars, Badge: ${loser.progressBadge}`);
    const resLoser = await calculateUserProgression(loser.id, monthStart, monthEnd);
    console.log("Result:", resLoser);

    // Test Neutral
    console.log(`\n--- Testing Neutral (${neutral.username}) ---`);
    console.log(`Current: ${neutral.starLevel} stars, Badge: ${neutral.progressBadge}`);
    const resNeutral = await calculateUserProgression(neutral.id, monthStart, monthEnd);
    console.log("Result:", resNeutral);

    // Test Elite
    console.log(`\n--- Testing Elite (${elite.username}) ---`);
    console.log(`Current: ${elite.starLevel} stars, Badge: ${elite.progressBadge}`);
    const resElite = await calculateUserProgression(elite.id, monthStart, monthEnd);
    console.log("Result:", resElite);

    console.log("\n✅ Progression Test Complete!");
    process.exit(0);
}

main().catch(console.error);
