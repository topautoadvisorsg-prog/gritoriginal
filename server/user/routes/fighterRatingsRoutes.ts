/**
 * Fighter Ratings — Post-fight 5-dimension rating system (Blueprint §9).
 *
 * Scale: 1–10 stars per dimension.
 * Dimensions: Fight IQ, Striking, Grappling, Cardio, Aggressiveness.
 *
 * Rules:
 * - One rating per (user, fighter, fight) — enforced by unique index.
 * - Only ratable after fight is CLOSED + result exists.
 * - 24-hour reflection window matches PostFightNotes.
 * - Anti-spam: account age + rate limit set `countsTowardAggregate=false`
 *   but the rating still saves (so user sees their own input).
 */
import type { Express, Request, Response } from "express";
import { db } from "../../db";
import {
  fighterRatings,
  fightResults,
  eventFights,
  users,
} from "../../../shared/schema";
import { and, eq, sql, gte } from "drizzle-orm";
import { isAuthenticated } from "../../auth/guards";
import { logger } from "../../utils/logger";

const DIMENSIONS = ["fightIq", "striking", "grappling", "cardio", "aggressiveness"] as const;
type Dimension = (typeof DIMENSIONS)[number];

const ACCOUNT_AGE_HOURS = 24;            // Account must be ≥ 24h old to count
const REFLECTION_WINDOW_HOURS = 24;      // Window after fight CLOSED
const MAX_RATINGS_PER_HOUR = 30;         // Soft rate-limit per user

function parseDimensions(body: unknown): Record<Dimension, number> | string {
  if (!body || typeof body !== "object") return "Body must be an object";
  const obj = body as Record<string, unknown>;
  const out = {} as Record<Dimension, number>;
  for (const dim of DIMENSIONS) {
    const v = obj[dim];
    if (typeof v !== "number" || !Number.isInteger(v) || v < 1 || v > 10) {
      return `${dim} must be an integer between 1 and 10`;
    }
    out[dim] = v;
  }
  return out;
}

