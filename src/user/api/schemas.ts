import { z } from 'zod';

// We explicitly type the response matching the existing backend payload
// This acts as our source of truth and validation layer.

export const EventFightSchema = z.object({
  // IDs are opaque API identifiers. Production currently uses UUIDs, while
  // isolated fixtures and future providers may use stable namespaced IDs.
  id: z.string().min(1),
  eventId: z.string().min(1),
  fighter1Id: z.string().min(1),
  fighter2Id: z.string().min(1),
  cardPlacement: z.string(),
  boutOrder: z.number(),
  weightClass: z.string(),
  isTitleFight: z.boolean(),
  rounds: z.number(),
  status: z.string(),
  scheduledTime: z.string().nullable().optional(),
});

export const EventResponseSchema = z.object({
  id: z.string().min(1),
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
