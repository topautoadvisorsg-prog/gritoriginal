import type { Express, Request } from "express";

import { isAuthenticated } from '../../auth/guards';
import { db } from "../../db";
import { users, updateUserProfileSchema } from "../../../shared/schema";
import { eq } from "drizzle-orm";
import { ObjectSizeLimitError, StorageService } from "../../services/storageService";
import { detectSupportedImageType, isSupportedImageContentType } from "../../services/imageValidation";
import { logger } from '../../utils/logger';
import { validate } from '../../middleware/validate';
import { updateProfileSchema } from '../../schemas';

// Admin authorization is centralized in requireAdmin middleware
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

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
      const { size, contentType } = req.body ?? {};

      if (!Number.isSafeInteger(size)
        || size <= 0
        || size > MAX_AVATAR_SIZE
        || !isSupportedImageContentType(contentType)) {
        return res.status(400).json({ message: "Invalid avatar upload metadata" });
      }

      const objectStorageService = new StorageService();
      const storagePath = `users/${userId}/avatar`;
      const uploadURL = await objectStorageService.getUploadURLForPath(storagePath, contentType);
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
      const { objectPath } = req.body ?? {};
      const storagePath = `users/${userId}/avatar`;
      const expectedObjectPath = `/objects/${storagePath}`;

      if (objectPath !== expectedObjectPath) {
        return res.status(400).json({ message: "Object path does not match the authenticated user" });
      }

      const objectStorageService = new StorageService();
      let buffer: Buffer;
      try {
        buffer = await objectStorageService.getObjectBuffer(storagePath, MAX_AVATAR_SIZE);
      } catch (error) {
        if (error instanceof ObjectSizeLimitError) {
          return res.status(413).json({ message: "Uploaded avatar exceeds the 2MB limit" });
        }
        return res.status(404).json({ message: "Uploaded avatar not found" });
      }

      if (!detectSupportedImageType(buffer)) {
        return res.status(422).json({ message: "Avatar rejected: unsupported file signature" });
      }

      const publicUrl = objectStorageService.getPublicUrl(storagePath);
      const [updatedUser] = await db
        .update(users)
        .set({
          avatarUrl: publicUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ avatarUrl: publicUrl, user: updatedUser });
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

      // Also delete from Clerk — otherwise the same JWT will hydrate a fresh
      // users row on the next request and "resurrect" the deleted account.
      try {
        const { clerkClient } = await import("@clerk/express");
        await clerkClient.users.deleteUser(userId);
      } catch (clerkError) {
        // Log but don't fail — local data is already wiped. The orphaned
        // Clerk account can be cleaned up manually if this errors.
        logger.error("Error deleting Clerk user during account deletion:", clerkError);
      }

      res.json({ message: "Account deleted successfully." });
    } catch (error) {
      logger.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

}
