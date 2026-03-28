import { db } from "../db";
import { users, adminAuditLogs, systemSettings } from "../../shared/schema";
import { eq, desc, inArray, ilike, or } from "drizzle-orm";
import { logger } from '../utils/logger';

// ──────────────────────────────────────
// Audit Logging
// ──────────────────────────────────────

export async function logAdminAction(
    adminId: string,
    action: string,
    targetType: string,
    targetId: string,
    details: any,
    ipAddress: string
) {
    try {
        await db.insert(adminAuditLogs).values({
            adminId,
            action,
            targetType,
            targetId,
            details: JSON.stringify(details),
            ipAddress,
        });
    } catch (error) {
        logger.error("Failed to log admin action:", error);
    }
}

// ──────────────────────────────────────
// Audit Log Queries
// ──────────────────────────────────────

export async function getAuditLogs(limit: number = 100) {
    const logs = await db.select()
        .from(adminAuditLogs)
        .orderBy(desc(adminAuditLogs.createdAt))
        .limit(limit);

    // Enrich with admin usernames
    const enrichedLogs = await Promise.all(logs.map(async (log) => {
        const [admin] = await db.select({ username: users.username }).from(users).where(eq(users.id, log.adminId));
        return { ...log, adminUsername: admin?.username || 'Unknown' };
    }));

    return enrichedLogs;
}

// ──────────────────────────────────────
// User Management
// ──────────────────────────────────────

export async function banUser(userId: string, ban: boolean) {
    const [updatedUser] = await db
        .update(users)
        .set({ isActive: !ban })
        .where(eq(users.id, userId))
        .returning();

    return updatedUser;
}

export async function changeUserRole(userId: string, newRole: string) {
    const [existingUser] = await db.select().from(users).where(eq(users.id, userId));
    const oldRole = existingUser?.role;

    const [updatedUser] = await db
        .update(users)
        .set({ role: newRole })
        .where(eq(users.id, userId))
        .returning();

    return { updatedUser, oldRole };
}

export async function toggleAiAccess(userId: string, enabled: boolean) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const currentPrefs = user?.aiPreferences || { enabled: true };
    const newPrefs = { ...currentPrefs, enabled };

    const [updatedUser] = await db
        .update(users)
        .set({ aiPreferences: newPrefs })
        .where(eq(users.id, userId))
        .returning();

    return updatedUser;
}

// ──────────────────────────────────────
// System Settings
// ──────────────────────────────────────

export async function getSystemSettings() {
    return db.select().from(systemSettings);
}

export async function upsertSystemSetting(key: string, value: string, description: string | undefined, updatedBy: string) {
    await db.insert(systemSettings)
        .values({ key, value, description, updatedBy })
        .onConflictDoUpdate({
            target: systemSettings.key,
            set: { value, description, updatedBy, updatedAt: new Date() }
        });
}

// ──────────────────────────────────────
// User Queries
// ──────────────────────────────────────

export async function getAllUsers() {
    return db.select().from(users);
}

export async function searchUsers(search: string, limit = 10) {
    const term = `%${search}%`;
    return db.select({
        id: users.id,
        username: users.username,
        email: users.email,
    })
        .from(users)
        .where(or(ilike(users.username, term), ilike(users.email, term)))
        .limit(limit);
}
