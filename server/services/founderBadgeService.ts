import { db } from "../db";
import { founderBadgeSlots } from "../../shared/schema";
import { eq, sql } from "drizzle-orm";
import { logger } from "../utils/logger";

export type FounderBadgeTier = 1 | 2 | 3 | 4;

export type FounderSlotPlan = {
    tier: FounderBadgeTier;
    globalSlotNumber: number;
};

export type FounderBadgeAllocation =
    | {
        status: "allocated";
        tier: FounderBadgeTier;
        globalSlotNumber: number;
        userId: string;
      }
    | {
        status: "already_allocated";
        tier: FounderBadgeTier;
        globalSlotNumber: number;
        userId: string;
      }
    | {
        status: "sold_out";
        userId: string;
      };

export const FOUNDER_BADGE_LIMITS: ReadonlyArray<{ tier: FounderBadgeTier; maxGlobalSlot: number }> = [
    { tier: 1, maxGlobalSlot: 10 },
    { tier: 2, maxGlobalSlot: 50 },
    { tier: 3, maxGlobalSlot: 500 },
    { tier: 4, maxGlobalSlot: 1000 },
];

export const FOUNDER_BADGE_CAPACITY = FOUNDER_BADGE_LIMITS[FOUNDER_BADGE_LIMITS.length - 1].maxGlobalSlot;

export function createFounderSlotPlan(existingFounderSlots: number): FounderSlotPlan | null {
    const nextSlotNumber = existingFounderSlots + 1;
    const tier = FOUNDER_BADGE_LIMITS.find((limit) => nextSlotNumber <= limit.maxGlobalSlot)?.tier;

    if (!tier) {
        return null;
    }

    return {
        tier,
        globalSlotNumber: nextSlotNumber,
    };
}

/**
 * Permanently allocates one of the first 1,000 Founder slots.
 *
 * The Week 2 table is staged but not migrated yet, so call this only after
 * `founder_badge_slots` exists in the live DB. The allocation itself is safe
 * under concurrency: the global slot number is derived from COUNT(*) and the
 * insert uses ON CONFLICT DO NOTHING, then retries if another transaction
 * claimed it first.
 */
export async function allocateFounderBadgeSlot(userId: string): Promise<FounderBadgeAllocation> {
    return db.transaction(async (tx) => {
        for (let attempt = 0; attempt < 5; attempt += 1) {
            const [existingSlot] = await tx
                .select()
                .from(founderBadgeSlots)
                .where(eq(founderBadgeSlots.userId, userId))
                .limit(1);

            if (existingSlot) {
                return {
                    status: "already_allocated",
                    tier: existingSlot.tier as FounderBadgeTier,
                    globalSlotNumber: existingSlot.slotNumber,
                    userId,
                };
            }

            const [countRow] = await tx
                .select({ count: sql<number>`count(*)` })
                .from(founderBadgeSlots);

            const plan = createFounderSlotPlan(Number(countRow?.count || 0));
            if (!plan) {
                return {
                    status: "sold_out",
                    userId,
                };
            }

            const [insertedSlot] = await tx
                .insert(founderBadgeSlots)
                .values({
                    tier: plan.tier,
                    slotNumber: plan.globalSlotNumber,
                    userId,
                })
                .onConflictDoNothing({
                    target: [founderBadgeSlots.tier, founderBadgeSlots.slotNumber],
                })
                .returning();

            if (insertedSlot) {
                logger.info(`[FounderBadge] Allocated Founder ${plan.tier} global slot ${plan.globalSlotNumber} to user ${userId}`);
                return {
                    status: "allocated",
                    tier: plan.tier,
                    globalSlotNumber: plan.globalSlotNumber,
                    userId,
                };
            }
        }

        throw new Error("FOUNDER_SLOT_ALLOCATION_RETRY_EXHAUSTED");
    });
}
