import "dotenv/config";
import { db } from "../server/db";
import { users } from "../shared/models/auth";
import { eq } from "drizzle-orm";
import { expirationService } from "../server/services/expirationService";
import { logger } from "../server/utils/logger";

async function main() {
    console.log("🧪 Testing Stripe Fulfillment & Expiration...");

    // 1. Create a test user
    const testEmail = `test-subscription-${Date.now()}@example.com`;
    console.log(`\n1. Creating test user: ${testEmail}`);

    await db.insert(users).values({
        email: testEmail,
        tier: 'free',
        starLevel: 0,
    });

    const user = await db.query.users.findFirst({
        where: eq(users.email, testEmail)
    });

    if (!user) {
        console.error("❌ Failed to create user");
        process.exit(1);
    }
    console.log(`✅ User created with ID: ${user.id}`);

    // 2. Simulate Stripe Fulfillment
    console.log(`\n2. Simulating Stripe Fulfillment (Upgrading to Premium)...`);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    await db.update(users)
        .set({
            tier: 'premium',
            subscriptionStatus: 'active',
            currentPeriodEnd: threeDaysAgo, // Set to past to test expiration
        })
        .where(eq(users.id, user.id));

    const upgradedUser = await db.query.users.findFirst({
        where: eq(users.id, user.id)
    });
    console.log(`✅ Tier updated to: ${upgradedUser?.tier}`);
    console.log(`✅ Expiration set to: ${upgradedUser?.currentPeriodEnd?.toISOString()}`);

    // 3. Test Expiration Service
    console.log(`\n3. Running Expiration Check...`);
    await expirationService.checkExpirations();

    const expiredUser = await db.query.users.findFirst({
        where: eq(users.id, user.id)
    });

    if (expiredUser?.tier === 'free') {
        console.log(`✅ Successfully downgraded expired user to free.`);
    } else {
        console.error(`❌ Downgrade failed. Tier is still: ${expiredUser?.tier}`);
    }

    // Cleanup
    await db.delete(users).where(eq(users.id, user.id));
    console.log(`\n🧹 Cleanup complete. Test Finished!`);
}

main().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
