import { describe, expect, it } from "vitest";

import {
  buildActivityFeedItems,
  formatActivityCreatedAt,
  formatPickedFighterName,
  getPeerMemberIds,
  uniqueValues,
} from "../../server/services/activityFeedService";

describe("activity feed helpers", () => {
  it("deduplicates values while preserving first-seen order", () => {
    expect(uniqueValues(["g1", "g2", "g1", "g3"])).toEqual(["g1", "g2", "g3"]);
  });

  it("keeps only unique peer members and excludes the current user", () => {
    expect(getPeerMemberIds([
      { userId: "current" },
      { userId: "friend-a" },
      { userId: "friend-a" },
      { userId: "friend-b" },
    ], "current")).toEqual(["friend-a", "friend-b"]);
  });

  it("formats fighter names with graceful fallbacks", () => {
    expect(formatPickedFighterName({ id: "f1", firstName: "Alex", lastName: "Pereira" })).toBe('Alex "Pereira"');
    expect(formatPickedFighterName({ id: "f2", firstName: "  ", lastName: "Holloway" })).toBe("Holloway");
    expect(formatPickedFighterName(undefined)).toBe("Unknown Fighter");
  });

  it("normalizes createdAt for frontend time rendering", () => {
    expect(formatActivityCreatedAt(new Date("2026-05-23T00:00:00.000Z"))).toBe("2026-05-23T00:00:00.000Z");
    expect(formatActivityCreatedAt("2026-05-23T00:00:00.000Z")).toBe("2026-05-23T00:00:00.000Z");
    expect(formatActivityCreatedAt(null)).toBe("1970-01-01T00:00:00.000Z");
  });

  it("builds feed items from preloaded lookup maps", () => {
    const items = buildActivityFeedItems(
      [{
        id: "pick-1",
        userId: "friend-a",
        fightId: "fight-1",
        pickedFighterId: "fighter-1",
        pickedMethod: "KO/TKO",
        pickedRound: 2,
        units: 1,
        createdAt: "2026-05-23T00:00:00.000Z",
      }],
      new Map([["fighter-1", { id: "fighter-1", firstName: "Alex", lastName: "Pereira" }]]),
      new Map([["fight-1", { id: "fight-1", eventId: "event-1" }]]),
      new Map([["event-1", { id: "event-1", name: "GRIT 001" }]]),
    );

    expect(items).toEqual([{
      id: "pick-1",
      userId: "friend-a",
      fightId: "fight-1",
      pickedFighterName: 'Alex "Pereira"',
      pickedMethod: "KO/TKO",
      pickedRound: 2,
      units: 1,
      eventName: "GRIT 001",
      createdAt: "2026-05-23T00:00:00.000Z",
    }]);
  });

  it("falls back when fight, event, or fighter details are missing", () => {
    const [item] = buildActivityFeedItems(
      [{
        id: "pick-2",
        userId: "friend-b",
        fightId: "missing-fight",
        pickedFighterId: "missing-fighter",
        pickedMethod: null,
        pickedRound: null,
        units: null,
        createdAt: null,
      }],
      new Map(),
      new Map(),
      new Map(),
    );

    expect(item.pickedFighterName).toBe("Unknown Fighter");
    expect(item.pickedMethod).toBe("Moneyline");
    expect(item.units).toBe(1);
    expect(item.eventName).toBe("Unknown Event");
    expect(item.createdAt).toBe("1970-01-01T00:00:00.000Z");
  });
});
