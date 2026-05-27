import 'dotenv/config';
import './config/env';
import './types/express';
import express from "express";
import { isAuthenticated, requireAdmin } from "./auth/guards";
import { clerkMiddleware } from "./auth/clerk";

import { registerAdminRoutes } from "./admin/routes/adminRoutes";
import { registerAdminManagementRoutes } from "./admin/routes/adminManagementRoutes";
import { registerVerificationRoutes } from "./admin/routes/verificationRoutes";
import { registerModerationRoutes } from "./admin/routes/moderationRoutes";
import { registerAdminNewsRoutes } from "./admin/routes/adminNewsRoutes";
import { registerAdminEventRoutes } from "./admin/routes/adminEventRoutes";
import { registerAdminFighterRoutes } from "./admin/routes/adminFighterRoutes";
import { registerAdminSnapshotRoutes } from "./admin/routes/adminSnapshotRoutes";
import { registerAdminFightResultsRoutes } from "./admin/routes/adminFightResultsRoutes";
import { registerAdminUserRoutes } from "./admin/routes/adminUserRoutes";
import { registerAdminAIChatRoutes } from "./admin/routes/adminAIChatRoutes";
import { registerAdminProgressionRoutes } from "./admin/routes/adminProgressionRoutes";
import { registerAdminRaffleRoutes } from "./admin/routes/adminRaffleRoutes";
import { registerAdminFightResolutionRoutes } from "./admin/routes/adminFightResolutionRoutes";
import { registerAdminTagRoutes } from "./admin/routes/adminTagRoutes";
import { registerAdminDataPipelineRoutes } from "./admin/routes/adminDataPipelineRoutes";
import { registerAdminNewsTagRoutes } from "./admin/routes/adminNewsTagRoutes";
import { registerAdminIntelFeedRoutes } from "./admin/routes/adminIntelFeedRoutes";
import { registerAdminChatRoutes } from "./admin/routes/adminChatRoutes";
import { registerAdminSlipRoutes } from "./admin/routes/adminSlipRoutes";
import { registerAdminJobsRoutes } from "./admin/routes/adminJobsRoutes";

import heartbeatRouter from "./system/heartbeat";
import { logger } from "./utils/logger";
import { authApiLimiter } from './middleware/rateLimiter';

async function startAdminServer() {
    const app = express();

    app.use(express.json({ limit: '50mb' }));

    // Shared Auth (Clerk)
    app.use(clerkMiddleware);

    // GLOBAL ADMIN ENFORCEMENT
    // Protect all /api/admin routes implicitly (Zero trust logic)
    app.use('/api/admin', authApiLimiter, isAuthenticated, requireAdmin);

    // Mount Admin Only Routes
    registerAdminRoutes(app);
    registerAdminNewsRoutes(app);
    registerAdminEventRoutes(app);
    registerAdminFighterRoutes(app);
    registerAdminSnapshotRoutes(app);
    registerAdminFightResultsRoutes(app);
    registerAdminUserRoutes(app);
    registerAdminAIChatRoutes(app);
    registerAdminProgressionRoutes(app);
    registerAdminRaffleRoutes(app);
    registerAdminFightResolutionRoutes(app);
    registerAdminTagRoutes(app);
    registerAdminNewsTagRoutes(app);
    registerAdminDataPipelineRoutes(app);
    registerAdminIntelFeedRoutes(app);
    registerAdminChatRoutes(app);
    registerAdminSlipRoutes(app);
    registerVerificationRoutes(app);
    registerAdminManagementRoutes(app);
    registerAdminJobsRoutes(app);

    // Moderation often spans both depending on implementation, but typically admin
    registerModerationRoutes(app);

    app.use('/api/system', heartbeatRouter);

    // Global Error Handler to guarantee no stack trace leaks
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
        logger.error(err);
        res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
    });

    // Typically we run admin on a different port internally (e.g., 3002)
    const PORT = process.env.ADMIN_PORT || 3002;
    app.listen(PORT, () => {
        logger.info(`Admin API server running on port ${PORT}`);
    });
}

startAdminServer().catch((err) => logger.error(err));
