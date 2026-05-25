import { describe, expect, it } from "vitest";

import { pointsAwardedToMoney, pointsAwardedToNetUnits } from "../../server/utils/netUnits";

describe("net unit display helpers", () => {
  it("converts stored hundredths into net units", () => {
    expect(pointsAwardedToNetUnits(250)).toBe(2.5);
    expect(pointsAwardedToNetUnits(-175)).toBe(-1.75);
  });

  it("treats nullish stored scores as unresolved zero profit", () => {
    expect(pointsAwardedToNetUnits(null)).toBe(0);
    expect(pointsAwardedToNetUnits(undefined)).toBe(0);
  });

  it("converts stored hundredths into betting tracker money", () => {
    expect(pointsAwardedToMoney(125, 20)).toBe(25);
    expect(pointsAwardedToMoney(-100, 50)).toBe(-50);
  });
});
