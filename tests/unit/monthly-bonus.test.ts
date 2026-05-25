import { describe, expect, it } from "vitest";
import {
  MONTHLY_BONUS_TOTAL_CENTS,
  getMonthlyBonusTotal,
  isMonthlyBonusEligibleTier,
  selectMonthlyBonusWinners,
  type MonthlyBonusCandidate,
} from "../../server/services/monthlyBonusService";

const candidates: MonthlyBonusCandidate[] = [
  { userId: "a", tier: "challenger", netUnits: 12, qualifiedEventCount: 2, earliestFullCardLockAt: "2026-05-01T00:00:00Z" },
  { userId: "b", tier: "challenger", netUnits: 8, qualifiedEventCount: 3, earliestFullCardLockAt: "2026-05-02T00:00:00Z" },
  { userId: "c", tier: "challenger", netUnits: 6, qualifiedEventCount: 2, earliestFullCardLockAt: "2026-05-03T00:00:00Z" },
  { userId: "d", tier: "challenger", netUnits: 5, qualifiedEventCount: 1 },
  { userId: "e", tier: "challenger", netUnits: -2, qualifiedEventCount: 1 },
  { userId: "f", tier: "free", netUnits: 100, qualifiedEventCount: 4 },
];

describe("monthly bonus draw (Blueprint §7 / §41)", () => {
  it("keeps the fixed $550 pool", () => {
    expect(MONTHLY_BONUS_TOTAL_CENTS).toBe(55000);
  });

  it("treats current premium/medium and future challenger tiers as eligible", () => {
    expect(isMonthlyBonusEligibleTier("challenger")).toBe(true);
    expect(isMonthlyBonusEligibleTier("premium")).toBe(true);
    expect(isMonthlyBonusEligibleTier("medium")).toBe(true);
    expect(isMonthlyBonusEligibleTier("free")).toBe(false);
  });

  it("selects top 3 ROI winners from users qualified for at least 2 events", () => {
    const winners = selectMonthlyBonusWinners(candidates, () => 0);

    expect(winners.slice(0, 3)).toMatchObject([
      { userId: "a", prizeCents: 30000, reason: "top_roi_1" },
      { userId: "b", prizeCents: 10000, reason: "top_roi_2" },
      { userId: "c", prizeCents: 5000, reason: "top_roi_3" },
    ]);
  });

  it("excludes free users even if their ROI is highest", () => {
    const winners = selectMonthlyBonusWinners(candidates, () => 0);

    expect(winners.map((winner) => winner.userId)).not.toContain("f");
  });

  it("draws 2 random qualified users from the non-top-3 pool", () => {
    const winners = selectMonthlyBonusWinners(candidates, () => 0);

    expect(winners.slice(3)).toMatchObject([
      { userId: "d", prizeCents: 5000, reason: "random_qualified" },
      { userId: "e", prizeCents: 5000, reason: "random_qualified" },
    ]);
    expect(getMonthlyBonusTotal(winners)).toBe(MONTHLY_BONUS_TOTAL_CENTS);
  });

  it("uses earliest full-card lock as the top-ROI tiebreaker", () => {
    const winners = selectMonthlyBonusWinners([
      { userId: "late", tier: "challenger", netUnits: 10, qualifiedEventCount: 2, earliestFullCardLockAt: "2026-05-03T00:00:00Z" },
      { userId: "early", tier: "challenger", netUnits: 10, qualifiedEventCount: 2, earliestFullCardLockAt: "2026-05-01T00:00:00Z" },
    ]);

    expect(winners[0]).toMatchObject({ userId: "early", prizeCents: 30000 });
    expect(winners[1]).toMatchObject({ userId: "late", prizeCents: 10000 });
  });
});
