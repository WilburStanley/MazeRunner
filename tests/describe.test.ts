import { describe, it, expect } from "vitest";
import { ALGORITHM_INFO, describeSpec } from "../src/lib/maze/describe";
import { ALGORITHMS } from "../src/lib/maze/id";

describe("describeSpec", () => {
  it("names the size and algorithm", () => {
    expect(describeSpec({ algorithm: "K", size: 21, seed: 1 })).toBe("21 × 21 · Kruskal");
    expect(describeSpec({ algorithm: "B", size: 11, seed: 1 })).toBe("11 × 11 · Binary Tree");
  });

  it("has a name and a note for every algorithm", () => {
    for (const algorithm of ALGORITHMS) {
      expect(ALGORITHM_INFO[algorithm].name.length).toBeGreaterThan(0);
      expect(ALGORITHM_INFO[algorithm].note.length).toBeGreaterThan(0);
    }
  });
});