import { describe, it, expect } from "vitest";
import { mulberry32 } from "../src/lib/maze/prng";

describe("mulberry32", () => {
  it("is deterministic for the same seed", () => {
    const firstGenerator = mulberry32(42);
    const secondGenerator = mulberry32(42);
    for (let draw = 0; draw < 100; draw++) {
      expect(firstGenerator()).toBe(secondGenerator());
    }
  });

  it("differs for different seeds", () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });

  it("stays in [0, 1)", () => {
    const nextRandom = mulberry32(7);
    for (let draw = 0; draw < 1000; draw++) {
      const value = nextRandom();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});