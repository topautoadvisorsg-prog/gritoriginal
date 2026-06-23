import 'dotenv/config';
import './config/env';
import './types/express';
import express from "express";
import { clerkMiddleware } from "./auth/clerk";
import { registerAdminApi } from './admin/registerAdminApi';

import heartbeatRouter from "./system/heartbeat";
import { logger } from "./utils/logger";
import { apiErrorHandler } from './middleware/errorHandler';

async function startAdminServer() {
    const app = express();

    app.use(express.json({ limit: '50mb' }));

    // Shared Auth (Clerk)
    app.use(clerkMiddleware);

    registerAdminApi(app);

    app.use('/api/system', heartbeatRouter);

    app.use(apiErrorHandler);

    // Typically we run admin on a different port internally (e.g., 3002)
    const PORT = process.env.ADMIN_PORT || 3002;
    app.listen(PORT, () => {
        logger.info(`Admin API server running on port ${PORT}`);
    });
}

startAdminServer().catch((err) => logger.error(err));
