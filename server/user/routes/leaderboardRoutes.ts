import type { Express } from "express";
import { db } from "../../db";
import { users, userPicks } from "../../../shared/schema";
import { desc, sql, eq } from "drizzle-orm";
import { logger } from '../../utils/logger';
import { parsePagination, paginatedResponse } from '../../utils/pagination';

export function registerLeaderboardRoutes(app: Express): void {
  // Get leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const { country, eventId } = req.query;

      // Base query
      let query = db
        .select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          avatarUrl: users.avatarUrl,
          profileImageUrl: users.profileImageUrl,
          totalPoints: users.totalPoints,
          country: users.country,
          privacySettings: users.privacySettings,
        })
        .from(users)
        .orderBy(desc(users.totalPoints));

      // Apply Country Filter
      if (country) {
        query = db
          .select({
            id: users.id,
            username: users.username,
            firstName: users.firstName,
            lastName: users.lastName,
            avatarUrl: users.avatarUrl,
            profileImageUrl: users.profileImageUrl,
            totalPoints: users.totalPoints,
            country: users.country,
            privacySettings: users.privacySettings,
          })
          .from(users)
          .where(eq(users.country, country as string))
          .orderBy(desc(users.totalPoints));
      }

      // TODO: Implement Event-Specific Leaderboard Logic (requires 'user_event_points' or similar aggregation)
      // For now, if eventId is passed, we might need to join with userPicks or a snapshot table.
      // Keeping it simple for now: Global Points filtered by Country.

      const leaderboard = await query;

      // Find max points for gold badge
      const maxPoints = leaderboard.length > 0 ? leaderboard[0].totalPoints : 0;

      // Apply privacy settings and add badge
      const processedLeaderboard = leaderboard.map((user, index) => {
        const privacy = user.privacySettings as {
          showAvatar: boolean;
          showSocialLinks: boolean;
          showUsername: boolean;
        } | null;

        const showAvatar = privacy?.showAvatar ?? true;
        const showUsername = privacy?.showUsername ?? true;

        return {
          rank: index + 1,
          id: user.id,
          username: showUsername ? user.username : null,
          displayName: showUsername
            ? (user.username || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous')
            : 'Anonymous',
          avatarUrl: showAvatar ? (user.avatarUrl || user.profileImageUrl) : null,
          totalPoints: user.totalPoints,
          country: user.country,
          hasGoldBadge: maxPoints > 0 && user.totalPoints === maxPoints,
        };
      });

      if (req.query.page) {
        const params = parsePagination(req);
        const paginated = processedLeaderboard.slice(params.offset, params.offset + params.limit);
        return res.json({
          ...paginatedResponse(paginated, processedLeaderboard.length, params),
          maxPoints,
        });
      }
      res.json({
        leaderboard: processedLeaderboard,
        maxPoints,
      });
    } catch (error) {
      logger.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Get user's ranking
  app.get("/api/leaderboard/rank/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      // Get all users ordered by points
      const allUsers = await db
        .select({
          id: users.id,
          totalPoints: users.totalPoints,
        })
        .from(users)
        .orderBy(desc(users.totalPoints));

      const userIndex = allUsers.findIndex(u => u.id === userId);

      if (userIndex === -1) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = allUsers[userIndex];
      const maxPoints = allUsers.length > 0 ? allUsers[0].totalPoints : 0;

      res.json({
        rank: userIndex + 1,
        totalUsers: allUsers.length,
        totalPoints: user.totalPoints,
        hasGoldBadge: maxPoints > 0 && user.totalPoints === maxPoints,
      });
    } catch (error) {
      logger.error("Error fetching user ranking:", error);
      res.status(500).json({ message: "Failed to fetch ranking" });
    }
  });
}
