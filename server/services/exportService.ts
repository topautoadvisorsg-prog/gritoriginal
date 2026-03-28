import { db } from "../db";
import { fighters, fightHistory } from "../../shared/schema";
import { logger } from "../utils/logger";
const { stringify } = require("csv-stringify/sync");

export const exportService = {
    /**
     * Exports all fighters to a CSV string
     */
    async exportFightersCSV(): Promise<string> {
        try {
            const allFighters = await db.select().from(fighters);
            return stringify(allFighters, { header: true });
        } catch (error) {
            logger.error("Error exporting fighters:", error);
            throw error;
        }
    },

    /**
     * Exports all fight history to a CSV string
     */
    async exportFightHistoryCSV(): Promise<string> {
        try {
            const allHistory = await db.select().from(fightHistory);
            return stringify(allHistory, { header: true });
        } catch (error) {
            logger.error("Error exporting fight history:", error);
            throw error;
        }
    }
};
