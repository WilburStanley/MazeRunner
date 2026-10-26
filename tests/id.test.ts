import { describe, it, expect } from "vitest";
import { encodeId, parseId, randomSeed, SEED_MAX } from "@/lib/maze/id";

describe("maze id", () => {
  it("round-trips spec -> id -> spec", () => {
    for (const seed of [0, 1, 123456, SEED_MAX - 1, randomSeed()]) {
      const spec = { algorithm: "K" as const, size: 21, seed };
      expect(parseId(encodeId(spec))).toEqual(spec);
    }
  });

  it("produces the expected format", () => {
    expect(encodeId({ algorithm: "K", size: 21, seed: 7 * 32 ** 5 + 23 * 32 ** 4 + 29 * 32 ** 3 + 4 * 32 ** 2 + 13 * 32 + 2 }))
      .toBe("M1-K-21-7QX4D2-F");
  });

  it("accepts lowercase and surrounding spaces", () => {
    expect(parseId("  m1-k-21-7qx4d2-f ")).not.toBeNull();
  });

  it("rejects a tampered seed or checksum", () => {
    expect(parseId("M1-K-21-7QX4D3-F")).toBeNull();
    expect(parseId("M1-K-21-7QX4D2-G")).toBeNull();
  });

  it("rejects bad version, algorithm, size, seed", () => {
    expect(parseId("M2-K-21-7QX4D2-F")).toBeNull();
    expect(parseId("M1-X-21-7QX4D2-F")).toBeNull();
    expect(parseId("M1-K-4-7QX4D2-F")).toBeNull();
    expect(parseId("M1-K-99-7QX4D2-F")).toBeNull();
    expect(parseId("M1-K-021-7QX4D2-F")).toBeNull();
    expect(parseId("M1-K-21-7QX4D-F")).toBeNull();
    expect(parseId("M1-K-21-7QXLD2-F")).toBeNull(); // L not in alphabet
    expect(parseId("")).toBeNull();
  });
});