import { describe, expect, it } from 'vitest';
import {
  allowedEventStatusTransitions,
  canTransitionEventStatus,
  normalizeInboundEventStatus,
} from '../../shared/models/eventLifecycle';
import { updateEventSchema, updateEventStatusSchema } from '../../server/schemas';
import { syncEventSchema } from '../../shared/sync-schemas';

describe('canonical event lifecycle', () => {
  it('allows only declared lifecycle transitions', () => {
    expect(allowedEventStatusTransitions('Upcoming')).toEqual(['Live', 'Cancelled', 'Postponed']);
    expect(canTransitionEventStatus('Live', 'Completed')).toBe(true);
    expect(canTransitionEventStatus('Live', 'Closed')).toBe(false);
    expect(allowedEventStatusTransitions('Archived')).toEqual([]);
  });

  it('requires explicit classification of legacy statuses', () => {
    expect(allowedEventStatusTransitions('draft')).toEqual(['Upcoming']);
    expect(allowedEventStatusTransitions('ready')).toEqual([]);
  });

  it('validates canonical status requests and rejects legacy targets', () => {
    expect(updateEventStatusSchema.safeParse({ status: 'Closed' }).success).toBe(true);
    expect(updateEventStatusSchema.safeParse({ status: 'ready' }).success).toBe(false);
  });

  it('prevents general event updates from bypassing the transition endpoint', () => {
    expect(updateEventSchema.safeParse({ name: 'Updated', status: 'Closed' }).success).toBe(false);
  });

  it.each([
    ['OPEN', 'Upcoming'],
    ['LIVE', 'Live'],
    ['CLOSED', 'Closed'],
    ['ARCHIVED', 'Archived'],
  ])('normalizes inbound alias %s', (input, expected) => {
    expect(normalizeInboundEventStatus(input)).toBe(expected);
  });

  it('stores a canonical status from the data-engine contract', () => {
    const parsed = syncEventSchema.parse({
      name: 'Test Event',
      date: new Date().toISOString(),
      venue: 'Test Venue',
      city: 'Test City',
      country: 'US',
      status: 'OPEN',
    });
    expect(parsed.status).toBe('Upcoming');
  });
});
