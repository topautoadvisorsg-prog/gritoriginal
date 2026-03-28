import { z } from 'zod';

// We explicitly type the response matching the existing backend payload
// This acts as our source of truth and validation layer.

export const EventFightSchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid(),
  fighter1Id: z.string().uuid(),
  fighter2Id: z.string().uuid(),
  cardPlacement: z.string(),
  boutOrder: z.number(),
  weightClass: z.string(),
  isTitleFight: z.boolean(),
  rounds: z.number(),
  status: z.string(),
  scheduledTime: z.string().nullable().optional(),
});

export const EventResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  date: z.string(),
  venue: z.string(),
  city: z.string(),
  state: z.string().nullable().optional(),
  country: z.string(),
  organization: z.string(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  status: z.string(),
  fights: z.array(EventFightSchema).default([]),
});

export const PickResponseSchema = z.any(); // Extendable in the future for pick objects

export type ApiEventResponse = z.infer<typeof EventResponseSchema>;
export type ApiEventFight = z.infer<typeof EventFightSchema>;
