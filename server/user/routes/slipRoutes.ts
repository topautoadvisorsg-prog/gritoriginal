import type { Express, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db";
import { slips, chatNotifications } from "../../../shared/schema";
import { eq, and, desc, gt } from "drizzle-orm";
import { isAuthenticated } from "../../auth/guards";
import { logger } from "../../utils/logger";

const SLIP_EXPIRY_DAYS = 7;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// Multer setup — memoryStorage so we can validate before writing
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("INVALID_FILE_TYPE"));
        }
    },
});

function getExtension(mimetype: string): string {
    const map: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
    };
    return map[mimetype] || "jpg";
}

export function registerSlipRoutes(app: Express) {

    // ── Upload a slip ─────────────────────────────────────────────────────────
    // POST /api/slips/upload
    // Challenger-only (tier check is enforced but caller must also guard in UI).
    // Accepts multipart form-data with field "image".
    app.post("/api/slips/upload", isAuthenticated, (req: Request, res: Response) => {
        upload.single("image")(req, res, async (err) => {
            if (err) {
                if (err.message === "INVALID_FILE_TYPE") {
                    return res.status(400).json({ error: "Only JPG, PNG, and WebP images are allowed" });
                }
                if (err.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).json({ error: "File too large (max 5MB)" });
                }
                logger.error("Multer error:", err);
                return res.status(500).json({ error: "Upload failed" });
            }

            if (!req.file) {
                return res.status(400).json({ error: "No file provided" });
            }

            const userId = req.user.id;

            try {
                // Prepare upload directory
                const slipDir = path.join(process.cwd(), "uploads", "slips", userId);
                if (!fs.existsSync(slipDir)) {
                    fs.mkdirSync(slipDir, { recursive: true });
                }

                const ext = getExtension(req.file.mimetype);
                const filename = `${uuidv4()}.${ext}`;
                const filePath = path.join(slipDir, filename);

                // Write file
                fs.writeFileSync(filePath, req.file.buffer);

                const imageUrl = `/uploads/slips/${userId}/${filename}`;
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + SLIP_EXPIRY_DAYS);

                const [slip] = await db.insert(slips)
                    .values({
                        id: uuidv4(),
                        userId,
                        imageUrl,
                        status: "pending",
                        isFeatured: false,
                        expiresAt,
                        createdAt: new Date(),
                    })
                    .returning();

                res.status(201).json({
                    ...slip,
                    daysRemaining: SLIP_EXPIRY_DAYS,
                });
            } catch (error) {
                logger.error("Error saving slip:", error);
                res.status(500).json({ error: "Failed to save slip" });
            }
        });
    });

    // ── Get own slips ─────────────────────────────────────────────────────────
    // GET /api/slips/mine
    app.get("/api/slips/mine", isAuthenticated, async (req: Request, res: Response) => {
        try {
            const userId = req.user.id;

            const mySlips = await db.select()
                .from(slips)
                .where(eq(slips.userId, userId))
                .orderBy(desc(slips.createdAt));

            const now = new Date();
            const enriched = mySlips.map((slip) => {
                const expires = new Date(slip.expiresAt);
                const diffMs = expires.getTime() - now.getTime();
                const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                return { ...slip, daysRemaining };
            });

            res.json(enriched);
        } catch (error) {
            logger.error("Error fetching own slips:", error);
            res.status(500).json({ error: "Failed to fetch slips" });
        }
    });

    // ── Delete own slip ───────────────────────────────────────────────────────
    // DELETE /api/slips/:id
    // Only pending or rejected slips can be deleted by the user
    app.delete("/api/slips/:id", isAuthenticated, async (req: Request, res: Response) => {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            const [slip] = await db.select()
                .from(slips)
                .where(and(eq(slips.id, id), eq(slips.userId, userId)))
                .limit(1);

            if (!slip) {
                return res.status(404).json({ error: "Slip not found" });
            }

            if (slip.status === "approved") {
                return res.status(403).json({ error: "Approved slips cannot be deleted by users" });
            }

            // Delete from filesystem (strip leading slash so path.join resolves correctly)
            const absPath = path.join(process.cwd(), slip.imageUrl.replace(/^\//, ""));
            if (fs.existsSync(absPath)) {
                fs.unlinkSync(absPath);
            }

            await db.delete(slips).where(eq(slips.id, id));

            res.json({ success: true });
        } catch (error) {
            logger.error("Error deleting slip:", error);
            res.status(500).json({ error: "Failed to delete slip" });
        }
    });

    // ── Get in-app chat notifications ─────────────────────────────────────────
    // GET /api/chat/notifications
    app.get("/api/chat/notifications", isAuthenticated, async (req: Request, res: Response) => {
        try {
            const userId = req.user.id;

            const notifications = await db.select()
                .from(chatNotifications)
                .where(eq(chatNotifications.userId, userId))
                .orderBy(desc(chatNotifications.createdAt))
                .limit(20);

            res.json(notifications);
        } catch (error) {
            logger.error("Error fetching notifications:", error);
            res.status(500).json({ error: "Failed to fetch notifications" });
        }
    });

    // ── Mark notification as read ─────────────────────────────────────────────
    // PATCH /api/chat/notifications/:id/read
    app.patch("/api/chat/notifications/:id/read", isAuthenticated, async (req: Request, res: Response) => {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            await db
                .update(chatNotifications)
                .set({ isRead: true })
                .where(and(eq(chatNotifications.id, id), eq(chatNotifications.userId, userId)));

            res.json({ success: true });
        } catch (error) {
            logger.error("Error marking notification read:", error);
            res.status(500).json({ error: "Failed to update notification" });
        }
    });

    // ── Public Slip Wall ──────────────────────────────────────────────────────
    // GET /api/slip-wall
    // Returns up to 6 most recently featured, non-expired, approved slips
    app.get("/api/slip-wall", async (_req: Request, res: Response) => {
        try {
            const now = new Date();

            const featured = await db.select()
                .from(slips)
                .where(
                    and(
                        eq(slips.isFeatured, true),
                        eq(slips.status, "approved"),
                        gt(slips.expiresAt, now)
                    )
                )
                .orderBy(desc(slips.featuredAt))
                .limit(6);

            res.json(featured);
        } catch (error) {
            logger.error("Error fetching slip wall:", error);
            res.status(500).json({ error: "Failed to fetch slip wall" });
        }
    });
}
