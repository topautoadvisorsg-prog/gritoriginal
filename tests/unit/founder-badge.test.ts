import { describe, expect, it } from "vitest";
import {
  FOUNDER_BADGE_CAPACITY,
  FOUNDER_BADGE_LIMITS,
  createFounderSlotPlan,
} from "../../server/services/founderBadgeService";

describe("Founder badge slot planning (Blueprint §8)", () => {
  it("locks the founder badge capacity at the first 1,000 subscribers", () => {
    expect(FOUNDER_BADGE_CAPACITY).toBe(1000);
    expect(FOUNDER_BADGE_LIMITS).toEqual([
      { tier: 1, maxGlobalSlot: 10 },
      { tier: 2, maxGlobalSlot: 50 },
      { tier: 3, maxGlobalSlot: 500 },
      { tier: 4, maxGlobalSlot: 1000 },
    ]);
  });

  it("allocates Founder I to global slots 1 through 10", () => {
    expect(createFounderSlotPlan(0)).toEqual({ tier: 1, globalSlotNumber: 1 });
    expect(createFounderSlotPlan(9)).toEqual({ tier: 1, globalSlotNumber: 10 });
  });

  it("allocates Founder II to global slots 11 through 50", () => {
    expect(createFounderSlotPlan(10)).toEqual({ tier: 2, globalSlotNumber: 11 });
    expect(createFounderSlotPlan(49)).toEqual({ tier: 2, globalSlotNumber: 50 });
  });

  it("allocates Founder III to global slots 51 through 500", () => {
    expect(createFounderSlotPlan(50)).toEqual({ tier: 3, globalSlotNumber: 51 });
    expect(createFounderSlotPlan(499)).toEqual({ tier: 3, globalSlotNumber: 500 });
  });

  it("allocates Founder IV to global slots 501 through 1000", () => {
    expect(createFounderSlotPlan(500)).toEqual({ tier: 4, globalSlotNumber: 501 });
    expect(createFounderSlotPlan(999)).toEqual({ tier: 4, globalSlotNumber: 1000 });
  });

  it("returns sold-out planning once all founder slots are gone", () => {
    expect(createFounderSlotPlan(1000)).toBeNull();
    expect(createFounderSlotPlan(1001)).toBeNull();
  });
});
