import { describe, it, expect } from "vitest";
import { mulberry32, shuffleInPlace } from "../src/lib/maze/prng";

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

  it("shuffles repeatably and keeps every item", () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8];
    const firstShuffle = [...original];
    const secondShuffle = [...original];
    shuffleInPlace(firstShuffle, mulberry32(99));
    shuffleInPlace(secondShuffle, mulberry32(99));
    expect(firstShuffle).toEqual(secondShuffle);
    expect([...firstShuffle].sort()).toEqual(original);
  });
});