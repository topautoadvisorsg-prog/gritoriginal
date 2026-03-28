import type { Express, Request } from "express";

import { isAuthenticated } from '../../auth/guards';
import { db } from "../../db";
import { users, updateUserProfileSchema } from "../../../shared/schema";
import { eq } from "drizzle-orm";
import { StorageService } from "../../services/storageService";
import { logger } from '../../utils/logger';
import { validate } from '../../middleware/validate';
import { updateProfileSchema } from '../../schemas';

// Admin authorization is centralized in requireAdmin middleware
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function registerUserRoutes(app: Express): void {
  // Get current user profile
  app.get("/api/me", isAuthenticated, async (req: Request, res) => {
    try {
      const userId = req.user.id;
      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      logger.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // Update current user profile
  app.patch("/api/me", isAuthenticated, validate(updateProfileSchema), async (req: Request, res) => {
    try {
      const userId = req.user.id;
      const validationResult = updateUserProfileSchema.safeParse(req.body);

      if (!validationResult.success) {
        const fieldErrors = validationResult.error.errors.map(
          (e) => `${e.path.join(".") || "body"}: ${e.message}`
        );
        logger.warn("Profile update validation failed:", fieldErrors);
        return res.status(400).json({
          message: `Validation failed — ${fieldErrors.join("; ")}`,
          fields: fieldErrors,
        });
      }

      const updateData = validationResult.data;

      // Check username uniqueness if being updated
      if (updateData.username) {
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.username, updateData.username));

        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Username already taken" });
        }
      }

      const [updatedUser] = await db
        .update(users)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      res.json(updatedUser);
    } catch (error) {
      logger.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  // Request avatar upload URL (similar to fighter images)
  app.post("/api/me/avatar/request-url", isAuthenticated, async (req: Request, res) => {
    try {
      const userId = req.user.id;
      const { size, contentType } = req.body;

      if (!contentType) {
        return res.status(400).json({ message: "Content type required" });
      }

      if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
        return res.status(400).json({ message: "Invalid image type. Allowed: jpg, png, webp" });
      }

      if (size && size > MAX_AVATAR_SIZE) {
        return res.status(400).json({ message: "Image too large. Max size: 2MB" });
      }

      const objectStorageService = new StorageService();
      const storagePath = `users/${userId}/avatar`;
      const uploadURL = await objectStorageService.getUploadURLForPath(storagePath);
      const objectPath = `/objects/${storagePath}`;

      res.json({ uploadURL, objectPath });
    } catch (error) {
      logger.error("Error getting avatar upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Confirm avatar upload
  app.post("/api/me/avatar", isAuthenticated, async (req: Request, res) => {
    try {
      const userId = req.user.id;
      const { objectPath } = req.body;

      if (!objectPath) {
        return res.status(400).json({ message: "Object path required" });
      }

      // Update user record with the avatar URL
      const [updatedUser] = await db
        .update(users)
        .set({
          avatarUrl: objectPath,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      res.json({ avatarUrl: objectPath, user: updatedUser });
    } catch (error) {
      logger.error("Error confirming avatar upload:", error);
      res.status(500).json({ message: "Failed to confirm avatar upload" });
    }
  });

  // Check username availability
  app.get("/api/users/check-username/:username", isAuthenticated, async (req: Request, res) => {
    try {
      const { username } = req.params;
      const userId = req.user.id;

      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));

      const isAvailable = !existingUser || existingUser.id === userId;
      res.json({ available: isAvailable });
    } catch (error) {
      logger.error("Error checking username:", error);
      res.status(500).json({ message: "Failed to check username" });
    }
  });

  // Hard Delete Account
  app.delete("/api/me/delete", isAuthenticated, async (req: Request, res) => {
    try {
      const userId = req.user.id;
      const { confirmation } = req.body;

      if (confirmation !== "DELETE") {
        return res.status(400).json({ message: "Invalid confirmation phrase. Must be 'DELETE'." });
      }

      // Anonymize user picks so we don't break old fight results/leaderboards
      // We could also delete them, but anonymizing preserves global stats.
      // Drizzle doesn't support setting to NULL if the schema says notNull.
      // Wait, userPicks.userId is varchar notNull. We have to delete the picks.
      // Let's import userPicks and delete them.
      // Actually, deleting them is safer to truly purge data.
      const { userPicks } = await import("../../../shared/schema");
      await db.delete(userPicks).where(eq(userPicks.userId, userId));

      // Delete user identity
      await db.delete(users).where(eq(users.id, userId));

      // Destroy session
      req.logout(() => {
        req.session?.destroy((err) => {
          if (err) {
            logger.error("Error destroying session during account deletion:", err);
          }
          res.clearCookie("connect.sid");
          res.json({ message: "Account deleted successfully." });
        });
      });
    } catch (error) {
      logger.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

}
