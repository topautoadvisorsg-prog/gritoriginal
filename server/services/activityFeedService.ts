export type ActivityFeedPick = {
  id: string;
  userId: string;
  fightId: string;
  pickedFighterId: string;
  pickedMethod: string | null;
  pickedRound: number | null;
  units: number | null;
  createdAt: Date | string | null;
};

export type ActivityFeedFighter = {
  id: string;
  firstName: string | null;
  lastName: string | null;
};

export type ActivityFeedFight = {
  id: string;
  eventId: string | null;
};

export type ActivityFeedEvent = {
  id: string;
  name: string | null;
};

export function uniqueValues<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function getPeerMemberIds(members: { userId: string }[], currentUserId: string): string[] {
  return uniqueValues(
    members
      .map(member => member.userId)
      .filter(userId => userId !== currentUserId)
  );
}

export function formatPickedFighterName(fighter: ActivityFeedFighter | undefined): string {
  if (!fighter) return 'Unknown Fighter';

  const firstName = fighter.firstName?.trim();
  const lastName = fighter.lastName?.trim();

  if (firstName && lastName) return `${firstName} "${lastName}"`;
  return firstName || lastName || 'Unknown Fighter';
}

export function formatActivityCreatedAt(createdAt: Date | string | null): string {
  if (createdAt instanceof Date) return createdAt.toISOString();
  return createdAt || new Date(0).toISOString();
}

export function buildActivityFeedItems(
  picks: ActivityFeedPick[],
  fightersById: Map<string, ActivityFeedFighter>,
  fightsById: Map<string, ActivityFeedFight>,
  eventsById: Map<string, ActivityFeedEvent>,
) {
  return picks.map((pick) => {
    const fight = fightsById.get(pick.fightId);
    const event = fight?.eventId ? eventsById.get(fight.eventId) : undefined;

    return {
      id: pick.id,
      userId: pick.userId,
      fightId: pick.fightId,
      pickedFighterName: formatPickedFighterName(fightersById.get(pick.pickedFighterId)),
      pickedMethod: pick.pickedMethod || 'Moneyline',
      pickedRound: pick.pickedRound,
      units: pick.units ?? 1,
      eventName: event?.name || 'Unknown Event',
      createdAt: formatActivityCreatedAt(pick.createdAt),
    };
  });
}
