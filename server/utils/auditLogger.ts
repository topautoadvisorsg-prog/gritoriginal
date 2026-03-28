import { db } from "../db";
import { fightHistoryAudit } from "../../shared/schema";
import { v4 as uuidv4 } from "uuid";
import { logger } from "./logger";

export type AuditChangeType = 'edit' | 'stats_update' | 'result_correction' | 'create' | 'delete';

interface AuditLogParams {
    fightHistoryId: string;
    previousData: Record<string, any>;
    changedBy: string;
    changeType: AuditChangeType;
    changeReason?: string;
}

/**
 * Log an admin action on fight history for audit trail
 * Only called for admin mutations, NOT user picks
 */
export async function logFightHistoryChange(params: AuditLogParams): Promise<void> {
    try {
        await db.insert(fightHistoryAudit).values({
            id: uuidv4(),
            fightHistoryId: params.fightHistoryId,
            previousData: params.previousData,
            changedBy: params.changedBy,
            changeType: params.changeType,
            changeReason: params.changeReason || null,
            createdAt: new Date(),
        });
    } catch (error) {
        // Don't fail the main operation if audit logging fails
        logger.error("Failed to write audit log:", error);
    }
}

/**
 * Log a generic admin action (for fighters, events, etc.)
 * Stores in a simplified format
 */
export async function logAdminAction(params: {
    entityType: 'fighter' | 'event' | 'fight' | 'news';
    entityId: string;
    action: 'create' | 'update' | 'delete';
    previousData?: Record<string, any>;
    newData?: Record<string, any>;
    adminId: string;
    reason?: string;
}): Promise<void> {
    try {
        // For now, we use fightHistoryAudit with a pseudo fightHistoryId
        // In a full implementation, you'd have a separate admin_audit table
        await db.insert(fightHistoryAudit).values({
            id: uuidv4(),
            fightHistoryId: `${params.entityType}:${params.entityId}`,
            previousData: {
                entityType: params.entityType,
                action: params.action,
                before: params.previousData,
                after: params.newData,
            },
            changedBy: params.adminId,
            changeType: params.action as AuditChangeType,
            changeReason: params.reason || null,
            createdAt: new Date(),
        });
    } catch (error) {
        logger.error("Failed to write admin audit log:", error);
    }
}
