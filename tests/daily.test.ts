import { describe, it, expect } from "vitest";
import { getDailyDateKey, getDailyId, getDailySpec } from "../src/lib/maze/daily";
import { parseId } from "../src/lib/maze/id";

describe("daily maze", () => {
  it("uses the UTC calendar date as the key", () => {
    expect(getDailyDateKey(new Date("2026-10-27T23:59:59Z"))).toBe("2026-10-27");
    expect(getDailyDateKey(new Date("2026-10-28T00:00:00Z"))).toBe("2026-10-28");
  });

  it("gives the same id for the whole UTC day", () => {
    const morning = getDailyId(new Date("2026-10-27T00:00:01Z"));
    const night = getDailyId(new Date("2026-10-27T23:59:59Z"));
    expect(morning).toBe(night);
  });

  it("changes from one day to the next", () => {
    const today = getDailyId(new Date("2026-10-27T12:00:00Z"));
    const tomorrow = getDailyId(new Date("2026-10-28T12:00:00Z"));
    expect(today).not.toBe(tomorrow);
  });

  it("always produces a valid id for a full year of dates", () => {
    for (let dayOffset = 0; dayOffset < 365; dayOffset++) {
      const date = new Date(Date.UTC(2026, 0, 1 + dayOffset, 12));
      expect(parseId(getDailyId(date))).toEqual(getDailySpec(date));
    }
  });
});