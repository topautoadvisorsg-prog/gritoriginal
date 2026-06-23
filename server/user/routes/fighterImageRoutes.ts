import type { Express, Request, Response } from "express";
import { isAuthenticated, requireAdmin } from '../../auth/guards';
import { storage } from '../../storage';
import { logger } from '../../utils/logger';
import path from 'path';
import fs from 'fs';
import sizeOf from 'image-size';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

const ASPECT_RULES: Record<string, { label: string; targetRatio: number; tolerance: number }> = {
  face: { label: 'Headshot (1:1)', targetRatio: 1.0, tolerance: 0.15 },
  body: { label: 'Half-body (2:3)', targetRatio: 2 / 3, tolerance: 0.15 },
};

function checkAspectRatio(filePath: string, imageType: string): { valid: boolean; message?: string } {
  try {
    const dimensions = sizeOf(filePath);
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
      const { fighterId, imageType } = req.body;

      if (!fighterId || !['face', 'body'].includes(imageType)) {
        return res.status(400).json({ error: "Invalid fighterId or imageType" });
      }

      const objectPath = `fighters/${fighterId}/${imageType}.jpg`;
      const uploadURL = `/api/uploads/${objectPath}`;

      res.json({ uploadURL, objectPath });
    } catch (err) {
      logger.error("Error generating upload URL:", err);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.post("/api/fighter/image/confirm", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { fighterId, imageType, objectPath } = req.body;

      if (!fighterId || !['face', 'body'].includes(imageType) || !objectPath) {
        return res.status(400).json({ error: "Invalid parameters" });
      }

      // Validate image aspect ratio before committing to DB
      const filePath = path.join(UPLOAD_DIR, objectPath);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Uploaded file not found — upload the image before confirming" });
      }

      const aspectCheck = checkAspectRatio(filePath, imageType);
      if (!aspectCheck.valid) {
        // Remove the invalid file to keep storage clean
        try {
          fs.unlinkSync(filePath);
        } catch (cleanupError) {
          logger.warn("Failed to remove rejected fighter image:", cleanupError);
        }
        return res.status(422).json({
          error: "Image rejected: invalid aspect ratio",
          details: aspectCheck.message,
          requirements: {
            face: "1:1 (square) — e.g. 512×512",
            body: "2:3 (portrait) — e.g. 512×768",
          },
        });
      }

      const publicUrl = `/objects/${objectPath}`;
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
