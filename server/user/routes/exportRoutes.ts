import type { Express, Request, Response } from "express";
import { isAuthenticated, requireTier } from "../../auth/guards";
import { db } from "../../db";
import { userPicks } from "../../../shared/models/auth";
import { eventFights, events } from "../../../shared/schema";
import { eq } from "drizzle-orm";
import { logger } from "../../utils/logger";

export function registerExportRoutes(app: Express) {
  app.get(
    "/api/user/export/picks",
    isAuthenticated,
    requireTier("premium"),
    async (req: Request, res: Response) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const picks = await db
          .select({
            pickId: userPicks.id,
            fightId: userPicks.fightId,
            pickedFighterId: userPicks.pickedFighterId,
            pickedMethod: userPicks.pickedMethod,
            pickedRound: userPicks.pickedRound,
            units: userPicks.units,
            pointsAwarded: userPicks.pointsAwarded,
            status: userPicks.status,
            createdAt: userPicks.createdAt,
            eventName: events.name,
            eventDate: events.date,
          })
          .from(userPicks)
          .leftJoin(eventFights, eq(eventFights.id, userPicks.fightId))
          .leftJoin(events, eq(events.id, eventFights.eventId))
          .where(eq(userPicks.userId, userId))
          .orderBy(userPicks.createdAt);

        const headers = [
          "Pick ID",
          "Fight ID",
          "Picked Fighter ID",
          "Method",
          "Round",
          "Units",
          "Points Awarded",
          "Status",
          "Date",
          "Event",
          "Event Date",
        ];

        const escape = (val: unknown): string => {
          const s = val == null ? "" : String(val);
          return s.includes(",") || s.includes('"') || s.includes("\n")
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        };

        const rows = picks.map((p) => [
          escape(p.pickId),
          escape(p.fightId),
          escape(p.pickedFighterId),
          escape(p.pickedMethod),
          escape(p.pickedRound),
          escape(p.units),
          escape(p.pointsAwarded),
          escape(p.status),
          escape(p.createdAt?.toISOString() ?? ""),
          escape(p.eventName),
          escape(p.eventDate),
        ]);

        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const filename = `my-picks-${new Date().toISOString().split("T")[0]}.csv`;

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(csv);
      } catch (error) {
        logger.error("Error exporting picks:", error);
        res.status(500).json({ message: "Failed to export picks" });
      }
    }
  );
}
