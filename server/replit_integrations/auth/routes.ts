import type { Express } from "express";
import { isAuthenticated } from "./replitAuth";
import { storage } from "./storage";
import { logger } from "../../utils/logger";

function computePermissions(role: string, tier: string): string[] {
  const perms: string[] = ["read:events", "submit:picks", "view:leaderboard"];
  if (tier === "medium" || tier === "premium") {
    perms.push("access:extended_history", "use:custom_emojis");
  }
  if (tier === "premium") {
    perms.push("access:advanced_analytics", "use:priority_support");
  }
  if (role === "admin") {
    perms.push("admin:all");
  }
  return perms;
}

export function registerAuthRoutes(app: Express) {
  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const permissions = computePermissions(user.role ?? "user", user.tier ?? "free");
      logger.metric('auth_fetch_success', 1, { userId });
      res.json({ ...user, permissions });
    } catch (error) {
      logger.metric('auth_fetch_fail', 1);
      logger.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
