
import { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { isAuthenticated } from '../../auth/guards';
import { logger } from '../../utils/logger';

export function registerUploadRoutes(app: Express) {
    const uploadDir = path.join(process.cwd(), "uploads");

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Handle File Upload (PUT)
    // The path comes in as /api/uploads/users/123/avatar
    // We need to capture the rest of the path
    app.put(/^\/api\/uploads\/(.*)/, isAuthenticated, (req: Request, res: Response) => {
        try {
            // Extract the relative path from the URL
            const relativePath = req.params[0] as string;

            if (!relativePath) {
                return res.status(400).json({ error: "Invalid path" });
            }

            // Prevent directory traversal attacks
            const resolvedPath = path.resolve(uploadDir, relativePath);
            if (!resolvedPath.startsWith(uploadDir)) {
                return res.status(403).json({ error: "Access denied" });
            }

            // Ensure parent directory exists
            const parentDir = path.dirname(resolvedPath);
            if (!fs.existsSync(parentDir)) {
                fs.mkdirSync(parentDir, { recursive: true });
            }

            // Stream the request body to the file
            const fileStream = fs.createWriteStream(resolvedPath);

            req.pipe(fileStream);

            fileStream.on("finish", () => {
                res.json({ success: true, path: `/uploads/${relativePath}` });
            });

            fileStream.on("error", (err) => {
                logger.error("File write error:", err);
                res.status(500).json({ error: "Failed to write file" });
            });

        } catch (error) {
            logger.error("Upload handler error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    // Serve Uploaded Files
    // This allows the frontend to display the images via /objects/... or /uploads/...
    // We'll start serving /objects to match the legacy path if possible, or just /uploads
    // The previous implementation utilized /objects proxy in Vite.
    // Let's assume we update the DB to store `/uploads/...` links, so we serve `/uploads`.
}
