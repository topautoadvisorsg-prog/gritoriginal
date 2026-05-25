import 'dotenv/config';
import { z } from 'zod';

// Simple console logger for early-stage errors before full logger is available
const earlyLogger = {
  info: (...args: unknown[]) => console.log('[INFO]', ...args),
  error: (...args: unknown[]) => console.error('[ERROR]', ...args),
};

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().min(1),
  DIRECT_URL: z.string().url().optional(),
  DB_MAX_CONNECTIONS: z.string().regex(/^\d+$/).optional(),

  // Session Security
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),

  // Supabase
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_PROJECT_REF: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_').optional(),
  STRIPE_CONNECT_CLIENT_ID: z.string().optional(),

  // AI
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-').optional(),
  OPENAI_API_KEY: z.string().startsWith('sk-').optional(),
  OPEN_AI_KEY: z.string().optional(), // alternate name used in openaiClient.ts
  OPENMETER_API_KEY: z.string().optional(),
  OPENMETER_BASE_URL: z.string().url().optional(),

  // Notifications
  ONESIGNAL_APP_ID: z.string().optional(),
  ONESIGNAL_API_KEY: z.string().optional(),

  // Data Engine Integration
  DATA_ENGINE_API_URL: z.string().url().optional(),
  DATA_ENGINE_API_KEY: z.string().optional(),
  WEBHOOK_KEY: z.string().min(16, 'WEBHOOK_KEY must be 16 chars min').optional(),

  // Phase 1 — Clerk (replaces Replit OIDC in Week 1)
  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_WEBHOOK_SECRET: z.string().optional(),

  // Phase 1 — Inngest (background jobs, replaces node-cron/pg-boss in Week 8)
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),

  // Phase 1 — Upstash Redis (leaderboard cache + rate limiting)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Phase 1 — Resend (transactional email)
  RESEND_API_KEY: z.string().optional(),

  // Phase 1 — PostHog (analytics + feature flags)
  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().url().optional(),

  // Observability
  SENTRY_DSN: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).default('3001'),
  USER_PORT: z.string().regex(/^\d+$/).default('3001'),
  ADMIN_PORT: z.string().regex(/^\d+$/).default('3002'),

  // Admin Configuration
  ADMIN_EMAIL: z.string().email().optional(),

  // Optional override for OIDC return URL (reverse-proxy setups)
  CUSTOM_DOMAIN: z.string().optional(),

  // Legacy Replit OIDC (removed when Clerk ships)
  REPL_ID: z.string().optional(),
  REPLIT_DEV_DOMAIN: z.string().optional(),
  REPLIT_DOMAINS: z.string().optional(),
});

// Hardcoded configuration values centralized here
export const config = {
  // Pick locking
  PICK_LOCK_MINUTES_BEFORE_FIGHT: 10,
  
  // Progression system
  STAR_CAP: 5,
  ROI_BONUS_THRESHOLD_PCT: 15,
  ROI_LOSS_TOLERANCE_UNITS: 1,
  LOGIN_BONUS_MAX: 0.25,
  LOGIN_BONUS_LOGINS_REQUIRED: 8,
  
  // Participation rules
  getRequiredPicks: (totalFights: number): number => {
    // Fixed lookup table for standard card sizes
    if (totalFights >= 14) return 11; // 15 or 14 fights -> 11 picks
    if (totalFights === 13) return 10;
    if (totalFights === 12) return 9;
    if (totalFights <= 11) return 8;  // 11 or 10 fights -> 8 picks
    
    // Fallback for unusually small cards (< 10) or unexpectedly massive ones
    return Math.max(1, Math.ceil(totalFights * 0.7)); 
  },

  // Timezone defaults
  DEFAULT_TIMEZONE: 'PST',
  DEFAULT_TIMEZONE_OFFSET: -8,
  
  // Badge tiers
  BADGE_TIERS: ['none', 'ninja', 'samurai', 'master', 'grandmaster', 'goat'] as const,
  
  // Confidence flags
  CONFIDENCE_FLAGS: ['none', 'yellow', 'red', 'green'] as const,
  
  // Intelligence feed layers
  CONTENT_LAYERS: ['standard', 'intelligence'] as const,
  
  // Raffle system
  RAFFLE_CONTRIBUTION_PER_SUBSCRIBER: 50, // cents ($0.50)
} as const;

export type Config = typeof config;

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Empty .env lines (e.g., `STRIPE_SECRET_KEY=`) reach Node as empty strings, not undefined.
 * Optional Zod fields treat empty string as "present but invalid". Strip them so optionals work.
 */
function stripEmptyStringEnv(source: NodeJS.ProcessEnv): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(source)) {
    out[k] = v === '' ? undefined : v;
  }
  return out;
}

export function validateEnv(): EnvConfig {
  try {
    const cleaned = stripEmptyStringEnv(process.env);
    const env = envSchema.parse(cleaned);
    earlyLogger.info('Environment validation passed');
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
      earlyLogger.error('Environment validation failed:', issues);
      throw new Error(`Invalid environment configuration:\n${issues.join('\n')}`);
    }
    throw error;
  }
}

export const env = validateEnv();
