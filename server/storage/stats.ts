
import { fightTotals, type FightTotals, type InsertFightTotals, roundStats, type RoundStats, type InsertRoundStats } from "../../shared/schema";
import { db } from "../db";
import { eq, and } from "drizzle-orm";

export interface IStatsStorage {
    createFightTotals(totals: InsertFightTotals): Promise<FightTotals>;
    deleteFightTotals(fightId: string, fighterId: string): Promise<boolean>;
    createRoundStats(stats: InsertRoundStats): Promise<RoundStats>;
    deleteRoundStats(fightId: string, fighterId: string): Promise<boolean>;
}

export class StatsStorage implements IStatsStorage {
    async createFightTotals(totals: InsertFightTotals): Promise<FightTotals> {
        const [created] = await db.insert(fightTotals).values(totals).returning();
        return created;
    }

    async deleteFightTotals(fightId: string, fighterId: string): Promise<boolean> {
        await db.delete(fightTotals).where(
            and(eq(fightTotals.fightId, fightId), eq(fightTotals.fighterId, fighterId))
        );
        return true;
    }

    async createRoundStats(stats: InsertRoundStats): Promise<RoundStats> {
        const [created] = await db.insert(roundStats).values(stats).returning();
        return created;
    }

    async deleteRoundStats(fightId: string, fighterId: string): Promise<boolean> {
        await db.delete(roundStats).where(
            and(eq(roundStats.fightId, fightId), eq(roundStats.fighterId, fighterId))
        );
        return true;
    }
}
