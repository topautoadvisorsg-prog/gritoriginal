import { describe, expect, it } from "vitest";
import { flagRows, participationRows, rulesSectionTitles, rulesSections } from "../../src/user/pages/rulesContent";

describe("rules reference content", () => {
  it("covers every blueprint rules tab section", () => {
    expect(rulesSectionTitles).toEqual(
      expect.arrayContaining([
        "Picks",
        "Odds and Units",
        "Participation",
        "Stars and Badges",
        "Keys",
        "Founder Badges",
        "Monthly Bonus",
        "Raffle",
        "Creator Economy",
        "AI Tokens",
        "Live Fighter Rating",
        "Chat and Slips",
        "Notifications",
      ]),
    );
  });

  it("keeps the fixed participation table intact", () => {
    expect(participationRows).toHaveLength(8);
    expect(participationRows[0]).toEqual({
      cardSize: "17 fights",
      minimumPicks: "13 picks",
      flagBudget: "4 flags",
    });
    expect(participationRows.at(-1)).toEqual({
      cardSize: "10 fights",
      minimumPicks: "8 picks",
      flagBudget: "2 flags",
    });
  });

  it("documents the four flag states", () => {
    expect(flagRows.map((flag) => flag.label)).toEqual(["No flag", "Green", "Yellow", "Red"]);
    expect(rulesSections.every((section) => section.items.length > 0)).toBe(true);
  });
});

