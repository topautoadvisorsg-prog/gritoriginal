import type { RequestHandler } from 'express';
import { clerkMiddleware as clerkExpressMiddleware } from '@clerk/express';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const hasClerkConfig = Boolean(env.CLERK_SECRET_KEY && env.CLERK_PUBLISHABLE_KEY);

if (!hasClerkConfig) {
  logger.warn('[clerk] Clerk middleware is disabled until both Clerk keys are configured.');
}

/** Attach Clerk session data globally; authorization and user hydration live in guards.ts. */
export const clerkMiddleware: RequestHandler = hasClerkConfig
  ? clerkExpressMiddleware()
  : (_req, _res, next) => next();
