import { db } from "../db";
import { userPicks } from "../../shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { socketService } from './socketService';
import { logger } from '../utils/logger';

interface FightCount {
  f1Count: number;
  f2Count: number;
  f1Id: string;
  f2Id: string;
  eventId: string;
}

class PickAggregationService {
  private memoryCounts = new Map<string, FightCount>();
  private dirtyFights = new Set<string>();

  constructor() {
    // Flush dirty fights every 2 seconds to drastically reduce socket/DB overhead
    setInterval(() => this.flush(), 2000);
  }

  /**
   * Records a user's pick purely in memory and marks the fight as dirty for upcoming batch emission.
   * Decrements old pick if modifying an existing pick.
   */
  public async trackPick(
    eventId: string, 
    fightId: string, 
    f1Id: string, 
    f2Id: string, 
    newPickId: string, 
    oldPickId?: string | null
  ) {
    let agg = this.memoryCounts.get(fightId);

    if (!agg) {
      // On first cold start for this fight, load baseline from DB
      try {
        const [f1CountRes, f2CountRes] = await Promise.all([
          db.select({ count: sql<number>`count(*)` })
            .from(userPicks)
            .where(and(eq(userPicks.fightId, fightId), eq(userPicks.pickedFighterId, f1Id))),
          db.select({ count: sql<number>`count(*)` })
            .from(userPicks)
            .where(and(eq(userPicks.fightId, fightId), eq(userPicks.pickedFighterId, f2Id)))
        ]);
        
        agg = {
          f1Count: Number(f1CountRes[0].count),
          f2Count: Number(f2CountRes[0].count),
          f1Id,
          f2Id,
          eventId
        };
        this.memoryCounts.set(fightId, agg);
      } catch (err) {
        logger.error(`Failed to load baseline counts for fight ${fightId}`, err);
        return;
      }
    } else {
      // Modify in memory instantly (only if already loaded, to prevent double counting if the DB query just caught the new insert)
      if (oldPickId === agg.f1Id && agg.f1Count > 0) agg.f1Count--;
      if (oldPickId === agg.f2Id && agg.f2Count > 0) agg.f2Count--;
      
      if (newPickId === agg.f1Id) agg.f1Count++;
      if (newPickId === agg.f2Id) agg.f2Count++;
    }

    this.dirtyFights.add(fightId);
  }

  private flush() {
    if (this.dirtyFights.size === 0) return;

    for (const fightId of this.dirtyFights) {
      const agg = this.memoryCounts.get(fightId);
      if (!agg) continue;

      const total = agg.f1Count + agg.f2Count;
      const f1Pct = total > 0 ? Math.round((agg.f1Count / total) * 100) : 0;
      const f2Pct = total > 0 ? Math.round((agg.f2Count / total) * 100) : 0;

      // Emit batched update to the room
      socketService.emit('pick_update', {
        fightId,
        percentages: {
          [agg.f1Id]: f1Pct,
          [agg.f2Id]: f2Pct
        },
        counts: {
          [agg.f1Id]: agg.f1Count,
          [agg.f2Id]: agg.f2Count
        }
      }, `event_${agg.eventId}`);
    }

    this.dirtyFights.clear();
  }

  // Periodic safety sync (every 15 min) to ensure memory hasn't drifted from DB
  public async periodicDBSync(fightIds: string[]) {
      // A background job can trigger this to rebuild the memory map silently
  }
}

export const pickAggregator = new PickAggregationService();
