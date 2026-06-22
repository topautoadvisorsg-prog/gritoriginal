import { z } from 'zod';

export const SNAPSHOT_TYPES = ['event', 'monthly', 'yearly'] as const;
export const PERIOD_SNAPSHOT_TYPES = ['monthly', 'yearly'] as const;

export type SnapshotType = typeof SNAPSHOT_TYPES[number];
export type PeriodSnapshotType = typeof PERIOD_SNAPSHOT_TYPES[number];

export const snapshotTypeSchema = z.enum(SNAPSHOT_TYPES);
export const periodSnapshotTypeSchema = z.enum(PERIOD_SNAPSHOT_TYPES);
export const eventIdSchema = z.string().uuid();

export const snapshotHistoryQuerySchema = z.object({
  type: snapshotTypeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const snapshotCreationSchema = z.object({
  type: snapshotTypeSchema.default('monthly'),
  eventId: eventIdSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
}).superRefine((value, ctx) => {
  if (value.type === 'event' && !value.eventId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['eventId'], message: 'eventId is required for event snapshots' });
  }
  if (value.type === 'event' && (value.startDate || value.endDate)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['startDate'], message: 'event snapshots cannot include period boundaries' });
  }
  if (value.type !== 'event' && value.eventId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['eventId'], message: 'period snapshots cannot include eventId' });
  }
  if ((value.startDate && !value.endDate) || (!value.startDate && value.endDate)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['startDate'], message: 'startDate and endDate must be supplied together' });
  }
  if (value.startDate && value.endDate && new Date(value.startDate) >= new Date(value.endDate)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'endDate must be after startDate' });
  }
});

export const automaticSnapshotCreationSchema = z.object({
  type: snapshotTypeSchema.default('monthly'),
  eventId: eventIdSchema.optional(),
}).superRefine((value, ctx) => {
  if (value.type === 'event' && !value.eventId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['eventId'], message: 'eventId is required for event snapshots' });
  }
  if (value.type !== 'event' && value.eventId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['eventId'], message: 'period snapshots cannot include eventId' });
  }
});
