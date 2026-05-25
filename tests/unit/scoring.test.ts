import { describe, expect, it } from "vitest";
import { calculateNetUnitScore, calculateNetUnits } from "../../server/services/scoringService";

describe("moneyline net-unit scoring (Blueprint §7)", () => {
  const fighterA = "fighter-a-uuid";
  const fighterB = "fighter-b-uuid";

  it("refunds Draw / No Contest outcomes to 0 units", () => {
    const pick = { pickedFighterId: fighterA, lockedOdds: "+200", units: 1 };

    expect(calculateNetUnits(pick, { winnerId: null })).toBe(0);
    expect(calculateNetUnits(pick, { winnerId: "draw" })).toBe(0);
    expect(calculateNetUnits(pick, { winnerId: "no_contest" })).toBe(0);
  });

  it("scores underdog wins from locked American odds", () => {
    const pick = { pickedFighterId: fighterA, lockedOdds: "+150", units: 1 };

    expect(calculateNetUnits(pick, { winnerId: fighterA })).toBe(1.5);
  });

  it("scores favorite wins from locked American odds", () => {
    const pick = { pickedFighterId: fighterA, lockedOdds: "-200", units: 1 };

    expect(calculateNetUnits(pick, { winnerId: fighterA })).toBe(0.5);
  });

  it("scores losses as negative risked units", () => {
    const pick = { pickedFighterId: fighterA, lockedOdds: "+300", units: 1 };

    expect(calculateNetUnits(pick, { winnerId: fighterB })).toBe(-1);
  });

  it("ignores method and round for competitive scoring", () => {
    const basePick = { pickedFighterId: fighterA, lockedOdds: "+120", units: 1 };
    const result = { winnerId: fighterA };

    expect(calculateNetUnits({ ...basePick, pickedMethod: "KO/TKO", pickedRound: 1 }, result)).toBe(1.2);
    expect(calculateNetUnits({ ...basePick, pickedMethod: "Decision", pickedRound: 3 }, result)).toBe(1.2);
    expect(calculateNetUnits({ ...basePick, pickedMethod: "Submission", pickedRound: 5 }, result)).toBe(1.2);
  });

  it("supports multi-unit picks even though current UI defaults to 1 unit", () => {
    const pick = { pickedFighterId: fighterA, lockedOdds: "+125", units: 2 };

    expect(calculateNetUnits(pick, { winnerId: fighterA })).toBe(2.5);
    expect(calculateNetUnits(pick, { winnerId: fighterB })).toBe(-2);
  });

  it("stores net units as hundredths until points_awarded is renamed/migrated", () => {
    expect(calculateNetUnitScore({ pickedFighterId: fighterA, lockedOdds: "+150", units: 1 }, { winnerId: fighterA })).toBe(150);
    expect(calculateNetUnitScore({ pickedFighterId: fighterA, lockedOdds: "-200", units: 1 }, { winnerId: fighterA })).toBe(50);
    expect(calculateNetUnitScore({ pickedFighterId: fighterA, lockedOdds: "+150", units: 1 }, { winnerId: fighterB })).toBe(-100);
  });
});
