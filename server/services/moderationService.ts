import { db } from "../db";
import { userBlocks, userMutes, userReports } from "../../shared/models/auth";
import { eq, and, or } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { logger } from '../utils/logger';

// ──────────────────────────────────────
// Block Operations
// ──────────────────────────────────────

export async function blockUser(blockerId: string, blockedId: string) {
    // Check if already blocked
    const [existing] = await db.select()
        .from(userBlocks)
        .where(and(
            eq(userBlocks.blockerId, blockerId),
            eq(userBlocks.blockedId, blockedId)
        ));

    if (existing) {
        throw new Error('ALREADY_BLOCKED');
    }

    const [block] = await db.insert(userBlocks)
        .values({
            id: uuidv4(),
            blockerId,
            blockedId,
            createdAt: new Date(),
        })
        .returning();

    return block;
}

export async function unblockUser(blockerId: string, blockedId: string) {
    await db.delete(userBlocks)
        .where(and(
            eq(userBlocks.blockerId, blockerId),
            eq(userBlocks.blockedId, blockedId)
        ));
}

export async function getBlockedUserIds(userId: string): Promise<string[]> {
    const blocks = await db.select({ blockedId: userBlocks.blockedId })
        .from(userBlocks)
        .where(eq(userBlocks.blockerId, userId));

    return blocks.map(b => b.blockedId);
}

export async function getBlockedUsers(userId: string) {
    return db.select()
        .from(userBlocks)
        .where(eq(userBlocks.blockerId, userId));
}

export async function isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const [block] = await db.select()
        .from(userBlocks)
        .where(or(
            and(eq(userBlocks.blockerId, blockerId), eq(userBlocks.blockedId, blockedId)),
            and(eq(userBlocks.blockerId, blockedId), eq(userBlocks.blockedId, blockerId))
        ));

    return !!block;
}

// ──────────────────────────────────────
// Mute Operations
// ──────────────────────────────────────

export async function muteUser(muterId: string, mutedId: string, duration?: number) {
    // Check if already muted
    const [existing] = await db.select()
        .from(userMutes)
        .where(and(
            eq(userMutes.muterId, muterId),
            eq(userMutes.mutedId, mutedId)
        ));

    if (existing) {
        throw new Error('ALREADY_MUTED');
    }

    let expiresAt = null;
    if (duration) {
        expiresAt = new Date(Date.now() + duration * 60 * 60 * 1000);
    }

    const [mute] = await db.insert(userMutes)
        .values({
            id: uuidv4(),
            muterId,
            mutedId,
            expiresAt,
            createdAt: new Date(),
        })
        .returning();

    return mute;
}

export async function unmuteUser(muterId: string, mutedId: string) {
    await db.delete(userMutes)
        .where(and(
            eq(userMutes.muterId, muterId),
            eq(userMutes.mutedId, mutedId)
        ));
}

export async function getMutedUsers(userId: string) {
    return db.select()
        .from(userMutes)
        .where(eq(userMutes.muterId, userId));
}

// ──────────────────────────────────────
// Report Operations
// ──────────────────────────────────────

export async function reportUser(reporterId: string, reportedId: string, reason: string, details?: string) {
    const [report] = await db.insert(userReports)
        .values({
            id: uuidv4(),
            reporterId,
            reportedId,
            reason: reason.trim(),
            details: details?.trim() || null,
            status: "pending",
            createdAt: new Date(),
        })
        .returning();

    return report;
}

export async function getReports(status: string = "pending") {
    return db.select()
        .from(userReports)
        .where(eq(userReports.status, status));
}

export async function updateReport(reportId: string, status: string, adminNotes: string | undefined, resolvedBy: string) {
    const [updated] = await db.update(userReports)
        .set({
            status,
            adminNotes,
            resolvedBy,
            resolvedAt: new Date(),
        })
        .where(eq(userReports.id, reportId))
        .returning();

    return updated;
}
