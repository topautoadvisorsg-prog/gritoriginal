export const EVENT_STATUSES = [
  'Upcoming',
  'Live',
  'Completed',
  'Closed',
  'Archived',
  'Postponed',
  'Cancelled',
] as const;

export type EventStatus = typeof EVENT_STATUSES[number];
export type LegacyEventStatus = 'draft' | 'ready';

export const EVENT_STATUS_TRANSITIONS: Readonly<Record<EventStatus, readonly EventStatus[]>> = {
  Upcoming: ['Live', 'Cancelled', 'Postponed'],
  Live: ['Completed', 'Cancelled'],
  Completed: ['Closed'],
  Closed: ['Archived'],
  Archived: [],
  Postponed: ['Upcoming', 'Cancelled'],
  Cancelled: [],
};

const LEGACY_STATUS_TRANSITIONS: Readonly<Record<LegacyEventStatus, readonly EventStatus[]>> = {
  draft: ['Upcoming'],
  // `ready` did not identify a lifecycle position. Classify it during a reviewed migration,
  // never through the side-effecting lifecycle endpoint.
  ready: [],
};

export function allowedEventStatusTransitions(status: string): readonly EventStatus[] {
  if (status === 'draft' || status === 'ready') return LEGACY_STATUS_TRANSITIONS[status];
  return EVENT_STATUS_TRANSITIONS[status as EventStatus] ?? [];
}

export function canTransitionEventStatus(current: string, next: EventStatus): boolean {
  return allowedEventStatusTransitions(current).includes(next);
}

export function normalizeInboundEventStatus(status: unknown): unknown {
  if (typeof status !== 'string') return status;
  const aliases: Record<string, EventStatus> = {
    OPEN: 'Upcoming',
    LIVE: 'Live',
    CLOSED: 'Closed',
    ARCHIVED: 'Archived',
  };
  return aliases[status] ?? status;
}
