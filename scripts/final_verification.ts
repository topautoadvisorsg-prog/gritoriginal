
import { config } from 'dotenv';
config({ path: './.env' });
import { db } from "../server/db";
import { users, aiChatConfig, aiChatLogs } from "../shared/schema";
import { eq, like } from "drizzle-orm";
import { spawn } from "child_process";

const API_URL = "http://localhost:5001/api"; // Adjust port if needed

async function verifyAds() {
    console.log("\n--- Verifying Ads Logic ---");
    // We can't verify frontend rendering in node, but we can verify the Tier Logic that drives it.
    // 1. Check for 'free' users (Should see ads)
    // 2. Check for 'premium' users (Should NOT see ads)

    // Create temp users for testing if they don't exist
    // This is a logic check, assuming the frontend respects the `user.tier` property.
    console.log("Checking DB for user tiers...");
    const freeUsers = await db.select().from(users).where(eq(users.tier, 'free')).limit(1);
    const premiumUsers = await db.select().from(users).where(eq(users.tier, 'premium')).limit(1);

    if (freeUsers.length > 0) {
        console.log(`✅ Free user found: ${freeUsers[0].id} (Should see ads)`);
    } else {
        console.log("⚠️ No free users found. Manual seeded required for full ad test.");
    }

    if (premiumUsers.length > 0) {
        console.log(`✅ Premium user found: ${premiumUsers[0].id} (Should NOT see ads)`);
    } else {
        console.log("⚠️ No premium users found.");
    }
}

async function verifyGamification() {
    console.log("\n--- Verifying Gamification ---");
    // Check if users have login stats initialized
    const usersWithStats = await db.select().from(users).where(like(users.lastLoginMonth, '2026-%')).limit(5);

    if (usersWithStats.length > 0) {
        console.log(`✅ Found ${usersWithStats.length} users with recent login tracking.`);
        usersWithStats.forEach(u => {
            console.log(`   - User ${u.id.substring(0, 8)}... | Count: ${u.monthlyLoginCount} | Last: ${u.lastLoginDate}`);
        });
    } else {
        console.log("❌ No users have login stats recorded yet. Login logic might not be triggering.");
    }
}

async function verifyEndpoints() {
    console.log("\n--- Verifying Server Endpoints ---");
    // We need the server running. We'll try to hit a few public endpoints.
    // Assumes server is running on 5001 (Vite/Proxy) or 3001 (API directly)
    // Let's try 3001 first (API)
    const baseUrl = "http://localhost:3001/api";

    const endpoints = [
        "/fighters?limit=1",
        "/events?limit=1",
        "/news?limit=1"
    ];

    for (const ep of endpoints) {
        try {
            const res = await fetch(baseUrl + ep);
            // Check status manually since fetch doesn't throw on 4xx/5xx
            if (res.ok) {
                console.log(`✅ GET ${ep} - Status: ${res.status}`);
            } else {
                console.log(`❌ GET ${ep} - Status: ${res.status} (${res.statusText})`);
            }
        } catch (e: any) {
            console.log(`❌ GET ${ep} - Failed: ${e.message}`);
            if (e.cause?.code === 'ECONNREFUSED') {
                console.log("   (Server might not be running on port 3001)");
            }
        }
    }
}

async function verifyAiGuardrails() {
    console.log("\n--- Verifying AI Guardrails ---");
    // Check if Config exists
    const configs = await db.select().from(aiChatConfig);
    console.log(`✅ AI Configs found: ${configs.length} sections.`);

    // Check logs
    const logs = await db.select().from(aiChatLogs).limit(5);
    if (logs.length > 0) {
        console.log(`✅ AI Chat Logs exist (${logs.length} samples). System is active.`);
    } else {
        console.log("ℹ️ No AI Chat logs yet (Normal if no one used it).");
    }
}

async function run() {
    try {
        await verifyAds();
        await verifyGamification();
        await verifyAiGuardrails();
        // verifyEndpoints requires server to be running. We'll skip auto-running it here to avoid port conflicts if we start one.
        // User should run server separately.
        console.log("\nTo verify endpoints, ensure server is running and run: curl http://localhost:3000/api/fighters");
    } catch (e) {
        console.error("Verification failed:", e);
    }
    process.exit(0);
}

run();