export function registerFighterRatingsRoutes(app: Express): void {
  // ────────────────────────────────────────────────────────────────────
  // GET — User's own rating for a fighter in a specific fight
  // ────────────────────────────────────────────────────────────────────
  app.get(
    "/api/fights/:fightId/fighters/:fighterId/ratings/me",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const { fightId, fighterId } = req.params;
        const userId = req.user.id;
        const [rating] = await db
          .select()
          .from(fighterRatings)
          .where(
            and(
              eq(fighterRatings.userId, userId),
              eq(fighterRatings.fighterId, fighterId),
              eq(fighterRatings.fightId, fightId),
            ),
          );
        res.json(rating || null);
      } catch (error) {
        logger.error("Error fetching own fighter rating:", error);
        res.status(500).json({ message: "Failed to fetch rating" });
      }
    },
  );

  // ────────────────────────────────────────────────────────────────────
  // GET — Aggregate ratings for a fighter (counts-toward-aggregate only)
  // ────────────────────────────────────────────────────────────────────
  app.get("/api/fighters/:fighterId/ratings/aggregate", async (req: Request, res: Response) => {
    try {
      const { fighterId } = req.params;
      const [agg] = await db
        .select({
          count: sql<number>`count(*)::int`,
          fightIq: sql<number>`coalesce(avg(${fighterRatings.fightIq}), 0)::float`,
          striking: sql<number>`coalesce(avg(${fighterRatings.striking}), 0)::float`,
          grappling: sql<number>`coalesce(avg(${fighterRatings.grappling}), 0)::float`,
          cardio: sql<number>`coalesce(avg(${fighterRatings.cardio}), 0)::float`,
          aggressiveness: sql<number>`coalesce(avg(${fighterRatings.aggressiveness}), 0)::float`,
        })
        .from(fighterRatings)
        .where(
          and(
            eq(fighterRatings.fighterId, fighterId),
            eq(fighterRatings.countsTowardAggregate, true),
          ),
        );
      res.json(agg || { count: 0, fightIq: 0, striking: 0, grappling: 0, cardio: 0, aggressiveness: 0 });
    } catch (error) {
      logger.error("Error fetching aggregate ratings:", error);
      res.status(500).json({ message: "Failed to fetch aggregate ratings" });
    }
  });

  // ────────────────────────────────────────────────────────────────────
  // POST — Submit (or update) a rating
  // ────────────────────────────────────────────────────────────────────
  app.post(
    "/api/fights/:fightId/fighters/:fighterId/ratings",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const { fightId, fighterId } = req.params;
        const userId = req.user.id;

        // 1. Validate dimensions
        const parsed = parseDimensions(req.body);
        if (typeof parsed === "string") return res.status(400).json({ message: parsed });

        // 2. Confirm fighter is in this fight
        const [fight] = await db
          .select({ id: eventFights.id, f1: eventFights.fighter1Id, f2: eventFights.fighter2Id })
          .from(eventFights)
          .where(eq(eventFights.id, fightId));
        if (!fight) return res.status(404).json({ message: "Fight not found" });
        if (fight.f1 !== fighterId && fight.f2 !== fighterId) {
          return res.status(400).json({ message: "Fighter is not in this fight" });
        }

        // 3. Confirm fight is finalized
        const [result] = await db
          .select()
          .from(fightResults)
          .where(eq(fightResults.fightId, fightId));
        if (!result || !result.completedAt) {
          return res.status(403).json({ message: "Fight not finalized — ratings unavailable yet" });
        }

        // 4. 24h reflection window
        const completedAt = new Date(result.completedAt);
        const diffHours = (Date.now() - completedAt.getTime()) / (1000 * 60 * 60);
        if (diffHours > REFLECTION_WINDOW_HOURS) {
          return res.status(403).json({ message: "Reflection window has closed" });
        }

        // 5. Anti-spam — account age + rate limit
        let countsTowardAggregate = true;
        let excludedReason: string | null = null;

        const [user] = await db
          .select({ createdAt: users.createdAt })
          .from(users)
          .where(eq(users.id, userId));
        if (user?.createdAt) {
          const accountAgeHours = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60);
          if (accountAgeHours < ACCOUNT_AGE_HOURS) {
            countsTowardAggregate = false;
            excludedReason = "account_age";
          }
        }

        if (countsTowardAggregate) {
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          const [recent] = await db
            .select({ c: sql<number>`count(*)::int` })
            .from(fighterRatings)
            .where(
              and(
                eq(fighterRatings.userId, userId),
                gte(fighterRatings.createdAt, oneHourAgo),
              ),
            );
          if ((recent?.c ?? 0) >= MAX_RATINGS_PER_HOUR) {
            countsTowardAggregate = false;
            excludedReason = "rate_limit";
          }
        }

        // 6. Upsert
        const [existing] = await db
          .select()
          .from(fighterRatings)
          .where(
            and(
              eq(fighterRatings.userId, userId),
              eq(fighterRatings.fighterId, fighterId),
              eq(fighterRatings.fightId, fightId),
            ),
          );

        let saved;
        if (existing) {
          [saved] = await db
            .update(fighterRatings)
            .set({
              fightIq: parsed.fightIq,
              striking: parsed.striking,
              grappling: parsed.grappling,
              cardio: parsed.cardio,
              aggressiveness: parsed.aggressiveness,
            })
            .where(eq(fighterRatings.id, existing.id))
            .returning();
        } else {
          [saved] = await db
            .insert(fighterRatings)
            .values({
              userId,
              fighterId,
              fightId,
              fightIq: parsed.fightIq,
              striking: parsed.striking,
              grappling: parsed.grappling,
              cardio: parsed.cardio,
              aggressiveness: parsed.aggressiveness,
              countsTowardAggregate,
              excludedReason,
            })
            .returning();
        }

        res.json(saved);
      } catch (error) {
        logger.error("Error saving fighter rating:", error);
        res.status(500).json({ message: "Failed to save rating" });
      }
    },
  );
}
