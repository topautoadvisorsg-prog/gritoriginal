import { describe, expect, it } from "vitest";
import { parseFightLockTime } from "../../server/utils/fightLockTime";

describe("fight lock time parsing", () => {
  it("defaults timezone-less scheduled fight times to UTC", () => {
    const lockTime = parseFightLockTime("2026-03-15", "7:00 PM", 10);

    expect(lockTime?.toISOString()).toBe("2026-03-15T18:50:00.000Z");
  });

  it("parses explicit UTC suffixes", () => {
    const lockTime = parseFightLockTime("2026-03-15", "12:00 AM UTC", 10);

    expect(lockTime?.toISOString()).toBe("2026-03-14T23:50:00.000Z");
  });

  it("parses explicit numeric offsets", () => {
    const lockTime = parseFightLockTime("2026-03-15", "7:00 PM -05:00", 10);

    expect(lockTime?.toISOString()).toBe("2026-03-15T23:50:00.000Z");
  });

  it("keeps legacy PST/PDT abbreviation support for existing admin-created cards", () => {
    expect(parseFightLockTime("2026-03-15", "7:00 PM PST", 10)?.toISOString()).toBe("2026-03-16T02:50:00.000Z");
    expect(parseFightLockTime("2026-03-15", "7:00 PM PDT", 10)?.toISOString()).toBe("2026-03-16T01:50:00.000Z");
  });

  it("returns null for malformed times instead of guessing", () => {
    expect(parseFightLockTime("2026-03-15", "tonight-ish", 10)).toBeNull();
    expect(parseFightLockTime("2026-03-15", "25:00 PM UTC", 10)).toBeNull();
  });
});
