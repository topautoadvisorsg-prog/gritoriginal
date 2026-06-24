import { useQuery } from '@tanstack/react-query';
import { typedFetch } from '../api/client';
import { EventResponseSchema, PickResponseSchema, ApiEventResponse } from '../api/schemas';
import { z } from 'zod';
import { Event } from '@/shared/types/fighter';

/**
 * Custom hook encapsulating event data fetching and adapter logic.
 * Ensures the UI components remain completely naive to network layers.
 */
export function useEventData(eventId?: string) {
  const eventQuery = useQuery({
    queryKey: ['/api/events', eventId],
    queryFn: async () => {
      const data = await typedFetch(`/api/events/${eventId}`, EventResponseSchema);
      return adaptEventForUI(data);
    },
    enabled: !!eventId,
  });

  const picksQuery = useQuery({
    queryKey: ['/api/picks/event', eventId],
    queryFn: () => typedFetch(`/api/picks/event/${eventId}`, z.array(PickResponseSchema)),
    enabled: !!eventId,
  });

  return {
    event: eventQuery.data,
    isLoading: eventQuery.isLoading || picksQuery.isLoading,
    isError: eventQuery.isError,
    picks: picksQuery.data || [],
  };
}

/**
 * Transforms raw API layout into the standardized internal Event type.
 */
function adaptEventForUI(backendEvent: ApiEventResponse): Event {
  return {
    id: backendEvent.id,
    name: backendEvent.name,
    date: backendEvent.date,
    venue: backendEvent.venue,
    city: backendEvent.city,
    state: backendEvent.state || undefined,
    country: backendEvent.country,
    organization: backendEvent.organization,
    description: backendEvent.description || undefined,
    imageUrl: backendEvent.imageUrl || undefined,
    location: {
      city: backendEvent.city,
      state: backendEvent.state || undefined,
      country: backendEvent.country,
      venue: backendEvent.venue,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    status: backendEvent.status as any,
    fights: backendEvent.fights.map(f => ({
      id: f.id,
      eventId: f.eventId,
      fighter1Id: f.fighter1Id,
      fighter2Id: f.fighter2Id,
      cardPlacement: f.cardPlacement,
      boutOrder: f.boutOrder,
      weightClass: f.weightClass,
      isTitleFight: f.isTitleFight,
      rounds: f.rounds,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      status: f.status as any,
      scheduledTime: f.scheduledTime || undefined,
    })),
  };
}
