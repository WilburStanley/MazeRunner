import { describe, it, expect } from "vitest";
import { formatDuration } from "../src/lib/format";

describe("formatDuration", () => {
  it("formats minutes, seconds and tenths", () => {
    expect(formatDuration(0)).toBe("00:00.0");
    expect(formatDuration(61_234)).toBe("01:01.2");
    expect(formatDuration(599_999)).toBe("09:59.9");
  });

  it("clamps negative durations to zero", () => {
    expect(formatDuration(-500)).toBe("00:00.0");
  });
});