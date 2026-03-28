
import { userPicks, eventFights } from "../../shared/schema";
import { db } from "../db";
import { eq, inArray } from "drizzle-orm";

export interface IPickStorage {
    lockPicksForEvent(eventId: string): Promise<number>;
}

export class PickStorage implements IPickStorage {
    async lockPicksForEvent(eventId: string): Promise<number> {
        const fights = await db.select().from(eventFights).where(eq(eventFights.eventId, eventId));
        const fightIds = fights.map(f => f.id);

        if (fightIds.length === 0) return 0;

        await db.update(userPicks)
            .set({ isLocked: true, updatedAt: new Date() })
            .where(inArray(userPicks.fightId, fightIds));

        return fightIds.length;
    }
}
