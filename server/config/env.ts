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
  
  // Session Security
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  
  // External Services (optional but validated if present)
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-').optional(),
  OPENAI_API_KEY: z.string().startsWith('sk-').optional(),
  OPENMETER_API_KEY: z.string().optional(),
  ONESIGNAL_APP_ID: z.string().optional(),
  ONESIGNAL_API_KEY: z.string().optional(),
  DATA_ENGINE_API_URL: z.string().url().optional(),
  DATA_ENGINE_API_KEY: z.string().optional(),
  WEBHOOK_KEY: z.string().min(16, "WEBHOOK_KEY must be 16 chars min").optional(),
  
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).default('3001'),
  USER_PORT: z.string().regex(/^\d+$/).default('3001'),
  ADMIN_PORT: z.string().regex(/^\d+$/).default('3002'),
  
  // Admin Configuration
  ADMIN_EMAIL: z.string().email().optional(),
  
  // Replit (if using OIDC)
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
  BADGE_TIERS: ['none', 'ninja', 'samurai', 'master', 'goat'] as const,
  
  // Confidence flags
  CONFIDENCE_FLAGS: ['none', 'yellow', 'red', 'green'] as const,
  
  // Intelligence feed layers
  CONTENT_LAYERS: ['standard', 'intelligence'] as const,
  
  // Raffle system
  RAFFLE_CONTRIBUTION_PER_SUBSCRIBER: 50, // cents ($0.50)
} as const;

export type Config = typeof config;

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  try {
    const env = envSchema.parse(process.env);
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
