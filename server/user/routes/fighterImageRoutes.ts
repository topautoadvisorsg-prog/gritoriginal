import type { Express, Request, Response } from "express";
import { isAuthenticated, requireAdmin } from '../../auth/guards';
import { storage } from '../../storage';
import { logger } from '../../utils/logger';
import { ObjectSizeLimitError, StorageService } from '../../services/storageService';
import { detectSupportedImageType, isSupportedImageContentType } from '../../services/imageValidation';
import sizeOf from 'image-size';

const ASPECT_RULES: Record<string, { label: string; targetRatio: number; tolerance: number }> = {
  face: { label: 'Headshot (1:1)', targetRatio: 1.0, tolerance: 0.15 },
  body: { label: 'Half-body (2:3)', targetRatio: 2 / 3, tolerance: 0.15 },
};

const MAX_FIGHTER_IMAGE_BYTES = 5 * 1024 * 1024;

function checkAspectRatio(buffer: Buffer, imageType: string): { valid: boolean; message?: string } {
  try {
    const dimensions = sizeOf(buffer);
    if (!dimensions.width || !dimensions.height) {
      return { valid: false, message: 'Could not read image dimensions' };
    }
    const rule = ASPECT_RULES[imageType];
    if (!rule) return { valid: true };

    const actualRatio = dimensions.width / dimensions.height;
    const diff = Math.abs(actualRatio - rule.targetRatio);
    if (diff > rule.tolerance) {
      return {
        valid: false,
        message: `Invalid aspect ratio for ${rule.label}. Got ${dimensions.width}×${dimensions.height} (ratio ${actualRatio.toFixed(2)}), expected ~${rule.targetRatio.toFixed(2)} (±${rule.tolerance}).`,
      };
    }
    return { valid: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { valid: false, message: `Failed to read image file: ${message}` };
  }
}

export function registerFighterImageRoutes(app: Express): void {

  app.post("/api/fighter/image/request-url", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { fighterId, imageType, size, contentType } = req.body;

      if (typeof fighterId !== 'string'
        || !fighterId
        || !['face', 'body'].includes(imageType)
        || !Number.isSafeInteger(size)
        || size <= 0
        || size > MAX_FIGHTER_IMAGE_BYTES
        || !isSupportedImageContentType(contentType)) {
        return res.status(400).json({ error: "Invalid fighter image upload metadata" });
      }

      const fighter = await storage.getFighter(fighterId);
      if (!fighter) {
        return res.status(404).json({ error: "Fighter not found" });
      }

      const objectPath = `fighters/${fighterId}/${imageType}.jpg`;
      const storageService = new StorageService();
      const uploadURL = await storageService.getUploadURLForPath(objectPath, contentType);

      res.json({ uploadURL, objectPath });
    } catch (err) {
      logger.error("Error generating upload URL:", err);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.post("/api/fighter/image/confirm", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { fighterId, imageType, objectPath } = req.body;

      if (typeof fighterId !== 'string' || !fighterId || !['face', 'body'].includes(imageType)) {
        return res.status(400).json({ error: "Invalid parameters" });
      }

      const expectedObjectPath = `fighters/${fighterId}/${imageType}.jpg`;
      if (objectPath !== expectedObjectPath) {
        return res.status(400).json({ error: "Object path does not match the requested fighter image" });
      }

      const fighter = await storage.getFighter(fighterId);
      if (!fighter) {
        return res.status(404).json({ error: "Fighter not found" });
      }

      const storageService = new StorageService();

      // Validate image aspect ratio before committing to DB - read the object
      // back from R2 rather than trusting the client's PUT succeeded cleanly.
      let buffer: Buffer;
      try {
        buffer = await storageService.getObjectBuffer(objectPath, MAX_FIGHTER_IMAGE_BYTES);
      } catch (error) {
        if (error instanceof ObjectSizeLimitError) {
          return res.status(413).json({ error: "Uploaded image exceeds the 5MB limit" });
        }
        return res.status(404).json({ error: "Uploaded file not found — upload the image before confirming" });
      }

      if (!detectSupportedImageType(buffer)) {
        return res.status(422).json({ error: "Image rejected: unsupported file signature" });
      }

      const aspectCheck = checkAspectRatio(buffer, imageType);
      if (!aspectCheck.valid) {
        return res.status(422).json({
          error: "Image rejected: invalid aspect ratio",
          details: aspectCheck.message,
          requirements: {
            face: "1:1 (square) — e.g. 512×512",
            body: "2:3 (portrait) — e.g. 512×768",
          },
        });
      }

      const publicUrl = storageService.getPublicUrl(objectPath);
      const updateData = imageType === 'face'
        ? { imageUrl: publicUrl }
        : { bodyImageUrl: publicUrl };

      const updated = await storage.updateFighter(fighterId, updateData);
      if (!updated) {
        return res.status(404).json({ error: "Fighter not found" });
      }

      res.json({ fighterId, imageType, imageUrl: publicUrl });
    } catch (err) {
      logger.error("Error confirming image upload:", err);
      res.status(500).json({ error: "Failed to confirm upload" });
    }
  });
}
