import { z } from 'zod';
import { EVENT_STATUSES } from '../../shared/models/eventLifecycle';
export { createPickRequestSchema as createPickSchema } from '../../shared/models/auth';

export const updateProfileSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  bio: z.string().max(500).optional(),
  style: z.string().max(50).optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  language: z.string().max(10).optional(),
  fightingOutOf: z.string().max(200).optional(),
  socialLinks: z.object({
    twitter: z.string().url().or(z.literal('')).optional(),
    instagram: z.string().url().or(z.literal('')).optional(),
    tiktok: z.string().url().or(z.literal('')).optional(),
  }).optional(),
  privacySettings: z.object({
    showAvatar: z.boolean().optional(),
    showSocialLinks: z.boolean().optional(),
    showUsername: z.boolean().optional(),
  }).optional(),
  aiPreferences: z.object({
    enabled: z.boolean().optional(),
  }).optional(),
}).passthrough();

export const updateEventSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  date: z.string().optional(),
  venue: z.string().min(1).max(255).optional(),
  city: z.string().min(1).max(255).optional(),
  state: z.string().max(100).nullable().optional(),
  country: z.string().min(1).max(100).optional(),
  organization: z.string().min(1).max(50).optional(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  fights: z.array(z.any()).optional(),
}).strict();

export const updateEventStatusSchema = z.object({
  status: z.enum(EVENT_STATUSES),
});

export const createNewsSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().min(1),
  category: z.string().optional(),
  imageUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  fighterId: z.string().optional(),
  layer: z.enum(['standard', 'intelligence']).optional().default('standard'),
}).passthrough();

export const chatMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().optional(),
});

export const reportUserSchema = z.object({
  reason: z.string().min(1).max(500),
  category: z.string().optional(),
});

export const changeRoleSchema = z.object({
  role: z.string().min(1),
});

export const bulkFightersSchema = z.object({
  fighters: z.array(z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
  }).passthrough()),
  mode: z.enum(['add', 'replace']).optional(),
});

export const bulkFightsSchema = z.object({
  fights: z.array(z.any()).min(1),
  mode: z.enum(['add', 'replace']).optional(),
});

export const muteUserSchema = z.object({
  duration: z.number().int().positive().optional(),
  reason: z.string().max(500).optional(),
});

export const createCheckoutSessionSchema = z.object({
  priceId: z.string().min(1),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export const unlockBadgeSchema = z.object({
  badgeId: z.string().min(1),
});
