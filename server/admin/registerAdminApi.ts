import type { Express } from 'express';
import { isAuthenticated, requireAdmin } from '../auth/guards';
import { authApiLimiter } from '../middleware/rateLimiter';
import { registerAdminAIChatRoutes } from './routes/adminAIChatRoutes';
import { registerAdminChatRoutes } from './routes/adminChatRoutes';
import { registerAdminDataPipelineRoutes } from './routes/adminDataPipelineRoutes';
import { registerAdminEventRoutes } from './routes/adminEventRoutes';
import { registerAdminFighterRoutes } from './routes/adminFighterRoutes';
import { registerAdminFightResolutionRoutes } from './routes/adminFightResolutionRoutes';
import { registerAdminFightResultsRoutes } from './routes/adminFightResultsRoutes';
import { registerAdminIntelFeedRoutes } from './routes/adminIntelFeedRoutes';
import { registerAdminJobsRoutes } from './routes/adminJobsRoutes';
import { registerAdminManagementRoutes } from './routes/adminManagementRoutes';
import { registerAdminNewsRoutes } from './routes/adminNewsRoutes';
import { registerAdminNewsTagRoutes } from './routes/adminNewsTagRoutes';
import { registerAdminProgressionRoutes } from './routes/adminProgressionRoutes';
import { registerAdminRaffleRoutes } from './routes/adminRaffleRoutes';
import { registerAdminRoutes } from './routes/adminRoutes';
import { registerAdminSlipRoutes } from './routes/adminSlipRoutes';
import { registerAdminSnapshotRoutes } from './routes/adminSnapshotRoutes';
import { registerAdminTagRoutes } from './routes/adminTagRoutes';
import { registerAdminUserRoutes } from './routes/adminUserRoutes';
import { registerModerationRoutes } from './routes/moderationRoutes';
import { registerVerificationRoutes } from './routes/verificationRoutes';

/** The canonical admin API composition root for every server runtime. */
export function registerAdminApi(app: Express): void {
  app.use('/api/admin', authApiLimiter, isAuthenticated, requireAdmin);

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
}
