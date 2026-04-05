import 'dotenv/config';
import './config/env';
import './types/express';
import fs from 'fs';
import * as Sentry from "@sentry/node";
import express from "express";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
  });
}

import { setupAuth, registerAuthRoutes, registerReplitOIDCRoutes } from "./replit_integrations/auth";
import { isAuthenticated, requireAdmin } from "./auth/guards";

// Admin routes — mounted directly for single-port production compatibility
import { registerAdminRoutes } from "./admin/routes/adminRoutes";
import { registerAdminManagementRoutes } from "./admin/routes/adminManagementRoutes";
import { registerVerificationRoutes } from "./admin/routes/verificationRoutes";
import { registerModerationRoutes } from "./admin/routes/moderationRoutes";
import { registerAdminNewsRoutes } from "./admin/routes/adminNewsRoutes";
import { registerAdminEventRoutes } from "./admin/routes/adminEventRoutes";
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

import { registerFighterImageRoutes } from "./user/routes/fighterImageRoutes";
import { registerFighterRoutes } from "./user/routes/fighterRoutes";
import { registerEventRoutes } from "./user/routes/eventRoutes";
import { registerUserRoutes } from "./user/routes/userRoutes";
import { registerPicksRoutes } from "./user/routes/picksRoutes";
import { registerLeaderboardRoutes } from "./user/routes/leaderboardRoutes";
import { registerFightResultsRoutes } from "./user/routes/fightResultsRoutes";
import { registerFightNotesRoutes } from "./user/routes/fightNotesRoutes";
import { registerNewsRoutes } from "./user/routes/newsRoutes";
import { registerChatRoutes } from "./user/routes/chatRoutes";
import { registerSnapshotRoutes } from "./user/routes/snapshotRoutes";
import { registerAIRoutes } from "./ai/aiRoutes";
import { registerAIChatRoutes } from "./user/routes/aiChatRoutes";
import { registerTagRoutes } from "./user/routes/tagRoutes";
import { registerRaffleRoutes } from "./user/routes/raffleRoutes";
import { registerStatsRoutes } from "./user/routes/statsRoutes";
import { registerDashboardRoutes } from "./user/routes/dashboardRoutes";
import { registerProgressionRoutes } from "./user/routes/progressionRoutes";
import userSettingsRoutes from "./user/routes/userSettingsRoutes";
import badgeRoutes from "./user/routes/badgeRoutes";
import { registerUploadRoutes } from "./user/routes/uploadRoutes";
import { registerExportRoutes } from "./user/routes/exportRoutes";
import { registerIntelFeedRoutes } from "./user/routes/intelFeedRoutes";
import { registerSlipRoutes } from "./user/routes/slipRoutes";
import { registerPicksDistributionRoutes } from "./routes/picksDistribution";
import { registerActivityFeedRoutes } from "./routes/activityFeed";
import { registerAdminFighterRoutes } from "./admin/routes/adminFighterRoutes";
import groupsRoutes from "./user/routes/groupsRoutes";
import paymentRouter from "./user/routes/paymentRoutes";
import { registerStripeWebhook } from "./api/webhooks/stripeWebhook";
import dataEngineWebhook from "./api/webhooks/dataEngineWebhook";
import bootstrapRouter from "./api/bootstrapRoute";
import heartbeatRouter from "./system/heartbeat";
import { socketService } from "./services/socketService";
import path from "path";
import { logger } from "./utils/logger";
import { initCrons } from "./services/cronService";
import { publicApiLimiter, strictApiLimiter, authApiLimiter, aiChatLimiter } from './middleware/rateLimiter';
import { seedSuggestedQuestions } from './seeds/seedSuggestedQuestions';
import { initJobService } from './services/jobService';
import { requestLogger } from './middleware/requestLogger';

async function startUserServer() {
    const app = express();

    // Register Stripe webhook BEFORE global JSON middleware
    registerStripeWebhook(app);

    app.use(express.json({ limit: '50mb' }));

    // Shared Auth (Passport & Session)
    await setupAuth(app);
    registerAuthRoutes(app);
    registerReplitOIDCRoutes(app);

    app.use(requestLogger);

    // Rate limits
    app.use('/api/fighters', publicApiLimiter);
    app.use('/api/events', publicApiLimiter);
    app.use('/api/news', publicApiLimiter);
    app.use('/api/leaderboard', publicApiLimiter);
    app.use('/api/tags', publicApiLimiter);

    app.use('/api/chat', aiChatLimiter);
    app.use('/api/ai', aiChatLimiter);

    app.use('/api/picks', authApiLimiter);
    app.use('/api/me', authApiLimiter);

    // User App Specific Routes
    registerFighterImageRoutes(app);
    registerFighterRoutes(app);
    registerEventRoutes(app);
    registerUserRoutes(app);
    registerPicksRoutes(app);
    registerLeaderboardRoutes(app);
    registerFightResultsRoutes(app);
    registerFightNotesRoutes(app);
    registerNewsRoutes(app);
    registerChatRoutes(app);
    registerSnapshotRoutes(app);
    registerAIRoutes(app);
    registerAIChatRoutes(app);
    registerTagRoutes(app);
    registerRaffleRoutes(app);
    registerStatsRoutes(app);
    registerDashboardRoutes(app);
    registerProgressionRoutes(app);
    app.use(badgeRoutes);
    app.use('/api', userSettingsRoutes);

    app.use('/objects', express.static(path.join(process.cwd(), 'uploads')));
    registerUploadRoutes(app);
    registerExportRoutes(app);
    registerIntelFeedRoutes(app);
    registerSlipRoutes(app);
    registerPicksDistributionRoutes(app);
    registerActivityFeedRoutes(app);
    app.use('/api/groups', groupsRoutes);
    app.use(paymentRouter);

    app.use('/api/system', heartbeatRouter);
    
    // Register data engine webhook (public endpoint with API key auth)
    app.use('/api', dataEngineWebhook);

    // Register bootstrap/setup routes (API key protected, no user session needed)
    app.use('/api', bootstrapRouter);

    // Admin routes — mounted directly (single-port architecture)
    app.use('/api/admin', authApiLimiter, requireAdmin);
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
    registerModerationRoutes(app);

    seedSuggestedQuestions().catch(() => {});

    initCrons();
    
    // Start background job queue for durable outbox syncing
    initJobService().catch(err => logger.error('Failed to initialize job queue', err));

    // Serve the Vite frontend build if it exists (production deployment)
    const distPublic = path.join(process.cwd(), 'dist/public');
    if (fs.existsSync(path.join(distPublic, 'index.html'))) {
        // Serve static Vite build assets
        app.use(express.static(distPublic));

        // SPA fallback — serve index.html for all unmatched routes
        app.get('*', (_req, res) => {
            res.sendFile(path.join(distPublic, 'index.html'));
        });
    }

    const PORT = process.env.USER_PORT || process.env.PORT || 3001;
    const server = app.listen(PORT, () => {
        logger.info(`User API server running on port ${PORT}`);
    });

    socketService.init(server);
}

startUserServer().catch((err) => logger.error(err));
